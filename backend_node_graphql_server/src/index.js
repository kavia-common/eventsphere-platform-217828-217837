import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { getEnv, requiredEnv } from './utils/env.js';
import { connectDatabase, disconnectDatabase } from './db/connection.js';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs } from './graphql/typeDefs.js';
import { createResolvers } from './graphql/resolvers.js';
import { buildContext } from './graphql/context.js';

// Load env and configuration
const PORT = Number(getEnv('PORT', 4000));
const NODE_ENV = getEnv('NODE_ENV', 'development');
const HEALTHCHECK_PATH = getEnv('HEALTHCHECK_PATH', '/healthz');

// For CORS, allow the frontend origin; fallback to wildcard for dev.
const FRONTEND_ORIGIN = getEnv('REACT_APP_FRONTEND_URL', '');
const CORS_ORIGIN = FRONTEND_ORIGIN || getEnv('CORS_ORIGIN', '*');

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

// Middlewares
app.use(
  cors({
    origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(',').map((s) => s.trim()),
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));

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
    healthcheck: HEALTHCHECK_PATH,
  });
});

// Startup sequencing
async function start() {
  try {
    await connectDatabase();

    // Initialize Apollo Server 4 with Express at /graphql
    const server = new ApolloServer({
      typeDefs,
      resolvers: createResolvers(),
      introspection: NODE_ENV !== 'production',
    });
    await server.start();

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

    const httpServer = app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`[startup] Server listening on port ${PORT} (env=${NODE_ENV})`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      // eslint-disable-next-line no-console
      console.log(`[shutdown] Received ${signal}, closing server...`);
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
