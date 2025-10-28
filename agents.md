# Project X – Contributor Operating Guide

## Core Principles
- Keep the repository JavaScript-only. Every runtime (React, Node.js, tooling, and tests) is authored in plain JS/JSX—do not introduce TypeScript or other languages.
- Prefer changes that are easy to maintain and extend; mirror existing patterns instead of inventing new ones.
- Treat the `client/` and `server/` workspaces as a coordinated monorepo. Shared conventions live in `docs/` and the reusable scripts under `scripts/`.

## Repository Layout
| Area | Purpose |
| --- | --- |
| `client/` | Vite-powered React 19 SPA that renders the operator dashboards, health tools, and auth flows. |
| `server/` | Express 4 API that exposes health diagnostics, storage helpers, and email utilities. Uses Prisma to talk to PostgreSQL and integrates with MinIO + SMTP. |
| `docs/` | Source of truth for product, architecture, and developer guides. Update these when behaviour or processes change. |
| `scripts/` | Bash utilities for scaffolding frontend features, provisioning MinIO buckets, and exporting documentation bundles. |

## Environment & Configuration
- `.env.example` documents every configuration flag consumed by both apps. Keep it current whenever you add or retire environment variables. Defaults in `server/src/config/env.js` backstop missing values during local development—mirror any new settings there too.
- Vite reads browser-exposed variables from `VITE_*`. The frontend currently depends on `VITE_API_URL` and optional HMR toggles (`CLIENT_USE_SECURE_HMR`, `CLIENT_HMR_PROTOCOL`).
- Docker Compose (`docker-compose.yml`) only builds the client and server containers. PostgreSQL and MinIO are assumed to be provided externally.

## Frontend Standards (`client/`)
- Vite config (`client/vite.config.js`) enables the `@` alias that maps to `client/src`. Keep imports alias-based; avoid relative path ladders.
- Organise product code under `client/src/features/<feature>`. Each feature exposes a public surface from its `index.js` (pages, hooks, route config) so the global router (`client/src/app/routes.jsx`) can stay declarative.
- Layouts live in `client/src/app/layouts`. When adding routes, reuse these shells instead of creating ad-hoc wrappers. The `scripts/scaffold-feature.sh` helper can scaffold new feature modules and register routes for you—extend it when layout or routing conventions evolve.
- Styling:
  - Tailwind CSS 4 + the `@tailwindcss/vite` plugin feed the design system via `client/src/index.css`. Extend design tokens through the existing `@theme inline` block rather than scattered CSS variables.
  - Reuse shadcn/ui primitives and shared components under `client/src/shared/components/ui`. Compose them with utilities from `client/src/shared/lib/utils.js` (`cn`) and keep variants declarative.
- API access goes through the shared Axios instance in `client/src/shared/lib/client.js`. Add interceptors or headers there, not inside individual features. Handle errors with the object shape returned by the interceptor rejection handler.
- Persist new UI behaviour with tests when practical (React Testing Library is not wired yet—if you introduce it, configure it inside `client/` and document the workflow).

## Backend Standards (`server/`)
- Express is initialised in `server/src/app.js`. Register new modules beneath `/api/v1` and keep them behind dedicated routers. Honour the existing 404 handler and global error middleware from `server/src/middleware/error-handler.js`.
- Module aliasing via `module-alias` resolves `@/` to `server/src`. Use it consistently for intra-server imports.
- Centralised error utilities live in `server/src/utils/error-handling.js`. Always throw/forward `ApplicationError` instances (via helpers like `createValidationError`) so responses stay uniform.
- Logging is provided by `server/src/utils/logger.js` (Winston + daily rotate). Produce structured logs and prefer contextual children from `createLogger('<module>')`. HTTP access logs flow through `server/src/middleware/request-logger.js`; keep new middleware compatible with this pipeline.
- Configuration is parsed and validated in `server/src/config/env.js` using Zod. Add new settings to the schema with defaults and ensure failures remain fatal outside of tests.
- Prisma is the sole database interface (`server/src/integrations/prisma.js`). Add repositories under feature modules (see `server/src/modules/health/repositories/health.repository.js`) and keep long-running logic inside services.
- Integrations:
  - MinIO client lives in `server/src/integrations/minio.js`. Reuse its helpers to create presigned URLs; keep uploads capped and MIME-checked as in `storage.router.js`.
  - SMTP transport is configured in `server/src/integrations/mailer.js`. Send emails through services (e.g., `server/src/modules/email/email.service.js`) and expose thin routers for operator actions.
- Health tooling demonstrates the preferred module anatomy (`controllers/`, `services/`, `repositories/`, `middleware/`). Follow this layout for new server features.
- Tests use Jest (`server/jest.config.js`). Co-locate tests with their modules under `server/src/**/__tests__` and respect the module alias mapping when you add coverage.

## Shared Workflow Expectations
- Update `changelog.md` with every user-visible change. Use Indian Standard Time (IST) timestamps in the format `YYYY-MM-DD HH:MM:SS IST` and append entries near the top.
- Maintain architectural and runbook documentation inside `docs/`. Align any new processes with the indexes (especially `docs/readme.md` and the section-specific `readme.md` files).
- Keep logging directories (`server/logs/`) out of version control—generated at runtime.
- When touching both apps, validate that the Axios base URL (`VITE_API_URL`) and server routes stay in sync. Health checks (`/api/v1/health`) power the `/health` dashboard, including MinIO/email diagnostics—avoid breaking these endpoints without coordinating frontend updates.
- Prefer npm for dependency management in both workspaces; lockfiles (`package-lock.json`) must stay in sync with `package.json` changes.

Following these guidelines keeps Project X consistent with the current implementation while leaving room for the planned AI governance capabilities documented under `docs/`.
