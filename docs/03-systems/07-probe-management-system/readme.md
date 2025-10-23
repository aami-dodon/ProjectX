# Probe Management System <!-- omit in toc -->

## Location: /server/src/modules/probes

>### TL;DR
> The Probe Management System orchestrates how evidence-collection probes are registered, deployed, scheduled, and monitored across environments.
> It exposes a Probe SDK (implemented in `server/src/modules/probes`) that standardizes authentication, retries, payload schemas, and version negotiation.
> This guide explains lifecycle workflows, API contracts, configuration patterns, and operational practices for integrating probes with enterprise systems such as infrastructure logging platforms, data lakes, and CI/CD pipelines.

---

- [Location: /server/src/modules/probes](#location-serversrcmodulesprobes)
- [1. Purpose and Scope](#1-purpose-and-scope)
- [2. System Components](#2-system-components)
  - [2.1 Registry Service](#21-registry-service)
  - [2.2 Deployment Coordinator](#22-deployment-coordinator)
  - [2.3 Scheduler and Execution Plane](#23-scheduler-and-execution-plane)
  - [2.4 Observability and Alerting](#24-observability-and-alerting)
- [3. Probe Lifecycle](#3-probe-lifecycle)
  - [3.1 Registration Workflow](#31-registration-workflow)
  - [3.2 Deployment Pipeline](#32-deployment-pipeline)
  - [3.3 Scheduling Strategies](#33-scheduling-strategies)
- [4. Probe SDK APIs (`server/src/modules/probes`)](#4-probe-sdk-apis-serversrcmodulesprobes)
  - [4.1 Core Classes](#41-core-classes)
  - [4.2 REST Endpoints](#42-rest-endpoints)
  - [4.3 Event Contracts](#43-event-contracts)
- [5. Platform Behaviors](#5-platform-behaviors)
  - [5.1 Authentication and Secrets](#51-authentication-and-secrets)
  - [5.2 Retry Semantics](#52-retry-semantics)
  - [5.3 Versioning and Compatibility](#53-versioning-and-compatibility)
- [6. Integration Scenarios](#6-integration-scenarios)
  - [6.1 Infrastructure Logs](#61-infrastructure-logs)
  - [6.2 Data Lakes and Warehouses](#62-data-lakes-and-warehouses)
  - [6.3 CI/CD Hooks](#63-cicd-hooks)
- [7. Environment Configuration](#7-environment-configuration)
  - [7.1 Parameterizing Probe Deployments](#71-parameterizing-probe-deployments)
  - [7.2 Mapping Evidence to Checks and Controls](#72-mapping-evidence-to-checks-and-controls)
- [8. Monitoring Probe Health](#8-monitoring-probe-health)
  - [8.1 Failure Detection](#81-failure-detection)
  - [8.2 Alerting Playbooks](#82-alerting-playbooks)
  - [8.3 Continuous Improvement Loop](#83-continuous-improvement-loop)
- [9. Appendix: Quick Reference Tables](#9-appendix-quick-reference-tables)
  - [Lifecycle States](#lifecycle-states)
  - [SDK Utility Methods](#sdk-utility-methods)

---

## 1. Purpose and Scope

The Probe Management System enables automated, policy-driven evidence collection for AI governance.
It defines how probes are registered, deployed, scheduled, and monitored, while ensuring data is mapped to the platform's checks and controls for compliance scoring.
This document targets platform engineers, integration teams, and partner developers building or operating probes via the Probe SDK.

## 2. System Components

### 2.1 Registry Service
- Persists probe metadata (ID, owner, framework bindings, supported evidence types, current version) in the `probes` table described in the database design.
- Exposes administrative APIs (`/api/probes`) for CRUD operations and lifecycle transitions (draft → active → deprecated).
- Issues API credentials and signing keys for each probe instance and enforces RBAC scopes via Casbin policies.
- Stores environment overlays (local, staging, production) so deployments can be generated consistently.

### 2.2 Deployment Coordinator
- Generates deployment manifests (Docker image refs, runtime arguments, secrets) from registry templates and environment overlays.
- Integrates with the CI/CD pipeline to build probe artifacts, tag them with semantic versions, and push them to the artifact repository.
- Publishes deployment intents to the orchestration plane (Kubernetes Jobs/CronJobs, Lambda functions, or VM agents) through the `ProbeDeploymentService` utility class.
- Records deployment state transitions (queued, running, succeeded, failed) and links results back to the registry for auditability.

### 2.3 Scheduler and Execution Plane
- Maintains schedules using a hybrid approach:
  - Cron-like recurring tasks stored in the scheduler queue.
  - Event-driven triggers derived from webhook subscriptions or CI/CD events.
  - On-demand executions initiated through the admin console or API.
- Leverages the `ProbeScheduler` module to translate schedule definitions into orchestration primitives (Kubernetes CronJob specs, Airflow DAGs, or serverless invocations).
- Provides execution sandboxes with scoped credentials and network policies to isolate probes per tenant and environment.

### 2.4 Observability and Alerting
- Streams heartbeat, status, and metric events into the observability pipeline (OpenTelemetry collectors feeding Prometheus + Loki).
- Normalizes logs with probe identifiers and control mappings to support search and correlation.
- Emits health signals to the monitoring system, enabling proactive detection of failures or drift.

## 3. Probe Lifecycle

### 3.1 Registration Workflow
1. **Proposal:** Engineers register a probe via `/api/probes` or the admin UI, supplying metadata, evidence schema, and supported frameworks.
2. **Validation:** The `ProbeValidationService` validates schema definitions, required capabilities, and authentication modes before accepting the probe.
3. **Approval:** Governance admins review the submission, assign ownership, and approve deployment environments.
4. **Credential Issuance:** On approval, the registry issues API keys or mTLS certificates scoped to the probe and environment.
5. **Activation:** The probe transitions to the `active` state, allowing deployments and schedule binding.
6. **Deprecation:** Deprecated probes retain historical evidence but cannot initiate new runs; replacement probes inherit schedules where applicable.

### 3.2 Deployment Pipeline
1. **Artifact Build:** Probe source is built via CI, packaged into a container or serverless bundle, and version-tagged (e.g., `probe-snowflake@2.1.0`).
2. **Manifest Generation:** Deployment Coordinator merges probe defaults with environment-specific overrides (`PROBE_ENV`, API endpoints, secrets references).
3. **Preflight Checks:** The SDK's `ProbeHealthClient` executes `selfTest()` to validate connectivity and schema compliance before rollout.
4. **Rollout:** Scheduler applies manifests to target environments; progress is tracked through deployment events.
5. **Post-Deployment Verification:** Health checks confirm heartbeats and sample payload ingestion; results recorded in the audit log.
6. **Rollback:** If verification fails, the coordinator rolls back to the previous stable version and alerts probe owners.

### 3.3 Scheduling Strategies
- **Time-Based:** Cron expressions (`0 */2 * * *`) define periodic evidence collection; stored per environment to reflect differing SLAs.
- **Event-Driven:** SDK exposes `registerEventTrigger()` to listen to webhook topics (e.g., `ci.pipeline.completed`) and queue executions.
- **Ad-Hoc:** Investigators can invoke `/api/probes/:id/run` with parameters for targeted checks or remediation follow-up.
- **Priority Queues:** Scheduler prioritizes runs based on risk tier, regulatory deadlines, or upstream alerts.

## 4. Probe SDK APIs (`server/src/modules/probes`)

### 4.1 Core Classes
| Class | Responsibility |
| --- | --- |
| `ProbeClient` | Authenticates requests, signs payloads, and exposes `submitEvidence()` / `submitHeartbeat()` helpers. |
| `ProbeScheduler` | Registers schedules and triggers with the central scheduler service. |
| `ProbeHealthClient` | Performs preflight tests, health checks, and dependency diagnostics via `selfTest()` and `reportStatus()`. |
| `ProbeConfigLoader` | Resolves configuration overlays (environment variables, remote config) and merges them into runtime settings. |
| `ProbeVersionManager` | Negotiates SDK/runtime versions, enforces minimum compatibility, and exposes `getSupportedVersions()`. |

### 4.2 REST Endpoints
| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/probes` | `POST` | Register a new probe; accepts metadata, evidence schema, and default schedule definitions. |
| `/api/probes/:probeId` | `PATCH` | Update probe metadata, rotate credentials, or change lifecycle state. |
| `/api/probes/:probeId/deployments` | `POST` | Trigger deployment to a specified environment and version. |
| `/api/probes/:probeId/schedules` | `PUT` | Define or update cron/event schedules tied to framework controls. |
| `/api/probes/:probeId/run` | `POST` | Launch an ad-hoc execution with optional scope filters (system, project, framework). |
| `/api/probes/:probeId/metrics` | `GET` | Retrieve heartbeat metrics, last run status, and failure counts for monitoring dashboards. |

### 4.3 Event Contracts
- **Heartbeat Event (`probe.heartbeat.v1`):** Emitted by `submitHeartbeat()`; includes probe ID, version, environment, and latency metrics.
- **Evidence Event (`probe.evidence.v1`):** Triggered by `submitEvidence()` after schema validation; contains control mappings, payload hash, and storage references.
- **Failure Event (`probe.failure.v1`):** Published when retries are exhausted; consumed by alerting workflows for escalation.
- **Deployment Event (`probe.deployment.v1`):** Broadcast during rollout phases to synchronize UI state and audit logs.

## 5. Platform Behaviors

### 5.1 Authentication and Secrets
- Probes authenticate via signed JWTs or mTLS; credentials issued per environment and rotated automatically every 30 days.
- The SDK loads secrets from environment variables or vault integrations (AWS Secrets Manager, HashiCorp Vault).
- All outbound requests sign payloads with SHA-256 HMAC headers; server verifies signatures before accepting evidence.
- Admins can revoke credentials instantly, forcing probes to re-register or fetch updated secrets.

### 5.2 Retry Semantics
- Network requests implement exponential backoff with jitter (initial delay 2s, max 2m, 5 attempts) and circuit breaker protection.
- Idempotency keys prevent duplicate evidence ingestion during retries.
- Scheduler retries failed runs based on failure class: transient (3 retries), systemic (1 retry, escalate), validation (no retry, mark failed).
- Probes emit failure diagnostics in structured JSON to support forensic analysis.

### 5.3 Versioning and Compatibility
- Semantic versioning governs both probes (`major.minor.patch`) and the SDK runtime.
- `ProbeVersionManager` enforces minimum SDK versions per environment; incompatible probes are blocked during registration.
- Deployments require explicit version targets; canary mode allows `n%` traffic to the new version before full rollout.
- Deprecated probes remain readable for historical evidence but cannot submit new data once the sunset date passes.

## 6. Integration Scenarios

### 6.1 Infrastructure Logs
- Deploy probes adjacent to log aggregation stacks (e.g., CloudWatch, Stackdriver, ELK) to ingest security and access logs.
- Configure collectors to filter events by governance-relevant fields (principal, resource, action) and map them to controls like `LOGGING-INTEGRITY`.
- Use event-driven schedules triggered by log ingestion pipelines to minimize latency and support near real-time compliance dashboards.

### 6.2 Data Lakes and Warehouses
- Probes connect to Snowflake, BigQuery, or Delta Lake using read-only service accounts.
- Apply row-level filters and column whitelists defined in the probe configuration to respect data minimization principles.
- Schedule nightly scans to validate retention policies, access controls, and schema drift; map findings to data governance checks.
- Cache metadata locally to reduce load; rely on SDK retries to handle transient warehouse throttling.

### 6.3 CI/CD Hooks
- Integrate probes into CI/CD pipelines (GitHub Actions, GitLab CI, Jenkins) via webhooks or pipeline tasks.
- Trigger ad-hoc runs when models are promoted, infrastructure templates change, or security scans complete.
- Enforce release gates: pipelines verify probe results (e.g., `probe.failureCount == 0`) before allowing production deployments.
- Store pipeline context (commit SHA, artifact IDs) with evidence payloads for traceability.

## 7. Environment Configuration

### 7.1 Parameterizing Probe Deployments
- Maintain `.env.dev`, `.env.staging`, `.env.prod` overlays for each probe mirroring the platform's environment guide.
- Use the SDK's `ProbeConfigLoader` to merge shared defaults with environment-specific overrides (API base URLs, tenant IDs, credential paths).
- Annotate deployments with environment labels (`env=staging`, `region=eu-west-1`) to aid routing and observability.
- Automate configuration drift detection by comparing deployed manifests against registry templates during health checks.

### 7.2 Mapping Evidence to Checks and Controls
- During registration, define evidence schemas that include `controlId`, `checkId`, and optional `riskTier` attributes.
- Use the mapping matrix maintained in the registry to bind probes to framework controls (e.g., ISO 42001, NIST RMF).
- SDK provides helper `mapEvidenceToControl(controlId, payload)` ensuring consistent metadata and storage references.
- Platform ingestion service validates mappings and updates compliance scores in real time when evidence states change.

## 8. Monitoring Probe Health

### 8.1 Failure Detection
- Heartbeat intervals (default 5 minutes) monitored via Prometheus; missing two intervals triggers a `Warning` alert.
- Evidence ingestion errors flagged with structured error codes (`EVIDENCE_SCHEMA_MISMATCH`, `AUTH_EXPIRED`).
- Scheduler tracks consecutive run failures; exceeding thresholds escalates severity and notifies owners.

### 8.2 Alerting Playbooks
- **Tier 1 (Probe Owner):** Receive Slack/Email alerts with run context, logs, and remediation steps.
- **Tier 2 (Platform SRE):** Engaged after 30 minutes of unresolved incidents; access detailed telemetry and can trigger rollbacks.
- **Tier 3 (Governance Lead):** Notified for high-risk control impacts or prolonged outages (>4 hours) affecting regulatory deadlines.
- Integrate alerting with incident management tools (PagerDuty, ServiceNow) using standardized payloads.

### 8.3 Continuous Improvement Loop
- Post-incident reviews capture root causes, configuration changes, and mitigation tasks.
- Update registry templates with new validation rules or guardrails derived from incidents.
- Feed insights into the roadmap for probe SDK enhancements (improved retries, richer diagnostics).

## 9. Appendix: Quick Reference Tables

### Lifecycle States
| State | Description | Allowed Transitions |
| --- | --- | --- |
| `draft` | Probe registered but awaiting approval; test credentials only. | `draft → active`, `draft → rejected` |
| `active` | Fully approved and deployable to configured environments. | `active → deprecated`, `active → suspended` |
| `suspended` | Temporarily disabled (security incident, maintenance). | `suspended → active`, `suspended → deprecated` |
| `deprecated` | Read-only; retains historical evidence but blocked from new runs. | `deprecated → archived` |
| `archived` | Historical reference only; evidence preserved per retention policy. | `archived` (terminal) |

### SDK Utility Methods
| Method | Purpose |
| --- | --- |
| `submitEvidence(payload, options)` | Sends evidence to `/api/probes/:id/evidence` with retries and idempotency keys. |
| `submitHeartbeat(status)` | Emits heartbeat events with runtime metrics and version info. |
| `selfTest()` | Executes dependency checks (network, credentials, schema validation) before deployment. |
| `registerSchedule(type, config)` | Declares cron or event-based schedules managed by the scheduler. |
| `reportStatus(runId, outcome)` | Publishes run results for dashboard visibility and alert correlation. |

---

The Probe Management System aligns probe development, deployment, and monitoring with the platform's compliance objectives, ensuring trustworthy evidence collection across diverse enterprise environments.

---

[← Previous](06-audit-logging-and-monitoring.md) | [Next →](08-check-management-system.md)
