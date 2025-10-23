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
Framework governance lives under `server/src/modules/frameworks`, following the layered architecture used across the backend.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L52-L135】

```
server/src/modules/frameworks/
├── controllers/
├── dto/
├── services/
├── repositories/
├── mappers/
├── policies/
├── tasks/
├── subscribers/
└── index.ts
```

Controllers expose REST endpoints, DTOs enforce schemas (Zod), services orchestrate repositories and events, policies enforce Casbin authorization, tasks handle asynchronous imports/exports, and subscribers broadcast mapping changes to reporting, evidence, and notification modules.

### Data Model & Metadata Contracts
- **Frameworks (`frameworks`):** `id`, `slug`, `title`, `version`, `domain`, `jurisdiction`, `publisher`, `valid_from/to`, `status`, `metadata`. Metadata captures regulatory IDs, localization, weighting hints, lifecycle flags, and source hashes.
- **Controls (`controls`):** `framework_id`, `code`, `title`, `description`, `category`, `risk_level`, `evidence_requirements`, `metadata`; controls belong to a single framework version.
- **Mappings (`mappings`):** `source_framework_id`, `source_control_id`, `target_framework_id`, `target_control_id`, `mapping_strength` (`exact`, `partial`, `informative`), `justification`, `tags`, `status`, `metadata`.
- **Versions (`framework_versions`):** Semver snapshots capturing diff hashes, changelog, approvals, and metadata for audit.
- **Imports/Exports:** `framework_imports` and `framework_exports` manage asynchronous ingestion and artifact generation (CSV/JSON/XLSX) with payload URIs, statuses, and error reports.

### Framework & Mapping Workflows
- **Framework Lifecycle:**
  1. `POST /frameworks` validates payload, generates slug, persists initial version (v1.0.0), and emits `framework.created`.
  2. `GET /frameworks` lists by jurisdiction/lifecycle filters; `GET /frameworks/:id` returns metadata, active version, control counts, coverage stats.
  3. `PATCH /frameworks/:id` captures field diffs; version-affecting changes spawn draft revisions.
  4. `DELETE` soft-archives frameworks while preserving historical reports; `POST /frameworks/:id/restore` revalidates and replays mappings.
- **Control Registration:** Create/update/delete controls via REST endpoints or bulk imports. Draft updates attach to draft versions; breaking changes flag new revisions. Imports run asynchronously via BullMQ with downloadable error reports.
- **Mapping Management:** CRUD endpoints enforce referential integrity, support bi-directional edges, maintain `mapping_history`, and emit `mapping.*` events. Bulk imports support CSV/JSON with preview endpoints for diff validation.
- **Version Governance:** Draft versions clone current state, aggregate diffs for review, and publish via approval workflows that increment semver. Rollbacks reactivate prior versions and notify downstream systems. Diff exports provide auditor-ready CSV/JSON.
- **Multi-Framework Support:** Metadata tags align controls across standards; coverage analytics compute mapping percentages; import/export pipelines ensure schema validation, referential integrity, policy enforcement, and versioned artifacts.

## Frontend Specification

### Frontend Location & Directory Layout
Framework administration UIs live under `client/src/features/frameworks`, enabling compliance teams to manage frameworks, controls, and mappings.【F:docs/02-technical-specifications/03-frontend-architecture.md†L96-L160】

```
client/src/features/frameworks/
├── pages/
│   ├── FrameworkCatalogPage.tsx
│   ├── FrameworkDetailPage.tsx
│   ├── MappingMatrixPage.tsx
│   └── VersionHistoryPage.tsx
├── components/
│   ├── FrameworkForm.tsx
│   ├── ControlList.tsx
│   ├── MappingEditor.tsx
│   └── VersionDiffViewer.tsx
├── hooks/
│   ├── useFrameworks.ts
│   ├── useFrameworkMappings.ts
│   └── useFrameworkVersions.ts
└── api/
    └── frameworksClient.ts

client/src/components/governance/
└── CoverageMatrixChart.tsx
```

### Reusable Components & UI Flows
- **Catalog & Detail:** `FrameworkCatalogPage` surfaces filters by jurisdiction, lifecycle, and publisher. `FrameworkForm` handles creation/updates with slug validation and metadata editing. `ControlList` manages framework-specific controls with inline edits and bulk import triggers.
- **Mapping Operations:** `MappingMatrixPage` and `MappingEditor` enable alignment across frameworks, set mapping strength, attach justifications, and preview coverage metrics.
- **Version Governance:** `VersionHistoryPage` lists drafts/published versions; `VersionDiffViewer` visualizes added/removed controls and mapping changes. Hooks coordinate with import/export tasks for progress feedback.

## Schema Specification
- **`frameworks` / `framework_versions`:** Canonical framework metadata and semver snapshots with diff hashes, changelog, approvals, and lifecycle flags.
- **`framework_controls`:** Framework-specific controls with risk metadata, evidence requirements, and localization fields.
- **`framework_mappings`:** Cross-framework equivalence matrix with mapping strength, tags, justifications, status, and history records.
- **`framework_imports` / `framework_exports`:** Async job tracking (source, format, status, URIs, processed timestamps, error reports).
- **`framework_audit_log`:** Append-only ledger capturing actor, payload diffs, version transitions, and approval references.
- Relationships integrate with Control Management, Check Management, Reporting, and External Integrations to maintain compliance traceability.【F:docs/03-systems/09-control-management-system/readme.md†L7-L159】【F:docs/03-systems/14-dashboard-and-reporting-system/readme.md†L7-L118】

## Operational Playbooks & References

### Playbooks
- **Onboard Framework:** Create framework, import controls, align mappings via preview/import flows, review draft diff, approve new version, trigger exports, and notify downstream services.
- **Update Mappings After Regulatory Change:** Monitor connectors for updates, submit bulk mapping edits, dry-run preview, route for governance approval (threshold-based), publish minor version, and allow scoring/reporting recalculations to propagate.
- **Preserve Backward Compatibility:** Maintain retired mappings with status flags, leverage versioned exports for historical reports, and ensure reporting services respect `effective_from/to` intervals.

### Related Documentation
- [Control Management System](../09-control-management-system/readme.md) — authoritative control catalog.
- [Dashboard & Reporting System](../14-dashboard-and-reporting-system/readme.md) — visualization of framework coverage.
- [External Integrations System](../15-external-integrations-system/readme.md) — regulatory feed connectors.
- [Admin & Configuration System](../05-admin-and-configuration-system/readme.md) — governance approvals and lifecycle controls.

---

[← Previous](../09-control-management-system/readme.md) | [Next →](../11-evidence-management-system/readme.md)
