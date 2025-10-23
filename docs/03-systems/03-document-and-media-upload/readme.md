# Document and Media Upload System <!-- omit in toc -->

## Location: /server/src/modules/uploads

>### TL;DR
> The upload service brokers secure, auditable ingestion of documents and media into MinIO using presigned URLs and metadata contracts.
> It validates payload intent, orchestrates client-side uploads, compresses imagery, and persists immutable evidence records for downstream workflows.
>
> **All image assets must be compressed before finalizing an upload.** Compression is enforced at the worker tier and any bypass is treated as a policy violation requiring a release rollback.

---

- [Location: /server/src/modules/uploads](#location-serversrcmodulesuploads)
- [1. Purpose and Scope](#1-purpose-and-scope)
- [2. Storage Architecture](#2-storage-architecture)
  - [2.1 Core Components](#21-core-components)
  - [2.2 Bucket Strategy and Namespacing](#22-bucket-strategy-and-namespacing)
- [3. Upload Lifecycle](#3-upload-lifecycle)
  - [3.1 Intake and Metadata Validation](#31-intake-and-metadata-validation)
  - [3.2 Presigned URL Issuance](#32-presigned-url-issuance)
  - [3.3 Completion Callbacks and Versioning](#33-completion-callbacks-and-versioning)
- [4. Media Compression and Transformations](#4-media-compression-and-transformations)
  - [4.1 Compression Pipeline](#41-compression-pipeline)
  - [4.2 Supported Formats and Rejections](#42-supported-formats-and-rejections)
  - [4.3 Derivatives and Accessibility](#43-derivatives-and-accessibility)
- [5. Security, Compliance, and Governance](#5-security-compliance-and-governance)
  - [5.1 Access Control Integration](#51-access-control-integration)
  - [5.2 Data Protection and Retention](#52-data-protection-and-retention)
  - [5.3 Auditability and Chain of Custody](#53-auditability-and-chain-of-custody)
- [6. Operational Playbook](#6-operational-playbook)
  - [6.1 Monitoring and Alerting](#61-monitoring-and-alerting)
  - [6.2 Incident Response](#62-incident-response)
  - [6.3 Capacity and Cost Management](#63-capacity-and-cost-management)
- [7. Related Documentation](#7-related-documentation)

---

## 1. Purpose and Scope

The Document and Media Upload system provides a single entry point for files that must be preserved as governance evidence or shared artifacts. It issues short-lived MinIO presigned URLs, enforces content validation rules, compresses images, and anchors immutable metadata in PostgreSQL so downstream services (Evidence Repository, Governance Engine, Reporting) can reference a consistent record.【F:docs/02-technical-specifications/01-system-architecture.md†L173-L202】【F:docs/03-systems/11-evidence-management-system/readme.md†L7-L115】

## 2. Storage Architecture

### 2.1 Core Components

- **Upload Controller (`server/src/modules/uploads/controller.js`):** Receives intake requests, validates RBAC scopes, and coordinates presigned URL issuance.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L44-L135】
- **MinIO Integration (`server/src/integrations/minio.js`):** Wraps the official SDK, exposing helpers for presigned PUT URLs, lifecycle inspection, and bucket health checks.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L57-L135】
- **Evidence Metadata (`evidence` and `evidence_snapshots` tables):** Stores file fingerprints, compression status, and version lineage to guarantee deterministic retrievals.【F:docs/02-technical-specifications/04-database-design.md†L88-L146】
- **BullMQ Worker (`server/src/modules/uploads/worker.js`):** Processes completion callbacks, triggers compression jobs, and publishes status events to the Governance Engine.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L124-L171】【F:docs/03-systems/12-governance-engine/readme.md†L7-L104】

### 2.2 Bucket Strategy and Namespacing

MinIO buckets follow a three-level namespace: `{tenant}/{classification}/{yyyy}/{mm}`. Classification covers `evidence`, `policy`, `report`, and `media` segments so lifecycle policies can diverge per content type. Buckets are provisioned during tenant onboarding alongside access policies maintained by the Admin & Configuration system.【F:docs/03-systems/05-admin-and-configuration-system/readme.md†L65-L154】 Versioning is enabled globally to maintain immutable audit history and allow controlled rollbacks without data loss.【F:docs/02-technical-specifications/05-devops-infrastructure.md†L60-L119】

## 3. Upload Lifecycle

### 3.1 Intake and Metadata Validation

1. Client submits metadata (`filename`, `mimeType`, `checksum`, `classification`, `sizeBytes`) to `/api/uploads/request`.
2. Service validates payload against allowed MIME types, maximum file size (512 MB for documents, 50 MB for images), and verifies that the calling user has the `evidence:write` or `media:write` scope granted by RBAC.【F:docs/03-systems/02-rbac-system/readme.md†L7-L192】
3. If the upload is replacing existing evidence, the service resolves the parent record and ensures status allows edits (e.g., not locked for audit review).

### 3.2 Presigned URL Issuance

- The controller requests a presigned PUT URL from MinIO with a 10-minute expiration and enforces `Content-MD5` headers to detect tampering.【F:docs/02-technical-specifications/01-system-architecture.md†L173-L202】
- Response payload includes upload ID, presigned URL, required headers, and the compression policy flag to help clients prepare images before transfer.
- Clients upload directly to MinIO using the provided URL; retries must reuse the same upload ID to avoid orphaned objects.

### 3.3 Completion Callbacks and Versioning

- Clients call `/api/uploads/complete` with the upload ID after MinIO acknowledges the PUT.
- The worker queues compression tasks for images, calculates SHA-256 fingerprints for all files, and persists metadata (size, checksum, path, uploader) into PostgreSQL.
- If a prior version exists, the service increments the `version` column, retains the previous object path, and marks the latest version as active while preserving history for auditors.【F:docs/03-systems/11-evidence-management-system/readme.md†L47-L111】
- Completion event (`evidence.uploaded`) is published to the Governance Engine and Task Service to trigger follow-up workflows.【F:docs/03-systems/12-governance-engine/readme.md†L52-L113】【F:docs/03-systems/13-task-management-system/readme.md†L7-L226】

## 4. Media Compression and Transformations

### 4.1 Compression Pipeline

- All images are routed through the BullMQ worker, which invokes the `sharp` library with tenant-specific presets (max width 2560px, 85% quality for JPEG/WEBP, lossless PNG quantization).【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L124-L171】
- Compression results update the `compression_status` field (`pending`, `compressed`, `failed`). Uploads remain hidden from the Evidence Repository until compression succeeds.
- Failed compression jobs automatically retry three times with exponential backoff; persistent failures notify the Notification system for manual remediation.【F:docs/03-systems/04-notification-system/readme.md†L7-L222】

### 4.2 Supported Formats and Rejections

- **Documents:** `.pdf`, `.docx`, `.rtf`, `.txt`, `.md`. Files exceeding 512 MB or failing checksum validation are rejected with an HTTP 422.
- **Images:** `.png`, `.jpg`, `.jpeg`, `.webp`. Raw camera formats (e.g., `.heic`, `.nef`) are blocked; clients must convert before uploading.
- **Malware Scanning:** Objects route through the asynchronous ClamAV scanner; suspicious artifacts quarantine in the `hold` prefix pending security review.【F:docs/02-technical-specifications/06-security-implementation.md†L108-L196】

### 4.3 Derivatives and Accessibility

- Thumbnail derivatives (320px) are generated for UI previews and stored under the `media/derived` prefix with inherited retention rules.
- Text-based uploads capture extracted plain text (via Tika) to support search indexing; metadata records track extraction timestamps for the Reporting service.【F:docs/03-systems/14-dashboard-and-reporting-system/readme.md†L7-L118】
- Alt-text metadata is required for all imagery surfaced in customer-facing dashboards to maintain accessibility commitments.【F:docs/01-about/04-security-and-data-protection.md†L206-L259】

## 5. Security, Compliance, and Governance

### 5.1 Access Control Integration

- RBAC middleware enforces scope checks before presigned URL issuance; machine users leverage service-to-service tokens issued by the Auth service.【F:docs/03-systems/02-rbac-system/readme.md†L7-L192】【F:docs/03-systems/01-user-management-system/readme.md†L7-L214】
- Tenants may restrict uploads to approved MIME types and enforce data classification tags that propagate into the Governance Engine for control mappings.【F:docs/03-systems/09-control-management-system/readme.md†L7-L133】

### 5.2 Data Protection and Retention

- MinIO buckets enforce server-side encryption (SSE-S3) with keys rotated quarterly through the DevOps pipeline.【F:docs/02-technical-specifications/05-devops-infrastructure.md†L60-L226】
- Retention policies align with regulatory obligations (default seven years) and can be extended per control requirement; legal holds are tracked in the Evidence Repository UI.【F:docs/03-systems/11-evidence-management-system/readme.md†L92-L115】
- Cross-region replication follows DevOps guidance to satisfy durability and disaster recovery targets.【F:docs/02-technical-specifications/05-devops-infrastructure.md†L168-L226】

### 5.3 Auditability and Chain of Custody

- Every upload writes to the audit log with user, IP, object key, checksum, and compression result. Logs flow into the central monitoring stack for retention and anomaly detection.【F:docs/03-systems/06-audit-logging-and-monitoring/readme.md†L7-L200】
- Evidence snapshots capture diff metadata (who replaced what, when) so auditors can reconstruct history without accessing underlying objects.【F:docs/03-systems/11-evidence-management-system/readme.md†L47-L111】
- Download links reuse presigned URLs with scoped expirations and watermarking; requests are rate-limited and tracked for governance review.【F:docs/03-systems/10-framework-mapping-system/readme.md†L55-L217】

## 6. Operational Playbook

### 6.1 Monitoring and Alerting

- Dashboards track upload throughput, compression latency, presigned URL error rates, and MinIO 5xx responses.
- Alert thresholds: presigned issuance failures >2% for 5 minutes, compression job backlog >1000 tasks, or MinIO latency >800 ms triggers PagerDuty escalation to the Evidence squad.【F:docs/03-systems/04-notification-system/readme.md†L7-L222】【F:docs/03-systems/06-audit-logging-and-monitoring/readme.md†L7-L200】
- Synthetic probes periodically attempt uploads for each classification to validate policy enforcement.【F:docs/03-systems/07-probe-management-system/readme.md†L7-L226】

### 6.2 Incident Response

- For failed uploads, support staff review audit trails, retry compression manually if needed, and coordinate with the Notification service for stakeholder updates.【F:docs/03-systems/04-notification-system/readme.md†L7-L222】
- Malware detection escalations follow the Security Implementation playbook; quarantined objects remain inaccessible until the security team clears them.【F:docs/02-technical-specifications/06-security-implementation.md†L108-L196】
- Data loss scenarios (e.g., MinIO outage) trigger failover runbooks managed by DevOps, including restoring from backups and verifying object integrity via stored checksums.【F:docs/02-technical-specifications/05-devops-infrastructure.md†L168-L226】

### 6.3 Capacity and Cost Management

- Monthly reviews evaluate bucket growth, compression savings, and storage class utilization; anomalies prompt remediation actions such as deduplication or additional lifecycle tiers.
- Cost allocation tags on buckets roll up to finance dashboards maintained by the Reporting team for transparency and budgeting.【F:docs/03-systems/14-dashboard-and-reporting-system/readme.md†L7-L118】
- Pre-signed URL traffic is cached through the API gateway; scaling decisions align with the Deployment & Environment guide’s sizing matrix.【F:docs/02-technical-specifications/08-deployment-and-environment-guide.md†L53-L186】

## 7. Related Documentation

- [Evidence Management System](../11-evidence-management-system/readme.md) — downstream repository behavior, legal holds, and retrieval workflows.
- [Audit Logging & Monitoring](../06-audit-logging-and-monitoring/readme.md) — centralized observability pipelines and retention policies.
- [Security Implementation](../../02-technical-specifications/06-security-implementation.md) — encryption, malware scanning, and incident response procedures.
- [DevOps Infrastructure](../../02-technical-specifications/05-devops-infrastructure.md) — MinIO provisioning, lifecycle policies, and disaster recovery planning.

---

[← Previous](../02-rbac-system/readme.md) | [Next →](../04-notification-system/readme.md)
