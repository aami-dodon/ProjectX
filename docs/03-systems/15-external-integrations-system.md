# External Integrations System <!-- omit in toc -->

## Location: /server/src/integrations

>### TL;DR
> This document catalogs Project X's third-party integrations, covering supported connectors, authentication models, data synchronization patterns, and operational runbooks.
> For every integration we highlight configuration steps, environment variables, failure-handling playbooks, and how the connector ties into notifications, tasks, and evidence lifecycle.
> Use this reference when onboarding new environments, planning releases, or troubleshooting production incidents.

---

- [1. System Overview](#1-system-overview)
- [2. Integration Inventory](#2-integration-inventory)
  - [2.1 ServiceNow ITSM](#21-servicenow-itsm)
  - [2.2 Atlassian Jira](#22-atlassian-jira)
  - [2.3 OneTrust GRC](#23-onetrust-grc)
  - [2.4 Slack Workspace](#24-slack-workspace)
  - [2.5 Email + Webhook Bridge](#25-email--webhook-bridge)
  - [2.6 Evidence Repository Providers](#26-evidence-repository-providers)
- [3. Cross-Cutting Patterns](#3-cross-cutting-patterns)
  - [3.1 Authentication Models](#31-authentication-models)
  - [3.2 Synchronization and Scheduling](#32-synchronization-and-scheduling)
  - [3.3 Error Detection and Failure Handling](#33-error-detection-and-failure-handling)
  - [3.4 Notifications, Tasks, and Evidence Mapping](#34-notifications-tasks-and-evidence-mapping)
- [4. Environment Configuration Matrix](#4-environment-configuration-matrix)
- [5. Testing and Rollout Strategy](#5-testing-and-rollout-strategy)
- [6. Operational Runbooks](#6-operational-runbooks)
  - [6.1 Daily Checks](#61-daily-checks)
  - [6.2 Incident Response Escalation](#62-incident-response-escalation)
  - [6.3 Change Management Checklist](#63-change-management-checklist)

---

## 1. System Overview

Project X integrates with external governance, collaboration, and evidence systems to enrich policy automation and audit workflows. Integrations adhere to the following principles:

- **Security-first authentication** with short-lived tokens, scoped permissions, and centralized secret storage.
- **Deterministic synchronization** leveraging idempotent polling jobs or event-driven webhooks to prevent duplicate tasks.
- **Modular adapter architecture** where each connector implements the same interface for credentials, fetch, push, and reconciliation methods.
- **Observability** through structured logging, integration-specific metrics, and alert thresholds for synchronization lag, API failures, and payload validation errors.

## 2. Integration Inventory

### 2.1 ServiceNow ITSM

**Use Cases**
- Import incident, change, and request tickets to seed risk assessments.
- Push remediation tasks from automated controls back into ServiceNow for tracking.
- Sync configuration item (CI) ownership metadata into the asset catalog.

**Authentication Model**
- OAuth 2.0 client credentials flow with dedicated integration user.
- Token scope limited to `incident`, `change_request`, `task`, and `cmdb_ci` tables.
- Secrets stored in HashiCorp Vault under `integrations/servicenow` path with automated rotation every 30 days.

**Configuration Steps**
1. Create an integration user in ServiceNow with `itil` and `rest_service` roles.
2. Register an OAuth API endpoint in ServiceNow, noting the client ID and secret.
3. Populate the following environment variables (per environment) and restart the integration workers:
   - `SERVICENOW_BASE_URL`
   - `SERVICENOW_OAUTH_CLIENT_ID`
   - `SERVICENOW_OAUTH_CLIENT_SECRET`
   - `SERVICENOW_USER`
   - `SERVICENOW_PASSWORD` *(fallback for token bootstrap; rotated every 90 days)*
4. Configure the sync schedule in the Integration Control Plane (ICP) UI to poll incidents every 5 minutes and change requests every 15 minutes.
5. Enable outbound webhooks for task updates (REST message definition) pointing to `/api/integrations/servicenow/webhook`.

**Failure Handling**
- Automatic retry with exponential backoff (up to 5 attempts) on HTTP 5xx.
- On 401/403 responses, trigger a token refresh; after two failures, page the on-call via PagerDuty.
- Payload validation errors create an internal alert (Severity Medium) with the rejected record attached as evidence.
- Database reconciliation job runs nightly to detect orphaned ServiceNow tasks and queue re-sync operations.

**Integration with Notifications / Tasks / Evidence**
- New ServiceNow incidents create high-priority review tasks assigned to risk analysts.
- Task updates (state changes, assignment) propagate to Project X's task board via the shared task service.
- Attachments from ServiceNow are mirrored into the Evidence Library, tagged with `source:servicenow` and related control IDs.
- Notifications: Slack channel `#alerts-servicenow` receives summaries of sync anomalies and new P1 incidents.

### 2.2 Atlassian Jira

**Use Cases**
- Two-way synchronization of engineering remediation tickets.
- Publishing compliance program epics and linking sub-tasks to controls.
- Importing story points and sprint velocity data for operational analytics.

**Authentication Model**
- OAuth 2.0 (3LO) with offline access, storing refresh tokens per environment.
- For server/DC deployments, personal access tokens (PAT) supported as a fallback.
- Secrets stored in Vault `integrations/jira/{env}` with audit logging enabled.

**Configuration Steps**
1. Register a Jira OAuth app; capture client ID, secret, redirect URI (`https://<projectx>/oauth/callback/jira`).
2. In Project X admin UI, authorize the workspace; the ICP stores the refresh token automatically.
3. Define project mappings (Project X program → Jira project keys) within the Integration Mapping panel.
4. Configure environment variables:
   - `JIRA_BASE_URL`
   - `JIRA_OAUTH_CLIENT_ID`
   - `JIRA_OAUTH_CLIENT_SECRET`
   - `JIRA_WEBHOOK_SECRET`
5. Set up Jira webhooks for issue created/updated/deleted events pointing to `/api/integrations/jira/webhook`.
6. For PAT mode, set `JIRA_AUTH_MODE=pat` and provide `JIRA_PAT` and `JIRA_USER_EMAIL`.

**Failure Handling**
- Queue-based retry for webhook deliveries with dead-letter queue after 10 attempts.
- Detect and reconcile deleted issues via nightly full sync (flag `ENABLE_JIRA_DELTA_RECON=true`).
- Permission errors surface as actionable alerts in the Integration Health dashboard with guidance to re-run the OAuth flow.
- Rate limit responses (429) trigger adaptive throttling; backlog metrics feed Prometheus alert `jira_sync_backlog`.

**Integration with Notifications / Tasks / Evidence**
- Jira issues map to Project X remediation tasks, preserving labels and assignees.
- Sprint completion triggers notifications to compliance program owners summarizing outstanding tasks.
- Attachments and comments relevant to compliance controls are copied to Evidence Library with bi-directional links.
- Slack integration posts to `#compliance-delivery` on failed syncs or when critical Jira epics move to "Done".

### 2.3 OneTrust GRC

**Use Cases**
- Import privacy impact assessments (PIAs) and risk registers.
- Synchronize vendor assessments to maintain third-party risk posture.
- Export control attestations back into OneTrust for audit.

**Authentication Model**
- API token-based authentication using OneTrust Service Accounts.
- Tokens scoped to modules: Assessments, Risks, Vendors, and Controls.
- Stored in Vault `integrations/onetrust` with automated expiry checks (tokens valid for 1 year).

**Configuration Steps**
1. Provision a OneTrust service account and assign necessary module permissions.
2. Generate an API token via OneTrust admin console.
3. Populate environment variables:
   - `ONETRUST_BASE_URL`
   - `ONETRUST_API_TOKEN`
   - `ONETRUST_REGION` *(e.g., `us`, `eu`)*
   - `ONETRUST_TIMEOUT_SECONDS` *(defaults to 30)*
4. Configure data domain mappings (PIA → Program, Vendor → Third-Party Catalog) in ICP.
5. Enable scheduled imports (recommended: every 6 hours) and configure deduplication rules (use OneTrust external IDs).

**Failure Handling**
- 401 responses trigger immediate token rotation workflow; integration pauses while awaiting new credentials.
- Validation errors log to Evidence Library as rejected payloads; operations review weekly.
- Timeout or network failures escalate to InfoSec after three consecutive occurrences.
- Stale data detection: if no successful sync in 24 hours, status light turns red and triggers Slack alert.

**Integration with Notifications / Tasks / Evidence**
- Imported PIAs create review tasks for privacy officers with due dates driven by PIA risk level.
- Vendor issues generate alerts to vendor management Slack channel and create follow-up questionnaires.
- Evidence snapshots (e.g., PIA PDFs) stored in the Evidence Library, linked to regulatory requirements.
- Completion of remediation actions in Project X exports control attestations to OneTrust via scheduled jobs.

### 2.4 Slack Workspace

**Use Cases**
- Deliver real-time alerts for integration health, audit tasks, and policy changes.
- Collect evidence and approvals via Slack actions.
- Support chatbot-style queries into compliance status.

**Authentication Model**
- Slack OAuth 2.0 (Bot token) with granular scopes: `chat:write`, `commands`, `users:read`, `files:write`, `channels:read`.
- Signing secrets stored in Vault `integrations/slack`.

**Configuration Steps**
1. Create a Slack app per workspace; enable Event Subscriptions and Interactivity.
2. Set redirect URL to `https://<projectx>/oauth/callback/slack` and install the app.
3. Configure environment variables:
   - `SLACK_CLIENT_ID`
   - `SLACK_CLIENT_SECRET`
   - `SLACK_SIGNING_SECRET`
   - `SLACK_BOT_TOKEN`
   - `SLACK_APP_LEVEL_TOKEN` *(for Socket Mode, optional)*
4. Define default channels in the Notification Routing table (e.g., `alerts-servicenow`, `compliance-delivery`).
5. Enable command handlers (`/projectx-task`, `/projectx-evidence`) in the admin console.

**Failure Handling**
- Event delivery failures log to the Notification Service; retries scheduled with jitter (max 6 attempts).
- Expired tokens prompt admin notification with link to reinstall the app.
- Slack rate limits handled via `Retry-After` header; backlog metrics exported to Prometheus.
- File upload errors generate fallback email notifications to ensure evidence collection continuity.

**Integration with Notifications / Tasks / Evidence**
- All integration alerts funnel through Slack channels for immediate visibility.
- Task assignments trigger direct messages to assignees with contextual deep links.
- Evidence requests allow users to upload files via Slack modal; files stored in Evidence Library with metadata referencing the originating control.
- Slack actions (approve/deny) update task status and trigger downstream notifications.

### 2.5 Email + Webhook Bridge

**Use Cases**
- Support partners without native API support through templated emails or generic webhooks.
- Provide fallback notifications when Slack is unavailable.

**Authentication Model**
- SMTP credentials stored securely; webhook endpoints protected via HMAC signatures.

**Configuration Steps**
1. Configure SMTP relay (e.g., SendGrid) and set environment variables:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USERNAME`
   - `SMTP_PASSWORD`
   - `SMTP_FROM_ADDRESS`
2. For webhooks, define shared secret `GENERIC_WEBHOOK_SECRET` and register endpoints with trusted partners.
3. Map inbound email addresses to integration adapters (e.g., `servicenow-ingest@projectx.io`).
4. Enable parsing templates for supported payloads; configure in ICP via `Email Bridge` section.

**Failure Handling**
- Bounce or delivery failures raise alerts in Notification Service and attempt resend after 10 minutes.
- HMAC signature mismatches reject payloads and notify security team.
- Email parsing errors stored in quarantine queue for manual review.

**Integration with Notifications / Tasks / Evidence**
- Email-based submissions create evidence records tagged with source email and attachments.
- Webhook bridge can create tasks or comments based on payload type.
- Failure alerts propagate to Slack and email distribution lists.

### 2.6 Evidence Repository Providers

**Use Cases**
- Connect to third-party storage (AWS S3, Google Drive, SharePoint) for evidence ingestion and archival.

**Authentication Model**
- S3: IAM role assumption using AWS STS and service-linked roles.
- Google Drive: Service Account with delegated domain-wide authority.
- SharePoint: Azure AD app with `Files.ReadWrite.All` permission and certificate-based auth.

**Configuration Steps**
- **AWS S3**
  1. Create IAM role `ProjectXEvidenceRole` with trust relationship for Project X integration account.
  2. Set environment variables: `EVIDENCE_S3_BUCKET`, `AWS_ROLE_ARN`, `AWS_EXTERNAL_ID`.
  3. Configure bucket policies for least privilege (GetObject, PutObject, ListBucket).
- **Google Drive**
  1. Create service account and upload JSON key to Vault; set `GOOGLE_APPLICATION_CREDENTIALS` path.
  2. Enable Drive API and grant access to evidence folders.
  3. Set `EVIDENCE_GOOGLE_DRIVE_FOLDER_ID`.
- **SharePoint**
  1. Register Azure AD app; upload certificate; capture `CLIENT_ID`, `TENANT_ID`, `CERT_PATH`.
  2. Configure site and document library IDs via `SHAREPOINT_SITE_ID`, `SHAREPOINT_LIBRARY_ID`.
  3. Store certificate password in Vault and reference via `SHAREPOINT_CERT_PASSWORD`.

**Failure Handling**
- Storage quota alerts escalate to operations and pause ingestion for affected provider.
- Permission errors generate actionable tasks to update access policies.
- Upload/download retries (3 attempts) before raising error events.

**Integration with Notifications / Tasks / Evidence**
- Evidence ingestion pipelines normalize metadata and link to controls.
- Notifications inform control owners when new evidence arrives or if ingestion fails.
- Tasks auto-generate for expiring evidence requiring renewal.

## 3. Cross-Cutting Patterns

### 3.1 Authentication Models

- **Central Secret Management**: All credentials stored in Vault; integration workers retrieve secrets using short-lived Vault tokens derived from Kubernetes service accounts.
- **Rotation Schedules**: OAuth tokens refreshed automatically; static tokens rotated at least every 90 days. Rotation events logged to Audit Trail.
- **Access Governance**: Integration service accounts managed via least privilege roles; access requests require security approval.

### 3.2 Synchronization and Scheduling

- **Polling Jobs**: Managed via Quartz scheduler; each job configured with jitter to avoid thundering herd and supports pause/resume.
- **Webhooks**: Preferred for near-real-time updates. Incoming payloads validated via signatures and schema enforcement.
- **Delta Tracking**: Connectors maintain `last_seen_at` cursors stored in PostgreSQL to ensure idempotent processing.
- **Reconciliation Jobs**: Nightly jobs compare external state vs. Project X; discrepancies create tasks or automatically heal.

### 3.3 Error Detection and Failure Handling

- **Observability Stack**: Metrics exported to Prometheus (`integration_status`, `sync_latency_seconds`, `webhook_failures_total`), logs shipped to ELK with integration tags.
- **Alerting**: Alertmanager routes integration incidents to Slack and PagerDuty based on severity.
- **Circuit Breakers**: After repeated failures, connectors enter degraded mode, pausing outbound writes while allowing inbound reads.
- **Runbook Links**: Each connector references runbook IDs (see Section 6) surfaced in alerts for quick remediation.

### 3.4 Notifications, Tasks, and Evidence Mapping

- **Notification Router**: Integration events publish to the Notification Service, which fans out to Slack, email, or in-app alerts based on routing rules.
- **Task Orchestrator**: External tickets and assessments map to internal task objects; status updates propagate bi-directionally.
- **Evidence Library**: All external files ingested undergo virus scanning, metadata extraction, and classification before being linked to controls and audit trails.
- **Audit Logging**: Every external interaction (pull/push) logs correlation IDs enabling traceability across notifications, tasks, and evidence records.

## 4. Environment Configuration Matrix

| Environment | Vault Path Prefix | Sync Frequency Overrides | Notification Channels | Additional Notes |
|-------------|-------------------|---------------------------|-----------------------|------------------|
| Local       | `integrations/dev`| Reduced cadence (ServiceNow 15m, Jira 30m) | Developer DM, test Slack workspace | Use sandbox instances; mock evidence storage. |
| Staging     | `integrations/stg`| Match production minus high-risk jobs (OneTrust 12h) | `#stg-integrations`, PagerDuty test service | Run smoke tests on deploy; enable verbose logging. |
| Production  | `integrations/prod`| Full cadence (ServiceNow 5m, Jira 5m, OneTrust 6h) | `#alerts-*`, PagerDuty primary | Enforce change window approvals; enable circuit breakers. |

Environment variable secrets are injected via Kubernetes secrets referencing Vault. Non-secret configuration (e.g., polling interval) managed via ConfigMaps and Feature Flags Service.

## 5. Testing and Rollout Strategy

1. **Connector Unit Tests**: Mock external APIs using WireMock; validate authentication handlers, payload schemas, and retry logic.
2. **Integration Sandbox Testing**: Execute end-to-end flows against vendor sandboxes before enabling in staging. Document expected API limits and edge cases.
3. **Contract Testing**: Maintain JSON Schema contracts for webhook payloads; run during CI to prevent breaking changes.
4. **Staging Verification**:
   - Run smoke job to import/export sample records.
   - Validate notifications (Slack, email) and task creation.
   - Verify evidence attachments stored correctly and accessible.
5. **Progressive Rollout**:
   - Enable feature flag `integration.<name>.enabled` for pilot teams.
   - Monitor metrics (`sync_latency_seconds`, `webhook_failures_total`) for 24 hours.
   - Expand to full org after success criteria met.
6. **User Acceptance**: Collect feedback from compliance owners and adjust mappings before production go-live.
7. **Post-Deployment Review**: After rollout, review logs, metrics, and runbook actions; capture lessons learned.

## 6. Operational Runbooks

### 6.1 Daily Checks

- Review Integration Health dashboard for red/yellow indicators.
- Validate that the most recent sync timestamp for each connector is < 2× the scheduled interval.
- Spot-check tasks/evidence records created in the last 24 hours for accuracy.
- Ensure notification queues are draining (no backlog > 100 messages).

### 6.2 Incident Response Escalation

1. Assess severity based on impacted connectors and data criticality.
2. Notify on-call via PagerDuty; provide correlation IDs and recent log excerpts.
3. Follow connector-specific runbooks (ServiceNow RB-002, Jira RB-003, OneTrust RB-004, Slack RB-005).
4. Communicate status updates in `#incident-bridge`; document timeline for post-incident review.
5. After resolution, trigger reconciliation job and monitor for regression.

### 6.3 Change Management Checklist

- Submit change request including scope, environments, and rollback plan.
- Obtain approvals from Security, Compliance, and Platform leads.
- Schedule deployment during approved window; announce to stakeholders.
- Execute configuration changes using infrastructure-as-code (Terraform/Helm) for traceability.
- Post-change validation: run smoke tests, verify notifications/tasks, update runbook if required.
- Archive change artifacts in Evidence Library tagged `change-management`.

---

[← Previous](14-dashboard-and-reporting-system.md) | [Next →](readme.md)
