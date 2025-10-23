# Notification System <!-- omit in toc -->

>### TL;DR
> The notification system orchestrates outbound communication across email and enterprise collaboration channels.
> It is centered around the `server/src/modules/notifications` package, which exposes shared workflow utilities, template
> management, and channel adapters.
> This guide outlines the email delivery lifecycle, integrations with ServiceNow, Jira, and Slack, and patterns for
> extending notification coverage and observability.

---

- [1. Purpose and Scope](#1-purpose-and-scope)
- [2. Architecture Overview](#2-architecture-overview)
  - [2.1 Core Packages](#21-core-packages)
  - [2.2 Workflow Phases](#22-workflow-phases)
- [3. Email Workflows](#3-email-workflows)
  - [3.1 Triggering Events](#31-triggering-events)
  - [3.2 Template Management](#32-template-management)
  - [3.3 Personalisation and Rendering](#33-personalisation-and-rendering)
  - [3.4 Dispatching and Delivery](#34-dispatching-and-delivery)
  - [3.5 Logging and Audit Trails](#35-logging-and-audit-trails)
- [4. Channel Integrations](#4-channel-integrations)
  - [4.1 ServiceNow](#41-servicenow)
  - [4.2 Jira](#42-jira)
  - [4.3 Slack](#43-slack)
- [5. Extending Notification Types](#5-extending-notification-types)
  - [5.1 Adding a New Notification Schema](#51-adding-a-new-notification-schema)
  - [5.2 Implementing Channel Strategies](#52-implementing-channel-strategies)
  - [5.3 Registering Templates and Localisations](#53-registering-templates-and-localisations)
- [6. Delivery Policies and Configuration](#6-delivery-policies-and-configuration)
  - [6.1 Scheduling and Throttling](#61-scheduling-and-throttling)
  - [6.2 Retries and Escalations](#62-retries-and-escalations)
  - [6.3 User Preferences and Compliance](#63-user-preferences-and-compliance)
- [7. Monitoring and Failure Handling](#7-monitoring-and-failure-handling)
  - [7.1 Metrics and Dashboards](#71-metrics-and-dashboards)
  - [7.2 Alerting and Runbooks](#72-alerting-and-runbooks)
  - [7.3 Log Retention and Privacy](#73-log-retention-and-privacy)

---

## 1. Purpose and Scope

The notification system ensures that domain events are communicated to internal and external stakeholders using the correct
channel, format, and timing. The `server/src/modules/notifications` package consolidates reusable utilities for triggering
notifications, rendering user-facing content, and recording delivery outcomes. This document serves as an onboarding guide
for contributors who need to operate, extend, or integrate the notification stack.

## 2. Architecture Overview

### 2.1 Core Packages

The notification module is organised around the following packages and services:

| Package / Service | Description |
| --- | --- |
| `server/src/modules/notifications/events` | Defines domain events, event-to-notification mapping rules, and orchestration pipelines. |
| `server/src/modules/notifications/templates` | Provides template registries, loaders, and helpers for multi-language rendering. |
| `server/src/modules/notifications/channels` | Channel-specific providers for email, ServiceNow, Jira, Slack, SMS, and future adapters. |
| `server/src/modules/notifications/logging` | Structured logging, correlation IDs, and audit trail utilities. |
| `server/src/modules/notifications/config` | Central configuration including delivery policies, throttles, and integration credentials. |
| `server/src/modules/notifications/testing` | Harnesses and fixtures for regression testing and contract validation. |

### 2.2 Workflow Phases

1. **Event ingestion** – domain events or scheduled jobs enqueue notification intents.
2. **Eligibility checks** – policy evaluators confirm that recipients and channels are permitted.
3. **Template selection** – content builders resolve template IDs, locales, and variant overrides.
4. **Payload rendering** – dynamic data is merged into templates and attachments are generated if required.
5. **Channel dispatch** – the channel adapter sends the notification and returns a delivery status.
6. **Post-processing** – results are persisted, metrics are emitted, and follow-up actions (retries or escalations) are queued.

## 3. Email Workflows

### 3.1 Triggering Events

- Event producers publish messages to the notification queue via the `events` package.
- Cron tasks in `server/src/modules/notifications/schedulers` initiate digest or reminder messages.
- Manual overrides can be triggered through the operations console using the REST endpoint `POST /notifications/trigger`.

### 3.2 Template Management

- Templates reside in `templates/email/<locale>/<notification-type>.hbs` and are versioned through Git.
- Layouts and partials are composed using Handlebars helpers defined in `templates/helpers.ts`.
- Every template must declare metadata (ID, locale, subject, required context keys) in `templates/registry.json`.
- The registry is validated on boot. Invalid or missing templates emit structured warnings and are excluded from dispatch.
- Preview endpoints (`GET /notifications/templates/:id/preview`) allow operations teams to verify rendering with sample data.

### 3.3 Personalisation and Rendering

- Context builders pull profile data from the user service, and merge it with event payloads.
- Sensitive fields (PII, secrets) must be redacted using the `maskSensitive` helper before they are injected into templates.
- Email subjects and preheaders support localisation by mapping to language-specific keys stored in `i18n/messages.json`.
- Attachments are generated asynchronously and stored in the object store; the email body contains signed download links.

### 3.4 Dispatching and Delivery

- SMTP delivery defaults to AWS SES but can be switched per environment using `NOTIFICATIONS_EMAIL_PROVIDER`.
- All outbound requests use the shared retry policy (3 attempts, exponential backoff starting at 15 seconds).
- Responses are normalised to `DeliveryResult` objects that include provider message IDs, timestamps, and status codes.
- Bulk sends route through the background worker (`notifications-email-consumer`) to prevent API rate limit breaches.

### 3.5 Logging and Audit Trails

- Each email dispatch logs a correlation ID that links back to the originating domain event.
- Success, retry, and failure outcomes are emitted to the observability pipeline via `notifications.logger`.
- Delivery receipts are captured and stored in `notifications_deliveries` with the raw provider payload for later auditing.
- Logs older than 180 days are archived to cold storage in compliance with governance policies.

## 4. Channel Integrations

### 4.1 ServiceNow

**Authentication**
- Supports OAuth 2.0 client credentials with scopes limited to incident and task APIs.
- Credentials are stored in the secrets manager under `servicenow/notifications` and rotated every 90 days.

**Event Triggers**
- Incidents created or updated with priority ≥ P2 emit `IncidentEscalated` events mapped to ServiceNow notifications.
- Change management workflows trigger updates when approvals are due or overdue.

**Synchronization Behaviour**
- Delivery results update the originating ServiceNow incident via the `/api/now/table/incident` endpoint with a comment and
  custom field indicating the notification status.
- A nightly reconciliation job confirms that all pending ServiceNow tasks have matching notification records.

### 4.2 Jira

**Authentication**
- Uses PAT (Personal Access Token) or OAuth 1.0a depending on deployment; tokens are scoped to project automation APIs.
- The token alias `jira/notifications` is loaded through the shared credentials provider at runtime.

**Event Triggers**
- Issue transitions to statuses such as `Blocked`, `Ready for Review`, or `Done` create notifications for assigned users.
- Sprint events (start/end) broadcast digest updates to watchers using batched email and Slack notifications.

**Synchronization Behaviour**
- Notification delivery updates Jira issues by posting to the `/rest/api/3/issue/{key}/comment` endpoint.
- Failed deliveries add a label (`notification_failed`) so project leads can audit follow-up actions.
- State changes triggered through notification acknowledgements (e.g., approve/reject links) are pushed back to Jira via webhooks.

### 4.3 Slack

**Authentication**
- Uses OAuth 2.0 bot tokens stored under `slack/bot-token` in the secrets manager.
- Tokens require the scopes `chat:write`, `im:write`, `users:read`, and `channels:read`.

**Event Triggers**
- Real-time events (critical incidents, policy approvals) push to dedicated channels configured in `slack.channels.json`.
- Daily digests combine lower-priority updates and are scheduled through the digest worker.

**Synchronization Behaviour**
- Delivery statuses are captured using Slack's `chat.postMessage` response metadata and stored for analytics.
- Message timestamps are saved so follow-up edits or deletions can be issued when notifications are acknowledged elsewhere.
- Slash commands (`/notify-ack`, `/notify-snooze`) feed back into the notification API, updating the master delivery record.

## 5. Extending Notification Types

### 5.1 Adding a New Notification Schema

1. Define a domain event payload in `events/schemas` with strict typing and validation rules.
2. Register the schema in `events/index.ts`, mapping it to the channels and templates that should respond.
3. Update the notification type enum (`NotificationType`) to include the new identifier and add documentation comments.

### 5.2 Implementing Channel Strategies

1. Extend `channels/<channel>/strategies.ts` with a handler implementing the shared `ChannelStrategy` interface.
2. Map the new notification type to the handler in the channel registry.
3. Provide any channel-specific configuration (webhook URLs, queue names) in `config/channels.yml`.

### 5.3 Registering Templates and Localisations

1. Create email templates and optional Slack/Jira message templates with consistent placeholder names.
2. Update `templates/registry.json` to register each locale-specific variant.
3. Add translation strings to `i18n/messages.json` and run `yarn notifications:validate` to ensure integrity.

## 6. Delivery Policies and Configuration

### 6.1 Scheduling and Throttling

- Scheduling rules live in `config/delivery-policies.yml` and support cron expressions, quiet hours, and blackout windows.
- The throttling engine enforces per-user and per-channel rate limits. Defaults: max 5 critical notifications per hour per user,
  max 20 informational notifications per day per user.
- Bulk operations (imports, migrations) can request temporary overrides via the `DeliveryPolicyOverride` API.

### 6.2 Retries and Escalations

- Retry policies can be tuned per notification type with settings for attempt count, delay strategy, and jitter.
- Escalation rules promote unresolved incidents to alternative channels (e.g., from email to Slack DM) after configurable
  timeouts.
- When retries exhaust, the system opens an incident in ServiceNow tagged with `notification-delivery-failure`.

### 6.3 User Preferences and Compliance

- User-level preferences stored in the profile service dictate opt-in/out status and preferred channels.
- GDPR compliance requires double opt-in for marketing-style notifications and explicit consent records per locale.
- Audit logs capture changes to delivery preferences and can be queried through the governance portal.

## 7. Monitoring and Failure Handling

### 7.1 Metrics and Dashboards

- Core metrics (queued, sent, delivered, failed, latency) are exported to Prometheus with the `notifications_*` prefix.
- Grafana dashboards visualise channel performance, top failing templates, and backlog depth.
- Custom dimensions (notification type, environment, provider) enable drill-down during incident response.

### 7.2 Alerting and Runbooks

- Alert rules trigger when failure rates exceed thresholds or when queue depth stays above 5,000 for more than 15 minutes.
- On-call rotations receive PagerDuty alerts with deep links to relevant Grafana dashboards and runbook pages.
- Runbooks outline triage steps: validate provider status, review recent deployments, replay failed messages, and file RCA.

### 7.3 Log Retention and Privacy

- Structured logs stream to the central log platform with retention of 30 days hot, 180 days warm, 365 days archived.
- PII redaction policies apply to logs, ensuring sensitive content is masked before leaving the application boundary.
- Access to archived logs requires break-glass approval and is monitored via security information and event management (SIEM).
