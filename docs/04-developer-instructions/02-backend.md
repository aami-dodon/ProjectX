# Backend Module Development Guide

This guide documents how to extend the Express + Prisma server that powers Project X. Follow these practices to keep new API functionality consistent and observable.

## 1. Kickstarting API Work

1. Install dependencies and launch the dev server from the `server/` workspace:
   ```bash
   cd server
   npm install
   npm run dev
   ```
   The dev task boots Express with nodemon and reads configuration from the repository root `.env`. Update `.env.example` whenever you introduce a new variable so other developers can run the stack without guesswork.
2. Generate the Prisma client when you update the schema:
   ```bash
   npx prisma generate
   ```
   The command runs automatically on `npm install`, but execute it manually after editing `prisma/schema.prisma` to keep type-safe database bindings current.
3. Run quality gates before you open a pull request:
   ```bash
   npm test            # Jest + Supertest coverage for your modules
   npm run lint        # ESLint with the shared Node.js rules
   npm run format:check
   ```
   These commands mirror the CI pipeline defined for the server workspace.

> **Logging location:** All backend runtime logs rotate under `server/logs/`. Docker Compose mounts the same folder into `/app/logs` so containers and local runs share the directory. Keep this path out of version control.

## 2. Module Anatomy

Every feature under `server/src/modules` follows the same layering pattern. Use existing modules such as `health` and `auth` as blueprints.

- **`*.router.js`** – declares the Express routes and attaches middleware such as validators or authentication guards.
- **`*.controller.js`** – orchestrates request/response logic, delegating to services and translating domain errors into HTTP responses.
- **`*.service.js`** – hosts business logic and composes repositories, integrations, and utilities.
- **`*.repository.js`** – (optional) encapsulates Prisma access for the module. Keep SQL concerns out of services and controllers.

When you create a new module:

1. Scaffold the files above under `server/src/modules/<feature>/`.
2. Register the router inside `server/src/app.js` so the routes are reachable under the `/api` namespace. Follow the existing `health` and `auth` imports when wiring your router.

### Probe Management module

Probe orchestration now lives in `server/src/modules/probes/`. Use it as a reference when you need to add registry fields, new rollout actions, or scheduler behaviours:

- Repositories encapsulate all Prisma access under `repositories/`, then services compose them with SDK helpers (`sdk/ProbeClient.js`, `sdk/ProbeScheduler.js`, etc.).
- Workflows (`registerProbe.workflow.js`, `rolloutProbe.workflow.js`) handle multi-step operations and emit `probe.*` events so downstream systems stay informed.
- Every new route must be wired through `api/probes.router.js` with the appropriate `requirePermission` resource, and any new env knobs must be reflected in both `server/src/config/env.js` and `.env.example`.

### Check Management module

The governance engine now ships with a first-class Check Management stack under `server/src/modules/governance/`. The module is split into services (`checks/`), repositories, and controllers so you can extend definitions, executions, lifecycle events, or review queues independently:

- `checks.service.js` exposes CRUD logic for the `/api/governance/checks` catalogue, handles lifecycle validation (draft → ready → active → retired), and persists version snapshots in the `check_versions` table whenever definitions change.
- `execution.service.js` wraps ad-hoc runs, result pagination, and Bull-style scheduling helpers. It records executions in `check_results`, hydrates review-queue items for manual/hybrid flows, and emits `check.failed` events for downstream automation.
- `lifecycle.service.js` manages activation approvals, publishing review outcomes, and updating `review_queue_items` so Casbin policies and audit trails stay aligned.
- `repositories/` encapsulate the new Prisma models (`checks`, `check_control_links`, `review_queue_items`, `check_notifications`), including helpers for control coverage metrics consumed by the frontend dashboards.
- `governance.router.js` wires the routers beneath `/api/governance` with `requirePermission` guards for `governance:checks`, `governance:results`, and `governance:review-queue`. Keep new endpoints behind the same middleware stack (`authenticateRequest`, `attachAuditContext`).

When you introduce new check types or lifecycle states, update the shared enums in `server/prisma/schema.prisma`, regenerate the client, and extend the relevant service. Always emit `ApplicationError` objects so the frontend receives uniform error payloads, and remember to update `.env.example` if you add scheduler knobs or external integrations for governance checks.

### Framework Mapping module

Framework governance lives under `server/src/modules/frameworks/` and mirrors the layered architecture used elsewhere:

