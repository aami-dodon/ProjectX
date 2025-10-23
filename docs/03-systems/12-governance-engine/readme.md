# Governance Engine <!-- omit in toc -->

## Location: /server/src/modules/governance

>### TL;DR
> The governance engine is the platform core that turns evidence into actionable compliance intelligence.
> Located at `server/src/modules/governance`, it executes checks, aggregates control and framework scores, and drives remediation workflows.
> This guide explains lifecycle orchestration, execution internals, extensibility hooks, and system dependencies.

---

- [Backend Specification](#backend-specification)
  - [Location & Directory Layout](#backend-location--directory-layout)
  - [Lifecycle Orchestration](#lifecycle-orchestration)
  - [Execution & Aggregation Model](#execution--aggregation-model)
  - [Extensibility Hooks](#extensibility-hooks)
- [Frontend Specification](#frontend-specification)
  - [Location & Directory Layout](#frontend-location--directory-layout)
  - [Reusable Components & UI Flows](#reusable-components--ui-flows)
- [Schema Specification](#schema-specification)
- [Operational Playbooks & References](#operational-playbooks--references)

---

## Backend Specification

### Backend Location & Directory Layout
`server/src/modules/governance` follows the feature-oriented layout, coordinating check execution, control aggregation, framework scoring, and remediation orchestration.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L55-L159】

```
server/src/modules/governance/
├── checks/
├── controls/
├── frameworks/
├── orchestration/
│   ├── scheduler.service.ts
│   ├── execution.pipeline.ts
│   └── remediation.service.ts
├── subscribers/
│   ├── evidence.subscriber.ts
│   └── mapping.subscriber.ts
├── controllers/
│   ├── governance.controller.ts
│   └── review-queue.controller.ts
└── ui/
    └── admin-console/
```

### Lifecycle Orchestration
- **Evidence Intake:** Subscribers react to probe uploads and manual submissions, enqueuing evaluations for relevant checks.【F:docs/01-about/03-concept-summary.md†L214-L359】
- **Scheduling:** Cron/event schedules maintained by the Probe Management system feed into `scheduler.service.ts`, which prioritizes check runs based on frequency, risk tier, and outstanding remediation items.【F:docs/03-systems/07-probe-management-system/readme.md†L7-L226】
- **Execution Pipeline:** `execution.pipeline.ts` fetches definitions, resolves probe outputs, applies validation logic, and writes results into the Check Management tables.【F:docs/03-systems/08-check-management-system/readme.md†L7-L165】
- **Feedback Loop:** Remediation service opens tasks, dispatches notifications, and updates dashboards. Results flow into control aggregation, framework scoring, and evidence linkage for continuous monitoring.【F:docs/01-about/03-concept-summary.md†L282-L359】

### Execution & Aggregation Model
- **Check Runners:** Pluggable strategy objects evaluate automated, manual, or hybrid checks; manual submissions enter review queues before publication.
- **Control Aggregation:** Aggregates check outcomes using configured weights, risk tiers, and thresholds to produce control posture scores. Scores propagate to frameworks for compliance reporting.【F:docs/03-systems/09-control-management-system/readme.md†L7-L159】
- **Remediation Orchestration:** Failing controls trigger incident tickets, remediation tasks, and escalation notifications while preserving immutable audit records.【F:docs/03-systems/04-notification-system/readme.md†L7-L200】【F:docs/03-systems/13-task-management-system/readme.md†L7-L226】
- **Logging & Audit:** Every execution emits structured events captured by the Audit Logging system for traceability.【F:docs/03-systems/06-audit-logging-and-monitoring/readme.md†L7-L139】

### Extensibility Hooks
- **New Checks/Probes:** Register definitions via Check Management, add probe integrations through Probe Management, and subscribe to governance events to extend workflows.【F:docs/03-systems/07-probe-management-system/readme.md†L7-L226】【F:docs/03-systems/08-check-management-system/readme.md†L7-L165】
- **Scoring Adjustments:** Control weights and thresholds configurable through Control Management; governance services recalculate scores automatically when mappings change.【F:docs/03-systems/09-control-management-system/readme.md†L7-L159】
- **Reporting Hooks:** Subscribers broadcast changes to dashboards, reporting exports, and external integrations when frameworks or scores update.【F:docs/03-systems/10-framework-mapping-system/readme.md†L7-L210】【F:docs/03-systems/14-dashboard-and-reporting-system/readme.md†L7-L118】

## Frontend Specification

### Frontend Location & Directory Layout
Governance operations UI resides in `client/src/features/governance`, providing dashboards, review queues, and administrative tooling.【F:docs/02-technical-specifications/03-frontend-architecture.md†L96-L160】

```
client/src/features/governance/
├── pages/
│   ├── GovernanceOverviewPage.tsx
│   ├── ControlHealthPage.tsx
│   ├── FrameworkScorecardPage.tsx
│   └── ReviewQueuePage.tsx
├── components/
│   ├── GovernanceScorecard.tsx
│   ├── ControlDrilldownPanel.tsx
│   ├── FrameworkTrendChart.tsx
│   └── RemediationWorkflowPanel.tsx
├── hooks/
│   ├── useGovernanceOverview.ts
│   ├── useReviewQueue.ts
│   └── useRemediationActions.ts
└── api/
    └── governanceClient.ts

client/src/components/governance/
└── EvidenceControlMatrix.tsx
```

### Reusable Components & UI Flows
- **Overview Dashboards:** `GovernanceScorecard` and `FrameworkTrendChart` visualize aggregated posture, risk tiers, and historical performance.
- **Control Drilldowns:** `ControlDrilldownPanel` highlights failing checks, linked evidence, and remediation progress with quick links to tasks.
- **Review Queue:** `ReviewQueuePage` manages manual/hybrid check approvals, surfacing SLA breaches and requiring dual approvals where configured.
- **Remediation Workflow:** `RemediationWorkflowPanel` integrates with Task Management to track status, due dates, and evidence closure.

## Schema Specification
- **`governance_runs`:** Execution metadata (run_id, check_id, control_id, schedule_id, trigger_type, started_at, completed_at, status, diagnostics).
- **`control_scores` / `framework_scores`:** Aggregated values with weighting context, thresholds, and timestamps for historical comparison.【F:docs/03-systems/09-control-management-system/readme.md†L7-L159】
- **`governance_notifications`:** Records of remediation alerts, recipients, escalation tier, and acknowledgement status.
- **`review_queue`:** Manual/hybrid approvals with assigned reviewer, due dates, SLA state, and validation timestamps.【F:docs/03-systems/08-check-management-system/readme.md†L7-L165】
- **`governance_audit_events`:** Append-only log capturing execution and scoring changes for traceability.

## Operational Playbooks & References

### Operations
- Monitor scheduler health, run queue depth, and execution latency; investigate stuck runs or repeated failures.
- Validate governance pipelines after framework updates, ensuring scoring recalculations align with expectations.
- Coordinate with Notification and Task systems during incidents to confirm remediation pathways are functioning.

### Related Documentation
- [Check Management System](../08-check-management-system/readme.md) — definitions and execution workflows.
- [Control Management System](../09-control-management-system/readme.md) — scoring model and lifecycle governance.
- [Dashboard & Reporting System](../14-dashboard-and-reporting-system/readme.md) — visualization of governance outputs.
- [Task Management System](../13-task-management-system/readme.md) — remediation follow-up.

---

[← Previous](../11-evidence-management-system/readme.md) | [Next →](../13-task-management-system/readme.md)
