# Control Management System <!-- omit in toc -->

## Location: /server/src/modules/governance/controls

>### TL;DR
> The control management system anchors governance, risk, and compliance posture across the platform.
> It maintains a canonical control catalog, maps controls to frameworks and checks, and orchestrates scoring, remediation, and reporting flows.
> Use this reference to understand data models, lifecycle procedures, and integrations that keep control health accurate and auditable.

---

- [Backend Specification](#backend-specification)
  - [Location & Directory Layout](#backend-location--directory-layout)
  - [Control Taxonomy & Relationships](#control-taxonomy--relationships)
  - [Scoring & Lifecycle Management](#scoring--lifecycle-management)
- [Frontend Specification](#frontend-specification)
  - [Location & Directory Layout](#frontend-location--directory-layout)
  - [Reusable Components & UI Flows](#reusable-components--ui-flows)
- [Schema Specification](#schema-specification)
- [Operational Playbooks & References](#operational-playbooks--references)

---

## Backend Specification

### Backend Location & Directory Layout
Control governance logic resides in `server/src/modules/governance/controls`, which exposes REST APIs, scoring engines, and lifecycle workflows for the Governance Engine.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L124-L171】

```
server/src/modules/governance/controls/
├── controllers/
│   ├── controls.controller.ts
│   ├── scoring.controller.ts
│   └── mappings.controller.ts
├── services/
│   ├── control.service.ts
│   ├── scoring.service.ts
│   ├── mapping.service.ts
│   └── lifecycle.service.ts
├── repositories/
│   ├── control.repository.ts
│   ├── control-framework.repository.ts
│   └── control-check.repository.ts
├── workflows/
│   ├── createControl.workflow.ts
│   └── updateControl.workflow.ts
└── events/
    ├── control.failed.ts
    └── control.updated.ts
```

### Control Taxonomy & Relationships
- **Taxonomy Structure:** Domains → Categories → Controls (with optional sub-controls). Every control maps to at least one framework requirement and one verification check, ensuring traceability from enterprise objectives to validations.
- **Control Metadata:** `controls` table stores identifiers, taxonomy keys, title/description, rationale, implementation guidance, owner team, status (`draft`, `active`, `deprecated`), risk tier, version, audit timestamps, and authorship.
- **Framework Links:** `control_framework_links` join table associates controls with frameworks/requirements, including coverage level, evidence references, and validity windows.
- **Check Links:** `control_check_links` tracks which automated/manual checks substantiate a control, including assertion type, frequency, weight/enforcement level, and cadence expectations. Relationships power coverage metrics and remediation triggers.【F:docs/03-systems/08-check-management-system/readme.md†L7-L167】

### Scoring & Lifecycle Management
- **Scoring Model:** Check results produce normalized scores (pass=1, warning=0.5, fail=0). Weighted averages (per link weight) roll up to control scores, scaled by risk tier multipliers (High=1.5, Medium=1.0, Low=0.75). Thresholds: ≥0.85 Passing, 0.60–0.84 Needs Attention, <0.60 Failing.
- **Failure Handling:** Failing controls trigger incidents/remediation tasks when enforcement levels demand it, persist evidence, and notify owner teams plus subscribed framework stakeholders.
- **Lifecycle Procedures:**
  - **Create Control:** Draft change request, deduplicate against catalog, governance board approval, insert into `controls` with active status, establish required framework/check mappings, and schedule initial checks.
  - **Update Control:** Versioned change request, increment `version`, adjust mappings and weights, notify dependent teams, and log updates via audit events.
  - **Cross-Framework Mapping:** Maintain coverage matrix, document compensating controls, update `control_framework_links`, and refresh posture dashboards.
  - **Audit Trail:** All mutations emit audit events, quarterly audits sample controls for accuracy/evidence freshness, discrepancies create remediation tasks tracked in Task Service.【F:docs/03-systems/13-task-management-system/readme.md†L7-L226】

## Frontend Specification

### Frontend Location & Directory Layout
Control management UI lives at `client/src/features/governance/controls`, enabling catalog maintenance, mappings, and posture analytics.【F:docs/02-technical-specifications/03-frontend-architecture.md†L96-L160】

```
client/src/features/governance/controls/
├── pages/
│   ├── ControlCatalogPage.tsx
│   ├── ControlDetailPage.tsx
│   ├── FrameworkMappingPage.tsx
│   └── ControlScoreboardPage.tsx
├── components/
│   ├── ControlForm.tsx
│   ├── MappingMatrix.tsx
│   ├── ScoreTrendChart.tsx
│   └── RemediationTaskList.tsx
├── hooks/
│   ├── useControls.ts
│   ├── useControlMappings.ts
│   └── useControlScores.ts
└── api/
    └── controlsClient.ts

client/src/components/governance/
└── FrameworkCoverageHeatmap.tsx
```

### Reusable Components & UI Flows
- **Catalog Maintenance:** `ControlCatalogPage` lists controls with taxonomy filters; `ControlForm` supports creation/version updates with change-ticket capture and governance approval routing.
- **Mapping Management:** `FrameworkMappingPage` leverages `MappingMatrix` to edit framework links, set coverage levels, attach evidence references, and configure validity dates.
- **Scoring Analytics:** `ControlScoreboardPage` and `ScoreTrendChart` visualize posture trends, risk tiers, and historical performance. `RemediationTaskList` integrates Task Service data to track open issues.
- **Dashboard Insights:** `FrameworkCoverageHeatmap` highlights gaps across frameworks, linking to failing controls and associated checks.

## Schema Specification
- **`controls`:** Canonical control definitions (id, domain, category, title, description, rationale, guidance, owner_team, status, risk_tier, version, created/updated metadata).
- **`control_framework_links`:** Framework mappings with requirement IDs, coverage level, evidence references, effective/expiry dates.
- **`control_check_links`:** Associations between controls and checks, storing assertion type, frequency, enforcement level, and weighting.
- **`control_scores`:** Materialized scores with timestamps, aggregated weight sums, normalized values, and status classification.
- **`control_audit_events`:** Append-only log recording before/after snapshots, approvers, and change-ticket references.
- Relationships join to Task Service remediation tasks, Notification alerts, dashboards, and Evidence Repository assets for end-to-end traceability.【F:docs/03-systems/14-dashboard-and-reporting-system/readme.md†L7-L118】

## Operational Playbooks & References

### Playbooks
- **Handling Failures:** When a control drops below threshold, create incidents/remediation tasks, notify owner team, and ensure evidence captured with timestamps for audit.
- **Quarterly Reviews:** Governance team reviews taxonomy accuracy, framework coverage, risk tiers, and evidence freshness; outcomes recorded in compliance tracker and dashboards.
- **Reporting:** Export control posture to BI tooling and regulatory reports, ensuring mappings and scores align with framework obligations.

### Related Documentation
- [Check Management System](../08-check-management-system/readme.md) — verification workflows feeding control scores.
- [Framework Mapping System](../10-framework-mapping-system/readme.md) — cross-framework alignment logic.
- [Dashboard & Reporting System](../14-dashboard-and-reporting-system/readme.md) — visualization of control health.
- [Task Management System](../13-task-management-system/readme.md) — remediation tracking.

---

[← Previous](../08-check-management-system/readme.md) | [Next →](../10-framework-mapping-system/readme.md)
