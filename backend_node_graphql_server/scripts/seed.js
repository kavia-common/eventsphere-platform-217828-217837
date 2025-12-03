#!/usr/bin/env node
/**
 * Seed script for local development.
 * - Connects to MongoDB using MONGODB_URI
 * - Inserts sample Users, Events, Registrations, and Messages
 * - Idempotent: upserts based on unique keys and reuses created IDs
 *
 * Usage:
 *   npm run seed
 *
 * Notes:
 * - Requires MONGODB_URI in environment (.env) and does NOT require JWT_SECRET here.
 */
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { requiredEnv, getEnv } from '../src/utils/env.js';
import { User, Event, Registration, Message } from '../src/models/index.js';

const LOG_LEVEL = getEnv('LOG_LEVEL', 'info');
function log(level, msg, meta) {
  const levels = ['silent','error','warn','info','debug','trace'];
  const currentIdx = levels.indexOf(LOG_LEVEL) === -1 ? 3 : levels.indexOf(LOG_LEVEL);
  const msgIdx = levels.indexOf(level) === -1 ? 3 : levels.indexOf(level);
  if (msgIdx <= currentIdx && level !== 'silent') {
    const line = `[seed:${level}] ${msg}`;
    // eslint-disable-next-line no-console
    console.log(line, meta ?? '');
  }
}

async function connect() {
  const uri = requiredEnv('MONGODB_URI');
  const opts = { autoIndex: true, maxPoolSize: 5 };
  await mongoose.connect(uri, opts);
  log('info', 'Connected to MongoDB for seeding');
}

async function disconnect() {
  try {
    await mongoose.disconnect();
    log('info', 'Disconnected from MongoDB');
  } catch (e) {
    log('warn', 'Error during disconnect', e?.message || e);
  }
}

/**
 * Helper to upsert user by email and return the document.
 */
async function upsertUser({ name, email, passwordHash, avatarUrl, role = 'user' }) {
  const res = await User.findOneAndUpdate(
    { email },
    { $setOnInsert: { name, email, passwordHash, avatarUrl, role } },
    { new: true, upsert: true }
  );
  return res;
}

/**
 * Helper to upsert event by unique composite (title + organizer).
 * Assumes titles in sample set are unique enough for demo purposes.
 */
async function upsertEvent({ title, description, location, type, date, imageUrl, tags, organizer }) {
  const res = await Event.findOneAndUpdate(
    { title, organizer },
    {
      $setOnInsert: {
        title, description, location, type, date,
        imageUrl, tags, organizer
      }
    },
    { new: true, upsert: true }
  );
  return res;
}

/**
 * Helper to upsert registration by unique index (event + user).
 */
async function upsertRegistration({ event, user, status = 'going', notes = '' }) {
  const res = await Registration.findOneAndUpdate(
    { event, user },
    { $setOnInsert: { event, user, status, notes } },
    { new: true, upsert: true }
  );
  return res;
}

/**
 * Helper to insert message idempotently by a deterministic key:
 * We check if a message with same roomId, user, text exists in last day.
 */
async function insertMessageOnce({ roomId, event, user, text }) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const exists = await Message.findOne({
    roomId, user, text, createdAt: { $gte: since }
  }).lean();
  if (exists) return exists;
  const res = await Message.create({ roomId, event, user, text });
  return res;
}

async function seed() {
  // Users
  const users = [
    // password hashes can be generated later; store placeholder demo hashes to avoid bcrypt dependency here
    { name: 'Alice Johnson', email: 'alice@example.com', passwordHash: '$2a$10$t5Gg9i1yQa2O7kGfF3W1Z.SAMPLEPLACEHOLDER111111111111111111111', avatarUrl: '', role: 'admin' },
    { name: 'Bob Smith', email: 'bob@example.com', passwordHash: '$2a$10$t5Gg9i1yQa2O7kGfF3W1Z.SAMPLEPLACEHOLDER222222222222222222222', avatarUrl: '', role: 'user' },
    { name: 'Carol Lee', email: 'carol@example.com', passwordHash: '$2a$10$t5Gg9i1yQa2O7kGfF3W1Z.SAMPLEPLACEHOLDER333333333333333333333', avatarUrl: '', role: 'user' },
  ];

  const createdUsers = {};
  for (const u of users) {
    const doc = await upsertUser(u);
    createdUsers[u.email] = doc;
  }
  log('info', 'Users upserted', Object.keys(createdUsers));

  // Events (organized by Alice and Bob)
  const now = new Date();
  const plusDays = (d) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

  const events = [
    {
      title: 'React Summit 2025',
      description: 'All things React. Talks, workshops, and networking.',
      location: 'Online',
      type: 'online',
      date: plusDays(7),
      imageUrl: '',
      tags: ['React', 'Frontend'],
      organizer: createdUsers['alice@example.com']._id,
    },
    {
      title: 'GraphQL Live',
      description: 'Deep dive into GraphQL schemas, resolvers, and performance.',
      location: 'San Francisco, CA',
      type: 'in-person',
      date: plusDays(14),
      imageUrl: '',
      tags: ['GraphQL', 'API'],
      organizer: createdUsers['alice@example.com']._id,
    },
    {
      title: 'Tailwind Mastery Workshop',
      description: 'Hands-on workshop to build scalable design systems with Tailwind CSS.',
      location: 'Remote',
      type: 'hybrid',
      date: plusDays(21),
      imageUrl: '',
      tags: ['TailwindCSS', 'Design Systems'],
      organizer: createdUsers['bob@example.com']._id,
    },
  ];

  const createdEvents = {};
  for (const e of events) {
    const doc = await upsertEvent(e);
    createdEvents[e.title] = doc;
  }
  log('info', 'Events upserted', Object.keys(createdEvents));

  // Registrations (RSVPs)
  const regs = [
    { event: createdEvents['React Summit 2025']._id, user: createdUsers['alice@example.com']._id, status: 'going' },
    { event: createdEvents['React Summit 2025']._id, user: createdUsers['bob@example.com']._id, status: 'interested' },
    { event: createdEvents['GraphQL Live']._id, user: createdUsers['carol@example.com']._id, status: 'going' },
    { event: createdEvents['Tailwind Mastery Workshop']._id, user: createdUsers['alice@example.com']._id, status: 'going' },
  ];
  for (const r of regs) {
    await upsertRegistration(r);
  }
  log('info', 'Registrations upserted', regs.length);

  // Messages in "general" and event-specific room
  const generalRoom = 'general';
  await insertMessageOnce({
    roomId: generalRoom,
    user: createdUsers['alice@example.com']._id,
    text: 'Welcome to EventSphere! 🎉',
  });
  await insertMessageOnce({
    roomId: generalRoom,
    user: createdUsers['bob@example.com']._id,
    text: 'Hi everyone!',
  });

  const eventRoomReact = `event:${createdEvents['React Summit 2025']._id.toString()}`;
  await insertMessageOnce({
    roomId: eventRoomReact,
    event: createdEvents['React Summit 2025']._id,
    user: createdUsers['carol@example.com']._id,
    text: 'Excited for the talks!',
  });

  log('info', 'Messages inserted (idempotent)');
}

(async () => {
  try {
    await connect();
    await seed();
    log('info', 'Seeding completed successfully.');
    await disconnect();
    process.exit(0);
  } catch (err) {
    log('error', 'Seeding failed', err?.message || err);
    try { await disconnect(); } catch {}
    process.exit(1);
  }
})();
