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

// Load env and configuration
const PORT = Number(getEnv('PORT', 4000));
const NODE_ENV = getEnv('NODE_ENV', 'development');
const HEALTHCHECK_PATH = getEnv('HEALTHCHECK_PATH', '/healthz');
const WS_ENABLED = String(getEnv('WS_ENABLED', 'true')).toLowerCase() !== 'false';

/**
 * CORS handling:
 * - Preferred: CORS_ORIGIN (comma-separated origins) from env.
 * - Fallback: REACT_APP_FRONTEND_URL (single origin) if CORS_ORIGIN is not set.
 * - Dev default: '*' (allows any, suitable for local iteration; set explicit origins for prod).
 */
const FRONTEND_ORIGIN = getEnv('REACT_APP_FRONTEND_URL', '');
const CORS_ORIGIN = getEnv('CORS_ORIGIN', FRONTEND_ORIGIN || '*');

// Ensure critical envs are present
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

// Middlewares
app.use(
  cors({
    origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(',').map((s) => s.trim()),
    credentials: true,
  })
);

// Attach a simple request id and request-scoped logger for HTTP routes
app.use((req, _res, next) => {
  req.id = req.headers['x-request-id'] || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  req.log = logger.child({ reqId: req.id, path: req.path, method: req.method });
  next();
});

app.use(express.json());

// Keep morgan for concise dev http logs; pino handles app logs
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
>>>>>>> REPLACE   
```

Explanation: Add ApolloServer formatError and log startup/shutdown via pino; inject context unchanged (context builder already returns logger)
````edit file="eventsphere-platform-217828-217837/backend_node_graphql_server/src/index.js"      
<<<<<<< SEARCH
    const server = new ApolloServer({
      typeDefs,
      resolvers: createResolvers(),
      introspection: NODE_ENV !== 'production',
    });
=======
    const server = new ApolloServer({
      typeDefs,
      resolvers: createResolvers(),
      introspection: NODE_ENV !== 'production',
      formatError: (formatted, error) => {
        const gqErr = toGraphQLError(error);
        // Log internal errors; avoid noisy logs for common client errors
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

// Healthcheck endpoint (must remain at HEALTHCHECK_PATH)
/**
 * Healthcheck endpoint
 * GET {HEALTHCHECK_PATH}
 * Returns service status and db connectivity flag.
 */
app.get(HEALTHCHECK_PATH, async (req, res) => {
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
app.get('/', (req, res) => {
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

    // Initialize Apollo Server 4 for HTTP
    const server = new ApolloServer({
      typeDefs,
      resolvers: createResolvers(),
      introspection: NODE_ENV !== 'production',
    });
    await server.start();

    // Create HTTP server to attach both Express and WebSocket server
    const httpServer = createServer(app);

    app.use(
      '/graphql',
      // Ensure CORS at route to handle preflight as well
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
    let wsServer;
    let wsCleanup;
    if (WS_ENABLED) {
      wsServer = new WebSocketServer({
        server: httpServer,
        path: '/graphql',
      });

      wsCleanup = useServer(
        {
          schema: server.schema,
          // PUBLIC_INTERFACE
          onConnect: async (ctx) => {
            const authHeader =
              ctx.connectionParams?.Authorization ||
              ctx.connectionParams?.authorization ||
              '';
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
        `[startup] Server listening on port ${PORT} (env=${NODE_ENV}) ${
          WS_ENABLED ? 'with WS /graphql' : ''
        }`
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
