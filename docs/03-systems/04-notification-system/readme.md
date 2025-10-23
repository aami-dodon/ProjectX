# Notification System <!-- omit in toc -->

## Location: /server/src/modules/notifications

>### TL;DR
> The notification system orchestrates outbound communication across email and enterprise collaboration channels.
> It is centered around the `server/src/modules/notifications` package, which exposes shared workflow utilities, template
> management, and channel adapters.
> This guide outlines the email delivery lifecycle, integrations with ServiceNow, Jira, and Slack, and patterns for
> extending notification coverage and observability.

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
Notification orchestration lives under `server/src/modules/notifications`, bundling event processing, template rendering, and channel dispatchers behind a consistent API surface.【F:docs/02-technical-specifications/02-backend-architecture-and-apis.md†L86-L171】

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
The notification system ensures domain events reach internal and external stakeholders using the correct channel, format, and timing. Core packages include `events`, `templates`, `channels`, `logging`, `config`, and `testing`, each handling ingestion, rendering, dispatch, and observability duties. Typical workflow phases progress from event ingestion, eligibility checks, template resolution, payload rendering, channel dispatch, to post-processing with metrics and retries.

#### Email Workflows
- **Triggering Events:** Producers publish messages to the queue through the `events` package, scheduled jobs in `schedulers` launch digests, and operators can force sends via `POST /notifications/trigger`.
- **Template Management:** Email templates (`templates/email/<locale>/<notification-type>.hbs`) register metadata in `templates/registry.json`, rely on Handlebars helpers, and expose preview endpoints for operations teams.
- **Personalisation & Rendering:** Context builders merge profile service data with event payloads, redacting sensitive fields via `maskSensitive`. Localised subjects draw from `i18n/messages.json`, and attachments land in object storage with signed links.
- **Dispatch & Delivery:** Email delivery defaults to AWS SES (override via `NOTIFICATIONS_EMAIL_PROVIDER`), reuses shared retry policies (3 attempts, exponential backoff), and normalises responses to `DeliveryResult`. Bulk sends flow through background consumers to avoid throttling.
- **Logging & Audit Trails:** Dispatches log correlation IDs, emit structured events via `notifications.logger`, and persist receipts in `notifications_deliveries`, archiving logs older than 180 days per governance rules.

### Channel Integrations
Adapters under `channels/` extend coverage beyond email:

- **ServiceNow:** OAuth 2.0 client credentials (`servicenow/notifications`) authorise incident/task APIs. High-priority incidents (`≥ P2`) and change approvals trigger notifications, with delivery results updating incidents via `/api/now/table/incident`. Nightly reconciliation verifies outstanding tasks.
- **Jira:** Personal access tokens or OAuth 1.0a credentials (`jira/notifications`) power project automation APIs. Issue transitions and sprint events broadcast updates, while failed deliveries tag issues with `notification_failed` and acknowledgements push state via webhooks.
- **Slack:** Bot tokens (`slack/bot-token`) with `chat:write`, `im:write`, `users:read`, and `channels:read` scopes post real-time alerts and daily digests. Message timestamps enable follow-up edits, and slash commands (`/notify-ack`, `/notify-snooze`) synchronise acknowledgement state.

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
- **Template Previews:** `TemplatePreviewPage` reuses `TemplateMetadataForm` and `notificationsClient` to render test payloads and surface localisation gaps before release.
- **Delivery Observability:** `DeliveryStatusTable` integrates with metrics hooks to display queue depth, failure rates, and provider statuses, embedding drill-down links to Grafana dashboards.
- **Preference Management:** `NotificationPreferencesForm` allows users to opt in/out of channels, mirroring profile service records and validating compliance requirements.
- **Channel Toggles & Overrides:** `ChannelToggle` components manage throttling overrides, quiet hours, and blackout windows, tying into the backend `DeliveryPolicyOverride` API.

## Schema Specification
- **`notifications_events`:** Captures inbound domain events, eligibility outcomes, and scheduling metadata.
- **`notifications_deliveries`:** Stores provider message IDs, timestamps, status codes, correlation IDs, and raw payloads for audit purposes.
- **`notifications_templates`:** Tracks template versions, locales, required context keys, and checksum validation results.
- **`notification_preferences`:** Persists user-level opt-in/out flags, preferred channels, and consent timestamps for compliance.
- Relationships link to ServiceNow/Jira sync tables and RBAC entities to enforce channel eligibility and audit access.

## Operational Playbooks & References

### Delivery Policies & Configuration
- Scheduling, throttling, and blackout windows live in `config/delivery-policies.yml`; per-user limits default to five critical notifications/hour and twenty informational notifications/day.
- Retry policies configure attempt counts, delay strategies, and jitter per notification type. Exhausted retries escalate incidents via ServiceNow with the `notification-delivery-failure` tag.
- User preferences come from the profile service; GDPR-compliant double opt-in and consent records are mandatory for marketing-style messages, with audit logs exposed in the governance portal.

### Monitoring & Failure Handling
- Prometheus exports `notifications_*` metrics (queued, sent, delivered, failed, latency) powering Grafana dashboards that highlight failing templates and backlog depth.
- Alerts fire when failure rates spike or queue depth exceeds 5,000 for 15+ minutes, paging on-call responders with links to dashboards and runbooks outlining triage steps (provider status, deployment review, replay, RCA).
- Log retention spans 30-day hot, 180-day warm, 365-day archive storage with PII redaction; break-glass access is SIEM-monitored.

---

[← Previous](../03-document-and-media-upload/readme.md) | [Next →](../05-admin-and-configuration-system/readme.md)
