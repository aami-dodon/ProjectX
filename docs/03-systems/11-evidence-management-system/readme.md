# Evidence Management System <!-- omit in toc -->

## Location: /server/src/modules/evidence

>### TL;DR
> The evidence management system governs how compliance artifacts are collected, secured, and distributed.
> Implemented in `server/src/modules/evidence`, it orchestrates presigned upload/download flows, metadata persistence, and immutable audit trails.
> This reference documents ingestion patterns, schema design, operational safeguards, and integrations with controls, checks, and tasks.

---

- [Backend Specification](#backend-specification)
  - [Location & Directory Layout](#backend-location--directory-layout)
  - [Ingestion & Distribution Flows](#ingestion--distribution-flows)
  - [Metadata & Chain of Custody](#metadata--chain-of-custody)
- [Frontend Specification](#frontend-specification)
  - [Location & Directory Layout](#frontend-location--directory-layout)
  - [Reusable Components & UI Flows](#reusable-components--ui-flows)
- [Schema Specification](#schema-specification)
- [Operational Playbooks & References](#operational-playbooks--references)

---

## Backend Specification

### Backend Location & Directory Layout
Evidence orchestration lives in `server/src/modules/evidence`, integrating with shared MinIO clients and exposing upload/download APIs that enforce encryption, presigned URL lifecycles, and linkage to governance entities.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L44-L171】

```
server/src/modules/evidence/
├── controllers/
│   ├── upload.controller.ts
│   ├── download.controller.ts
│   └── metadata.controller.ts
├── services/
│   ├── upload.service.ts
│   ├── download.service.ts
│   └── metadata.service.ts
├── repositories/
│   ├── evidence.repository.ts
│   └── evidence-links.repository.ts
├── integrations/
│   └── minio.client.ts
├── events/
│   ├── evidence.created.ts
│   └── evidence.accessed.ts
└── tasks/
    └── retention.scheduler.ts
```

### API Surface & Controllers
| Endpoint | Method | Controller | Purpose |
| --- | --- | --- | --- |
| `/api/v1/evidence/upload` | POST | `upload.controller.ts` | Issues presigned upload sessions, validates RBAC scopes, and coordinates checksum-validated completion callbacks.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L122-L171】 |
| `/api/v1/evidence/:id/download` | GET | `download.controller.ts` | Authorizes access, minting short-lived presigned GET URLs with binding to stored metadata and audit context.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L122-L171】【F:docs/01-about/04-security-and-data-protection.md†L248-L338】 |
| `/api/v1/evidence/:id/metadata` | GET/PUT | `metadata.controller.ts` | Retrieves or amends descriptive metadata, version lineage, retention flags, and governance linkages under audit review policies.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L122-L171】【F:docs/02-technical-specifications/04-database-design.md†L82-L139】 |
| `/api/v1/evidence/:id/links` | POST/DELETE | `metadata.controller.ts` | Adds or removes associations to controls, checks, and tasks while enforcing compensating control documentation.【F:docs/02-technical-specifications/04-database-design.md†L82-L146】【F:docs/03-systems/09-control-management-system/readme.md†L28-L103】 |

Controllers register with Express routers inside `server/src/modules/evidence/routes.ts` and rely on shared middleware for authentication (`JwtGuard`), Casbin scope checks, and structured error handling to maintain consistent API posture across the platform.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L44-L171】【F:docs/02-technical-specifications/06-security-implementation.md†L6-L148】

### Service Responsibilities & Cross-Cutting Concerns
- **`upload.service.ts`:** Generates presigned PUT URLs, records expected checksums, and queues completion tasks for immutability verification. Handles both human and automated probe submissions so ingestion parity remains consistent.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L44-L171】【F:docs/02-technical-specifications/07-integration-architecture.md†L70-L117】
- **`download.service.ts`:** Resolves storage keys, enforces download throttling, and assembles audit payloads prior to generating signed GET URLs. Integrates with Notification and Audit Logging modules for anomaly detection hooks.【F:docs/01-about/04-security-and-data-protection.md†L248-L338】【F:docs/03-systems/06-audit-logging-and-monitoring/readme.md†L7-L200】
- **`metadata.service.ts`:** Applies validation schemas, persists retention and version markers, and orchestrates link mutations to governance entities. Soft-delete semantics preserve historical context while preventing orphaned records.【F:docs/02-technical-specifications/04-database-design.md†L82-L177】
- **Repositories:** Prisma-backed repositories centralize query patterns, enforce referential integrity, and expose transactional helpers for multi-table updates (evidence + links + events). Indices on tags, control IDs, and retention states keep retrieval performant for dashboards.【F:docs/02-technical-specifications/04-database-design.md†L82-L150】
- **Integrations & Events:** Shared MinIO client wraps credential injection and bucket routing; event publishers emit `evidence.created` and `evidence.accessed` messages into the governance event bus consumed by Control, Task, and Notification systems.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L44-L171】【F:docs/03-systems/04-notification-system/readme.md†L7-L222】【F:docs/03-systems/13-task-management-system/readme.md†L7-L226】

### Workflow, Events & Integrations
1. **Session Initiation:** Clients (user or probe) request uploads; RBAC middleware evaluates scopes (`evidence:write`, `probe:evidence`) and enforces tenant isolation. Casbin policies align with RBAC system definitions to prevent privilege drift.【F:docs/03-systems/02-rbac-system/readme.md†L7-L192】【F:docs/02-technical-specifications/06-security-implementation.md†L85-L148】
2. **Presign Orchestration:** Upload service calculates object keys using `{tenant}/{classification}/{yyyy}/{mm}` conventions inherited from the Upload System to ensure consistent retention policies and compression behavior.【F:docs/03-systems/03-document-and-media-upload/readme.md†L33-L131】
3. **Completion & Validation:** Workers verify size, checksum, and malware scan status before promoting evidence to active state, persisting metadata, and publishing `evidence.created` events that the Governance Engine consumes to refresh coverage matrices.【F:docs/03-systems/03-document-and-media-upload/readme.md†L107-L177】【F:docs/03-systems/12-governance-engine/readme.md†L52-L113】
4. **Access & Audit:** Download requests gather metadata (version, retention, legal holds), log immutable audit entries, and stream via expiring URLs. Audit logs feed dashboards and compliance reports for regulators.【F:docs/01-about/04-security-and-data-protection.md†L248-L338】【F:docs/03-systems/14-dashboard-and-reporting-system/readme.md†L7-L118】
5. **Retention Automation:** `retention.scheduler.ts` evaluates retention policies nightly, transitioning artifacts to archival storage, pausing deletions under legal hold, and opening remediation tasks when manual approval is required.【F:docs/02-technical-specifications/04-database-design.md†L162-L190】【F:docs/03-systems/13-task-management-system/readme.md†L7-L226】

### Ingestion & Distribution Flows
- **Manual & Assisted Uploads:** Privileged users request upload sessions (`/evidence/upload`), receive short-lived presigned URLs to stream files into MinIO, and on completion metadata (size, checksum, MIME type, actor, control/check/task references) persists to `evidence` and `evidence_links`.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L122-L133】【F:docs/02-technical-specifications/01-system-architecture.md†L166-L193】
- **Automated Probes:** System credentials issued via Casbin policies allow probes to submit artifacts with identical metadata schema and version tracking, preserving parity between automated and manual submissions.【F:docs/02-technical-specifications/04-database-design.md†L80-L99】【F:docs/01-about/04-security-and-data-protection.md†L263-L287】
- **Secure Downloads:** RBAC-validated requests (`/evidence/:id/download`) generate presigned URLs bound to object keys and expirations. Downloads reference stored metadata for checksum validation and append immutable audit entries.【F:docs/01-about/04-security-and-data-protection.md†L263-L311】

### Metadata & Chain of Custody
- Evidence metadata in PostgreSQL captures identifiers, storage references, versions, lifecycle timestamps, and relationships to controls, checks, and tasks. Integrity constraints prevent orphaning while soft deletes preserve history.【F:docs/02-technical-specifications/04-database-design.md†L86-L130】
- Audit trails log uploads, approvals, downloads, and edits with timestamps, actor identities, network origin, and cryptographic hashes stored in append-only ledgers for tamper detection.【F:docs/01-about/04-security-and-data-protection.md†L87-L311】
- Versioning, tagging, and retention policies retain complete histories (default 36 months) with automated archival, GDPR-compliant deletion, and encrypted backups (nightly full, hourly differential).【F:docs/02-technical-specifications/04-database-design.md†L147-L171】
- **Indexing & Searchability:** Text search indexes on evidence names, tags, and linked controls power global search, while composite indexes on `(control_id, retention_state)` enable fast filtering in dashboards without degrading transactional writes.【F:docs/02-technical-specifications/04-database-design.md†L112-L150】
- **Data Integrity Safeguards:** Soft deletes, referential constraints, and versioned updates guarantee traceable history while preventing cascading data loss in downstream governance modules.【F:docs/02-technical-specifications/04-database-design.md†L120-L177】

## Frontend Specification

### Frontend Location & Directory Layout
Evidence workflows surface in `client/src/features/evidence`, giving compliance users upload interfaces, review dashboards, and linkage to governance objects.【F:docs/02-technical-specifications/03-frontend-architecture.md†L96-L160】

```
client/src/features/evidence/
├── pages/
│   ├── EvidenceLibraryPage.tsx
│   ├── EvidenceUploadPage.tsx
│   ├── EvidenceDetailPage.tsx
│   └── EvidenceRetentionPage.tsx
├── components/
│   ├── EvidenceUploadWizard.tsx
│   ├── EvidenceMetadataPanel.tsx
│   ├── EvidenceDownloadButton.tsx
│   └── EvidenceLinkingForm.tsx
├── hooks/
│   ├── useEvidenceLibrary.ts
│   ├── useEvidenceUpload.ts
│   └── useEvidenceRetention.ts
└── api/
    └── evidenceClient.ts

client/src/components/governance/
└── EvidenceTimeline.tsx
```

### Reusable Components & UI Flows
- **Upload Wizard:** Guides users through metadata capture (control, check, task references), calculates checksums client-side, and displays compression requirements before requesting presigned URLs.
- **Library & Detail Views:** `EvidenceLibraryPage` provides search/filtering by tags, framework, control, and retention status; `EvidenceMetadataPanel` reveals version history, audit logs, and linked remediation tasks.
- **Download & Linking:** `EvidenceDownloadButton` enforces revalidation before generating presigned links, while `EvidenceLinkingForm` allows reassociation of artifacts with additional controls or tasks under audit supervision.
- **Retention Management:** `EvidenceRetentionPage` and `useEvidenceRetention` display lifecycle stages (active, archived, purge scheduled) with approval workflows for legal holds and deletions.

### State Management & API Contracts
- **API Client (`api/evidenceClient.ts`):** Wraps Axios with interceptors for JWT handling, error normalization, and retry logic aligned with frontend architecture guidelines.【F:docs/02-technical-specifications/03-frontend-architecture.md†L96-L168】
- **Hooks:** `useEvidenceLibrary`, `useEvidenceUpload`, and `useEvidenceRetention` encapsulate query caching, optimistic updates for metadata edits, and websocket-driven status updates broadcast from Notification service topics.【F:docs/02-technical-specifications/03-frontend-architecture.md†L96-L168】【F:docs/03-systems/04-notification-system/readme.md†L7-L222】
- **State Containers:** Feature hooks integrate with Auth and Notification contexts to respect RBAC-scoped UI and toasts, falling back to local reducers for wizard progress per the design philosophy of localized state.【F:docs/02-technical-specifications/03-frontend-architecture.md†L88-L150】
- **Validation & Accessibility:** Forms leverage shared validation schemas and shadcn/ui components to remain WCAG AA compliant, with keyboard navigable evidence tables and focus-managed modals for download confirmation.【F:docs/02-technical-specifications/03-frontend-architecture.md†L88-L146】

### Localization & Reporting Hooks
- Text content draws from shared localization files, allowing evidence labels, retention states, and audit statuses to render in the user’s preferred locale. Currency/date formatting matches compliance dashboards for consistent reporting narratives.【F:docs/02-technical-specifications/03-frontend-architecture.md†L168-L210】【F:docs/03-systems/14-dashboard-and-reporting-system/readme.md†L7-L118】
- Evidence pages emit analytics events consumed by Dashboard & Reporting to surface artifact freshness metrics and control coverage insights alongside other governance KPIs.【F:docs/03-systems/14-dashboard-and-reporting-system/readme.md†L7-L118】

## Schema Specification
- **`evidence`:** Stores artifact metadata (id, storage_key, version, size, checksum, mime_type, uploader_id, source, created_at, archived_at, tags, retention_policy_id).
- **`evidence_links`:** Joins evidence to controls, checks, and tasks with context (role, justification, linked_by, linked_at).
- **`evidence_events`:** Audit ledger capturing action type (upload, download, approval), actor, origin IP, hash, and integrity verification status.
- **`evidence_retention_policies`:** Defines retention duration, archival storage location, legal hold flags, and purge schedules.
- **`evidence_versions`:** Optional table tracking previous file hashes, storage keys, and validation outcomes for immutable history.
- Relationships integrate with Control Management, Check Management, Task Management, and Notification systems for traceable governance actions.【F:docs/03-systems/13-task-management-system/readme.md†L7-L226】【F:docs/03-systems/04-notification-system/readme.md†L7-L170】
- **Indices & Partitioning:** High-volume tables (`evidence`, `evidence_events`) adopt time-based partitioning and text search indexes to satisfy search requirements without sacrificing ingestion throughput.【F:docs/02-technical-specifications/04-database-design.md†L61-L150】
- **Retention Policies:** Default 36-month retention with configurable extensions ensures legal compliance; archival routines move aged evidence to cold storage while preserving immutable references for auditors.【F:docs/02-technical-specifications/04-database-design.md†L162-L190】

## Operational Playbooks & References

### Storage & Security Operations
- Configure MinIO endpoints and credentials per environment via secure vaults; confirm upload smoke tests post-deploy. Infrastructure-as-code manages bucket lifecycle, versioning, and capacity planning.【F:docs/02-technical-specifications/08-deployment-and-environment-guide.md†L100-L205】【F:docs/02-technical-specifications/05-devops-infrastructure.md†L155-L226】
- Enforce AES-256 encryption at rest (MinIO + PostgreSQL) and TLS in transit. Presigned URLs must target HTTPS endpoints; key rotation follows managed KMS policies.【F:docs/01-about/04-security-and-data-protection.md†L87-L150】
- Integrity verification combines MinIO checksums, stored metadata hashes, and immutable log signatures. Deployment rituals include validating upload/download flows and monitoring alerts for anomaly detection.【F:docs/02-technical-specifications/08-deployment-and-environment-guide.md†L182-L205】

### Monitoring, Alerting & Incident Response
- Observability dashboards track API latency, presign success rate, retention job duration, and MinIO health, with PagerDuty alerts when thresholds breach SLOs (99.9 % uptime for production evidence services).【F:docs/02-technical-specifications/05-devops-infrastructure.md†L179-L206】
- Audit and notification pipelines emit anomalies (e.g., repeated download failures, unexpected bulk exports) to SIEM tooling for investigation, aligning with the security-by-design mandate.【F:docs/01-about/04-security-and-data-protection.md†L248-L338】【F:docs/02-technical-specifications/06-security-implementation.md†L6-L148】
- Incident runbooks cover presign queue backlogs, retention job stalls, and cross-region failover. Disaster recovery exercises validate multi-region MinIO replicas and Postgres snapshots before reactivating evidence access.【F:docs/02-technical-specifications/05-devops-infrastructure.md†L213-L226】【F:docs/02-technical-specifications/04-database-design.md†L162-L190】

### Testing & Quality Assurance
- Automated integration suites create temporary uploads, verify metadata persistence, and validate download authorizations across role permutations as part of CI.【F:docs/02-technical-specifications/09-testing-and-qa.md†L91-L156】
- QA scripts exercise retention scheduler paths (archive, purge, legal hold) in staging environments with synthetic data to ensure audit trails remain intact before production deployment.【F:docs/02-technical-specifications/09-testing-and-qa.md†L118-L156】

### Related Documentation
- [Document & Media Upload System](../03-document-and-media-upload/readme.md) — presigned URL orchestration and compression policies.
- [Check Management System](../08-check-management-system/readme.md) — evidence linkage to check outcomes.
- [Control Management System](../09-control-management-system/readme.md) — control catalog relationships.
- [Task Management System](../13-task-management-system/readme.md) — remediation workflows referencing evidence.

---

[← Previous](../10-framework-mapping-system/readme.md) | [Next →](../12-governance-engine/readme.md)
