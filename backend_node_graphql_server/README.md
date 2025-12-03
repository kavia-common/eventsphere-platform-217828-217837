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
- LOG_LEVEL (silent|error|warn|info|debug|trace)

## Frontend integration

Frontend expects:
- HTTP: `${REACT_APP_BACKEND_URL}/graphql`
- WS: `${REACT_APP_WS_URL}/graphql`

This skeleton does not yet expose /graphql. In future steps, add Apollo Server or graphql-yoga at /graphql and enable WebSocket if WS_ENABLED=true.

## Scripts

- npm start  Start server (prod)
- npm run dev  Start with nodemon
- npm run health  Quick env validation
- npm run seed  Seed sample users, events, registrations, and messages (idempotent)

## Notes

- Ensure MongoDB is reachable (local or Atlas).
- CORS_ORIGIN must include the frontend origin (e.g., http://localhost:3000).
