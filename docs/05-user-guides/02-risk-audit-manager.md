# Risk & Audit Manager User Guide

## Role at a glance
You keep governance honest. As a Risk & Audit Manager, you verify that controls behave as promised, remediation tasks close with traceable evidence, and auditors have the artefacts they need to prove compliance—even if control owners work across multiple teams.

## Onboarding checklist
- **Account requirements:** Sign in with an `Audit Manager` or dual `Compliance Officer` role that sees governance data (read-only or review rights). If access is missing, ask an Admin to grant the `audit` scope in `/admin/access-control`.
- **Understand policies:** Familiarize yourself with Casbin policies for auditing (`auth/policies` and `auth/policies/:id`). They dictate whether you can view exports, evidence, and reports.
- **Pick a favorite workspace:** Most auditors bounce between **Governance → Review queue**, **Tasks → In progress**, and **Reporting → Dashboards**—pin these tabs.

## Workflow 1: Investigate failed controls
![Review queue screenshot](./images/risk-audit-dashboard.png)
1. Open **Governance → Review queue** to surface manual or hybrid checks awaiting your validation.
2. Use the filter pill for `Critical` or `High` severity, then click the row to load the **Check Details** panel with evidence references and probe metadata.
3. Validate associated tasks and evidence attachments before marking the check as `Verified`. If you catch discrepancies, add notes and reopen the task owner’s action item.
4. Record your findings; the system logs your reviewer name, timestamp, and justification automatically in the audit ledger (`report_audit_log`), so downstream auditors can trace your decision.

## Workflow 2: Validate remediation tasks
1. Navigate to **Tasks → Incomplete** (or `/tasks/inbox`). The list is ordered by SLA breach risk.
2. For each task:
   - Confirm the correct owner, due date, and linked controls.
   - Open the **Evidence** column to review attachments aligned with the remediation.
   - If the evidence is insufficient, use **Notify owner** (via the notification template) and add a comment.
3. When enough evidence exists, move the task to “Pending verification,” noting the compliance rationale in the comment form. This action triggers re-evaluation of associated controls by the governance engine.
4. If a task escalates (SLA fails), the escalation service notifies you via Slack/ServiceNow and appends events to the audit log for future retrospectives.【F:docs/03-systems/13-task-management-system/readme.md†L1-L200】

## Workflow 3: Run audits & share proof
1. Build a report by selecting **Reporting → Dashboards**. Focus on:
   - Framework scores that tie to your audit scope.
   - Evidence coverage before/after remediation.
   - SLA compliance from the **Tasks ⇒ Metrics** section.
2. Use the export builder to generate an attestation pack (PDF or archive). Attach supporting evidence links and evidence retention summaries so auditors know what was reviewed.
3. Link the export to a Jira/ServiceNow issue via `tasks:integrations` if the audit needs formal tracking (the platform syncs status automatically).

> **Pro tip:** Schedule recurring exports if you run quarterly audits; the reporting worker writes artifacts to MinIO and logs them in `report_exports`, making them easy to re-run for future cycles.

## Collaboration points
- **Evidence couriers:** Work with Compliance Officers to align control approvals before you lock audit findings.
- **Notifications:** Use the `/api/notifications/send` endpoint to broadcast audit windows or remediate deadlines; the consent-aware dispatcher prevents spam while keeping stakeholders informed.【F:docs/03-systems/04-notification-system/readme.md†L1-L152】
- **Audit logs:** For forensic work, query `/api/audit/logs` to trace who edited roles, frameworks, or tasks; the logs respect filters for action, actor, and date range.【F:docs/03-systems/06-audit-logging-and-monitoring/readme.md†L1-L200】

## Troubleshooting
| Symptom | Remedy |
| --- | --- |
| Evidence still pending approval | Check for chained tasks or hybrid checks waiting in the “Review queue”; they block publication until you approve. |
| Task owner disputes your rejection | Attach the audit log entry, tag experts (e.g., Engineer), and reopen the review so a second pair of eyes can reassess. |
| Export missing evidence | Regenerate using **Reporting → Exports**; confirm you included the correct control filters and evidence tags before re-exporting. |

## References
- `Evidence Management` for metadata, pre-signed uploads, and retention policies you inspect.【F:docs/03-systems/11-evidence-management-system/readme.md†L1-L168】
- `Task Management` for remediation lifecycles, escalations, and integrations with external ticketing tools.【F:docs/03-systems/13-task-management-system/readme.md†L1-L200】
- `Reporting & Dashboard` system for export templates, workers, and RBAC enforcement around dashboards.【F:docs/03-systems/14-dashboard-and-reporting-system/readme.md†L1-L200】
- `Audit Logging & Monitoring` for tracing edits, role changes, and system events that back your reviews.【F:docs/03-systems/06-audit-logging-and-monitoring/readme.md†L1-L200】
