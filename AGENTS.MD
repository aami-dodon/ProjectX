# Project X – Contributor Operating Guide

## Core Principles
- Keep the repository JavaScript-only. Every runtime (React, Node.js, tooling, and tests) is authored in plain JS/JSX—do not introduce TypeScript or other languages.
- Prefer changes that are easy to maintain and extend; mirror existing patterns instead of inventing new ones.
- Treat the `client/` and `server/` workspaces as a coordinated monorepo. Shared conventions live in `docs/` and the reusable scripts under `scripts/`.
- Always reconcile code changes with the developer handbooks in `docs/04-developer-instructions`. If a workflow or convention differs, update both the implementation and the relevant guide so they stay in lockstep.

## Quickstart & Required Checks
1. **Environment setup**
   - Install Node.js 20+, npm 10+, and Docker (optional, for container builds).
   - Copy `.env.example` to `.env` at the repository root and customise values for PostgreSQL, MinIO, SMTP, and local ports. The single `.env` file feeds both the Express server and the Vite dev server.
2. **Install dependencies**
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```
3. **Daily development**
   - Start the server with `cd server && npm run dev`.
   - Start the client with `cd client && npm run dev`.
   - Regenerate the Prisma client after schema updates with `npx prisma generate` (runs automatically on install).
4. **Pre-commit checklist**
   ```bash
   cd server && npm test && npm run lint && npm run format:check
   cd client && npm run lint && npm run test
   ```
   Run these commands locally before opening a PR. Align with CI by resolving all linting, formatting, and test failures.
5. **Container parity**
   - Use `docker compose up --build` when you need to replicate the container runtime. Ensure `.env` has valid external PostgreSQL and MinIO endpoints before starting.

## Repository Layout
| Area | Purpose |
| --- | --- |
| `client/` | Vite-powered React SPA that renders the operator dashboards, health tools, and auth flows. Routing lives under `src/app`, features under `src/features`, and shared primitives under `src/shared`. |
| `server/` | Express 4 API that exposes health diagnostics, storage helpers, and email utilities. Uses Prisma to talk to PostgreSQL and integrates with MinIO + SMTP. |
| `docs/` | Source of truth for product, architecture, and developer guides. Update these when behaviour or processes change. |
| `scripts/` | Bash utilities for scaffolding frontend features, provisioning MinIO buckets, and exporting documentation bundles. |

## Environment & Configuration
- `.env.example` documents every configuration flag consumed by both apps. Keep it current whenever you add or retire environment variables. Defaults in `server/src/config/env.js` backstop missing values during local development—mirror any new settings there too.
- Vite reads browser-exposed variables from `VITE_*`. The frontend depends on `VITE_API_URL` (base URL only, without `/api`) and optional logging/HMR toggles: `VITE_LOG_LEVEL`, `CLIENT_USE_SECURE_HMR`, `CLIENT_HMR_PROTOCOL`.
- Docker Compose (`docker-compose.yml`) builds the client and server containers only. PostgreSQL and MinIO are assumed to be provided externally.
- Do not commit secrets. Use descriptive placeholders in `.env.example` and update the docs when configuration knobs change.

## Frontend Standards (`client/`)
- Vite config (`client/vite.config.js`) uses `vite-tsconfig-paths` with `client/jsconfig.json` so the `@` alias maps to `client/src`. Keep imports alias-based; avoid relative path ladders.
- Organise product code under `client/src/features/<feature>`. Each feature exposes a public surface from its `index.js` (pages, hooks, route config) so the global router (`client/src/app/routes.jsx`) can stay declarative.
- Layouts live in `client/src/app/layouts`. When adding routes, reuse these shells instead of creating ad-hoc wrappers. The `scripts/scaffold-feature.sh` helper can scaffold new feature modules and register routes for you—extend it when layout or routing conventions evolve.
- Styling:
  - Tailwind CSS 4 + the `@tailwindcss/vite` plugin feed the design system via `client/src/index.css`. Extend design tokens through the existing `@theme inline` block rather than scattered CSS variables.
  - Reuse shadcn/ui primitives and shared components under `client/src/shared/components/ui`. Compose them with utilities from `client/src/shared/lib/utils.js` (`cn`) and keep variants declarative.
- API access goes through the shared Axios instance in `client/src/shared/lib/client.js`. Add interceptors or headers there, not inside individual features. Handle errors with the object shape returned by the interceptor rejection handler.
- Persist new UI behaviour with tests when practical (React Testing Library via Vitest). Co-locate specs with their feature or use `client/tests` for cross-feature suites.
- Capture significant UI changes with screenshots and attach them to PRs when applicable.

## Backend Standards (`server/`)
- Express is initialised in `server/src/app.js`. Register new modules beneath `/api` and keep them behind dedicated routers. Honour the existing 404 handler and global error middleware from `server/src/middleware/errorHandler.js`.
- Module aliasing via `module-alias` resolves `@/` to `server/src`. Use it consistently for intra-server imports.
- Follow the module layering pattern (`router` → `controller` → `service` → `repository`) under `server/src/modules/<feature>`. Keep Prisma-specific logic inside repositories and business rules inside services.
- Centralised error utilities live in `server/src/utils/errors.js`. Always throw/forward `ApplicationError` instances (via helpers like `createValidationError`) so responses stay uniform.
- Logging is provided by `server/src/utils/logger.js` (Winston + daily rotate). Produce structured logs and prefer contextual children from `createLogger('<module>')`. HTTP access logs flow through `server/src/middleware/request-logger.js`; keep new middleware compatible with this pipeline.
- Configuration is parsed and validated in `server/src/config/env.js` using Zod. Add new settings to the schema with defaults and ensure failures remain fatal outside of tests.
- Prisma is the sole database interface (`server/src/integrations/prisma.js`). Add repositories under feature modules (see `server/src/modules/health/repositories/health.repository.js`) and keep long-running logic inside services.
- Integrations:
  - MinIO client lives in `server/src/integrations/minio.js`. Reuse its helpers to create presigned URLs; keep uploads capped and MIME-checked as in `storage.router.js`.
  - SMTP transport is configured in `server/src/integrations/mailer.js`. Send emails through services (e.g., `server/src/modules/email/email.service.js`) and expose thin routers for operator actions.
- Co-locate Jest unit tests under `__tests__` folders or inside `server/tests` for end-to-end suites. Mock external integrations and ensure routes are exercised through the configured Express app.

## Shared Workflow Expectations
- Update `changelog.md` with every user-visible change. Use Indian Standard Time (IST) timestamps in the format `YYYY-MM-DD HH:MM:SS IST` and append entries near the top.
- Maintain architectural and runbook documentation inside `docs/`. Align any new processes with the indexes (especially `docs/readme.md` and the section-specific `readme.md` files).
- Keep logging directories (`server/logs/`, `client/logs/`) out of version control—generated at runtime.
- When touching both apps, validate that the Axios base URL (`VITE_API_URL`) and server routes stay in sync. Health checks (`/api/health`) power the `/health` dashboard, including MinIO/email diagnostics—avoid breaking these endpoints without coordinating frontend updates.
- Prefer npm for dependency management in both workspaces; lockfiles (`package-lock.json`) must stay in sync with `package.json` changes.
- Reference the frontend and backend developer guides (`docs/04-developer-instructions/*.md`) when planning changes, and update them alongside code when conventions evolve.

Following these guidelines keeps Project X consistent with the current implementation while leaving room for the planned AI governance capabilities documented under `docs/`.
