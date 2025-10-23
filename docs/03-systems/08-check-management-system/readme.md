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
Runtime services that orchestrate checks live alongside the Governance Engine in `server/src/modules/governance`; the canonical catalogue of check definitions persists in PostgreSQL (`checks`, `results`). There is no dedicated `checks` subdirectory—the Governance Engine modules coordinate registrations, scheduling, evidence links, and publishing.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L124-L171】

```
server/src/modules/governance/
├── checks/
│   ├── checks.service.ts
│   ├── execution.service.ts
│   └── lifecycle.service.ts
├── controllers/
│   ├── checks.controller.ts
│   ├── results.controller.ts
│   └── review-queue.controller.ts
├── schedulers/
│   └── governance.scheduler.ts
├── mappers/
│   └── control-mapping.service.ts
├── events/
│   ├── check.failed.ts
│   └── check.published.ts
└── ui/
    └── admin-console/
```

### System Components & Check Types
- **Conceptual Overview:** Checks convert governance requirements into machine- and human-executable validations, coordinate probe integrations, persist outcomes, and preserve audit history tied to controls and frameworks.
- **Check Types:**
  - **Automated:** Programmatic validations executed by probes or integrations against APIs, logs, configuration stores, or model metadata.
  - **Manual:** Human attestation tasks completed by compliance officers when automation is unavailable or requires interpretation.
  - **Hybrid:** Automated collection paired with reviewer sign-off for nuanced findings (e.g., bias tests needing human confirmation).
- **Distinctions:** Automated checks trigger via schedules or events; manual/hybrid checks enter review queues. Automated outputs are structured JSON; manual/hybrid store attachments and free-form observations. Manual/hybrid require reviewer approval before publication.

### Execution Workflows
- **Automated Checks:** Scheduler selects eligible checks (`frequency`, `next_run_at`), triggers probes with context, evaluates responses against thresholds/patterns, records outcomes in `results`, and dispatches remediation tasks/alerts for failures or warnings.
- **Manual Checks:** Controls flagged for manual validation generate queue items. Reviewers upload evidence (stored in the Evidence Repository), assess status/severity, submit results into `pending_validation`, then publish once validated.
- **Hybrid Checks:** Automated pass produces `requires_review` outcomes; reviewers receive probe output with guidance, adjust severity/status, and resubmit for publication.
- **Mapping to Probes & Controls:** Each check binds to a single control and optionally a probe. Control coverage metrics aggregate active checks; evidence links tie to the Evidence Repository, and status/severity propagate to control-level risk scores.【F:docs/03-systems/09-control-management-system/readme.md†L7-L133】【F:docs/03-systems/11-evidence-management-system/readme.md†L47-L115】

### Lifecycle Governance
- **Definition Stages:** `draft` → `ready_for_validation` → `active` → `retired`, ensuring review before scheduling. Governance reviewers validate metadata, probe contracts, severity rationale, and evidence retention.
- **Result States:** `pending_validation`, `requires_review`, `pass`, `fail`, `warning`, culminating in `published` once approved. Only published results feed dashboards and reports.
- **Versioning:** Increment `checks.version` for logic/severity changes. Migration scripts seed new versions while historical results remain readable. Deprecation occurs after replacement checks publish successful results, maintaining coverage overlap.

## Frontend Specification

### Frontend Location & Directory Layout
Governance UI experiences surface under `client/src/features/governance/checks`, enabling check authors, reviewers, and auditors to manage definitions, reviews, and outcomes.【F:docs/02-technical-specifications/03-frontend-architecture.md†L96-L160】

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
- **Catalog & Designer:** `CheckCatalogPage` lists definitions with lifecycle/status filters; `CheckDefinitionForm` manages creation/edits, guiding authors through control mapping, probe selection, severity defaults, and frequency settings.
- **Review Queue:** `ReviewQueuePage` surfaces manual/hybrid work items with SLA indicators; `ReviewTaskDrawer` presents probe output, evidence links, and approval workflow (two-person rule when required).
- **Result Exploration:** `ResultExplorerPage` visualizes published outcomes, severity trends, and drill-down to evidence via `EvidenceLinkList`. `ControlCoverageChart` highlights framework coverage gaps.

## Schema Specification
- **`checks`:** Definition metadata (id, control_id, probe_id, type, name, description, severity_default, status, version, frequency, created_by/updated_by, metadata JSON).
- **`check_versions`:** Optional historical table capturing prior logic snapshots, migration notes, and rollback references.
- **`results`:** Execution records (id, check_id, control_id, probe_run_id, status, severity, evidence_link_id, notes, executed_at, validated_at, published_at, created_by, raw_output) with indexes for remediation and reporting.
- **`review_queue_items`:** Manual/hybrid tasks (check_id, assigned_to, due_at, priority, state, SLA metadata) syncing with Task Management for accountability.【F:docs/03-systems/13-task-management-system/readme.md†L7-L226】
- Relationships connect to probes, controls, evidence links, notifications, and dashboards to ensure consistent governance data.

## Operational Playbooks & References

### Core Playbooks
- **Adding a Check:** Author definition (UI or YAML), attach probe if applicable, submit for validation with evidence samples, Governance review in staging, activate on approval.
- **Manual Review Handling:** Queue intake assigns reviewers, structured forms capture attestations and evidence uploads, senior reviewers validate and publish results, with escalation for overdue items.
- **Monitoring:** Dashboards track failure/warning volumes, SLA breaches, and coverage; repeated false positives trigger logic review and severity tuning.

### Related Documentation
- [Probe Management System](../07-probe-management-system/readme.md) — automated evidence integrations and scheduling.
- [Control Management System](../09-control-management-system/readme.md) — framework/catalog governance.
- [Evidence Management System](../11-evidence-management-system/readme.md) — evidence storage and linkage.
- [Notification System](../04-notification-system/readme.md) — alerting for failed checks.

---

[← Previous](../07-probe-management-system/readme.md) | [Next →](../09-control-management-system/readme.md)
