# External Integrations System <!-- omit in toc -->

## Location: /server/src/integrations

>### TL;DR
> This document catalogs Project X's third-party integrations, covering supported connectors, authentication models, data synchronization patterns, and operational runbooks.
> For every integration we highlight configuration steps, environment variables, failure-handling playbooks, and how the connector ties into notifications, tasks, and evidence lifecycle.
> Use this reference when onboarding new environments, planning releases, or troubleshooting production incidents.

---

- [Backend Specification](#backend-specification)
  - [Location & Directory Layout](#backend-location--directory-layout)
  - [Core Modules & Responsibilities](#core-modules--responsibilities)
  - [Configuration & Secrets Governance](#configuration--secrets-governance)
  - [REST & Webhook Endpoints](#rest--webhook-endpoints)
  - [Schedulers & Data Flow](#schedulers--data-flow)
  - [Data Contracts & Mapping](#data-contracts--mapping)
  - [Observability, Testing & Quality Gates](#observability-testing--quality-gates)
- [Frontend Specification](#frontend-specification)
  - [Location & Directory Layout](#frontend-location--directory-layout)
  - [UI State & Data Access Patterns](#ui-state--data-access-patterns)
  - [Reusable Components & UI Flows](#reusable-components--ui-flows)
- [Schema Specification](#schema-specification)
- [Operational Playbooks & References](#operational-playbooks--references)
  - [Environment Configuration](#environment-configuration)
  - [Daily Checks & Incident Response](#daily-checks--incident-response)
  - [Release & Compliance Readiness](#release--compliance-readiness)
  - [Related Documentation](#related-documentation)

---

## Backend Specification

### Backend Location & Directory Layout
Integration connectors live under `server/src/integrations`, each exposing configuration, authentication, synchronization, and failure-handling logic reused by governance modules.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L53-L68】

```
server/src/integrations/
├── servicenow/
│   ├── client.js
│   ├── mapper.js
│   └── scheduler.js
├── jira/
├── onetrust/
├── slack/
├── email-bridge/
├── evidence-providers/
└── shared/
    ├── auth.js
    ├── scheduler.js
    └── telemetry.js
```

### Core Modules & Responsibilities
- **Integration Registry (`registry.js`):** Declares connector metadata (capabilities, scopes, feature flags) and enforces naming conventions aligned with the platform-wide JavaScript implementation standard.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L41-L68】【F:docs/02-technical-specifications/07-integration-architecture.md†L49-L66】
- **Base Connector (`shared/connector-base.js`):** Provides lifecycle hooks (`configure`, `authenticate`, `sync`, `handleWebhook`, `teardown`) so all connectors share retries, error normalization, and audit logging.
- **Service Clients (`<connector>/client.js`):** Wrap third-party SDKs/REST APIs with opinionated helpers for pagination, rate limiting, and concurrency budgets.
- **Mappers (`<connector>/mapper.js`):** Convert external payloads into governance domain entities (notifications, tasks, evidence) while enforcing schema validation before data leaves the integration boundary.【F:docs/03-systems/13-task-management-system/readme.md†L52-L109】【F:docs/03-systems/11-evidence-management-system/readme.md†L51-L101】
- **Schedulers & Workers (`<connector>/scheduler.js`):** Register BullMQ queues and background jobs responsible for polling and reconciliation tasks.
- **Shared Utilities (`shared/`):** Centralize OAuth flows, credential caching, telemetry emitters, and secret-resolution logic so connectors inherit proven patterns.【F:docs/02-technical-specifications/07-integration-architecture.md†L53-L142】

### Configuration & Secrets Governance
- Connector configuration is persisted via the Admin & Configuration system; secrets (client IDs, client secrets, signing keys) are injected at runtime from the platform vault and rotated through dual-control workflows.【F:docs/03-systems/05-admin-and-configuration-system/readme.md†L25-L118】
- All credentials are encrypted at rest, transmitted via TLS, and scoped to least-privilege permissions consistent with security-by-design expectations (AES-256 at rest, TLS 1.2+ in transit, tenant isolation).【F:docs/01-about/04-security-and-data-protection.md†L74-L177】
- Emergency rotations trigger admin workflows, Notification alerts, and follow-up Task assignments so downstream systems acknowledge the change window before resuming syncs.【F:docs/03-systems/05-admin-and-configuration-system/readme.md†L59-L118】【F:docs/03-systems/04-notification-system/readme.md†L47-L120】【F:docs/03-systems/13-task-management-system/readme.md†L52-L109】

### REST & Webhook Endpoints
- **Admin APIs (`/api/v1/integrations`):** CRUD endpoints expose catalog metadata, configuration schemas, and installation state. Requests/response bodies follow the OpenAPI-driven REST conventions (resource-centric routes, JSON envelopes, JWT authorization).【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L196-L248】
- **Credential APIs (`/api/v1/integrations/:id/credentials`):** Issue credential setup links, validate scoped tokens, and kick off rotation workflows managed by Admin services.【F:docs/03-systems/05-admin-and-configuration-system/readme.md†L25-L118】
- **Health APIs (`/api/v1/integrations/:id/health` & `/metrics`):** Surface heartbeat timestamps, recent job outcomes, queue depth, and SLA compliance for dashboards and SRE monitors.【F:docs/03-systems/07-probe-management-system/readme.md†L120-L133】
- **Inbound Webhooks (`/api/v1/integrations/:type/webhook`):** Validate HMAC signatures or JWT assertions, enqueue payloads for async processing, and emit structured audit entries before invoking mappers.【F:docs/02-technical-specifications/07-integration-architecture.md†L123-L186】
- **Outbound Webhooks/Partner APIs:** When connectors publish events to customer systems, payloads inherit governance metadata (control IDs, evidence URIs, correlation IDs) and respect retry/backoff strategies defined in the integration framework.【F:docs/02-technical-specifications/07-integration-architecture.md†L123-L186】

### Schedulers & Data Flow
- Polling jobs run on named BullMQ queues (e.g., `integrations:servicenow:sync`) with idempotency keys, concurrency caps, and exponential backoff policies. Each job logs start/end markers, error stacks, and correlation IDs consumed by audit pipelines.【F:docs/02-technical-specifications/07-integration-architecture.md†L53-L142】
- Webhook handlers push raw payloads to durable queues before enrichment to protect against downtime and rate limits. Replay logic uses deduplication hashes stored alongside `integration_events`.
- Task, Notification, and Evidence modules subscribe to integration events to create remediation items, dispatch alerts, or attach imported evidence, maintaining cross-system traceability.【F:docs/03-systems/04-notification-system/readme.md†L47-L170】【F:docs/03-systems/13-task-management-system/readme.md†L52-L109】【F:docs/03-systems/11-evidence-management-system/readme.md†L51-L101】
- Probe-managed schedules and blackout windows coordinate with integration workers so maintenance events or regulatory quiet periods suspend outbound communication gracefully.【F:docs/03-systems/07-probe-management-system/readme.md†L120-L133】

### Data Contracts & Mapping
- **ServiceNow:** OAuth 2.0 client credentials; syncs `incident`, `change_request`, and custom tables. Mappers enforce field parity for priority, state, assignment group, evidence links, and ServiceNow correlation IDs.【F:docs/02-technical-specifications/07-integration-architecture.md†L97-L122】
- **Jira:** Supports PAT (server) and OAuth 1.0a (cloud). Synchronizes issue status, comments, assignees, and custom fields referencing control/task identifiers. Bidirectional updates respect SLA transitions defined by Task Management policies.【F:docs/02-technical-specifications/07-integration-architecture.md†L103-L119】【F:docs/03-systems/13-task-management-system/readme.md†L52-L109】
- **OneTrust:** API-key based ingestion of policy inventory, risk registers, and assessment outcomes to enrich control metadata and evidence references.【F:docs/02-technical-specifications/07-integration-architecture.md†L109-L119】【F:docs/03-systems/11-evidence-management-system/readme.md†L51-L101】
- **Slack:** Bot tokens with scoped permissions deliver alert threads, interactive approvals, and slash-command callbacks. Connectors correlate Slack message IDs with Notification delivery entries for end-to-end acknowledgment tracking.【F:docs/02-technical-specifications/07-integration-architecture.md†L114-L119】【F:docs/03-systems/04-notification-system/readme.md†L47-L132】
- **Email/Webhook Bridge:** Normalizes inbound email/webhook payloads into governance events, verifying DKIM/signatures, parsing attachments, and queuing evidence ingestion jobs with retention policies derived from security requirements.【F:docs/02-technical-specifications/07-integration-architecture.md†L123-L186】【F:docs/01-about/04-security-and-data-protection.md†L118-L169】
- **Evidence Providers (S3, SharePoint, etc.):** Honor tenant retention, encryption, and residency policies before transferring artifacts into the Evidence Management domain.【F:docs/03-systems/11-evidence-management-system/readme.md†L51-L116】【F:docs/01-about/04-security-and-data-protection.md†L126-L169】

### Observability, Testing & Quality Gates
- Structured logs emit `integration.*` events with correlation IDs and sanitized payload snapshots routed into the audit logging pipeline.【F:docs/03-systems/06-audit-logging-and-monitoring/readme.md†L7-L160】
- Metrics exported (success rate, latency, queue depth, credential expiry counters) feed Grafana dashboards and alert thresholds aligned with probe heartbeat SLAs.【F:docs/03-systems/07-probe-management-system/readme.md†L120-L133】
- Automated tests cover contract validation (JSON schema fixtures), sandbox API simulations, and regression suites executed during CI/CD with OpenAPI contract checks and mocked third-party responses.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L221-L248】
- Canary deployments run in staging tenants using feature flags before promoting connectors to production, ensuring safe rollout per integration governance policies.【F:docs/03-systems/05-admin-and-configuration-system/readme.md†L59-L118】

## Frontend Specification

### Frontend Location & Directory Layout
Integration administration UI lives in `client/src/features/integrations`, exposing configuration consoles, health dashboards, and credential management flows.【F:docs/02-technical-specifications/03-frontend-architecture.md†L83-L140】

```
client/src/features/integrations/
├── pages/
│   ├── IntegrationCatalogPage.tsx
│   ├── IntegrationDetailPage.tsx
│   ├── CredentialManagementPage.tsx
│   └── IntegrationHealthPage.tsx
├── components/
│   ├── IntegrationConfigForm.tsx
│   ├── CredentialRotationWizard.tsx
│   ├── SyncStatusTable.tsx
│   └── FailureRunbookPanel.tsx
├── hooks/
│   ├── useIntegrations.ts
│   ├── useIntegrationHealth.ts
│   └── useCredentialRotations.ts
└── api/
    └── integrationsClient.ts
```

### UI State & Data Access Patterns
- Feature-level hooks wrap Axios clients with cached SWR-style fetching, optimistic updates for configuration edits, and error channels aligned with global notification context.【F:docs/02-technical-specifications/03-frontend-architecture.md†L83-L140】
- Local state stores pending credential secrets in memory only; sensitive values never persist to local storage to honor frontend security posture (JWT headers, CSRF tokens, CSP).【F:docs/02-technical-specifications/03-frontend-architecture.md†L123-L160】
- Access control uses RBAC-aware route guards so only authorized roles see credential forms or rotation actions, matching platform-wide least privilege policies.【F:docs/01-about/04-security-and-data-protection.md†L81-L199】

### Reusable Components & UI Flows
- **Catalog & Detail:** Lists available connectors, status, environment bindings, and quick actions. Detail pages show configuration, credentials, sync schedules, recent runs, and linked tasks or notifications for context.
- **Credential Management:** `CredentialRotationWizard` orchestrates dual-approval flows, captures change-ticket IDs, and calls rotation APIs; success transitions emit toast + inline alerts referencing Notification runbooks.【F:docs/03-systems/05-admin-and-configuration-system/readme.md†L59-L118】【F:docs/03-systems/04-notification-system/readme.md†L47-L132】
- **Health Monitoring:** `SyncStatusTable` and `IntegrationHealthPage` display queue depth, failure counts, SLA timers, and heartbeat markers with drill-down links into Task remediation views.【F:docs/03-systems/07-probe-management-system/readme.md†L120-L133】【F:docs/03-systems/13-task-management-system/readme.md†L52-L109】
- **Runbooks:** `FailureRunbookPanel` surfaces connector-specific troubleshooting steps, environment matrices, and escalation targets, ensuring operators follow documented pathways before triggering incident management.

## Schema Specification
- **`integration_configs`:** Stores connector type, environment, credentials (encrypted), scopes, schedules, webhook secrets, approval metadata, and feature-flag bindings.
- **`integration_runs`:** Logs synchronization executions with timestamps, status, error codes, latency, payload hashes, and downstream entity references (task IDs, notification IDs, evidence IDs).
- **`integration_events`:** Records inbound/outbound webhook deliveries, retries, deduplication hashes, and delivery statuses for replay and audit.
- **`integration_credentials_audit`:** Tracks rotation history, approvers, expiry dates, dual-control attestations, and incident links.
- **`integration_health_metrics`:** Aggregated KPIs for dashboards (success rate, latency, backlog depth, heartbeat lag) with rollups by tenant and connector.
- Relationships tie into Notification, Task, Evidence, and Governance modules to maintain end-to-end traceability for third-party interactions.【F:docs/03-systems/04-notification-system/readme.md†L47-L170】【F:docs/03-systems/13-task-management-system/readme.md†L52-L109】【F:docs/03-systems/11-evidence-management-system/readme.md†L51-L101】

## Operational Playbooks & References

### Environment Configuration
- Maintain environment-specific matrices for endpoints, credentials, scopes, rate limits, and feature flags. Use the Admin & Configuration system to manage secrets, tenant overrides, and staged rollout toggles.【F:docs/03-systems/05-admin-and-configuration-system/readme.md†L25-L118】
- Validate integrations in staging with sandbox credentials before production rollout; execute change-management checklists covering smoke tests, audit logging verification, and rollback plans.【F:docs/02-technical-specifications/07-integration-architecture.md†L49-L186】
- Enforce encryption, segregation, and residency requirements when storing mirrored datasets or evidence artifacts to satisfy enterprise security principles.【F:docs/01-about/04-security-and-data-protection.md†L118-L169】

### Daily Checks & Incident Response
- Monitor scheduled jobs, webhook failures, credential expirations, and heartbeat gaps via shared dashboards. Alerts route through Notification channels and escalate using Task workflows when SLAs breach.【F:docs/03-systems/04-notification-system/readme.md†L47-L170】【F:docs/03-systems/13-task-management-system/readme.md†L52-L109】【F:docs/03-systems/07-probe-management-system/readme.md†L120-L133】
- Incident response playbooks detail escalation paths, rollback procedures, communication channels, and evidence capture requirements. Post-incident reviews create governance tasks and update runbooks stored alongside integration metadata.【F:docs/03-systems/05-admin-and-configuration-system/readme.md†L59-L118】【F:docs/03-systems/06-audit-logging-and-monitoring/readme.md†L7-L160】

### Release & Compliance Readiness
- Coordinate releases with Admin feature flags, ensuring connectors pass automated contract tests and manual smoke validations before toggling to production tenants.【F:docs/03-systems/05-admin-and-configuration-system/readme.md†L59-L118】
- Export OpenAPI specs, schema migrations, and audit evidence for compliance reviews; attach to Evidence Management records for traceability.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L196-L248】【F:docs/03-systems/11-evidence-management-system/readme.md†L51-L101】
- Confirm alignment with platform security posture (encryption, least privilege, monitoring) ahead of external audits or regulator attestations.【F:docs/01-about/04-security-and-data-protection.md†L74-L199】

### Related Documentation
- [Notification System](../04-notification-system/readme.md) — alert routing for integration failures and acknowledgment flows.
- [Task Management System](../13-task-management-system/readme.md) — remediation tracking for connector incidents and SLA enforcement.
- [Evidence Management System](../11-evidence-management-system/readme.md) — evidence ingestion from external sources and retention policies.
- [Admin & Configuration System](../05-admin-and-configuration-system/readme.md) — credential governance, rollout controls, and secret rotation workflows.
- [Probe Management System](../07-probe-management-system/readme.md) — scheduler coordination, heartbeat expectations, and shared monitoring patterns.

---

[← Previous](../14-dashboard-and-reporting-system/readme.md) | [Next →](../01-user-management-system/readme.md)