- **Routers** (`routers/frameworks.router.js`) mount under `/api/frameworks` and secure every route with `authenticateRequest`, `attachAuditContext`, and `requirePermission` guards for `frameworks:catalog`, `frameworks:controls`, `frameworks:mappings`, and `frameworks:versions`.
- **Services + repositories** orchestrate Prisma access to the new tables (`frameworks`, `framework_versions`, `framework_controls`, `framework_mappings`, and the history/import/export ledgers). Use `frameworks.service.js` for catalog metadata, `controls.service.js` for inline control CRUD, `mappings.service.js` for alignment workflows + coverage analytics, and `versions.service.js` for semantic publishes.
- **Prisma schema** additions live in `server/prisma/schema.prisma` alongside a dedicated migration; remember to regenerate the client after editing enums such as `FrameworkStatus`, `FrameworkVersionStatus`, and `FrameworkMappingStrength`.

When extending the module, keep mapping creation behind the history helpers in `mappings.service.js` so every change records a `framework_mapping_history` entry, and update the RBAC tables/documents whenever you add a new permission verb.

## 3. Request Lifecycle & Middleware

- Perform lightweight validation as close to the router as possible. Simple checks can live in the controller; complex workflows should add dedicated middleware inside the module.
- Wrap asynchronous controllers in `try/catch` blocks and forward unexpected errors with `next(error)` so the global handler in `server/src/middleware/errorHandler.js` can format the response.
- Preserve observability by passing each request through the logger middleware defined in `server/src/middleware/request-logger.js`. Avoid early `res.end` calls that would bypass logging and metrics.
- Surface domain-specific errors with `ApplicationError` instances from `server/src/utils/errors.js`. Set `statusCode`, `code`, and `details` to keep responses uniform.
- Enforce RBAC with the shared `requirePermission` middleware from `server/src/middleware/authorization.js`. Pair it with `authenticateRequest` when routes should respect Casbin policies instead of static role checks.

## 4. Database & Integrations

- Interact with PostgreSQL via the singleton Prisma client in `server/src/integrations/prisma.js`. Instantiate repositories per module to keep query logic cohesive.
- Define new tables or columns in `server/prisma/schema.prisma` and generate migrations using:
  ```bash
  npx prisma migrate dev --name <change-name>
  ```
  Commit the generated migration files alongside schema updates.
- Use the MinIO helper in `server/src/integrations/minio.js` for object storage interactions. Define clear MIME type and size validation when exposing new upload-style routes.
- Send transactional email through the transport exported from `server/src/integrations/mailer.js`. Compose templates in the relevant module service so they stay close to the triggering workflow.

## 5. Configuration & Environment

- Validate configuration inside `server/src/config/env.js`. Add new settings to the Zod schema, provide sensible defaults for local development, and document them in `.env.example`.
- The authentication stack expects JWT secrets, token TTLs, and reset/verification expiry windows. Define `AUTH_ACCESS_TOKEN_SECRET`, `AUTH_REFRESH_TOKEN_SECRET`, their TTL values, and the reset/verification timers (`AUTH_PASSWORD_RESET_TOKEN_TTL_MINUTES`, `AUTH_EMAIL_VERIFICATION_TOKEN_TTL_MINUTES`) in the environment so the auth service can hash, rotate, and expire credentials consistently. Mirror these keys in `.env.example` and keep the schema in sync.
- Keep `VITE_API_URL` in sync with the Express public base URL (without `/api`) whenever you expose new routes that the frontend consumes. Client paths already include the `/api` prefix.
- Treat secrets carefully—never commit real credentials. Use descriptive placeholder values in `.env.example` to indicate expected formats (URLs, tokens, etc.).

## 6. Testing Strategy

- Co-locate Jest unit tests under `__tests__` directories adjacent to the code they exercise (e.g. `server/src/modules/<feature>/__tests__`) when you need module-level coverage.
- Use Supertest to cover HTTP contracts. Mount routers against the Express app from `server/src/app.js` to ensure middleware and error handling behaviour remains intact.
- Keep end-to-end route suites in `server/tests` (mirroring the existing health and auth specs) so the Jest `testPathPattern=tests` configuration picks them up automatically.
- Stub third-party integrations (SMTP, MinIO) with Jest mocks. If a scenario requires multiple modules, extract shared fixtures into `server/tests/support` (create the folder when needed) so suites stay DRY.

## 7. Deployment Considerations

- Confirm migrations have been generated and applied before deploying new backend features.
- Ensure long-running jobs or scheduled tasks run idempotently—reuse the same logging conventions as request handlers via `createLogger('<module>')` from `server/src/utils/logger.js`.
- Document any manual operational steps (new cron jobs, bucket policies, SMTP credentials) in `docs/` so operators can repeat them during rollouts.

By following this backend guide, you’ll ship server features that are observable, well-tested, and consistent with the rest of Project X.
