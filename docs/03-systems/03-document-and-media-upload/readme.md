# Document and Media Upload System <!-- omit in toc -->

## Location: /server/src/modules/uploads

>### TL;DR
> The upload service brokers secure, auditable ingestion of documents and media into MinIO using presigned URLs and metadata contracts.
> It validates payload intent, orchestrates client-side uploads, compresses imagery, and persists immutable evidence records for downstream workflows.
>
> **All image assets must be compressed before finalizing an upload.** Compression is enforced at the worker tier and any bypass is treated as a policy violation requiring a release rollback.

---

- [Backend Specification](#backend-specification)
  - [Location & Directory Layout](#backend-location--directory-layout)
  - [Storage Architecture](#storage-architecture)
  - [Upload Lifecycle](#upload-lifecycle)
  - [Media Compression & Transformations](#media-compression--transformations)
- [Frontend Specification](#frontend-specification)
  - [Location & Directory Layout](#frontend-location--directory-layout)
  - [Reusable Components & UI Flows](#reusable-components--ui-flows)
- [API Endpoints & Contracts](#api-endpoints--contracts)
- [Configuration & Dependencies](#configuration--dependencies)
- [Schema Specification](#schema-specification)
- [Testing & QA Expectations](#testing--qa-expectations)
- [Operational Playbooks & References](#operational-playbooks--references)

---

## Backend Specification

### Backend Location & Directory Layout
The upload service runs under `server/src/modules/uploads`, coordinating Express controllers, MinIO integrations, and BullMQ workers for presigned URL issuance and completion processing.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L44-L171】

```
server/src/modules/uploads/
├── controller.ts
├── routes.ts
├── services/
│   ├── metadata.service.ts
│   └── presign.service.ts
├── worker/
│   ├── index.ts
│   └── compression.processor.ts
├── integrations/
│   └── minio.client.ts
└── events/
    └── evidence.publisher.ts
```

### Storage Architecture
The Document and Media Upload system provides a single entry point for governance evidence and shared artifacts. It issues short-lived MinIO presigned URLs, enforces content validation, compresses images, and stores immutable metadata in PostgreSQL so downstream services (Evidence Repository, Governance Engine, Reporting) can reference a consistent record.【F:docs/02-technical-specifications/01-system-architecture.md†L173-L202】【F:docs/03-systems/11-evidence-management-system/readme.md†L7-L115】 Core components include:

- **Upload Controller:** Validates RBAC scopes, orchestrates presigned URL issuance, and tracks upload state transitions.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L44-L135】
- **MinIO Integration:** Wraps the SDK for presigned PUT URLs, lifecycle inspection, and bucket health checks.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L57-L135】
- **BullMQ Worker:** Processes completion callbacks, runs compression, calculates fingerprints, and publishes status events to dependent services.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L124-L171】【F:docs/03-systems/12-governance-engine/readme.md†L7-L104】
- **Bucket Strategy:** Buckets follow `{tenant}/{classification}/{yyyy}/{mm}` naming, with classifications (`evidence`, `policy`, `report`, `media`) aligning lifecycle policies. Provisioning occurs during tenant onboarding alongside Admin & Configuration access policies; versioning stays enabled for immutable audit history.【F:docs/03-systems/05-admin-and-configuration-system/readme.md†L65-L154】【F:docs/02-technical-specifications/05-devops-infrastructure.md†L60-L119】

### Upload Lifecycle
1. **Intake & Validation:** Clients submit metadata (`filename`, `mimeType`, `checksum`, `classification`, `sizeBytes`) to `/api/v1/uploads/request`. The service validates MIME types, size limits (512 MB documents, 50 MB images), and RBAC scopes (`evidence:write`, `media:write`). Replacement uploads verify that the prior record is editable.【F:docs/03-systems/02-rbac-system/readme.md†L7-L192】
2. **Presigned URL Issuance:** Controllers request MinIO presigned PUT URLs with 10-minute expirations and enforce `Content-MD5` headers to detect tampering. Response payloads include upload IDs, headers, and compression flags so clients can prepare assets.【F:docs/02-technical-specifications/01-system-architecture.md†L173-L202】
3. **Completion & Versioning:** Clients confirm via `/api/v1/uploads/complete` after MinIO acknowledges the PUT. Workers queue compression jobs, compute SHA-256 fingerprints, and persist metadata (size, checksum, path, uploader). If versions exist, `version` increments while prior paths remain for auditors; completion events (`evidence.uploaded`) notify the Governance Engine and Task Service.【F:docs/03-systems/11-evidence-management-system/readme.md†L47-L111】【F:docs/03-systems/12-governance-engine/readme.md†L52-L113】【F:docs/03-systems/13-task-management-system/readme.md†L7-L226】

### Media Compression & Transformations
- **Compression Pipeline:** BullMQ workers route images through `sharp` with tenant presets (max width 2560 px, JPEG/WEBP 85 % quality, PNG quantization). Status updates track `pending`, `compressed`, or `failed`; uploads remain hidden until compression succeeds.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L124-L171】
- **Supported Formats:** Documents (`.pdf`, `.docx`, `.rtf`, `.txt`, `.md`) and images (`.png`, `.jpg`, `.jpeg`, `.webp`) pass validation; oversize files, checksum mismatches, or blocked formats (e.g., `.heic`, `.nef`) return HTTP 422. Malware scanning integrates with asynchronous ClamAV, quarantining suspicious objects in a `hold` prefix.【F:docs/02-technical-specifications/06-security-implementation.md†L108-L196】
- **Derivatives & Accessibility:** Thumbnails (320 px) support UI previews, extracted text feeds search indexing, and alt-text metadata is mandatory for imagery displayed in dashboards.【F:docs/03-systems/14-dashboard-and-reporting-system/readme.md†L7-L118】【F:docs/01-about/04-security-and-data-protection.md†L206-L259】 Notifications fire when compression repeatedly fails for manual remediation.【F:docs/03-systems/04-notification-system/readme.md†L7-L222】

## API Endpoints & Contracts

The service exposes REST endpoints under `/api/v1/uploads`, conforming to the platform’s OpenAPI conventions and Express middleware stack (JWT auth + Casbin RBAC + Joi validation).【F:docs/02-technical-specifications/01-system-architecture.md†L160-L198】【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L1-L77】 Every route returns JSON envelopes with `{ status, data, error }` and consistent error codes (400 validation, 401/403 auth, 409 version conflicts, 422 payload issues, 500 internal).

| Endpoint | Method | Description | Request Payload | Success Response |
| --- | --- | --- | --- | --- |
| `/api/v1/uploads/request` | POST | Validate metadata, create `upload_requests` row, and issue presigned PUT contract. | `{ filename, mimeType, checksum, classification, sizeBytes, altText?, tags?, parentEvidenceId? }` | `{ uploadId, presignedUrl, headers, expiresAt, requiresCompression }` with `409` if the referenced evidence cannot be replaced.【F:docs/03-systems/02-rbac-system/readme.md†L7-L192】【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L44-L135】 |
| `/api/v1/uploads/complete` | POST | Confirm object persistence, enqueue compression, and persist `evidence` entry. | `{ uploadId, contentMd5, storageKey, sizeBytes }` | `{ evidenceId, version, compressionStatus }`; background worker emits `evidence.uploaded` event on success.【F:docs/03-systems/12-governance-engine/readme.md†L52-L113】【F:docs/03-systems/13-task-management-system/readme.md†L7-L226】 |
| `/api/v1/uploads/:id` | GET | Fetch metadata and status for UI history / retries. | `id` path param, optional `includeEvents` query flag. | `{ evidenceId, compressionStatus, events[] }`; respects RBAC scopes and redacts quarantined objects.【F:docs/03-systems/06-audit-logging-and-monitoring/readme.md†L7-L200】 |

Webhook-style callbacks (`/api/v1/uploads/callbacks/minio`) can be enabled for MinIO event listeners; they validate HMAC signatures from MinIO, translate events into worker jobs, and respond within 3 s to stay under MinIO retry thresholds.【F:docs/02-technical-specifications/07-integration-architecture.md†L88-L176】

## Frontend Specification

### Frontend Location & Directory Layout
Client upload experiences live in `client/src/features/uploads`, integrating with shared file input primitives and evidence viewers to deliver presigned flows and progress updates.【F:docs/02-technical-specifications/03-frontend-architecture.md†L50-L139】

```
client/src/features/uploads/
├── pages/
│   ├── UploadRequestPage.tsx
│   ├── UploadReviewPage.tsx
│   └── UploadHistoryPage.tsx
├── components/
│   ├── FileDropzone.tsx
│   ├── CompressionStatusBadge.tsx
│   └── PresignedUrlInstructions.tsx
├── hooks/
│   ├── useUploadRequest.ts
│   └── useUploadProgress.ts
└── api/
    └── uploadsClient.ts

client/src/components/evidence/
├── EvidencePreviewCard.tsx
└── EvidenceTimeline.tsx
```

### Reusable Components & UI Flows
- **Shared Components:** `FileDropzone` and `CompressionStatusBadge` leverage design-system inputs and toasts to standardize drag-and-drop, checksum validation, and compression visibility across modules.
- **Presigned Flow:** Upload request pages call `/api/v1/uploads/request`, present required headers, and hand off to the browser or native client to PUT objects directly to MinIO. Progress hooks update status banners until `/api/v1/uploads/complete` finalizes.
- **Evidence Surfacing:** `EvidencePreviewCard` and `EvidenceTimeline` components show thumbnails, extracted text, and version history across the Evidence Repository and Reporting features.
- **Accessibility & Guidance:** `PresignedUrlInstructions` educates users on compression requirements, alt-text capture, and failure recovery, reusing messaging from the Notification system for consistency.【F:docs/03-systems/04-notification-system/readme.md†L7-L222】

## Configuration & Dependencies

- **Environment Variables:** `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET_UPLOADS`, `UPLOADS_MAX_DOCUMENT_BYTES`, `UPLOADS_MAX_IMAGE_BYTES`, and `CLAMAV_HOST` are injected via `.env` per environment and sourced from the platform’s vault-backed configuration workflow.【F:docs/02-technical-specifications/05-devops-infrastructure.md†L60-L103】【F:docs/02-technical-specifications/01-system-architecture.md†L204-L223】 Workers additionally require `BULLMQ_REDIS_URL` and `COMPRESSION_QUEUE_CONCURRENCY` to throttle jobs.
- **Service Integrations:** MinIO clients reuse shared connection pools under `server/src/integrations/minio.client.ts`; ClamAV scanning runs through the security integration bus defined for the broader platform to guarantee policy parity.【F:docs/02-technical-specifications/06-security-implementation.md†L108-L196】【F:docs/03-systems/11-evidence-management-system/readme.md†L7-L115】
- **Deployment Footprint:** Upload controllers live in the API container, while compression workers run as dedicated queue consumers with autoscaling rules tuned to keep backlog under 1 000 jobs and latency below 800 ms, matching observability thresholds used across systems.【F:docs/02-technical-specifications/05-devops-infrastructure.md†L108-L140】【F:docs/03-systems/06-audit-logging-and-monitoring/readme.md†L7-L200】
- **Language Standardization:** Backend and worker code remain JavaScript-only with Jest-based unit tests, aligning with the platform-wide ban on TypeScript to preserve tooling consistency.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L1-L32】【F:docs/02-technical-specifications/09-testing-and-qa.md†L40-L76】

## Schema Specification
- **`evidence` & `evidence_snapshots`:** Persist file fingerprints, compression status, classifications, uploader identity, and version lineage for immutable history.【F:docs/02-technical-specifications/04-database-design.md†L88-L146】
- **`upload_requests`:** Tracks presigned URL issuance, expiration, checksum expectations, and tenant scope to reconcile orphaned uploads.
- **`upload_events`:** Append-only log capturing state transitions (`requested`, `completed`, `compressed`, `failed`) and correlation IDs for observability.
- Relationships integrate with RBAC (`auth_roles`/`auth_role_assignments`) for scope validation and with Governance Engine entities to trigger evidence-driven workflows.【F:docs/03-systems/12-governance-engine/readme.md†L52-L113】

## Testing & QA Expectations

- **Unit & Integration Tests:** Controllers, services, and workers use Jest suites stored under `server/tests/uploads` to cover validation, presign issuance, and compression orchestration with ≥85 % coverage, mirroring platform targets.【F:docs/02-technical-specifications/09-testing-and-qa.md†L55-L176】
- **API & Contract Tests:** Postman/Newman collections assert OpenAPI parity for `/api/v1/uploads/*` and replay failure scenarios (checksum mismatch, oversized file) in CI to enforce shift-left validation.【F:docs/02-technical-specifications/09-testing-and-qa.md†L83-L158】
- **E2E Flows:** Cypress tests under `client/tests/uploads` execute drag-and-drop, presign PUT, and completion confirmation, verifying accessibility cues (alt-text prompts, compression warnings) and integration with Evidence timelines.【F:docs/02-technical-specifications/09-testing-and-qa.md†L88-L154】【F:docs/03-systems/11-evidence-management-system/readme.md†L7-L104】
- **Security & Performance:** OWASP ZAP scans ensure upload routes resist injection and auth bypass, while k6 load tests run against presign issuance to validate SLA commitments (≤800 ms P95 latency, ≤2 % failure rate).【F:docs/02-technical-specifications/09-testing-and-qa.md†L93-L154】【F:docs/03-systems/06-audit-logging-and-monitoring/readme.md†L154-L200】

## Operational Playbooks & References

### Security, Compliance, and Governance
- RBAC middleware enforces scope checks; service-to-service tokens handle machine uploads, and classification tags propagate into the Governance Engine for control mappings.【F:docs/03-systems/02-rbac-system/readme.md†L7-L192】【F:docs/03-systems/09-control-management-system/readme.md†L7-L133】
- MinIO applies SSE-S3 encryption with quarterly key rotation, retention defaults to seven years, and legal holds surface in the Evidence UI; cross-region replication satisfies durability targets.【F:docs/02-technical-specifications/05-devops-infrastructure.md†L60-L226】【F:docs/03-systems/11-evidence-management-system/readme.md†L92-L115】
- Audit trails capture uploader metadata, IP, object key, checksum, and compression outcome; download presigns are watermarked, rate limited, and logged for governance review.【F:docs/03-systems/06-audit-logging-and-monitoring/readme.md†L7-L200】【F:docs/03-systems/10-framework-mapping-system/readme.md†L55-L217】

### Monitoring and Incident Response
- Dashboards watch throughput, compression latency, presign errors, and MinIO 5xx rates; thresholds (issuance failures >2 %, compression backlog >1000, latency >800 ms) trigger Evidence squad PagerDuty alerts.【F:docs/03-systems/04-notification-system/readme.md†L7-L222】【F:docs/03-systems/06-audit-logging-and-monitoring/readme.md†L7-L200】
- Synthetic probes validate flows per classification, while incident response runbooks cover manual compression retries, malware quarantine handling, and MinIO failover with checksum verification.【F:docs/03-systems/07-probe-management-system/readme.md†L7-L226】【F:docs/02-technical-specifications/06-security-implementation.md†L108-L196】【F:docs/02-technical-specifications/05-devops-infrastructure.md†L168-L226】

### Capacity & Cost Management
- Monthly reviews assess bucket growth, compression savings, and lifecycle tiering; cost allocation tags feed Reporting dashboards for budgeting transparency.【F:docs/03-systems/14-dashboard-and-reporting-system/readme.md†L7-L118】
- API gateway caching and deployment sizing follow the Deployment & Environment guide to scale presigned traffic efficiently.【F:docs/02-technical-specifications/08-deployment-and-environment-guide.md†L53-L186】

### Related Documentation
- [Evidence Management System](../11-evidence-management-system/readme.md)
- [Audit Logging & Monitoring](../06-audit-logging-and-monitoring/readme.md)
- [Security Implementation](../../02-technical-specifications/06-security-implementation.md)
- [DevOps Infrastructure](../../02-technical-specifications/05-devops-infrastructure.md)

---

[← Previous](../02-rbac-system/readme.md) | [Next →](../04-notification-system/readme.md)
