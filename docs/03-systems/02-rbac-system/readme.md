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
└── routes/rbac.routes.ts

server/src/middleware/
└── authorization.ts
```

### Role Model & Enforcement
The RBAC system resides within the Auth Service, where controllers orchestrate login, token issuance, and authorization decisions. A dedicated Casbin adapter loads policies from PostgreSQL into an in-memory enforcer shared across Express middleware. Prisma migrations run through the release pipeline to keep the managed PostgreSQL schema aligned with Casbin’s tables.

#### Role Hierarchy
RBAC follows hierarchical inheritance. Built-in roles include **Super Admin**, **Admin**, **Compliance Officer**, **Auditor**, **Engineer**, and **System Service**, each inheriting capabilities from the role below it to uphold least-privilege principles. Custom roles derive from these definitions or from other custom roles, storing metadata in `auth_roles` (owner tenant, description, review cadence) and mapping to granular policies for scoped privileges. Separation-of-duty rules ensure approval actions require distinct users, impersonation is audited, and conflicting admin/auditor assignments trigger automated reviews.

#### Permission Granularity
Policies combine resource type, identifier, and action verb (e.g., `framework:123:update`, `control:*:approve`). Casbin domains provide tenant scoping, wildcards enable read vs. write bundles, and middleware-level attribute checks add ABAC-style conditions for contextual enforcement.

#### Enforcement Surface
Middleware in `server/src/middleware/authorization.ts` validates JWTs, builds Casbin subjects/domains/objects/actions, and denies or allows requests with audit logging. Module-specific helpers extend enforcement into Governance Engine, Evidence, Notifications, and Tasks modules to guarantee consistent authorization. Observability hooks log decisions to `audit_logs` for compliance and forensics.

## Frontend Specification

### Frontend Location & Directory Layout
Role management experiences live inside the admin area of the React client under `client/src/features/admin/rbac`, alongside shared guard components that protect routes and dashboards based on evaluated permissions.【F:docs/02-technical-specifications/03-frontend-architecture.md†L96-L139】

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
- **Policy Management Screens:** Admin pages provide CRUD experiences for roles, inheritance, and policies, invoking `/auth/roles`, `/auth/policies`, and `/auth/access-reviews` endpoints with optimistic updates and conflict resolution modals.
- **Access Review Workflows:** `AccessReviewSummary` surfaces outstanding reviews, integrates with task notifications, and links into the Governance Engine for remediation triggers.
- **Visualizations:** Components such as `RoleInheritanceGraph` and `PermissionMatrix` reuse charting primitives from `client/src/components/charts` to display effective permissions per tenant.

## Schema Specification
- **`auth_roles`:** Stores role metadata (id, tenant domain, name, inheritance parent, review cadence) and drives UI listings.
- **`auth_role_assignments`:** Links users or service accounts to roles with effective and expiry timestamps for delegation tracking.
- **`auth_policies`:** Canonical Casbin policy rules (`p`, `g`, `g2`) with resource/action descriptors and domain segmentation.
- **`auth_policy_revisions`:** Append-only audit ledger capturing change metadata, justification, and reviewer approvals.
- **Redis Cache (`casbin:tenant:<id>`):** Maintains short-lived policy snapshots to reduce database load, invalidated via `policy.updated` events.

## Operational Playbooks & References

### Access Reviews and Governance Workflows
- Quarterly access reviews snapshot current assignments, send review tasks to Compliance Officers, and require sign-off before completion.
- Event-driven reviews detect dormant or conflicting privileges and open remediation tasks in the Task Service.
- Certification exports write reports to the Evidence Repository, while delegations create time-bound policies enforced by scheduled jobs.

### Updating Casbin Policies
1. **Plan:** Document desired permission updates and map the affected endpoints using the [Auth Service specification](../../02-technical-specifications/02-backend-architecture-and-apis.md#auth-service).
2. **Edit:** Use the Admin UI or `/auth/policies` API to adjust `p` (permission) or `g` (inheritance) rules; bulk updates leverage the RBAC sync CLI to push YAML manifests through the adapter.
3. **Validate:** Run `/auth/policies/dry-run` to preview effects and confirm separation-of-duty constraints.
4. **Deploy:** Ship accompanying migrations when introducing new roles/resources and coordinate cache invalidation across regions.
5. **Audit:** Verify `auth_policy_revisions` captures the change with justification and reviewer sign-off.

### Testing RBAC Scenarios
- **Unit Tests:** `server/src/modules/auth/__tests__/authorization.spec.ts` mocks the Casbin enforcer to cover allow/deny paths.
- **Integration Tests:** API tests under `server/src/routes/__tests__` seed PostgreSQL with fixtures to verify middleware and module-specific enforcement.
- **Manual Verification:** Leverage the shared Postman collection and run `npm run test:rbac` before releases; cross-validate Governance Engine workflows using its regression suite.

### Related Documentation
- [User Management & Auth Service](../../02-technical-specifications/02-backend-architecture-and-apis.md#auth-service)
- [Governance Engine](../../02-technical-specifications/02-backend-architecture-and-apis.md#governance-engine)
- [Security Implementation – RBAC](../../02-technical-specifications/06-security-implementation.md#63-role-based-access-control-rbac)

---

[← Previous](../01-user-management-system/readme.md) | [Next →](../03-document-and-media-upload/readme.md)
