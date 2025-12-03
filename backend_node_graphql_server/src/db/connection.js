import mongoose from 'mongoose';
import { getEnv, requiredEnv } from '../utils/env.js';

const LOG_LEVEL = getEnv('LOG_LEVEL', 'info');

function log(level, msg, meta) {
  const levels = ['silent','error','warn','info','debug','trace'];
  const currentIdx = levels.indexOf(LOG_LEVEL) === -1 ? 3 : levels.indexOf(LOG_LEVEL);
  const msgIdx = levels.indexOf(level) === -1 ? 3 : levels.indexOf(level);
  if (msgIdx <= currentIdx && level !== 'silent') {
    const line = `[db:${level}] ${msg}`;
    if (meta) {
      // eslint-disable-next-line no-console
      console.log(line, meta);
    } else {
      // eslint-disable-next-line no-console
      console.log(line);
    }
  }
}

/**
 * PUBLIC_INTERFACE
 * connectDatabase: Initializes a Mongoose connection using MONGODB_URI.
 * Handles basic event logging and process termination on errors in production.
 */
export async function connectDatabase() {
  const uri = requiredEnv('MONGODB_URI');

  mongoose.connection.on('connected', () => log('info', 'MongoDB connected'));
  mongoose.connection.on('reconnected', () => log('info', 'MongoDB reconnected'));
  mongoose.connection.on('disconnected', () => log('warn', 'MongoDB disconnected'));
  mongoose.connection.on('error', (err) => {
    log('error', 'MongoDB connection error', err);
  });

  const opts = {
    autoIndex: getEnv('NODE_ENV') !== 'production',
    maxPoolSize: 10
  };

  await mongoose.connect(uri, opts);
  return mongoose.connection;
}

/**
 * PUBLIC_INTERFACE
 * disconnectDatabase: Gracefully disconnects mongoose.
 */
export async function disconnectDatabase() {
  try {
    await mongoose.disconnect();
    log('info', 'MongoDB disconnected gracefully');
  } catch (e) {
    log('warn', 'Error during MongoDB disconnect', e?.message || e);
  }
}

export default { connectDatabase, disconnectDatabase };
