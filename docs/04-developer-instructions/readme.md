# Developer Onboarding Guide <!-- omit in toc -->

> **Purpose**
> This playbook gets new contributors productive in Project X by outlining the toolchain, repository layout, environment configuration, and day-to-day workflows expected across the monorepo.

---

## 1. Quickstart Checklist

1. **Install prerequisites** (Node.js 20+, npm 10+, Docker if you want to build the images locally).
2. **Clone the repository** and copy `.env.example` to `.env`, customising credentials for your local PostgreSQL, MinIO, SMTP, and client/server ports.
3. **Install dependencies** in each workspace:
   ```bash
   npm install           # From /workspace/Project-X for shared tooling (if present)
   cd server && npm install
   cd ../client && npm install
   ```
4. **Generate Prisma client** automatically via `npm install` (runs `prisma generate`).
5. **Start services** in two terminals:
   ```bash
   cd server && npm run dev
   cd client && npm run dev
   ```
   The Vite dev server proxies API requests to the Express backend using `VITE_API_URL` from your `.env` file.
6. **Run checks before committing:** `cd server && npm test`, `cd client && npm run lint`.
7. **Document changes** in `changelog.md` with an IST timestamp and commit once tests pass.

---

## 2. Repository Topography

| Path | Description |
| --- | --- |
| `client/` | Vite + React application, organised by feature slices under `src/features` with shared primitives in `src/shared`. |
| `server/` | Express API with Prisma ORM, feature modules under `src/`, OpenAPI tooling in `src/config/swagger.js`, and policies/templates for auth, governance, evidence, and notifications. |
| `shared/` | Cross-cutting JavaScript utilities; currently home to the centralised error handling helpers consumed by both tiers. |
| `docs/` | Authoritative documentation hub. Update the relevant collection when you add or modify features. |
| `scripts/` | Automation helpers for docs generation and operational chores. |
| `prompts/`, `reference/` | Design language, UI references, and conversational assets that align UX and AI integrations. |
| `docker-compose.yml` | Local orchestration entry point for running client and server containers against external PostgreSQL and MinIO services. |

Keep the monorepo JavaScript-only per the root `agents.md` brief. Shared logic goes into `shared/` instead of duplicating utilities in each package.

---

## 3. Environment Configuration

- Duplicate `.env.example` at the repo root and adjust:
  - `SERVER_PORT`, `CLIENT_PORT`, `VITE_API_URL` for local ports.
  - Database credentials (`DATABASE_URL`) targeting your development PostgreSQL instance.
  - MinIO access keys and bucket metadata (`MINIO_*`).
  - SMTP credentials (`EMAIL_*`) for notification testing.
  - CORS domains (`CORS_ALLOWED_ORIGINS`, `CLIENT_ALLOWED_HOSTS`) so the browser can reach the API.
- For frontend variables exposed to the browser **you must use the `VITE_` prefix** to satisfy Vite’s environment rules.
- Never commit actual secrets—update `.env.example` if new configuration knobs are introduced.

---

## 4. Running the Stack

### Local Node processes

- **Backend:**
  ```bash
  cd server
  npm run dev        # Starts Express with nodemon on the port configured by SERVER_PORT
  npm test           # Runs swagger contract checks then Jest + Supertest suites
  ```
- **Frontend:**
  ```bash
  cd client
  npm run dev        # Launches Vite dev server using CLIENT_* env toggles
  npm run build      # Produces static assets in client/dist
  npm run lint       # ESLint with the shared React configuration
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
- Reuse shared Axios clients (`client/src/lib/client.js`) and centralized error handling (`server/src/utils/error-handling.js`).
- Register new React routes via `client/src/app/routes.jsx`, exporting feature entry points from `client/src/features/<feature>/index.js`.
- Keep Prisma schema updates in `server/prisma/schema.prisma`, generate migrations with `npx prisma migrate dev --name <change>`.
- Manage Casbin policies in `server/src/policies/` and email templates under `server/src/templates/email/`.
- Update OpenAPI metadata alongside any API change (`server/src/config/swagger.js`).
- Capture UI updates with screenshots and attach them to PRs when applicable.

---

## 6. Testing, QA, and CI Readiness

- Backend CI expects `npm test` to succeed (Swagger contract validation + Jest suite).
- Frontend linting (`npm run lint`) must pass before you open a pull request.
- Add targeted tests for new business logic or UI behaviour to prevent regressions.
- Log and audit significant events per the logging standards (Winston + Morgan) described in `agents.md` and ensure errors funnel through the shared handler.

---

## 7. Collaboration Rituals

- Keep `changelog.md` current with IST timestamps for every merged change.
- Cross-link documentation updates in `docs/` when introducing new systems or altering workflows.
- Coordinate breaking changes via the #dev-updates channel and include migration notes in PR descriptions.
- Reference design guidance in `docs/04-developer-instructions/frontend` when shipping visual changes.

By following this onboarding guide you’ll align with the existing workflows, keep environments reproducible, and ensure smooth collaboration across the Project X team.
