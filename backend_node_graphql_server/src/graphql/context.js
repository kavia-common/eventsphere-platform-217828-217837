import jwt from 'jsonwebtoken';
import { getEnv, requiredEnv } from '../utils/env.js';
import { User } from '../models/index.js';

const JWT_SECRET = requiredEnv('JWT_SECRET');
const LOG_LEVEL = getEnv('LOG_LEVEL', 'info');

function log(level, msg, meta) {
  const levels = ['silent','error','warn','info','debug','trace'];
  const currentIdx = levels.indexOf(LOG_LEVEL) === -1 ? 3 : levels.indexOf(LOG_LEVEL);
  const msgIdx = levels.indexOf(level) === -1 ? 3 : levels.indexOf(level);
  if (msgIdx <= currentIdx && level !== 'silent') {
    // eslint-disable-next-line no-console
    console.log(`[gql-ctx:${level}] ${msg}`, meta ?? '');
  }
}

/**
 * PUBLIC_INTERFACE
 * Builds Apollo context per request: extracts Bearer token, verifies, and loads user.
 */
export async function buildContext({ req }) {
  let user = null;
  try {
    const auth = req?.headers?.authorization || req?.headers?.Authorization;
    if (auth && String(auth).startsWith('Bearer ')) {
      const token = String(auth).slice(7).trim();
      const payload = jwt.verify(token, JWT_SECRET);
      if (payload?.sub) {
        const doc = await User.findById(payload.sub).lean();
        if (doc) {
          user = {
            id: doc._id.toString(),
            email: doc.email,
            name: doc.name || '',
            role: doc.role || 'user',
          };
        }
      }
    }
  } catch (e) {
    log('warn', 'JWT parse/verify failed', e?.message || e);
  }

  return {
    user,
    // Expose raw models if needed by resolvers
    models: { User },
  };
}

export default buildContext;
