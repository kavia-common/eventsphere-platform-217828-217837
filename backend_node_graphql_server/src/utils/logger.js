import pino from 'pino';
import { getEnv } from './env.js';

/**
 * PUBLIC_INTERFACE
 * Create and export a pino logger configured via LOG_LEVEL and NODE_ENV.
 * In development it enables pretty transport, in production it uses JSON.
 */
export function createLogger(bindings = {}) {
  const level = getEnv('LOG_LEVEL', 'info');
  const env = getEnv('NODE_ENV', 'development');

  const isDev = env !== 'production';
  const base = { service: 'backend_node_graphql_server', ...bindings };

  // Pretty print in dev, JSON in prod
  const options = {
    level,
    base,
    redact: {
      paths: ['req.headers.authorization', 'authorization', 'password', 'passwordHash'],
      remove: true,
    },
  };

  const transport = isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined;

  const logger = pino({ ...options, transport });

  return logger;
}

/**
 * PUBLIC_INTERFACE
 * getLogger: cached root logger for app-wide use.
 */
let rootLogger;
export function getLogger() {
  if (!rootLogger) {
    rootLogger = createLogger();
  }
  return rootLogger;
}

export default getLogger;
