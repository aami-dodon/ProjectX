# AI Governance Platform — Systems Hub <!-- omit in toc -->

>### TL;DR
> This hub curates subsystem runbooks that translate the platform's high-level vision into operational guidance.
> Each article connects the strategic context from the **About** materials with the implementation details in the **Technical Specifications** so teams can plan, build, and run services coherently.

---

## Why this section exists
The Systems documentation set bridges the gap between business intent and engineering execution. It:

- Explains how each platform subsystem delivers on the promises outlined in the [About collection](../01-about/01-project-overview.md).
- References implementation expectations from the [Technical Specifications index](../02-technical-specifications/readme.md) to keep architecture, tooling, and governance aligned.
- Provides operational guidance—ownership, data flows, SLAs, and cross-service dependencies—for day-to-day platform management.

---

## How the Systems hub relates to other documentation
- **Strategic grounding.** Use the [About documentation overview](../01-about/01-project-overview.md) and related market, roadmap, and risk briefs to understand *why* the subsystems exist and what outcomes they must deliver.
- **Implementation detail.** Pair each subsystem article with the matching section in the [Technical Specifications suite](../02-technical-specifications/readme.md) for API contracts, infrastructure choices, and coding standards.
- **Bidirectional updates.** Changes captured here should cascade back into the `about` and `technical-specifications` folders so strategy, architecture, and operations never drift apart.
- **Environment constraints.** All persistence layers run on the externally hosted PostgreSQL and MinIO services described in the [Technical Specifications](../02-technical-specifications/01-system-architecture.md). Operational steps that reference migrations, schema updates, or storage policies assume coordination through the DevOps pipeline against those managed services rather than direct instance administration.

---

## Subsystem runbooks

### Auth Service
#### TL;DR
- Manages identity verification, session lifecycle, and role-based authorization for every touchpoint across the AI Governance Platform.
- Built on the Express.js backend, it integrates tightly with the shared authentication libraries and enforces governance policies defined by the architecture team.

