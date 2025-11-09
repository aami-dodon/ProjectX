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

### Control Management module

Control governance lives beside the check stack in `server/src/modules/governance/controls/` and keeps the canonical catalog, framework mappings, scoring pipeline, and remediation workflows in sync:

- **Schema additions:** The Prisma models `controls`, `control_framework_links`, `control_scores`, and `control_audit_events` track taxonomy metadata, framework/requirement mappings, cached score snapshots, and immutable lifecycle events. `check_control_links` now references `controls` so scoring can weight results by enforcement and risk tier.
- **Services:** `control.service.js` handles catalog CRUD, lifecycle validation (draft → active → deprecated), slug normalization, and audit logging. `mapping.service.js` validates framework IDs before swapping matrices, `scoring.service.js` materializes score histories from `check_results` using the weighted formula (`PASS=1`, `WARNING=0.5`, `FAIL/ERROR=0` scaled by enforcement + risk multipliers), and `lifecycle.service.js` raises remediation events for downstream Task/Notification systems.
- **Repositories:** `controls/repositories/control.repository.js` centralizes Prisma access (filters, aggregates, auditing, mapping writes, score upserts). Always go through the repository instead of calling Prisma directly so multi-step mutations stay transactional.
- **Router:** `governance.router.js` now exposes `/api/governance/controls` plus child endpoints for mappings, scores, archiving, and remediation. Protect routes with `requirePermission` resources `governance:controls`, `governance:controls:mappings`, and `governance:controls:remediation` to mirror Casbin policies.
- **Dashboards & scoring:** `overview/overview.service.js` materialises the `/api/governance/overview` response (posture summary, framework coverage, evidence matrix, and review queue stats). `POST /api/governance/runs` batches ad-hoc check executions via `runBatchExecutions`, and `POST /api/governance/recalculate` forces control score refreshes by calling `recalculateControlScores`. Wire these routes with `governance:overview` (`read`), `governance:checks` (`execute`), and `governance:scoring` (`recalculate`) permissions so the UI can hide/show affordances consistently.

Whenever you add new control states, coverage levels, or scoring dimensions, update `prisma/schema.prisma`, regenerate the client, and adjust both the service logic and the developer docs so the frontend dashboard and automation remain in lockstep.

### Reporting module

The dashboard + export stack lives in `server/src/modules/reports/` and ties together governance, task, and evidence telemetry.

- **Structure:** `reports.router.js` mounts beneath `/api/reports` with two controller families: dashboards (`controllers/dashboards.controller.js`) and exports (`controllers/exports.controller.js`). Services under `services/` compose dedicated repositories so controllers remain thin. Keep raw Prisma access inside `repositories/dashboards.repository.js` and `repositories/exports.repository.js` to reuse data projections across dashboards, cache warmers, and exports.
- **Schema:** New Prisma models (`report_scores`, `report_metrics`, `report_exports`, `report_audit_log`, `report_widgets`) plus enums (`ReportScoreGranularity`, `ReportMetricType`, `ReportExportFormat`, `ReportExportStatus`, `ReportExportType`) capture cached analytics, export jobs, and widget toggles. Add migrations whenever these structures change and run `npx prisma generate` so downstream layers stay type-safe.
- **Dashboards:** `dashboard.service.js` calls the repositories to aggregate framework posture, control health, remediation throughput, and evidence freshness, then persists lightweight snapshots via `persistMetricSnapshot`. A lightweight worker (`workers/cache.worker.js`) refreshes these metrics at the cadence defined by `REPORTS_CACHE_REFRESH_INTERVAL_MINUTES` (skipped during tests) so read paths stay warm.
- **Exports:** `exports.service.js` orchestrates export jobs (`createExportJob`, `retryExportJob`, `getExportJob`) and reuses the dashboard services to build datasets. Artifacts default to the MinIO bucket defined by `REPORTS_EXPORT_BUCKET` with signed URLs governed by `REPORTS_EXPORT_URL_EXPIRATION_SECONDS`. When MinIO is unavailable the service stores a base64 inline payload so operators can still download the artifact. Template serializers live in `templates/export-templates.js`; extend them whenever you add a new export type.
- **RBAC:** `policies/reports.policy.js` defines the `reports:dashboards` and `reports:exports` resources. Dashboard routes allow the analyst-oriented roles (admin, compliance officer, auditor, executive) while export writer routes restrict to admins/compliance officers. Update the Casbin seed and the RBAC docs when you introduce new actions.
- **Config:** Document any new env knobs in `.env.example` and mirror them inside `server/src/config/env.js`. Today the module expects `REPORTS_EXPORT_BUCKET`, `REPORTS_EXPORT_URL_EXPIRATION_SECONDS`, and `REPORTS_CACHE_REFRESH_INTERVAL_MINUTES`, alongside the existing MinIO settings that power signed URLs.

