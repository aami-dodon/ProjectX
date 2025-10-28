# Control Management System <!-- omit in toc -->

## Location: /server/src/modules/governance/controls

>### TL;DR
> The control management system anchors governance, risk, and compliance posture across the platform.
> It maintains a canonical control catalog, maps controls to frameworks and checks, and orchestrates scoring, remediation, and reporting flows.
> Use this reference to understand data models, lifecycle procedures, and integrations that keep control health accurate and auditable.

---

- [Domain Context & Alignment](#domain-context--alignment)
- [Non-Functional & Compliance Requirements](#non-functional--compliance-requirements)
- [Backend Specification](#backend-specification)
  - [Location & Directory Layout](#backend-location--directory-layout)
  - [Control Taxonomy & Relationships](#control-taxonomy--relationships)
  - [Service Responsibilities & Integration Points](#service-responsibilities--integration-points)
  - [API Surface & DTO Contracts](#api-surface--dto-contracts)
  - [Scoring & Lifecycle Management](#scoring--lifecycle-management)
- [Frontend Specification](#frontend-specification)
  - [Location & Directory Layout](#frontend-location--directory-layout)
  - [Reusable Components & UI Flows](#reusable-components--ui-flows)
  - [State, Security & Localization Patterns](#state-security--localization-patterns)
- [Schema Specification](#schema-specification)
- [Testing, Deployment & Operational Readiness](#testing-deployment--operational-readiness)
- [Operational Playbooks & References](#operational-playbooks--references)

---

## Domain Context & Alignment

- **Governance Loop Positioning:** Control management sits between check execution and framework reporting in the closed-loop governance cycle, turning validated check outputs into authoritative control scores and narratives for auditors.【F:docs/01-about/03-concept-summary.md†L203-L301】
- **Cross-Functional Ownership:** Compliance analysts curate taxonomy, engineering maintains APIs and integrations, and product/operations ensure roadmap delivery; the squad structure mirrors the broader organizational pillars (Engineering, Product & Design, Security & Compliance, Customer Success).【F:docs/01-about/08-operations-and-teams.md†L24-L84】
- **Regulatory Coverage:** Controls must map to EU AI Act, ISO/IEC 42001, NIST AI RMF, and sector frameworks surfaced elsewhere in governance modules, ensuring posture roll-ups remain audit-ready and multi-jurisdictional.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L110-L118】【F:docs/03-systems/10-framework-mapping-system/readme.md†L7-L107】
- **Product Outcomes:** Deliver reliable control scorecards, remediation triggers, and framework exports that feed reporting dashboards and customer attestations — key outputs promised in platform narratives and go-to-market collateral.【F:docs/01-about/03-concept-summary.md†L269-L320】【F:docs/01-about/08-operations-and-teams.md†L108-L121】

## Non-Functional & Compliance Requirements

- **Security Posture:** Enforce security-by-design, RBAC, and encryption expectations at every layer. Controllers must validate JWTs/Casbin policies; repositories protect tenant boundaries and leverage immutable audit logging per platform-wide security doctrine.【F:docs/01-about/04-security-and-data-protection.md†L3-L107】【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L194-L217】
- **Data Protection:** All control metadata, evidence pointers, and score histories carry classification, retention, and residency constraints; deletion workflows must honor configurable retention windows and region-specific storage policies.【F:docs/01-about/04-security-and-data-protection.md†L118-L179】
- **Operational Governance:** Release cadence follows agile delivery with sign-offs from Product, QA, and Security; production deployments require CTO/CISO approval and integrate into enterprise OKR tracking for compliance outcomes.【F:docs/01-about/08-operations-and-teams.md†L29-L144】
- **Performance & Reliability:** APIs must sustain multi-tenant loads, leverage caching on read-heavy scorecards, and expose health metrics to centralized monitoring, aligning with infrastructure SLAs (>90% uptime) and DevOps orchestration baselines.【F:docs/01-about/08-operations-and-teams.md†L34-L39】【F:docs/02-technical-specifications/05-devops-infrastructure.md†L52-L119】

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

### Service Responsibilities & Integration Points
- **Controllers:** `controls.controller.ts`, `scoring.controller.ts`, and `mappings.controller.ts` expose REST endpoints that honour the shared response envelope (`status`, `message`, `data`, `error`) and enforce JWT + Casbin middleware prior to invoking services.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L194-L217】
- **Services:** `control.service.ts` orchestrates CRUD, deduplication, and taxonomy invariants; `mapping.service.ts` manages framework/check associations and emits `control.mapping.updated`; `scoring.service.ts` recalculates aggregates when check results land; `lifecycle.service.ts` coordinates approvals with Governance Engine schedulers and framework versioning workflows.【F:docs/03-systems/12-governance-engine/readme.md†L15-L101】【F:docs/03-systems/10-framework-mapping-system/readme.md†L40-L110】
- **Repositories & Policies:** Repository classes encapsulate Prisma queries with tenant scoping, eager loading for mappings, and optimistic locking for concurrent edits. Casbin policies align with RBAC duties for compliance analysts, auditors, and administrators.【F:docs/01-about/04-security-and-data-protection.md†L192-L200】
- **Workflow & Event Handlers:** `createControl.workflow.ts` and `updateControl.workflow.ts` coordinate approvals, queue scoring recalculations, and notify downstream systems (Tasks, Notifications, Dashboards) via domain events (`control.created`, `control.updated`, `control.failed`).【F:docs/03-systems/04-notification-system/readme.md†L1-L126】【F:docs/03-systems/13-task-management-system/readme.md†L1-L115】【F:docs/03-systems/14-dashboard-and-reporting-system/readme.md†L7-L118】
- **External Systems:** Evidence repository lookups validate attached artefacts, while Framework Mapping ensures cross-standard parity before publish; every mutation records audit events for transparency and compliance reporting.【F:docs/03-systems/11-evidence-management-system/readme.md†L7-L170】【F:docs/03-systems/10-framework-mapping-system/readme.md†L40-L170】

### API Surface & DTO Contracts

| Endpoint | Method | Purpose | Notes |
|----------|--------|---------|-------|
| `/api/controls` | GET | List controls with taxonomy, framework, and scoring filters. | Supports pagination, risk tier filters, ownership scoping, and ETag caching for UI grids.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L194-L207】 |
| `/api/controls` | POST | Create draft or active control records. | Payload validated via Zod DTOs requiring taxonomy path, rationale, enforcement weight, and at least one mapping stub; emits `control.created` for governance subscribers.【F:docs/03-systems/12-governance-engine/readme.md†L33-L88】 |
| `/api/controls/:id` | GET | Fetch control details, mappings, scores, evidence references, and audit cursors. | Accepts `includeDraftMappings` for reviewers and returns aggregated metrics. |
| `/api/controls/:id` | PATCH | Update metadata, weights, lifecycle status, or mappings. | Version bump triggers when risk tier or enforcement changes; approvals enforced before publish. |
| `/api/controls/:id/archive` | POST | Soft-archive controls with deprecation rationale. | Schedules remap jobs and notifies check owners to reassess coverage. |
| `/api/controls/:id/mappings` | PUT | Replace framework/check mapping matrix. | Validates referential integrity via Framework Mapping service before committing transaction.【F:docs/03-systems/10-framework-mapping-system/readme.md†L57-L170】 |
| `/api/controls/:id/scores` | GET | Retrieve historical score trends and contributing checks. | Offers `granularity` (daily/weekly/monthly) and cursor pagination for dashboards. |
| `/api/controls/:id/remediation` | POST | Force remediation cycle (open task, notify owners). | Bridges to Task & Notification services; returns task IDs and notification receipts for traceability.【F:docs/03-systems/13-task-management-system/readme.md†L51-L115】【F:docs/03-systems/04-notification-system/readme.md†L56-L126】 |

**DTO Conventions**
- Request DTOs use camelCase keys, enumerations for status (`draft`, `active`, `deprecated`), enforcement (`advisory`, `mandatory`), and risk (`low`, `medium`, `high`). Response objects wrap payloads inside `{ status, message, data }` with consistent error contracts (`code`, `details`).【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L194-L207】
- Mapping payloads include nested arrays for `frameworkMappings` (frameworkId, requirementId, coverageLevel, effectiveFrom/To) and `checkLinks` (checkId, weight, enforcementLevel, frequencyCadence). Validation ensures at least one active mapping before activation.
- Audit trails expose `changeId`, `actor`, `before`, `after`, and `comment` fields in line with immutable logging and transparency requirements.【F:docs/01-about/04-security-and-data-protection.md†L93-L147】

### Scoring & Lifecycle Management
- **Scoring Model:** Check results produce normalized scores (pass=1, warning=0.5, fail=0). Weighted averages (per link weight) roll up to control scores, scaled by risk tier multipliers (High=1.5, Medium=1.0, Low=0.75). Thresholds: ≥0.85 Passing, 0.60–0.84 Needs Attention, <0.60 Failing.
- **Failure Handling:** Failing controls trigger incidents/remediation tasks when enforcement levels demand it, persist evidence, and notify owner teams plus subscribed framework stakeholders.
- **Lifecycle Procedures:**
  - **Create Control:** Draft change request, deduplicate against catalog, governance board approval, insert into `controls` with active status, establish required framework/check mappings, and schedule initial checks.
  - **Update Control:** Versioned change request, increment `version`, adjust mappings and weights, notify dependent teams, and log updates via audit events.
  - **Cross-Framework Mapping:** Maintain coverage matrix, document compensating controls, update `control_framework_links`, and refresh posture dashboards.
  - **Audit Trail:** All mutations emit audit events, quarterly audits sample controls for accuracy/evidence freshness, discrepancies create remediation tasks tracked in Task Service.【F:docs/03-systems/13-task-management-system/readme.md†L7-L226】
- **Score Publication:** Aggregated results publish to Governance Engine subscribers, update framework scorecards, and feed dashboard materialization jobs; failures raise alerts through Notification and Task systems to maintain continuous compliance posture.【F:docs/03-systems/12-governance-engine/readme.md†L15-L160】【F:docs/03-systems/14-dashboard-and-reporting-system/readme.md†L27-L118】【F:docs/03-systems/04-notification-system/readme.md†L56-L126】

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

### State, Security & Localization Patterns
- **State Management:** Feature hooks (`useControls`, `useControlMappings`, `useControlScores`) wrap Axios clients with React Context-aware caching, mirroring the platform pattern of Context + custom hooks for feature-level state.【F:docs/02-technical-specifications/03-frontend-architecture.md†L91-L140】
- **Design System:** Components compose TailwindCSS and shadcn/ui atoms/molecules with lucide icons and semantic compliance colors to meet accessibility targets and maintain brand cohesion.【F:docs/02-technical-specifications/03-frontend-architecture.md†L72-L159】
- **Security Guards:** API clients attach JWT headers, enforce CSRF tokens, and propagate authorization failures through Notification Context for consistent messaging; protected routes leverage RBAC-aware wrappers to hide privileged actions.【F:docs/02-technical-specifications/03-frontend-architecture.md†L125-L159】
- **Localization:** Locale bundles support multilingual deployments; formatting utilities draw on Admin & Configuration tenant settings to honour regional policies and data residency commitments.【F:docs/02-technical-specifications/03-frontend-architecture.md†L163-L176】【F:docs/03-systems/05-admin-and-configuration-system/readme.md†L1-L180】

## Schema Specification
- **`controls`:** Canonical control definitions (id, domain, category, title, description, rationale, guidance, owner_team, status, risk_tier, version, created/updated metadata).
- **`control_framework_links`:** Framework mappings with requirement IDs, coverage level, evidence references, effective/expiry dates.
- **`control_check_links`:** Associations between controls and checks, storing assertion type, frequency, enforcement level, and weighting.
- **`control_scores`:** Materialized scores with timestamps, aggregated weight sums, normalized values, and status classification.
- **`control_audit_events`:** Append-only log recording before/after snapshots, approvers, and change-ticket references.
- Relationships join to Task Service remediation tasks, Notification alerts, dashboards, and Evidence Repository assets for end-to-end traceability.【F:docs/03-systems/14-dashboard-and-reporting-system/readme.md†L7-L118】

## Testing, Deployment & Operational Readiness

- **Testing Strategy:** Unit tests cover services and repositories using Prisma test harnesses; integration suites validate lifecycle workflows, mapping transactions, and scoring recalculations against seeded data before merges. CI pipelines enforce linting, unit/integration coverage, and contract tests for REST endpoints across environments.【F:docs/02-technical-specifications/05-devops-infrastructure.md†L52-L166】
- **Staging & Release Gates:** Feature flags allow dark launches of new scoring formulas. Staging deployments run smoke tests with Governance Engine interactions and require manual QA plus security approval per operational governance process before promotion.【F:docs/01-about/08-operations-and-teams.md†L129-L144】【F:docs/02-technical-specifications/05-devops-infrastructure.md†L72-L166】
- **Observability:** Services emit Prometheus metrics (score latency, workflow duration), structured logs with correlation IDs, and distributed traces for API calls; alerts track scoring lag, workflow failures, and queue depth within centralized monitoring stacks.【F:docs/02-technical-specifications/05-devops-infrastructure.md†L96-L140】【F:docs/03-systems/06-audit-logging-and-monitoring/readme.md†L7-L139】
- **Runbooks & On-Call:** On-call engineers follow remediation playbooks for scoring anomalies, mapping conflicts, or evidence validation failures, coordinating with Task and Notification systems to inform stakeholders and document outcomes for audits.【F:docs/03-systems/13-task-management-system/readme.md†L51-L115】【F:docs/03-systems/04-notification-system/readme.md†L56-L126】

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
