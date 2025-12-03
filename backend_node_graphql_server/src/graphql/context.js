import { getEnv } from '../utils/env.js';
import { User } from '../models/index.js';
import { getAuthFromRequest } from '../utils/auth.js';

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
 * Builds Apollo context per request: extracts Bearer token using utils/auth and returns user.
 */
export async function buildContext({ req }) {
  try {
    const { user } = getAuthFromRequest(req);
    return {
      user,
      models: { User },
    };
  } catch (e) {
    log('warn', 'Context build failed', e?.message || e);
    return { user: null, models: { User } };
  }
}

export default buildContext;
