# AI / ML Engineer User Guide

## Role at a glance
You keep the AI/ML estate trustworthy by wiring instrumentation, surfacing technical evidence, and responding to failed checks so governance can stay automated. You spend time in Probe Management, Evidence, Governance, and Task workspaces—your job is to feed accurate data, confirm checks, and collaborate on remediation.

## Prep work
- **Credentials:** Ensure you can access the **Probes** workspace; the system expects either the `Engineer` role or a custom role that permits `probes:*` actions.
- **Connectivity:** Have your target environment endpoints (Databases, Model Registry, Storage) ready, along with any certificates required for integration. The Probe SDK enforces TLS and accepts hooks from `PROBE_REGISTRY_WEBHOOK_SECRET`.
- **Monitoring access:** Subscribe to relevant notification channels (Slack, email) for probe failures or task escalations via `/api/notifications/send`.

## Workflow 1: Register and maintain probes
![Probe registry screenshot](./images/ml-engineer-probe.png)
1. Open **Probes → Registry** and click **Register probe**.
2. Provide probe metadata (name, owner, framework coverage) and select evidence types (config snapshots, model metrics, logs).
3. Use the generated credentials to configure your on-prem service or CI job; the SDK expects the `ProbeClient` handshake from `server/src/modules/probes/sdk/ProbeClient.js`.
4. After deployment, visit **Deployments → Runs** to check rollout status, heartbeat history, and health metrics.
5. If a run fails, inspect the failure card for probe logs and rerun a job; the backend records failure events in `probe.failure` for observability.

## Workflow 2: Feed evidence and close checks
1. When a probe collects artifacts, the platform stores them via the Evidence Management APIs (`/api/evidence/upload`). Verify the metadata (control, check, retention) before finishing the upload.
2. Use **Governance → Review queue** to find hybrid or manual checks tied to your probe.
3. Add comments or attach supplemental evidence if the automated output is incomplete. Once satisfied, approve the check so scoring recalculation can consider your data.
4. If the check stays in `Review queue`, reopen it to fetch new evidence, or escalate the issue so the Compliance Officer can review the reasoning.

## Workflow 3: Respond to remediation tasks
1. Go to **Tasks → My workboard**. Engineer tasks typically include `Owner` or `Assignee` labels with `AI/ML Engineer`.
2. Update the task status (e.g., “In progress,” “Pending verification”) based on your remediation steps. Add the command snippet you ran, metrics captured, and dataset identifiers in the task comments so auditors can reconstruct the fix.
3. Attach artifacts (performance logs, retraining results) to the task; evidence links stay in sync with `task_evidence_links`.
4. When the task completes, mark it as `Ready for verification` and rely on the governance engine to rerun the check automatically.

## Best practices
- **Keep probes versioned:** The scheduler checks `PROBE_SDK_VERSION_MIN` before accepting telemetry, so update your deployments whenever we release a new SDK patch.
- **Use scheduled runs:** Cron expressions in **Probes → Schedules** let you sample models and configs automatically, reducing manual work.
- **Document everything:** Every remediation comment is logged; include what was measured, why the fix was necessary, and how future drift can be detected (align with `tasks:metrics` for SLA reporting).

## Troubleshooting
| Symptom | Action |
| --- | --- |
| Probe run dropped | Confirm your webhook secret matches `PROBE_REGISTRY_WEBHOOK_SECRET`; restart the scheduler job if the heartbeat stops. |
| Evidence upload rejected | Check retention settings and MIME types enforced by the upload controller—only whitelisted MIME types and size limits are allowed. |
| Task verification stalls | Ensure evidence attachments are linked to both the task and the underlying check so the governance engine sees the change. |

## References
- `Probe Management System` for the registry, deployment, scheduler, and SDK expectations.【F:docs/03-systems/07-probe-management-system/readme.md†L1-L176】
- `Evidence Management System` for uploading, metadata, and retention conventions that keep your artifacts searchable.【F:docs/03-systems/11-evidence-management-system/readme.md†L1-L168】
- `Task Management System` for remediation lifecycles, SLA metrics, and integrations that keep engineering accountable.【F:docs/03-systems/13-task-management-system/readme.md†L1-L200】
- `Governance Engine` for check execution, control aggregation, and the scoring pipeline triggered after your fixes.【F:docs/03-systems/12-governance-engine/readme.md†L1-L170】
