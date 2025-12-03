# Integration Verification and Deployment Guide

## Overview
This guide provides a concise, actionable checklist to verify local integration and production deployments for EventSphere. It covers local dev validation, deployment steps for Vercel (frontend) and Render (backend), environment variable mappings, WebSocket and CORS considerations, and post-deploy validation and troubleshooting.

## Local Development Verification Checklist

### Prerequisites
- Backend: Node 18+, MongoDB Atlas (or local Mongo), environment configured.
- Frontend: Node 18+, Create React App-based build.
- Ensure backend CORS_ORIGIN includes http://localhost:3000.

### Environment Setup
- Backend (.env):
  - MONGODB_URI=<your_connection_string>
  - JWT_SECRET=<random_secret>
  - PORT=4000
  - NODE_ENV=development
  - CORS_ORIGIN=http://localhost:3000
  - WS_ENABLED=true
  - HEALTHCHECK_PATH=/healthz
  - LOG_LEVEL=debug
- Frontend (.env):
  - REACT_APP_BACKEND_URL=http://localhost:4000
  - REACT_APP_WS_URL=ws://localhost:4000
  - REACT_APP_FRONTEND_URL=http://localhost:3000
  - Optional flags: REACT_APP_API_BASE, REACT_APP_NODE_ENV=development, REACT_APP_HEALTHCHECK_PATH=/healthz, REACT_APP_FEATURE_FLAGS, REACT_APP_EXPERIMENTS_ENABLED, REACT_APP_LOG_LEVEL

### Start Services
- Backend: npm run dev (port 4000)
- Frontend: npm start (port 3000)

### Healthcheck and Connectivity
- Backend health:
  - GET http://localhost:4000/healthz returns { status: "ok", db: "connected" | "not_connected", ws: "enabled" }
- GraphQL HTTP endpoint:
  - POST http://localhost:4000/graphql with a simple query { __typename } responds OK.
- GraphQL WS (subscriptions):
  - Apollo DevTools or app Chat route shows successful connection.
  - Confirm ws connects to ws://localhost:4000/graphql and reconnects on reload.

### Seed Script
- Run backend seed:
  - npm run seed
  - Verify sample users, events, registrations, messages are created without duplicates (idempotent).

### Auth Flow
- Register:
  - Use Register page; verify token stored in localStorage under auth_token.
- Login:
  - Use Login page; verify Authorization headers on HTTP requests.
- Me query:
  - Navigate to Profile; verify user info renders.

### Events CRUD
- Create Event:
  - /events/new; submit form; verify event appears in list and detail.
- Update Event:
  - Edit an event you own; verify fields update.
- Delete Event:
  - Delete an event you own; verify removal from list.
- Access control:
  - Ensure you cannot edit/delete events you do not own unless admin.

### RSVP
- On Event Detail:
  - RSVP/Un-RSVP toggles; verify counts update and persists reload.

### Chat Subscription Live Update
- Open /chat in two browser windows:
  - Send message in one; verify message appears in both within a second.
  - Token included via connectionParams Authorization header.

### Dashboard Data Rendering
- Navigate to /dashboard:
  - Verify summary tiles, charts, and recent items render using GraphQL data.

## Deployment Guide

### Frontend on Vercel

#### Build Settings
- Framework Preset: Create React App (or Other if CRA auto-detected).
- Build Command: npm run build
- Output Directory: build

#### Environment Variables (Vercel Project Settings)
- REACT_APP_BACKEND_URL=https://<your-backend-onrender>.onrender.com
- REACT_APP_WS_URL=wss://<your-backend-onrender>.onrender.com
- REACT_APP_FRONTEND_URL=https://<your-frontend-onvercel>.vercel.app
- Optional:
  - REACT_APP_API_BASE (alias, if used)
  - REACT_APP_NODE_ENV=production
  - REACT_APP_NEXT_TELEMETRY_DISABLED=1
  - REACT_APP_ENABLE_SOURCE_MAPS=false (or true if needed)
  - REACT_APP_PORT (not used in Vercel, dev only)
  - REACT_APP_TRUST_PROXY=true
  - REACT_APP_LOG_LEVEL=warn
  - REACT_APP_HEALTHCHECK_PATH=/healthz
  - REACT_APP_FEATURE_FLAGS=chat,analytics
  - REACT_APP_EXPERIMENTS_ENABLED=false

Note: CRA only exposes variables prefixed with REACT_APP_. Ensure URLs do not include trailing slashes; the app appends /graphql.

#### Deploy Steps
1) Connect repository to Vercel and import project pointing to frontend_react_tailwind_app as root.
2) Configure Environment Variables above in Vercel (Production and Preview as needed).
3) Trigger first deployment; wait for build success.
4) After backend is live, confirm endpoints in the deployed frontend environment.

### Backend on Render

#### Service Type
- Web Service
- Runtime: Node
- Build Command: npm install
- Start Command: npm start
- Root Directory: backend_node_graphql_server

