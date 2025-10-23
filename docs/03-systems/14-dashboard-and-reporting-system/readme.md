# Dashboard and Reporting System <!-- omit in toc -->

## Location: /client/src/features/dashboards, /server/src/modules/reports

>### TL;DR
> The dashboard and reporting system transforms compliance telemetry—framework scores, control status, remediation progress, and evidence freshness—into actionable insights and exports.
> React dashboards in `client/src/features/dashboards` consume APIs backed by `server/src/modules/reports` to visualize control health, remediation execution, and evidence coverage.
> This runbook describes the data pipelines, UI components, report generators, and extensibility patterns that keep analytics current and audit-ready.

---

- [Backend Specification](#backend-specification)
  - [Location & Directory Layout](#backend-location--directory-layout)
  - [Data Pipelines](#data-pipelines)
  - [Report Generation](#report-generation)
- [Frontend Specification](#frontend-specification)
  - [Location & Directory Layout](#frontend-location--directory-layout)
  - [Reusable Components & UI Flows](#reusable-components--ui-flows)
- [Schema Specification](#schema-specification)
- [Operational Playbooks & References](#operational-playbooks--references)

---

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

### Reusable Components & UI Flows
- **Framework Dashboard:** `ScoreGauge` and `useFrameworkScores` display overall posture and trends, enabling drill-down into domains and frameworks.
- **Control Health:** `ControlHeatmap` surfaces failing controls by domain/owner with filters for severity and risk tier.
- **Remediation Monitoring:** `RemediationTrendChart` and SLA tables visualize task throughput, escalations, and overdue work.
- **Evidence Coverage:** `EvidenceFreshnessTable` highlights artifacts nearing expiration, missing evidence, and retention status.
- **Export Scheduling:** `ExportSchedulerModal` allows users to configure recurring exports, formats, recipients, and localization options.

## Schema Specification
- **`report_scores`:** Aggregated framework/control scores with timestamps, dimensions (framework, domain, control), and metadata for charting.
- **`report_metrics`:** Remediation and evidence KPIs (open tasks, SLA breaches, evidence freshness, retention stats).
- **`report_exports`:** Export job definitions, formats, filters, scheduling metadata, and artifact URIs.
- **`report_audit_log`:** Records generation events, consumers, and checksum validation for audit readiness.
- **`report_widgets`:** Optional configuration table for enabling/disabling dashboard widgets per tenant.

## Operational Playbooks & References

### Playbooks
- **Pipeline Health:** Monitor worker queues, ingestion latency, and dashboard API performance; replay backlog on failure.
- **Export Validation:** Verify generated artifacts after schema changes; ensure localization and retention metadata remain accurate.
- **Accessibility & Performance:** Adhere to WCAG guidelines, optimize chart rendering, and enforce caching strategies for large datasets.

### Related Documentation
- [Governance Engine](../12-governance-engine/readme.md) — source of scoring events.
- [Task Management System](../13-task-management-system/readme.md) — remediation metrics.
- [Evidence Management System](../11-evidence-management-system/readme.md) — evidence coverage inputs.
- [Framework Mapping System](../10-framework-mapping-system/readme.md) — mapping metadata for reporting.

---

[← Previous](../13-task-management-system/readme.md) | [Next →](../15-external-integrations-system/readme.md)
