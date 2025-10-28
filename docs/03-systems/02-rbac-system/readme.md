# RBAC System <!-- omit in toc -->

## Location: /server/src/modules/auth

>### TL;DR
> The AI Governance Platform enforces role-based access control (RBAC) using **Casbin** across the Node.js backend. Policies are persisted in **PostgreSQL**, cached for high throughput, and evaluated in middleware before any module logic runs. This document explains the role hierarchy, permission granularity, enforcement layers, and operational workflows that keep access secure and auditable.
>
> **Casbin is a mandated dependency for RBAC**. Replacing it with any other authorization library or custom implementation requires a formal architecture review and sign-off from the security governance committee.

---

- [Backend Specification](#backend-specification)
  - [Location & Directory Layout](#backend-location--directory-layout)
  - [Role Model & Enforcement](#role-model--enforcement)
- [Frontend Specification](#frontend-specification)
  - [Location & Directory Layout](#frontend-location--directory-layout)
  - [Reusable Components & UI Flows](#reusable-components--ui-flows)
- [Schema Specification](#schema-specification)
- [Operational Playbooks & References](#operational-playbooks--references)

---

## Backend Specification

### Backend Location & Directory Layout
Casbin-backed RBAC logic ships with the Auth module in `server/src/modules/auth`, with cross-cutting middleware under `server/src/middleware` to enforce permissions before feature handlers execute.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L52-L86】

```
server/src/modules/auth/
├── casbin/
│   ├── rbac_with_domains_model.conf
│   └── policy.seed.json
├── controllers/
│   └── rbac.controller.ts
├── services/
│   ├── role.service.ts
│   └── policy.service.ts
├── repositories/
│   ├── role.repository.ts
│   └── policy.repository.ts
├── casbin-adapter.ts
└── routes/rbac.routes.ts      # Mounts /api/auth RBAC endpoints

server/src/middleware/
└── authorization.ts
```

### Role Model & Enforcement
The RBAC system resides within the Auth Service, where controllers orchestrate login, token issuance, and authorization decisions. A dedicated Casbin adapter loads policies from PostgreSQL into an in-memory enforcer shared across Express middleware. Prisma migrations run through the release pipeline to keep the managed PostgreSQL schema aligned with Casbin’s tables.

#### Role Hierarchy
RBAC follows hierarchical inheritance that mirrors the platform-wide security model. Canonical roles are **Admin**, **Compliance Officer**, **Engineer**, **Auditor**, and **System Service**, with an operational **Super Admin** overlay reserved for the CISO break-glass workflow.【F:docs/02-technical-specifications/06-security-implementation.md†L84-L108】【F:docs/01-about/04-security-and-data-protection.md†L238-L282】 Each role inherits capabilities from the role beneath it to uphold least-privilege principles. Custom roles derive from these definitions or from other custom roles, storing metadata in `auth_roles` (owner tenant, description, review cadence) and mapping to granular policies for scoped privileges. Separation-of-duty rules enforce that approval actions require distinct reviewers, impersonation is audited, and conflicting admin/auditor assignments trigger automated reviews with escalations to the Security Council.【F:docs/01-about/04-security-and-data-protection.md†L238-L299】【F:docs/01-about/08-operations-and-teams.md†L79-L128】

#### Permission Granularity
Policies combine resource type, identifier, and action verb (e.g., `framework:123:update`, `control:*:approve`). Casbin domains provide tenant scoping, wildcards enable read vs. write bundles, and middleware-level attribute checks add ABAC-style conditions for contextual enforcement.

#### Enforcement Surface
Middleware in `server/src/middleware/authorization.ts` validates JWTs, builds Casbin subjects/domains/objects/actions, and denies or allows requests with audit logging. Module-specific helpers extend enforcement into Governance Engine, Evidence, Notifications, and Tasks modules to guarantee consistent authorization across feature services.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L56-L115】 Observability hooks log decisions to `audit_logs` for compliance and forensics, forwarding structured JSON to the centralized monitoring stack mandated by DevOps and security governance.【F:docs/02-technical-specifications/06-security-implementation.md†L120-L156】【F:docs/02-technical-specifications/05-devops-infrastructure.md†L64-L141】

### API Contracts & Module Interfaces
RBAC functionality is exposed through dedicated REST endpoints served by the Auth Service and mounted under the `/api` prefix in line with the platform's API standards.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L90-L151】【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L200-L251】

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/auth/roles` | GET/POST | List existing roles, create custom roles, or clone baseline templates. |
| `/api/auth/roles/:id` | GET/PATCH/DELETE | Inspect role metadata, adjust inheritance, or retire roles while preserving revision history. |
| `/api/auth/policies` | GET/POST | Manage granular Casbin `p` rules for resources and actions with dry-run support. |
| `/api/auth/policies/:id` | PATCH/DELETE | Update or revoke specific policies; mutation events invalidate caches. |
| `/api/auth/access-reviews` | POST | Launch scheduled or ad-hoc access recertification workflows that integrate with the Task Service. |
| `/api/auth/service-accounts` | POST/PATCH | Issue scoped credentials for automation and partner integrations with domain-bound permissions. |

All endpoints require JWT authentication and are guarded by Casbin middleware before reaching controller logic. Responses follow the standardized `{ status, message, data, error }` schema and publish OpenAPI documentation through `/api/docs` to keep implementation and documentation in sync.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L208-L251】

### Domain Events & Integrations
RBAC emits and consumes domain events to keep downstream systems synchronized:

- **`policy.updated`** – Published whenever roles or policies change. Subscribers include cache workers, the Notification Service, and Governance Engine recalculations. Retries follow the exponential backoff standards in the integration architecture.【F:docs/02-technical-specifications/07-integration-architecture.md†L122-L176】
- **`access-review.opened` / `access-review.completed`** – Coordinate remediation tasks and compliance dashboards, feeding evidence exports and KPI reporting.
- **Partner API hooks** – RBAC scopes partner tokens and enforces API access restrictions, ensuring external integrations remain within approved privileges.【F:docs/02-technical-specifications/07-integration-architecture.md†L176-L212】

Inbound events—such as automated evidence probes requesting temporary elevation—are validated with signed payloads, evaluated against Casbin domains, and either accepted or rejected with audit trails for regulatory review.【F:docs/02-technical-specifications/07-integration-architecture.md†L212-L236】

## Frontend Specification

### Frontend Location & Directory Layout
Role management experiences live inside the admin area of the React client under `client/src/features/admin/rbac`, alongside shared guard components that protect routes and dashboards based on evaluated permissions.【F:docs/02-technical-specifications/03-frontend-architecture.md†L96-L139】 The RBAC pages are exposed through the same admin console shell described in the Admin and Configuration system, giving platform and tenant administrators a dedicated "Access Control" navigation cluster for listing roles, editing inheritance, and reviewing policy matrices without leaving the governance control plane.【F:docs/03-systems/05-admin-and-configuration-system/readme.md†L71-L121】

```
client/src/features/admin/rbac/
├── pages/
│   ├── RoleListPage.tsx
│   ├── RoleDetailPage.tsx
│   └── PolicyEditorPage.tsx
├── components/
│   ├── PermissionMatrix.tsx
│   ├── RoleInheritanceGraph.tsx
│   └── AccessReviewSummary.tsx
├── hooks/
│   └── useRoleAssignments.ts
└── api/
    └── rbacClient.ts

client/src/components/guards/
└── RequirePermission.tsx
```

### Reusable Components & UI Flows
- **Shared Guards:** `RequirePermission` and `RequireRole` components gate admin navigation, dashboards, and inline actions with Casbin-backed checks exposed via the Auth Context.【F:docs/02-technical-specifications/03-frontend-architecture.md†L96-L139】
- **Policy Management Screens:** Admin pages provide CRUD experiences for roles, inheritance, and policies, invoking `/api/auth/roles`, `/api/auth/policies`, and `/api/auth/access-reviews` endpoints with optimistic updates and conflict resolution modals. The list → detail → policy editor flow surfaces contextual breadcrumbs (`Access Control / Roles`) so admins always understand which tenant domain and Casbin scope they are adjusting.
- **Access Review Workflows:** `AccessReviewSummary` surfaces outstanding reviews, integrates with task notifications, and links into the Governance Engine for remediation triggers.
- **Visualizations:** Components such as `RoleInheritanceGraph` and `PermissionMatrix` reuse charting primitives from `client/src/components/charts` to display effective permissions per tenant.

## Schema Specification
- **`auth_roles`:** Stores role metadata (id, tenant domain, name, inheritance parent, review cadence) and drives UI listings. Indexed on tenant and name for fast lookups under the externally hosted PostgreSQL model.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L180-L209】
- **`auth_role_assignments`:** Links users or service accounts to roles with effective and expiry timestamps for delegation tracking and supports soft deletes for historical review.
- **`auth_policies`:** Canonical Casbin policy rules (`p`, `g`, `g2`) with resource/action descriptors and domain segmentation. Policies persist as immutable rows with revision pointers.
- **`auth_policy_revisions`:** Append-only audit ledger capturing change metadata, justification, and reviewer approvals consistent with immutable logging expectations.【F:docs/02-technical-specifications/06-security-implementation.md†L138-L156】
- **Redis Cache (`casbin:tenant:<id>`):** Maintains short-lived policy snapshots to reduce database load, invalidated via `policy.updated` events and redeployed alongside Kubernetes rollouts.【F:docs/02-technical-specifications/05-devops-infrastructure.md†L88-L141】

Schema migrations are executed through Prisma migration bundles submitted via the CI/CD change queue so RBAC tables remain governed even on managed database hosts.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L172-L190】 Security controls enforce RBAC-aligned database roles with TLS and AES-256 encryption per the database design standards.【F:docs/02-technical-specifications/04-database-design.md†L169-L196】

## Operational Playbooks & References

### Access Reviews and Governance Workflows
- Quarterly access reviews snapshot current assignments, send review tasks to Compliance Officers, and require sign-off before completion in alignment with enterprise governance processes.【F:docs/01-about/04-security-and-data-protection.md†L282-L314】【F:docs/01-about/08-operations-and-teams.md†L129-L181】
- Event-driven reviews detect dormant or conflicting privileges and open remediation tasks in the Task Service, surfacing alerts via Notification Service SLAs.
- Certification exports write reports to the Evidence Repository, while delegations create time-bound policies enforced by scheduled jobs and audited through immutable log retention.

### Updating Casbin Policies
1. **Plan:** Document desired permission updates and map the affected endpoints using the [Auth Service specification](../../02-technical-specifications/02-backend-architecture-and-apis.md#auth-service). Capture rationale and risk assessment for Security Council review.
2. **Edit:** Use the Admin UI or `/api/auth/policies` API to adjust `p` (permission) or `g` (inheritance) rules; bulk updates leverage the RBAC sync CLI to push YAML manifests through the adapter.
3. **Validate:** Run `/api/auth/policies/dry-run` to preview effects, execute automated regression suites, and confirm separation-of-duty constraints enforced by Casbin and ABAC checks.【F:docs/02-technical-specifications/06-security-implementation.md†L96-L116】
4. **Deploy:** Ship accompanying migrations when introducing new roles/resources, coordinate cache invalidation across regions, and allow CI/CD promotion gates to verify policy load success before production rollout.【F:docs/02-technical-specifications/05-devops-infrastructure.md†L108-L167】
5. **Audit:** Verify `auth_policy_revisions` captures the change with justification and reviewer sign-off, then export summaries for immutable evidence storage.

### Testing RBAC Scenarios
- **Unit Tests:** `server/src/modules/auth/__tests__/authorization.spec.ts` mocks the Casbin enforcer to cover allow/deny paths and inheritance edge cases.
- **Integration Tests:** API tests under `server/src/routes/__tests__` seed PostgreSQL with fixtures to verify middleware and module-specific enforcement, exercising the standardized error schema.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L200-L228】
- **Manual Verification:** Leverage the shared Postman collection, run `npm run test:rbac`, and execute the security hardening checklist before releases, including cache flushes and policy reload verification.【F:docs/02-technical-specifications/06-security-implementation.md†L96-L116】【F:docs/02-technical-specifications/05-devops-infrastructure.md†L128-L180】

### Configuration, Deployment & Monitoring
- **Environment Configuration:** RBAC services read Casbin model paths, adapter DSNs, and cache TTLs from environment variables managed via cloud vaults and Terraform in the `infra/` directory.【F:docs/02-technical-specifications/05-devops-infrastructure.md†L48-L117】
- **Deployment Workflow:** CI pipelines lint, test, and build Docker images, then stage rollouts with blue-green or rolling strategies. Production promotion requires manual approval from security leadership when RBAC policies change.【F:docs/02-technical-specifications/05-devops-infrastructure.md†L117-L195】
- **Observability:** Metrics for authorization latency, policy cache hit rate, and deny counts stream to Grafana dashboards; alerts trigger PagerDuty when failure rates exceed thresholds or policy sync jobs lag behind schedule.【F:docs/02-technical-specifications/05-devops-infrastructure.md†L195-L238】

### Related Documentation
- [User Management & Auth Service](../../02-technical-specifications/02-backend-architecture-and-apis.md#auth-service)
- [Governance Engine](../../02-technical-specifications/02-backend-architecture-and-apis.md#governance-engine)
- [Security Implementation – RBAC](../../02-technical-specifications/06-security-implementation.md#63-role-based-access-control-rbac)

---

[← Previous](../01-user-management-system/readme.md) | [Next →](../03-document-and-media-upload/readme.md)
