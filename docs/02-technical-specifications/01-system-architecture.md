# 1. System Architecture

>### TL;DR  
> This section provides a complete overview of the platform’s technical architecture — describing how the frontend, backend, and infrastructure layers interact within a secure, modular, and scalable design.  
> It details the **JavaScript-only technology stack (no TypeScript used anywhere)**, explains component-level responsibilities, outlines data flow between layers, and explicitly notes that both **PostgreSQL (database)** and **MinIO (object storage)** are **externally hosted**.  
> The objective is to provide developers and architects with a clear, end-to-end understanding of how the system is structured, deployed, and maintained.

---

## Table of Contents

- [1. System Architecture](#1-system-architecture)
  - [Table of Contents](#table-of-contents)
  - [1.1 Purpose and Scope](#11-purpose-and-scope)
  - [1.2 Tech Stack Overview](#12-tech-stack-overview)
  - [1.3 Code and Project Structure](#13-code-and-project-structure)
    - [Root Repository Structure](#root-repository-structure)
    - [Organizational Guidelines](#organizational-guidelines)
    - [Directory Structure](#directory-structure)
    - [Shared Logic](#shared-logic)
    - [Environment Configuration](#environment-configuration)
  - [1.4 Architectural Overview](#14-architectural-overview)
  - [1.5 Core System Components](#15-core-system-components)
    - [Frontend Application](#frontend-application)
    - [API Server (Backend)](#api-server-backend)
    - [Database Layer (Externally Hosted)](#database-layer-externally-hosted)
    - [Object Storage (Externally Hosted MinIO)](#object-storage-externally-hosted-minio)
    - [Logging and Monitoring](#logging-and-monitoring)
  - [1.6 Data Flow](#16-data-flow)
  - [1.7 Deployment Architecture](#17-deployment-architecture)
    - [Environment Layers](#environment-layers)
    - [Containerization](#containerization)
    - [Configuration and Security](#configuration-and-security)
    - [Networking](#networking)
  - [1.8 Cross-Cutting Concerns](#18-cross-cutting-concerns)

---

## 1.1 Purpose and Scope

This document defines the **technical architecture** of the AI Governance Platform, focusing on how all components — frontend, backend, and infrastructure — work together to deliver a secure, efficient, and scalable governance system.

It serves as a foundation for all engineering teams, outlining system structure, technology choices, integration points, and deployment principles.

**Note:** The entire platform is built using **JavaScript only**, and **TypeScript will not be used anywhere** in the codebase.  
This applies to both frontend and backend layers to maintain simplicity, faster development cycles, and unified syntax across all components.

---

## 1.2 Tech Stack Overview

| Technology | Purpose |
|-------------|----------|
| **Postgres** | Primary relational database **hosted externally** (connected via `.env` connection string). |
| **Express.js** | Server framework for REST APIs written entirely in JavaScript. |
| **React.js (JavaScript)** | Client framework for user interface — built exclusively in JavaScript with no TypeScript. |
| **Vite** | Lightweight build tool and dev server for fast frontend development (used instead of Next.js). |
| **React Router DOM** | Client-side routing for single-page application (SPA) navigation. |
| **Axios** | HTTP client for communication between frontend and backend. |
| **Node.js** | JavaScript runtime environment for server-side execution. |
| **TailwindCSS + shadcn** | Utility-first CSS framework and component library for consistent, accessible UI design. |
| **Lucide React Icons** | Modern icon set integrated with shadcn/ui components. |
| **Tiptap Editor** | Headless WYSIWYG editor integrated with React. Supports direct uploads to **MinIO** for all media (videos, images, and documents). |
| **Prisma ORM** | Database schema and management tool for Postgres, written in JavaScript. |
| **JWT** | Authentication strategy using JSON Web Tokens for securing API routes and sessions. |
| **Casbin** | Policy-based role and permission control integrated into Express.js. |
| **dotenv** | Environment variable management for configuration across backend and frontend. |
| **CORS Middleware** | Enables secure cross-origin communication between the Vite frontend and Express backend. |
| **Nodemailer** | Server-side email delivery and notification service. |
| **Winston + Morgan** | Structured JSON logging for server monitoring and debugging. |
| **Swagger (OpenAPI)** | API documentation for backend routes. |
| **MinIO** | **Externally hosted object storage** for all file uploads, using presigned URLs for secure access. |

---

## 1.3 Code and Project Structure

This section defines how the project repository and its codebase are organized across frontend, backend, and shared components.  
The goal is to maintain a consistent, modular, and scalable folder structure that aligns with the JavaScript-only architecture.

### Root Repository Structure

The project repository is organized at the root level as follows:

- **client/** – Contains the React.js frontend application (built with Vite).  
- **server/** – Contains the Express.js backend API service.  
- **shared/** – Common logic, constants, and utilities shared between client and server.  
- **docs/** – Product requirement documents (PRDs), feature specifications, and user stories.  
- **.env.example** – Template file for environment variable configuration.

### Organizational Guidelines

- The repository follows a **feature-based organization** to improve modularity and developer ownership.  
- All components related to a specific business feature should exist together within their respective domains.  
- Shared integrations (e.g., Nodemailer, MinIO, Casbin) are grouped under a single location for reusability.

### Directory Structure

**Frontend (React Client)**  
- Source code located in `client/src/features/<feature>`  
- Each feature folder includes its own components, hooks, styles, and Axios API handlers.

**Backend (Express Server)**  
- Source code organized in `server/src/modules/<feature>`  
- Each module includes its own controller, service, route, and validation logic.  
- Shared integrations live in `server/src/integrations` and include:
  - **Nodemailer** for email delivery  
  - **MinIO** for file storage  
  - **Casbin** for policy-based access control

### Shared Logic

Common libraries or utilities used by both frontend and backend reside in the `shared/` directory.  
This includes constants, validation schemas, and helper functions to avoid duplication.

### Environment Configuration

- A single `.env` file is used for all services (frontend, backend, and shared).  
- Environment variables control connections to:
  - Externally hosted **PostgreSQL database**
  - Externally hosted **MinIO storage**
  - Email and authentication services  
- The `.env.example` file serves as the template for new environments.

This structure standardizes development, simplifies CI/CD automation, and ensures consistent code organization across all modules.

---

## 1.4 Architectural Overview

The system follows a **service-oriented JavaScript architecture** composed of independent, containerized modules.  
All services communicate over RESTful APIs secured by HTTPS.

**Key Characteristics:**
- 100% **JavaScript-based** — no TypeScript or language transpilation used.  
- **PostgreSQL** and **MinIO** are **externally hosted** and connected via secure credentials.  
- Modular, containerized components for maintainability and scaling.  
- Unified environment management through `.env` configuration files.  

---

## 1.5 Core System Components

### Frontend Application  
- Developed with **React.js (JavaScript)** using Vite as the build tool.  
- Implements a single-page architecture with client-side routing.  
- Provides dashboards, reports, and compliance workflows.  
- Communicates with backend APIs through Axios.  
- Uses TailwindCSS and shadcn for UI consistency and accessibility.  
- Integrates **Tiptap** for editable content with media uploads to **external MinIO storage**.  
- Maintains authentication state with JWT.

### API Server (Backend)  
- Built using **Express.js (JavaScript)** and Node.js.  
- Hosts RESTful APIs for authentication, compliance scoring, framework mapping, and audit tracking.  
- Utilizes Casbin for access control and JWT for authentication.  
- Includes CORS middleware, structured error handling, and validation logic.  
- Serves OpenAPI/Swagger documentation for all routes.

### Database Layer (Externally Hosted)  
- **PostgreSQL is hosted externally** on a managed cloud service.  
- Managed via Prisma ORM for schema, migrations, and queries.  
- Stores users, roles, frameworks, compliance results, and evidence metadata.  
- Secure SSL connection configured via environment variables.  
- Backup and access control managed at the hosting provider level.

### Object Storage (Externally Hosted MinIO)  
- **MinIO is hosted externally** as a secure object storage service.  
- Used for document, image, and video storage.  
- Files uploaded via presigned URLs, linked to metadata in PostgreSQL.  
- Encryption at rest and in transit enabled by default.

### Logging and Monitoring  
- **Winston** and **Morgan** provide structured logs for backend activity.  
- Logs integrated with application lifecycle and API monitoring tools.  
- Optional integration with external observability systems.

---

## 1.6 Data Flow

1. **User Authentication** – Frontend authenticates via JWT through Express APIs.  
2. **Frontend Interaction** – React SPA manages routes with React Router DOM and communicates via Axios.  
3. **Backend Processing** – Express handles API requests, Casbin enforces roles, Prisma executes queries.  
4. **Database Transactions** – Data persisted in **externally hosted PostgreSQL** with referential integrity.  
5. **File Uploads** – Files uploaded directly to **externally hosted MinIO** using presigned URLs.  
6. **Notifications** – Nodemailer sends email alerts for user and compliance events.

---

## 1.7 Deployment Architecture

### Environment Layers
- **Development:** Local Docker setup connected to external Postgres and MinIO services.  
- **Staging:** Pre-production testing environment mirroring production.  
- **Production:** Fully containerized cloud deployment connected securely to **external Postgres** and **MinIO endpoints**.

### Containerization
- Each major service (client, server) runs in separate containers.  
- Managed via Docker Compose or Kubernetes.  
- Stateless architecture enables horizontal scaling.

### Configuration and Security
- Environment variables managed through `.env` files.  
- Sensitive keys stored securely in cloud secret management tools.  
- HTTPS enforced across all external communications.  
- JWT and Casbin policies consistently applied for access control.

### Networking
- All API traffic flows through secure HTTPS endpoints.  
- Database and MinIO connections restricted to authorized IP ranges.  
- CORS configured to allow only approved frontend origins.

---

## 1.8 Cross-Cutting Concerns

- **Language Standardization:** 100% JavaScript — no TypeScript used anywhere in the platform.  
- **Security:** JWT authentication, Casbin-based RBAC, and SSL-secured connections.  
- **Performance:** Optimized builds with Vite, efficient queries via Prisma ORM.  
- **Reliability:** External Postgres and MinIO ensure durability, redundancy, and backup coverage.  
- **Scalability:** Stateless backend, containerized components, and distributed deployment model.  
- **Monitoring:** Structured JSON logs with Winston and Morgan for traceability and audit readiness.

---
