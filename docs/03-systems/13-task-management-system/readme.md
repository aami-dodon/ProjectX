# Task Management System <!-- omit in toc -->

## Location: /server/src/modules/tasks

>### TL;DR
> The task management system converts governance signals into actionable remediation work.
> It orchestrates task lifecycle states, assignments, escalations, and evidence capture across internal and external tooling.
> Completed tasks automatically trigger control re-validation to maintain continuous compliance.

---

- [Backend Specification](#backend-specification)
  - [Location & Directory Layout](#backend-location--directory-layout)
  - [Task Lifecycle & Workflows](#task-lifecycle--workflows)
  - [Evidence & External Integrations](#evidence--external-integrations)
- [Frontend Specification](#frontend-specification)
  - [Location & Directory Layout](#frontend-location--directory-layout)
  - [Reusable Components & UI Flows](#reusable-components--ui-flows)
- [Schema Specification](#schema-specification)
- [Operational Playbooks & References](#operational-playbooks--references)

---

## Backend Specification

### Backend Location & Directory Layout
Task orchestration resides in `server/src/modules/tasks`, providing APIs, lifecycle engines, and integration adapters for remediation tracking.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L95-L159】

```
server/src/modules/tasks/
├── controllers/
│   ├── tasks.controller.ts
│   ├── assignments.controller.ts
│   └── integrations.controller.ts
├── services/
│   ├── task.service.ts
│   ├── escalation.service.ts
│   └── evidence.service.ts
├── repositories/
│   └── task.repository.ts
├── policies/
│   └── tasks.policy.ts
├── integrations/
│   ├── jira.adapter.ts
│   └── servicenow.adapter.ts
└── events/
    ├── task.created.ts
    └── task.completed.ts
```

### Task Lifecycle & Workflows
- **Creation Triggers:** Failed checks, audit findings, manual requests, and external incidents can open tasks with references to controls, checks, frameworks, and evidence. Notifications ensure owners are informed immediately.【F:docs/03-systems/04-notification-system/readme.md†L7-L200】
- **Status States:** Draft → Open → In Progress → Awaiting Evidence → Pending Verification → Resolved → Closed. Transitions enforce business rules and require justification for reopens.
- **Assignments:** Tasks can be assigned to teams or individuals; delegation supports temporary ownership with expiry. Escalation policies reroute tasks if SLAs breach (e.g., 24h for critical, 72h for medium). PagerDuty/Slack alerts accompany escalations.
- **Control Feedback:** Completion triggers governance re-validation, re-running relevant checks and updating control/control scores to confirm remediation effectiveness.【F:docs/03-systems/12-governance-engine/readme.md†L7-L205】

### Evidence & External Integrations
- **Evidence Attachments:** Supports uploads, URL references, and probe outputs. Evidence is validated via the Evidence Management system before marking tasks complete.【F:docs/03-systems/11-evidence-management-system/readme.md†L7-L170】
- **External Trackers:** Jira/ServiceNow adapters synchronize status, comments, and assignments with external teams. Field mapping ensures bidirectional updates respect workflow states and custom fields.【F:docs/03-systems/04-notification-system/readme.md†L7-L170】
- **Audit Logging:** Every change writes to audit events with actor, timestamp, and diff metadata, ensuring auditors can trace remediation history.【F:docs/03-systems/06-audit-logging-and-monitoring/readme.md†L7-L139】

## Frontend Specification

### Frontend Location & Directory Layout
Remediation UIs exist under `client/src/features/tasks`, supporting task intake, progress tracking, and evidence reviews.【F:docs/02-technical-specifications/03-frontend-architecture.md†L96-L160】

```
client/src/features/tasks/
├── pages/
│   ├── TaskInboxPage.tsx
│   ├── TaskDetailPage.tsx
│   ├── TaskBoardPage.tsx
│   └── SlaDashboardPage.tsx
├── components/
│   ├── TaskForm.tsx
│   ├── TaskTimeline.tsx
│   ├── EvidenceAttachmentList.tsx
│   └── EscalationBanner.tsx
├── hooks/
│   ├── useTaskInbox.ts
│   ├── useTaskDetail.ts
│   └── useSlaMetrics.ts
└── api/
    └── tasksClient.ts

client/src/components/governance/
└── TaskControlPanel.tsx
```

### Reusable Components & UI Flows
- **Task Intake:** `TaskForm` captures trigger context, control/check references, and SLA classifications. Automation can pre-populate details when tasks originate from failed checks.
- **Work Tracking:** `TaskBoardPage` presents Kanban views of lifecycle states; `TaskTimeline` records comments, evidence links, and escalations.
- **Evidence Review:** `EvidenceAttachmentList` integrates with Evidence Management to verify supporting artifacts before closure.
- **SLA Monitoring:** `SlaDashboardPage` and `EscalationBanner` highlight aging tasks and upcoming deadlines, prompting reassignment or escalation actions.

## Schema Specification
- **`tasks`:** Contains task id, title, description, priority, status, sla_due_at, control_id, check_id, framework_id, created_by, assigned_to, delegation metadata, escalation level, external_issue_key, created_at/updated_at/resolved_at.
- **`task_events`:** Audit log of status changes, comments, escalations, evidence attachments, and external syncs.
- **`task_assignments`:** Tracks ownership history, delegations, and team mappings.
- **`task_evidence_links`:** References evidence records, attachment types, verification status, and reviewer.
- **`task_sla_metrics`:** Aggregated metrics for reporting (time_open, time_to_acknowledge, time_to_close) supporting dashboards.

## Operational Playbooks & References

### Playbooks
- **Escalation Management:** Monitor SLA dashboards; escalate unresolved tasks per policy, notifying secondary owners and leadership.
- **External Sync Health:** Validate Jira/ServiceNow integrations after deployments; ensure field mappings align and webhooks process updates.
- **Audit Preparation:** Export task histories with evidence references for auditors, ensuring control re-validation results are attached.

### Related Documentation
- [Governance Engine](../12-governance-engine/readme.md) — triggers and re-validation workflows.
- [Evidence Management System](../11-evidence-management-system/readme.md) — evidence attachment verification.
- [Notification System](../04-notification-system/readme.md) — alerting for task creation and escalation.
- [Dashboard & Reporting System](../14-dashboard-and-reporting-system/readme.md) — SLA and remediation reporting.

---

[← Previous](../12-governance-engine/readme.md) | [Next →](../14-dashboard-and-reporting-system/readme.md)
