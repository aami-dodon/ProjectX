# 4. Database Design <!-- omit in toc -->

>### TL;DR  
> This section defines the database architecture, schema design, and operational principles for the AI Governance Platform.  
> It explains how the **externally hosted PostgreSQL** database is structured, managed, and secured using **Prisma ORM**.  
> The database is fully relational, optimized for governance data models including users, frameworks, controls, evidence, and audit logs.  
> The objective is to ensure integrity, performance, and scalability while maintaining alignment with compliance and data protection standards.

---

- [4.1 Purpose and Overview](#41-purpose-and-overview)
- [4.2 Database Architecture](#42-database-architecture)
  - [Key Architectural Features](#key-architectural-features)
- [4.3 Schema Structure and Core Tables](#43-schema-structure-and-core-tables)
  - [Users and Roles](#users-and-roles)
  - [Frameworks and Controls](#frameworks-and-controls)
  - [Probes and Checks](#probes-and-checks)
  - [Evidence Management](#evidence-management)
  - [Compliance Scores](#compliance-scores)
  - [Audit Logs and Alerts](#audit-logs-and-alerts)
- [4.4 Indexing and Query Optimization](#44-indexing-and-query-optimization)
  - [Indexing Guidelines](#indexing-guidelines)
  - [Query Optimization](#query-optimization)
- [4.5 Data Integrity and Relationships](#45-data-integrity-and-relationships)
  - [Integrity Controls](#integrity-controls)
  - [Relationship Model Summary](#relationship-model-summary)
- [4.6 Backup, Recovery, and Retention](#46-backup-recovery-and-retention)
  - [Backup Policy](#backup-policy)
  - [Recovery Strategy](#recovery-strategy)
  - [Data Retention](#data-retention)
- [4.7 Encryption and Security Controls](#47-encryption-and-security-controls)
  - [Encryption](#encryption)
  - [Access Controls](#access-controls)
  - [Audit and Monitoring](#audit-and-monitoring)

---

## 4.1 Purpose and Overview

The database design defines the persistent data model for the AI Governance Platform.  
It stores and manages all core entities — user accounts, governance frameworks, compliance checks, evidence, and audit data.  
The system uses **PostgreSQL** hosted externally, providing reliability, scalability, and compliance readiness.

All data access is abstracted through **Prisma ORM**, ensuring schema consistency and version-controlled migrations.  
The database adheres to relational design principles with normalized data models and clear referential relationships between entities.

---

## 4.2 Database Architecture

The database follows a **modular, schema-driven structure** optimized for compliance workloads.  
It supports high read and moderate write operations, aligning with the platform’s continuous governance monitoring model.

### Key Architectural Features
- **Externally hosted PostgreSQL instance** for managed security, backups, and replication.  
- **Prisma ORM layer** for data modeling, migrations, and query abstraction.  
- **Normalized schema (3NF)** to avoid data duplication and ensure consistency.  
- **Role-based access** to restrict data operations by service type.  
- **Connection pooling** managed via Prisma for efficient query handling.  
- **Time-based partitioning** for large tables such as audit logs and evidence metadata.

---

## 4.3 Schema Structure and Core Tables

The platform’s schema is composed of interconnected entities that represent governance, compliance, and operational data.

### Users and Roles
- **users** – Stores account data, authentication details, and basic profile info.  
- **roles** – Defines user access levels (admin, compliance officer, engineer, auditor).  
- **permissions** – Maps actions and scopes used by Casbin for policy enforcement.  
- **relationships:** One-to-many between roles and users.

### Frameworks and Controls
- **frameworks** – Contains framework metadata (title, version, region, source).  
- **controls** – Stores governance control definitions linked to frameworks.  
- **mappings** – Associates controls with multiple frameworks for interoperability.  
- **relationships:** One-to-many between frameworks and controls; many-to-many between frameworks through mappings.

### Probes and Checks
- **probes** – Defines data collectors or integrations fetching evidence.  
- **checks** – Represents specific validation rules executed by probes.  
- **results** – Stores outcomes of checks (compliant, non-compliant, partial).  
- **relationships:** Each probe links to many checks; checks link to controls.

### Evidence Management
- **evidence** – Metadata for documents, reports, or files uploaded to **externally hosted MinIO**.  
- **evidence_links** – Associates evidence with controls, checks, or remediation tasks.  
- **relationships:** One-to-many between controls and evidence; one-to-one between evidence and MinIO objects.

### Compliance Scores
- **scores** – Stores compliance percentage or rating for frameworks, controls, and users.  
- **metrics** – Aggregates key performance indicators for dashboards and reports.  
- **relationships:** Many-to-one between controls and scores.

### Audit Logs and Alerts
- **audit_logs** – Tracks all system actions (who, when, what, and outcome).  
- **alerts** – Represents triggered notifications or risk events from backend processes.  
- **relationships:** One-to-many between users and audit logs; one-to-many between alerts and tasks.

---

## 4.4 Indexing and Query Optimization

Database performance is maintained through intelligent indexing and query optimization strategies.

### Indexing Guidelines
- Primary keys indexed by default (UUIDs).  
- Foreign key relationships indexed for joins (`user_id`, `control_id`, `framework_id`).  
- Partial indexes for high-volume queries (e.g., `status = 'active'`).  
- Text search indexes for evidence names and framework descriptions.  
- Composite indexes for multi-column queries (e.g., `framework_id + control_id`).  

### Query Optimization
- Prisma’s query batching and lazy loading minimize redundant calls.  
- Prepared statements used for repetitive queries.  
- Periodic query plan analysis performed on production.  
- Cache layers added for read-heavy queries on reports and dashboards.  

---

## 4.5 Data Integrity and Relationships

Data consistency is enforced through schema-level constraints and ORM validation.

### Integrity Controls
- All foreign keys enforce referential integrity.  
- Cascading deletes disabled for critical records; replaced by soft deletes.  
- ENUM columns used for fixed value sets (e.g., `status`, `severity`).  
- Unique indexes ensure data consistency across critical attributes (e.g., framework version).  
- Automatic timestamps for every record using `created_at` and `updated_at` columns.

### Relationship Model Summary
- **users → roles** – many-to-one  
- **frameworks → controls** – one-to-many  
- **controls → checks** – one-to-many  
- **controls → evidence** – one-to-many  
- **tasks → evidence** – many-to-one  
- **users → audit_logs** – one-to-many  

---

## 4.6 Backup, Recovery, and Retention

Backup and recovery policies ensure business continuity and data durability.

### Backup Policy
- Full database backups performed nightly; differential backups hourly.  
- Backup retention for 90 days, extendable for compliance requirements.  
- Snapshots encrypted using AES-256 before storage.  
- Backups stored on dedicated, access-controlled cloud storage.  

### Recovery Strategy
- Point-in-time recovery enabled via WAL (Write-Ahead Logging).  
- Automated restore testing conducted monthly to validate recovery integrity.  
- Disaster recovery environment preconfigured with replicated Postgres instance.  

### Data Retention
- Evidence and audit data retained for configurable periods (default 36 months).  
- Automatic archival to cold storage for older records.  
- GDPR-compliant deletion workflows for user and evidence data.  

---

## 4.7 Encryption and Security Controls

The database design incorporates multiple layers of security to ensure compliance and protect sensitive data.

### Encryption
- Data at rest encrypted using **AES-256**.  
- Data in transit encrypted with **TLS 1.3** between API servers and database.  
- Prisma-managed secure connection pools for authenticated sessions.

### Access Controls
- Role-based access model (RBAC) aligned with Casbin policies.  
- Database roles segmented by environment (read-only, admin, service).  
- Secrets managed via environment variables and cloud secret vaults.

### Audit and Monitoring
- All connections logged with user identity, source IP, and timestamp.  
- Database audit logs integrated with backend observability pipelines.  
- Alerts configured for unauthorized access attempts or schema modifications.
