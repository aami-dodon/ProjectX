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
Evidence orchestration lives in `server/src/modules/evidence`, integrating with shared MinIO clients and exposing upload/download APIs that enforce encryption, presigned URL lifecycles, and linkage to governance entities.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L60-L133】

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

### Ingestion & Distribution Flows
- **Manual & Assisted Uploads:** Privileged users request upload sessions (`/evidence/upload`), receive short-lived presigned URLs to stream files into MinIO, and on completion metadata (size, checksum, MIME type, actor, control/check/task references) persists to `evidence` and `evidence_links`.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L122-L133】【F:docs/02-technical-specifications/01-system-architecture.md†L166-L193】
- **Automated Probes:** System credentials issued via Casbin policies allow probes to submit artifacts with identical metadata schema and version tracking, preserving parity between automated and manual submissions.【F:docs/02-technical-specifications/04-database-design.md†L80-L99】【F:docs/01-about/04-security-and-data-protection.md†L263-L287】
- **Secure Downloads:** RBAC-validated requests (`/evidence/:id/download`) generate presigned URLs bound to object keys and expirations. Downloads reference stored metadata for checksum validation and append immutable audit entries.【F:docs/01-about/04-security-and-data-protection.md†L263-L311】

### Metadata & Chain of Custody
- Evidence metadata in PostgreSQL captures identifiers, storage references, versions, lifecycle timestamps, and relationships to controls, checks, and tasks. Integrity constraints prevent orphaning while soft deletes preserve history.【F:docs/02-technical-specifications/04-database-design.md†L86-L130】
- Audit trails log uploads, approvals, downloads, and edits with timestamps, actor identities, network origin, and cryptographic hashes stored in append-only ledgers for tamper detection.【F:docs/01-about/04-security-and-data-protection.md†L87-L311】
- Versioning, tagging, and retention policies retain complete histories (default 36 months) with automated archival, GDPR-compliant deletion, and encrypted backups (nightly full, hourly differential).【F:docs/02-technical-specifications/04-database-design.md†L147-L171】

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

## Schema Specification
- **`evidence`:** Stores artifact metadata (id, storage_key, version, size, checksum, mime_type, uploader_id, source, created_at, archived_at, tags, retention_policy_id).
- **`evidence_links`:** Joins evidence to controls, checks, and tasks with context (role, justification, linked_by, linked_at).
- **`evidence_events`:** Audit ledger capturing action type (upload, download, approval), actor, origin IP, hash, and integrity verification status.
- **`evidence_retention_policies`:** Defines retention duration, archival storage location, legal hold flags, and purge schedules.
- **`evidence_versions`:** Optional table tracking previous file hashes, storage keys, and validation outcomes for immutable history.
- Relationships integrate with Control Management, Check Management, Task Management, and Notification systems for traceable governance actions.【F:docs/03-systems/13-task-management-system/readme.md†L7-L226】【F:docs/03-systems/04-notification-system/readme.md†L7-L170】

## Operational Playbooks & References

### Storage & Security Operations
- Configure MinIO endpoints and credentials per environment via secure vaults; confirm upload smoke tests post-deploy. Infrastructure-as-code manages bucket lifecycle, versioning, and capacity planning.【F:docs/02-technical-specifications/08-deployment-and-environment-guide.md†L100-L205】【F:docs/02-technical-specifications/05-devops-infrastructure.md†L200-L214】
- Enforce AES-256 encryption at rest (MinIO + PostgreSQL) and TLS in transit. Presigned URLs must target HTTPS endpoints; key rotation follows managed KMS policies.【F:docs/01-about/04-security-and-data-protection.md†L87-L150】
- Integrity verification combines MinIO checksums, stored metadata hashes, and immutable log signatures. Deployment rituals include validating upload/download flows and monitoring alerts for anomaly detection.【F:docs/02-technical-specifications/08-deployment-and-environment-guide.md†L182-L205】

### Related Documentation
- [Document & Media Upload System](../03-document-and-media-upload/readme.md) — presigned URL orchestration and compression policies.
- [Check Management System](../08-check-management-system/readme.md) — evidence linkage to check outcomes.
- [Control Management System](../09-control-management-system/readme.md) — control catalog relationships.
- [Task Management System](../13-task-management-system/readme.md) — remediation workflows referencing evidence.

---

[← Previous](../10-framework-mapping-system/readme.md) | [Next →](../12-governance-engine/readme.md)
