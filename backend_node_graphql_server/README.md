# EventSphere Backend (Node + Express + GraphQL skeleton)

Minimal backend container skeleton with:
- Express server
- Mongoose MongoDB connection
- dotenv configuration helper
- CORS + logging (morgan)
- Healthcheck endpoint

GraphQL setup includes JWT-based authentication, role-based guards, and secure mutations.

## Quick Start

1) Install dependencies
   npm install

2) Create environment
   cp .env.example .env
   # Edit values as needed

3) Run in dev (with nodemon)
   npm run dev

4) Healthcheck
   GET http://localhost:4000/healthz (or set HEALTHCHECK_PATH)

## Environment Variables

See .env.example for details. Required:
- MONGODB_URI
- JWT_SECRET

Optional:
- PORT (default 4000)
- NODE_ENV (development|production|test)
- CORS_ORIGIN (comma-separated origins or * for any)
- WS_ENABLED (true|false)
- HEALTHCHECK_PATH (default /healthz)
- LOG_LEVEL (silent|error|warn|info|debug|trace)  Controls pino log level

## Frontend integration

Frontend expects:
- HTTP: `${REACT_APP_BACKEND_URL}/graphql`
- WS: `${REACT_APP_WS_URL}/graphql` (graphql-ws protocol)

Environment cross-links:
- Set CORS_ORIGIN to include your frontend URL (e.g., http://localhost:3000). Multiple origins supported via comma-separated list.
- HEALTHCHECK_PATH should remain consistent with frontend REACT_APP_HEALTHCHECK_PATH (default /healthz).
- For local dev:
  - Backend: PORT=4000, CORS_ORIGIN=http://localhost:3000
  - Frontend: REACT_APP_BACKEND_URL=http://localhost:4000, REACT_APP_WS_URL=ws://localhost:4000
- The server will also accept REACT_APP_FRONTEND_URL to infer CORS if CORS_ORIGIN is not set, but CORS_ORIGIN takes precedence.

See .env.example in both backend and frontend for canonical variables.

## Authentication (JWT) and RBAC

- Register and Login mutations return:
  {
    "token": "<JWT>",
    "user": { "id": "...", "email": "...", "name": "...", "role": "user|admin" }
  }

- Clients must send the token on subsequent requests via:
  Authorization: Bearer <JWT>

- Roles:
  - user: can create events and modify/delete only those they organize.
  - admin: can update/delete any event.

- Example GraphQL:

mutation Register {
  register(input: { name: "Demo", email: "demo@example.com", password: "password123" }) {
    token
    user { id email role }
  }
}

mutation Login {
  login(email: "demo@example.com", password: "password123") {
    token
    user { id email role }
  }
}

query Me {
  me { id email role }
}

mutation CreateEvent {
  createEvent(input: { title: "My Event", type: "online" }) {
    id
    title
    organizer { id email }
  }
}

## Scripts

- npm start  Start server (prod)
- npm run dev  Start with nodemon
- npm run health  Quick env validation
- npm run seed  Seed sample users, events, registrations, and messages (idempotent)

## Notes

- Ensure MongoDB is reachable (local or Atlas).
- CORS_ORIGIN must include the frontend origin (e.g., http://localhost:3000).

## GraphQL Subscriptions (WebSocket, graphql-ws)

- WS endpoint: `${REACT_APP_WS_URL}/graphql` (same path as HTTP)
- Protocol: graphql-ws
- Auth: Send JWT using connectionParams with Authorization header semantics:
  connectionParams: { Authorization: "Bearer <JWT>" }

Example client (Apollo):
const wsLink = new GraphQLWsLink(createClient({
  url: `${REACT_APP_WS_URL}/graphql`,
  connectionParams: () => {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}));

Available subscriptions:
- subscription { eventUpdated { action id event { id title } } }
- subscription($roomId: ID!) { messageAdded(roomId: $roomId) { id text user { id name } } }

Environment:
- WS_ENABLED=true enables the WebSocket server (default true).

## Performance: DataLoaders

- Context now includes per-request DataLoaders to prevent N+1 queries:
  - loaders.userById: batch loads Users by id
  - loaders.eventById: batch loads Events by id
- Resolvers should prefer ctx.loaders.* instead of Model.findById in loops.

Example:
const user = await ctx.loaders.userById.load(userId);

## Logging: Pino

- Pino logger integrated with LOG_LEVEL (default info) and NODE_ENV.
- In development, pretty logs are enabled; production emits JSON logs.
- Access via ctx.log in resolvers or getLogger() in modules.

ENV:
- LOG_LEVEL: silent|error|warn|info|debug|trace

## Standardized Errors

- Use utils/errors to throw consistent errors with GraphQL extensions:
  - errors.unauthenticated(), errors.forbidden(), errors.badRequest(msg), errors.notFound(resource), errors.conflict(msg)
- Server maps any thrown error to GraphQLError via formatError, with safe extensions.

