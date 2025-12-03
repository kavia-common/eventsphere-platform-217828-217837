# EventSphere Frontend (React + Tailwind + Apollo)

Modern, responsive React SPA for the EventSphere platform. Connects to a GraphQL backend for events, authentication, chat (subscriptions), and dashboards. Styled with TailwindCSS using the "Ocean Professional" theme.

## Quick Start

1) Install dependencies
   npm install

2) Configure environment
   - Copy .env.example to .env
   - Set the following at minimum:
     - REACT_APP_BACKEND_URL: HTTP base of your GraphQL server (Apollo uses `${REACT_APP_BACKEND_URL}/graphql` if not present)
       - Dev example: http://localhost:4000 (http, not ws)
       - You may also set the full path: http://localhost:4000/graphql
       - Render/Prod example: https://your-backend.onrender.com (or full path with /graphql)
     - REACT_APP_WS_URL: WS base for subscriptions (Apollo uses `${REACT_APP_WS_URL}/graphql` if not present)
       - Dev example: ws://localhost:4000 (use ws:// for local HTTP)
       - With SSL: wss://your-backend.onrender.com (use wss:// when frontend is https)
   - Mixed content: If the frontend runs on https, the HTTP endpoint must also be https (or use a proxy) to avoid mixed-content blocking.
   - Diagnostics: In development, Apollo prints the resolved HTTP and WS URLs to the console for troubleshooting.
   - Optional: Adjust REACT_APP_API_BASE, REACT_APP_FRONTEND_URL, and other flags to suit your environment.
   - Ensure backend CORS_ORIGIN includes your frontend origin (e.g., http://localhost:3000) and that both expose/expect /graphql for HTTP and WS.

3) Run the app
   npm start
   - Opens http://localhost:3000 by default (change via REACT_APP_PORT)

4) Build for production
   npm run build

## Environment Variables

Create React App only exposes variables prefixed with REACT_APP_. The app expects these keys (see .env.example for defaults):

- REACT_APP_API_BASE: Optional convenience alias for API base URL
- REACT_APP_BACKEND_URL: Base HTTP URL for GraphQL (Apollo appends /graphql)
- REACT_APP_FRONTEND_URL: Absolute URL for this frontend
- REACT_APP_WS_URL: Base WS/WSS URL for GraphQL subscriptions (Apollo appends /graphql)
- REACT_APP_NODE_ENV: development | production | test (affects Apollo devtools)
- REACT_APP_NEXT_TELEMETRY_DISABLED: Keeps telemetry off in monorepos/CI (1/0)
- REACT_APP_ENABLE_SOURCE_MAPS: Enable source maps in builds (true/false)
- REACT_APP_PORT: Dev server port (default 3000)
- REACT_APP_TRUST_PROXY: If app runs behind reverse proxies/CDNs (true/false)
- REACT_APP_LOG_LEVEL: Client log detail (silent|error|warn|info|debug|trace)
- REACT_APP_HEALTHCHECK_PATH: Path used by health checks (/healthz)
- REACT_APP_FEATURE_FLAGS: Comma-separated features (e.g., chat,analytics)
- REACT_APP_EXPERIMENTS_ENABLED: Toggle experimental UI (true/false)

Important endpoint notes:
- Apollo Client builds endpoints by appending /graphql:
  - HTTP: `${REACT_APP_BACKEND_URL}/graphql`
  - WS: `${REACT_APP_WS_URL}/graphql`
- Ensure your backend exposes both HTTP and WS endpoints and CORS allows the frontend origin.

## Available Routes

- /            Home
- /events      Landing for events
- /events/list Filterable events list (GraphQL)
- /events/new  Create event (Protected)
- /events/:id  Event details (GraphQL + RSVP)
- /dashboard   Dashboard (Protected)
- /chat        Real-time chat (Protected, GraphQL subscriptions)
- /profile     Profile (Protected)
- /login       Login
- /register    Register

Protected routes:
- Routes wrapped with ProtectedRoute require a valid JWT in localStorage under key auth_token. After login, user is redirected to the originally requested route.

## Apollo Client

- Configured in src/apollo/client.js with split links:
  - HTTP (queries/mutations) via REACT_APP_BACKEND_URL
  - WS (subscriptions) via REACT_APP_WS_URL
- Adds Authorization header (Bearer <token>) from localStorage.auth_token
- connectToDevTools enabled when REACT_APP_NODE_ENV !== 'production'

## TailwindCSS Theme

- Tailwind config sets "Ocean Professional" palette:
  - primary: #2563EB
  - secondary/success: #F59E0B
  - error: #EF4444
- Utility components:
  - .btn-primary, .card defined in src/index.css
- Global gradient background via from-blue-500/10 to-gray-50

## Scripts

- npm start   Start CRA dev server
- npm test    Run tests (Jest)
- npm run build  Production build

## Troubleshooting

- Ensure REACT_APP_BACKEND_URL and REACT_APP_WS_URL are correct and reachable.
- For secure deployments use wss:// for WS endpoint.
- CORS: Backend should allow the frontend origin and headers (Authorization).

## License

MIT (or project-specific)
