import { User } from '../models/index.js';
import { getAuthFromRequest } from '../utils/auth.js';
import getLogger from '../utils/logger.js';
import { createLoaders } from '../utils/loaders.js';
import { errors } from '../utils/errors.js';
import { getPubSub } from './resolvers.js';

/**
 * PUBLIC_INTERFACE
 * Builds Apollo context per request:
 * - extracts Bearer token using utils/auth and returns user
 * - attaches per-request dataloaders
 * - attaches logger child with request id (if present)
 * - exposes pubsub for resolvers requiring it
 * - exposes standardized error helpers
 */
export async function buildContext({ req }) {
  const logger = getLogger().child({
    mod: 'gql-context',
    requestId: req?.headers?.['x-request-id'] || undefined,
  });

  try {
    const { user } = getAuthFromRequest(req);
    const loaders = createLoaders();
    return {
      user,
      models: { User },
      loaders,
      log: logger,
      pubsub: getPubSub(),
      errors,
    };
  } catch (e) {
    logger.warn({ err: e }, 'Context build failed');
    const loaders = createLoaders();
    return {
      user: null,
      models: { User },
      loaders,
      log: logger,
      pubsub: getPubSub(),
      errors,
    };
  }
}

export default buildContext;
