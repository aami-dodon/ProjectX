# Product / Business Owner User Guide

## Role at a glance
You sign off on AI/product releases by weighing compliance posture, evidence sufficiency, and remediation velocity. The platform gives you a single pane to monitor runtime risk, confirm controls align with business goals, and deliver executive-ready reports.

## Quick-start checklist
- **Access rights:** A Product/Business Owner typically has read-only access to dashboards and tasks plus selective write access to evidence approvals when you vouch for releases.
- **Know the cadence:** Track monthly/quarterly milestones via the **Reporting → Dashboards** view so you can correlate product milestones with compliance progress.
- **Stay in the loop:** Approve relevant tasks in the **Tasks → Approvals** list; the platform notifies you when completion is expected before a release gate.

## Workflow 1: Monitor release readiness
![Product owner dashboard](./images/product-owner-dashboard.png)
1. In **Reporting → Dashboards**, review the overall compliance score (percentage) along with framework-specific progress bars. Use the timeframe selector to compare the current release window to prior sprints.
2. Examine the **Control & Evidence matrix** under Governance Overview to ensure critical controls have supporting artifacts and no high-severity tasks remain open.
3. When scoring dips, inspect the **Tasks → Metrics** widget to understand which teams missed SLAs; focus your interventions on those squads.
4. Use the **Export** button to generate a status pack for the release committee. Attach it to your internal release ticket so everyone can see the same view.

## Workflow 2: Approve evidence & remediation
1. Open **Tasks → Approvals**. This view surfaces tasks that require your sign-off before release (e.g., manual checks, documentation reviews).
2. Review attachments and comments from engineers; add your own context to confirm the mitigation meets business requirements.
3. If the artifact is insufficient, ask the owner for clarification via task comments or ping them with a notification template.
4. Once satisfied, mark the task as `Approved for release` (or equivalent status) so the automation stack can move the control to `Compliant`.

## Workflow 3: Share compliance stories
1. Use **Reporting → Exports** to bake a governance narrative for stakeholders. Select frameworks, evidence filters, and control groups tied to the release you’re evaluating.
2. Include evidence metadata (uploader, retention policy, control references) so auditors/leadership can trace everything you reviewed.
3. Deliver the report through your regular channels (email, Slack, internal docs) along with a brief summary of outstanding action items.
4. Drive the release retrospective with the Task SLA metrics—celebrate actions that closed early and highlight controls that still need attention.

## Best practices
- **Standards alignment:** Keep your releases tied to frameworks (ISO, NIST, internal) so the platform can auto-map controls and evidence. Updates to frameworks update the dashboards automatically.
- **Use the evidence repository:** If you ever need clarification, click through to **Evidence → Library** to trace artifacts, uploader info, and retention enforcement.
- **Communicate with auditors:** Share exported packs so Risk & Audit Managers can cross-check your approvals in their guides.

## Troubleshooting
| Symptom | Suggested fix |
| --- | --- |
| Release scoreboard lags | Force a governance recalculation or refresh the dashboard; cached metrics update once evidence or tasks change. |
| Missing evidence docs in exports | Re-run the export with broader tag filters (control tags, check IDs) so attachments surface. |
| Tasks keep re-opening | Ensure the remediation artifact is linked to the correct control/check; reopen the task for the engineer to reconnect it. |

## References
- `Dashboard & Reporting` for export templates, worker pipelines, and attestation pack generation.【F:docs/03-systems/14-dashboard-and-reporting-system/readme.md†L1-L200】
- `Governance Engine` and `Evidence Management` for control posture, evidence linkage, and scoring behavior.【F:docs/03-systems/12-governance-engine/readme.md†L1-L170】【F:docs/03-systems/11-evidence-management-system/readme.md†L1-L168】
- `Task Management` for remediation lifecycles and SLA automation tied to releases.【F:docs/03-systems/13-task-management-system/readme.md†L1-L200】
