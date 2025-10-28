# Admin and Configuration System <!-- omit in toc -->

## Location: /server/src/modules/admin

>### TL;DR
> The admin and configuration system orchestrates multi-tenant onboarding, policy controls, and integration governance so the rest of the platform can operate with auditable guardrails.
> It exposes Express.js REST APIs and a React console to manage tenants, enforce security baselines, and govern external connectors in alignment with platform-wide workflows.
> This guide details the JavaScript-only implementation approach, module layout, API contracts, UI flows, data models, and operational dependencies required to ship production-ready features.

---

- [Implementation Overview](#implementation-overview)
- [Backend Specification](#backend-specification)
  - [Location & Directory Layout](#backend-location--directory-layout)
  - [Core Responsibilities & Workflows](#core-responsibilities--workflows)
  - [Administrative API Surface](#administrative-api-surface)
  - [Configuration, Security & Observability](#configuration-security--observability)
- [Frontend Specification](#frontend-specification)
  - [Location & Directory Layout](#frontend-location--directory-layout)
  - [UI Workflows & State Management](#ui-workflows--state-management)
- [Schema Specification](#schema-specification)
- [Operational Playbooks & References](#operational-playbooks--references)

---

## Implementation Overview
The admin system anchors the control plane for the continuous governance cycle by enabling teams to provision tenants, configure policies, and route integrations without breaking the evidence-to-remediation loop described in the concept summary.【F:docs/01-about/03-concept-summary.md†L203-L358】
It runs as part of the Node.js + Express backend using JavaScript-only modules, interacting with PostgreSQL via Prisma and adhering to shared API, security, and deployment conventions documented for the platform.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L55-L171】【F:docs/02-technical-specifications/08-deployment-and-environment-guide.md†L138-L142】
Administrative decisions feed downstream services such as Governance Engine, Notifications, Task Management, and Evidence Repository so every configuration change remains traceable and actionable.【F:docs/03-systems/12-governance-engine/readme.md†L33-L126】【F:docs/03-systems/04-notification-system/readme.md†L56-L126】【F:docs/03-systems/13-task-management-system/readme.md†L1-L226】【F:docs/03-systems/11-evidence-management-system/readme.md†L47-L115】

## Backend Specification

### Backend Location & Directory Layout
Administrative capabilities live under `server/src/modules/admin`, following the platform’s feature-based layout, JavaScript naming conventions, and Express routing patterns.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L55-L68】

```
server/src/modules/admin/
├── api/
│   ├── tenants.controller.js
│   ├── settings.controller.js
│   ├── integrations.controller.js
│   └── admin.routes.js
├── workflows/
│   ├── verify-tenant.workflow.js
│   ├── bootstrap-environment.workflow.js
│   └── rotate-credential.workflow.js
├── services/
│   ├── tenant.service.js
│   ├── configuration.service.js
│   ├── feature-flags.service.js
│   └── integration.service.js
├── repositories/
│   ├── tenant.repository.js
│   ├── settings.repository.js
│   └── integration.repository.js
├── events/
│   ├── admin.event-publisher.js
│   └── schemas/
├── telemetry/
│   ├── admin.audit.logger.js
│   └── metrics.js
└── scripts/
    └── seed-admin-data.js
```

Routes register in `server/src/routes/admin.routes.js`, mounting the `/api/admin` router and reusing shared middleware for authentication, validation, rate limiting, and Casbin enforcement consistent with other modules.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L56-L104】【F:docs/02-technical-specifications/06-security-implementation.md†L60-L99】

### Core Responsibilities & Workflows
- **Tenant Provisioning Lifecycle:** `POST /api/admin/tenants` invokes `verify-tenant.workflow.js`, validating organization metadata, RBAC seeds, and billing context before queuing `bootstrap-environment.workflow.js` to create evidence namespaces, default notification templates, dashboards, and probe stubs required by onboarding standards.【F:docs/03-systems/07-probe-management-system/readme.md†L27-L142】【F:docs/02-technical-specifications/08-deployment-and-environment-guide.md†L138-L142】 Failures emit `admin.tenant.failed` events consumed by Notifications for follow-up and Task Management for remediation tickets.【F:docs/03-systems/04-notification-system/readme.md†L56-L126】【F:docs/03-systems/13-task-management-system/readme.md†L1-L226】
- **Delegated Administration:** Tenant owners manage user invites, role assignments, and approval workflows, relying on Casbin-backed middleware and RBAC runbooks to enforce separation of duties and tenant scoping.【F:docs/03-systems/02-rbac-system/readme.md†L23-L116】【F:docs/02-technical-specifications/06-security-implementation.md†L65-L99】 Governance Engine surfaces configuration diffs and pending approvals, ensuring administrators can reconcile changes alongside control scoring.【F:docs/03-systems/12-governance-engine/readme.md†L33-L132】
- **Global Policy & Secrets Governance:** `configuration.service.js` centralizes platform policy toggles (auth requirements, session rules, evidence retention) with dual-approval workflows, while `rotate-credential.workflow.js` coordinates Vault/Key Vault updates, audit logging, and notification hooks to meet security standards.【F:docs/02-technical-specifications/06-security-implementation.md†L100-L166】【F:docs/03-systems/15-external-integrations-system/readme.md†L96-L211】
- **Integration Control Plane:** Admin operators register third-party connectors, map scopes, and schedule health checks that orchestrate Probe Management, External Integrations, and Governance Engine subscribers for continuous evidence intake.【F:docs/03-systems/07-probe-management-system/readme.md†L139-L210】【F:docs/02-technical-specifications/07-integration-architecture.md†L69-L172】【F:docs/03-systems/15-external-integrations-system/readme.md†L52-L211】

### Administrative API Surface
APIs follow REST and OpenAPI standards shared across the backend, including pagination, optimistic concurrency via `If-Match` headers, and correlation IDs for auditability.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L194-L200】 Key endpoints:

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/admin/tenants` | Create tenant, run verification workflow, seed RBAC defaults, and emit provisioning events. |
| `GET` | `/api/admin/tenants/:tenantId` | Retrieve tenant metadata, lifecycle status, and compliance readiness indicators for governance dashboards. |
| `PATCH` | `/api/admin/tenants/:tenantId/status` | Transition tenant lifecycle states (`pending`, `active`, `suspended`, `deprovisioning`) with audit comment requirements. |
| `GET/PUT` | `/api/admin/settings` | Read or update global policies (password rotation, MFA enforcement, evidence retention) guarded by dual approvals and change tickets. |
| `GET/PUT` | `/api/admin/settings/:tenantId` | Override policies per tenant with automatic inheritance checks and rollback support. |
| `POST` | `/api/admin/feature-flags` | Define feature toggles, rollout cohorts, and kill switches referencing LaunchDarkly identifiers with staged release metadata.【F:docs/02-technical-specifications/07-integration-architecture.md†L69-L145】 |
| `POST` | `/api/admin/integrations` | Register external connectors, capture OAuth/API credentials, configure scopes, and schedule health checks shared with Probe Management.【F:docs/03-systems/15-external-integrations-system/readme.md†L52-L172】 |
| `POST` | `/api/admin/integrations/:id/rotate` | Trigger credential rotation workflow, update secrets manager, notify stakeholders, and document evidence artifacts.【F:docs/03-systems/15-external-integrations-system/readme.md†L173-L211】 |
| `GET` | `/api/admin/audit-events` | Stream configuration change history, dual approvals, and workflow results linked to audit logging and evidence systems.【F:docs/02-technical-specifications/06-security-implementation.md†L124-L144】【F:docs/03-systems/11-evidence-management-system/readme.md†L47-L115】 |

### Configuration, Security & Observability
- **Authentication & Authorization:** All routes require JWT authentication, Casbin checks, and tenant-domain scoping enforced by shared middleware, aligning with security implementation and RBAC mandates.【F:docs/02-technical-specifications/06-security-implementation.md†L60-L115】【F:docs/03-systems/02-rbac-system/readme.md†L23-L88】
- **Secrets & Environment Variables:** Environment config uses uppercase snake-case variables (e.g., `ADMIN_LAUNCHDARKLY_SDK_KEY`, `ADMIN_SECRETS_PROVIDER`) managed through deployment pipelines and secret vault integrations outlined in security guidance.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L66-L68】【F:docs/02-technical-specifications/06-security-implementation.md†L100-L121】
- **Eventing & Audit:** `admin.event-publisher.js` emits structured events (`admin.tenant.created`, `admin.setting.updated`, `admin.integration.health`) to the shared message bus so Notifications, Governance, and Audit Logging systems maintain state parity and compliance evidence.【F:docs/03-systems/06-audit-logging-and-monitoring/readme.md†L1-L200】【F:docs/03-systems/04-notification-system/readme.md†L56-L126】【F:docs/03-systems/12-governance-engine/readme.md†L90-L156】
- **Telemetry & Metrics:** Metrics exported via `metrics.js` include onboarding duration, approval latency, integration heartbeat failures, and rotation throughput; these feed Grafana dashboards referenced in operations guides for notifications and audit logging.【F:docs/03-systems/06-audit-logging-and-monitoring/readme.md†L120-L200】【F:docs/03-systems/04-notification-system/readme.md†L103-L126】
- **Error Handling & Rate Limits:** Shared middleware enforces validation, rate limiting on sensitive endpoints, and structured error responses consistent with platform standards to mitigate abuse and maintain SLA commitments.【F:docs/02-technical-specifications/06-security-implementation.md†L147-L182】

## Frontend Specification

### Frontend Location & Directory Layout
The admin console is embedded within the Governance Engine UI under `client/src/features/admin`, implemented in JavaScript (no TypeScript) and organized per the feature-based React architecture guidelines.【F:docs/02-technical-specifications/03-frontend-architecture.md†L17-L78】

```
client/src/features/admin/
├── pages/
│   ├── tenant-onboarding-wizard.jsx
│   ├── settings-overview-page.jsx
│   ├── integration-catalog-page.jsx
│   └── audit-trail-page.jsx
├── components/
│   ├── delegated-admin-table.jsx
│   ├── feature-flag-toggle.jsx
│   ├── secret-rotation-modal.jsx
│   └── integration-health-card.jsx
├── hooks/
│   ├── use-tenant-provisioning.js
│   ├── use-admin-settings.js
│   └── use-integration-health.js
├── api/
│   └── admin-client.js
└── state/
    └── admin-store.js

client/src/components/governance/
└── config-diff-viewer.jsx
```

Shared route guards (`RequirePermission`) from the RBAC system wrap admin routes to ensure UI state matches backend authorization checks.【F:docs/03-systems/02-rbac-system/readme.md†L60-L88】 All files adhere to lowercase hyphen naming conventions with PascalCase component exports, aligning with frontend standards.【F:docs/02-technical-specifications/03-frontend-architecture.md†L29-L72】

### UI Workflows & State Management
- **Onboarding Wizard:** Multi-step wizard collects tenant metadata, verifies prerequisites, and polls provisioning status using `use-tenant-provisioning.js`, surfacing failure reasons tied to Notification events and remediation tasks.【F:docs/03-systems/07-probe-management-system/readme.md†L27-L142】【F:docs/03-systems/04-notification-system/readme.md†L56-L103】
- **Policy & Feature Management:** `settings-overview-page.jsx` and `feature-flag-toggle.jsx` enforce dual approvals by requiring two distinct session confirmations before enabling `admin-client.js` mutations, with UI copy referencing security posture expectations such as MFA and encryption policies.【F:docs/02-technical-specifications/06-security-implementation.md†L71-L166】
- **Integration Catalog & Health:** `integration-catalog-page.jsx` visualizes connector scopes, heartbeat metrics, and incident summaries, linking to Probe Management and External Integration runbooks for deeper triage guidance.【F:docs/02-technical-specifications/07-integration-architecture.md†L69-L198】【F:docs/03-systems/07-probe-management-system/readme.md†L139-L210】
- **Audit Visibility & Diffing:** `audit-trail-page.jsx` pairs with `config-diff-viewer.jsx` to present immutable change history with filters for actor, tenant, resource, and timeframe, ensuring parity with audit logging retention policies and evidence linking requirements.【F:docs/02-technical-specifications/06-security-implementation.md†L124-L144】【F:docs/03-systems/06-audit-logging-and-monitoring/readme.md†L1-L200】
- **State Management:** Local state leverages React hooks and Context (auth, notifications) as described in frontend architecture, while feature-specific caches (e.g., onboarding status) use SWR-style polling via `useEffect` loops inside hooks for predictable updates.【F:docs/02-technical-specifications/03-frontend-architecture.md†L84-L132】

## Schema Specification
Admin persistence relies on Prisma models living in the shared PostgreSQL schema, applying the database design principles around normalization, UUID keys, and soft deletes.【F:docs/02-technical-specifications/04-database-design.md†L38-L133】 Core tables:

- **`admin_tenants`** – Stores tenant identifiers, lifecycle state, billing tier, data residency, approval metadata, and timestamps, linking to RBAC assignments and governance contexts for onboarding workflows.【F:docs/02-technical-specifications/04-database-design.md†L69-L139】【F:docs/03-systems/02-rbac-system/readme.md†L91-L96】
- **`admin_settings`** – Captures global configuration values, effective/expiry windows, dual-approval records, and references to evidence artifacts documenting policy changes.【F:docs/02-technical-specifications/04-database-design.md†L38-L133】【F:docs/03-systems/11-evidence-management-system/readme.md†L47-L115】
- **`admin_flags`** – Manages feature toggle definitions, rollout cohorts, audit trails, and launch metadata for experimentation aligned with integration architecture guidance.【F:docs/02-technical-specifications/07-integration-architecture.md†L69-L145】
- **`admin_integrations`** – Persists connector configuration (type, scopes, credential references, health status) and scheduling metadata tied to Probe Management and External Integrations systems.【F:docs/03-systems/07-probe-management-system/readme.md†L139-L210】【F:docs/03-systems/15-external-integrations-system/readme.md†L52-L211】
- **`admin_audit_events`** – Append-only ledger recording actor, action, payload diff, correlation IDs, and evidence references, enforcing retention and immutability expectations set by security and audit logging documentation.【F:docs/02-technical-specifications/06-security-implementation.md†L124-L144】【F:docs/03-systems/06-audit-logging-and-monitoring/readme.md†L1-L200】

Foreign keys connect admin tables to users, roles, notifications, tasks, and evidence tables following the relationship model described in the database design specification so downstream services can join data efficiently.【F:docs/02-technical-specifications/04-database-design.md†L125-L141】

## Operational Playbooks & References

### Audit & Compliance Expectations
- **Logging & Retention:** `admin.audit.logger.js` writes structured events to the centralized audit pipeline with the 36-month retention baseline, exposing dashboards for auditors through Governance Engine views.【F:docs/02-technical-specifications/06-security-implementation.md†L124-L144】【F:docs/03-systems/12-governance-engine/readme.md†L110-L132】
- **Evidence Capture:** Provisioning, policy changes, and rotations automatically store supporting records (artifacts, approvals, tickets) in the Evidence Repository so auditors can trace configuration history.【F:docs/03-systems/11-evidence-management-system/readme.md†L47-L115】
- **Periodic Reviews:** Quarterly/annual reviews reconcile RBAC assignments, overrides, and integration scopes, triggering automated tasks and notifications for remediation when discrepancies appear, keeping governance cycles unbroken.【F:docs/03-systems/02-rbac-system/readme.md†L97-L115】【F:docs/03-systems/13-task-management-system/readme.md†L1-L226】

### Runbooks & Inter-Service References
- [Probe Management System](../07-probe-management-system/readme.md) — scheduling and health orchestration for connectors and evidence collection.
- [Notification System](../04-notification-system/readme.md) — alerting paths for onboarding failures, policy approvals, and credential rotations.
- [Governance Engine](../12-governance-engine/readme.md) — embedded admin experience, configuration diffing, and risk scoring integration.
- [External Integrations System](../15-external-integrations-system/readme.md) — connector catalog, authorization flows, and incident handling.
- [Security Implementation Specification](../../02-technical-specifications/06-security-implementation.md) — encryption, MFA, incident response, and audit controls.
- [Integration Architecture Specification](../../02-technical-specifications/07-integration-architecture.md) — external API standards, webhook governance, and feature flag rollout.

---

[← Previous](../04-notification-system/readme.md) | [Next →](../06-audit-logging-and-monitoring/readme.md)
