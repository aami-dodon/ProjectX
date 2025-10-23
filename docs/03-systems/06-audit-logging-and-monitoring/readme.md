# Audit Logging and Monitoring <!-- omit in toc -->

## Location: /server/src/lib/logging

>### TL;DR
> The audit logging and monitoring system guarantees immutable, end-to-end visibility into security-critical activity.
> Built around `server/src/lib/logging/audit.js`, it captures structured events, enforces retention and tamper controls, and feeds observability pipelines for governance oversight.
> Use this guide to understand capture scope, storage contracts, operational safeguards, and developer instrumentation practices.

---

- [1. Log Capture Scope](#1-log-capture-scope)
- [2. Storage Targets](#2-storage-targets)
- [3. Retention Policies](#3-retention-policies)
- [4. Immutability Controls](#4-immutability-controls)
- [5. Monitoring and Alerting Integration](#5-monitoring-and-alerting-integration)
- [6. Access Restrictions and Review Processes](#6-access-restrictions-and-review-processes)
- [7. Developer Instrumentation Guidelines](#7-developer-instrumentation-guidelines)

---

## 1. Log Capture Scope
- Capture all authentication events (login, logout, MFA challenges, failures) across user-facing and service-to-service flows.
- Record privileged actions, configuration changes, data exports, and any alteration of access controls in administrative interfaces.
- Instrument critical business operations, including financial transactions, data mutations, workflow state transitions, and API calls flagged as high risk.
- Track system-level events such as deployment lifecycle actions, infrastructure scaling, and security control updates.
- Ensure each audit entry includes timestamp (UTC), actor identity, action, target resource, request origin, and success or failure context.

## 2. Storage Targets
- **Application Layer:** Use Winston transports for structured JSON logs, tagging audit events with `category: "audit"` and unique correlation IDs. Deliver to rolling file transport for local debugging with rotation configured (<24 h of retention) and to standard output for container orchestration capture.
- **Centralized Logging:** Stream Winston output to the centralized logging pipeline (e.g., Elasticsearch/OpenSearch, Loki, or Splunk) via HTTPS or sidecar agents. Ensure dedicated audit index/stream with role-based access separation from general application logs.

## 3. Retention Policies
- Maintain audit logs in centralized storage for a minimum of 36 months by default, satisfying the regulatory floor of 400 days and extending per jurisdictional mandates when required.
- Archive immutable snapshots to cold storage (object store with write-once, read-many policies) every 30 days for a minimum of 7 years.
- Automatically purge local file transport logs after 24 hours and confirm centralized lifecycle policies enforce retention schedules.

## 4. Immutability Controls
- Enable append-only permissions on audit indices and restrict deletion capabilities to the security/compliance team with change control approval.
- Utilize object storage retention policies or S3 Glacier Vault Lock-style controls to enforce WORM on archived snapshots.
- Sign audit batches with cryptographic hashes and store hash manifests in a separate integrity ledger to detect tampering.

## 5. Monitoring and Alerting Integration
- Feed audit streams into the security information and event management (SIEM) stack for correlation with security alerts and anomaly detection.
- Configure alerting rules for high-risk audit events (privilege escalations, repeated access denials, failed administrative logins) with notification channels to on-call security and operations teams.
- Link dashboards in the observability platform to audit log metrics (event volumes, failure rates) and include runbooks for triaging anomalous patterns.

## 6. Access Restrictions and Review Processes
- Grant read-only access to audit indices to the security, compliance, and incident response teams via least-privilege roles; deny direct access to engineering by default.
- Require break-glass procedures with approval logging for temporary investigative access outside the security team.
- Schedule quarterly formal reviews of audit log health, retention adherence, and sample integrity checks. Document findings and remediation actions in the compliance tracker.
- Implement weekly automated reports summarizing critical audit events, reviewed by security leadership with sign-off recorded in governance tooling.

## 7. Developer Instrumentation Guidelines
1. **Identify Audit-Worthy Actions:** When adding new features, flag actions that affect security posture, user data, or compliance-sensitive operations. Consult the security team if uncertain.
2. **Use Shared Audit Helpers:** Instrument events via the `auditLogger` utility (see `src/lib/logging/audit.js`) to standardize metadata, correlation IDs, and JSON schema.
3. **Mask Sensitive Data:** Never log secrets, full payment card numbers, passwords, or personal data beyond minimal identifiers. Use the `redactFields` option provided by the audit logger to mask sensitive attributes before emission.
4. **Correlate Requests:** Attach request IDs, user IDs, and session references so downstream analytics can trace multi-service flows.
5. **Validate Locally:** Run `npm run lint:audit` to ensure schema conformance and `npm run test:audit` to execute instrumentation unit tests.

---

[← Previous](05-admin-and-configuration-system.md) | [Next →](07-probe-management-system.md)
