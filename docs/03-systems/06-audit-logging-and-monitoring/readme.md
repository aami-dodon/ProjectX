# Audit Logging and Monitoring <!-- omit in toc -->

## Location: /server/src/lib/logging

>### TL;DR
> The audit logging and monitoring system guarantees immutable, end-to-end visibility into security-critical activity.
> Built around `server/src/lib/logging/audit.js`, it captures structured events, enforces retention and tamper controls, and feeds observability pipelines for governance oversight.
> Use this guide to understand capture scope, storage contracts, operational safeguards, and developer instrumentation practices.

---

- [Backend Specification](#backend-specification)
  - [Location & Directory Layout](#backend-location--directory-layout)
  - [Capture Scope & Storage Pipelines](#capture-scope--storage-pipelines)
  - [Retention & Immutability Controls](#retention--immutability-controls)
- [Frontend Specification](#frontend-specification)
  - [Location & Directory Layout](#frontend-location--directory-layout)
  - [Reusable Components & UI Flows](#reusable-components--ui-flows)
- [Schema Specification](#schema-specification)
- [Operational Playbooks & References](#operational-playbooks--references)

---

## Backend Specification

### Backend Location & Directory Layout
Audit instrumentation is implemented under `server/src/lib/logging`, exposing shared helpers and transports that every service consumes for structured event capture.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L124-L171】

```
server/src/lib/logging/
├── audit.ts
├── middleware/
│   ├── attach-audit-context.ts
│   └── request-metadata.ts
├── transports/
│   ├── winston-console.ts
│   ├── winston-file.ts
│   └── winston-https.ts
├── formatters/
│   ├── redact-fields.ts
│   └── correlation.ts
├── retention/
│   └── glacier-archiver.ts
└── tests/
    └── audit.logger.spec.ts
```

#### Core Modules & Responsibilities
- **`audit.ts`:** Factory that returns a Winston logger scoped to the calling module, wraps JSON serialization, and enforces shared default fields (`service`, `tenant`, `correlationId`).
- **`middleware/attach-audit-context.ts`:** Express middleware that injects tenant, actor, and request metadata, aligning with Casbin-based RBAC enforcement before handlers run.【F:docs/01-about/04-security-and-data-protection.md†L182-L259】【F:docs/02-technical-specifications/06-security-implementation.md†L58-L109】
- **`formatters/redact-fields.ts`:** Utility that masks sensitive attributes (PII, credentials) according to the data classification policy and privacy constraints.【F:docs/01-about/04-security-and-data-protection.md†L120-L169】
- **`retention/glacier-archiver.ts`:** Cron-safe job that packages batches for cold storage, publishes integrity hashes, and updates the ledger tables.
- **`transports/winston-https.ts`:** Streams structured events into the centralized log collector (OpenSearch, Loki, Splunk) with mTLS enforced per environment.【F:docs/02-technical-specifications/01-system-architecture.md†L204-L224】

#### API Endpoints & Event Contracts
- **REST hooks:** `/api/v1/audit/events` (ingest events from trusted services), `/api/v1/audit/exports` (generate signed archive manifests), `/api/v1/audit/ledger/:batchId` (validate integrity) – secured via service tokens with Casbin scopes `audit:write`, `audit:read`, and `audit:verify` respectively.【F:docs/02-technical-specifications/06-security-implementation.md†L58-L144】
- **Event bus topics:**
  - `audit.event.appended.v1` — emitted for every persisted event and consumed by Notification and Task services to trigger escalations.【F:docs/03-systems/04-notification-system/readme.md†L7-L184】【F:docs/03-systems/13-task-management-system/readme.md†L7-L226】
  - `audit.archive.created.v1` — signals completion of immutable snapshots so Evidence Management can reconcile retention schedules.【F:docs/02-technical-specifications/04-database-design.md†L148-L162】
  - `audit.breakglass.access.v1` — broadcast when privileged access is granted, aligning with emergency access procedures.【F:docs/01-about/04-security-and-data-protection.md†L253-L260】

#### Configuration & Environment Controls
- **Environment variables:** `AUDIT_TRANSPORTS`, `AUDIT_REMOTE_ENDPOINT`, `AUDIT_RETENTION_DAYS`, `AUDIT_GLACIER_VAULT`, `AUDIT_LEDGER_SALT`. Secrets are delivered through the platform’s secret management process with dual control and rotation windows aligned to security council directives.【F:docs/01-about/08-operations-and-teams.md†L124-L170】【F:docs/02-technical-specifications/01-system-architecture.md†L204-L235】
- **Initialization:** `server/src/index.js` loads `attach-audit-context` ahead of route registration to guarantee traceability for every request path, including health checks and integration callbacks.
- **Deployment:** Container builds must include the `winston-*` transports and `@opentelemetry/api` peer dependency, matching the logging guidance in the system architecture overview.【F:docs/02-technical-specifications/01-system-architecture.md†L227-L235】

#### Observability & Metrics
- Metrics exported via OpenTelemetry counters (`audit_events_total`, `audit_failures_total`, `audit_latency_seconds`) feed Datadog and Grafana dashboards managed by the Security & Compliance squad to satisfy 24/7 monitoring commitments.【F:docs/01-about/08-operations-and-teams.md†L29-L170】
- Log ingestion lag, archive duration, and ledger verification failures emit to Prometheus alert rules with routing through Notification’s high-priority channel set.【F:docs/03-systems/04-notification-system/readme.md†L7-L184】
- Weekly automated conformance reports reconcile SIEM counts with PostgreSQL partitions to prove end-to-end completeness.

### Capture Scope & Storage Pipelines
- **Capture Scope:** Log authentication events, privileged actions, configuration changes, data exports, workflow transitions, critical business operations, and system lifecycle events. Each entry includes timestamp (UTC), actor identity, action, target resource, request origin, and outcome.
- **Application Layer:** Winston transports emit structured JSON tagged with `category: "audit"` and correlation IDs. Logs write to rotating files (≤24 hours) for local debugging and to stdout for container capture.
- **Centralized Logging:** HTTPS or sidecar agents stream audit events into dedicated indices/streams (OpenSearch, Loki, Splunk) with RBAC-separated access from general application logs.
- **Developer Instrumentation:** Teams use `auditLogger` helpers, mask sensitive fields via `redactFields`, attach request/session IDs, and validate with `npm run lint:audit` and `npm run test:audit` before merging.
- **Event shape:**

  ```json
  {
    "timestamp": "2026-06-04T12:34:56.123Z",
    "service": "governance-engine",
    "actor": { "id": "user_123", "role": "compliance_officer" },
    "action": "CONTROL_OVERRIDE_APPROVED",
    "target": { "type": "control", "id": "ctl-42001-17" },
    "origin": { "ip": "203.0.113.10", "userAgent": "Mozilla/5.0" },
    "correlationId": "req-abc-123",
    "outcome": "success",
    "hash": "sha256:e3f6…",
    "redactions": ["justification"]
  }
  ```
- **Integrity pipeline:** After local persistence, events are batched every 5 minutes, hashed with the ledger salt, written to `audit_integrity_ledger`, and forwarded to cold storage when the archive job runs. Failed batches raise `audit.event.retry` metrics and open remediation tasks for the operations squad.【F:docs/02-technical-specifications/04-database-design.md†L97-L183】【F:docs/03-systems/13-task-management-system/readme.md†L7-L226】

### Retention & Immutability Controls
- **Retention Policies:** Maintain centralized audit data for ≥36 months (minimum regulatory floor 400 days) and extend per jurisdiction. Archive immutable snapshots to object storage (WORM) every 30 days for at least seven years; purge local file transports after 24 hours once uploads succeed.
- **Tamper Protection:** Enforce append-only permissions on audit indices; restrict delete rights to security/compliance with change-control approval. WORM storage (S3 Glacier Vault Lock equivalents) protects archives, while batch hashes stored in an integrity ledger detect tampering.
- **Monitoring & Alerting:** Feed audit streams into the SIEM for correlation. Alert on privilege escalations, repeated denials, or failed admin logins, with dashboards tracking event volume and failure rates linked to triage runbooks.
- **Partitioning:** PostgreSQL tables follow monthly partitions with automatic retention policies and ledger checkpoints to align with the database design’s partitioning guidance.【F:docs/02-technical-specifications/04-database-design.md†L55-L162】
- **Regulatory alignment:** Retention schedules mirror the privacy and accountability commitments defined in the security and data protection overview, ensuring transparency, lawful access, and audit-ready reporting.【F:docs/01-about/04-security-and-data-protection.md†L120-L180】

## Frontend Specification

### Frontend Location & Directory Layout
Audit visibility surfaces in the governance console under `client/src/features/observability/audit`, providing dashboards and review tooling for security teams.【F:docs/02-technical-specifications/03-frontend-architecture.md†L96-L160】

```
client/src/features/observability/audit/
├── pages/
│   ├── AuditTimelinePage.tsx
│   ├── AuditReviewQueuePage.tsx
│   └── RetentionPolicyPage.tsx
├── components/
│   ├── AuditEventTable.tsx
│   ├── IntegrityHashViewer.tsx
│   └── BreakGlassRequestModal.tsx
├── hooks/
│   ├── useAuditStream.ts
│   └── useRetentionPolicies.ts
└── api/
    └── auditClient.ts

client/src/components/security/
└── CriticalAlertBanner.tsx
```

### Reusable Components & UI Flows
- **Audit Timeline:** `AuditEventTable` streams events with filters for actor, resource, and outcome, embedding links to SIEM dashboards for deeper analysis.
- **Review Queue:** `AuditReviewQueuePage` manages quarterly integrity checks, break-glass approvals, and remediation tracking, using `BreakGlassRequestModal` to capture justification and expiry.
- **Retention Administration:** `RetentionPolicyPage` visualizes lifecycle status (hot, warm, archive) and integrates with `useRetentionPolicies` to modify schedules under dual-control workflows.
- **Critical Alerts:** `CriticalAlertBanner` surfaces SIEM-driven incidents, linking responders to runbooks and providing context from correlated audit entries.
- **State management:** Hooks use React Query caching keyed by `tenantId` and `timeRange`, ensuring least-privilege data access while honoring operations governance for secure, agile delivery.【F:docs/01-about/08-operations-and-teams.md†L29-L139】【F:docs/02-technical-specifications/03-frontend-architecture.md†L96-L160】
- **Accessibility:** All tables render with keyboard navigation, aria-live regions for streaming updates, and redaction badges that mirror privacy-by-design commitments.【F:docs/01-about/04-security-and-data-protection.md†L165-L180】

#### API & Data Contracts
- `auditClient.ts` exposes `listEvents`, `getLedgerBatch`, `requestArchiveExport`, and `acknowledgeAlert` methods built on the shared HTTP client, applying JWT tokens and Casbin scopes from the Auth service.【F:docs/02-technical-specifications/06-security-implementation.md†L58-L109】
- WebSocket subscriptions use `/ws/v1/audit/stream` with token re-auth every 30 minutes; reconnect logic abides by exponential backoff policies shared across observability features.
- Filters persist via URL search params and Redux-backed feature flags so admins can share deep links during compliance reviews.

## Schema Specification
- **`audit_events` (central index/table):** Timestamp, actor, action, target, request origin, outcome, correlation ID, hash, and redaction metadata.
- **`audit_archives`:** Records monthly snapshot manifests, storage location, hash digests, and WORM lock identifiers.
- **`audit_access_requests`:** Tracks break-glass approvals, requester, approver, reason, scope, and expiration.
- **`audit_integrity_ledger`:** Stores cryptographic signatures for batches, enabling tamper verification across archives.
- Relationships integrate with RBAC subjects, Notification escalations, and Task Service remediation tickets to maintain traceability.【F:docs/03-systems/13-task-management-system/readme.md†L7-L226】
- Schema definitions follow Prisma models managed within the externally hosted PostgreSQL cluster, inheriting partitioning, retention, and encryption strategies from the database design specification.【F:docs/02-technical-specifications/04-database-design.md†L41-L183】
- Access controls map to Casbin policies, ensuring roles (Admin, Auditor, Compliance Officer) retrieve only scoped records in alignment with RBAC commitments.【F:docs/02-technical-specifications/06-security-implementation.md†L80-L109】

## Operational Playbooks & References

### Access Restrictions & Review Processes
- Grant read-only access to security, compliance, and incident response roles; default-deny engineering access. Temporary investigative access follows break-glass procedures with approval logging and expiry enforcement.
- Schedule weekly automated reports summarizing critical events for security leadership sign-off, plus quarterly formal reviews documenting retention adherence, integrity checks, and remediation status in the compliance tracker.
- Post-review action items convert into Task Service tickets, and outcomes feed Operations governance dashboards to uphold KPI visibility for leadership.【F:docs/01-about/08-operations-and-teams.md†L142-L170】【F:docs/03-systems/13-task-management-system/readme.md†L7-L226】

### Related Documentation
- [Admin & Configuration System](../05-admin-and-configuration-system/readme.md) — change governance and audit event producers.
- [Notification System](../04-notification-system/readme.md) — escalation channels for high-risk events.
- [Security Implementation Specification](../../02-technical-specifications/06-security-implementation.md) — SIEM integrations and tamper controls.
- [Deployment & Environment Guide](../../02-technical-specifications/08-deployment-and-environment-guide.md) — logging sidecar and retention configuration per environment.

### Implementation Checklist
- Confirm middleware registration for `attach-audit-context` in every Express app before route definitions, ensuring consistent trace metadata.【F:docs/02-technical-specifications/01-system-architecture.md†L204-L235】
- Write unit tests for new audit events (`audit.logger.spec.ts`) plus integration tests exercising ledger updates and archive exports; include them in CI by invoking `npm run test:audit` and retaining ≥90% coverage to satisfy QA policy.【F:docs/02-technical-specifications/09-testing-and-qa.md†L1-L120】
- Update Prisma schema migrations when introducing new audit entities, run `npm run migrate:audit`, and coordinate with DevOps for external Postgres promotion as described in the database design guide.【F:docs/02-technical-specifications/04-database-design.md†L41-L162】
- Document operational impacts (new alerts, retention changes) in the weekly security council briefing so governance, compliance, and operations squads maintain shared situational awareness.【F:docs/01-about/08-operations-and-teams.md†L124-L170】

---

[← Previous](../05-admin-and-configuration-system/readme.md) | [Next →](../07-probe-management-system/readme.md)
