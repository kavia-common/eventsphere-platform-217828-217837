import mongoose from 'mongoose';
import { PubSub } from 'graphql-subscriptions';
import { User, Event, Registration, Message } from '../models/index.js';
import { comparePassword, hashPassword, signToken } from '../utils/auth.js';
import { errors as Err } from '../utils/errors.js';

const pubsub = new PubSub();
const TOPICS = {
  EVENT_UPDATED: 'EVENT_UPDATED',
  MESSAGE_ADDED: 'MESSAGE_ADDED',
};

/**
 * PUBLIC_INTERFACE
 * Expose PubSub instance for WS context and testing.
 */
export function getPubSub() {
  return pubsub;
}

/**
 * PUBLIC_INTERFACE
 * Build GraphQL resolvers object. Uses models via direct imports and current user injected in context.
 * Ensures JWT utils are used and mutations enforce owner/admin RBAC.
 */
export const createResolvers = () => ({
  Query: {
    me: async (_p, _a, ctx) => ctx.user || null,

    events: async (_p, args, ctx) => {
      const { query, type, afterDate, limit = 24, offset = 0 } = args;
      const filter = {};
      if (type) filter.type = type;
      if (afterDate) {
        const d = new Date(afterDate);
        if (!Number.isNaN(d.getTime())) {
          filter.$or = [{ date: { $gte: d } }, { startDate: { $gte: d } }];
        }
      }
      if (query) {
        filter.$text = { $search: query };
      }
      const docs = await Event.find(filter)
        .sort({ date: 1, startDate: 1, createdAt: -1 })
        .skip(offset)
        .limit(Math.min(limit, 100))
        .lean();

      const ids = docs.map((d) => d._id);
      const organizerIds = docs.map((d) => String(d.organizer));
      // Batch attendees count via aggregation (kept), and load organizers via DataLoader
      const [counts, organizers] = await Promise.all([
        Registration.aggregate([
          { $match: { event: { $in: ids } } },
          { $group: { _id: '$event', c: { $sum: 1 } } },
        ]),
        Promise.all(organizerIds.map((id) => ctx.loaders.userById.load(id))),
      ]);
      const countMap = new Map(counts.map((c) => [String(c._id), c.c]));
      let myRegsMap = new Map();
      if (ctx.user) {
        const myRegs = await Registration.find({ event: { $in: ids }, user: ctx.user.id }).lean();
        myRegsMap = new Map(myRegs.map((r) => [String(r.event), r.status]));
      }
      return docs.map((d, idx) => {
        const organizerDoc = organizers[idx] || { _id: d.organizer };
        return {
          id: d._id.toString(),
          ...mapEventDoc({ ...d, organizer: organizerDoc }),
          attendeesCount: countMap.get(String(d._id)) || 0,
          myRsvp: myRegsMap.get(String(d._id)) || null,
        };
      });
    },

    event: async (_p, { id }, ctx) => {
      if (!mongoose.isValidObjectId(id)) return null;
      const doc = await Event.findById(id).lean();
      if (!doc) return null;

      const [organizer, attendeesCount, myReg] = await Promise.all([
        ctx.loaders.userById.load(String(doc.organizer)),
        Registration.countDocuments({ event: doc._id }),
        ctx.user
          ? Registration.findOne({ event: doc._id, user: ctx.user.id }).lean()
          : Promise.resolve(null),
      ]);

      return {
        id: doc._id.toString(),
        ...mapEventDoc({ ...doc, organizer }),
        attendeesCount,
        myRsvp: myReg?.status || null,
      };
    },

    dashboardSummary: async () => {
      const [totalEvents, totalRegistrations, activeUsersDocs, recentEventsDocs] = await Promise.all([
        Event.countDocuments(),
        Registration.countDocuments(),
        User.find().limit(10).lean(),
        Event.find().sort({ createdAt: -1 }).limit(6).populate('organizer').lean(),
      ]);
      return {
        totalEvents,
        totalRegistrations,
        revenue: Math.floor(totalRegistrations * 20),
        activeUsers: activeUsersDocs.length,
        recentEvents: recentEventsDocs.map((d) => ({
          id: d._id.toString(),
          ...mapEventDoc(d),
        })),
      };
    },

    // For legacy consumers; chat list still uses populate; optimized version provided in sendMessage flow
    chatMessages: async (_p, { roomId, limit = 50, offset = 0 }, ctx) => {
      const msgs = await Message.find({ roomId })
        .sort({ createdAt: 1 })
        .skip(offset)
        .limit(Math.min(limit, 100))
        .lean();

      // Batch fetch users and events
      const userIds = msgs.map((m) => String(m.user));
      const eventIds = msgs.map((m) => (m.event ? String(m.event) : null));

      const [users, events] = await Promise.all([
        Promise.all(userIds.map((id) => ctx.loaders.userById.load(id))),
        Promise.all(eventIds.map((id) => (id ? ctx.loaders.eventById.load(id) : Promise.resolve(null)))),
      ]);

      const enriched = msgs.map((m, idx) => {
        const user = users[idx] || { _id: m.user };
        const event = events[idx] || (m.event ? { _id: m.event } : null);
        return mapMessageDoc({ ...m, user, event });
      });

      return enriched;
    },
  },

  Mutation: {
    createEvent: async (_p, { input }, ctx) => {
      requireAuth(ctx);
      const payload = {
        ...input,
        date: input.date ? new Date(input.date) : undefined,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        organizer: ctx.user.id,
      };
      const doc = await Event.create(payload);
      const organizer = await ctx.loaders.userById.load(String(ctx.user.id));
      const mapped = {
        id: doc._id.toString(),
        ...mapEventDoc({ ...doc.toObject(), organizer }),
        attendeesCount: 0,
        myRsvp: null,
      };

      // Publish event created
      const emitter = ctx?.pubsub || pubsub;
      await emitter.publish(TOPICS.EVENT_UPDATED, {
        eventUpdated: {
          action: 'created',
          id: mapped.id,
          event: {
            ...mapped,
          },
        },
      });

      return mapped;
    },

    updateEvent: async (_p, { id, input }, ctx) => {
      requireAuth(ctx);
      if (!mongoose.isValidObjectId(id)) throw Err.badRequest('Invalid event id');

      const existing = await Event.findById(id).lean();
      if (!existing) throw Err.notFound('Event');
      if (String(existing.organizer) !== ctx.user.id && ctx.user.role !== 'admin') {
        throw Err.forbidden('Not authorized to update this event');
      }

      const updates = { ...input };
      if (updates.date) updates.date = new Date(updates.date);
      if (updates.startDate) updates.startDate = new Date(updates.startDate);
      if (updates.endDate) updates.endDate = new Date(updates.endDate);

      const updated = await Event.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
      if (!updated) throw Err.notFound('Event');

      const [organizer, attendeesCount, myReg] = await Promise.all([
        ctx.loaders.userById.load(String(updated.organizer)),
        Registration.countDocuments({ event: updated._id }),
        ctx.user
          ? Registration.findOne({ event: updated._id, user: ctx.user.id }).lean()
          : Promise.resolve(null),
      ]);

      // Publish event updated
      const emitter = ctx?.pubsub || pubsub;
      await emitter.publish(TOPICS.EVENT_UPDATED, {
        eventUpdated: {
          action: 'updated',
          id: updated._id.toString(),
          event: {
            id: updated._id.toString(),
            ...mapEventDoc({ ...updated, organizer }),
            attendeesCount,
            myRsvp: myReg?.status || null,
          },
        },
      });

      return {
        id: updated._id.toString(),
        ...mapEventDoc({ ...updated, organizer }),
        attendeesCount,
        myRsvp: myReg?.status || null,
      };
    },

    deleteEvent: async (_p, { id }, ctx) => {
      requireAuth(ctx);
      if (!mongoose.isValidObjectId(id)) return false;
      const doc = await Event.findById(id).lean();
      if (!doc) return false;
      if (String(doc.organizer) !== ctx.user.id && ctx.user.role !== 'admin') {
        throw Err.forbidden('Not authorized to delete this event');
      }
      await Event.findByIdAndDelete(id);
      await Registration.deleteMany({ event: id });
      await Message.deleteMany({ event: id });

      // Publish event deleted
      const emitter = ctx?.pubsub || pubsub;
      await emitter.publish(TOPICS.EVENT_UPDATED, {
        eventUpdated: {
          action: 'deleted',
          id: String(id),
          event: null,
        },
      });

      return true;
    },

    rsvp: async (_p, { eventId, status }, ctx) => {
      requireAuth(ctx);
      if (!mongoose.isValidObjectId(eventId)) throw Err.badRequest('Invalid event id');
      const ev = await Event.findById(eventId).lean();
      if (!ev) throw Err.notFound('Event');
      await Registration.findOneAndUpdate(
        { event: eventId, user: ctx.user.id },
        { $set: { status } },
        { upsert: true, new: true }
      );
      const [attendeesCount, organizer] = await Promise.all([
        Registration.countDocuments({ event: eventId }),
        ctx.loaders.userById.load(String(ev.organizer)),
      ]);

      // Publish event RSVP change as update
      const emitter = ctx?.pubsub || pubsub;
      await emitter.publish(TOPICS.EVENT_UPDATED, {
        eventUpdated: {
          action: 'registration_changed',
          id: ev._id.toString(),
          event: {
            id: ev._id.toString(),
            ...mapEventDoc({ ...ev, organizer }),
            attendeesCount,
            myRsvp: status,
          },
        },
      });

      return {
        id: ev._id.toString(),
        ...mapEventDoc({ ...ev, organizer }),
        attendeesCount,
        myRsvp: status,
      };
    },

    register: async (_p, { input }) => {
      const { email, password, name } = input;
      const normalized = String(email).toLowerCase().trim();
      const existing = await User.findOne({ email: normalized }).lean();
      if (existing) throw Err.conflict('Email already in use');
      const passwordHash = await hashPassword(password);
      const doc = await User.create({
        name: name || '',
        email: normalized,
        passwordHash,
        role: 'user',
      });
      const user = sanitizeUserDoc(await User.findById(doc._id).lean());
      const token = signToken({ id: user.id, role: user.role, email: user.email, name: user.name });
      return { token, user };
    },

    login: async (_p, { email, password }) => {
      const normalized = String(email).toLowerCase().trim();
      const userDoc = await User.findOne({ email: normalized }).lean();
      if (!userDoc) throw Err.badRequest('Invalid credentials');
      const ok = await comparePassword(password, userDoc.passwordHash);
      if (!ok) throw Err.badRequest('Invalid credentials');
      const user = sanitizeUserDoc(userDoc);
      const token = signToken({ id: user.id, role: user.role, email: user.email, name: user.name });
      return { token, user };
    },

    sendMessage: async (_p, { roomId, text }, ctx) => {
      requireAuth(ctx);
      const payload = {
        roomId,
        user: ctx.user.id,
        text,
      };
      const match = /^event:(.+)$/.exec(roomId);
      if (match && mongoose.isValidObjectId(match[1])) {
        payload.event = match[1];
      }
      const msg = await Message.create(payload);

      const [user, event] = await Promise.all([
        ctx.loaders.userById.load(String(ctx.user.id)),
        msg.event ? ctx.loaders.eventById.load(String(msg.event)) : Promise.resolve(null),
      ]);

      const mapped = mapMessageDoc({ ...msg.toObject(), user, event });

      // Publish messageAdded for the specific room
      const emitter = ctx?.pubsub || pubsub;
      await emitter.publish(`${TOPICS.MESSAGE_ADDED}.${roomId}`, { messageAdded: mapped });

      return mapped;
    },
  },

  Subscription: {
    eventUpdated: {
      // PUBLIC_INTERFACE
      subscribe: () => pubsub.asyncIterator([TOPICS.EVENT_UPDATED]),
    },
    messageAdded: {
      // PUBLIC_INTERFACE
      subscribe: (_root, { roomId }) =>
        pubsub.asyncIterator([`${TOPICS.MESSAGE_ADDED}.${roomId}`]),
    },
  },
});

