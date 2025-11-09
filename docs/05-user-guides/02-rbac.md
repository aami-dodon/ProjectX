# RBAC Administration Guide

The Access Control console gives administrators and compliance officers a single place to review roles, audit policy relationships, and launch recertification workflows. This guide explains how to reach the console, interpret what you see, and perform the day‑to‑day actions supported by the current release.

> **Who can use it?**  
> You must sign in with an account that carries the `admin` or `compliance officer` role. Everyone else is redirected to the “Forbidden” page.

## 1. Opening the Access Control console

1. Sign in to the Project X web app.
2. Open the sidebar (top-left lettermark) and expand **Administration**.  
   The **Access Control** item appears beneath User Management when your account has the required role.
3. Click **Access Control** to load the RBAC overview. Bookmark `/admin/access-control` if you plan to visit frequently.

The page loads two primary regions:

- **Roles table** with domain-level metrics on the left
- **Access Reviews** card on the right for quick recertification launches

## 2. Working with roles

### 2.1 Role overview

The roles table lists every active role seeded from Casbin and Prisma (`global` domain by default). Each row shows:

- Role name and description
- Domain (tenant scope)
- Number of active assignments

Use the summary chips beneath the table to see total, active, and archived counts at a glance.

> **Tip:** Newly created roles appear automatically once the backend API finishes processing. If you don’t see a role, refresh with the ↻ icon or the browser reload.

### 2.2 Viewing role details

Click any role row to open the dedicated details page (`/admin/access-control/roles/:roleId`). The detail view contains:

- **Role Relationships** — hierarchy information (parent/child roles) and domain
- **Assignments table** — who currently holds the role, with timestamps
- **Permission Matrix** — every Casbin `p` rule scoped to the role’s subject/domain

Use this page to confirm whether a user already has the access you plan to grant or to inspect inheritance before editing policies.

## 3. Launching access reviews

The **Access Reviews** card queues a Casbin-aware recertification workflow for the selected domain.

1. Optionally change the domain (defaults to `global`).
2. Click **Launch Access Review**.
3. Wait for the “scheduled” confirmation banner.

Behind the scenes the server publishes an `access-review.opened` event. Compliance workflows and notification rules react automatically—no additional steps required.

## 4. Managing policies

Navigate to **Access Control → Policies** (`/admin/access-control/policies`) to create or archive Casbin policies.

### 4.1 Creating a policy

1. Fill in the form in the **Create Policy** card:
   - **Subject** — role or user (e.g. `admin`, `service-account:etl`)
   - **Resource** — permission object (e.g. `rbac:roles`)
   - **Action** — verb or regex (e.g. `read`, `control:*:approve`)
   - Optional description for future auditors
2. Click **Save policy**. Successful saves immediately refresh the table.

Policies are scoped to the domain shown at the top of the page (default `global`). Adjust the domain via the query string or environment configuration if you need tenant-specific rules.

### 4.2 Archiving a policy

1. Locate the row in the policy table.
2. Click **Archive**.  
   The rule is soft-deleted (available for audit history) and removed from the active enforcer cache.

> **Warning:** Archiving a policy takes effect immediately. Ensure no workflows rely on the rule before removing it.

## 5. Programmatic actions

The UI covers the most common admin workflows. When you need to automate changes or create bespoke dashboards, use the backing REST APIs exposed under `/api/auth`:

| Endpoint | Method(s) | Purpose |
| --- | --- | --- |
| `/api/auth/roles` | `GET`, `POST` | List or create roles. |
| `/api/auth/roles/:id` | `GET`, `PATCH`, `DELETE` | Inspect, update, or archive a specific role. |
| `/api/auth/policies` | `GET`, `POST` | List policies or bulk add new ones. |
| `/api/auth/policies/:id` | `PATCH`, `DELETE` | Update or archive individual policies. |
| `/api/auth/access-reviews` | `POST` | Queue a domain-specific access review. |
| `/api/auth/permissions/check` | `POST` | Evaluate a subject/action/domain combination without executing the request. |

All endpoints require a valid access token. Tokens issued to admins or compliance officers inherit the Casbin permissions seeded through the UI.

## 6. Probe Management permissions

Probe Management APIs follow the same RBAC pipeline. The table below summarises the new permissions surfaced by `/api/probes`:

