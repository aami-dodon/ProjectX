-- Reporting module schema additions
CREATE TYPE "ReportScoreGranularity" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');
CREATE TYPE "ReportMetricType" AS ENUM ('FRAMEWORK', 'CONTROL_HEALTH', 'REMEDIATION', 'EVIDENCE');
CREATE TYPE "ReportExportFormat" AS ENUM ('JSON', 'CSV', 'XLSX');
CREATE TYPE "ReportExportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE "ReportExportType" AS ENUM (
  'FRAMEWORK_ATTESTATION',
  'CONTROL_BREAKDOWN',
  'REMEDIATION_DIGEST',
  'EVIDENCE_OVERVIEW'
);

CREATE TABLE "report_scores" (
  "id" TEXT NOT NULL,
  "framework_id" TEXT,
  "control_id" TEXT,
  "domain" TEXT,
  "granularity" "ReportScoreGranularity" NOT NULL DEFAULT 'DAILY',
  "window_start" TIMESTAMP(3) NOT NULL,
  "window_end" TIMESTAMP(3) NOT NULL,
  "average_score" DOUBLE PRECISION,
  "failing_count" INTEGER NOT NULL DEFAULT 0,
  "trend_delta" DOUBLE PRECISION,
  "dimensions" JSONB,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "report_scores_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "report_scores_framework_id_idx" ON "report_scores"("framework_id");
CREATE INDEX "report_scores_control_id_idx" ON "report_scores"("control_id");
CREATE INDEX "report_scores_granularity_idx" ON "report_scores"("granularity");
CREATE INDEX "report_scores_window_start_idx" ON "report_scores"("window_start");

CREATE TABLE "report_metrics" (
  "id" TEXT NOT NULL,
  "metric_type" "ReportMetricType" NOT NULL,
  "scope" TEXT,
  "filters_hash" TEXT,
  "window_start" TIMESTAMP(3),
  "window_end" TIMESTAMP(3),
  "payload" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "report_metrics_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "report_metrics_metric_type_idx" ON "report_metrics"("metric_type");
CREATE INDEX "report_metrics_filters_hash_idx" ON "report_metrics"("filters_hash");

CREATE TABLE "report_exports" (
  "id" TEXT NOT NULL,
  "export_type" "ReportExportType" NOT NULL DEFAULT 'FRAMEWORK_ATTESTATION',
  "format" "ReportExportFormat" NOT NULL DEFAULT 'JSON',
  "status" "ReportExportStatus" NOT NULL DEFAULT 'PENDING',
  "filters" JSONB,
  "schedule" JSONB,
  "artifact_bucket" TEXT,
  "artifact_object_name" TEXT,
  "artifact_inline_payload" JSONB,
  "artifact_inline_encoding" TEXT,
  "failure_reason" TEXT,
  "requested_by_id" TEXT,
  "scheduled_for" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "report_exports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "report_exports_status_idx" ON "report_exports"("status");
CREATE INDEX "report_exports_export_type_idx" ON "report_exports"("export_type");
CREATE INDEX "report_exports_requested_by_id_idx" ON "report_exports"("requested_by_id");

CREATE TABLE "report_audit_log" (
  "id" TEXT NOT NULL,
  "export_id" TEXT,
  "event_type" TEXT NOT NULL,
  "payload" JSONB,
  "actor_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "report_audit_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "report_audit_log_export_id_idx" ON "report_audit_log"("export_id");
CREATE INDEX "report_audit_log_actor_id_idx" ON "report_audit_log"("actor_id");

CREATE TABLE "report_widgets" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT,
  "slug" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "config" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "report_widgets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "report_widgets_tenant_id_slug_key" ON "report_widgets"("tenant_id", "slug");
CREATE INDEX "report_widgets_tenant_id_idx" ON "report_widgets"("tenant_id");

ALTER TABLE "report_exports"
  ADD CONSTRAINT "report_exports_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "report_audit_log"
  ADD CONSTRAINT "report_audit_log_export_id_fkey" FOREIGN KEY ("export_id") REFERENCES "report_exports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "report_audit_log"
  ADD CONSTRAINT "report_audit_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
