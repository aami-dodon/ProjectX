# External Integrations System <!-- omit in toc -->

## Location: /server/src/integrations

>### TL;DR
> This document catalogs Project X's third-party integrations, covering supported connectors, authentication models, data synchronization patterns, and operational runbooks.
> For every integration we highlight configuration steps, environment variables, failure-handling playbooks, and how the connector ties into notifications, tasks, and evidence lifecycle.
> Use this reference when onboarding new environments, planning releases, or troubleshooting production incidents.

---

- [Backend Specification](#backend-specification)
  - [Location & Directory Layout](#backend-location--directory-layout)
  - [Integration Inventory](#integration-inventory)
  - [Cross-Cutting Patterns](#cross-cutting-patterns)
- [Frontend Specification](#frontend-specification)
  - [Location & Directory Layout](#frontend-location--directory-layout)
  - [Reusable Components & UI Flows](#reusable-components--ui-flows)
- [Schema Specification](#schema-specification)
- [Operational Playbooks & References](#operational-playbooks--references)

---

## Backend Specification

### Backend Location & Directory Layout
Integration connectors live under `server/src/integrations`, each exposing configuration, authentication, synchronization, and failure-handling logic reused by governance modules.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L124-L171】

```
server/src/integrations/
├── servicenow/
│   ├── client.ts
│   ├── mapper.ts
│   └── scheduler.ts
├── jira/
├── onetrust/
├── slack/
├── email-bridge/
├── evidence-providers/
└── shared/
    ├── auth.ts
    ├── scheduler.ts
    └── telemetry.ts
```

### Integration Inventory
- **ServiceNow ITSM:** OAuth 2.0 client credentials scoped to incidents/tasks. Synchronizes high-priority incidents, change approvals, and remediation updates; integrates with Notification and Task systems for escalations.
- **Atlassian Jira:** PAT or OAuth 1.0a depending on deployment; maps governance tasks to project issues, syncing status, comments, and evidence references.
- **OneTrust GRC:** API key authentication for policy inventory and assessment data, enriching governance controls and evidence references.
- **Slack Workspace:** Bot tokens drive real-time alerts, digest notifications, and slash-command acknowledgements for governance events.
- **Email/Webhook Bridge:** Bridges email inboxes or partner systems via webhook ingestion, generating governance events and evidence records.
- **Evidence Repository Providers:** Connectors for third-party storage (e.g., S3, SharePoint) ingest artifacts while honoring retention and encryption policies.

### Cross-Cutting Patterns
- **Authentication:** Short-lived tokens stored in secrets manager, rotated automatically; connectors support OAuth, PAT, API key, and mTLS flows with centralized helpers.
- **Synchronization & Scheduling:** BullMQ schedulers perform polling jobs with idempotency keys, while webhooks drive near real-time updates. Retry policies with exponential backoff and circuit breakers ensure resilience.
- **Error Handling:** Connectors emit structured failure events consumed by Notification and Task systems, triggering playbooks and remediation tasks.
- **Governance Hooks:** Integrations create or enrich notifications, tasks, and evidence records, ensuring downstream modules maintain traceability across third-party systems.

## Frontend Specification

### Frontend Location & Directory Layout
Integration administration UI lives in `client/src/features/integrations`, exposing configuration consoles, health dashboards, and credential management flows.【F:docs/02-technical-specifications/03-frontend-architecture.md†L96-L160】

```
client/src/features/integrations/
├── pages/
│   ├── IntegrationCatalogPage.tsx
│   ├── IntegrationDetailPage.tsx
│   ├── CredentialManagementPage.tsx
│   └── IntegrationHealthPage.tsx
├── components/
│   ├── IntegrationConfigForm.tsx
│   ├── CredentialRotationWizard.tsx
│   ├── SyncStatusTable.tsx
│   └── FailureRunbookPanel.tsx
├── hooks/
│   ├── useIntegrations.ts
│   ├── useIntegrationHealth.ts
│   └── useCredentialRotations.ts
└── api/
    └── integrationsClient.ts
```

### Reusable Components & UI Flows
- **Catalog & Detail:** Lists available connectors, status, environment bindings, and quick actions. Detail pages show configuration, credentials, and synchronization schedules.
- **Credential Management:** `CredentialRotationWizard` guides secure rotation, validates secrets, and updates scheduling metadata.
- **Health Monitoring:** `SyncStatusTable` and `IntegrationHealthPage` display job latency, failure counts, and last successful sync, linking to Notification and Task records.
- **Runbooks:** `FailureRunbookPanel` surfaces playbooks and troubleshooting steps, ensuring operators follow documented escalation paths.

## Schema Specification
- **`integration_configs`:** Stores connector type, environment, credentials (encrypted), scopes, schedules, and enabled flags.
- **`integration_runs`:** Logs synchronization executions with timestamps, status, error codes, latency, and payload hashes.
- **`integration_events`:** Records webhook deliveries, retries, and downstream actions (tasks created, notifications sent).
- **`integration_credentials_audit`:** Tracks rotation history, approvers, and expiry dates.
- **`integration_health_metrics`:** Aggregated KPIs for dashboards (success rate, latency, backlog depth).
- Relationships tie into Notification, Task, Evidence, and Governance modules to maintain end-to-end traceability for third-party interactions.【F:docs/03-systems/04-notification-system/readme.md†L7-L200】【F:docs/03-systems/13-task-management-system/readme.md†L7-L226】

## Operational Playbooks & References

### Environment Configuration
- Maintain environment-specific matrices for endpoints, credentials, and feature flags. Use the Admin & Configuration system to manage secrets and tenant-specific overrides.【F:docs/03-systems/05-admin-and-configuration-system/readme.md†L7-L180】
- Validate integrations in staging with sandbox credentials before production rollout; follow change-management checklists to coordinate stakeholders.

### Daily Checks & Incident Response
- Monitor scheduled jobs, webhook failures, and credential expirations. Daily checks confirm synchronization latency and queue depth.
- Incident response playbooks detail escalation paths, rollback procedures, and communication channels per integration. Notification and Task systems enforce accountability.

### Related Documentation
- [Notification System](../04-notification-system/readme.md) — alert routing for integration failures.
- [Task Management System](../13-task-management-system/readme.md) — remediation tracking for connector incidents.
- [Evidence Management System](../11-evidence-management-system/readme.md) — evidence ingestion from external sources.
- [Admin & Configuration System](../05-admin-and-configuration-system/readme.md) — credential governance.

---

[← Previous](../14-dashboard-and-reporting-system/readme.md) | [Next →](../01-user-management-system/readme.md)