// Helpers
// PUBLIC_INTERFACE
function requireAuth(ctx) {
  if (!ctx.user) throw Err.unauthenticated();
}

function sanitizeUserDoc(doc) {
  return {
    id: doc._id.toString(),
    name: doc.name || '',
    email: doc.email,
    role: doc.role || 'user',
    avatarUrl: doc.avatarUrl || '',
    createdAt: doc.createdAt?.toISOString?.() || null,
    updatedAt: doc.updatedAt?.toISOString?.() || null,
  };
}

function mapEventDoc(doc) {
  const organizer = doc.organizer && typeof doc.organizer === 'object' && doc.organizer._id
    ? sanitizeUserDoc(doc.organizer)
    : undefined;

  return {
    title: doc.title,
    description: doc.description,
    location: doc.location,
    type: doc.type,
    date: doc.date ? new Date(doc.date).toISOString().slice(0, 10) : null,
    startDate: doc.startDate ? new Date(doc.startDate).toISOString().slice(0, 10) : null,
    endDate: doc.endDate ? new Date(doc.endDate).toISOString().slice(0, 10) : null,
    imageUrl: doc.imageUrl || '',
    tags: doc.tags || [],
    organizer: organizer || { id: String(doc.organizer), name: '', email: '' },
    createdAt: doc.createdAt?.toISOString?.() || null,
    updatedAt: doc.updatedAt?.toISOString?.() || null,
  };
}

function mapMessageDoc(doc) {
  return {
    id: doc._id.toString(),
    roomId: doc.roomId,
    event: doc.event
      ? {
          id: doc.event._id?.toString?.() || String(doc.event),
          ...mapEventDoc(doc.event._doc ? doc.event : {}),
        }
      : null,
    user: doc.user && typeof doc.user === 'object' ? sanitizeUserDoc(doc.user) : { id: String(doc.user) },
    text: doc.text,
    createdAt: doc.createdAt?.toISOString?.() || null,
    updatedAt: doc.updatedAt?.toISOString?.() || null,
  };
}

export default createResolvers;
