# Control Management System <!-- omit in toc -->

## Location: /server/src/modules/governance/controls

>### TL;DR
> The control management system anchors governance, risk, and compliance posture across the platform.
> It maintains a canonical control catalog, maps controls to frameworks and checks, and orchestrates scoring, remediation, and reporting flows.
> Use this reference to understand data models, lifecycle procedures, and integrations that keep control health accurate and auditable.

---

- [Location: /server/src/modules/governance/controls](#location-serversrcmodulesgovernancecontrols)
- [1. Overview](#1-overview)
- [2. Control Taxonomy](#2-control-taxonomy)
- [3. Controls Table Metadata](#3-controls-table-metadata)
  - [3.1 Relationships to Frameworks](#31-relationships-to-frameworks)
  - [3.2 Relationships to Checks](#32-relationships-to-checks)
- [4. Scoring and Status Determination](#4-scoring-and-status-determination)
  - [4.1 Handling Failures](#41-handling-failures)
  - [4.2 Linkage to Remediation Tasks and Dashboards](#42-linkage-to-remediation-tasks-and-dashboards)
- [5. Control Lifecycle Procedures](#5-control-lifecycle-procedures)
  - [5.1 Creating a New Control](#51-creating-a-new-control)
  - [5.2 Updating an Existing Control](#52-updating-an-existing-control)
  - [5.3 Mapping Controls Across Frameworks](#53-mapping-controls-across-frameworks)
  - [5.4 Auditing Changes](#54-auditing-changes)
- [6. Appendices](#6-appendices)

---

## 1. Overview
The control management system centralizes definition, evaluation, and reporting for governance, risk, and compliance (GRC) controls. It aligns a shared control taxonomy with multiple regulatory frameworks, maps automated and manual checks to those controls, and drives remediation workflows and dashboard reporting.

## 2. Control Taxonomy
Controls are organized into a multi-level taxonomy to ensure traceability from enterprise objectives down to individual validation checks.

- **Domain** – Broad thematic area such as Identity & Access, Data Protection, or Infrastructure Security.
- **Category** – Subdivision of a domain that groups controls by functional capability (e.g., Authentication, Encryption).
- **Control** – The authoritative statement specifying required behavior or configuration.
- **Sub-control (optional)** – Additional granularity for complex controls with multiple enforcement mechanisms.

Each control and sub-control must map to at least one framework requirement and one verification check. Domains and categories are maintained in reference tables to preserve consistent naming.

## 3. Controls Table Metadata
The `controls` table captures the authoritative record for every control. Core columns include:

| Column | Description |
| ------ | ----------- |
| `control_id` | Immutable identifier (UUID) used across services. |
| `domain_key` | Foreign key to the control domain catalog. |
| `category_key` | Foreign key to the control category catalog. |
| `title` | Human-readable control name (unique within a domain). |
| `description` | Detailed expectation for the control. |
| `rationale` | Business or regulatory justification for the control. |
| `implementation_guidance` | Prescribed steps or configurations to satisfy the control. |
| `owner_team` | Primary team accountable for the control. |
| `status` | Lifecycle state (`draft`, `active`, `deprecated`). |
| `risk_tier` | Impact rating used in scoring weights (e.g., High/Medium/Low). |
| `version` | Integer incremented on every material change. |
| `created_at` / `updated_at` | Audit timestamps maintained by triggers. |
| `created_by` / `updated_by` | User identifiers for change tracking. |

### 3.1 Relationships to Frameworks
Framework mappings live in a `control_framework_links` join table linking `control_id` to `framework_id` and `requirement_id`. Each mapping includes:

- `coverage_level` – Degree of fulfillment (e.g., Full, Partial, Compensating).
- `evidence_reference` – Link to policy or artifact proving compliance.
- `effective_date` / `expiry_date` – Validity window for the mapping.

### 3.2 Relationships to Checks
Verification checks reside in the `checks` table and connect to controls via the `control_check_links` join table. Each link records:

- `check_id` – Identifier for the automated or manual assessment.
- `assertion_type` – Nature of evaluation (configuration, process, interview, etc.).
- `frequency` – Expected cadence for running the check.
- `enforcement_level` – Whether failure blocks deployments, triggers incidents, or only surfaces in reports.

## 4. Scoring and Status Determination
Control posture scores combine check outcomes, weighting, and risk tiers:

1. Each linked check produces a normalized score between 0 and 1 based on raw findings (e.g., pass = 1, warning = 0.5, fail = 0).
2. Check scores are multiplied by their `weight` (defined per control-check link) and aggregated.
3. The aggregate score is scaled by the control's `risk_tier` multiplier (High = 1.5, Medium = 1.0, Low = 0.75 by default).
4. The final control score is capped at 1.0. Thresholds classify status: `>=0.85` = Passing, `0.60-0.84` = Needs Attention, `<0.60` = Failing.

### 4.1 Handling Failures
When a check fails:

- The control's status transitions to `Failing` if the recalculated score drops below threshold.
- An incident ticket and remediation task are created automatically when the enforcement level is "Blocking" or "Critical".
- Evidence of the failure, including check output and timestamps, is persisted for audit.
- Notification rules alert the `owner_team` and stakeholders subscribed to the impacted framework.

### 4.2 Linkage to Remediation Tasks and Dashboards
Control scores feed dashboards showing posture by domain, framework, and owner team. Remediation tasks include references to `control_id`, failing `check_id`, and due dates derived from risk tier. Dashboards surface:

- Current score and historical trend per control.
- Open remediation tasks, their status, and SLA adherence.
- Framework coverage heatmaps showing how failures affect compliance objectives.

## 5. Control Lifecycle Procedures

### 5.1 Creating a New Control
1. Author draft content in a change request including title, description, rationale, guidance, and initial taxonomy placement.
2. Validate deduplication against existing controls and align with relevant frameworks.
3. Submit the draft to the governance board for review; reviewers approve domain/category and risk tier.
4. Upon approval, insert the new record into the `controls` table with `status = 'active'` and create mandatory framework and check mappings.
5. Schedule initial checks and confirm dashboard visibility.

### 5.2 Updating an Existing Control
1. Initiate a versioned change request documenting proposed modifications and impacted frameworks.
2. Update the control record, incrementing the `version` and capturing change notes in the audit log.
3. Review and adjust linked checks, weights, and remediation workflows to reflect the new requirements.
4. Notify dependent teams and update documentation or playbooks.

### 5.3 Mapping Controls Across Frameworks
1. Identify equivalent requirements in target frameworks using the taxonomy reference matrix.
2. Create or update entries in `control_framework_links` with coverage level, evidence references, and validity dates.
3. Ensure compensating controls are documented when full coverage is not achievable.
4. Recalculate framework posture dashboards to reflect the new mappings.

### 5.4 Auditing Changes
- All inserts and updates to `controls`, `control_framework_links`, and `control_check_links` trigger audit log entries capturing user, timestamp, before/after snapshots, and approval ticket references.
- Quarterly audits review a random sample of controls to verify metadata accuracy, evidence freshness, and mapping completeness.
- Any discrepancies are logged as remediation tasks with defined owners and due dates.
- Audit findings feed into leadership dashboards and compliance reports.

## 6. Appendices
- **Reference Tables**: Domain catalog, category catalog, framework registry.
- **Key Integrations**: Incident management (for blocking failures), task tracking (remediation assignments), business intelligence (dashboarding).
- **Service Interfaces**: REST endpoints for control CRUD operations, webhook for check result ingestion, and data warehouse exports for analytics.

---

[← Previous](../08-check-management-system/readme.md) | [Next →](../10-framework-mapping-system/readme.md)
