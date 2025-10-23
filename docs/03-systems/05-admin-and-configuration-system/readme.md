# Admin and Configuration System <!-- omit in toc -->

## Location: /server/src/modules/admin

>### TL;DR
> The admin and configuration system orchestrates tenant onboarding, global policy management, and integration governance from a unified control plane.
> It exposes administrative APIs and a React-based console embedded in the Governance Engine UI for secure configuration workflows.
> This guide explains provisioning flows, configuration hierarchies, integration automation, and audit expectations shared across operations runbooks.

---

- [Backend Specification](#backend-specification)
  - [Location & Directory Layout](#backend-location--directory-layout)
  - [Tenant Provisioning Lifecycle](#tenant-provisioning-lifecycle)
  - [Global Settings & Secrets Management](#global-settings--secrets-management)
  - [Integration Control Plane](#integration-control-plane)
- [Frontend Specification](#frontend-specification)
  - [Location & Directory Layout](#frontend-location--directory-layout)
  - [Reusable Components & UI Flows](#reusable-components--ui-flows)
- [Schema Specification](#schema-specification)
- [Operational Playbooks & References](#operational-playbooks--references)

---

## Backend Specification

### Backend Location & Directory Layout
Administrative capabilities live in `server/src/modules/admin`, exposing REST APIs, workflow orchestration, and integration control services secured by RBAC scopes.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L86-L171】

```
server/src/modules/admin/
├── api/
│   ├── tenants.controller.ts
│   ├── settings.controller.ts
│   └── integrations.controller.ts
├── workflows/
│   ├── verifyTenant.workflow.ts
│   ├── bootstrapEnvironment.workflow.ts
│   └── rotateCredential.workflow.ts
├── services/
│   ├── tenant.service.ts
│   ├── configuration.service.ts
│   └── integration.service.ts
├── persistence/
│   ├── tenant.repository.ts
│   ├── settings.repository.ts
│   └── integrations.repository.ts
├── telemetry/
│   └── admin.audit.ts
└── ui/
    └── embedded-console/
```

### Tenant Provisioning Lifecycle
- **Intake & Verification:** `POST /admin/tenants` and the Governance Engine admin wizard trigger the `verifyTenant` workflow, validating identity, compliance, and billing signals. Failures raise Notification events for remediation.
- **Environment Bootstrapping:** Asynchronous jobs create baseline evidence repositories, notification templates, dashboards, and secrets namespaces aligned with Security Implementation standards. Seed scripts register default frameworks, tasks, and mandatory integrations.【F:docs/03-systems/07-probe-management-system/readme.md†L39-L156】
- **Delegated Administration:** Customer admins invite team members under RBAC enforcement, with delegation scopes (support-only, auditor, full admin) preventing privilege escalation. Governance Engine surfaces configuration diffs and pending approvals for review.【F:docs/03-systems/02-rbac-system/readme.md†L7-L229】【F:docs/03-systems/12-governance-engine/readme.md†L90-L187】

### Global Settings & Secrets Management
- **Policy Controls:** `admin_settings` stores platform policies (password rules, MFA, session expiry) with per-tenant overrides. Changes propagate via configuration events and require dual approval for high-risk updates.
- **Feature Flags:** `admin_flags` integrates with LaunchDarkly, following Testing & QA safe rollout guidance (canary cohorts, automated rollback, change ticket references).
- **Secrets & Credential Rotation:** `rotateCredential.workflow.ts` coordinates secrets manager updates, evidence replication, and Notification alerts. Emergency rotations notify on-call engineers and tenant admins, aligning with the External Integrations runbook.【F:docs/03-systems/15-external-integrations-system/readme.md†L96-L211】

### Integration Control Plane
- **Authorization Flows:** OAuth connectors (ServiceNow, Jira, Slack) follow the authorization journeys described in the External Integrations guide, storing least-privilege tokens per tenant. API key uploads validate scope and expiry before enabling probes.【F:docs/03-systems/15-external-integrations-system/readme.md†L52-L211】
- **Health & Scheduling:** Probe Management schedulers execute integration health checks respecting blackout windows and escalation rules. Connectors emit heartbeat metrics via `admin/telemetry` into the Audit Logging pipelines.【F:docs/03-systems/07-probe-management-system/readme.md†L139-L226】【F:docs/03-systems/06-audit-logging-and-monitoring/readme.md†L7-L200】
- **Incident Response:** Critical outages trigger remediation—revoking credentials, disabling probes, notifying stakeholders, and opening Task Service follow-ups. Post-incident reviews capture configuration drift and corrective actions for the audit trail.【F:docs/03-systems/13-task-management-system/readme.md†L7-L226】

## Frontend Specification

### Frontend Location & Directory Layout
The admin console is embedded within the Governance Engine UI under `client/src/features/admin`, providing configuration dashboards, onboarding wizards, and audit views.【F:docs/02-technical-specifications/03-frontend-architecture.md†L96-L160】

```
client/src/features/admin/
├── pages/
│   ├── TenantOnboardingWizard.tsx
│   ├── SettingsOverviewPage.tsx
│   ├── IntegrationCatalogPage.tsx
│   └── AuditTrailPage.tsx
├── components/
│   ├── DelegatedAdminTable.tsx
│   ├── FeatureFlagToggle.tsx
│   ├── SecretRotationModal.tsx
│   └── IntegrationHealthCard.tsx
├── hooks/
│   ├── useTenantProvisioning.ts
│   ├── useAdminSettings.ts
│   └── useIntegrationHealth.ts
└── api/
    └── adminClient.ts

client/src/components/governance/
└── ConfigDiffViewer.tsx
```

### Reusable Components & UI Flows
- **Onboarding Wizard:** Guides operators through tenant metadata intake, compliance checks, and provisioning tasks, reusing `useTenantProvisioning` to poll workflow progress.
- **Settings Management:** `FeatureFlagToggle` and `SecretRotationModal` surface approvals, change ticket capture, and dual-control confirmations before persisting policy updates.
- **Integration Catalog:** `IntegrationHealthCard` lists connector status, last heartbeat, and authorization state, linking into Probe Management runbooks for remediation.
- **Audit Visibility:** `ConfigDiffViewer` and `AuditTrailPage` present immutable change histories with filters for actor, tenant, and timeframe, aligning with audit requirements.

## Schema Specification
- **`admin_tenants`:** Tenant metadata (slug, plan, jurisdiction, compliance context) plus lifecycle timestamps.
- **`admin_settings`:** Global and per-tenant policy values with approval metadata, change ticket references, and effective windows.
- **`admin_flags`:** Feature toggle definitions, rollout cohorts, and audit annotations.
- **`admin_integrations`:** Connector credentials, scope details, scheduling intervals, and health status history.
- **`admin_audit_events`:** Structured change logs capturing actor, payload diff, correlation IDs, and downstream evidence references.
- Relationships tie into RBAC assignments, Notification templates, Probe schedules, and Evidence Repository records for holistic governance.

## Operational Playbooks & References

### Audit & Compliance Requirements
- Activity logging emits `admin.audit` events to the central pipeline with retention matching regulatory commitments, surfaced in the Governance Engine for internal auditors.【F:docs/03-systems/06-audit-logging-and-monitoring/readme.md†L7-L200】
- Provisioning and configuration actions create evidence records tagged with control IDs and supporting artifacts (screenshots, agreements) stored in the Evidence Repository.【F:docs/03-systems/11-evidence-management-system/readme.md†L47-L115】
- Quarterly and annual reviews validate roles, overrides, integration scopes, and security findings; dormant tenants trigger deprovisioning notices before retention policies purge assets.

### Related Runbooks & Specifications
- [Probe Management System](../07-probe-management-system/readme.md) — scheduler coordination and health checks.
- [Governance Engine](../12-governance-engine/readme.md) — embedded admin UI flows and approval chains.
- [External Integrations System](../15-external-integrations-system/readme.md) — connector catalog and security posture.
- [Security Implementation Specification](../../02-technical-specifications/06-security-implementation.md) — key management, admin access controls, and incident response expectations.
- [Integration Architecture Specification](../../02-technical-specifications/07-integration-architecture.md) — event-driven contracts for configuration propagation.

---

[← Previous](../04-notification-system/readme.md) | [Next →](../06-audit-logging-and-monitoring/readme.md)
