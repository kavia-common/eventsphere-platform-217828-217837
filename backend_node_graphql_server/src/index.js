import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { getEnv, requiredEnv } from './utils/env.js';
import { connectDatabase, disconnectDatabase } from './db/connection.js';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs } from './graphql/typeDefs.js';
import { createResolvers, getPubSub } from './graphql/resolvers.js';
import { buildContext } from './graphql/context.js';
import { createServer } from 'http';
import { useServer } from 'graphql-ws/lib/use/ws';
import { WebSocketServer } from 'ws';
import { getAuthFromRequest } from './utils/auth.js';
import getLogger from './utils/logger.js';
import { toGraphQLError } from './utils/errors.js';

/**
 * PUBLIC_INTERFACE
 * Backend entrypoint: Express + Apollo Server (HTTP) and graphql-ws (WS).
 * - Exposes POST /graphql for GraphQL operations with JSON body (express.json()).
 * - CORS enabled for configured origins (supports preflight).
 * - GET /healthz health check (configurable with HEALTHCHECK_PATH).
 * - WebSocket subscriptions at /graphql when WS_ENABLED=true.
 * Env:
 * - PORT (default 4000)
 * - NODE_ENV
 * - CORS_ORIGIN (comma separated list or * for any)
 * - REACT_APP_FRONTEND_URL (fallback to infer CORS if CORS_ORIGIN not set)
 * - WS_ENABLED (true/false)
 */
const PORT = Number(getEnv('PORT', 4000));
const NODE_ENV = getEnv('NODE_ENV', 'development');
const HEALTHCHECK_PATH = getEnv('HEALTHCHECK_PATH', '/healthz');
const WS_ENABLED = String(getEnv('WS_ENABLED', 'true')).toLowerCase() !== 'false';

// CORS origin resolution
const FRONTEND_ORIGIN = getEnv('REACT_APP_FRONTEND_URL', '');
const CORS_ORIGIN = getEnv('CORS_ORIGIN', FRONTEND_ORIGIN || '*');

// Ensure critical envs
try {
  requiredEnv('MONGODB_URI');
  requiredEnv('JWT_SECRET');
} catch (e) {
  // eslint-disable-next-line no-console
  console.error('[startup] Missing required env:', e.message);
  process.exit(1);
}

const app = express();
const logger = getLogger();

// Global CORS (handles preflight)
app.use(
  cors({
    origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(',').map((s) => s.trim()),
    credentials: true,
  })
);

// Body parser for JSON
app.use(express.json());

// HTTP request logging
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));

// Healthcheck endpoint
app.get(HEALTHCHECK_PATH, async (_req, res) => {
  const status = {
    status: 'ok',
    service: 'backend_node_graphql_server',
    env: NODE_ENV,
    time: new Date().toISOString(),
    db: 'unknown',
    ws: WS_ENABLED ? 'enabled' : 'disabled',
  };

  try {
    const ready = !!(await import('mongoose')).default?.connection?.readyState;
    status.db = ready ? 'connected' : 'not_connected';
  } catch {
    status.db = 'unknown';
  }

  res.json(status);
});

// Root info
app.get('/', (_req, res) => {
  res.json({
    name: 'EventSphere Backend',
    message: 'GraphQL endpoint is available at /graphql',
    ws: WS_ENABLED ? 'GraphQL WS endpoint available at /graphql' : 'WS disabled',
    healthcheck: HEALTHCHECK_PATH,
  });
});

// Startup sequencing
async function start() {
  try {
    await connectDatabase();

    // Apollo Server (HTTP)
    const server = new ApolloServer({
      typeDefs,
      resolvers: createResolvers(),
      introspection: NODE_ENV !== 'production',
      formatError: (formatted, error) => {
        const gqErr = toGraphQLError(error);
        const isClientError = ['BAD_REQUEST', 'UNAUTHENTICATED', 'FORBIDDEN', 'NOT_FOUND', 'CONFLICT'].includes(
          gqErr.extensions?.code
        );
        if (!isClientError) {
          logger.error({ err: error, path: formatted?.path, code: gqErr.extensions?.code }, 'GraphQL error');
        } else {
          logger.debug({ path: formatted?.path, code: gqErr.extensions?.code }, 'GraphQL client error');
        }
        return gqErr;
      },
    });
    await server.start();

    // Create HTTP server to attach both Express and WebSocket server
    const httpServer = createServer(app);

    // GraphQL route with per-route CORS and JSON body parser (ensures preflight not rejected)
    app.use(
      '/graphql',
      cors({
        origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(',').map((s) => s.trim()),
        credentials: true,
      }),
      express.json(),
      expressMiddleware(server, {
        // PUBLIC_INTERFACE
        context: async (arg) => buildContext(arg),
      })
    );

    // WS server for subscriptions via graphql-ws
    let wsCleanup;
    if (WS_ENABLED) {
      const wsServer = new WebSocketServer({
        server: httpServer,
        path: '/graphql',
      });

      wsCleanup = useServer(
        {
          schema: server.schema,
          // PUBLIC_INTERFACE
          onConnect: async (ctx) => {
            const authHeader =
              ctx.connectionParams?.Authorization || ctx.connectionParams?.authorization || '';
            const reqLike = { headers: { authorization: authHeader } };
            const { user } = getAuthFromRequest(reqLike);
            ctx.extra.user = user || null;
            ctx.extra.log = logger.child({ ws: true });
            return true;
          },
          context: (ctx, _msg, _args) => {
            // Expose similar shape as HTTP context
            return { user: ctx.extra.user, pubsub: getPubSub(), log: ctx.extra.log };
          },
        },
        wsServer
      );
    }

    httpServer.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(
        `[startup] Server listening on port ${PORT} (env=${NODE_ENV}) ${WS_ENABLED ? 'with WS /graphql' : ''}`
      );
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      // eslint-disable-next-line no-console
      console.log(`[shutdown] Received ${signal}, closing server...`);
      try {
        if (wsCleanup) {
          await wsCleanup.dispose?.();
        }
      } catch {}
      httpServer.close(async () => {
        try {
          await server.stop();
        } catch {}
        await disconnectDatabase();
        process.exit(0);
      });
      // Force exit if not closed within 10s
      setTimeout(async () => {
        try {
          await server.stop();
        } catch {}
        await disconnectDatabase();
        process.exit(1);
      }, 10000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[startup] Failed to start server:', err);
    process.exit(1);
  }
}

start();
