# Admin and Configuration System <!-- omit in toc -->

## Location: /server/src/modules/admin

>### TL;DR
> The admin and configuration system orchestrates tenant onboarding, global policy management, and integration governance from a unified control plane.
> It exposes administrative APIs and a React-based console embedded in the Governance Engine UI for secure configuration workflows.
> This guide explains provisioning flows, configuration hierarchies, integration automation, and audit expectations shared across operations runbooks.

---

- [1. Purpose and Scope](#1-purpose-and-scope)
- [2. Architecture Overview](#2-architecture-overview)
  - [2.1 Key Services](#21-key-services)
  - [2.2 Configuration Domains](#22-configuration-domains)
- [3. Tenant Provisioning Lifecycle](#3-tenant-provisioning-lifecycle)
  - [3.1 Intake and Verification](#31-intake-and-verification)
  - [3.2 Environment Bootstrapping](#32-environment-bootstrapping)
  - [3.3 Delegated Administration](#33-delegated-administration)
- [4. Global Settings Management](#4-global-settings-management)
  - [4.1 Policy Controls](#41-policy-controls)
  - [4.2 Feature Flag Governance](#42-feature-flag-governance)
  - [4.3 Secrets and Credential Rotation](#43-secrets-and-credential-rotation)
- [5. Integration Control Plane](#5-integration-control-plane)
  - [5.1 Authorization Flows](#51-authorization-flows)
  - [5.2 Health and Scheduling](#52-health-and-scheduling)
  - [5.3 Incident Response Playbooks](#53-incident-response-playbooks)
- [6. Audit and Compliance Requirements](#6-audit-and-compliance-requirements)
  - [6.1 Activity Logging](#61-activity-logging)
  - [6.2 Evidence Collection](#62-evidence-collection)
  - [6.3 Periodic Reviews](#63-periodic-reviews)
- [7. Related Runbooks and Specifications](#7-related-runbooks-and-specifications)

---

## 1. Purpose and Scope

The admin and configuration system provides the governance backbone for multi-tenant deployments. It centralises:

- Tenant lifecycle automation from intake forms through operational readiness.
- Global settings, feature flags, and platform policy enforcement.
- Control-plane workflows for third-party integrations, probes, and secrets.
- Compliance logging and audit evidence collection for regulator review.

This runbook aligns operations, security, and partner engineering teams when adapting the platform for new geographies, industries, or regulatory programs.

## 2. Architecture Overview

### 2.1 Key Services

| Component | Description |
| --- | --- |
| `server/src/modules/admin/api` | Express controllers that expose tenant, configuration, and integration management endpoints secured behind RBAC scopes. |
| `server/src/modules/admin/workflows` | Orchestrates provisioning pipelines, including async jobs executed via the shared queue infrastructure. |
| `server/src/modules/admin/ui` | React views embedded in the Governance Engine admin console for delegated configuration and audit review tasks. |
| `server/src/modules/admin/telemetry` | Emits structured audit events and health metrics consumed by the observability stack. |
| `server/src/modules/admin/persistence` | Data mappers that coordinate PostgreSQL schemas (`admin_tenants`, `admin_settings`, `admin_integrations`) and Redis caches. |

### 2.2 Configuration Domains

1. **Tenant metadata** — identifiers, plan tier, jurisdiction, and compliance context.
2. **Global policies** — password complexity, session duration, retention windows, and privacy defaults.
3. **Integration catalogue** — approved SaaS services, connector credentials, and probe scheduling settings.
4. **Delegated administration** — roles, scopes, and approval chains for customer administrators.

## 3. Tenant Provisioning Lifecycle

### 3.1 Intake and Verification

1. Sales or partner operations submit a provisioning request using the `POST /admin/tenants` endpoint or through the Governance Engine admin UI wizard.
2. The request triggers identity, compliance, and billing checks handled via the `verifyTenant` workflow. Failures are surfaced to the Notification System for remediation.
3. Approved tenants receive a unique tenant slug, default RBAC roles, and linkage to billing metadata in accordance with the RBAC and Monetization policies.

### 3.2 Environment Bootstrapping

1. Async jobs (dispatched through the Probe Management scheduler described in the [Probe Management System runbook](06-probe-management-system.md#3-probe-scheduling)) create baseline evidence repositories, notification templates, and dashboards.
2. Infrastructure automation provisions isolated secrets namespaces and configures environment variables using the Security Implementation standards.
3. Seed data scripts register default frameworks, task templates, and integrations flagged as mandatory in the Technical Specification.

### 3.3 Delegated Administration

1. Customer administrators invite team members via the admin console, invoking RBAC policies defined in the [RBAC System runbook](02-rbac-system.md).
2. Delegation scopes (support-only, auditor, full admin) are enforced through shared middleware to prevent privilege escalation.
3. The Governance Engine admin UI surfaces configuration diffs and pending approvals, mirroring the workflows documented in the [Governance Engine runbook](11-governance-engine.md#4-admin-ui-operations).

## 4. Global Settings Management

### 4.1 Policy Controls

- Central policies (password rules, MFA requirements, session expiry) are stored in `admin_settings` with per-tenant overrides.
- Changes propagate to the Auth Service via the configuration event bus; consumers cache settings with a 5-minute TTL to prevent stale reads.
- The admin UI requires dual-approval for high-risk policy changes, satisfying governance requirements for segregation of duties.

### 4.2 Feature Flag Governance

- Feature toggles reside in `admin_flags` and leverage the shared LaunchDarkly integration when available.
- Releases follow the safe rollout guidelines from the Testing & QA specification, including canary cohorts and automated rollback triggers.
- All flag mutations require a change ticket reference stored alongside the configuration payload for auditability.

### 4.3 Secrets and Credential Rotation

- Secrets are brokered through the integration control plane; rotations are orchestrated via the `rotateCredential` workflow that integrates with the [Integration System runbook](14-external-integrations-system.md#4-security-and-compliance).
- Credential metadata (issuer, expiration, rotation history) is replicated to the Evidence Repository for downstream audits.
- Emergency rotations trigger the Notification System to alert on-call engineers and tenant admins.

## 5. Integration Control Plane

### 5.1 Authorization Flows

- OAuth-based connectors (e.g., ServiceNow, Jira, Slack) follow the authorization journey described in the [External Integrations runbook](14-external-integrations-system.md#3-authorization-flows); tokens are stored per-tenant with least-privilege scopes.
- API key integrations require encrypted uploads through the admin console; validation checks confirm scope and expiry dates before enabling probes.
- The control plane exposes a `POST /admin/integrations/:id/authorize` endpoint that records grant metadata and cascades configuration updates to dependent services.

### 5.2 Health and Scheduling

- Integration health checks run via the Probe Management scheduler using intervals defined in tenant settings; failures escalate according to the [Probe Management runbook](06-probe-management-system.md#5-failure-handling-and-retries).
- Each connector maintains heartbeat metrics emitted through `admin/telemetry` to the observability pipelines referenced in the Audit Logging runbook.
- Scheduled jobs respect tenant blackout windows configured in `admin_settings` to avoid maintenance conflicts.

### 5.3 Incident Response Playbooks

- Critical integration outages trigger automated remediation steps: revoke compromised credentials, disable dependent probes, and notify stakeholders using predefined Notification templates.
- The admin console surfaces incident status, linked runbooks, and recovery SLAs while integrating with the Task Service to track follow-up work.
- Post-incident reviews ensure configuration drift is captured and corrective actions are logged in the audit trail.

## 6. Audit and Compliance Requirements

### 6.1 Activity Logging

- Every configuration change emits a structured event (`admin.audit`) containing actor, tenant, payload diff, and correlation IDs.
- Logs stream to the central pipeline described in the [Audit Logging & Monitoring runbook](05-audit-logging-and-monitoring.md) with retention policies aligned to regulatory commitments.
- The Governance Engine admin UI provides an immutable change log view for tenant administrators and internal auditors.

### 6.2 Evidence Collection

- Provisioning and configuration events automatically create evidence records stored in the Evidence Repository, tagged with the originating control ID.
- Integration authorizations capture consent artifacts (screenshots, signed agreements) uploaded during the workflow.
- Quarterly exports package configuration baselines and change histories for regulator reviews, aligning with the Compliance Reporting specification.

### 6.3 Periodic Reviews

- Quarterly tenant governance reviews verify role assignments, configuration overrides, and integration scopes.
- Annual penetration test outcomes feed into the security settings backlog with remediation tracked through the Task Service.
- A `reviewTenants` job audits dormant tenants for deprovisioning, notifying stakeholders before data retention policies purge assets.

## 7. Related Runbooks and Specifications

- [Probe Management System](06-probe-management-system.md) — provisioning and scheduler interactions for automated evidence collection.
- [Governance Engine](11-governance-engine.md) — admin UI embedding, control workflows, and dependency expectations.
- [External Integrations System](14-external-integrations-system.md) — connector catalog, authorization flows, and security posture.
- [Security Implementation Specification](../02-technical-specifications/06-security-implementation.md) — encryption, key management, and administrative access controls.
- [Integration Architecture Specification](../02-technical-specifications/07-integration-architecture.md) — event-driven patterns and contract guarantees for configuration propagation.

\n[← Previous](03-notification-system.md) | [Next →](05-audit-logging-and-monitoring.md)
