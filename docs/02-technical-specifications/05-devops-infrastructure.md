# 5. DevOps & Infrastructure <!-- omit in toc -->

>### TL;DR  
> This section defines the DevOps and infrastructure setup for the AI Governance Platform.  
> It explains how environments are structured, containerization is managed, CI/CD pipelines are implemented, and infrastructure is provisioned using Infrastructure-as-Code (IaC).  
> The goal is to ensure a reliable, repeatable, and secure deployment process across all environments — from local development to production — using modern DevOps best practices.

---

- [5.1 Purpose and Overview](#51-purpose-and-overview)
- [5.2 Environment Setup](#52-environment-setup)
  - [Development](#development)
  - [Staging](#staging)
  - [Production](#production)
  - [Configuration Standards](#configuration-standards)
- [5.3 Repository and Folder Structure](#53-repository-and-folder-structure)
  - [Root-Level Infrastructure Folder](#root-level-infrastructure-folder)
  - [Integration Notes](#integration-notes)
- [5.4 Containerization and Orchestration](#54-containerization-and-orchestration)
  - [Containerization Strategy](#containerization-strategy)
  - [Orchestration](#orchestration)
  - [Networking and Logging](#networking-and-logging)
- [5.5 Continuous Integration and Delivery (CI/CD)](#55-continuous-integration-and-delivery-cicd)
  - [Objectives](#objectives)
  - [CI Pipeline](#ci-pipeline)
  - [CD Pipeline](#cd-pipeline)
  - [Toolchain](#toolchain)
- [5.6 Infrastructure as Code (IaC)](#56-infrastructure-as-code-iac)
  - [Core IaC Principles](#core-iac-principles)
  - [Terraform Resources](#terraform-resources)
  - [Approval and Governance](#approval-and-governance)
- [5.7 Monitoring and Observability](#57-monitoring-and-observability)
  - [Monitoring Tools](#monitoring-tools)
  - [Metrics Tracked](#metrics-tracked)
- [5.8 Secrets and Configuration Management](#58-secrets-and-configuration-management)
  - [Secret Management](#secret-management)
  - [Configuration Management](#configuration-management)
- [5.9 Disaster Recovery and Scaling Strategy](#59-disaster-recovery-and-scaling-strategy)
  - [Disaster Recovery (DR)](#disaster-recovery-dr)
  - [Scaling Strategy](#scaling-strategy)

---

## 5.1 Purpose and Overview

The DevOps and infrastructure layer ensures the platform is deployed, monitored, and maintained in a consistent and secure manner.  
It standardizes how environments are built, how containers are deployed, and how changes flow from development to production.  

The infrastructure is **cloud-agnostic**, deployable on **AWS or Azure**, and built using **Docker**, **Kubernetes**, and **Terraform**.  
Automation ensures minimal manual intervention, enabling rapid iteration and operational resilience.

---

## 5.2 Environment Setup

The platform operates across three standard environments:

### Development
- Local setup using Docker Compose.  
- Connects to externally hosted PostgreSQL and MinIO services.  
- Hot reloading enabled via Vite and Nodemon.  
- Debug logging active for Express backend and React frontend.

### Staging
- Cloud-hosted replica of production used for QA, testing, and pre-release validation.  
- Automatic builds and deployments triggered via CI/CD pipelines.  
- Uses staging credentials, API keys, and sandbox integrations.

### Production
- Multi-region, high-availability environment.  
- Externally hosted PostgreSQL and MinIO instances configured with encryption and backups.  
- Blue-green deployment strategy for zero-downtime releases.  
- Metrics and logging integrated with centralized monitoring systems.

### Configuration Standards
- Environment-specific `.env` files stored securely.  
- Secrets and credentials managed via cloud vaults (AWS Secrets Manager, Azure Key Vault).  
- Environment variables injected dynamically at runtime.

---

## 5.3 Repository and Folder Structure

The repository includes a dedicated **`infra/`** directory at the root level to centralize all infrastructure, automation, and IaC resources.  
This folder ensures consistency, reproducibility, and traceability across all environments.

### Root-Level Infrastructure Folder

| Path | Purpose |
|------|----------|
| **infra/terraform/** | Terraform configuration files and modules for provisioning compute, networking, databases, and storage. |
| **infra/scripts/** | Shell or Node scripts for automation (deployment, migrations, cleanup). |
| **infra/kubernetes/** | Kubernetes manifests or Helm charts for services, pods, and ingress configuration. |
| **infra/monitoring/** | Prometheus, Grafana, and Alertmanager configurations for metrics and alerts. |
| **infra/policies/** | Policy-as-Code definitions (OPA, Sentinel) for compliance validation in CI/CD. |
| **infra/backups/** | Backup scripts and retention definitions for PostgreSQL and MinIO data. |

### Integration Notes
- The `infra/` folder is **version-controlled** and maintained alongside the app code.  
- Sensitive data (e.g., `.tfvars`, credentials) are excluded from version control.  
- Terraform state files are stored remotely in encrypted backends (e.g., S3, Terraform Cloud).  
- All scripts and manifests are designed to be reusable across **development**, **staging**, and **production**.  

---

## 5.4 Containerization and Orchestration

All services are containerized using **Docker** to maintain consistency across environments.

### Containerization Strategy
- Separate containers for **client**, **server**, and **worker** processes.  
- Base images optimized for speed and security.  
- Shared internal network for inter-service communication.  
- Development uses mounted volumes; production uses immutable images.

### Orchestration
- Containers orchestrated using **Kubernetes (K8s)** for production or **Docker Compose** for local development.  
- Pods represent independent microservices (frontend, backend, cron, proxy).  
- CPU and memory limits enforced per pod.  
- Health checks configured for liveness and readiness.  
- Horizontal Pod Autoscaling (HPA) configured based on metrics.

### Networking and Logging
- All services communicate via HTTPS and internal DNS within Kubernetes.  
- Logs are shipped to centralized monitoring (Grafana Loki, CloudWatch, or ELK).  
- Ingress controllers manage routing and TLS termination.

---

## 5.5 Continuous Integration and Delivery (CI/CD)

### Objectives
- Fully automated pipeline for testing, building, and deploying.  
- Reduced manual operations with version-controlled infrastructure.  
- Deployment gates for quality and compliance checks.

### CI Pipeline
- Triggered on pull requests or merges into main branches.  
- Runs linting, unit tests, and build validation.  
- Generates versioned Docker images pushed to private registries.  

### CD Pipeline
- Deploys automatically to **staging**; manual approval for **production**.  
- Blue-green or rolling updates minimize downtime.  
- Integration and smoke tests post-deployment.  

### Toolchain
- **GitHub Actions** or **GitLab CI** for automation.  
- **Terraform Cloud** for infrastructure provisioning.  
- **Docker Hub / ECR / ACR** as image registries.  
- Slack or email notifications for deployment outcomes.

---

## 5.6 Infrastructure as Code (IaC)

Infrastructure is managed using **Terraform**, following modular, declarative, and version-controlled practices.

### Core IaC Principles
- Infrastructure defined as code to ensure repeatability.  
- Remote encrypted backend for state management.  
- Modular design for compute, networking, and database components.  
- Code reviews and policy checks before apply.  

### Terraform Resources
- VPCs, subnets, firewalls, and load balancers.  
- Compute clusters (Kubernetes or ECS).  
- PostgreSQL and MinIO provisioning.  
- IAM roles, service accounts, and encryption policies.  
- Monitoring resources and scaling policies.  

### Approval and Governance
- Pull-request workflow for Terraform changes.  
- Policy enforcement via **OPA** or **Terraform Sentinel**.  
- Manual approval for production infrastructure updates.

---

## 5.7 Monitoring and Observability

Comprehensive observability ensures proactive detection and analysis of system health.

### Monitoring Tools
- **Prometheus / CloudWatch** for metrics collection.  
- **Grafana** for dashboards and visualization.  
- **Alertmanager / PagerDuty** for alert routing.  
- **ELK or Loki stack** for centralized logging.  

### Metrics Tracked
- API latency and throughput.  
- Database performance (query duration, connection pool).  
- Container resource usage and uptime.  
- Framework execution and compliance check frequency.  
- SLA target: 99.9% uptime for production workloads.

---

## 5.8 Secrets and Configuration Management

### Secret Management
- Centralized secret storage using **Vault**, **AWS Secrets Manager**, or **Azure Key Vault**.  
- Secrets injected at runtime, never baked into container images.  
- Automated rotation policies for keys and tokens.  

### Configuration Management
- Environment variables defined per environment in `.env` files.  
- Configuration validated in CI before build.  
- Sensitive configs restricted to authorized maintainers.  
- Role-based access applied at CI/CD and runtime levels.

---

## 5.9 Disaster Recovery and Scaling Strategy

### Disaster Recovery (DR)
- Multi-region failover for PostgreSQL and MinIO.  
- Automated replication and backup verification.  
- Failover scripts maintained in `infra/backups/`.  
- Monthly disaster recovery drills for validation.

### Scaling Strategy
- **Horizontal Scaling:** Add containers/pods based on resource metrics.  
- **Vertical Scaling:** Adjust compute resources for specific workloads.  
- **Database Scaling:** Read replicas for query optimization; connection pooling via Prisma.  
- **Storage Scaling:** MinIO bucket lifecycle management and object versioning.  

The **DevOps and Infrastructure layer**, centered around the `infra/` directory, ensures the platform remains secure, scalable, and reproducible — enabling continuous delivery and operational resilience across all environments.
