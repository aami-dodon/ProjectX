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

### Capture Scope & Storage Pipelines
- **Capture Scope:** Log authentication events, privileged actions, configuration changes, data exports, workflow transitions, critical business operations, and system lifecycle events. Each entry includes timestamp (UTC), actor identity, action, target resource, request origin, and outcome.
- **Application Layer:** Winston transports emit structured JSON tagged with `category: "audit"` and correlation IDs. Logs write to rotating files (≤24 hours) for local debugging and to stdout for container capture.
- **Centralized Logging:** HTTPS or sidecar agents stream audit events into dedicated indices/streams (OpenSearch, Loki, Splunk) with RBAC-separated access from general application logs.
- **Developer Instrumentation:** Teams use `auditLogger` helpers, mask sensitive fields via `redactFields`, attach request/session IDs, and validate with `npm run lint:audit` and `npm run test:audit` before merging.

### Retention & Immutability Controls
- **Retention Policies:** Maintain centralized audit data for ≥36 months (minimum regulatory floor 400 days) and extend per jurisdiction. Archive immutable snapshots to object storage (WORM) every 30 days for at least seven years; purge local file transports after 24 hours once uploads succeed.
- **Tamper Protection:** Enforce append-only permissions on audit indices; restrict delete rights to security/compliance with change-control approval. WORM storage (S3 Glacier Vault Lock equivalents) protects archives, while batch hashes stored in an integrity ledger detect tampering.
- **Monitoring & Alerting:** Feed audit streams into the SIEM for correlation. Alert on privilege escalations, repeated denials, or failed admin logins, with dashboards tracking event volume and failure rates linked to triage runbooks.

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

## Schema Specification
- **`audit_events` (central index/table):** Timestamp, actor, action, target, request origin, outcome, correlation ID, hash, and redaction metadata.
- **`audit_archives`:** Records monthly snapshot manifests, storage location, hash digests, and WORM lock identifiers.
- **`audit_access_requests`:** Tracks break-glass approvals, requester, approver, reason, scope, and expiration.
- **`audit_integrity_ledger`:** Stores cryptographic signatures for batches, enabling tamper verification across archives.
- Relationships integrate with RBAC subjects, Notification escalations, and Task Service remediation tickets to maintain traceability.【F:docs/03-systems/13-task-management-system/readme.md†L7-L226】

## Operational Playbooks & References

### Access Restrictions & Review Processes
- Grant read-only access to security, compliance, and incident response roles; default-deny engineering access. Temporary investigative access follows break-glass procedures with approval logging and expiry enforcement.
- Schedule weekly automated reports summarizing critical events for security leadership sign-off, plus quarterly formal reviews documenting retention adherence, integrity checks, and remediation status in the compliance tracker.

### Related Documentation
- [Admin & Configuration System](../05-admin-and-configuration-system/readme.md) — change governance and audit event producers.
- [Notification System](../04-notification-system/readme.md) — escalation channels for high-risk events.
- [Security Implementation Specification](../../02-technical-specifications/06-security-implementation.md) — SIEM integrations and tamper controls.
- [Deployment & Environment Guide](../../02-technical-specifications/08-deployment-and-environment-guide.md) — logging sidecar and retention configuration per environment.

---

[← Previous](../05-admin-and-configuration-system/readme.md) | [Next →](../07-probe-management-system/readme.md)
