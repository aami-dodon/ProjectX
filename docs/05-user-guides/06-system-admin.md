# System Administrator User Guide

## Role at a glance
System Administrators keep Project X healthy at the platform layer: provisioning tenants, rotating secrets, patching workers, and ensuring observability remains intact so teams can focus on governance outcomes.

## Setup checklist
- **Admin console access:** You need Admin privileges via `/admin` to manage tenants, integrations, and feature toggles. Request the `Admin` role if you cannot open those routes.
- **Environment readiness:** Keep `.env` values synced between your local repo and staging/production: server, client, Prisma, MinIO, SMTP, probe, and notification settings all rely on the same file.
- **Runbooks:** Familiarize yourself with the operational playbooks inside `docs/03-systems` (admin, probes, tasks, evidence) so you understand how each system reacts to config changes.

## Workflow 1: Provision and configure tenants
![System admin configuration view](./images/system-admin-config.png)
1. Go to **Administration → Tenants** to create or update organizations. Each tenant triggers `admin.workflows.verify-tenant` to set up RBAC seeds, default frameworks, and integrations via `bootstrap-environment`.
2. Validate that the tenant’s feature flags and integration endpoints point to their isolated Postgres/MinIO hosts before toggling any templates.
3. After provisioning, verify that probe hooks, email templates, and SSH keys (if applicable) are stored in the tenant’s configuration records.
4. Document any special onboarding steps in the tenant notes so future administrators can reproduce the environment state.

## Workflow 2: Manage integrations & secrets
1. Use the Admin console to rotate integration secrets (MinIO credentials, SMTP keys, probe webhook secrets). The rotation workflow updates both the configuration repository and posts an event for downstream consumers (notifications, probes, task integrations).
2. Confirm that the new secrets propagate to the runtime by redeploying workers or restarting the Node.js process; misaligned secrets manifest as probe/authentication failures.
3. When adding new integrations (Jira, ServiceNow, Slack), configure them through `/admin/integrations` so the respective modules can queue events using the `notifications` and `tasks` adapters with the correct OAuth scopes.
4. Track all manual rotations and integration changes in the audit log for compliance purposes.

## Workflow 3: Maintain and observe platform health
1. Monitor `server/logs` and `client/logs` for worker errors; the log directories stay out of version control but are disclosed to you via the runtime environment.
2. Regularly scrape **Health → Overview** to confirm the Governance engine, Task scheduler, Probe worker, and Notification dispatcher are all green. Track queue depth for long-running exports or tasks.
3. For incidents, follow the escalation playbook: verify the event in the Notification system, then trigger the appropriate remediation (consumer restart, data restore, config revert). Document the RCA in the audit log and update the reporting dashboards.
4. Use `docker compose up --build` in staging when replicating production behavior; ensure your `.env` mirrors the production values before starting containers.

## Tips for sustainable operations
- **Changelog discipline:** Update `changelog.md` whenever you make a user-visible change (example: new guides added). Use IST timestamps and place entries near the top per the repository’s standard.
- **RBAC hygiene:** Run `/api/auth/roles` to list Casbin roles after major config updates so you can confirm hierarchical inheritance (Admin → Compliance → Engineer). Archive stale roles to reduce noise.
- **Documentation parity:** When you change workflows or UI flows, mirror the adjustments in `docs/04-developer-instructions`. Consistency keeps contributors aligned.

## Troubleshooting
| Problem | Resolution |
| --- | --- |
| Tenant onboarding fails | Inspect the `admin.verify-tenant` workflow logs for missing environment variables or RBAC seeding issues; rerun the workflow once the dependency is fixed. |
| Secret rotation breaks probes | Ensure both the Probe SDK (`PROBE_SDK_VERSION_MIN`) and the registry secret (`PROBE_REGISTRY_WEBHOOK_SECRET`) match the new configuration before a worker restart. |
| Notifications don’t fire after update | Confirm the notification templates (email/slack) still exist in the tenant’s registry and that the `notifications` worker resumed after deployment. |

## References
- `Admin & Configuration System` for tenant lifecycle, configuration service, and integration governance.【F:docs/03-systems/05-admin-and-configuration-system/readme.md†L1-L200】
- `Probe Management System` for the SDK, scheduler, and deployment pipelines triggered by tenant actions.【F:docs/03-systems/07-probe-management-system/readme.md†L1-L176】
- `Access Control`, `Audit Logging`, and `Notification` docs for policy enforcement and incident tracing.【F:docs/05-user-guides/02-rbac.md†L1-L180】【F:docs/03-systems/06-audit-logging-and-monitoring/readme.md†L1-L200】【F:docs/03-systems/04-notification-system/readme.md†L1-L152】
