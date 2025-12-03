import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User, Event, Registration, Message } from '../models/index.js';
import { requiredEnv } from '../utils/env.js';

const JWT_SECRET = requiredEnv('JWT_SECRET');

/**
 * PUBLIC_INTERFACE
 * Build GraphQL resolvers object. Uses models via direct imports and current user injected in context.
 */
export const createResolvers = () => ({
  Query: {
    // Returns the authenticated user if any
    me: async (_p, _a, ctx) => ctx.user || null,

    // Events list with simple filters
    events: async (_p, args, ctx) => {
      const { query, type, afterDate, limit = 24, offset = 0 } = args;
      const filter = {};
      if (type) filter.type = type;
      if (afterDate) {
        const d = new Date(afterDate);
        if (!Number.isNaN(d.getTime())) {
          // Consider both single date and range start
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

      // Compute attendeesCount and myRsvp fields on the fly
      const ids = docs.map((d) => d._id);
      const counts = await Registration.aggregate([
        { $match: { event: { $in: ids } } },
        { $group: { _id: '$event', c: { $sum: 1 } } }
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

    // Single event by id
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

    // Basic static summary; could be enhanced later
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
        revenue: Math.floor(totalRegistrations * 20), // placeholder computation
        activeUsers: activeUsersDocs.length,
        recentEvents: recentEventsDocs.map((d) => ({
          id: d._id.toString(),
          ...mapEventDoc(d),
        })),
      };
    },

    // Recent messages in a room
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
    // Create Event, organizer = current user
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

      // Ownership/admin guard
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
      // allow deletion if organizer is current user or admin
      if (String(doc.organizer) !== ctx.user.id && ctx.user.role !== 'admin') {
        throw new Error('Not authorized to delete this event');
      }
      await Event.findByIdAndDelete(id);
      await Registration.deleteMany({ event: id });
      await Message.deleteMany({ event: id });
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
      return {
        id: ev._id.toString(),
        ...mapEventDoc(ev),
        attendeesCount,
        myRsvp: status,
      };
    },

    register: async (_p, { input }) => {
      const { email, password, name } = input;
      const existing = await User.findOne({ email: String(email).toLowerCase().trim() }).lean();
      if (existing) throw new Error('Email already in use');
      const passwordHash = await bcrypt.hash(password, 10);
      const doc = await User.create({
        name: name || '',
        email: String(email).toLowerCase().trim(),
        passwordHash,
        role: 'user',
      });
      const user = sanitizeUserDoc((await User.findById(doc._id).lean()));
      const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      return { token, user };
    },

    login: async (_p, { email, password }) => {
      const userDoc = await User.findOne({ email: String(email).toLowerCase().trim() }).lean();
      if (!userDoc) throw new Error('Invalid credentials');
      const ok = await bcrypt.compare(password, userDoc.passwordHash);
      if (!ok) throw new Error('Invalid credentials');
      const user = sanitizeUserDoc(userDoc);
      const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      return { token, user };
    },

    sendMessage: async (_p, { roomId, text }, ctx) => {
      requireAuth(ctx);
      const payload = {
        roomId,
        user: ctx.user.id,
        text,
      };
      // If room is event:<id>, attach event ref when valid
      const match = /^event:(.+)$/.exec(roomId);
      if (match && mongoose.isValidObjectId(match[1])) {
        payload.event = match[1];
      }
      const msg = await Message.create(payload);
      const populated = await Message.findById(msg._id).populate('user').populate('event').lean();
      // For now, subscriptions are stubbed; future step will publish via PubSub
      return mapMessageDoc(populated);
    },
  },

  // Stub subscriptions; will be wired with a PubSub in future WS step
  Subscription: {
    eventUpdated: {
      subscribe: () => {
        throw new Error('Subscriptions not yet enabled');
      },
    },
    messageAdded: {
      subscribe: () => {
        throw new Error('Subscriptions not yet enabled');
      },
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