#### Mission-critical responsibilities
- Provide secure sign-in and token issuance aligned with the [backend architecture contract](../02-technical-specifications/02-backend-architecture-and-apis.md#auth-service).
- Enforce RBAC policies that map to the stakeholder personas captured in the [About documentation](../01-about/08-operations-and-teams.md).
- Coordinate with the [Security Implementation guide](../02-technical-specifications/06-security-implementation.md) for encryption, secret storage, and compliance monitoring.

#### Operational guidance
- **Service ownership:** Platform security squad.
- **Data flows:** Issues JWTs, validates session cookies, and synchronizes user metadata with the shared PostgreSQL database.
- **SLAs:** 99.95% authentication availability, <200ms median login response.
- **Dependencies:** Relies on the user table managed by the Database Design spec and integrates with the Notification Service for multi-factor prompts.

#### Runbook checklist
1. Monitor authentication error rates and anomaly spikes in observability dashboards.
2. Rotate signing keys in accordance with the Security Implementation playbooks.
3. Review RBAC policy drift with compliance partners each release.

---

### Governance Engine
#### TL;DR
- Automates control evaluations, risk scoring, and workflow orchestration that power the platform's compliance insights.
- Serves as the orchestration heart that connects frameworks, evidence ingestion, and task creation.

#### Mission-critical responsibilities
- Execute control logic defined in the [System Architecture overview](../02-technical-specifications/01-system-architecture.md) and elaborated within the [backend services blueprint](../02-technical-specifications/02-backend-architecture-and-apis.md#governance-engine).
- Align evaluation cadences with regulatory expectations summarized in the [Risk Management brief](../01-about/10-risk-management-and-Mitigation.md).
- Produce audit-ready logs that meet the [Testing & QA](../02-technical-specifications/09-testing-and-qa.md) acceptance criteria.

#### Operational guidance
- **Service ownership:** Governance engineering squad.
- **Data flows:** Ingests framework metadata, triggers evidence probes, evaluates control logic, and publishes outcomes to the task queue.
- **SLAs:** Complete scheduled control runs within hourly windows; maintain deterministic results across identical inputs.
- **Dependencies:** Requires reliable input from the Framework Service, Evidence Repository, and Notification Service for downstream alerts.

#### Runbook checklist
1. Review nightly control run summaries and investigate failing evaluations.
2. Validate scoring algorithms after any framework or regulatory update.
3. Confirm audit logs are persisted and replicated per the DevOps policies.

---

### Framework Service
#### TL;DR
- Curates regulatory frameworks, control catalogs, and cross-mappings that feed every governance workflow.
- Ensures authoritative content, versioning, and lifecycle management for compliance programs.

#### Mission-critical responsibilities
- Maintain framework metadata, control mappings, and hierarchy in line with the [Framework Service spec](../02-technical-specifications/02-backend-architecture-and-apis.md#framework-service).
- Reflect roadmap priorities articulated in the [MVP and product roadmap](../01-about/06-mvp-and-roadmap.md) as new frameworks roll out.
- Synchronize schema expectations with the [Database Design documentation](../02-technical-specifications/04-database-design.md).

#### Operational guidance
- **Service ownership:** Compliance content squad.
- **Data flows:** Imports regulatory datasets, version-controls updates, exposes REST endpoints for the Governance Engine, and publishes change events to the Notification Service.
- **SLAs:** Publish critical framework updates within 48 hours of policy release; guarantee backward compatibility for at least one release cycle.
- **Dependencies:** Relies on Database migrations coordinated with DevOps and ties into the Evidence Repository to ensure control evidence references remain consistent.

#### Runbook checklist
1. Vet new or updated framework content with legal and compliance reviewers before publishing.
2. Submit Prisma migration packages through the DevOps pipeline so they run against the provider-managed staging database before production rollout.
3. Update change logs and notify downstream teams of breaking changes.

---

### Evidence Repository
#### TL;DR
- Provides secure, compliant storage for documentary and automated evidence that supports control attestations.
- Balances accessibility for auditors with strict retention, encryption, and chain-of-custody requirements.

#### Mission-critical responsibilities
- Implement storage practices aligned with the [Database Design](../02-technical-specifications/04-database-design.md) and [Security Implementation](../02-technical-specifications/06-security-implementation.md) standards.
- Support evidence collection journeys envisioned in the [Operations & Teams brief](../01-about/08-operations-and-teams.md).
- Serve deterministic, versioned evidence snapshots to the Governance Engine and downstream audit exports.

#### Operational guidance
- **Service ownership:** Evidence management squad.
- **Data flows:** Accepts uploads and automated probe results, writes metadata to PostgreSQL, stores binary assets in MinIO, and exposes signed URLs for authorized retrieval.
- **SLAs:** Guarantee evidence availability within minutes of ingestion and sustain 7-year retention with immutable audit logs.
- **Dependencies:** Depends on encryption keys managed by the Auth Service and infrastructure policies maintained via DevOps & Infrastructure playbooks.

#### Runbook checklist
1. Validate retention schedules and legal hold configurations quarterly.
2. Audit MinIO bucket policies and access logs for anomalies.
3. Test retrieval workflows after each deployment to ensure signed URL issuance remains intact.

---

### Notification Service
#### TL;DR
- Drives multi-channel communication—email, Slack, and in-app alerts—to keep stakeholders aligned with governance activity.
- Operates on an event-driven pipeline that reacts to subsystem signals and user preferences.

#### Mission-critical responsibilities
- Implement message orchestration patterns described in the [Integration Architecture guide](../02-technical-specifications/07-integration-architecture.md) and [Backend Architecture blueprint](../02-technical-specifications/02-backend-architecture-and-apis.md#notification-service).
- Reinforce change management commitments defined in the [Marketing Strategy and stakeholder messaging plan](../01-about/07-marketing-strategy.md).
- Observe security and privacy controls from the [Security Implementation specification](../02-technical-specifications/06-security-implementation.md) when handling personally identifiable information.

#### Operational guidance
- **Service ownership:** Communications platform squad.
- **Data flows:** Consumes events from the Governance Engine and Task Service, applies routing rules, and dispatches through provider adapters with delivery analytics captured in PostgreSQL.
- **SLAs:** Deliver high-priority alerts within 60 seconds; ensure message deduplication and preference enforcement across channels.
- **Dependencies:** Relies on provider credentials managed via DevOps secrets and respects throttling policies defined in Integration Architecture.

#### Runbook checklist
1. Monitor provider health metrics and failover to backup channels when latency exceeds thresholds.
2. Reconcile delivery receipts with task and evidence states weekly to ensure notifications align with system reality.
3. Review template catalog for outdated messaging during each release planning cycle.

---

### Admin & Configuration System
#### TL;DR
- Governs tenant provisioning, global settings, and integration lifecycle management through the shared admin control plane.
- Embeds workflows in the Governance Engine UI to coordinate platform-wide policy and configuration changes.

#### Mission-critical responsibilities
- Execute tenant onboarding and delegation journeys aligned with the [Backend Architecture blueprint](../02-technical-specifications/02-backend-architecture-and-apis.md#admin-service) and RBAC guardrails.
- Enforce security posture defined in the [Security Implementation specification](../02-technical-specifications/06-security-implementation.md), including secrets management and administrative access controls.
- Coordinate integration governance patterns from the [Integration Architecture guide](../02-technical-specifications/07-integration-architecture.md) to keep probes and connectors in sync across tenants.

#### Operational guidance
- **Service ownership:** Platform operations squad.
- **Data flows:** Automates tenant provisioning, publishes configuration events, orchestrates integration authorization, and emits audit telemetry.
- **SLAs:** Complete tenant bootstrap within 30 minutes of approval; replicate configuration changes to dependent services within 5 minutes.
- **Dependencies:** Relies on Probe Management for scheduling automation, Governance Engine for UI embedding, and External Integrations for connector catalog updates.

#### Runbook checklist
1. Review pending provisioning requests and ensure verification artifacts meet compliance standards.
2. Audit configuration change approvals weekly and reconcile with audit logs for accuracy.
3. Validate integration credentials ahead of expiry and coordinate rotations through the control plane.

---

### Task Service
#### TL;DR
- Manages remediation and follow-up work generated by governance activities, ensuring accountability and audit visibility.
- Provides the operational backbone for collaboration across compliance, engineering, and business stakeholders.

#### Mission-critical responsibilities
- Fulfil task orchestration responsibilities defined in the [Backend Architecture blueprint](../02-technical-specifications/02-backend-architecture-and-apis.md#task-service).
- Reflect organizational workflows highlighted in the [Operations & Teams brief](../01-about/08-operations-and-teams.md) and roadmap milestones set in the [MVP plan](../01-about/06-mvp-and-roadmap.md).
- Enforce coding standards and workflow automation patterns described in the [Coding Standards & Governance guide](../02-technical-specifications/10-coding-standards-and-governance.md).

#### Operational guidance
- **Service ownership:** Workflow automation squad.
- **Data flows:** Consumes events from the Governance Engine, persists task assignments and states, emits notifications, and exposes APIs for frontend task boards.
- **SLAs:** Persist new tasks within 5 seconds of triggering event; deliver state changes to dependent services in near real-time.
- **Dependencies:** Integrates with Auth for ownership permissions, Notification Service for updates, and DevOps pipelines that execute automated migrations against the externally hosted PostgreSQL service.

#### Runbook checklist
1. Validate that task state transitions comply with governance policies every sprint.
2. Audit automation rules and escalations for runaway loops or misrouted work.
3. Review analytics dashboards to ensure SLA adherence and backlog health.

---

## Maintaining this hub
- Treat subsystem runbooks as living documents—update them alongside code or infrastructure changes.
- Cross-link new or changed content to both the About and Technical Specification sections when dependencies shift.
- Keep summaries short and actionable so readers can triage responsibilities quickly.