#### Environment Variables (Render)
- Required:
  - MONGODB_URI=<your_mongodb_atlas_uri>
  - JWT_SECRET=<random_secret>
- Recommended:
  - PORT=10000 (Render provides, or leave unset to use $PORT)
  - NODE_ENV=production
  - CORS_ORIGIN=https://<your-frontend-onvercel>.vercel.app
  - WS_ENABLED=true
  - HEALTHCHECK_PATH=/healthz
  - LOG_LEVEL=info
- Optional convenience:
  - REACT_APP_FRONTEND_URL=https://<your-frontend-onvercel>.vercel.app (fallback if CORS_ORIGIN not set)

CORS Guidance:
- For production: set CORS_ORIGIN to your exact Vercel domain. Multiple origins supported via comma-separated list.
- For local testing: include http://localhost:3000.

WebSocket Considerations:
- Enable WebSocket support in the Render service (Settings -> Web Sockets).
- Use wss:// for the frontend REACT_APP_WS_URL in production.
- Ensure WS path is /graphql (matches HTTP).

Healthcheck:
- Configure Render Health Check Path: /healthz (matches HEALTHCHECK_PATH).
- Render should show passing health checks after boot.

#### Deploy Steps
1) Create Web Service from the repo; set root to backend_node_graphql_server.
2) Configure environment variables.
3) Enable Web Sockets in Render settings.
4) Deploy and ensure health checks pass.
5) Note the Render hostname for use in the Vercel frontend env vars.

## Environment Variable Mapping

### Frontend (Vercel)
- REACT_APP_BACKEND_URL -> used by Apollo HTTP link: `${REACT_APP_BACKEND_URL}/graphql`
- REACT_APP_WS_URL -> used by Apollo WS link: `${REACT_APP_WS_URL}/graphql`
- REACT_APP_FRONTEND_URL -> used for absolute references and cross-links; also a hint for backend in some setups
- Optional flags: REACT_APP_API_BASE, REACT_APP_NODE_ENV, REACT_APP_NEXT_TELEMETRY_DISABLED, REACT_APP_ENABLE_SOURCE_MAPS, REACT_APP_PORT, REACT_APP_TRUST_PROXY, REACT_APP_LOG_LEVEL, REACT_APP_HEALTHCHECK_PATH, REACT_APP_FEATURE_FLAGS, REACT_APP_EXPERIMENTS_ENABLED

### Backend (Render)
- MONGODB_URI -> required for MongoDB
- JWT_SECRET -> required for JWT
- PORT -> Render sets $PORT; server reads PORT (defaults to 4000 locally)
- NODE_ENV -> production
- CORS_ORIGIN -> comma-separated origins or *
- WS_ENABLED -> true/false (default true)
- HEALTHCHECK_PATH -> /healthz
- LOG_LEVEL -> silent|error|warn|info|debug|trace
- REACT_APP_FRONTEND_URL -> optional fallback for CORS if CORS_ORIGIN not set

## Post-Deploy Validation

### Backend
- Healthcheck: GET https://<render-host>/healthz returns status: ok, db: connected, ws: enabled.
- GraphQL HTTP: POST https://<render-host>/graphql with { __typename } responds OK.
- Subscriptions: Connect via wss://<render-host>/graphql (observe successful connection and receive events).

### Frontend
- Load https://<vercel-host>/ and navigate app.
- Register/Login flows work; token stored; Authorization header sent.
- Events CRUD operations function end-to-end.
- RSVP on Event Detail works and persists.
- Chat shows real-time messages across two browser tabs.
- Dashboard renders server statistics and recent items.

## Quick Troubleshooting

- 401/403 on API:
  - Ensure token is set and Bearer header is present. Re-login to refresh token.
- CORS errors in console:
  - Confirm Render CORS_ORIGIN includes the exact Vercel origin and Authorization header allowed by default CORS.
- WS fails to connect in production:
  - Verify Render WebSocket support is enabled.
  - Ensure REACT_APP_WS_URL uses wss:// and points to the Render backend hostname (no trailing slash).
  - Confirm the path is /graphql.
- Healthcheck failing on Render:
  - Confirm HEALTHCHECK_PATH=/healthz in env and the service is listening on $PORT.
  - Check MongoDB connectivity (MONGODB_URI, IP allowlist).
- Mixed Content warnings:
  - When frontend uses https, ensure backend also uses https/wss endpoints.
- Seed data missing:
  - Run npm run seed on backend; verify idempotent behavior and console output.
- 404 on frontend routes after refresh:
  - Vercel handles SPA routes by default for CRA. If needed, ensure fallback rewrites to /index.html.

## Reference Pointers (Code)
- Frontend Apollo Client links and env usage:
  - frontend_react_tailwind_app/src/apollo/client.js
- Backend server configuration, CORS, WS, healthcheck:
  - backend_node_graphql_server/src/index.js
- Backend README with env and subscription details:
  - backend_node_graphql_server/README.md
- Frontend README with env and routes:
  - frontend_react_tailwind_app/README.md
