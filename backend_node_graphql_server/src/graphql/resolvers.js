import mongoose from 'mongoose';
import { PubSub } from 'graphql-subscriptions';
import { User, Event, Registration, Message } from '../models/index.js';
import { comparePassword, hashPassword, signToken } from '../utils/auth.js';

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
        .populate('organizer')
        .lean();

      const ids = docs.map((d) => d._id);
      const counts = await Registration.aggregate([
        { $match: { event: { $in: ids } } },
        { $group: { _id: '$event', c: { $sum: 1 } } },
      ]);
      const countMap = new Map(counts.map((c) => [String(c._id), c.c]));
      let myRegsMap = new Map();
      if (ctx.user) {
        const myRegs = await Registration.find({ event: { $in: ids }, user: ctx.user.id }).lean();
        myRegsMap = new Map(myRegs.map((r) => [String(r.event), r.status]));
      }
      return docs.map((d) => ({
        id: d._id.toString(),
        ...mapEventDoc(d),
        attendeesCount: countMap.get(String(d._id)) || 0,
        myRsvp: myRegsMap.get(String(d._id)) || null,
      }));
    },

    event: async (_p, { id }, ctx) => {
      if (!mongoose.isValidObjectId(id)) return null;
      const doc = await Event.findById(id).populate('organizer').lean();
      if (!doc) return null;

      const attendeesCount = await Registration.countDocuments({ event: doc._id });
      let myRsvp = null;
      if (ctx.user) {
        const reg = await Registration.findOne({ event: doc._id, user: ctx.user.id }).lean();
        myRsvp = reg?.status || null;
      }
      return {
        id: doc._id.toString(),
        ...mapEventDoc(doc),
        attendeesCount,
        myRsvp,
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

    chatMessages: async (_p, { roomId, limit = 50, offset = 0 }) => {
      const msgs = await Message.find({ roomId })
        .sort({ createdAt: 1 })
        .skip(offset)
        .limit(Math.min(limit, 100))
        .populate('user')
        .populate('event')
        .lean();

      return msgs.map(mapMessageDoc);
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
      const populated = await Event.findById(doc._id).populate('organizer').lean();

      // Publish event created
      await pubsub.publish(TOPICS.EVENT_UPDATED, {
        eventUpdated: {
          action: 'created',
          id: populated._id.toString(),
          event: {
            id: populated._id.toString(),
            ...mapEventDoc(populated),
          },
        },
      });

      return {
        id: populated._id.toString(),
        ...mapEventDoc(populated),
        attendeesCount: 0,
        myRsvp: null,
      };
    },

    updateEvent: async (_p, { id, input }, ctx) => {
      requireAuth(ctx);
      if (!mongoose.isValidObjectId(id)) throw new Error('Invalid event id');

      const existing = await Event.findById(id).lean();
      if (!existing) throw new Error('Event not found');
      if (String(existing.organizer) !== ctx.user.id && ctx.user.role !== 'admin') {
        throw new Error('Not authorized to update this event');
      }

      const updates = { ...input };
      if (updates.date) updates.date = new Date(updates.date);
      if (updates.startDate) updates.startDate = new Date(updates.startDate);
      if (updates.endDate) updates.endDate = new Date(updates.endDate);

      const doc = await Event.findByIdAndUpdate(id, { $set: updates }, { new: true })
        .populate('organizer')
        .lean();
      if (!doc) throw new Error('Event not found');

      const attendeesCount = await Registration.countDocuments({ event: doc._id });
      let myRsvp = null;
      if (ctx.user) {
        const reg = await Registration.findOne({ event: doc._id, user: ctx.user.id }).lean();
        myRsvp = reg?.status || null;
      }

      // Publish event updated
      await pubsub.publish(TOPICS.EVENT_UPDATED, {
        eventUpdated: {
          action: 'updated',
          id: doc._id.toString(),
          event: {
            id: doc._id.toString(),
            ...mapEventDoc(doc),
            attendeesCount,
            myRsvp,
          },
        },
      });

      return {
        id: doc._id.toString(),
        ...mapEventDoc(doc),
        attendeesCount,
        myRsvp,
      };
    },

    deleteEvent: async (_p, { id }, ctx) => {
      requireAuth(ctx);
      if (!mongoose.isValidObjectId(id)) return false;
      const doc = await Event.findById(id).lean();
      if (!doc) return false;
      if (String(doc.organizer) !== ctx.user.id && ctx.user.role !== 'admin') {
        throw new Error('Not authorized to delete this event');
      }
      await Event.findByIdAndDelete(id);
      await Registration.deleteMany({ event: id });
      await Message.deleteMany({ event: id });

      // Publish event deleted
      await pubsub.publish(TOPICS.EVENT_UPDATED, {
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
      if (!mongoose.isValidObjectId(eventId)) throw new Error('Invalid event id');
      const ev = await Event.findById(eventId).populate('organizer').lean();
      if (!ev) throw new Error('Event not found');
      await Registration.findOneAndUpdate(
        { event: eventId, user: ctx.user.id },
        { $set: { status } },
        { upsert: true, new: true }
      );
      const attendeesCount = await Registration.countDocuments({ event: eventId });

      // Publish event RSVP change as update
      await pubsub.publish(TOPICS.EVENT_UPDATED, {
        eventUpdated: {
          action: 'registration_changed',
          id: ev._id.toString(),
          event: {
            id: ev._id.toString(),
            ...mapEventDoc(ev),
            attendeesCount,
            myRsvp: status,
          },
        },
      });

      return {
        id: ev._id.toString(),
        ...mapEventDoc(ev),
        attendeesCount,
        myRsvp: status,
      };
    },

    register: async (_p, { input }) => {
      const { email, password, name } = input;
      const normalized = String(email).toLowerCase().trim();
      const existing = await User.findOne({ email: normalized }).lean();
      if (existing) throw new Error('Email already in use');
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
      if (!userDoc) throw new Error('Invalid credentials');
      const ok = await comparePassword(password, userDoc.passwordHash);
      if (!ok) throw new Error('Invalid credentials');
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
      const populated = await Message.findById(msg._id).populate('user').populate('event').lean();
      const mapped = mapMessageDoc(populated);

      // Publish messageAdded for the specific room
      await pubsub.publish(`${TOPICS.MESSAGE_ADDED}.${roomId}`, { messageAdded: mapped });

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
  if (!ctx.user) throw new Error('Not authenticated');
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
