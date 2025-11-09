# Compliance Officer User Guide

## Role at a glance
The Compliance Officer shepherds the governance narrative—configuring frameworks, tracking control health, approving evidence, and keeping remediation on schedule so leadership can prove continuous compliance. You work in the Governance, Evidence, Task, and Reporting workspaces every day, acting as the linchpin between automation, auditors, and leadership sign‑off.

## Before you begin
- **Verify your seat:** Sign in with an account that carries the `Compliance Officer` role (Casbin policy scope `compliance:*`). Requests without that scope hit the “Forbidden” banner (see `/admin/access-control`).【F:docs/05-user-guides/02-rbac.md†L1-L180】
- **Choose your domain:** Most work stays in the `global` domain, but tenant guests may configure domain filters at the top of Governance and Evidence while running scoped queries.
- **Bookmark the dashboard:** Navigate to **Governance → Overview** via the sidebar so you can open it directly (`/governance/overview`) when monitoring posture.

## Key dashboards & navigation
![Governance overview dashboard](./images/compliance-overview.png)

When the Governance Overview screen loads, it shows:
1. **Top scorecard ribbon:** live compliance %, control grade breakdown, backlog counts, and evidence freshness.
2. **Trend chart:** run history for the selected framework(s); hover for tooltips that include probe IDs and check verdicts.
3. **Evidence & remediation matrix:** control status (Pass/Fail/Partial) against evidence and open tasks.

Use the **Recalculate** button (bottom right) to trigger `governance:scoring` recalculation if new evidence or completed tasks do not show up automatically.【F:docs/05-user-guides/02-rbac.md†L112-L130】

## Primary workflows

### 1. Monitor overall posture
1. Open **Governance → Overview** and filter by business unit, framework (e.g., `NIST 800-53`), or control owner.
2. Scan the scorecard ribbon for compliance % drift and look for **control tier flags** (critical/high).
3. Expand the remediation matrix to inspect failing checks; click the control row to open the Control Detail page and review assigned tasks and evidence links.
4. Use **Trend → Scroll** to confirm recent probe runs/errors (CPU, run duration, failure reason).
5. If the data is stale, click **Recalculate** or refresh the page; the underlying API enforces idempotent scoring (`/api/governance/overview`).

> **Tip:** Bookmark filters that focus on frameworks your audit team owns, and export the view via the reporting exports modal when you need a snapshot for leadership.【F:docs/03-systems/14-dashboard-and-reporting-system/readme.md†L1-L200】

### 2. Manage frameworks & controls
1. Navigate to **Governance → Frameworks** (`/governance/frameworks`) to review existing catalogs and import new standards (e.g., ISO 27001, CSA STAR).
2. Use the **Create mapping** button to align controls with requirements; attach references, evidence sources, and risk metadata.
3. When you need to update control definitions, edit the control row and add contextual notes before saving; the system records changes for audit trails.
4. Use the **Lifecycle ribbon** to retire or archive frameworks safely; archived frameworks remain queryable via the search bar should you need to re-activate them.

> **Example:** When a new regulation arrives, add it as a framework, map existing controls, and flag impacted controls with a “Needs review” tag. This feeds the remediation queue automatically.

### 3. Approve evidence & remediation
1. Open **Evidence → Library** (`/evidence/library`). Filter by control, check, or probe to surface documents awaiting validation.
2. Click any evidence record to review metadata, retention dates, attachments, and linked checks/tasks. Add notes or change retention if policies change.
3. Visit **Evidence → Review queue** to approve manual or hybrid check submissions before they publish. Use the “Approve & link task” action to attach the artifact to the relevant control.
4. Switch to **Tasks → Incomplete** to see remediation tickets tied to the evidence. For each task, add verification notes, upload additional artifacts, and move it toward “Pending verification.”
5. When tasks complete, confirm the evidence link(s) stay intact so the Governance engine can re-run scoring automatically.

> **Pro tip:** Use notifications (e.g., `/api/notifications/send`) to remind engineers of outstanding evidence requests before escalation—channel templates already include compliance phrasing for you.【F:docs/03-systems/04-notification-system/readme.md†L1-L152】

## Collaboration & reporting
- **Automate audits:** Queue exports from **Reporting → Exports** to bundle compliance scorecards, evidence lists, and remediation logs. Choose CSV, PDF, or archive formats; the worker writes artifacts to MinIO and logs details in `report_exports`.
- **Keep auditors informed:** Share `Control → Review queue` summaries with Risk & Audit Managers (see next section) so they can cross-check findings in their guides.
- **Escalate via tasks:** When manual checks fail, tag tasks with `escalation.high` so the remediation service notifies your leadership channel automatically and updates SLA metrics (`tasks:metrics`).【F:docs/03-systems/13-task-management-system/readme.md†L1-L200】

## Troubleshooting quick wins
| Symptom | What to do |
| --- | --- |
| Controls remain “Fail” after evidence approval | Confirm the evidence link is tagged to the right check and that the scoring worker has run (`/api/governance/recalculate`). |
| Framework import fails | Ensure the uploaded schema matches the expected catalog JSON; retry after verifying metadata and dependencies. |
| Evidence record disappears | Check retention rules in **Evidence → Retention**; items purge automatically when flag lifetime lapses. |

## References
- `Governance Engine` implementation for scoring, controls, and remediation orchestration.【F:docs/03-systems/12-governance-engine/readme.md†L1-L170】
- `Control Management` and `Check Management` systems for control lifecycle context.【F:docs/03-systems/09-control-management-system/readme.md†L1-L180】【F:docs/03-systems/08-check-management-system/readme.md†L1-L170】
- `Evidence Management` for upload, metadata, and retention flows.【F:docs/03-systems/11-evidence-management-system/readme.md†L1-L168】
- `Reporting & Exports` for dashboards and attestation packages.【F:docs/03-systems/14-dashboard-and-reporting-system/readme.md†L1-L200】
