# Dashboard and Reporting System

## Overview
The dashboard and reporting system consolidates program assessment data, turning ongoing evaluation activities into actionable visuals and exportable reports. This document outlines the source pipelines for the key dashboard feeds, the front-end components that render them, and the relationships between report types, backend services, and data storage. Guidance for extending the system with new widgets or exports is also provided.

## Data Pipelines Feeding Dashboards

### Scores Pipeline
- **Source Events:** Assessment submissions, rubric scoring events, automated performance checks.
- **Ingestion:** Events captured through the `assessment_service` Kafka topic are normalized in the `score_processor` job.
- **Transformation:** The processor calculates aggregated scores (per site, per program, per evaluator) and writes results into the `assessment_scores` table.
- **Serving Layer:** The `GET /api/v1/dashboards/scores` endpoint exposes denormalized score summaries with pagination, filters for date range, evaluator, and program cohorts.

### Observations Pipeline
- **Source Events:** Classroom observations, on-site audits, follow-up notes.
- **Ingestion:** Observation forms are submitted via `POST /api/v1/observations` and queued for enrichment by the `observation_enricher` worker.
- **Transformation:** Natural-language tagging, sentiment extraction, and categorical labeling are stored in `observation_tags`. Consolidated observation records live in `observation_facts` with foreign keys to the original submissions.
- **Serving Layer:** The dashboard reads from `GET /api/v1/dashboards/observations`, which combines facts and tag metadata to generate summaries by site, observer, and theme.

### Tasks Pipeline
- **Source Events:** Corrective action items, follow-up tasks spawned from observations, scheduled compliance tasks.
- **Ingestion:** Tasks originate in `POST /api/v1/tasks` and are propagated through the `task_dispatcher` queue.
- **Transformation:** The `task_sync` job enriches tasks with SLA deadlines, status rollups, and dependency chains, storing results in `task_ledger` and `task_dependencies` tables.
- **Serving Layer:** The `GET /api/v1/dashboards/tasks` endpoint exposes grouped task metrics (open vs. closed, SLA breaches, responsible owners) and powers the task completion widgets.

## Front-End Visualization Components

| Component | Responsibility | Primary Data Source |
| --- | --- | --- |
| `ScoreTrendWidget` | Line and bar charts for aggregate scores across cohorts and time ranges. | `/api/v1/dashboards/scores` |
| `ObservationInsightPanel` | Displays sentiment trends, most frequent tags, and qualitative highlights. | `/api/v1/dashboards/observations` |
| `TaskComplianceMatrix` | Matrix view showing status of tasks by owner and due date bucket. | `/api/v1/dashboards/tasks` |
| `ProgramDrilldownModal` | Contextual details for selected site/program, aggregating scores, observations, and tasks in a single view. | Combination of the three dashboard endpoints plus `/api/v1/programs/:id` |
| `ExportMenu` | Allows exporting current views and reports; integrates with report generation endpoints. | `/api/v1/reports/*` |

All widgets use a shared `DashboardDataContext` for state management, ensuring consistent filters (date range, program, evaluator) across panels.

## Report Types and Backend Relationships

### Scorecards
- **Purpose:** Provide a snapshot of performance metrics for a single site or program.
- **Endpoint:** `POST /api/v1/reports/scorecards` initiates generation; `GET /api/v1/reports/scorecards/:job_id` returns the finished PDF/CSV.
- **Database Tables:** Relies on `assessment_scores` for quantitative metrics and `program_metadata` for contextual details.
- **Front-End Integration:** The `ScorecardReportModal` allows users to configure filters and launch scorecard exports directly from score widgets.

### Gap Analyses
- **Purpose:** Highlight discrepancies between target benchmarks and actual performance across programs or standards.
- **Endpoint:** `POST /api/v1/reports/gap-analyses` with benchmark parameters; `GET /api/v1/reports/gap-analyses/:job_id` fetches the resulting report.
- **Database Tables:** Uses `benchmark_targets`, `assessment_scores`, and `observation_facts` to compute variance and qualitative explanations.
- **Front-End Integration:** The `GapAnalysisBuilder` component surfaces recommended actions based on the generated report and cross-links to task creation.

### Risk Heatmaps
- **Purpose:** Visualize compounded risk by combining compliance gaps, open tasks, and negative observation trends.
- **Endpoint:** `POST /api/v1/reports/risk-heatmaps`; status retrieval through `GET /api/v1/reports/risk-heatmaps/:job_id`.
- **Database Tables:** Aggregates data from `risk_thresholds`, `task_ledger`, `observation_tags`, and `assessment_scores`.
- **Front-End Integration:** The `RiskHeatmapView` renders the produced heatmap tiles and enables drilldowns into contributing factors.

## Extensibility Guidance

### Adding New Dashboard Widgets
1. **Define Data Contract:** Expose a new backend endpoint (e.g., `/api/v1/dashboards/<resource>`) returning normalized JSON with filter metadata compatible with `DashboardDataContext`.
2. **Extend Context:** Update `DashboardDataContext` to register the new dataset, ensuring global filters propagate appropriately.
3. **Create Visualization Component:** Build a dedicated widget leveraging shared chart primitives (e.g., `useChartTheme`, `BaseCard`). Follow accessibility guidelines (keyboard navigation, ARIA labels for interactive elements).
4. **Register Widget:** Add the widget to the dashboard layout configuration with responsive breakpoints and loading/error states.

### Adding New Report Exports
1. **Backend Pipeline:** Implement a new report generator job under `/api/v1/reports/<type>` with asynchronous processing and job tracking in `report_jobs`.
2. **Data Model Alignment:** Introduce or reuse database tables for required metrics; define indexes for heavy aggregation queries.
3. **Front-End Entry Points:** Update `ExportMenu` and relevant widgets to present the new export option, ensuring the request payload matches the backend contract.
4. **File Formats and Localization:** Support PDF and CSV exports where applicable, using shared templates for branding and locale-aware formatting.

### Accessibility and Performance Standards
- **Accessibility:** All widgets must meet WCAG 2.1 AA; ensure semantic HTML, ARIA annotations for charts (`role="img"` with descriptive labels), and keyboard-accessible controls. Provide text alternatives for visualizations via summary tables or descriptive captions.
- **Performance:** Dashboard endpoints should respond within 300ms for typical queries; leverage caching (Redis) for repeated filters. Front-end widgets must employ lazy loading and memoization to avoid redundant renders. Large report generation tasks should be queued with progress polling to keep the UI responsive.
- **Monitoring:** Instrument both backend jobs and front-end components with tracing/metrics (OpenTelemetry), and set alerts for SLA breaches on endpoint latency or queue backlogs.

## Future Enhancements
- Introduce machine learning-driven insights (e.g., predictive risk scoring) as optional overlays on existing widgets.
- Expand the report framework with templating support to allow custom combinations of widgets into consolidated executive summaries.
