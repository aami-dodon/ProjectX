# Check Management System <!-- omit in toc -->

## Location: /server/src/modules/governance

>### TL;DR
> The check management system operationalizes governance requirements inside the Governance Engine.
> It coordinates check definitions, execution workflows, evidence capture, and publication workflows across automated and manual paths.
> Use this runbook to understand data models, lifecycle states, and operational playbooks for managing compliance checks.

> **Note:** Runtime services that orchestrate checks live alongside the broader Governance Engine implementation in `server/src/modules/governance`. The canonical catalogue of check definitions persists in PostgreSQL tables (`checks`, `results`); there is no dedicated `checks` subdirectory in the codebase.

---

- [Location: /server/src/modules/governance](#location-serversrcmodulesgovernance)
- [1. Conceptual Overview](#1-conceptual-overview)
- [2. Check Types](#2-check-types)
- [3. Execution Workflows](#3-execution-workflows)
  - [3.1 Automated Checks](#31-automated-checks)
  - [3.2 Manual Checks](#32-manual-checks)
  - [3.3 Hybrid Checks](#33-hybrid-checks)
- [4. Data Model and Storage](#4-data-model-and-storage)
  - [4.1 `checks` Table (definition layer)](#41-checks-table-definition-layer)
  - [4.2 `results` Table (execution layer)](#42-results-table-execution-layer)
- [5. Mapping Checks to Probes and Controls](#5-mapping-checks-to-probes-and-controls)
- [6. Validation and Publishing Lifecycle](#6-validation-and-publishing-lifecycle)
- [7. Operational Playbooks](#7-operational-playbooks)
  - [7.1 Adding a New Check](#71-adding-a-new-check)
  - [7.2 Version Management](#72-version-management)
  - [7.3 Manual Review Queue Handling](#73-manual-review-queue-handling)
- [Appendix A. Reference Status and Severity Codes](#appendix-a-reference-status-and-severity-codes)

---

## 1. Conceptual Overview

The Check Management System is the core capability of the Governance Engine responsible for:

- Converting governance requirements into machine- and human-executable validations.
- Coordinating probe integrations that gather evidence from connected systems.
- Persisting outcomes and evidence metadata so downstream services (dashboards, reporting, remediation) can consume authoritative compliance signals.
- Governing the lifecycle of checks from draft through retirement while preserving audit history and traceability.

Checks always evaluate within the context of a **control** that belongs to a governance framework (e.g., EU AI Act, ISO/IEC 42001). Each check may require one or more **probes** to collect measurements or documentation that substantiate the control’s compliance state.

---

## 2. Check Types

| Type | Description | Primary Actors | Evidence Sources |
| --- | --- | --- | --- |
| **Automated** | Fully programmatic validations executed by probes against APIs, logs, configuration stores, or model metadata. | Governance Engine scheduler, probe connectors. | API responses, configuration snapshots, log extracts, telemetry metrics. |
| **Manual** | Human attestation tasks completed by compliance officers or domain experts when automated evidence is unavailable or requires interpretation. | Governance reviewers, Task Service. | Uploaded documents, interview notes, policy attestations. |
| **Hybrid** | Combine automated collection with manual validation to interpret nuanced findings (e.g., bias test results requiring human sign-off). | Governance Engine plus reviewers for exception handling. | Automated probe output supplemented with reviewer commentary or approvals. |

Key distinctions:

- **Execution trigger:** Automated checks run on schedules or event hooks, manual/hybrid checks are queued via the Governance Engine after prerequisite evidence is gathered.
- **Evidence structure:** Automated outputs are structured JSON payloads; manual/hybrid entries store attachments and free-form observations linked to evidence records.
- **Approval chain:** Manual/hybrid checks require explicit reviewer sign-off before results are published to controls.

---

## 3. Execution Workflows

### 3.1 Automated Checks
1. **Scheduling:** The Governance Engine scheduler polls eligible checks based on cadence metadata (`frequency`, `next_run_at`).
2. **Probe Invocation:** Relevant probe integrations are triggered with context (control ID, environment, target system parameters).
3. **Result Evaluation:** Probe responses are evaluated against rule definitions (thresholds, pattern matches, boolean assertions).
4. **Outcome Recording:** The Engine writes a new row in the `results` table with computed status, severity, evidence linkage, and raw payload references.
5. **Notifications:** Failed or warning-level results dispatch remediation tasks and alerts through the Notification and Task Services.

### 3.2 Manual Checks
1. **Task Generation:** Controls flagged for manual validation create queue items assigned to compliance reviewers.
2. **Reviewer Intake:** Reviewers upload evidence or attestations via the Governance UI; metadata is stored in the Evidence Repository and linked to the check.
3. **Assessment:** Reviewers set status, severity, and add narrative evidence references (URLs, document IDs).
4. **Submission:** Results enter a `pending_validation` state awaiting Governance Engine verification.
5. **Publication:** After validation, the Engine promotes the result to `published`, making it visible to dashboards and reports.

### 3.3 Hybrid Checks
1. **Automated Pass:** The Engine executes the automated portion as in section 3.1, marking the result `requires_review` if human interpretation is necessary.
2. **Reviewer Overlay:** Manual reviewers receive a pre-populated queue item containing probe output, contextual guidance, and recommended next steps.
3. **Finalization:** Reviewers adjust severity/status if needed, append commentary, and resubmit for final validation before publication.

---

## 4. Data Model and Storage

Checks and outcomes persist in PostgreSQL as part of the Governance Engine schema.

### 4.1 `checks` Table (definition layer)

| Column | Type | Description |
| --- | --- | --- |
| `id` (PK) | UUID | Unique identifier for the check definition. |
| `control_id` (FK) | UUID | Links to the control the check substantiates. |
| `probe_id` (FK, nullable) | UUID | References the probe that executes the automated portion; null for purely manual checks. |
| `type` | ENUM(`automated`, `manual`, `hybrid`) | Drives workflow selection. |
| `name` | Text | Human-readable title shown in the Governance UI. |
| `description` | Text | Detailed purpose and validation instructions. |
| `severity_default` | ENUM(`info`, `low`, `medium`, `high`, `critical`) | Default severity applied when results do not override it. |
| `status` | ENUM(`draft`, `active`, `retired`) | Definition lifecycle state. |
| `version` | Integer | Incremented whenever validation logic changes. |
| `frequency` | Interval | Recommended run cadence for the scheduler. |
| `created_by` / `updated_by` | UUID | User accounts responsible for definition governance. |
| `metadata` | JSONB | Free-form configuration for probes (API endpoints, thresholds, mapping rules). |

### 4.2 `results` Table (execution layer)

| Column | Type | Description |
| --- | --- | --- |
| `id` (PK) | UUID | Unique identifier for a specific execution. |
| `check_id` (FK) | UUID | Links back to the check definition. |
| `control_id` (FK) | UUID | Denormalized reference for reporting joins. |
| `probe_run_id` | UUID | Tracks the originating probe execution (if automated). |
| `status` | ENUM(`pass`, `fail`, `warning`, `pending_validation`, `requires_review`) | Execution outcome. |
| `severity` | ENUM(`info`, `low`, `medium`, `high`, `critical`) | Impact rating assigned at runtime. |
| `evidence_link_id` | UUID | Points to entries in `evidence_links` that store artefacts and documentation references. |
| `notes` | Text | Analyst comments, remediation guidance, or contextual explanations. |
| `executed_at` | Timestamp | Actual execution time. |
| `validated_at` | Timestamp | Governance Engine validation timestamp. |
| `published_at` | Timestamp | When the result became visible to downstream consumers. |
| `created_by` | UUID | Reviewer or system user initiating the result. |
| `raw_output` | JSONB | Persisted snapshot of probe responses or manual form submissions. |

Indexes:

- `results_check_id_executed_at_idx` for chronological lookups.
- Partial index on `status IN ('fail', 'warning')` to accelerate remediation queries.
- Composite index on (`control_id`, `published_at`) for dashboard aggregations.

---

## 5. Mapping Checks to Probes and Controls

1. **Controls as Source of Truth:** Every check must map to a single control; the Framework Service maintains the control catalogue and exposes metadata (framework identifier, control category) to the Governance Engine.
2. **Probe Bindings:** Automated or hybrid checks specify a `probe_id` that resolves to an integration adapter responsible for collecting evidence. Probe definitions include authentication secrets, connection parameters, and supported data domains.
3. **Control Coverage Metrics:** The Governance Engine computes coverage by aggregating active checks per control. Controls can require multiple checks (e.g., technical validation plus policy attestation) to achieve full coverage.
4. **Evidence Linking:** Probe outputs or uploaded documents are stored via the Evidence Repository. `results.evidence_link_id` anchors evidence objects so auditors can trace findings back to source artefacts.
5. **Status Propagation:** Result status and severity flow upward to control-level scores. Multiple failed checks on a control escalate the control’s risk state, triggering governance notifications and remediation tasks.

---

## 6. Validation and Publishing Lifecycle

| Stage | Definition | Trigger | Responsible Actor |
| --- | --- | --- | --- |
| `draft` | Initial definition being authored. Not executable. | Check creation. | Control owner / compliance architect. |
| `ready_for_validation` | Logic and metadata completed; awaiting Governance Engine review. | Author submits definition. | Governance Engine governance reviewers. |
| `active` | Definition approved and available for scheduling. | Validation approved. | Governance Engine automation. |
| `pending_validation` (result) | Execution completed but awaiting secondary review. | Manual/hybrid submissions or automated exceptions. | Governance reviewers. |
| `published` (result) | Approved outcome visible to dashboards and reports. | Validator sign-off. | Governance Engine automation. |
| `retired` | Definition deprecated; no longer scheduled but retained for audit history. | Replacement created or control removed. | Governance governance board. |

Validation steps:

1. **Schema Validation:** Ensure definition metadata includes required fields (`control_id`, `type`, `severity_default`, `frequency`).
2. **Probe Contract Check:** Automated/hybrid checks must reference an active probe whose schema matches expected payload fields.
3. **Governance Review:** Reviewer confirms mapping to controls, severity rationale, and evidence retention requirements.
4. **Publication:** Upon approval, the Governance Engine updates `checks.status` to `active` and queues the first execution.
5. **Ongoing Monitoring:** Failed results trigger revalidation of logic; repeated false positives prompt review of thresholds and severity.

Publishing controls the transition from raw execution to auditor-facing records. Only results with `published_at` set are included in compliance reports.

---

## 7. Operational Playbooks

### 7.1 Adding a New Check

1. **Author Definition:** Draft a YAML or JSON definition (via Governance Engine admin UI) including control mapping, type, severity, frequency, and probe configuration.
2. **Attach Probe (if applicable):** Select an existing probe or request a new integration via the Integration team. Validate connection parameters in a sandbox run.
3. **Submit for Validation:** Move the check to `ready_for_validation`. Provide supporting rationale and expected evidence samples.
4. **Governance Review:** Governance reviewers test the check in staging, confirm status mappings, and verify evidence storage.
5. **Activate:** Once approved, the check status becomes `active` and it enters the scheduling queue.

### 7.2 Version Management

- **Increment `version`:** Any change to validation logic, severity defaults, or probe bindings requires a version increment. Minor metadata adjustments (description text) do not.
- **Migration Script:** Use the Governance Engine migration pipeline to seed updated definitions; ensure previous versions remain readable for historical results.
- **Backward Compatibility:** Results created under older versions retain their version number; dashboards surface version drift to highlight stale checks.
- **Deprecation:** To replace a check, mark the older version `retired` after the new version publishes its first successful result, guaranteeing overlap coverage.

### 7.3 Manual Review Queue Handling

1. **Queue Intake:** Manual and hybrid checks automatically open review tickets in the Governance Engine’s Review Queue module with SLA metadata (due date, priority derived from severity).
2. **Assignment:** Queue managers assign reviewers based on expertise and workload; assignments sync with the Task Service for accountability.
3. **Review Execution:** Reviewers follow structured forms capturing attestation statements, evidence references, and severity adjustments. Evidence uploads go through the Evidence Repository.
4. **Validation & Publishing:** Completed reviews transition to `pending_validation`. Senior reviewers or automated policies (two-person rule) approve for publication, setting `validated_at` and `published_at`.
5. **Governance Reporting:** The queue exposes metrics to the Governance Engine dashboard—aging items, SLA breaches, and per-control review cadence—to inform compliance leadership.

Escalation paths are triggered automatically for overdue manual checks, notifying Governance and Risk leads to reassign or adjust severity.

---

## Appendix A. Reference Status and Severity Codes

- **Status Codes:**
  - `pass` – Control requirement satisfied.
  - `fail` – Control requirement breached; remediation required.
  - `warning` – Control partially satisfied; review recommended.
  - `pending_validation` – Awaiting reviewer or automated validation step.
  - `requires_review` – Automated output collected; human action needed before publication.
- **Severity Levels:**
  - `info` – Informational, no immediate action.
  - `low` – Minor gap; monitor.
  - `medium` – Moderate risk; remediation within standard SLA.
  - `high` – Significant risk; expedited remediation.
  - `critical` – Severe risk; immediate executive attention.

These enums align with Governance Engine configuration files and should remain synchronized with backend validation logic.

---

[← Previous](07-probe-management-system.md) | [Next →](09-control-management-system.md)
