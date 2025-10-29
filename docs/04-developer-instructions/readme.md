# Developer Onboarding Guide <!-- omit in toc -->

> **Purpose**
> This playbook gets new contributors productive in Project X by outlining the toolchain, repository layout, environment configuration, and day-to-day workflows expected across the monorepo.

---

## 1. Quickstart Checklist

1. **Install prerequisites** (Node.js 20+, npm 10+, Docker if you want to build the images locally).
2. **Clone the repository** and copy `.env.example` to `.env`, customising credentials for your local PostgreSQL, MinIO, SMTP, and client/server ports. The single `.env` file is read by both the Express server and the Vite dev server.
3. **Install dependencies** in each workspace:
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```
4. **Generate the Prisma client** – the server's `postinstall` hook runs `prisma generate` automatically when you install packages.
5. **Start services** in two terminals:
   ```bash
   cd server && npm run dev       # Express + nodemon on SERVER_PORT
   cd client && npm run dev       # Vite on CLIENT_PORT with shared env config
   ```
   The client reads `VITE_API_URL` from the same `.env` file and uses it as the Axios base URL (`client/src/shared/lib/client.js`).
6. **Run checks before committing:**
   ```bash
   cd server && npm test && npm run lint && npm run format:check
   cd client && npm run lint && npm run test
   ```
7. **Document changes** in `changelog.md` with an IST timestamp and commit once checks pass.

---

## 2. Repository Topography

| Path | Description |
| --- | --- |
| `client/` | Vite + React 19 SPA. Routing and layouts live under `src/app`, feature modules under `src/features`, and reusable primitives under `src/shared`. |
| `client/src/shared/lib` | Shared browser utilities including the configured Axios instance (`client.js`), logger helpers, and class name utilities. |
| `server/` | Express 4 API backed by Prisma. `src/index.js` bootstraps the app via `src/app.js`, wiring middleware, routers, and graceful shutdown. |
| `server/src/modules/*` | Feature modules (email, health diagnostics, uploads) split into `router`, `controller`, and `service` layers with repositories when needed. |
| `server/src/integrations` | Prisma client factory, MinIO helpers, and Nodemailer transport configuration. |
| `server/src/config` | Environment validation (`env.js`), Swagger setup, and shared assets (favicon, stylesheet) for API docs. |
| `docs/` | Authoritative documentation hub. Update the relevant collection whenever you add or modify features. |
| `docs/04-developer-instructions/frontend` | Frontend feature playbooks (routing, styling, and shadcn/ui conventions). |
| `docs/04-developer-instructions/backend` | Backend module playbooks covering Express patterns, Prisma usage, and testing. |
| `client/tests` | Vitest setup (`tests/setup.js`) plus component and hook specs. |
| `server/tests` | Jest + Supertest suites that exercise routers end-to-end. |
| `scripts/` | Automation helpers for docs generation and operational chores. |
| `docker-compose.yml` | Local orchestration entry point for running client and server containers against external PostgreSQL and MinIO services. |

Keep the monorepo JavaScript-only per the root `agents.md` brief. Shared frontend logic belongs in `client/src/shared`, and server-wide helpers belong under `server/src/utils`.

---

## 3. Environment Configuration

- Duplicate `.env.example` at the repo root and adjust:
  - `SERVER_PORT`, `CLIENT_PORT`, `VITE_API_URL` for local ports and proxy targets.
  - Database credentials (`DATABASE_URL`) targeting your development PostgreSQL instance.
  - MinIO access keys and bucket metadata (`MINIO_*`).
  - SMTP credentials (`EMAIL_*`) for notification testing.
  - CORS domains (`CORS_ALLOWED_ORIGINS`, `CLIENT_ALLOWED_HOSTS`) so the browser can reach the API.
  - Logging and diagnostics toggles such as `LOG_LEVEL` and `VITE_LOG_LEVEL`.
  - Dev-server niceties including `CLIENT_USE_SECURE_HMR` or `CLIENT_HMR_PROTOCOL` when tunnelling Vite over HTTPS.
- `server/src/config/env.js` validates all variables with Zod and exits early when required values are missing. Keep `.env.example` in sync with any new flags and provide sensible defaults.
- The client Vite config (`client/vite.config.js`) loads the same `.env` file, normalises dev server options, and enforces the `VITE_` prefix for browser-exposed settings.
- Never commit actual secrets—update `.env.example` if new configuration knobs are introduced.

---

## 4. Running the Stack

### Local Node processes

- **Backend:**
  ```bash
  cd server
  npm run dev         # Starts Express with nodemon on the port configured by SERVER_PORT
  npm test            # Runs the Jest + Supertest suite (includes Swagger contract checks)
  npm run lint        # ESLint with the shared Node configuration
  npm run format:check
  ```
- **Frontend:**
  ```bash
  cd client
  npm run dev         # Launches Vite dev server using CLIENT_* env toggles
  npm run build       # Produces static assets in client/dist
  npm run lint        # ESLint with the shared React configuration
  npm run test        # Vitest suite (jsdom + Testing Library)
  npm run preview     # Serves the production build locally
  ```

### Docker workflow

When you want to match the containerised runtime:
```bash
docker compose up --build
```
The compose file builds both services, injects values from `.env`, and exposes the configured ports. PostgreSQL and MinIO remain external services; supply reachable endpoints in `.env` before starting.

---

## 5. Coding Standards & Review Expectations

- Stick to JavaScript (no TypeScript) and follow ESLint + Prettier defaults defined in each workspace.
- Reuse shared Axios clients and helpers from `client/src/shared/lib` (notably `client.js` and `utils.js`) instead of redefining fetch logic inside features.
- Route new React pages via `client/src/app/routes.jsx`, exporting feature entry points from `client/src/features/<feature>/index.js`. Layout shells reside in `client/src/app/layouts`.
- Tailwind tokens live in `client/src/index.css`; extend design primitives through the existing `@theme` block and reuse shadcn/ui components under `client/src/shared/components/ui`.
- On the server, surface errors through `server/src/utils/error-handling.js` and structured logging via `server/src/utils/logger.js`. Keep middleware compatible with the request logger in `server/src/middleware/request-logger.js`.
- In the browser, prefer the shared logger (`client/src/shared/lib/logger.js`) so log levels respect `VITE_LOG_LEVEL` and payloads stay structured.
- Place new API routers under `server/src/modules/<feature>` following the existing controller/service patterns, and update `server/src/app.js` when wiring them in.
- Keep Prisma schema updates in `server/prisma/schema.prisma`; generate migrations with `npx prisma migrate dev --name <change>` and run `npm run lint` afterwards.
- Maintain API documentation via `server/src/config/swagger.js` whenever routes or schemas change.
- Capture UI updates with screenshots and attach them to PRs when applicable.

---

## 6. Testing, QA, and CI Readiness

- Backend CI expects `npm test` (Jest + Supertest) and `npm run lint` to succeed inside `server/`. Specs reside in `server/tests` and exercise routers against the configured Express app.
- Frontend checks cover `npm run lint` and `npm run test` (Vitest + Testing Library with setup in `client/tests/setup.js`).
- Log and audit significant events per the logging standards (Winston + Morgan) described in `agents.md`, and ensure errors funnel through the shared handler.

---

## 7. Collaboration Rituals

- Keep `changelog.md` current with IST timestamps for every merged change.
- Cross-link documentation updates in `docs/` when introducing new systems or altering workflows. Frontend-specific playbooks live in `docs/04-developer-instructions/frontend`, and backend module guidance lives in `docs/04-developer-instructions/backend`.
- Coordinate breaking changes via the #dev-updates channel and include migration notes in PR descriptions.
- Reference design guidance in `docs/04-developer-instructions/frontend/feature.md` when shipping visual changes.

By following this onboarding guide you’ll align with the existing workflows, keep environments reproducible, and ensure smooth collaboration across the Project X team.
