# Probe Management System <!-- omit in toc -->

## Location: /server/src/modules/probes

>### TL;DR
> The Probe Management System orchestrates how evidence-collection probes are registered, deployed, scheduled, and monitored across environments.
> It exposes a Probe SDK (implemented in `server/src/modules/probes`) that standardizes authentication, retries, payload schemas, and version negotiation.
> This guide explains lifecycle workflows, API contracts, configuration patterns, and operational practices for integrating probes with enterprise systems.

---

- [Backend Specification](#backend-specification)
  - [Location & Directory Layout](#backend-location--directory-layout)
  - [System Components](#system-components)
  - [Probe Lifecycle](#probe-lifecycle)
  - [Probe SDK & Platform Behaviors](#probe-sdk--platform-behaviors)
- [Frontend Specification](#frontend-specification)
  - [Location & Directory Layout](#frontend-location--directory-layout)
  - [Reusable Components & UI Flows](#reusable-components--ui-flows)
- [Schema Specification](#schema-specification)
- [Operational Playbooks & References](#operational-playbooks--references)

---

## Backend Specification

### Backend Location & Directory Layout
Probe orchestration and SDK utilities live in `server/src/modules/probes`, coordinating registry APIs, deployment workflows, scheduling, and health monitoring.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L124-L171】

```
server/src/modules/probes/
├── api/
│   ├── probes.controller.ts
│   ├── deployments.controller.ts
│   └── schedules.controller.ts
├── services/
│   ├── registry.service.ts
│   ├── deployment.service.ts
│   ├── scheduler.service.ts
│   └── health.service.ts
├── sdk/
│   ├── ProbeClient.ts
│   ├── ProbeScheduler.ts
│   ├── ProbeHealthClient.ts
│   └── ProbeConfigLoader.ts
├── events/
│   ├── probe.heartbeat.ts
│   ├── probe.evidence.ts
│   └── probe.failure.ts
├── workflows/
│   ├── registerProbe.workflow.ts
│   └── rolloutProbe.workflow.ts
└── tests/
    └── probe.management.spec.ts
```

### System Components
- **Registry Service:** Persists probe metadata (ID, owner, framework bindings, evidence types, version) and exposes `/api/probes` CRUD operations, lifecycle transitions, credential issuance, and environment overlays.
- **Deployment Coordinator:** Generates manifests from registry templates and environment overlays, integrates with CI/CD to build/tag artifacts, publishes deployment intents, and tracks rollout states for auditability.
- **Scheduler & Execution Plane:** Maintains cron, event-driven, and ad-hoc schedules through `ProbeScheduler`, translating definitions into orchestration primitives (Kubernetes CronJobs, Airflow DAGs, serverless invocations) with tenant-isolated sandboxes.
- **Observability & Alerting:** Streams heartbeat, status, and metrics into OpenTelemetry collectors (Prometheus + Loki), normalizing logs with probe identifiers and control mappings for correlation.

### Probe Lifecycle
1. **Registration:** Engineers submit metadata, evidence schemas, and supported frameworks via `/api/probes` or the admin UI. `registerProbe.workflow.ts` validates schemas, capabilities, and authentication modes before Governance admins approve environments.
2. **Credential Issuance:** Upon approval, the registry issues scoped API keys or mTLS certificates per environment and transitions the probe to `active`.
3. **Deployment:** CI builds artifacts (e.g., `probe-snowflake@2.1.0`), the coordinator merges defaults with environment overrides, performs `selfTest()` preflight checks, and applies manifests. Health checks confirm heartbeats and ingestion, recording audit events.
4. **Scheduling:** Schedules include cron expressions, webhook-driven triggers, and ad-hoc executions (`/api/probes/:id/run`). Priority queues consider risk tiers and regulatory deadlines.
5. **Deprecation & Rollback:** Deprecated probes retain historical evidence but cannot run new jobs. Failed rollouts revert to prior versions and alert owners.

### Probe SDK & Platform Behaviors
- **Core Classes:** `ProbeClient` handles authentication and payload signing (`submitEvidence`, `submitHeartbeat`); `ProbeScheduler` registers schedules; `ProbeHealthClient` runs `selfTest` and reports diagnostics; `ProbeConfigLoader` merges environment overlays; `ProbeVersionManager` negotiates compatibility.
- **REST Endpoints:** `/api/probes` (register/update), `/api/probes/:id/deployments` (trigger rollout), `/api/probes/:id/schedules` (manage schedules), `/api/probes/:id/run` (ad-hoc), `/api/probes/:id/metrics` (heartbeat/failure telemetry).
- **Event Contracts:** `probe.heartbeat.v1`, `probe.evidence.v1`, `probe.failure.v1`, and `probe.deployment.v1` propagate health, payload, failure, and rollout events to downstream systems.
- **Authentication & Secrets:** Probes authenticate via signed JWTs or mTLS; credentials rotate every 30 days and are revocable. Secrets load from vault providers; payloads include SHA-256 HMAC headers for verification.
- **Retry Semantics:** SDK applies exponential backoff with jitter (2 s start, max 2 min, five attempts), idempotency keys, and circuit breakers. Scheduler retries transient failures up to three times; systemic failures escalate to alerting.
- **Versioning:** Semantic versioning governs probes and SDK runtime. `ProbeVersionManager` enforces minimum versions, canary rollouts shift incremental traffic, and sunset dates block submissions after deprecation.

## Frontend Specification

### Frontend Location & Directory Layout
Probe administration lives in `client/src/features/probes`, giving operators visibility into registry data, deployments, schedules, and health metrics.【F:docs/02-technical-specifications/03-frontend-architecture.md†L96-L160】

```
client/src/features/probes/
├── pages/
│   ├── ProbeRegistryPage.tsx
│   ├── ProbeDeploymentPage.tsx
│   ├── ProbeSchedulePage.tsx
│   └── ProbeHealthDashboard.tsx
├── components/
│   ├── ProbeDetailsPanel.tsx
│   ├── DeploymentTimeline.tsx
│   ├── ScheduleEditor.tsx
│   └── HealthStatusCard.tsx
├── hooks/
│   ├── useProbeRegistry.ts
│   ├── useDeploymentStatus.ts
│   └── useProbeMetrics.ts
└── api/
    └── probesClient.ts

client/src/components/evidence/
└── ControlMappingMatrix.tsx
```

### Reusable Components & UI Flows
- **Registry Management:** `ProbeRegistryPage` lists probes, lifecycle states, and framework bindings, linking to `ProbeDetailsPanel` for metadata edits and credential rotation.
- **Deployment Tracking:** `DeploymentTimeline` visualizes rollout phases with audit breadcrumbs and rollback controls. `useDeploymentStatus` polls events for live updates.
- **Scheduling UX:** `ScheduleEditor` supports cron, webhook, and ad-hoc triggers, validating control mappings via `ControlMappingMatrix` before persisting.
- **Health Monitoring:** `ProbeHealthDashboard` combines `HealthStatusCard` widgets (heartbeats, failure counts, latency) and surfaces alert acknowledgements with direct links to incident runbooks.

## Schema Specification
- **`probes`:** Registry metadata (id, owner, framework bindings, evidence schema, version, lifecycle state, environment overlays).
- **`probe_deployments`:** Deployment records with environment, artifact version, rollout status, timestamps, and audit references.
- **`probe_schedules`:** Cron/event definitions, priority, control mappings, and last execution metadata.
- **`probe_metrics`:** Aggregated heartbeat intervals, failure counts, latency stats, and error codes.
- **`probe_credentials`:** Issued secrets (JWT, mTLS) with rotation history and revocation status.
- Relationships connect to Governance controls, Evidence ingestion pipelines, Notification alerts, and Task Service remediation tickets.【F:docs/03-systems/09-control-management-system/readme.md†L7-L133】【F:docs/03-systems/13-task-management-system/readme.md†L7-L226】

## Operational Playbooks & References

### Monitoring & Alerting
- Heartbeat SLA: default five-minute interval; missing two beats escalates to warning, three triggers incident. Evidence ingestion errors emit structured codes consumed by SIEM dashboards.
- Alert tiers: Probe owners (Slack/Email), Platform SRE (PagerDuty escalation after 30 minutes), Governance Leads (regulatory-impact outages >4 hours). Alerts integrate with ServiceNow and Task Service for follow-up.
- Continuous improvement: Post-incident reviews capture root cause, configuration drift, and mitigation tasks; registry templates update with new validation rules.

### Related Documentation
- [Admin & Configuration System](../05-admin-and-configuration-system/readme.md) — tenant onboarding hooks and delegated administration.
- [Evidence Management System](../11-evidence-management-system/readme.md) — evidence ingestion mapping and storage contracts.
- [Control Management System](../09-control-management-system/readme.md) — framework/control associations.
- [Notification System](../04-notification-system/readme.md) — alert delivery for probe failures.

---

[← Previous](../06-audit-logging-and-monitoring/readme.md) | [Next →](../08-check-management-system/readme.md)
