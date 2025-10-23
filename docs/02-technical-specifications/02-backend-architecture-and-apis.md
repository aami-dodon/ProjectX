# 2. Backend Architecture & APIs<!-- omit in toc -->

>### TL;DR  
> This section defines the backend architecture of the AI Governance Platform, explaining how the Node.js and Express.js backend is structured, organized, and connected to the external database and storage services.  
> It covers the folder structure, core backend microservices (Auth, Governance Engine, Frameworks, Evidence Repository, Notifications, and Tasks), database schema overview, API design standards, error handling, and documentation practices.  
> The objective is to maintain consistency, security, and scalability across all backend services in a **JavaScript-only implementation** (no TypeScript).

---

---



- [2.1 Purpose and Overview](#21-purpose-and-overview)
- [2.2 Folder Structure and Conventions](#22-folder-structure-and-conventions)
  - [Root-level directories](#root-level-directories)
  - [Naming Conventions](#naming-conventions)
- [2.3 Core Backend Services](#23-core-backend-services)
  - [Auth Service](#auth-service)
  - [Governance Engine](#governance-engine)
  - [Framework Service](#framework-service)
  - [Evidence Repository](#evidence-repository)
  - [Notification Service](#notification-service)
  - [Task Service](#task-service)
- [2.4 Database Schema Overview](#24-database-schema-overview)
  - [Core Tables](#core-tables)
  - [Schema Design Principles](#schema-design-principles)
- [2.5 API Specification Standards](#25-api-specification-standards)
  - [Design Principles](#design-principles)
  - [Security](#security)
  - [Documentation](#documentation)
- [2.6 Error Handling and Logging](#26-error-handling-and-logging)
  - [Error Handling](#error-handling)
  - [Logging](#logging)
- [2.7 Versioning and Documentation](#27-versioning-and-documentation)
  - [API Versioning](#api-versioning)
  - [Documentation and Change Management](#documentation-and-change-management)

---

## 2.1 Purpose and Overview

The backend architecture provides the logic, integrations, and data management foundation for the platform.  
It processes all API requests, executes compliance logic, manages authentication and evidence, and communicates with external services such as MinIO and Nodemailer.

The backend is entirely written in **JavaScript (Node.js + Express.js)** and interacts with an **externally hosted PostgreSQL** database.  
It is modular, containerized, and scalable, designed for independent feature development and simplified maintenance.

---

## 2.2 Folder Structure and Conventions

The backend follows a **feature-based modular structure**, ensuring clear separation of concerns and maintainability.

### Root-level directories
- **server/src/modules/** – Feature-specific backend modules.  
- **server/src/integrations/** – Shared integrations (MinIO, Nodemailer, Casbin).  
- **server/src/middleware/** – Common middleware for authentication, validation, and logging.  
- **server/src/config/** – Application configuration and connection management.  
- **server/src/utils/** – Helper functions, constants, and reusable logic.  
- **server/src/routes/** – API route definitions and module registration.  
- **server/src/app.js** – Express app initialization.  
- **server/src/server.js** – Backend server entry point.  

### Naming Conventions
- Filenames use lowercase with hyphens (e.g., `user-controller.js`, `task-service.js`).  
- Environment variables use uppercase snake case (e.g., `DB_URL`, `MINIO_ACCESS_KEY`).  
- Controllers, services, and routes follow consistent naming to simplify discovery and testing.

---

## 2.3 Core Backend Services

### Auth Service
**Purpose:** Handle authentication, authorization, and user session management.  
**Responsibilities:**  
- Manage JWT authentication tokens and session lifecycle.  
- Enforce role-based access control using Casbin.  
- Handle registration, login, and password recovery flows.  
- Use Nodemailer for password reset and verification emails.  

**Key Endpoints:**  
- `/auth/login`  
- `/auth/register`  
- `/auth/logout`  
- `/auth/refresh`  

---

### Governance Engine
**Purpose:** Core engine that processes compliance data, evaluates checks, and computes control-level metrics.  
**Responsibilities:**  
- Execute defined checks based on governance rules.  
- Aggregate results into measurable controls.  
- Calculate compliance scores and risk levels.  
- Trigger remediation workflows for failed checks.  
- Log and store audit events in PostgreSQL.  

**Key Functions:**  
- Check validation and aggregation.  
- Control-level scoring.  
- Risk categorization and report generation.  

---

### Framework Service
**Purpose:** Manage governance frameworks, control structures, and external compliance mappings.  
**Responsibilities:**  
- CRUD operations for frameworks and controls.  
- Map internal controls to external standards (EU AI Act, ISO 42001, NIST AI RMF).  
- Maintain framework versions and update tracking.  
- Provide metadata for reporting and dashboard modules.  

**Key Endpoints:**  
- `/frameworks`  
- `/frameworks/:id/controls`  
- `/frameworks/:id/mappings`  

---

### Evidence Repository
**Purpose:** Centralized evidence management system for file uploads and compliance documentation.  
**Responsibilities:**  
- Interface with **externally hosted MinIO** for storage.  
- Generate presigned URLs for secure uploads and downloads.  
- Maintain metadata linkage between files and controls.  
- Track file versioning and audit trails.  
- Encrypt and validate file access permissions.  

**Key Endpoints:**  
- `/evidence/upload`  
- `/evidence/:id/download`  
- `/evidence/:id/metadata`  

---

### Notification Service
**Purpose:** Manage platform notifications and communication events.  
**Responsibilities:**  
- Send automated and triggered email notifications using Nodemailer.  
- Support system alerts for new tasks, completed remediations, and audit updates.  
- Manage notification templates and scheduling.  
- Store notification delivery logs in PostgreSQL.  

**Key Endpoints:**  
- `/notifications/send`  
- `/notifications/templates`  
- `/notifications/logs`  

---

### Task Service
**Purpose:** Manage remediation tasks, user assignments, and progress tracking.  
**Responsibilities:**  
- Create, assign, and track compliance tasks generated by failed checks.  
- Maintain task status (open, in progress, resolved).  
- Enable escalation and reassignment for overdue tasks.  
- Link tasks with evidence, controls, and framework items.  
- Provide endpoints for reporting and analytics.  

**Key Endpoints:**  
- `/tasks`  
- `/tasks/:id`  
- `/tasks/:id/status`  
- `/tasks/:id/reassign`  

---

## 2.4 Database Schema Overview

The backend interacts with an **externally hosted PostgreSQL** database managed through Prisma ORM.  
Schema migrations are automated as part of deployment.

### Core Tables
- **users** – User profiles and credentials.  
- **roles** – Access control definitions for Casbin policies.  
- **frameworks** – Governance framework definitions.  
- **controls** – Individual governance control records.  
- **checks** – Validation results linked to controls.  
- **evidence** – Metadata for documents stored in MinIO.  
- **notifications** – Outgoing communication records.  
- **tasks** – Remediation and workflow assignments.  
- **audit_logs** – Immutable log of compliance activities.  

### Schema Design Principles
- UUIDs as primary keys.  
- Foreign key integrity between related entities.  
- Indexes on high-query columns (e.g., `user_id`, `framework_id`).  
- Automatic timestamps for tracking creation and updates.  
- Soft deletes via status flags where appropriate.  

---

## 2.5 API Specification Standards

The backend follows **REST-based APIs** documented through **OpenAPI 3.0**.  
All endpoints use secure HTTPS communication and JWT-based authorization.

### Design Principles
- Resource-oriented endpoints with predictable patterns.  
- Consistent HTTP methods: GET, POST, PUT/PATCH, DELETE.  
- Unified JSON response structure containing:  
  - `status`  
  - `message`  
  - `data`  
  - `error` (if applicable)  

### Security
- JWT validation on every protected route.  
- Casbin middleware enforces role and permission policies.  
- HTTPS enforced for all communications.  
- CORS configured for approved frontend origins only.  

### Documentation
- All endpoints are defined and auto-documented via Swagger (OpenAPI).  
- Live documentation served under `/api-docs`.  
- Updated automatically with new releases.

---

## 2.6 Error Handling and Logging

The backend uses unified error management and structured logging for observability.

### Error Handling
- Global middleware captures and normalizes all errors.  
- Validation errors return HTTP 400 with field-level messages.  
- Unauthorized and forbidden requests return 401 and 403 respectively.  
- Unhandled exceptions return standardized 500 responses.  

### Logging
- **Winston** and **Morgan** manage structured JSON logs.  
- Logs capture route, status, execution time, and user context.  
- Sensitive data never written to logs.  
- Logs aggregated for external monitoring and auditing.  

---

## 2.7 Versioning and Documentation

### API Versioning
- All endpoints versioned under `/api/v1/`, `/api/v2/` for compatibility.  
- Deprecated APIs remain accessible for legacy clients until migration.  

### Documentation and Change Management
- API documentation generated automatically with Swagger.  
- Each release includes updated OpenAPI definitions and changelogs.  
- Internal wiki tracks module design decisions and dependency updates.

---

---

[← Previous](01-system-architecture.md) | [Next →](03-frontend-architecture.md)