### Task Management module

Remediation workflows now live under `server/src/modules/tasks/`. The module mirrors the same layering pattern as governance/evidence, but adds schedulers and external sync adapters:

- **Structure:** Controllers (`controllers/tasks.controller.js`, `assignments.controller.js`, `integrations.controller.js`) sit above services (`task.service.js`, `lifecycle.service.js`, `escalation.service.js`, `evidence-sync.service.js`) and repositories (`task.repository.js`, `task-assignment.repository.js`, `task-metric.repository.js`). Keep Prisma access inside repositories so lifecycle/event logic stays deterministic.
- **Router & RBAC:** `tasks.router.js` mounts at `/api/tasks` and guards endpoints with `requirePermission` resources `tasks:records`, `tasks:assignments`, `tasks:evidence`, `tasks:metrics`, and `tasks:integrations`. Update `docs/05-user-guides/02-rbac.md` whenever you add a new verb so admins can seed matching Casbin policies.
- **Events & workflows:** SLA automation runs through `workflows/sla.scheduler.js` (hourly by default) and escalation logic in `escalation.service.js`. Verification requests enqueue via `workflows/verification.queue.js`, while external syncs fan out to the adapters in `integrations/jira.adapter.js` and `integrations/servicenow.adapter.js`. Publish lifecycle events with the helpers in `events/task.*.js` so notifications/dashboards can subscribe once.
- **Schema:** New Prisma models (`tasks`, `task_events`, `task_assignments`, `task_evidence_links`, `task_sla_metrics`) live at the bottom of `prisma/schema.prisma` with a matching migration. Regenerate the Prisma client after editing enums like `TaskStatus`, `TaskPriority`, or `TaskEvidenceStatus`.
- **Configuration:** Three env knobs control automation cadence—`TASK_SLA_CHECK_INTERVAL_MINUTES`, `TASK_ESCALATION_THRESHOLDS_MINUTES`, and `TASK_VERIFICATION_QUEUE_CONCURRENCY`. Keep them defined in `server/src/config/env.js` and `.env.example`, and document any new scheduler/settings in the same files.

Use this module whenever failed checks or manual remediation work needs a first-class API. Always append entries to `task_events` for auditability and emit `ApplicationError` instances so the frontend receives predictable payloads.

### Evidence Management module

The evidence backend lives under `server/src/modules/evidence/` and mirrors the same router/controller/service layering used elsewhere.

- **Router & RBAC:** `evidence.router.js` mounts beneath `/api/evidence` and protects routes with `requirePermission` resources `evidence:records`, `evidence:links`, and `evidence:retention`. The default Casbin seed grants admin/compliance roles the necessary actions—extend `src/modules/auth/casbin/policy.seed.json` whenever you add new verbs.
- **Controllers & services:**
  - `upload.controller.js` + `upload.service.js` validate upload payloads with `evidence.schemas.js`, ensure a retention policy exists (falling back to the default seeded by `ensureDefaultRetentionPolicy`), create the `evidence` + `evidence_links` rows, and return the presigned PUT from MinIO.
  - `download.controller.js` + `download.service.js` resolve the storage key, increment `downloadCount`, emit an `EvidenceEventAction.DOWNLOAD_ISSUED`, and return the short-lived GET URL.
  - `metadata.controller.js` + `metadata.service.js` cover listing/searching, metadata updates (with optional version bumps recorded via `evidence_versions`), retention summarisation, and link management. The retention helper (`tasks/retention.scheduler.js`) keeps archival/purge dates consistent.
- **Repositories & schema:** `repositories/evidence.repository.js` and `repositories/evidence-links.repository.js` wrap Prisma access to the `evidence`, `evidence_links`, `evidence_events`, `evidence_versions`, and `evidence_retention_policies` tables introduced in `server/prisma/migrations/20251228113000_add_evidence_management_system/migration.sql`. Always go through these repositories so transactions capture versions + events atomically.
- **Events & serialization:** `events/evidence.events.js` writes the audit-friendly ledger rows reused by the frontend timeline, and `evidence.serializers.js` centralises how evidence records are shaped for HTTP responses.

Follow the reference guide in `docs/03-systems/11-evidence-management-system/readme.md` whenever you add new filters, retention states, or integrations so docs and implementation stay in sync.

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
