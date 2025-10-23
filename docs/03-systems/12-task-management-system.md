# Task Management System <!-- omit in toc -->

## Location: /server/src/modules/tasks

>### TL;DR
> The task management system converts governance signals into actionable remediation work.
> It orchestrates task lifecycle states, assignments, escalations, and evidence capture across internal and external tooling.
> Completed tasks automatically trigger control re-validation to maintain continuous compliance.

---

- [1. Purpose and Context](#1-purpose-and-context)
- [2. Task Creation Triggers](#2-task-creation-triggers)
- [3. Status Lifecycle](#3-status-lifecycle)
  - [3.1 State Transition Diagram](#31-state-transition-diagram)
  - [3.2 Transition Rules](#32-transition-rules)
- [4. Assignment and Escalation Mechanics](#4-assignment-and-escalation-mechanics)
  - [4.1 Ownership Model](#41-ownership-model)
  - [4.2 Escalation Policy](#42-escalation-policy)
- [5. Evidence Attachments](#5-evidence-attachments)
  - [5.1 Accepted Evidence Types](#51-accepted-evidence-types)
  - [5.2 Verification Workflow](#52-verification-workflow)
- [6. External Tracker Integrations](#6-external-tracker-integrations)
  - [6.1 Synchronization Rules](#61-synchronization-rules)
  - [6.2 Field Mapping](#62-field-mapping)
- [7. Data Storage in `tasks` Table](#7-data-storage-in-tasks-table)
  - [7.1 Core Columns](#71-core-columns)
  - [7.2 Indexing and Auditing](#72-indexing-and-auditing)
- [8. Control Re-Validation Feedback Loop](#8-control-re-validation-feedback-loop)
- [9. Usage Scenarios and Reporting Metrics](#9-usage-scenarios-and-reporting-metrics)
  - [9.1 Compliance Officers](#91-compliance-officers)
  - [9.2 Engineers and Responders](#92-engineers-and-responders)
  - [9.3 Auditors](#93-auditors)

---

## 1. Purpose and Context

The task management system is the operational core of remediation activities. It links failed controls, audit findings, and ad-hoc governance requests to accountable owners, ensuring transparent tracking of remediation progress. Tasks act as the bridge between detection events (e.g., failed automated checks) and verification of corrective actions.

## 2. Task Creation Triggers

Tasks can be generated through multiple automated and manual channels:

| Trigger Source | Description | Default Severity | Auto Assignment |
|----------------|-------------|------------------|-----------------|
| **Failed control check** | Automated scanners flag control non-compliance. | Based on control risk rating. | Assigned to control owner; fallback to compliance queue. |
| **Risk alert escalation** | Alerts raised by monitoring pipelines or anomaly detection that require follow-up. | Critical if alert severity ≥ High. | Assigned to alert responder group. |
| **Audit finding** | Internal/external auditors log remediation items during assessments. | Medium unless overridden by auditor. | Assigned to compliance officer responsible for audit scope. |
| **Manual task creation** | Users create tasks from dashboard for process changes or documentation updates. | User-selected. | Assigned manually or queued for triage. |
| **External integration** | Jira/ServiceNow issues synced into platform when linked to a control. | Mirrors source system priority. | Owner derived from external assignee mapping. |

Additional triggers (e.g., policy updates) can be configured via automation rules that map events to task templates.

## 3. Status Lifecycle

Task status values are standardized to reflect remediation maturity:

1. **Open** – Task logged but not yet acknowledged.
2. **In Progress** – Work has started; owner actively addressing remediation.
3. **Blocked** – Dependencies prevent progress; waiting on external action.
4. **Ready for Review** – Owner completed work and attached evidence.
5. **Resolved** – Reviewer validated remediation; pending control re-check.
6. **Closed** – Control re-validated and task archived.

### 3.1 State Transition Diagram

```
Open → In Progress → Ready for Review → Resolved → Closed
            ↓                ↑              ↓
         Blocked ────────────┘           Reopened → In Progress
```

### 3.2 Transition Rules

- **Open → In Progress** occurs when an assignee acknowledges the task or updates effort estimates.
- **In Progress → Blocked** requires entering a dependency note and optional escalation target.
- **Blocked → In Progress** triggers notification to watchers documenting the unblock reason.
- **In Progress → Ready for Review** only permitted if at least one evidence attachment is linked or a justification is recorded.
- **Ready for Review → Resolved** requires reviewer approval and recorded review timestamp.
- **Resolved → Closed** is automated once control re-validation succeeds.
- **Any non-Closed state → Reopened** is allowed when new findings surface; the system records the reopening reason and increments the `reopen_count`.

## 4. Assignment and Escalation Mechanics

### 4.1 Ownership Model

- **Primary Owner:** Each task maintains a `assignee_user_id` referencing the accountable individual.
- **Secondary Watchers:** `watcher_ids` provide visibility for stakeholders (compliance, legal, product).
- **Group Assignment:** Tasks can reference a `team_id` for routing to shared inboxes; individuals claim ownership via "Accept Task" action.
- **SLA Tracking:** Every task inherits a due date based on severity (e.g., Critical = 3 days, High = 7 days, Medium = 14 days, Low = 30 days). SLAs drive reminder cadence.

### 4.2 Escalation Policy

1. **Automated Reminders:** Notifications sent at 50%, 75%, and 100% of SLA usage.
2. **Escalate to Manager:** When overdue by >24 hours, the task escalates to the assignee’s manager (`escalation_user_id`). Manager becomes co-owner until resolution.
3. **Program-Level Escalation:** Tasks overdue by >72 hours for Critical severity auto-create a ServiceNow incident or Slack alert to the governance channel.
4. **Manual Escalation:** Compliance officers can manually reassign or escalate tasks using `/tasks/:id/reassign` endpoint while preserving audit history.

## 5. Evidence Attachments

### 5.1 Accepted Evidence Types

- Documents: PDF, DOCX, or TXT containing updated policies, procedures, or analysis.
- Configuration exports: JSON/YAML files capturing system settings.
- Screenshots or recordings: PNG, JPG, MP4 demonstrating remediation steps.
- Automated probe output: Structured payloads ingested from integration probes.

### 5.2 Verification Workflow

1. Assignee uploads evidence using the Evidence Repository service; entries are linked via `evidence_links` referencing the task.
2. Evidence metadata tracks uploader, checksum, and storage path in MinIO.
3. Reviewers validate evidence authenticity, optionally requesting additional artifacts.
4. Evidence approval status is logged; rejected items transition the task back to **In Progress**.
5. Accepted evidence is retained for minimum 36 months with version control and audit trails.

## 6. External Tracker Integrations

### 6.1 Synchronization Rules

- **Jira:** Tasks can be pushed as Jira issues; status changes synchronize bidirectionally. Closing a Jira issue triggers the platform to move the task to **Ready for Review**.
- **ServiceNow:** High-severity tasks can auto-create incidents. Resolution in ServiceNow updates task status and imports closure notes.
- **Webhook Events:** Generic webhooks support integration with other ticketing systems. Events include task creation, status updates, reassignment, and closure.
- **Conflict Resolution:** Platform status is the source of truth; conflicting updates from external systems prompt manual review with merge suggestions displayed in the UI.

### 6.2 Field Mapping

| Platform Field | Jira Field | ServiceNow Field | Notes |
|----------------|-----------|------------------|-------|
| `title` | `summary` | `short_description` | Truncated to 255 characters if needed. |
| `description` | `description` | `description` | Markdown converted to HTML for ServiceNow. |
| `severity` | `priority` | `priority` | Severity→priority mapping configured per workspace. |
| `status` | `status` | `state` | State machine translation table ensures accurate mapping. |
| `assignee_user_id` | `assignee` | `assigned_to` | Uses directory mapping or email matching. |
| `due_date` | `duedate` | `due_date` | Maintains SLA visibility across platforms. |
| `evidence_links` | `attachments` | `attachments` | Evidence metadata referenced via secure URLs. |

## 7. Data Storage in `tasks` Table

### 7.1 Core Columns

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Unique task identifier. |
| `title` | Text | Short summary of remediation action. |
| `description` | Text | Detailed context, control references, and remediation steps. |
| `control_id` | UUID (FK) | Links to the affected control. |
| `alert_id` | UUID (FK, nullable) | Populated when derived from alert. |
| `severity` | ENUM (`critical`,`high`,`medium`,`low`) | Drives SLA and reporting metrics. |
| `status` | ENUM (`open`,`in_progress`,`blocked`,`review`,`resolved`,`closed`,`reopened`) | Lifecycle state (UI maps review ↔ Ready for Review). |
| `assignee_user_id` | UUID (FK) | Current owner. |
| `team_id` | UUID (FK, nullable) | Routing group. |
| `due_date` | Timestamp | SLA deadline. |
| `escalation_user_id` | UUID (FK, nullable) | Manager or escalation contact. |
| `reopen_count` | Integer | Tracks number of reopen events. |
| `evidence_required` | Boolean | Indicates whether evidence is mandatory before review. |
| `metadata` | JSONB | Flexible payload for integration identifiers, tags, or automation signals. |
| `created_at` / `updated_at` | Timestamp | Auditable timestamps managed by Prisma. |
| `closed_at` | Timestamp (nullable) | Populated when task reaches **Closed**. |

### 7.2 Indexing and Auditing

- Composite index on `(status, severity, due_date)` for dashboard filters.
- Foreign key indexes on `control_id`, `assignee_user_id`, and `team_id` for efficient joins.
- All status transitions emit audit log entries referencing `task_id`, actor, previous state, new state, and timestamp.
- Soft deletes avoided; tasks remain immutable with status-based archival for traceability.

## 8. Control Re-Validation Feedback Loop

1. When a task transitions to **Resolved**, the control monitoring engine schedules re-validation.
2. Automated probes or manual testers verify that remediation steps are effective.
3. Successful re-validation updates associated control status to **Compliant** and logs the verification evidence.
4. If verification fails, the task is automatically reopened with appended failure details and new due date.
5. Upon successful validation, the system updates metrics dashboards, recalculates compliance scores, and closes the task (recording `closed_at`).

## 9. Usage Scenarios and Reporting Metrics

### 9.1 Compliance Officers

**Scenario:** Reviewing weekly remediation backlog.

- Use severity and SLA dashboards to prioritize overdue tasks.
- Generate reports on task aging, reopen counts, and evidence completeness.
- Monitor cross-framework remediation progress, filtering by control category.
- Export integration status summaries to confirm Jira/ServiceNow parity.

**Key Metrics:**
- Percentage of tasks resolved within SLA by severity.
- Average time from creation to Ready for Review.
- Evidence attachment ratio (tasks with approved evidence ÷ total tasks).

### 9.2 Engineers and Responders

**Scenario:** Actioning a newly assigned high-severity task.

- Receive notification via email/Slack with task context and SLA.
- Review linked controls, alerts, and prior evidence to scope remediation.
- Attach remediation proof (config diffs, deployment logs) before submitting for review.
- Update status to **Ready for Review** and monitor for reviewer feedback.

**Key Metrics:**
- Mean time to acknowledge (MTTA) and mean time to remediate (MTTR).
- Blocked task count by dependency type (infrastructure, vendor, access).
- Reopen frequency by assignee to identify training needs.

### 9.3 Auditors

**Scenario:** Preparing for quarterly compliance audit.

- Access read-only dashboards showing closed tasks mapped to control objectives.
- Download evidence bundles with timestamps, reviewer approvals, and re-validation outcomes.
- Filter tasks by audit finding source to trace remediation effectiveness.
- Confirm traceability from finding → task → evidence → control re-validation.

**Key Metrics:**
- Audit finding closure rate and time to closure.
- Control re-validation success rate post task completion.
- Evidence integrity score (percentage of evidence with checksum verification).

---

This document defines the operational blueprint for managing remediation tasks, ensuring that governance gaps are tracked, remediated, and verified with full auditability.

---

[← Previous](11-governance-engine.md) | [Next →](13-dashboard-and-reporting-system.md)
