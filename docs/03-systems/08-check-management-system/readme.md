# Check Management System <!-- omit in toc -->

## Location: /server/src/modules/governance

>### TL;DR
> The check management system operationalizes governance requirements inside the Governance Engine.
> It coordinates check definitions, execution workflows, evidence capture, and publication workflows across automated and manual paths.
> Use this runbook to understand lifecycle states, execution patterns, and operational playbooks for managing compliance checks.

---

- [Backend Specification](#backend-specification)
  - [Location & Directory Layout](#backend-location--directory-layout)
  - [System Components & Check Types](#system-components--check-types)
  - [Execution Workflows](#execution-workflows)
  - [Lifecycle Governance](#lifecycle-governance)
- [Frontend Specification](#frontend-specification)
  - [Location & Directory Layout](#frontend-location--directory-layout)
  - [Reusable Components & UI Flows](#reusable-components--ui-flows)
- [Schema Specification](#schema-specification)
- [Operational Playbooks & References](#operational-playbooks--references)

---

## Backend Specification

### Backend Location & Directory Layout
Runtime services that orchestrate checks live alongside the Governance Engine in `server/src/modules/governance`; the canonical catalogue of check definitions persists in PostgreSQL (`checks`, `results`). There is no standalone `checks` subdirectory—the Governance Engine modules coordinate registrations, scheduling, evidence links, and publishing. All runtime code is authored in JavaScript, matching the Express.js conventions defined in the technical architecture overview.【F:docs/02-technical-specifications/01-system-architecture.md†L18-L118】【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L124-L171】

```
server/src/modules/governance/
├── checks/
│   ├── checks.service.js
│   ├── execution.service.js
│   └── lifecycle.service.js
├── controllers/
│   ├── checks.controller.js
│   ├── results.controller.js
│   └── review-queue.controller.js
├── schedulers/
│   └── governance.scheduler.js
├── mappers/
│   └── control-mapping.service.js
├── events/
│   ├── check.failed.js
│   └── check.published.js
└── ui/
    └── admin-console/
```

#### Core Modules & Responsibilities
- **`checks.service.js`** – CRUD endpoints for definitions, validation of control/probe bindings, serialization of metadata, and enforcement of lifecycle guards (draft → ready → active → retired).【F:docs/01-about/03-concept-summary.md†L214-L318】
- **`execution.service.js`** – Orchestrates automated, manual, and hybrid executions, invokes probe adapters, hydrates evidence references, and persists raw outputs for downstream analytics.【F:docs/03-systems/07-probe-management-system/readme.md†L7-L172】
- **`lifecycle.service.js`** – Applies governance approvals, manages version bumps, archives retired checks, and emits audit events consumed by the Governance Engine pipeline.【F:docs/03-systems/12-governance-engine/readme.md†L7-L120】
- **Controllers** – Express routers mounted under `/api/governance/checks` that expose definition, result, and review-queue APIs with shared middleware for JWT authentication, Casbin authorization, and request validation.【F:docs/02-technical-specifications/06-security-implementation.md†L35-L146】
- **`governance.scheduler.js`** – Configures cron/event triggers, seeds BullMQ queues, and coordinates retries and backoff policies aligned with Probe Management cadence definitions.【F:docs/03-systems/07-probe-management-system/readme.md†L32-L166】
- **Event Emitters** – `check.failed.js` and `check.published.js` push structured payloads onto the platform event bus for Notification, Task, and Dashboard systems to consume.【F:docs/03-systems/04-notification-system/readme.md†L7-L192】【F:docs/03-systems/13-task-management-system/readme.md†L7-L226】【F:docs/03-systems/14-dashboard-and-reporting-system/readme.md†L21-L108】

### System Components & Check Types
- **Conceptual Overview:** Checks convert governance requirements into machine- and human-executable validations, coordinate probe integrations, persist outcomes, and preserve audit history tied to controls and frameworks. Every check maps back to the continuous governance flow described in the concept summary and produces data used by controls, frameworks, and reporting layers.【F:docs/01-about/03-concept-summary.md†L214-L359】
- **Core Services:**
  - **Definition Service:** Normalizes metadata, enforces taxonomy alignment, binds controls/probes, and generates OpenAPI documentation for the exposed endpoints.
  - **Execution Engine:** Resolves run context (trigger, schedule, manual), composes probe payloads, evaluates results against thresholds or rule scripts, and records diagnostics for observability.
  - **Lifecycle Manager:** Applies approval workflows, manages version transitions, and coordinates publishing with the Governance Engine to maintain auditability across iterations.
- **Check Types:**
  - **Automated:** Programmatic validations executed by probes or integrations against APIs, logs, configuration stores, or model metadata. Automated checks must declare `probe_contract` schemas to ensure payload compatibility.
  - **Manual:** Human attestation tasks completed by compliance officers when automation is unavailable or requires interpretation. Manual runs collect evidence uploads via the Evidence Management system and enforce reviewer assignments.
  - **Hybrid:** Automated collection paired with reviewer sign-off for nuanced findings (e.g., bias tests needing human confirmation). Hybrid flows attach automated payloads and require dual-approval for publication in high-risk domains.
- **Distinctions:** Automated checks trigger via schedules or events; manual/hybrid checks enter review queues. Automated outputs are structured JSON; manual/hybrid store attachments and free-form observations. Manual/hybrid require reviewer approval before publication, and all variants emit audit logs for downstream monitoring.【F:docs/03-systems/06-audit-logging-and-monitoring/readme.md†L7-L139】

### API Surface & Integration Contracts
- **Definitions:**
  - `GET /api/governance/checks` – Paginated catalogue with filtering by lifecycle state, control, probe, framework, and risk tier.
  - `POST /api/governance/checks` – Create draft definitions with schema validation, Casbin policy checks, and automatic audit capture.
  - `PUT /api/governance/checks/:id` – Update metadata, bind probes, and enqueue governance approvals when lifecycle transitions occur.
  - `POST /api/governance/checks/:id/activate` – Transition `ready_for_validation` definitions to `active` once approvals complete.
- **Execution & Results:**
  - `POST /api/governance/checks/:id/run` – Trigger ad-hoc executions, immediately enqueueing BullMQ jobs with tenant-specific priorities.
  - `GET /api/governance/checks/:id/results` – Fetch historical outcomes with filtering by severity, publication state, or time window.
  - `POST /api/governance/results/:resultId/publish` – Validate reviewer sign-off and promote pending results into published dashboards.
- **Review Queue:**
  - `GET /api/governance/review-queue` – List manual/hybrid tasks with SLA metadata, role-gated by Casbin policies.
  - `POST /api/governance/review-queue/:itemId/complete` – Capture reviewer decision, attach evidence references, and route to publishing workflow.
- **Cross-System Hooks:** REST responses include hypermedia links to Control, Evidence, Notification, and Task endpoints so that client applications can jump between modules without additional lookups.【F:docs/03-systems/09-control-management-system/readme.md†L7-L159】【F:docs/03-systems/11-evidence-management-system/readme.md†L47-L115】【F:docs/03-systems/04-notification-system/readme.md†L7-L192】【F:docs/03-systems/13-task-management-system/readme.md†L7-L226】

### Execution Workflows
- **Automated Checks:** Scheduler selects eligible checks (`frequency`, `next_run_at`), triggers probes with context, evaluates responses against thresholds/patterns, records outcomes in `results`, and dispatches remediation tasks/alerts for failures or warnings. Execution jobs run inside BullMQ workers to provide retry semantics, concurrency control, and telemetry hooks published to the monitoring stack.【F:docs/02-technical-specifications/05-devops-infrastructure.md†L48-L155】
- **Manual Checks:** Controls flagged for manual validation generate queue items. Reviewers upload evidence (stored in the Evidence Repository), assess status/severity, submit results into `pending_validation`, then publish once validated. Manual flows require reviewer acknowledgements captured in audit trails and escalate overdue items through Task Management.
- **Hybrid Checks:** Automated pass produces `requires_review` outcomes; reviewers receive probe output with guidance, adjust severity/status, and resubmit for publication. Hybrid state transitions preserve automated payloads in MinIO via evidence links so human reviewers can inspect raw telemetry.【F:docs/03-systems/11-evidence-management-system/readme.md†L47-L115】
- **Mapping to Probes & Controls:** Each check binds to a single control and optionally a probe. Control coverage metrics aggregate active checks; evidence links tie to the Evidence Repository, and status/severity propagate to control-level risk scores. Control scoring changes trigger downstream framework updates and dashboard refreshes for real-time posture visibility.【F:docs/03-systems/09-control-management-system/readme.md†L7-L159】【F:docs/03-systems/14-dashboard-and-reporting-system/readme.md†L21-L108】
- **Notification & Remediation:** Failed or warning results emit events that trigger Notification templates (email, Slack) and create remediation tasks with due dates derived from control enforcement levels. Published results feed Governance Engine aggregation pipelines for continuous monitoring.【F:docs/03-systems/04-notification-system/readme.md†L7-L192】【F:docs/03-systems/13-task-management-system/readme.md†L7-L226】【F:docs/03-systems/12-governance-engine/readme.md†L25-L120】

### Lifecycle Governance
- **Definition Stages:** `draft` → `ready_for_validation` → `active` → `retired`, ensuring review before scheduling. Governance reviewers validate metadata, probe contracts, severity rationale, and evidence retention.
- **Result States:** `pending_validation`, `requires_review`, `pass`, `fail`, `warning`, culminating in `published` once approved. Only published results feed dashboards and reports.
- **Versioning:** Increment `checks.version` for logic/severity changes. Migration scripts seed new versions while historical results remain readable. Deprecation occurs after replacement checks publish successful results, maintaining coverage overlap.
- **Access Control:** JWT-authenticated requests pass through Casbin policy checks ensuring only authorized roles can mutate definitions or approve results. Sensitive evidence links inherit signed URL expirations aligned with security implementation standards.【F:docs/02-technical-specifications/06-security-implementation.md†L35-L146】
- **Auditability:** Every lifecycle transition writes to the Audit Logging system, including reviewer identity, timestamps, and payload hashes for integrity verification.【F:docs/03-systems/06-audit-logging-and-monitoring/readme.md†L7-L139】

## Frontend Specification

### Frontend Location & Directory Layout
Governance UI experiences surface under `client/src/features/governance/checks`, enabling check authors, reviewers, and auditors to manage definitions, reviews, and outcomes. Components follow the JavaScript-only, feature-first conventions defined in the frontend architecture guide and integrate directly with Axios API clients and shared contexts for authentication and theming.【F:docs/02-technical-specifications/03-frontend-architecture.md†L1-L160】

```
client/src/features/governance/checks/
├── pages/
│   ├── CheckCatalogPage.tsx
│   ├── CheckDesignerPage.tsx
│   ├── ReviewQueuePage.tsx
│   └── ResultExplorerPage.tsx
├── components/
│   ├── CheckDefinitionForm.tsx
│   ├── CheckLifecycleTimeline.tsx
│   ├── ReviewTaskDrawer.tsx
│   └── EvidenceLinkList.tsx
├── hooks/
│   ├── useCheckDefinitions.ts
│   ├── useReviewQueue.ts
│   └── useCheckResults.ts
└── api/
    └── checksClient.ts

client/src/components/governance/
└── ControlCoverageChart.tsx
```

### Reusable Components & UI Flows
- **Catalog & Designer:** `CheckCatalogPage` lists definitions with lifecycle/status filters; `CheckDefinitionForm` manages creation/edits, guiding authors through control mapping, probe selection, severity defaults, and frequency settings. Form state uses React Hook Form-style custom hooks with schema validation matching backend expectations, while contextual help surfaces governance guidance sourced from shared content files.【F:docs/02-technical-specifications/03-frontend-architecture.md†L62-L139】
- **Review Queue:** `ReviewQueuePage` surfaces manual/hybrid work items with SLA indicators; `ReviewTaskDrawer` presents probe output, evidence links, and approval workflow (two-person rule when required). Components leverage Notification context to show escalations and Task Service integrations for remediation shortcuts.【F:docs/03-systems/13-task-management-system/readme.md†L159-L226】
- **Result Exploration:** `ResultExplorerPage` visualizes published outcomes, severity trends, and drill-down to evidence via `EvidenceLinkList`. `ControlCoverageChart` highlights framework coverage gaps and links to Control Management for comparative scoring analysis.【F:docs/03-systems/09-control-management-system/readme.md†L69-L159】
- **Shared Hooks:** `useCheckDefinitions`, `useReviewQueue`, and `useCheckResults` wrap Axios clients with caching, optimistic updates for lifecycle transitions, and toast notifications tied to Notification templates, following the API integration patterns defined in the frontend architecture spec.【F:docs/02-technical-specifications/03-frontend-architecture.md†L140-L191】
- **Accessibility & Localization:** Components honor the platform’s accessibility and localization guidelines, including keyboard navigation, ARIA labelling, and locale-aware formatting, ensuring compliance with corporate governance requirements.【F:docs/02-technical-specifications/03-frontend-architecture.md†L166-L231】

## Schema Specification
- **`checks`:** Definition metadata (id, control_id, probe_id, type, name, description, severity_default, status, version, frequency, created_by/updated_by, metadata JSON). Prisma enforces enums for `type`, `status`, and `severity_default`, while partial indexes accelerate queries on `status = 'active'` and `control_id` for catalogue filtering.【F:docs/02-technical-specifications/04-database-design.md†L33-L128】
- **`check_versions`:** Historical table capturing logic snapshots, migration notes, rollback references, and diff metadata. Version rows include JSON patches to support audit reconstruction and regression testing of deprecated logic.
- **`results`:** Execution records (id, check_id, control_id, probe_run_id, status, severity, evidence_link_id, notes, executed_at, validated_at, published_at, created_by, raw_output) with indexes for remediation and reporting. Raw payloads persist as JSONB to support search across warning/failure diagnostics.
- **`review_queue_items`:** Manual/hybrid tasks (check_id, assigned_to, due_at, priority, state, SLA metadata) syncing with Task Management for accountability. Queue records embed `escalation_level`, `evidence_bundle_id`, and `acknowledged_at` timestamps so escalations align with remediation policies.【F:docs/03-systems/13-task-management-system/readme.md†L7-L226】
- **`check_control_links`:** Join table aligning check coverage to controls with `weight`, `enforcement_level`, and `evidence_requirements` fields powering scoring and remediation logic.【F:docs/03-systems/09-control-management-system/readme.md†L69-L159】
- **`check_notifications`:** Tracks outbound alert templates, recipients, delivery status, and correlation IDs for audit reconciliation with the Notification system.【F:docs/03-systems/04-notification-system/readme.md†L7-L192】
- Relationships connect to probes, controls, evidence links, notifications, dashboards, and audit logs to ensure consistent governance data. Prisma migrations manage schema evolution, and retention policies align with the database design guidelines for backups, archiving, and encryption.【F:docs/02-technical-specifications/04-database-design.md†L1-L154】

## Operational Playbooks & References

### Core Playbooks
- **Adding a Check:** Author definition (UI or YAML), attach probe if applicable, submit for validation with evidence samples, Governance review in staging, activate on approval. Deployment checklist includes updating OpenAPI docs, running Prisma migrations, and verifying scheduler entries in non-production before promoting to production.【F:docs/02-technical-specifications/08-deployment-and-environment-guide.md†L42-L168】
- **Manual Review Handling:** Queue intake assigns reviewers, structured forms capture attestations and evidence uploads, senior reviewers validate and publish results, with escalation for overdue items. SLA breaches auto-create remediation tasks and dispatch notifications following incident management procedures.【F:docs/01-about/08-operations-and-teams.md†L112-L198】【F:docs/03-systems/13-task-management-system/readme.md†L159-L226】
- **Monitoring:** Dashboards track failure/warning volumes, SLA breaches, and coverage; repeated false positives trigger logic review and severity tuning. SRE teams monitor BullMQ queue depth, worker health, and scheduler drift through the DevOps observability stack.【F:docs/02-technical-specifications/05-devops-infrastructure.md†L48-L155】
- **Change Management:** Lifecycle changes (activate, retire, revise) require change tickets, impact analysis on control coverage, and notification to stakeholders. All changes recorded in the Audit Logging system and distributed via governance communications to maintain transparency.【F:docs/01-about/04-security-and-data-protection.md†L140-L214】【F:docs/03-systems/06-audit-logging-and-monitoring/readme.md†L7-L139】

### Related Documentation
- [Probe Management System](../07-probe-management-system/readme.md) — automated evidence integrations and scheduling.
- [Control Management System](../09-control-management-system/readme.md) — framework/catalog governance.
- [Evidence Management System](../11-evidence-management-system/readme.md) — evidence storage and linkage.
- [Notification System](../04-notification-system/readme.md) — alerting for failed checks.

---

[← Previous](../07-probe-management-system/readme.md) | [Next →](../09-control-management-system/readme.md)
