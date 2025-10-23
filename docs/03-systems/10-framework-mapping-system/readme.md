# Framework Mapping System <!-- omit in toc -->

## Location: /server/src/modules/frameworks

>### TL;DR
> The framework mapping system governs lifecycle management for regulatory frameworks and their control mappings.
> It centralizes metadata, aligns controls across standards, and exposes APIs for onboarding, versioning, and exporting frameworks.
> Use this guide to understand data contracts, CRUD flows, and operational guardrails that keep mappings authoritative.

---

- [Location: /server/src/modules/frameworks](#location-serversrcmodulesframeworks)
- [1. Module Overview](#1-module-overview)
- [2. Data Model \& Metadata Contracts](#2-data-model--metadata-contracts)
  - [Metadata Schema Highlights](#metadata-schema-highlights)
- [3. CRUD Flows](#3-crud-flows)
  - [3.1 Framework Lifecycle](#31-framework-lifecycle)
  - [3.2 Control Registration](#32-control-registration)
  - [3.3 Mapping Management](#33-mapping-management)
  - [3.4 Version Governance](#34-version-governance)
- [4. Multi-Framework Compliance Support](#4-multi-framework-compliance-support)
  - [4.1 Metadata Alignment Layer](#41-metadata-alignment-layer)
  - [4.2 Import \& Export Pipelines](#42-import--export-pipelines)
  - [4.3 Update Governance](#43-update-governance)
- [5. End-to-End Examples](#5-end-to-end-examples)
  - [5.1 Onboarding a New Framework](#51-onboarding-a-new-framework)
  - [5.2 Updating Mappings After a Regulatory Change](#52-updating-mappings-after-a-regulatory-change)
  - [5.3 Preserving Backward Compatibility in Reports](#53-preserving-backward-compatibility-in-reports)
- [6. Operational Considerations](#6-operational-considerations)

---

## 1. Module Overview

The **Framework Mapping System** in `server/src/modules/frameworks` standardizes how governance frameworks, controls, and cross-framework mappings are stored and exposed through the API. It follows the layered architecture used across the backend:

```
server/src/modules/frameworks
├── controllers/        → HTTP handlers (Express routers)
├── dto/                → Request/response contracts validated with Zod
├── services/           → Business logic orchestrating repositories and events
├── repositories/       → Prisma queries for frameworks, controls, mappings, versions
├── mappers/            → Mapping utilities for entity ↔ DTO transformations
├── policies/           → Casbin-powered authorization guards
├── tasks/              → BullMQ queues for imports, exports, version diffing
├── subscribers/        → Domain events for scoring + reporting recalculations
└── index.js            → Module bootstrap, router registration, dependency wiring
```

The module exposes REST + event-driven interfaces that allow:

- **Framework CRUD:** create, read, update, soft-delete, and restore frameworks.
- **Control catalogs:** maintain framework-specific controls with scoped metadata.
- **Cross-mapping:** map controls across internal and external frameworks for "comply once, satisfy many" workflows.
- **Version governance:** snapshot framework revisions, track historical mappings, and trigger score recalculations.
- **Synchronization hooks:** emit events consumed by reporting, evidence, and notification modules whenever mappings change.

## 2. Data Model & Metadata Contracts

| Entity | Table | Key Fields | Notes |
| --- | --- | --- | --- |
| `Framework` | `frameworks` | `id`, `slug`, `title`, `version`, `domain`, `jurisdiction`, `publisher`, `valid_from`, `valid_to`, `status`, `metadata` (JSONB) | Metadata stores arbitrary key/value pairs such as regulatory references, risk tier, and localization tags. `slug` is globally unique for routing and import/export alignment. |
| `Control` | `controls` | `id`, `framework_id`, `code`, `title`, `description`, `category`, `risk_level`, `evidence_requirements`, `metadata` | Controls belong to exactly one framework version. `code` is unique per framework.
| `Mapping` | `mappings` | `id`, `source_framework_id`, `source_control_id`, `target_framework_id`, `target_control_id`, `mapping_strength`, `justification`, `tags`, `metadata`, `status` | Supports many-to-many relationships between controls. `mapping_strength` uses enums (`exact`, `partial`, `informative`).
| `FrameworkVersion` | `framework_versions` | `id`, `framework_id`, `major`, `minor`, `patch`, `change_log`, `published_at`, `approved_by`, `diff_hash`, `metadata` | Tracks snapshots of framework + mapping state. Stored as semver to allow compatibility rules.
| `ImportBatch` | `framework_imports` | `id`, `source`, `format`, `status`, `submitted_by`, `payload_uri`, `processed_at`, `error_report_uri` | Used for asynchronous ingestion of CSV/JSON imports.
| `ExportJob` | `framework_exports` | `id`, `format`, `filters`, `requested_by`, `status`, `artifact_uri`, `expires_at` | Supports scheduled exports and audit evidence.

### Metadata Schema Highlights

- **Global identifiers:** `metadata.external_ids` (list) keeps regulatory IDs and links to authoritative sources.
- **Localization:** `metadata.localization.{locale}.title` enables translated labels.
- **Scoring hints:** `metadata.weighting` (0–1) influences aggregated compliance scoring.
- **Lifecycle flags:** `metadata.lifecycle.stage` (draft, active, sunset) and `metadata.lifecycle.review_due` for governance SLAs.
- **Data lineage:** `metadata.source_hash` ensures reproducibility of imported frameworks.

## 3. CRUD Flows

### 3.1 Framework Lifecycle

| Step | Action | Component | Notes |
| --- | --- | --- | --- |
| 1 | `POST /frameworks` with `CreateFrameworkDto` | `FrameworkController.create` → `FrameworkService.create` | Validates payload (Zod), enforces Casbin policy (`frameworks:create`). Generates slug, persists framework + initial version (v1.0.0) inside a transaction. Emits `framework.created` event. |
| 2 | `GET /frameworks` | `FrameworkController.list` → `FrameworkService.list` | Supports filtering by jurisdiction, lifecycle stage, search, pagination. Returns DTO containing active version and summary counts. |
| 3 | `GET /frameworks/:id` | `FrameworkController.get` | Fetches framework with latest version, control counts, mapping coverage stats. |
| 4 | `PATCH /frameworks/:id` | `FrameworkController.update` → `FrameworkService.update` | Partial updates; tracks changed fields for audit log. When version-affecting fields change (title, metadata.lifecycle), service creates a draft revision. |
| 5 | `DELETE /frameworks/:id` | `FrameworkController.archive` | Soft deletes; sets `status = archived` and triggers `framework.archived`. Controls and mappings remain for historical reports but are hidden in active queries. |
| 6 | `POST /frameworks/:id/restore` | `FrameworkController.restore` | Restores archived frameworks, revalidates slug collisions, and replays cached mappings.

### 3.2 Control Registration

1. `POST /frameworks/:id/controls`
   - Validated by `CreateControlDto` (code uniqueness enforced).
   - Service associates control with the draft or active version depending on payload flag `attachToDraft`.
   - Emits `control.created` and recalculates framework coverage metrics.
2. `PATCH /frameworks/:id/controls/:controlId`
   - Supports editing metadata, evidence requirements, and risk levels.
   - When `breakingChange = true`, service triggers a new draft version and adds diff entry.
3. `DELETE /frameworks/:id/controls/:controlId`
   - Marks control as deprecated; mapping service downgrades mapping strength to `informative` to avoid orphaned dependencies.
4. Bulk upload via `POST /frameworks/:id/controls/import`
   - Accepts CSV/JSON zipped artifacts.
   - Stored in `framework_imports` and processed asynchronously via `FrameworkImportTask` (BullMQ). Validation errors compiled into downloadable report.

### 3.3 Mapping Management

- **Create mapping:** `POST /frameworks/:id/mappings` expects `CreateMappingDto` containing source control, target framework/control, strength, justification, tags.
  - Service ensures both controls exist and are version-compatible.
  - Creates symmetrical edge if `biDirectional = true`.
  - Emits `mapping.created` event consumed by scoring + reporting microservices.

- **Update mapping:** `PATCH /frameworks/:id/mappings/:mappingId`
  - Allows adjusting `mapping_strength`, `tags`, `justification`, or re-pointing to a new target control.
  - Maintains change history in `mapping_history` table for audit.

- **Delete mapping:** soft delete via `DELETE` to preserve version history. Related exports mark mapping as `status = retired`.

- **Bulk operations:** `POST /frameworks/:id/mappings/import`
  - Supports multi-framework CSV/JSON format with columns for source/target codes, jurisdiction, and weighting.
  - Import pipeline cross-validates codes and warns on missing dependencies.

### 3.4 Version Governance

1. **Draft creation:**
   - `POST /frameworks/:id/versions/draft` clones current version metadata, copies controls + mappings into `framework_version_items` table.
   - Draft is isolated; updates to controls/mappings flagged with `draftVersionId`.

2. **Change review:**
   - `FrameworkVersionService.reviewDraft` aggregates diff summary (added/removed controls, mapping strength changes).
   - Compliance officers annotate diff and attach evidence or regulatory references.

3. **Approval:**
   - `POST /frameworks/:id/versions/:versionId/approve`
   - Locks the draft, increments semver based on diff classification (major/minor/patch).
   - Emits `framework.version.published` event to trigger recalculations and exports.

4. **Rollback:**
   - `POST /frameworks/:id/versions/:versionId/rollback` reactivates previous version, reassigns active mappings, and notifies downstream systems.

5. **Diff export:**
   - `GET /frameworks/:id/versions/:versionId/diff` returns JSON + CSV summarizing changes for auditors.

## 4. Multi-Framework Compliance Support

### 4.1 Metadata Alignment Layer

- **Framework taxonomy:** Jurisdiction, sector, risk tier, and lifecycle fields allow filtering frameworks for composite compliance packages.
- **Control tags:** `metadata.tags` (e.g., `{"category": "Transparency", "pillar": "NIST-GOV"}`) align controls across frameworks.
- **Equivalence matrix:** Stored in `mappings` table linking controls across frameworks; enriched with `mapping_strength` and `justification` for audit traceability.
- **Coverage analytics:** `FrameworkService.get` returns `coverageMatrix` (percentage of source controls mapped per target framework) enabling compliance dashboards to highlight gaps.

### 4.2 Import & Export Pipelines

- **Import formats:**
  - **CSV:** Column headers `framework_code`, `control_code`, `target_framework_slug`, `target_control_code`, `strength`, `justification`, `metadata.*`.
  - **JSON:** Nested structure aligning with DTOs, supporting metadata injection.
  - **Regulatory payloads:** Integration with official sources (e.g., EU AI Act) via connectors stored in `metadata.source_uri`.

- **Validation stages:**
  1. Schema validation using Zod.
  2. Referential integrity check against existing frameworks/controls.
  3. Policy enforcement (only compliance officers can import global mappings).
  4. Dry-run preview endpoint `POST /frameworks/:id/mappings/import/preview` returning diff summary.

- **Export options:**
  - `GET /frameworks/:id/export?format=csv|json|xlsx` generates static snapshots for auditors.
  - Multi-framework export includes mapping matrix and localization fields, enabling offline compliance reviews.
  - Exports are versioned; artifact metadata contains `framework_version_id` and `mapping_hash` for traceability.

### 4.3 Update Governance

- **Change approval:** All mapping updates require review when affecting more than configurable threshold (e.g., >20 mappings). Workflows integrate with notification service for approvals.
- **Audit trails:** Each mutation writes to `framework_audit_log` capturing actor, timestamp, payload diff, and resulting version.
- **Dependency notifications:** Reporting service listens to `mapping.updated` events to refresh cached scoring. If unresolved dependencies exist, service raises tasks for remediation.
- **Backward compatibility rules:**
  - Major version increases trigger background job to clone reports and maintain references to previous mappings.
  - Soft-deleted mappings remain accessible via `status = retired` for historical queries.
  - `ReportService` respects `effective_from` and `effective_to` fields, so historical reports maintain accurate framework context.

## 5. End-to-End Examples

### 5.1 Onboarding a New Framework

1. **Create framework:** Compliance officer invokes `POST /frameworks` with metadata (jurisdiction, publisher, lifecycle stage).
2. **Seed controls:** Upload CSV through `/controls/import`. System validates codes, attaches to draft version, and logs warnings.
3. **Draft mappings:** Use `POST /mappings/import/preview` to align new controls with existing frameworks (e.g., NIST AI RMF).
4. **Review draft version:** Stakeholders review diff summary, add justifications, and approve via `/versions/:id/approve` (minor version if no breaking changes).
5. **Trigger exports:** Auto-generated export job creates CSV/JSON artifacts for partner distribution.
6. **Notify downstream systems:** `framework.version.published` event prompts reporting module to compute baseline scores for the new framework.

### 5.2 Updating Mappings After a Regulatory Change

1. **Monitor regulatory feed:** External connector updates `metadata.source_hash`, flagging impacted controls.
2. **Bulk mapping edit:** Compliance officer submits CSV with new target control references.
3. **Dry-run validation:** `/mappings/import/preview` returns warnings for deprecated controls; officer resolves issues and resubmits.
4. **Governance approval:** Because >20 mappings changed, workflow routes draft to governance board. Approvers review diff, add `justification` referencing new regulation clause.
5. **Publish minor version:** `/versions/:id/approve` increments minor version, activates new mappings.
6. **Automated recalculation:** Scoring service consumes `mapping.updated` events, recalculates framework overlap, and posts summary to Slack via notification module.

### 5.3 Preserving Backward Compatibility in Reports

1. **Report snapshot creation:** When a report is generated, it stores `framework_version_id` and `mapping_hash` used at runtime.
2. **New major release:** Framework team introduces major changes (control renumbering). Approval publishes `v2.0.0`.
3. **Compatibility bridge:** Version service spawns `BackwardCompatibilityTask` copying retired mappings to `compatibility_overrides` table with `effective_to = NULL`.
4. **Historical report rendering:** Report API checks if requested version differs from latest; if so, it loads compatibility overrides and displays retired control codes with `status = legacy` badge.
5. **Sunset notification:** When `effective_to` reached, background job notifies report owners to refresh assessments under the new version.

## 6. Operational Considerations

- **Access Control:** Casbin policies ensure only users with `role = compliance_officer` or `governance_admin` can modify frameworks or publish versions. Read access is granted to auditors and product owners.
- **Performance:** Repository layer uses batched Prisma transactions and caching for common lookups (`frameworkBySlug`, `mappingMatrixByFramework`). Redis-backed cache invalidated via events.
- **Observability:** Every controller logs structured events (pino) with correlation IDs. BullMQ tasks expose Prometheus metrics for import/export throughput and failure rates.
- **Error Handling:** Controllers wrap service errors into standardized `ApiError` objects with machine-readable codes (`FRAMEWORK_NOT_FOUND`, `MAPPING_VALIDATION_FAILED`).
- **Testing:** Module includes Jest suites for service logic, contract tests for controllers, and snapshot tests for diff exports. Integration tests run via Postman collection `frameworks.postman.json` during CI.

---

[← Previous](../09-control-management-system/readme.md) | [Next →](../11-evidence-management-system/readme.md)
