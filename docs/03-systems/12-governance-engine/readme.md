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
  - [Service Responsibilities & API Surface](#service-responsibilities--api-surface)
  - [Configuration, Dependencies, and Cross-System Contracts](#configuration-dependencies-and-cross-system-contracts)
  - [Extensibility Hooks](#extensibility-hooks)
- [Frontend Specification](#frontend-specification)
  - [Location & Directory Layout](#frontend-location--directory-layout)
  - [Reusable Components & UI Flows](#reusable-components--ui-flows)
  - [State, Data Fetching, and Security Considerations](#state-data-fetching-and-security-considerations)
- [Schema Specification](#schema-specification)
- [Operational Playbooks & References](#operational-playbooks--references)

---

## Backend Specification

### Backend Location & Directory Layout
`server/src/modules/governance` follows the feature-oriented layout, coordinating check execution, control aggregation, framework scoring, and remediation orchestration. All backend code is authored in JavaScript (Node.js + Express) with feature folders keeping controllers, services, jobs, and subscribers co-located for discoverability.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L12-L103】

```
server/src/modules/governance/
├── checks/
│   ├── checks.service.js
│   ├── execution.pipeline.js
│   └── lifecycle.service.js
├── controls/
│   ├── scoring.service.js
│   └── posture.service.js
├── frameworks/
│   └── mapping.service.js
├── orchestration/
│   ├── scheduler.service.js
│   ├── remediation.service.js
│   └── workflow.builder.js
├── subscribers/
│   ├── evidence.subscriber.js
│   └── mapping.subscriber.js
├── controllers/
│   ├── governance.controller.js
│   ├── review-queue.controller.js
│   └── scoring.controller.js
├── routes/
│   └── governance.routes.js
└── ui/
    └── admin-console/
```

Supporting modules live under `server/src/routes` for route registration, `server/src/integrations` for shared providers (MinIO, Nodemailer, Casbin), and `server/src/config` for environment-driven configuration consumed by the governance services.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L63-L103】

### Lifecycle Orchestration
- **Evidence Intake:** Subscribers react to probe uploads and manual submissions, enqueuing evaluations for relevant checks.【F:docs/01-about/03-concept-summary.md†L214-L359】
- **Scheduling:** Cron/event schedules maintained by the Probe Management system feed into `scheduler.service.js`, which prioritizes check runs based on frequency, risk tier, and outstanding remediation items.【F:docs/03-systems/07-probe-management-system/readme.md†L7-L226】
- **Execution Pipeline:** `execution.pipeline.js` fetches definitions, resolves probe outputs, applies validation logic, and writes results into the Check Management tables.【F:docs/03-systems/08-check-management-system/readme.md†L7-L165】
- **Feedback Loop:** Remediation service opens tasks, dispatches notifications, and updates dashboards. Results flow into control aggregation, framework scoring, and evidence linkage for continuous monitoring.【F:docs/01-about/03-concept-summary.md†L282-L359】

### Execution & Aggregation Model
- **Check Runners:** Pluggable strategy objects evaluate automated, manual, or hybrid checks; manual submissions enter review queues before publication. Strategy instances use shared validators in `server/src/modules/governance/checks/validators` and persist normalized payloads via Prisma repositories to satisfy reporting and remediation requirements.【F:docs/01-about/03-concept-summary.md†L224-L297】【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L32-L89】
- **Control Aggregation:** Aggregates check outcomes using configured weights, risk tiers, and thresholds to produce control posture scores. Scores propagate to frameworks for compliance reporting and support downstream dashboard visualizations.【F:docs/03-systems/09-control-management-system/readme.md†L7-L159】【F:docs/01-about/03-concept-summary.md†L298-L343】
- **Remediation Orchestration:** Failing controls trigger incident tickets, remediation tasks, and escalation notifications while preserving immutable audit records.【F:docs/03-systems/04-notification-system/readme.md†L7-L200】【F:docs/03-systems/13-task-management-system/readme.md†L7-L226】【F:docs/03-systems/06-audit-logging-and-monitoring/readme.md†L7-L139】
- **Logging & Audit:** Every execution emits structured events captured by the Audit Logging system for traceability and tamper-evident compliance history.【F:docs/03-systems/06-audit-logging-and-monitoring/readme.md†L7-L139】

### Service Responsibilities & API Surface
- **Controllers & Routes:** `governance.controller.js` exposes REST endpoints (`GET /governance/overview`, `GET /governance/controls/:id`, `POST /governance/runs`, `POST /governance/recalculate`) mounted through `governance.routes.js`. Endpoints obey the shared REST, validation, and error-handling standards defined for all services.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L118-L198】
- **Schedulers:** `scheduler.service.js` registers cron jobs with the platform scheduler, reading cadence and prioritization metadata from the Check Management tables. Jobs enqueue work onto the Governance Engine execution pipeline and fall back to retry queues when dependent systems are degraded.【F:docs/03-systems/07-probe-management-system/readme.md†L7-L226】【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L24-L89】
- **Execution Pipeline:** `execution.pipeline.js` orchestrates fetch→validate→persist steps, calling Probe Management adapters, Check Management repositories, and Notification/Task services to ensure cohesive remediation flows.【F:docs/03-systems/07-probe-management-system/readme.md†L7-L226】【F:docs/03-systems/08-check-management-system/readme.md†L34-L141】【F:docs/03-systems/13-task-management-system/readme.md†L7-L173】
- **Scoring Services:** `scoring.controller.js` and `scoring.service.js` expose recalculation triggers and cached score retrieval, publishing framework score updates to Dashboard & Reporting subscribers via the message bus.【F:docs/03-systems/14-dashboard-and-reporting-system/readme.md†L7-L118】【F:docs/03-systems/10-framework-mapping-system/readme.md†L7-L210】
- **Security & Access:** Each endpoint enforces JWT authentication, Casbin policy checks, and request validation middleware defined in the shared backend specification. Governance-specific scopes gate mutation routes to compliance roles only.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L118-L198】

### Configuration, Dependencies, and Cross-System Contracts
- **Environment Variables:** `GOVERNANCE_RUNNER_BATCH_SIZE`, `GOVERNANCE_MAX_CONCURRENCY`, `GOVERNANCE_NOTIFICATION_TEMPLATE`, and storage credentials are injected via `server/src/config`. Feature toggles (e.g., hybrid-review enforcement) rely on the shared config loader described in the backend architecture chapter.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L63-L103】
- **Integrations:** MinIO clients handle evidence payload retrieval, Nodemailer templates deliver remediation notices, and Casbin ensures role-based access alignment across governance routes.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L24-L120】【F:docs/03-systems/04-notification-system/readme.md†L7-L200】
- **Messaging Contracts:** Evidence and mapping subscribers consume domain events from the Probe Management and Framework Mapping systems, updating governance caches and run queues accordingly. Events adhere to the naming and payload conventions documented in the respective system guides.【F:docs/03-systems/07-probe-management-system/readme.md†L57-L202】【F:docs/03-systems/10-framework-mapping-system/readme.md†L7-L210】
- **Resilience:** Circuit breakers protect downstream dependencies, and failed executions emit structured audit events plus retry jobs. All recoverable errors bubble through the shared Express error handler to maintain observability and consistent response codes.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L170-L198】【F:docs/03-systems/06-audit-logging-and-monitoring/readme.md†L7-L139】

### Extensibility Hooks
- **New Checks/Probes:** Register definitions via Check Management, add probe integrations through Probe Management, and subscribe to governance events to extend workflows.【F:docs/03-systems/07-probe-management-system/readme.md†L7-L226】【F:docs/03-systems/08-check-management-system/readme.md†L7-L165】
- **Scoring Adjustments:** Control weights and thresholds configurable through Control Management; governance services recalculate scores automatically when mappings change.【F:docs/03-systems/09-control-management-system/readme.md†L7-L159】
- **Reporting Hooks:** Subscribers broadcast changes to dashboards, reporting exports, and external integrations when frameworks or scores update.【F:docs/03-systems/10-framework-mapping-system/readme.md†L7-L210】【F:docs/03-systems/14-dashboard-and-reporting-system/readme.md†L7-L118】

## Frontend Specification

### Frontend Location & Directory Layout
Governance operations UI resides in `client/src/features/governance`, providing dashboards, review queues, and administrative tooling. Feature folders contain React components, hooks, localized copy, and API clients implemented in JavaScript, aligned with the shared frontend architecture guidance.【F:docs/02-technical-specifications/03-frontend-architecture.md†L80-L138】

```
client/src/features/governance/
├── pages/
│   ├── GovernanceOverviewPage.jsx
│   ├── ControlHealthPage.jsx
│   ├── FrameworkScorecardPage.jsx
│   └── ReviewQueuePage.jsx
├── components/
│   ├── GovernanceScorecard.jsx
│   ├── ControlDrilldownPanel.jsx
│   ├── FrameworkTrendChart.jsx
│   └── RemediationWorkflowPanel.jsx
├── hooks/
│   ├── useGovernanceOverview.js
│   ├── useReviewQueue.js
│   └── useRemediationActions.js
├── api/
│   └── governanceClient.js
├── locales/
│   └── en.json
└── styles/
    └── governance.css

client/src/components/governance/
└── EvidenceControlMatrix.jsx
```

### Reusable Components & UI Flows
- **Overview Dashboards:** `GovernanceScorecard` and `FrameworkTrendChart` visualize aggregated posture, risk tiers, and historical performance using shadcn/ui primitives and Tailwind tokens for consistent look-and-feel.【F:docs/02-technical-specifications/03-frontend-architecture.md†L80-L132】
- **Control Drilldowns:** `ControlDrilldownPanel` highlights failing checks, linked evidence, and remediation progress with quick links to tasks; contextual tooltips pull localized copy from `locales/en.json` to support future translations.【F:docs/02-technical-specifications/03-frontend-architecture.md†L138-L174】
- **Review Queue:** `ReviewQueuePage` manages manual/hybrid check approvals, surfacing SLA breaches and requiring dual approvals where configured. Hooks encapsulate Axios calls with interceptors for consistent JWT handling.【F:docs/02-technical-specifications/03-frontend-architecture.md†L146-L193】
- **Remediation Workflow:** `RemediationWorkflowPanel` integrates with Task Management to track status, due dates, and evidence closure while rendering accessible form controls that comply with WCAG AA guidelines.【F:docs/02-technical-specifications/03-frontend-architecture.md†L138-L193】【F:docs/01-about/03-concept-summary.md†L332-L359】
- **Evidence-Control Matrix:** Shared component `EvidenceControlMatrix` enables cross-system evidence navigation and is reused by Evidence Management, ensuring UI parity across governance modules.【F:docs/03-systems/11-evidence-management-system/readme.md†L7-L115】

### State, Data Fetching, and Security Considerations
- Feature hooks manage local state via `useState`/`useReducer`, while global posture values subscribe to the Governance Overview context so dashboards update after each run.【F:docs/02-technical-specifications/03-frontend-architecture.md†L92-L152】
- Axios clients defined in `governanceClient.js` attach JWT tokens, handle refresh flows, and surface errors through the shared notification context to maintain consistent UX messaging.【F:docs/02-technical-specifications/03-frontend-architecture.md†L146-L193】
- Sensitive identifiers (control IDs, framework IDs) are masked in the UI for read-only roles, aligning with the cross-role collaboration rules described in the concept summary.【F:docs/01-about/03-concept-summary.md†L206-L247】
- Components must meet accessibility and localization expectations out-of-the-box; copy, date formatting, and severity color ramps are provided via the shared design system tokens.【F:docs/02-technical-specifications/03-frontend-architecture.md†L118-L174】

## Schema Specification
- **`governance_runs`:** Execution metadata (run_id, check_id, control_id, schedule_id, trigger_type, started_at, completed_at, status, diagnostics) indexed on `status`, `control_id`, and `started_at` to power dashboards and SLA reporting.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L140-L168】
- **`control_scores` / `framework_scores`:** Aggregated values with weighting context, thresholds, and timestamps for historical comparison. Changes trigger scoring webhooks and publish events consumed by the Dashboard system.【F:docs/03-systems/09-control-management-system/readme.md†L7-L159】【F:docs/03-systems/14-dashboard-and-reporting-system/readme.md†L7-L118】
- **`governance_notifications`:** Records of remediation alerts, recipients, escalation tier, and acknowledgement status. Relies on Notification templates and retains immutable audit metadata.【F:docs/03-systems/04-notification-system/readme.md†L7-L200】
- **`review_queue`:** Manual/hybrid approvals with assigned reviewer, due dates, SLA state, and validation timestamps.【F:docs/03-systems/08-check-management-system/readme.md†L7-L165】
- **`governance_audit_events`:** Append-only log capturing execution and scoring changes for traceability, consumed by the centralized audit and monitoring stack.【F:docs/03-systems/06-audit-logging-and-monitoring/readme.md†L7-L139】
- **`evidence_links`:** Join table that binds governance runs to stored artifacts in the Evidence Management system, ensuring cross-module traceability.【F:docs/03-systems/11-evidence-management-system/readme.md†L7-L115】
- **`governance_settings`:** Configuration overrides (e.g., scoring weights, SLA thresholds, reviewer requirements) surfaced through the admin console and enforced by orchestration services.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L63-L168】

## Operational Playbooks & References

### Operations
- **Monitor Runtime Health:** Track scheduler health, run queue depth, execution latency, and retry counts. Use Audit Logging dashboards to inspect failure spikes or repeated probe timeouts.【F:docs/03-systems/06-audit-logging-and-monitoring/readme.md†L7-L139】
- **Validate Scoring Integrity:** Recalculate governance pipelines after framework updates, compare historical vs. recalculated control scores, and confirm framework rollups remain within expected tolerance bands.【F:docs/03-systems/10-framework-mapping-system/readme.md†L7-L210】【F:docs/03-systems/14-dashboard-and-reporting-system/readme.md†L7-L118】
- **Coordinate Remediation:** During incidents coordinate with Notification and Task systems to confirm remediation pathways are functioning, verifying escalations and acknowledgements are recorded in `governance_notifications`.【F:docs/03-systems/04-notification-system/readme.md†L7-L200】【F:docs/03-systems/13-task-management-system/readme.md†L7-L226】
- **Evidence Assurance:** Cross-check evidence links for failed controls to ensure every run retains supporting artifacts, aligning with the continuous monitoring expectations set in the platform concept summary.【F:docs/01-about/03-concept-summary.md†L314-L359】【F:docs/03-systems/11-evidence-management-system/readme.md†L7-L115】

### Implementation Checklist
- Adhere to the JavaScript-only backend mandate (no TypeScript) and follow shared naming conventions for controllers, services, and routes.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L12-L107】
- Document new or updated endpoints in the OpenAPI specification and announce breaking scoring changes through change management logs, keeping API consumers synchronized.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L118-L198】
- Extend governance UI components using the feature-folder conventions, ensure accessibility checks pass, and surface localization strings through the shared JSON catalogs.【F:docs/02-technical-specifications/03-frontend-architecture.md†L80-L193】
- Coordinate schema migrations with the platform-wide database governance process to maintain referential integrity and version history.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L138-L168】

### Related Documentation
- [Check Management System](../08-check-management-system/readme.md) — definitions and execution workflows.
- [Control Management System](../09-control-management-system/readme.md) — scoring model and lifecycle governance.
- [Framework Mapping System](../10-framework-mapping-system/readme.md) — cross-framework propagation of control results.
- [Evidence Management System](../11-evidence-management-system/readme.md) — evidence storage and linkage.
- [Dashboard & Reporting System](../14-dashboard-and-reporting-system/readme.md) — visualization of governance outputs.
- [Task Management System](../13-task-management-system/readme.md) — remediation follow-up.

---

[← Previous](../11-evidence-management-system/readme.md) | [Next →](../13-task-management-system/readme.md)
