# Dashboard and Reporting System <!-- omit in toc -->

## Location: /client/src/features/dashboards, /server/src/modules/reports

>### TL;DR
> The dashboard and reporting system transforms compliance telemetry—framework scores, control status, remediation progress, and evidence freshness—into actionable insights and exports.
> React dashboards in `client/src/features/dashboards` consume APIs backed by `server/src/modules/reports` to visualize control health, remediation execution, and evidence coverage.
> This runbook describes the data pipelines, UI components, report generators, and extensibility patterns that keep analytics current and audit-ready.

---

- [Objectives & Alignment](#objectives--alignment)
- [Technology Stack & Dependencies](#technology-stack--dependencies)
- [Backend Specification](#backend-specification)
  - [Location & Directory Layout](#backend-location--directory-layout)
  - [Services & Responsibilities](#services--responsibilities)
  - [API Surface](#api-surface)
  - [Workers & Scheduling](#workers--scheduling)
  - [Data Pipelines](#data-pipelines)
  - [Report Generation](#report-generation)
  - [Security & Access Control](#security--access-control)
  - [Testing & Observability](#testing--observability)
- [Frontend Specification](#frontend-specification)
  - [Location & Directory Layout](#frontend-location--directory-layout)
  - [Data Fetching & State Management](#data-fetching--state-management)
  - [Reusable Components & UI Flows](#reusable-components--ui-flows)
  - [Access Control & Routing](#access-control--routing)
- [Schema Specification](#schema-specification)
- [Operational Playbooks & References](#operational-playbooks--references)

---

## Objectives & Alignment

The dashboards and exports operationalize the platform vision of making AI governance measurable, continuous, and trusted by translating check and control outcomes into decision support for compliance, engineering, and audit stakeholders.【F:docs/01-about/01-project-overview.md†L29-L133】 Dashboards must surface framework-aligned scores, remediation actions, and evidence status so organizations can prove adherence to global standards and act on emerging risks in near real time.【F:docs/01-about/01-project-overview.md†L63-L83】

## Technology Stack & Dependencies

The reporting module is implemented entirely in JavaScript, sharing the platform’s Express.js backend, React.js frontend, Prisma ORM, and Axios HTTP integrations while persisting to externally hosted PostgreSQL and MinIO services.【F:docs/02-technical-specifications/01-system-architecture.md†L41-L198】 These components are mandated by the system architecture to ensure consistency, security, and scalability across modules. Reporting controllers must follow the backend architectural conventions (module-based Express structure, Swagger-documented REST APIs), and UI work must comply with the Vite-powered feature folder organization, Tailwind/shadcn design system, and Atomic Design principles defined for the client codebase.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L43-L217】【F:docs/02-technical-specifications/03-frontend-architecture.md†L39-L175】

## Backend Specification

### Backend Location & Directory Layout
Reporting services live in `server/src/modules/reports`, exposing REST endpoints and BullMQ workers that aggregate governance data and produce exports.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L103-L135】

```
server/src/modules/reports/
├── controllers/
│   ├── dashboards.controller.ts
│   └── exports.controller.ts
├── services/
│   ├── score-aggregator.service.ts
│   ├── remediation-metrics.service.ts
│   └── evidence-metrics.service.ts
├── workers/
│   ├── score-aggregator.worker.ts
│   ├── remediation.worker.ts
│   └── export.worker.ts
├── repositories/
│   ├── scores.repository.ts
│   ├── metrics.repository.ts
│   └── exports.repository.ts
└── templates/
    └── export-templates/
```

### Services & Responsibilities
- **`dashboards.controller.ts`:** Serves read-only endpoints that join governance scores, remediation metrics, and evidence data through dedicated services. Responses must follow the platform’s standardized JSON envelope and expose pagination/filtering consistent with other modules.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L196-L217】
- **`exports.controller.ts`:** Handles export job CRUD, scheduling, and artifact retrieval while validating RBAC scopes before enqueuing background work.【F:docs/03-systems/02-rbac-system/readme.md†L83-L166】
- **Aggregators (`score-aggregator.service.ts`, `remediation-metrics.service.ts`, `evidence-metrics.service.ts`):** Query governance, task, and evidence repositories using Prisma to assemble dimensioned datasets for dashboards while caching hot reads per framework/control to honor database performance guidance.【F:docs/02-technical-specifications/04-database-design.md†L40-L140】
- **Repositories:** Encapsulate SQL-friendly projections for reports, ensure index usage aligns with database optimization practices, and hide raw Prisma queries behind reusable functions.【F:docs/02-technical-specifications/04-database-design.md†L108-L140】
- **Templates & Serializers:** Keep export templates versioned, localized, and extensible; serializers must normalize units, currency, and timestamps so downstream consumers receive compliant artefacts.【F:docs/01-about/01-project-overview.md†L63-L83】

### API Surface
- `GET /api/reports/dashboards/framework-scores` — Returns framework posture with historical trend slices and optional filtering by framework, domain, or time window.
- `GET /api/reports/dashboards/control-health` — Aggregates failing controls, SLA state, ownership, and risk tier for heatmaps.
- `GET /api/reports/dashboards/remediation` — Provides task throughput, escalation counts, and SLA adherence metrics sourced from the Task Management module.【F:docs/03-systems/13-task-management-system/readme.md†L41-L120】
- `GET /api/reports/dashboards/evidence` — Summarizes freshness, retention windows, and coverage gaps using Evidence Management metadata.【F:docs/03-systems/11-evidence-management-system/readme.md†L49-L152】
- `POST /api/reports/exports` — Creates export jobs with filters, format, and schedule details, validating RBAC policies and Casbin domains before enqueueing.
- `GET /api/reports/exports/:id` — Retrieves job status and signed artifact URLs from MinIO once processing completes.【F:docs/02-technical-specifications/01-system-architecture.md†L168-L181】
- `POST /api/reports/exports/:id/retry` — Re-queues failed jobs with idempotency safeguards and audit logging hooks.【F:docs/02-technical-specifications/06-security-implementation.md†L124-L144】

### Workers & Scheduling
- BullMQ queues (`score-aggregator.worker.ts`, `remediation.worker.ts`, `export.worker.ts`) subscribe to governance engine broadcasts, task updates, and evidence changes to keep analytics fresh. Jobs must be idempotent, respect tenant isolation, and emit audit events for traceability.【F:docs/03-systems/12-governance-engine/readme.md†L49-L105】【F:docs/03-systems/13-task-management-system/readme.md†L41-L168】【F:docs/03-systems/11-evidence-management-system/readme.md†L41-L158】
- Schedulers align with framework cadence rules and SLA thresholds defined by Governance and Task systems; configure repeatable jobs for daily score recalculation, weekly remediation digests, and ad hoc export windows while enforcing concurrency limits to protect shared infrastructure.【F:docs/03-systems/10-framework-mapping-system/readme.md†L49-L160】【F:docs/02-technical-specifications/04-database-design.md†L54-L119】
- Queue health metrics feed observability dashboards; dead-letter queues trigger alerting playbooks coordinated with the Notification system for timely remediation.【F:docs/03-systems/04-notification-system/readme.md†L39-L170】

### Data Pipelines
- **Framework Scores:** Governance engine emits check/control updates; BullMQ workers normalize payloads using Framework mappings and persist scores for dashboard consumption.【F:docs/03-systems/12-governance-engine/readme.md†L7-L205】【F:docs/03-systems/10-framework-mapping-system/readme.md†L7-L210】
- **Control Status:** Aggregates check results, remediation state, and SLA data from Task Management to render risk indicators and heatmaps.【F:docs/03-systems/13-task-management-system/readme.md†L7-L214】
- **Remediation Metrics:** Tracks task lifecycle, escalation counts, and resolution timing to feed SLA dashboards and compliance reports.
- **Evidence Snapshot:** Pulls metadata from Evidence Management for freshness, retention, and coverage analytics across controls/frameworks.【F:docs/03-systems/11-evidence-management-system/readme.md†L7-L170】

### Report Generation
- **Framework Attestation Packs:** Export controller assembles framework summaries, control coverage, and evidence pointers for auditors.
- **Control Breakdown Reports:** Provide per-control status, failing checks, remediation assignments, and evidence links.
- **Remediation & Evidence Digest:** Weekly digest summarizing open tasks, SLA breaches, and evidence gaps for stakeholders.
- Exports support CSV/JSON/XLSX formats, versioned artifacts, localization, and API scheduling via `export.worker.ts`.

### Security & Access Control
- Apply JWT authentication and Casbin RBAC guards to every endpoint, ensuring dashboards respect tenant domains and role-based scopes (Compliance Officer, Auditor, Executive).【F:docs/02-technical-specifications/06-security-implementation.md†L56-L97】【F:docs/03-systems/02-rbac-system/readme.md†L83-L166】
- Enforce least-privilege access: only Admins and Compliance Officers can configure exports; Auditors receive read-only dashboard endpoints; system service accounts manage scheduled jobs. Authorization decisions must be logged to `report_audit_log` for forensic review.【F:docs/02-technical-specifications/06-security-implementation.md†L124-L144】【F:docs/03-systems/02-rbac-system/readme.md†L107-L166】
- All exports produced in MinIO require presigned URLs with short-lived expiry and AES-256 encryption; checksum validation and immutable audit entries satisfy regulatory requirements.【F:docs/02-technical-specifications/01-system-architecture.md†L168-L181】【F:docs/02-technical-specifications/06-security-implementation.md†L100-L144】

### Testing & Observability
- Unit-test controllers, services, and repositories using Jest with fixtures mirroring framework/task/evidence scenarios; target ≥85% coverage as mandated by QA standards.【F:docs/02-technical-specifications/09-testing-and-qa.md†L31-L120】
- Integration tests should exercise REST endpoints via Postman/Newman collections and Vitest-driven contract checks to ensure frontend hooks align with API responses.【F:docs/02-technical-specifications/09-testing-and-qa.md†L94-L154】
- Instrument workers and controllers with structured Winston logs, performance metrics, and alert hooks feeding the centralized monitoring stack to catch latency regressions or queue backlogs promptly.【F:docs/02-technical-specifications/06-security-implementation.md†L134-L181】【F:docs/02-technical-specifications/01-system-architecture.md†L183-L199】

## Frontend Specification

### Frontend Location & Directory Layout
Dashboards live in `client/src/features/dashboards`, rendering compliance telemetry with charting and table components.【F:docs/02-technical-specifications/03-frontend-architecture.md†L50-L160】

```
client/src/features/dashboards/
├── pages/
│   ├── FrameworkDashboardPage.tsx
│   ├── ControlHealthPage.tsx
│   ├── RemediationDashboardPage.tsx
│   └── EvidenceCoveragePage.tsx
├── components/
│   ├── ScoreGauge.tsx
│   ├── ControlHeatmap.tsx
│   ├── RemediationTrendChart.tsx
│   └── EvidenceFreshnessTable.tsx
├── hooks/
│   ├── useFrameworkScores.ts
│   ├── useControlMetrics.ts
│   ├── useRemediationMetrics.ts
│   └── useEvidenceMetrics.ts
└── api/
    └── reportsClient.ts

client/src/components/reports/
└── ExportSchedulerModal.tsx
```

### Data Fetching & State Management
- Hooks (`useFrameworkScores`, `useControlMetrics`, `useRemediationMetrics`, `useEvidenceMetrics`) must encapsulate Axios data access, leverage the shared API client interceptors, and integrate with Auth Context for JWT propagation as documented in the frontend architecture.【F:docs/02-technical-specifications/03-frontend-architecture.md†L96-L140】
- Minimize redundant requests by memoizing responses within feature hooks and reusing the documented API interceptors/polling cadence, normalizing outputs to shared chart/table props so UI composition stays declarative.【F:docs/02-technical-specifications/03-frontend-architecture.md†L39-L140】
- Persist user-selected filters (framework, domain, severity, time range) via URL search params or local storage consistent with feature-folder conventions so dashboards remain shareable and resumable across sessions.【F:docs/02-technical-specifications/03-frontend-architecture.md†L50-L103】

### Reusable Components & UI Flows
- **Framework Dashboard:** `ScoreGauge` and `useFrameworkScores` display overall posture and trends, enabling drill-down into domains and frameworks.
- **Control Health:** `ControlHeatmap` surfaces failing controls by domain/owner with filters for severity and risk tier.
- **Remediation Monitoring:** `RemediationTrendChart` and SLA tables visualize task throughput, escalations, and overdue work.
- **Evidence Coverage:** `EvidenceFreshnessTable` highlights artifacts nearing expiration, missing evidence, and retention status.
- **Export Scheduling:** `ExportSchedulerModal` allows users to configure recurring exports, formats, recipients, and localization options.

### Access Control & Routing
- Wrap dashboard routes with `RequirePermission` guards so only authorized roles can view sensitive metrics, aligning with RBAC policies and frontend guard patterns established in the admin module.【F:docs/03-systems/02-rbac-system/readme.md†L122-L170】【F:docs/02-technical-specifications/03-frontend-architecture.md†L96-L175】
- Ensure navigation integrates with global layouts and breadcrumb patterns, exposing contextual links back to Governance, Tasks, and Evidence features to maintain consistent user journeys defined across systems.【F:docs/03-systems/12-governance-engine/readme.md†L94-L118】【F:docs/03-systems/13-task-management-system/readme.md†L93-L152】
- Respect security measures (CSP, CSRF mitigation, session timeout) and accessibility requirements (WCAG AA) when composing charts, tables, and export dialogs.【F:docs/02-technical-specifications/03-frontend-architecture.md†L145-L175】

## Schema Specification
- **`report_scores`:** Aggregated framework/control scores with timestamps, dimensions (framework, domain, control), and metadata for charting.
- **`report_metrics`:** Remediation and evidence KPIs (open tasks, SLA breaches, evidence freshness, retention stats).
- **`report_exports`:** Export job definitions, formats, filters, scheduling metadata, and artifact URIs.
- **`report_audit_log`:** Records generation events, consumers, and checksum validation for audit readiness.
- **`report_widgets`:** Optional configuration table for enabling/disabling dashboard widgets per tenant.
- Tables inherit standard PostgreSQL practices: UUID primary keys, foreign keys to governance/task/evidence tables, time-based partitioning for audit trails, and indexes optimized for high-read dashboard queries.【F:docs/02-technical-specifications/04-database-design.md†L54-L140】
- Prisma schema definitions must align with shared naming conventions, enforce soft deletes where appropriate, and register migrations through the managed change queue controlling the externally hosted database.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L169-L217】
- Exports reference MinIO object metadata and retention policies to honor backup/archival requirements and compliance retention windows documented for evidence and audit data.【F:docs/02-technical-specifications/04-database-design.md†L148-L184】

## Operational Playbooks & References

### Playbooks
- **Pipeline Health:** Monitor worker queues, ingestion latency, and dashboard API performance; replay backlog on failure.
- **Export Validation:** Verify generated artifacts after schema changes; ensure localization and retention metadata remain accurate.
- **Accessibility & Performance:** Adhere to WCAG guidelines, optimize chart rendering, and enforce caching strategies for large datasets.
- **Security Reviews:** Validate Casbin policy coverage, JWT expiry handling, and encryption settings after changes; re-run vulnerability scans if dependencies or templates shift.【F:docs/02-technical-specifications/06-security-implementation.md†L56-L198】
- **Testing Cadence:** Enforce automated Jest/Vitest suites and Cypress dashboard flows in CI, reviewing coverage and regression reports before release as defined by QA governance.【F:docs/02-technical-specifications/09-testing-and-qa.md†L31-L170】

### Related Documentation
- [Governance Engine](../12-governance-engine/readme.md) — source of scoring events.
- [Task Management System](../13-task-management-system/readme.md) — remediation metrics.
- [Evidence Management System](../11-evidence-management-system/readme.md) — evidence coverage inputs.
- [Framework Mapping System](../10-framework-mapping-system/readme.md) — mapping metadata for reporting.
- [RBAC System](../02-rbac-system/readme.md) — permission enforcement for dashboards and exports.
- [Notification System](../04-notification-system/readme.md) — alerting pathways for export and queue incidents.

---

[← Previous](../13-task-management-system/readme.md) | [Next →](../15-external-integrations-system/readme.md)
