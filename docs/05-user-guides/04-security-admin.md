# IT / Security Administrator User Guide

## Role at a glance
You protect the platform’s integrity: integrating security probes, managing access, and keeping the infrastructure observable. Your focus is on hardened onboarding, policy enforcement, and incident readiness with minimal friction for the rest of the organization.

## Setup steps
- **Access domain:** Confirm you have `Admin` or `Security Administrator` privileges so you can configure tenants, view RBAC policies, and manage probes.
- **Environment hooks:** Keep the `.env` values (`DATABASE_URL`, `MINIO_ENDPOINT`, `PROBE_*` secrets) in sync between the repo and deployed environments; the same `.env` feeds both server + client servers.
- **Notification channels:** Subscribe to critical alerts (probe failures, SLA breaches, audit log anomalies) via the Notification system so you never miss a sensitive event.【F:docs/03-systems/04-notification-system/readme.md†L1-L152】

## Workflow 1: Harden infrastructure integrations
![Security admin console screenshot](./images/security-admin-console.png)
1. Use **Probes → Registry** to register infrastructure probes (config drifts, vulnerability scanners, model drift monitors). Each probe ties to frameworks and outputs evidence streams consumed by Governance.
2. Maintain schedules in **Probes → Schedules**; inject metadata such as `priority: high` when monitoring critical controls. Scoped schedules avoid noisy runs sliding into off-hours.
3. Monitor **Probes → Deployments** and **Runs** for heartbeat outages. If a deployment fails, the workflow publishes failure events and escalates to the Notification system so your on-call responders can react immediately.
4. When integrating new services, document the environment variables and secret rotation processes within the Admin workspace to keep onboarding reproducible.【F:docs/03-systems/05-admin-and-configuration-system/readme.md†L1-L200】

## Workflow 2: Manage access & policies
1. Open **Administration → Access Control** to review roles, assignments, and Casbin policies (subject/resource/action).
2. When onboarding a new team, use **Roles → Create** to configure `Engineer`, `Compliance Officer`, or custom roles, and seed the necessary Casbin policies. Archive unused policies to keep the enforcer lean.【F:docs/05-user-guides/02-rbac.md†L1-L180】
3. For high-risk actions (e.g., `tasks:integrations` syncs), verify that segregation-of-duty rules remain intact before granting access.
4. Audit token usage under **Service Tokens** to ensure long-lived credentials follow expiration policies and log their last `gmt`. Rotate tokens via workflows under `/admin` when needed.

## Workflow 3: Monitor health & respond to incidents
1. Visit **System Health → Overview** to validate service uptime, background workers, and queue depths (Governance scoring jobs, Probe scheduler, Task automation).
2. For alerts baked into the Notification system (e.g., probe failure, audit log anomaly), follow the documented runbook: check provider status, reboot the affected worker, and record actions in the incident log.
3. Use **Audit Logs** to trace suspicious config changes; filter by action, actor, date, or module to tie events back to humans. The log viewer exposes who edited roles, frameworks, or tasks.
4. When incident retrospectives finish, sync the findings with the Reporting dashboard to validate that mitigations restored compliance (%) and the Governance engine recalculated scores.

## Key security ops tips
- **Automate tenant bootstrap:** Run the workflows under `admin/workflows` (`verify-tenant`, `bootstrap-environment`) via the Admin API so tenants receive consistent guardrails (roles, probes, notifications).【F:docs/03-systems/05-admin-and-configuration-system/readme.md†L1-L200】
- **Log everything:** Use the Audit Logging system to capture config changes; the data flows into `report_audit_log` and the Grafana dashboards referenced in the Auditing runbook.【F:docs/03-systems/06-audit-logging-and-monitoring/readme.md†L1-L200】
- **Rotate secrets:** Keep the Notification and Probe secrets in a vault; the same secrets feed the SDK and REST endpoints, so any rotation requires simultaneous updates to `PROBE_REGISTRY_WEBHOOK_SECRET` and mailer/webhook configs.

## Troubleshooting
| Symptom | Resolution |
| --- | --- |
| Probe fails to register | Confirm the `PROBE_SDK_VERSION_MIN` from `.env` matches the SDK shipping with the probe; mismatch causes automatic rejections. |
| Access Control changes not taking effect | Archive then recreate the role to force the enforcer refresh; cached policies may take up to a minute to reload. |
| Alert floods during incident | Temporarily silence digests in `Notification → Delivery policies`, then re-enable them once the queue drains. |

## References
- `Admin & Configuration System` for tenant bootstrapping, workflows, and integration governance.【F:docs/03-systems/05-admin-and-configuration-system/readme.md†L1-L200】
- `Probe Management System` for registry, scheduler, SDK expectations, and failure handling.【F:docs/03-systems/07-probe-management-system/readme.md†L1-L176】
- `Access Control` and `Audit Logging` docs for policy rules, segregation-of-duty, and change traceability.【F:docs/05-user-guides/02-rbac.md†L1-L180】【F:docs/03-systems/06-audit-logging-and-monitoring/readme.md†L1-L200】
