# Evidence Management System <!-- omit in toc -->

## Location: /server/src/modules/evidence

>### TL;DR
> The evidence management system governs how compliance artifacts are collected, secured, and distributed.
> Implemented in `server/src/modules/evidence`, it orchestrates presigned upload/download flows, metadata persistence, and immutable audit trails.
> This reference documents ingestion patterns, schema design, operational safeguards, and integrations with controls, checks, and tasks.

---

- [Location: /server/src/modules/evidence](#location-serversrcmodulesevidence)
- [1. Module Overview](#1-module-overview)
- [2. Upload and Download Flows](#2-upload-and-download-flows)
  - [2.1 Manual and Assisted Uploads](#21-manual-and-assisted-uploads)
  - [2.2 Automated Probe Ingestion](#22-automated-probe-ingestion)
  - [2.3 Secure Downloads](#23-secure-downloads)
- [3. Metadata and Schema Management](#3-metadata-and-schema-management)
- [4. Audit Trails and Monitoring](#4-audit-trails-and-monitoring)
- [5. Versioning, Tagging, and Retention Policies](#5-versioning-tagging-and-retention-policies)
- [6. Linkage to Controls, Checks, and Tasks](#6-linkage-to-controls-checks-and-tasks)
- [7. Operational Guidance](#7-operational-guidance)
  - [7.1 Storage Configuration](#71-storage-configuration)
  - [7.2 Encryption and Key Management](#72-encryption-and-key-management)
  - [7.3 Integrity Verification](#73-integrity-verification)

---

## 1. Module Overview
The evidence management capability lives under `server/src/modules/evidence` and provides the backend surface for collecting, securing, and distributing compliance artifacts across the platform. It integrates with the shared MinIO client in `server/src/integrations`, exposes dedicated upload, download, and metadata endpoints, and enforces encryption, presigned URL workflows, and linkage back to controls and tasks.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L60-L133】

## 2. Upload and Download Flows

### 2.1 Manual and Assisted Uploads
1. A privileged user (e.g., Compliance Officer) requests an upload session from `/evidence/upload`.
2. The module generates a short-lived presigned URL that allows the browser or probe to stream the file directly into the externally hosted MinIO bucket without routing through the API server, while simultaneously preparing the metadata payload that will be persisted in PostgreSQL once the transfer succeeds.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L122-L133】【F:docs/02-technical-specifications/01-system-architecture.md†L166-L193】
3. On completion, the module captures file attributes (size, checksum, MIME type), the initiating user or system identity, and the governance objects supplied in the upload request (control ID, check ID, task ID). This metadata is stored in the `evidence` and `evidence_links` tables so that downstream scoring, dashboards, and remediation workflows can resolve relationships immediately.【F:docs/02-technical-specifications/04-database-design.md†L86-L99】

### 2.2 Automated Probe Ingestion
1. Probes or scheduled collectors fetch raw governance data and call the same upload endpoint with system credentials issued through Casbin policies.
2. Evidence objects emitted by probes inherit the same metadata schema and version tracking, ensuring parity between automated and manual submissions. Probe activity is logged alongside user activity so that audit trails retain the origin of every artifact.【F:docs/02-technical-specifications/04-database-design.md†L80-L99】【F:docs/01-about/04-security-and-data-protection.md†L263-L287】

### 2.3 Secure Downloads
1. When a reviewer initiates `/evidence/:id/download`, the module validates RBAC policies, then generates a presigned URL scoped to the object key, HTTP verb, and expiration time.
2. Downloads reference the persisted metadata for size and checksum validation, and the access event is appended to immutable audit logs for traceability.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L122-L133】【F:docs/01-about/04-security-and-data-protection.md†L263-L311】

## 3. Metadata and Schema Management
Evidence metadata is normalized in PostgreSQL via the `evidence` table, which stores identifiers, storage object references, version markers, and lifecycle timestamps. Relational tables such as `evidence_links` associate each record with controls, checks, and remediation tasks, while indexing strategies enable efficient search and reporting across large evidence sets.【F:docs/02-technical-specifications/04-database-design.md†L86-L113】 Integrity constraints and soft-delete strategies prevent orphaned records and guarantee referential accuracy even as evidence ages or is superseded.【F:docs/02-technical-specifications/04-database-design.md†L122-L130】

## 4. Audit Trails and Monitoring
All interactions with evidence—uploads, approvals, downloads, and metadata edits—are captured in the platform’s immutable logging pipeline. Entries record timestamps, actor identities, affected entities, and source network information, and they are hashed and stored in append-only repositories so that tampering is detectable. Retention and archival controls maintain audit readiness while balancing storage efficiency.【F:docs/01-about/04-security-and-data-protection.md†L263-L312】 The evidence module emits structured events that feed these logs, ensuring every compliance artifact maintains a verifiable chain of custody.【F:docs/01-about/04-security-and-data-protection.md†L87-L107】

## 5. Versioning, Tagging, and Retention Policies
The repository retains a complete, versioned history for each artifact, preserving immutable records of prior submissions and their validation outcomes. Evidence can be tagged by product, control, or framework to support filtered investigations and reporting views across the compliance dashboards.【F:docs/01-about/03-concept-summary.md†L150-L158】 Retention defaults to 36 months, with automated archival to cold storage and GDPR-compliant deletion workflows for records that exceed contractual lifespans or are subject to erasure requests.【F:docs/02-technical-specifications/04-database-design.md†L158-L161】【F:docs/01-about/04-security-and-data-protection.md†L140-L150】 Backup policies extend durability, with nightly full snapshots, hourly differentials, and AES-256 encryption applied before storage.【F:docs/02-technical-specifications/04-database-design.md†L147-L171】

## 6. Linkage to Controls, Checks, and Tasks
Evidence objects are first-class participants in the governance data model: controls aggregate related checks and attach remediation tasks, each of which references supporting evidence. The `evidence_links` join table enables one-to-many relationships between controls and artifacts, as well as many-to-one mappings from tasks back to the evidence that validates remediation completion. Task records maintain direct pointers to associated evidence so that closing a remediation item automatically updates compliance status and audit reports.【F:docs/02-technical-specifications/04-database-design.md†L86-L99】【F:docs/01-about/03-concept-summary.md†L124-L158】【F:docs/01-about/03-concept-summary.md†L326-L358】

## 7. Operational Guidance

### 7.1 Storage Configuration
Set the MinIO endpoint, access key, and secret key through environment variables managed per environment (`.env.dev`, `.env.staging`, `.env.prod`). Store the secret material in a dedicated vault and inject it during CI/CD deploys. Post-deployment checks must confirm data persistence against PostgreSQL and MinIO, and smoke tests should exercise evidence upload flows before sign-off.【F:docs/02-technical-specifications/08-deployment-and-environment-guide.md†L100-L205】 Bucket lifecycle management and MinIO object versioning are part of the infrastructure-as-code layer, providing scale-out capacity and rollback options for artifacts.【F:docs/02-technical-specifications/05-devops-infrastructure.md†L200-L214】

### 7.2 Encryption and Key Management
MinIO storage and the backing PostgreSQL metadata store enforce AES-256 encryption at rest and TLS for transit, with keys rotated through managed KMS services. The evidence module inherits these guarantees and validates that presigned URLs are scoped to HTTPS endpoints, ensuring uploaded and downloaded content remains encrypted end-to-end.【F:docs/02-technical-specifications/01-system-architecture.md†L166-L193】【F:docs/01-about/04-security-and-data-protection.md†L87-L134】【F:docs/02-technical-specifications/04-database-design.md†L169-L172】

### 7.3 Integrity Verification
Cryptographic integrity checks accompany evidence ingestion and logging, enabling the platform to detect tampering across both storage and audit layers. Immutable log storage with hashing, combined with checksum validation from MinIO and the metadata store, ensures that every evidence download can be cross-verified against the original upload record.【F:docs/01-about/04-security-and-data-protection.md†L87-L107】【F:docs/01-about/04-security-and-data-protection.md†L272-L311】 Regular deployment rituals include verifying evidence upload workflows and confirming that monitoring surfaces catch anomalies, maintaining continuous assurance over evidence integrity.【F:docs/02-technical-specifications/08-deployment-and-environment-guide.md†L182-L205】

---

[← Previous](10-framework-mapping-system.md) | [Next →](12-governance-engine.md)