| Resource | Action(s) | Purpose | Default roles |
| --- | --- | --- | --- |
| `probes:registry` | `read`, `create` | List probes, review metadata, and register new collectors. | Admin, Compliance Officer (read), Engineer (read/create) |
| `probes:deployments` | `read`, `create` | Inspect rollout history or initiate a new deployment. | Admin (read/create), Engineer (read/create), Compliance Officer (read) |
| `probes:schedules` | `read`, `create` | View cron/event definitions or add new schedules bound to controls. | Admin (read/create), Compliance Officer (read/create) |
| `probes:runs` | `execute` | Fire an ad-hoc run tied to an incident or remediation ticket. | Admin, Compliance Officer |
| `probes:metrics` | `read` | Load heartbeat/failure telemetry for dashboards and audits. | Admin, Compliance Officer, Engineer |

Each permission maps 1:1 with the corresponding router middleware in `server/src/modules/probes/api/probes.router.js`, so you can reason about access directly from the policy grid. Extend the Casbin policies if your organisation needs finer-grained tenant controls.

## 7. Check Management permissions

The Check Management system introduces three new permission resources aligned with the `/api/governance` routes:

| Resource | Action(s) | Purpose | Default roles |
| --- | --- | --- | --- |
| `governance:checks` | `read`, `create`, `update`, `activate`, `execute` | Manage the definition catalogue, promote checks through lifecycle states, and trigger ad-hoc executions. | Admin (all), Compliance Officer (read/update/activate/execute) |
| `governance:results` | `read`, `publish` | Review execution history, drill into evidence, and promote validated findings to published dashboards. | Admin, Compliance Officer |
| `governance:review-queue` | `read`, `complete` | Manage manual/hybrid review tasks, capture approvals, and close the governance queue. | Admin, Compliance Officer |
| `governance:overview` | `read` | Load the governance posture dashboard, scorecards, framework coverage, and evidence matrices. | Admin, Compliance Officer |
| `governance:scoring` | `recalculate` | Force control score recomputation and refresh cached aggregates used by dashboards. | Admin (recalculate), Compliance Officer (recalculate) |

Permissions are enforced server-side via `governance.router.js`, and the frontend reuses `<RequirePermission>` so the catalog, review queue, and result explorer hide automatically when the user lacks access. Update the tables above whenever you add another action (e.g., `retire`) so admins can mirror the change in Casbin.

## 8. Framework Mapping permissions

The new Framework Mapping system exposes four permission resources aligned with `/api/frameworks`:

| Resource | Action(s) | Purpose | Default roles |
| --- | --- | --- | --- |
| `frameworks:catalog` | `read`, `create`, `update` | List frameworks, onboard new catalogs, and edit metadata such as jurisdictions, publishers, and lifecycle flags. | Admin (all), Compliance Officer (read/update) |
| `frameworks:controls` | `read`, `create` | Review or add framework-specific controls, including risk metadata and evidence requirements. | Admin, Compliance Officer |
| `frameworks:mappings` | `read`, `create` | Explore the mapping matrix, inspect coverage metrics, and align controls across standards. | Admin, Compliance Officer |
| `frameworks:versions` | `read`, `create` | Review historical versions, diff releases, and publish new semantic versions with changelog notes. | Admin (all), Compliance Officer (read) |

Add or update Casbin policies (`p` rules) when you need more granular control—for example, granting `frameworks:catalog:read` to auditor roles without create/update access.

## 9. Evidence Management permissions

The Evidence Management system introduces three new resources aligned with `/api/evidence`:

| Resource | Action(s) | Purpose | Default roles |
| --- | --- | --- | --- |
| `evidence:records` | `read`, `create`, `update` | List/search artifacts, request uploads, and edit metadata/retention settings. | Admin (all actions), Compliance Officer (read/create/update) |
| `evidence:links` | `update` | Attach or detach controls, checks, and task references from evidence records. | Admin, Compliance Officer |
| `evidence:retention` | `read` | Load retention summaries, policy coverage, and upcoming purge schedules. | Admin, Compliance Officer |

Update the Casbin policy file whenever you add new evidence actions so the router middleware stays in sync with the UI affordances documented in `docs/03-systems/11-evidence-management-system/readme.md`.

## 10. Troubleshooting

| Symptom | Recommended action |
| --- | --- |
| “You do not have permission to access this resource” warning | Confirm your role includes `admin` or `compliance officer`. If your role was changed recently, sign out and back in to refresh tokens. |
| Missing policies after save | Check the domain filter at the top of the Policy Editor. Policies are scoped per domain. |
| Role counts look stale | Click the “Launch Access Review” button or refresh the page to invalidate the local cache and trigger a fresh API fetch. |
| Access review does nothing | Inspect the server logs for `policy.updated` or `access-review.opened` events; ensure background workers are running in the target environment. |

Need more help? Contact the platform operations team or review the architecture notes in `docs/03-systems/02-rbac-system/readme.md` for deeper technical context.
