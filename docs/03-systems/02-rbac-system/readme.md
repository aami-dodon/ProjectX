# RBAC System <!-- omit in toc -->

## Location: /server/src/modules/auth

>### TL;DR
> The AI Governance Platform enforces role-based access control (RBAC) using **Casbin** across the Node.js backend. Policies are persisted in **PostgreSQL**, cached for high throughput, and evaluated in middleware before any module logic runs. This document explains the role hierarchy, permission granularity, enforcement layers, and operational workflows that keep access secure and auditable.
>
> **Casbin is a mandated dependency for RBAC**. Replacing it with any other authorization library or custom implementation requires a formal architecture review and sign-off from the security governance committee.

---

- [Location: /server/src/modules/auth](#location-serversrcmodulesauth)
- [1. System Overview](#1-system-overview)
- [2. Role Hierarchy](#2-role-hierarchy)
  - [2.1 Built-in Roles](#21-built-in-roles)
  - [2.2 Custom Roles](#22-custom-roles)
  - [2.3 Separation-of-Duty Rules](#23-separation-of-duty-rules)
- [3. Permission Granularity](#3-permission-granularity)
- [4. Enforcement Layers](#4-enforcement-layers)
  - [4.1 Request Lifecycle](#41-request-lifecycle)
  - [4.2 Module-Specific Enforcement](#42-module-specific-enforcement)
- [5. Policy Storage and Caching](#5-policy-storage-and-caching)
- [6. Access Reviews and Governance Workflows](#6-access-reviews-and-governance-workflows)
- [7. Updating Casbin Policies](#7-updating-casbin-policies)
- [8. Testing RBAC Scenarios](#8-testing-rbac-scenarios)
- [9. Related Documentation](#9-related-documentation)

---

## 1. System Overview

The RBAC system resides primarily in `server/src/modules/auth`, where controllers orchestrate login, token issuance, and authorization decisions. A dedicated Casbin adapter loads policies from PostgreSQL into an in-memory enforcer instance that is shared across Express middleware. Although PostgreSQL is provided as an externally hosted managed service, Project X owns a dedicated schema with DDL privileges; Prisma migrations are executed through the release pipeline so the adapter always sees the latest policy tables.

Key characteristics:

- **Policy Model:** `rbac_with_domains_model.conf` implements subject ⟶ domain ⟶ object ⟶ action rules, enabling tenant-specific scoping.
- **Policy Persistence:** The Casbin adapter writes to and reads from the `auth_policies` table via Prisma. Batched transactions ensure atomic role updates, and migrations published through the managed database change queue keep the external host’s schema aligned with Casbin requirements.
- **Enforcement Surface:** Middleware in `server/src/middleware/authorization.js` checks each request before handing control to feature controllers (Auth, Governance Engine, Frameworks, Evidence, Notifications, Tasks).
- **Observability:** Authorization decisions are logged to `audit_logs` with request metadata to satisfy compliance requirements and support forensic analysis.

## 2. Role Hierarchy

RBAC follows a hierarchical inheritance model. Each role inherits the permissions of the roles beneath it while adding scoped abilities aligned with least-privilege principles.

### 2.1 Built-in Roles

| Role | Inherits | Core Capabilities |
| --- | --- | --- |
| **Super Admin** | Admin | Platform configuration, tenant provisioning, policy bootstrap.
| **Admin** | Compliance Officer | Role management, policy authoring, integration secrets, manual overrides.
| **Compliance Officer** | Auditor | Framework CRUD, control mapping, evidence approval, access reviews.
| **Auditor** | Engineer | Read-only dashboards, report exports, audit log retrieval.
| **Engineer** | System Service | Evidence submission, probe configuration, remediation task updates.
| **System Service** | _None_ | Machine-to-machine automation (ingest controls, run scheduled jobs).

Role inheritance is expressed through Casbin `g` and `g2` relationships and synchronized automatically when seeding or updating policies.

### 2.2 Custom Roles

- Tenants can define custom roles that derive from any built-in role or another custom definition.
- Custom roles are stored in the `auth_roles` table with metadata about owner tenant, description, and review cadence.
- Administrators assign capabilities by mapping custom roles to granular policies (e.g., `data steward` with read/write access to AI datasets but no policy authoring rights).
- Casbin domains ensure that custom roles remain isolated per tenant while still benefiting from shared policy templates.

### 2.3 Separation-of-Duty Rules

To prevent conflicts of interest:

- Approval actions (e.g., evidence sign-off, framework publication) require a role different from the one that initiated the change. Casbin policies enforce this via `rule_effect = deny` conditions when subject and initiator match.
- Super Admins can impersonate users for troubleshooting, but impersonation tokens are logged and require post-event approval by a second Admin.
- Automated checks validate that no user simultaneously holds `Admin` and `Auditor` roles within the same tenant unless explicitly whitelisted for break-glass scenarios.

## 3. Permission Granularity

Permissions are defined using a combination of resource type, resource identifier, and action verb. Examples include:

- `framework:123:update` – modify metadata for framework `123`.
- `control:*:approve` – approve any control evidence submission.
- `governance-engine:run-evaluation` – trigger recalculation of risk scores.
- `user:tenant-456:assign-role` – manage user roles within tenant `456`.

Casbin policies support:

- **Row-level constraints** via domains (tenant, framework, control).
- **Action wildcards** for read-only vs. read-write bundles.
- **Conditional ABAC checks** (e.g., verifying that a user is assigned to the same control as the request) implemented through middleware context resolvers.

## 4. Enforcement Layers

### 4.1 Request Lifecycle

1. **Authentication Middleware** validates the JWT issued by the Auth Service and attaches `userId`, `roleIds`, and tenant metadata to `req.authContext`.
2. **Casbin Enforcement Middleware** (`requirePermission` helper) builds a subject string (`user` or `role`), domain (tenant/framework), object, and action from the request.
3. Casbin evaluates the tuple; on deny, it returns HTTP 403 with an audit log entry.
4. On allow, request handlers in the target module execute business logic, optionally making **secondary checks** (e.g., verifying framework status or workflow stage).

### 4.2 Module-Specific Enforcement

- **Auth Module (`server/src/modules/auth`)** – Houses Casbin adapter, role management APIs, and onboarding workflows. Controllers expose `/roles`, `/policies`, and `/access-reviews` endpoints that are themselves guarded by meta-policies to avoid privilege escalation.
- **Governance Engine (`server/src/modules/governance`)** – Uses helper utilities to ensure only authorized roles can evaluate controls, publish governance scores, or override outcomes. Sensitive operations such as forced remediation triggers require dual-authorization tokens generated by the Auth module.
- **Middleware Layer (`server/src/middleware`)** – Provides shared `requireRole`, `requirePermission`, and `enforceSoD` middleware functions reused across routers. Middleware caches policy decisions per request to minimize redundant Casbin calls.

## 5. Policy Storage and Caching

- **Database Tables:**
  - `auth_policies` – Canonical Casbin policy rules (p, g, g2 records).
  - `auth_roles` – Role metadata, inheritance trees, custom attributes.
  - `auth_policy_revisions` – Append-only log tracking who changed a policy, when, and why.
- **Adapter:** `server/src/modules/auth/casbin-adapter.js` implements the Casbin adapter interface using Prisma for transactional reads/writes.
- **Caching:**
  - Policy sets cached in Redis under `casbin:tenant:<id>` keys with a 5-minute TTL.
  - Local in-process cache (LRU) avoids repeated adapter calls during burst traffic.
- **Invalidation:**
  - Cache entries invalidated automatically on policy mutation events via a message bus (`policy.updated` topic) published from the Auth module.
  - Manual invalidation available through `/auth/policies/refresh` (Admin-only) to handle cross-region synchronization.

## 6. Access Reviews and Governance Workflows

- **Quarterly Access Reviews:** Admins trigger campaigns that snapshot current role assignments, send review tasks to Compliance Officers, and require sign-off before completion.
- **Event-Driven Reviews:** Detect anomalies (e.g., dormant high-privilege accounts, overlapping Admin/Auditor assignments) and open remediation tasks in the Task Service.
- **Certification Evidence:** Completed reviews export certified reports stored in the Evidence Repository for audit readiness.
- **Delegation:** Temporary delegations create time-bound policies with automatic expiry enforced by scheduled jobs.

## 7. Updating Casbin Policies

1. **Plan the Change:** Document desired permission updates, referencing the [User Management & Auth Service](../../02-technical-specifications/02-backend-architecture-and-apis.md#auth-service) guidance for API endpoints and controllers involved.
2. **Edit Policies:**
   - Use the Admin UI or call the `/auth/policies` API to add/update `p` (permission) or `g` (role inheritance) rules.
   - For bulk updates, utilize the RBAC sync CLI from the developer tooling repository to read YAML policy manifests and push them through the Casbin adapter.
3. **Validate:** Run the `/auth/policies/dry-run` endpoint to preview the effect on target subjects and ensure separation-of-duty constraints remain intact.
4. **Deploy:** Commit accompanying migration scripts if new roles or resources are introduced. Coordinate with DevOps to schedule cache invalidation.
5. **Audit:** Confirm that a new entry appears in `auth_policy_revisions` with justification details and reviewer sign-off.

## 8. Testing RBAC Scenarios

- **Unit Tests:**
  - Located in `server/src/modules/auth/__tests__/authorization.spec.js` to cover policy evaluation logic.
  - Mock the Casbin enforcer to simulate allow/deny paths.
- **Integration Tests:**
  - API-level tests under `server/src/routes/__tests__` exercise middleware with real policies loaded from the PostgreSQL test database.
  - Use fixtures to seed tenants, roles, and policies per scenario.
- **Manual Verification:**
  - Employ the shared Postman collection published with the API workspace for exploratory testing.
  - Run `npm run test:rbac` to execute the focused RBAC test suite before releases.
- **Governance Engine Alignment:**
  - Cross-validate that Governance Engine workflows respect RBAC outcomes by running the evaluation regression suite described in the [Governance Engine documentation](../../02-technical-specifications/02-backend-architecture-and-apis.md#governance-engine).

## 9. Related Documentation

- [User Management & Auth Service](../../02-technical-specifications/02-backend-architecture-and-apis.md#auth-service)
- [Governance Engine](../../02-technical-specifications/02-backend-architecture-and-apis.md#governance-engine)
- [Security Implementation – RBAC](../../02-technical-specifications/06-security-implementation.md#63-role-based-access-control-rbac)

---

[← Previous](../01-user-management-system/readme.md) | [Next →](../03-document-and-media-upload/readme.md)
