# Framework Mapping System <!-- omit in toc -->

## Location: /server/src/modules/frameworks

>### TL;DR
> The framework mapping system governs lifecycle management for regulatory frameworks and their control mappings.
> It centralizes metadata, aligns controls across standards, and exposes APIs for onboarding, versioning, and exporting frameworks.
> Use this guide to understand data contracts, CRUD flows, and operational guardrails that keep mappings authoritative.

---

- [Backend Specification](#backend-specification)
  - [Location & Directory Layout](#backend-location--directory-layout)
  - [Data Model & Metadata Contracts](#data-model--metadata-contracts)
  - [Framework & Mapping Workflows](#framework--mapping-workflows)
- [Frontend Specification](#frontend-specification)
  - [Location & Directory Layout](#frontend-location--directory-layout)
  - [Reusable Components & UI Flows](#reusable-components--ui-flows)
- [Schema Specification](#schema-specification)
- [Operational Playbooks & References](#operational-playbooks--references)

---

## Backend Specification

### Backend Location & Directory Layout
Framework governance lives under `server/src/modules/frameworks`, following the layered JavaScript architecture defined for the backend service.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L52-L135】【F:docs/02-technical-specifications/10-coding-standards-and-governance.md†L69-L118】

```
server/src/modules/frameworks/
├── controllers/          # Express route handlers (e.g., framework-controller.js)
├── routers/              # Route registration in kebab-case files (framework-routes.js)
├── services/             # Business orchestration for lifecycle, mapping, and versioning
├── repositories/         # Prisma data access for frameworks, controls, mappings, versions
├── validators/           # Joi/celebrate schemas reused across controllers and tasks
├── policies/             # Casbin helper utilities enforcing role- and tenant-scoped rules
├── jobs/                 # BullMQ processors for imports, exports, and scheduled syncs
├── subscribers/          # Event listeners (governance engine, reporting, notifications)
└── index.js              # Module bootstrap that mounts routers into `server/src/routes`
```

Controllers expose REST endpoints, validators guarantee payload integrity, services orchestrate repositories and integrations, policies enforce Casbin authorization, BullMQ jobs handle asynchronous ingestion/export, and subscribers broadcast mapping changes to the governance engine, evidence management, notification, and reporting modules.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L99-L171】【F:docs/01-about/04-security-and-data-protection.md†L206-L259】【F:docs/03-systems/14-dashboard-and-reporting-system/readme.md†L7-L118】

### Data Model & Metadata Contracts
- **Frameworks (`frameworks`):** `id`, `slug`, `title`, `version`, `domain`, `jurisdiction`, `publisher`, `valid_from/to`, `status`, `metadata`. Metadata captures regulatory IDs, localization, weighting hints, lifecycle flags, and source hashes to satisfy auditability and provenance requirements.【F:docs/02-technical-specifications/04-database-design.md†L41-L114】【F:docs/01-about/04-security-and-data-protection.md†L206-L259】
- **Controls (`controls`):** `framework_id`, `code`, `title`, `description`, `category`, `risk_level`, `evidence_requirements`, `metadata`; controls belong to a single framework version and link directly to governance checks for scoring.【F:docs/02-technical-specifications/04-database-design.md†L76-L99】【F:docs/03-systems/12-governance-engine/readme.md†L58-L153】
- **Mappings (`framework_mappings`):** `source_framework_id`, `source_control_id`, `target_framework_id`, `target_control_id`, `mapping_strength` (`exact`, `partial`, `informative`), `justification`, `tags`, `status`, `metadata`. Historical rows in `framework_mapping_history` retain previous relationships for compliance traceability.【F:docs/03-systems/09-control-management-system/readme.md†L49-L168】【F:docs/02-technical-specifications/06-security-implementation.md†L85-L141】
- **Versions (`framework_versions`):** Semantic versions capturing diff hashes, changelog narratives, approvals, rollout metadata, and compatibility flags so governance engine scoring can reference the correct snapshot.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L103-L171】【F:docs/01-about/10-risk-management-and-Mitigation.md†L146-L214】
- **Imports/Exports (`framework_imports`, `framework_exports`):** Track asynchronous ingestion, normalization, and artifact generation (CSV/JSON/XLSX) with payload URIs, statuses, ownership, and detailed error reports for audit and operational review.【F:docs/02-technical-specifications/07-integration-architecture.md†L73-L180】【F:docs/03-systems/05-admin-and-configuration-system/readme.md†L41-L179】

### Framework & Mapping Workflows
- **Framework Lifecycle:**
  1. `POST /api/v1/frameworks` validates payloads against celebrate/Joi schemas, generates a kebab-case slug, persists an initial version (v1.0.0), seeds default controls when provided, and emits `framework.created` with tenant context.
  2. `GET /api/v1/frameworks` supports pagination, jurisdiction, lifecycle, and publisher filters; `GET /api/v1/frameworks/:frameworkId` returns metadata, active version, control counts, coverage, and connected tasks so risk officers can track obligations.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L103-L171】【F:docs/01-about/06-mvp-and-roadmap.md†L224-L295】
  3. `PATCH /api/v1/frameworks/:frameworkId` records field-level diffs and routes breaking changes into draft versions for approval, logging every mutation into the audit log module.
  4. `DELETE /api/v1/frameworks/:frameworkId` performs soft archive with effective date windows, while `POST /api/v1/frameworks/:frameworkId/restore` revalidates references, reinstates mappings, and regenerates downstream caches.
- **Control Registration:** REST endpoints and `/api/v1/frameworks/:frameworkId/controls/import` bulk jobs create or update controls. Draft updates attach to unpublished versions; breaking changes flag new revisions. BullMQ jobs normalize CSV/JSON uploads, enforce referential integrity, and produce downloadable validation reports.
- **Mapping Management:** CRUD operations (`/api/v1/frameworks/:frameworkId/mappings`, `/api/v1/mappings/import`) enforce referential integrity, support reciprocal edges, maintain `framework_mapping_history`, and emit `mapping.*` events consumed by governance, reporting, and external integration services.
- **Version Governance:** Draft versions clone current state, aggregate diffs for review, and publish via Admin & Configuration approval workflows that increment semantic versions. Rollbacks reactivate prior versions, trigger recalculation jobs in the governance engine, and notify owners about potential score shifts.【F:docs/03-systems/05-admin-and-configuration-system/readme.md†L41-L179】【F:docs/03-systems/12-governance-engine/readme.md†L150-L205】
- **Multi-Framework Support:** Metadata tags align controls across standards, coverage analytics compute mapping percentages per framework pair, and import/export pipelines ensure schema validation, referential integrity, and policy enforcement. Cached aggregates feed dashboards and external partner exports.【F:docs/03-systems/14-dashboard-and-reporting-system/readme.md†L7-L118】【F:docs/03-systems/15-external-integrations-system/readme.md†L41-L167】

## Frontend Specification

### Frontend Location & Directory Layout
Framework administration UIs live under `client/src/features/frameworks`, implemented in React (JavaScript) with shared shadcn/Tailwind primitives for consistent accessibility and compliance cues.【F:docs/02-technical-specifications/03-frontend-architecture.md†L50-L160】【F:docs/01-about/04-security-and-data-protection.md†L200-L259】

```
client/src/features/frameworks/
├── pages/
│   ├── framework-catalog-page.jsx
│   ├── framework-detail-page.jsx
│   ├── mapping-matrix-page.jsx
│   └── version-history-page.jsx
├── components/
│   ├── framework-form.jsx
│   ├── control-list.jsx
│   ├── mapping-editor.jsx
│   └── version-diff-viewer.jsx
├── hooks/
│   ├── use-frameworks.js
│   ├── use-framework-mappings.js
│   └── use-framework-versions.js
└── api/
    └── frameworks-client.js

client/src/components/governance/
└── coverage-matrix-chart.jsx
```

### Reusable Components & UI Flows
- **Catalog & Detail:** `framework-catalog-page.jsx` surfaces jurisdiction, lifecycle, and publisher filters with saved views; `framework-form.jsx` handles create/update flows with inline validation and localization toggles; `control-list.jsx` manages framework-specific controls with inline edits, segmentation by categories, and bulk import triggers.
- **Mapping Operations:** `mapping-matrix-page.jsx` and `mapping-editor.jsx` enable control alignment across frameworks, set mapping strength, capture justifications with markdown support, and preview coverage metrics sourced from governance engine scores.
- **Version Governance:** `version-history-page.jsx` lists drafts and published versions while `version-diff-viewer.jsx` visualizes added/removed controls and mapping changes. Hooks surface task progress for imports/exports, stream BullMQ job status, and expose rollback actions routed through the Admin & Configuration approvals.

## Schema Specification
- **`frameworks` / `framework_versions`:** Canonical metadata, semantic versions, diff hashes, approvals, lifecycle flags, and jurisdictional scope; retention policies align with platform-wide data protection mandates.【F:docs/02-technical-specifications/04-database-design.md†L76-L136】【F:docs/01-about/04-security-and-data-protection.md†L206-L259】
- **`framework_controls`:** Framework-specific controls with risk metadata, evidence requirements, localization fields, and governance engine references for scoring.
- **`framework_mappings` / `framework_mapping_history`:** Cross-framework equivalence matrix with mapping strength, tags, justifications, status, and revision history supporting audit readiness and rollback analysis.
- **`framework_imports` / `framework_exports`:** Async job tracking tables (source, format, status, URIs, timestamps, error bundles) underpinning operational transparency and SLA reporting.
- **`framework_audit_log`:** Append-only ledger capturing actor, payload diffs, version transitions, and approval references; feeds the Audit Logging & Monitoring system for holistic oversight.【F:docs/03-systems/06-audit-logging-and-monitoring/readme.md†L7-L190】
- Relationships integrate with Control Management, Governance Engine, Check Management, Reporting, Task Management, and External Integrations to maintain compliance traceability across the platform.【F:docs/03-systems/09-control-management-system/readme.md†L7-L168】【F:docs/03-systems/12-governance-engine/readme.md†L58-L205】【F:docs/03-systems/13-task-management-system/readme.md†L7-L171】【F:docs/03-systems/15-external-integrations-system/readme.md†L41-L167】

## Operational Playbooks & References

### Playbooks
- **Onboard Framework:** Create framework, import controls, align mappings via preview/import flows, review draft diff, secure dual-approval through Admin & Configuration, publish the initial version, trigger exports, and notify downstream services and stakeholders.
- **Update Mappings After Regulatory Change:** Monitor integrations for updates, submit bulk mapping edits, run dry-run previews, route for governance approval with risk classifications, publish minor versions, and allow governance engine recalculations and reporting refreshes to propagate.【F:docs/01-about/10-risk-management-and-Mitigation.md†L146-L214】
- **Preserve Backward Compatibility:** Maintain retired mappings with status flags, leverage versioned exports for historical reports, enforce retention windows, and ensure reporting services respect `effective_from/to` intervals for financial and regulatory evidence packages.【F:docs/01-about/09-financial-plans-and-projections.md†L217-L264】

### Related Documentation
- [Control Management System](../09-control-management-system/readme.md) — authoritative control catalog and taxonomy alignment.
- [Dashboard & Reporting System](../14-dashboard-and-reporting-system/readme.md) — visualization of framework coverage and trend analysis.
- [External Integrations System](../15-external-integrations-system/readme.md) — regulatory feed connectors and export distribution.
- [Admin & Configuration System](../05-admin-and-configuration-system/readme.md) — governance approvals, lifecycle controls, and policy enforcement.
- [Governance Engine](../12-governance-engine/readme.md) — scoring, risk computation, and compliance automation triggered by mapping updates.

---

[← Previous](../09-control-management-system/readme.md) | [Next →](../11-evidence-management-system/readme.md)
