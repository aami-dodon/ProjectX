# Notification System <!-- omit in toc -->

## Location: /server/src/modules/notifications

>### TL;DR
> The notification system orchestrates outbound communication across email, collaboration tools, and external ticketing channels while preserving regulatory tone and consent requirements.
> It is centered around the `server/src/modules/notifications` package, which exposes shared workflow utilities, template management, channel adapters, and delivery policies aligned with the platform’s marketing and risk commitments.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L137-L148】【F:docs/01-about/07-marketing-strategy.md†L70-L154】【F:docs/01-about/10-risk-management-and-Mitigation.md†L80-L153】
> This guide details event contracts, API surfaces, integrations with ServiceNow, Jira, Slack, and in-app messaging, plus the observability and testing patterns required to extend notification coverage confidently.【F:docs/02-technical-specifications/07-integration-architecture.md†L1-L177】【F:docs/02-technical-specifications/09-testing-and-qa.md†L141-L203】

---

- [Backend Specification](#backend-specification)
  - [Location & Directory Layout](#backend-location--directory-layout)
  - [Workflow Orchestration](#workflow-orchestration)
  - [Channel Integrations](#channel-integrations)
  - [Extending Notification Types](#extending-notification-types)
- [Frontend Specification](#frontend-specification)
  - [Location & Directory Layout](#frontend-location--directory-layout)
  - [Reusable Components & UI Flows](#reusable-components--ui-flows)
- [Schema Specification](#schema-specification)
- [Operational Playbooks & References](#operational-playbooks--references)

---

## Backend Specification

### Backend Location & Directory Layout
Notification orchestration lives under `server/src/modules/notifications`, bundling event processing, template rendering, delivery policies, and channel dispatchers behind a consistent API surface.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L137-L149】

```
server/src/modules/notifications/
├── events/
│   ├── index.ts
│   └── schemas/
├── channels/
│   ├── email/
│   ├── servicenow/
│   ├── jira/
│   └── slack/
├── templates/
│   ├── registry.json
│   └── email/
├── schedulers/
│   └── digest.worker.ts
├── services/
│   ├── dispatcher.service.ts
│   └── renderer.service.ts
├── config/
│   └── delivery-policies.yml
└── logging/
    └── notifications.logger.ts
```

### Workflow Orchestration
The notification system ensures domain events reach internal and external stakeholders using the correct channel, format, audience segmentation, and timing mandated by marketing and governance policies.【F:docs/01-about/07-marketing-strategy.md†L70-L178】【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L137-L149】 Core packages include `events`, `templates`, `channels`, `logging`, `config`, and `testing`, each handling ingestion, rendering, dispatch, and observability duties. Typical workflow phases progress from event ingestion, eligibility checks, template resolution, payload rendering, channel dispatch, to post-processing with metrics, consent tracking, and retries.

#### Event Sources & Contracts
- **Governance Engine:** Emits remediation, scoring, and control status events that trigger regulatory and operational alerts (`governance.*`).【F:docs/03-systems/12-governance-engine/readme.md†L49-L60】
- **Task Management:** Publishes task lifecycle events (created, escalated, resolved) requiring owner notifications and escalations across channels (`tasks.*`).【F:docs/03-systems/13-task-management-system/readme.md†L51-L115】
- **Framework & Probe Integrations:** Version updates and probe failures are surfaced to stakeholders to keep compliance programs aligned with roadmap expectations (`frameworks.*`, `probes.*`).【F:docs/02-technical-specifications/07-integration-architecture.md†L1-L177】
- **Manual Triggers & Preferences:** Operators can invoke `/api/v1/notifications/send` or `/api/v1/notifications/trigger` for ad-hoc outreach while respecting opt-in/opt-out states stored in preference records.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L145-L148】

#### API Surface & Message Pipeline
- **REST Endpoints:** `/api/v1/notifications/send`, `/api/v1/notifications/templates`, and `/api/v1/notifications/logs` expose synchronous operations for sending, template management, and audit queries, following the platform’s OpenAPI/REST conventions and Casbin enforcement.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L145-L210】
- **Queue Processing:** Event payloads are normalised into internal schemas (`events/schemas`) and queued for workers that apply eligibility rules, deduplicate, and route to channel strategies before persistence in `notifications_deliveries` and `alerts` tables.【F:docs/02-technical-specifications/04-database-design.md†L97-L133】
- **Template Resolution:** Registry metadata determines locale, branding, consent gates, and marketing persona alignment so copy stays consistent with the go-to-market playbook and targeted segments.【F:docs/01-about/07-marketing-strategy.md†L70-L210】
- **Delivery Policies:** `config/delivery-policies.yml` enforces throttling, blackout windows, and fallback sequencing aligned with crisis-management SLAs from the business continuity plan.【F:docs/01-about/10-risk-management-and-Mitigation.md†L123-L159】

#### Email Workflows
- **Triggering Events:** Producers publish messages to the queue through the `events` package, scheduled jobs in `schedulers` launch digests, and operators can force sends via `POST /api/v1/notifications/trigger`.
- **Template Management:** Email templates (`templates/email/<locale>/<notification-type>.hbs`) register metadata in `templates/registry.json`, rely on Handlebars helpers, and expose preview endpoints for operations teams.
- **Personalisation & Rendering:** Context builders merge profile service data with event payloads, redacting sensitive fields via `maskSensitive`. Localised subjects draw from `i18n/messages.json`, and attachments land in object storage with signed links.
- **Dispatch & Delivery:** Email delivery defaults to AWS SES (override via `NOTIFICATIONS_EMAIL_PROVIDER`), reuses shared retry policies (3 attempts, exponential backoff), and normalises responses to `DeliveryResult`. Bulk sends flow through background consumers to avoid throttling.
- **Logging & Audit Trails:** Dispatches log correlation IDs, emit structured events via `notifications.logger`, and persist receipts in `notifications_deliveries`, archiving logs older than 180 days per governance rules.

### Channel Integrations
Adapters under `channels/` extend coverage beyond email while inheriting the integration security controls for OAuth, API keys, and audit logging outlined in the integration architecture.【F:docs/02-technical-specifications/07-integration-architecture.md†L1-L177】

- **ServiceNow:** OAuth 2.0 client credentials (`servicenow/notifications`) authorise incident/task APIs. High-priority incidents (`≥ P2`) and change approvals trigger notifications, with delivery results updating incidents via `/api/now/table/incident`. Nightly reconciliation verifies outstanding tasks.
- **Jira:** Personal access tokens or OAuth 1.0a credentials (`jira/notifications`) power project automation APIs. Issue transitions and sprint events broadcast updates, while failed deliveries tag issues with `notification_failed` and acknowledgements push state via webhooks.
- **Slack:** Bot tokens (`slack/bot-token`) with `chat:write`, `im:write`, `users:read`, and `channels:read` scopes post real-time alerts and daily digests. Message timestamps enable follow-up edits, and slash commands (`/notify-ack`, `/notify-snooze`) synchronise acknowledgement state.
- **In-App & Partner Channels:** Notification contexts in the web client listen for delivery receipts and update UI badges, while outbound webhooks inform partner ecosystems that subscribe to governance events.【F:docs/02-technical-specifications/03-frontend-architecture.md†L96-L140】【F:docs/02-technical-specifications/07-integration-architecture.md†L74-L149】

### Extending Notification Types
- **Define Schema:** Add payload definitions in `events/schemas` and register them in `events/index.ts` alongside channel mappings.
- **Implement Strategies:** Extend `channels/<channel>/strategies.ts` to handle the new type, wiring configuration through `config/channels.yml`.
- **Register Templates & Localisations:** Create email/Slack/Jira templates, update `templates/registry.json`, add translation strings to `i18n/messages.json`, and run `yarn notifications:validate` for integrity checks.

## Frontend Specification

### Frontend Location & Directory Layout
Administrative tooling for notifications resides in `client/src/features/notifications`, giving operators dashboards to preview templates, inspect deliveries, and adjust preferences.【F:docs/02-technical-specifications/03-frontend-architecture.md†L96-L160】

```
client/src/features/notifications/
├── pages/
│   ├── NotificationConsolePage.tsx
│   ├── TemplatePreviewPage.tsx
│   └── DeliveryLogPage.tsx
├── components/
│   ├── ChannelToggle.tsx
│   ├── DeliveryStatusTable.tsx
│   └── TemplateMetadataForm.tsx
├── hooks/
│   ├── useNotificationMetrics.ts
│   └── useTemplateRegistry.ts
└── api/
    └── notificationsClient.ts

client/src/components/preferences/
└── NotificationPreferencesForm.tsx
```

### Reusable Components & UI Flows
- **Template Previews:** `TemplatePreviewPage` reuses `TemplateMetadataForm` and `notificationsClient` to render test payloads, applying localisation and persona tagging so preview copy reflects GTM messaging guidelines.【F:docs/01-about/07-marketing-strategy.md†L104-L210】【F:docs/02-technical-specifications/03-frontend-architecture.md†L96-L177】
- **Delivery Observability:** `DeliveryStatusTable` integrates with metrics hooks to display queue depth, failure rates, provider statuses, and webhook health, embedding drill-down links to Grafana dashboards consumed by risk and operations teams.【F:docs/01-about/10-risk-management-and-Mitigation.md†L100-L153】
- **Preference Management:** `NotificationPreferencesForm` allows users to opt in/out of channels, mirroring profile service records and validating compliance requirements around consent timestamps and GDPR alignment.【F:docs/02-technical-specifications/03-frontend-architecture.md†L123-L177】【F:docs/01-about/04-security-and-data-protection.md†L219-L259】
- **Channel Toggles & Overrides:** `ChannelToggle` components manage throttling overrides, quiet hours, and blackout windows, tying into the backend `DeliveryPolicyOverride` API and business continuity escalation tiers.【F:docs/01-about/10-risk-management-and-Mitigation.md†L123-L159】

## Schema Specification
- **`notifications_events`:** Captures inbound domain events, eligibility outcomes, scheduling metadata, and the originating subsystem reference for traceability back to governance or task workflows.【F:docs/03-systems/12-governance-engine/readme.md†L49-L60】【F:docs/03-systems/13-task-management-system/readme.md†L51-L115】
- **`notifications_deliveries`:** Stores provider message IDs, timestamps, status codes, correlation IDs, and raw payloads for audit purposes in line with immutable logging expectations.【F:docs/01-about/04-security-and-data-protection.md†L261-L312】
- **`notifications_templates`:** Tracks template versions, locales, persona tags, required context keys, and checksum validation results so marketing copy stays versioned and reviewable.【F:docs/01-about/07-marketing-strategy.md†L70-L210】
- **`notification_preferences`:** Persists user-level opt-in/out flags, preferred channels, consent timestamps, and legal basis for contact, enabling GDPR-grade auditing of communication choices.【F:docs/01-about/04-security-and-data-protection.md†L219-L259】
- **`alerts`:** Represents risk or incident alerts emitted to the notification system, linking to tasks for follow-up and aligning with the shared alerts schema described in the database design.【F:docs/02-technical-specifications/04-database-design.md†L97-L133】
- Relationships link to ServiceNow/Jira sync tables and RBAC entities to enforce channel eligibility, audit access, and SLA escalations.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L137-L210】

## Operational Playbooks & References

### Delivery Policies & Configuration
- Scheduling, throttling, and blackout windows live in `config/delivery-policies.yml`; per-user limits default to five critical notifications/hour and twenty informational notifications/day so outreach respects customer trust targets and regulatory fatigue thresholds.【F:docs/01-about/07-marketing-strategy.md†L70-L154】
- Retry policies configure attempt counts, delay strategies, and jitter per notification type. Exhausted retries escalate incidents via ServiceNow with the `notification-delivery-failure` tag, satisfying crisis-response SLAs for critical communications.【F:docs/02-technical-specifications/07-integration-architecture.md†L74-L149】【F:docs/01-about/10-risk-management-and-Mitigation.md†L123-L153】
- User preferences come from the profile service; GDPR-compliant double opt-in and consent records are mandatory for marketing-style messages, with audit logs exposed in the governance portal per security and privacy mandates.【F:docs/01-about/04-security-and-data-protection.md†L219-L312】

### Monitoring & Failure Handling
- Prometheus exports `notifications_*` metrics (queued, sent, delivered, failed, latency) powering Grafana dashboards that highlight failing templates, backlog depth, and webhook retries for the risk committee’s reporting cadence.【F:docs/01-about/10-risk-management-and-Mitigation.md†L100-L153】
- Alerts fire when failure rates spike or queue depth exceeds 5,000 for 15+ minutes, paging on-call responders with links to dashboards and runbooks outlining triage steps (provider status, deployment review, replay, RCA) that align with the incident escalation windows in the continuity plan.【F:docs/01-about/10-risk-management-and-Mitigation.md†L123-L153】
- Log retention spans 30-day hot, 180-day warm, 365-day archive storage with PII redaction; break-glass access is SIEM-monitored so that auditability remains intact during emergency access events.【F:docs/01-about/04-security-and-data-protection.md†L253-L312】

### Quality Gates & Testing
- Notification modules include Jest/Vitest suites for template rendering, channel adapters, and event schemas, executed automatically in CI alongside integration and E2E tests covering end-to-end alert delivery.【F:docs/02-technical-specifications/09-testing-and-qa.md†L141-L203】
- CI pipelines notify developers via Slack/email on failure, exercising the service itself and preventing regressions from silently shipping to production.【F:docs/02-technical-specifications/09-testing-and-qa.md†L155-L159】

### Related Documentation
- [Governance Engine](../12-governance-engine/readme.md) — Primary producer of compliance events and remediation triggers.
- [Task Management System](../13-task-management-system/readme.md) — Consumes notifications for assignments, escalations, and completion workflows.
- [Integration Architecture](../../02-technical-specifications/07-integration-architecture.md) — Adapter standards, OAuth scopes, and webhook policies for external channels.
- [Security & Data Protection](../../01-about/04-security-and-data-protection.md) — Consent, logging, and emergency access rules governing outreach.

---

[← Previous](../03-document-and-media-upload/readme.md) | [Next →](../05-admin-and-configuration-system/readme.md)
