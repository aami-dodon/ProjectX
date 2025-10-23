# Task Management System <!-- omit in toc -->

## Location: /server/src/modules/tasks

>### TL;DR
> The task management system operationalizes remediation by translating failed governance checks into assignable, auditable work.
> Implemented in `server/src/modules/tasks`, it exposes REST APIs, lifecycle engines, SLA automation, and integrations that keep remediation accountable across the platform.
> This guide captures every engineering detail needed to implement and operate the feature in alignment with the broader governance architecture.

---

- [System Overview & Alignment](#system-overview--alignment)
- [Backend Specification](#backend-specification)
  - [Location & Directory Layout](#backend-location--directory-layout)
  - [Service Responsibilities & API Contracts](#service-responsibilities--api-contracts)
  - [Lifecycle Orchestration & Automation](#lifecycle-orchestration--automation)
  - [Integrations & Messaging](#integrations--messaging)
  - [Security, Compliance & Observability](#security-compliance--observability)
- [Frontend Specification](#frontend-specification)
  - [Location & Directory Layout](#frontend-location--directory-layout)
  - [State Management, Components & UI Flows](#state-management-components--ui-flows)
- [Schema Specification](#schema-specification)
- [Operational Playbooks & Runbooks](#operational-playbooks--runbooks)
- [Related Documentation](#related-documentation)

---

## System Overview & Alignment

The task management system sits in step 7 of the governance lifecycle: failed checks and controls automatically create remediation tasks with owners, deadlines, escalation paths, and evidence requirements, and successful completion retriggers control validation to confirm resolution.【F:docs/01-about/03-concept-summary.md†L282-L299】 It must uphold platform objectives around continuous compliance, measurable outcomes, and cross-functional collaboration while scaling with enterprise governance operations.【F:docs/01-about/03-concept-summary.md†L301-L335】【F:docs/01-about/08-operations-and-teams.md†L9-L101】

Key responsibilities:
- Provide a system of record for remediation work across internal and external teams, ensuring accountability to SLA targets outlined in operational objectives.【F:docs/01-about/08-operations-and-teams.md†L9-L169】
- Enforce automation-first workflows that integrate with governance, evidence, notification, audit, and dashboard systems to maintain traceability and audit readiness.【F:docs/02-technical-specifications/01-system-architecture.md†L9-L133】【F:docs/03-systems/06-audit-logging-and-monitoring/readme.md†L7-L139】
- Support JavaScript-only implementation across backend (Express.js) and frontend (React + Vite) layers, aligning with platform technology standards.【F:docs/02-technical-specifications/01-system-architecture.md†L1-L83】

---

## Backend Specification

### Backend Location & Directory Layout

Task orchestration lives in `server/src/modules/tasks`, following the feature-first Express.js structure used throughout the backend.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L55-L182】

```
server/src/modules/tasks/
├── controllers/
│   ├── tasks.controller.js
│   ├── assignments.controller.js
│   └── integrations.controller.js
├── services/
│   ├── task.service.js
│   ├── lifecycle.service.js
│   ├── escalation.service.js
│   └── evidence-sync.service.js
├── repositories/
│   ├── task.repository.js
│   ├── task-assignment.repository.js
│   └── task-metric.repository.js
├── policies/
│   └── tasks.policy.js
├── workflows/
│   ├── sla.scheduler.js
│   ├── verification.queue.js
│   └── sync.processor.js
├── integrations/
│   ├── jira.adapter.js
│   └── servicenow.adapter.js
└── events/
    ├── task.created.js
    ├── task.updated.js
    └── task.closed.js
```

### Service Responsibilities & API Contracts

Services enforce clear separation of concerns:
- `task.service.js` handles creation, updates, status transitions, and read models.
- `lifecycle.service.js` encapsulates state machine rules (draft → open → in-progress → awaiting evidence → pending verification → resolved → closed) and validation when reopening or rolling back states.
- `escalation.service.js` calculates SLA breaches, updates escalation tiers, and dispatches notifications.
- `evidence-sync.service.js` validates linked artifacts against the Evidence Management system before verification can succeed.【F:docs/03-systems/11-evidence-management-system/readme.md†L7-L118】

Controller endpoints conform to REST contracts documented in the backend specification and surfaced via OpenAPI. All controllers are implemented in JavaScript (no TypeScript) and reuse shared middleware for authentication, authorization, validation, and logging.【F:docs/02-technical-specifications/01-system-architecture.md†L9-L83】【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L136-L205】

| Method | Endpoint | Description | Request Shape (JSON) | Response Shape |
|--------|----------|-------------|----------------------|----------------|
| POST | `/tasks` | Create remediation task from governance trigger, mapping control/check/context metadata. | `{ title, description, priority, source, controlId, checkId, frameworkId, slaDueAt, assigneeId/teamId, tags, evidenceHints[] }` | `{ status, message, data: { task } }` |
| GET | `/tasks` | List/filter tasks by status, severity, framework, owner, SLA state, escalation tier. | Query params `status`, `priority`, `frameworkId`, `assigneeId`, `escalationLevel`, `search` | `{ status, message, data: { tasks, pagination, aggregates } }` |
| GET | `/tasks/:id` | Retrieve task detail, lifecycle events, evidence links, external sync state. | N/A | `{ status, message, data: { task, timeline, metrics } }` |
| PATCH | `/tasks/:id/status` | Transition task state; enforces lifecycle rules and evidence prerequisites. | `{ status, comment, evidenceIds[], reopenReason }` | `{ status, message, data: { task } }` |
| POST | `/tasks/:id/reassign` | Reassign or delegate to user/team, capturing expiry and audit context. | `{ assigneeId, teamId, delegationExpiresAt, justification }` | `{ status, message, data: { task, assignments } }` |
| POST | `/tasks/:id/escalate` | Manually escalate with reason (auto-escalations handled by scheduler). | `{ escalationLevel, reason }` | `{ status, message, data: { task } }` |
| POST | `/tasks/:id/evidence` | Attach or detach evidence references after validation. | `{ action: "add" | "remove", evidenceIds[] }` | `{ status, message, data: { task, evidenceLinks } }` |
| POST | `/tasks/:id/sync` | Force external issue sync (Jira/ServiceNow) and return status. | `{ provider, forceRefresh }` | `{ status, message, data: { syncState } }` |

All responses follow the unified JSON envelope (`status`, `message`, `data`, `error`) defined for the API server.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L182-L205】

### Lifecycle Orchestration & Automation

Lifecycle automation ties remediation to platform events and SLAs:
- **Creation Triggers:** Governance engine emits `task.created` events when checks fail or manual remediation is requested. Manual creation remains available to privileged users for ad-hoc remediation.【F:docs/03-systems/12-governance-engine/readme.md†L29-L94】
- **State Machine Enforcement:** `lifecycle.service.js` ensures transitions respect business rules (e.g., cannot close without verified evidence, reopen requires justification and resets verification tasks). Status transitions emit domain events and append audit log entries captured by the monitoring system.【F:docs/03-systems/06-audit-logging-and-monitoring/readme.md†L7-L139】
- **SLA Automation:** `sla.scheduler.js` runs on a configurable interval (default hourly) via the platform job runner, evaluates `slaDueAt` against current timestamps, and triggers escalations (level 1: notify owner, level 2: notify team leads, level 3: leadership and compliance) aligned with enterprise SLA policies.【F:docs/01-about/08-operations-and-teams.md†L162-L194】【F:docs/01-about/10-risk-management-and-Mitigation.md†L116-L138】
- **Verification Queue:** Tasks entering `pending verification` enqueue a job in `verification.queue.js` to request approvals from control owners or compliance reviewers. Completion automatically requests governance re-validation to maintain continuous compliance.【F:docs/01-about/03-concept-summary.md†L282-L299】【F:docs/03-systems/12-governance-engine/readme.md†L33-L115】

### Integrations & Messaging

Task workflows rely on internal and external integrations:
- **Notification System:** Escalation, assignment, and status change events post structured payloads to the notification service for email, Slack, or PagerDuty distribution.【F:docs/03-systems/04-notification-system/readme.md†L7-L200】
- **Evidence Management:** Evidence attachments and verification require validation against the Evidence Management API before the lifecycle can progress, ensuring artifacts remain trustworthy.【F:docs/03-systems/11-evidence-management-system/readme.md†L7-L159】
- **Governance Engine:** Completed tasks trigger governance re-runs to update control and framework scores, closing the remediation loop.【F:docs/03-systems/12-governance-engine/readme.md†L31-L118】
- **Dashboard & Reporting:** SLA and throughput metrics feed the dashboard system to surface remediation posture in executive views.【F:docs/03-systems/14-dashboard-and-reporting-system/readme.md†L7-L118】
- **External Trackers:** Jira and ServiceNow adapters synchronize titles, statuses, comments, and assignees with third-party systems, using webhooks or scheduled syncs to avoid drift.【F:docs/02-technical-specifications/07-integration-architecture.md†L98-L134】 Field mappings and conflict resolution logic (platform source-of-truth unless overridden by admin) are configurable per environment.

Message flow is implemented via lightweight event emitters within the Express app; events are persisted to `task_events` and forwarded to integrations through background workers to avoid blocking API latency.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L153-L205】

### Security, Compliance & Observability

Security controls follow platform-wide policies:
- **Authentication & Authorization:** All routes are protected by JWT middleware and Casbin policies defined in `tasks.policy.js`. Delegation workflows respect break-glass requirements and enforce time-bound access, emitting alerts for emergency overrides.【F:docs/01-about/04-security-and-data-protection.md†L243-L337】
- **Audit Logging:** Every change (status updates, reassignments, evidence edits) writes immutable entries to the audit logging system with actor, timestamp, payload diff, and origin metadata.【F:docs/01-about/04-security-and-data-protection.md†L261-L337】【F:docs/03-systems/06-audit-logging-and-monitoring/readme.md†L7-L139】
- **Data Protection:** Task descriptions and attachments must remain free of sensitive model artifacts unless explicitly tagged; retention follows governance policies (default 36 months) with archival handled via scheduled jobs akin to evidence retention.【F:docs/01-about/04-security-and-data-protection.md†L303-L337】【F:docs/02-technical-specifications/04-database-design.md†L80-L147】
- **Observability:** Structured logs (Winston + Morgan) emit lifecycle events, and metrics (SLA breaches, reopen rate, verification latency) publish to monitoring dashboards to satisfy operational KPIs.【F:docs/02-technical-specifications/01-system-architecture.md†L34-L132】【F:docs/01-about/08-operations-and-teams.md†L118-L194】 Error budgets align with risk management thresholds (e.g., <2 SLA breaches per quarter).【F:docs/01-about/10-risk-management-and-Mitigation.md†L116-L138】

---

## Frontend Specification

### Frontend Location & Directory Layout

Remediation UI lives under `client/src/features/tasks`, mirroring backend boundaries and enabling feature-focused development in JavaScript (no TypeScript).【F:docs/02-technical-specifications/03-frontend-architecture.md†L9-L82】

```
client/src/features/tasks/
├── pages/
│   ├── task-inbox-page.jsx
│   ├── task-detail-page.jsx
│   ├── task-board-page.jsx
│   └── sla-dashboard-page.jsx
├── components/
│   ├── task-form.jsx
│   ├── task-timeline.jsx
│   ├── evidence-attachment-list.jsx
│   ├── escalation-banner.jsx
│   └── external-sync-status.jsx
├── hooks/
│   ├── use-task-inbox.js
│   ├── use-task-detail.js
│   ├── use-sla-metrics.js
│   └── use-task-mutations.js
└── api/
    └── tasks-client.js
```

Shared governance components such as `TaskControlPanel.jsx` reside in `client/src/components/governance` for reuse across dashboards.【F:docs/02-technical-specifications/03-frontend-architecture.md†L32-L118】

### State Management, Components & UI Flows

The frontend follows the platform’s React architecture (Vite, React Router, Tailwind, shadcn). Data fetching uses Axios clients wrapped in feature-specific hooks; React Context supplies auth tokens, theming, and notification preferences.【F:docs/02-technical-specifications/03-frontend-architecture.md†L9-L140】

Key flows:
- **Task Intake:** `task-form.jsx` renders dynamic fields (control/check lookups, SLA pickers) and leverages validation helpers shared via `shared/validation`. Automation auto-populates context when invoked from governance alerts; manual users can attach initial evidence placeholders. Submission posts to `/tasks` and on success routes to `task-detail-page.jsx`.
- **Inbox & Board Views:** `task-inbox-page.jsx` supports filters (status, framework, owner, SLA state). `task-board-page.jsx` renders a Kanban board aligned with lifecycle statuses using drag-and-drop interactions; dropping triggers status mutations that respect lifecycle rules (confirmation modals for cross-tier moves). Aggregates (counts, breach totals) update via `use-sla-metrics.js`.
- **Detail & Timeline:** `task-detail-page.jsx` composes `task-timeline.jsx`, `evidence-attachment-list.jsx`, and `external-sync-status.jsx` to show history, linked evidence, and external ticket state. Verification actions and delegation modals check Casbin permissions returned by the backend before enabling UI controls.
- **Escalation Awareness:** `escalation-banner.jsx` surfaces SLA urgency (time remaining, current level) with quick actions to reassign, escalate, or add evidence. The component subscribes to notification context to display realtime alerts from WebSocket or polling channels configured globally.【F:docs/03-systems/04-notification-system/readme.md†L7-L170】
- **Accessibility & Security:** Components follow WCAG AA theming, support keyboard interactions, and ensure sensitive data is masked according to security guidance (e.g., redacting personal data in comments). All API mutations include JWT headers from auth context and refresh tokens when 401 responses occur.【F:docs/02-technical-specifications/03-frontend-architecture.md†L108-L160】【F:docs/01-about/04-security-and-data-protection.md†L243-L337】

UI tests should cover lifecycle transitions, evidence attachment flows, and escalation banners to protect core remediation paths aligned with MVP roadmap milestones for automated remediation and SLA tracking.【F:docs/01-about/06-mvp-and-roadmap.md†L180-L210】

---

## Schema Specification

Primary tables (PostgreSQL via Prisma) capture lifecycle state, metrics, and integrations. Column names use snake_case per database conventions; Prisma schema definitions live in `server/prisma/schema.prisma`.

- **`tasks`** – `id (uuid PK)`, `title`, `description`, `priority`, `status`, `source`, `control_id`, `check_id`, `framework_id`, `created_by`, `assignee_id`, `team_id`, `delegation_expires_at`, `sla_due_at`, `escalation_level`, `external_issue_key`, `external_provider`, `verification_required`, `verification_completed_at`, `created_at`, `updated_at`, `resolved_at`, `closed_at`.
- **`task_events`** – Append-only ledger with `id`, `task_id`, `event_type`, `payload`, `actor_id`, `actor_type`, `created_at`, `origin`, providing integration with audit logging and dashboards.【F:docs/02-technical-specifications/04-database-design.md†L80-L147】
- **`task_assignments`** – Ownership history tracking `task_id`, `assignee_id`, `team_id`, `delegated_by`, `delegation_expires_at`, `justification`, `created_at`, `revoked_at`.
- **`task_evidence_links`** – Bridge table linking evidence with verification context `task_id`, `evidence_id`, `link_type`, `reviewer_id`, `verification_status`, `verified_at`.
- **`task_sla_metrics`** – Materialized metrics for dashboards: `task_id`, `time_to_acknowledge`, `time_in_status`, `time_to_close`, `breach_count`, `last_breach_at`.

Foreign keys enforce integrity with governance entities (`controls`, `checks`, `frameworks`, `evidence`), and indexes on `status`, `assignee_id`, `sla_due_at`, and `escalation_level` support high-volume queries. Soft deletes are avoided; instead, closure is recorded via timestamps to maintain audit history.【F:docs/02-technical-specifications/04-database-design.md†L80-L147】

---

## Operational Playbooks & Runbooks

Operations teams rely on structured runbooks to maintain reliability and compliance:
- **Daily Monitoring:** Review SLA dashboards for breaches, verify escalation notifications reached recipients, and inspect synchronization logs for external trackers. Any repeated failure triggers incident management per risk governance policies.【F:docs/01-about/10-risk-management-and-Mitigation.md†L70-L138】【F:docs/03-systems/04-notification-system/readme.md†L7-L200】
- **Weekly Audits:** Sample closed tasks to confirm evidence sufficiency and governance re-validation outcomes; ensure audit logs contain complete histories and no unauthorized delegation occurred.【F:docs/03-systems/06-audit-logging-and-monitoring/readme.md†L7-L139】
- **Release Checklist:** Before deploying changes, run integration tests for lifecycle transitions, verify Prisma migrations for schema changes, and execute end-to-end smoke tests connecting governance engine triggers, task creation, and dashboard updates.【F:docs/02-technical-specifications/08-deployment-and-environment-guide.md†L100-L205】【F:docs/01-about/08-operations-and-teams.md†L118-L194】
- **Disaster Recovery:** Leverage platform-wide DR plans (RPO < 4 hours, RTO < 24 hours) to restore task data and external sync states. Post-recovery, reconcile with external trackers to prevent duplicate or missed remediation records.【F:docs/01-about/08-operations-and-teams.md†L166-L194】【F:docs/02-technical-specifications/05-devops-infrastructure.md†L200-L214】

---

## Related Documentation

- [Governance Engine](../12-governance-engine/readme.md) — Triggers remediation workflows and re-validates controls.
- [Evidence Management System](../11-evidence-management-system/readme.md) — Validates supporting artifacts before closure.
- [Notification System](../04-notification-system/readme.md) — Manages alerts for creation, escalation, and verification.
- [Audit Logging & Monitoring](../06-audit-logging-and-monitoring/readme.md) — Captures immutable task histories and operational metrics.
- [Dashboard & Reporting System](../14-dashboard-and-reporting-system/readme.md) — Surfaces SLA metrics, backlog, and remediation trends.

---

[← Previous](../12-governance-engine/readme.md) | [Next →](../14-dashboard-and-reporting-system/readme.md)
