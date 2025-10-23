# 8. Deployment & Environment Guide <!-- omit in toc -->

>### TL;DR  
> This section provides detailed instructions for setting up, configuring, and deploying the AI Governance Platform across all environments — local, staging, and production.  
> It covers environment variables, build and run commands, seeding and migrations, deployment checklists, and cloud configuration standards.  
> The goal is to ensure consistent, reliable, and secure deployments regardless of environment or hosting provider.

---

- [8.1 Purpose and Overview](#81-purpose-and-overview)
- [8.2 Environment Types](#82-environment-types)
  - [Local Development](#local-development)
  - [Staging](#staging)
  - [Production](#production)
- [8.3 Local Development Setup](#83-local-development-setup)
  - [Prerequisites](#prerequisites)
  - [Setup Steps](#setup-steps)
  - [Development Tips](#development-tips)
- [8.4 Environment Variables and Configuration](#84-environment-variables-and-configuration)
  - [Configuration Principles](#configuration-principles)
  - [Core Environment Variables](#core-environment-variables)
- [8.5 Database Seeding and Migrations](#85-database-seeding-and-migrations)
  - [Migrations](#migrations)
  - [Seeding](#seeding)
  - [Rollbacks](#rollbacks)
- [8.6 Build and Deployment Process](#86-build-and-deployment-process)
  - [Build Steps](#build-steps)
  - [Deployment Steps](#deployment-steps)
  - [Rollback Procedure](#rollback-procedure)
- [8.7 Cloud Deployment Checklist](#87-cloud-deployment-checklist)
  - [Pre-Deployment](#pre-deployment)
  - [Post-Deployment](#post-deployment)
- [8.8 Verification and Post-Deployment Steps](#88-verification-and-post-deployment-steps)
  - [Verification Process](#verification-process)
  - [Post-Deployment Activities](#post-deployment-activities)

---

## 8.1 Purpose and Overview

This guide outlines how to set up and deploy the platform in different environments.  
It standardizes the deployment process to minimize errors and ensure reproducibility across local, staging, and production systems.  

The platform can be deployed on **AWS, Azure, or GCP**, using **Docker containers**, **Kubernetes clusters**, and **Terraform-managed infrastructure**.  
All configurations and build scripts reside within the **`infra/`** directory for consistency.

---

## 8.2 Environment Types

### Local Development
- Runs via Docker Compose or individual `npm` commands.  
- Connects to external PostgreSQL and MinIO services.  
- Uses local `.env` configuration.  
- Enables live reloading for frontend (Vite) and backend (Nodemon).  
- Debug logging enabled by default.

### Staging
- Mirrors the production environment for QA and UAT testing.  
- Automatically built and deployed through CI/CD pipelines.  
- Connects to staging instances of external services (PostgreSQL, MinIO, email).  
- Protected by basic authentication or IP whitelisting.  
- Includes synthetic test data for validation.

### Production
- Deployed on a cloud-managed infrastructure (Kubernetes or ECS).  
- Uses external, high-availability PostgreSQL and MinIO instances.  
- Follows blue-green or rolling deployment strategy.  
- Logging and monitoring integrated with centralized observability systems.  
- HTTPS and TLS enforced at all entry points.

---

## 8.3 Local Development Setup

### Prerequisites
- Node.js LTS (v20 or above)  
- Docker and Docker Compose  
- PostgreSQL (remote or local instance)  
- MinIO (external or local container)  
- npm or yarn  

### Setup Steps
1. Clone the repository.  
2. Copy `.env.example` to `.env` and update environment variables.  
3. Run `npm install` in both `/client` and `/server` directories.  
4. Start backend and frontend using Docker Compose or separate terminals:  
   - Backend: `npm run dev` (from `/server`)  
   - Frontend: `npm run dev` (from `/client`)  
5. Access the frontend at `http://localhost:5173` (Vite default).  
6. Confirm API connectivity at `http://localhost:4000/api/health`.  

### Development Tips
- Backend and frontend code auto-reload on file changes.  
- Debug logs available in terminal output.  
- Use `.env.dev` for local overrides not committed to Git.  

---

## 8.4 Environment Variables and Configuration

The platform uses a unified `.env` file pattern for managing environment configurations.

### Configuration Principles
- Sensitive credentials stored in vaults (Vault, AWS Secrets Manager).  
- `.env.example` acts as a template for environment variables.  
- Environment-specific files: `.env.dev`, `.env.staging`, `.env.prod`.  
- Environment variables injected automatically via CI/CD during build.  

### Core Environment Variables

| Variable | Description |
|-----------|--------------|
| `PORT` | API port for Express server. |
| `VITE_API_URL` | Backend API endpoint for frontend. |
| `DATABASE_URL` | Connection string for external PostgreSQL. |
| `MINIO_ENDPOINT` | External MinIO endpoint URL. |
| `MINIO_ACCESS_KEY` | Access key for MinIO. |
| `MINIO_SECRET_KEY` | Secret key for MinIO. |
| `JWT_SECRET` | JWT signing key for authentication. |
| `EMAIL_HOST` | SMTP host for Nodemailer. |
| `EMAIL_USER` | SMTP username. |
| `EMAIL_PASS` | SMTP password. |
| `NODE_ENV` | Runtime environment (`development`, `staging`, `production`). |

---

## 8.5 Database Seeding and Migrations

Database schema management is handled by **Prisma ORM**, ensuring consistency across environments.

### Migrations
- Run automatically during CI/CD or manually with `npx prisma migrate deploy`.  
- Migrations stored under `server/prisma/migrations/`.  
- Schema validated against production database before deployment.  

### Seeding
- Seeds create base data such as roles, admin users, and framework templates.  
- Run `npx prisma db seed` after initial migration.  
- Seeding scripts reside in `server/prisma/seed.js`.  
- Separate seeds for development and staging environments.  

### Rollbacks
- Use `npx prisma migrate resolve --rolled-back` for controlled rollbacks.  
- Migrations versioned and reviewed via pull requests.

---

## 8.6 Build and Deployment Process

The platform is containerized and deployed using CI/CD pipelines defined under the **`infra/`** folder.

### Build Steps
1. CI pipeline triggers build on commit to `main` or release branch.  
2. Backend and frontend Docker images are built separately.  
3. Images tagged with version and commit hash (e.g., `v1.2.0-commitsha`).  
4. Images pushed to private container registry (ECR, ACR, or Docker Hub).  

### Deployment Steps
1. Staging deployment runs automatically after successful build.  
2. Manual approval required for production release.  
3. Terraform provisions necessary infrastructure if not present.  
4. Kubernetes manifests or Helm charts deployed via `infra/kubernetes/`.  
5. Post-deployment health checks validate system readiness.  

### Rollback Procedure
- Blue-green deployment ensures instant rollback by switching traffic.  
- Previous container versions retained for 7 days.  
- Rollback initiated through CI/CD dashboard or Kubernetes commands.

---

## 8.7 Cloud Deployment Checklist

### Pre-Deployment
- [ ] Environment variables validated and secrets verified.  
- [ ] Database migrations and seed scripts completed.  
- [ ] SSL certificates configured for ingress or load balancer.  
- [ ] Logging and metrics targets configured.  
- [ ] Monitoring dashboards updated for new services.  

### Post-Deployment
- [ ] Health check endpoints returning 200 OK.  
- [ ] Frontend connected successfully to backend API.  
- [ ] Logs and metrics visible in observability platform.  
- [ ] Data persistence verified (PostgreSQL and MinIO).  
- [ ] Backups initiated successfully.  

---

## 8.8 Verification and Post-Deployment Steps

### Verification Process
- Run automated smoke tests from CI after deployment.  
- Verify compliance workflows, dashboards, and evidence uploads.  
- Validate email delivery through Nodemailer integration test.  
- Confirm Casbin policies are loaded correctly for RBAC.  

### Post-Deployment Activities
- Tag release in Git and document version in release notes.  
- Archive old build artifacts for traceability.  
- Rotate JWT and API keys if required.  
 - Conduct security scan to confirm no new vulnerabilities introduced.  
 
 This standardized deployment guide ensures all developers and DevOps engineers follow a unified process, minimizing risk and maintaining operational consistency across all environments.

---

[← Previous](07-integration-architecture.md) | [Next →](09-testing-and-qa.md)
