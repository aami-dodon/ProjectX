-- Enums for the Check Management system
CREATE TYPE "CheckType" AS ENUM ('AUTOMATED', 'MANUAL', 'HYBRID');
CREATE TYPE "CheckStatus" AS ENUM ('DRAFT', 'READY_FOR_VALIDATION', 'ACTIVE', 'RETIRED');
CREATE TYPE "CheckSeverity" AS ENUM ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "CheckResultStatus" AS ENUM ('PASS', 'FAIL', 'WARNING', 'PENDING_REVIEW', 'ERROR');
CREATE TYPE "CheckResultPublicationState" AS ENUM ('PENDING', 'VALIDATED', 'PUBLISHED', 'REJECTED');
CREATE TYPE "ReviewQueueState" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'ESCALATED');
CREATE TYPE "ReviewQueuePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE "CheckControlEnforcementLevel" AS ENUM ('OPTIONAL', 'RECOMMENDED', 'MANDATORY');
CREATE TYPE "CheckNotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'CANCELLED');

-- Master catalogue of checks
CREATE TABLE "checks" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "type" "CheckType" NOT NULL DEFAULT 'AUTOMATED',
  "status" "CheckStatus" NOT NULL DEFAULT 'DRAFT',
  "severity_default" "CheckSeverity" NOT NULL DEFAULT 'MEDIUM',
  "control_id" TEXT,
  "probe_id" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "frequency" TEXT,
  "metadata" JSONB,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "created_by" TEXT,
  "updated_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_run_at" TIMESTAMP(3),
  "next_run_at" TIMESTAMP(3),
  "ready_at" TIMESTAMP(3),
  "retired_at" TIMESTAMP(3),
  CONSTRAINT "checks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "checks_status_idx" ON "checks"("status");
CREATE INDEX "checks_control_id_idx" ON "checks"("control_id");
CREATE INDEX "checks_probe_id_idx" ON "checks"("probe_id");

-- Version snapshots for auditability
CREATE TABLE "check_versions" (
  "id" TEXT NOT NULL,
  "check_id" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "status_snapshot" "CheckStatus" NOT NULL,
  "definition" JSONB,
  "diff" JSONB,
  "notes" TEXT,
  "created_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "check_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "check_versions_check_id_version_key" ON "check_versions"("check_id", "version");

-- Execution history
CREATE TABLE "check_results" (
  "id" TEXT NOT NULL,
  "check_id" TEXT NOT NULL,
  "control_id" TEXT,
  "run_context" TEXT,
  "trigger_source" TEXT,
  "status" "CheckResultStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
  "severity" "CheckSeverity" NOT NULL DEFAULT 'MEDIUM',
  "evidence_link_id" TEXT,
  "notes" TEXT,
  "metadata" JSONB,
  "raw_output" JSONB,
  "executed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "validated_at" TIMESTAMP(3),
  "published_at" TIMESTAMP(3),
  "publication_state" "CheckResultPublicationState" NOT NULL DEFAULT 'PENDING',
  "created_by" TEXT,
  "updated_at" TIMESTAMP(3),
  CONSTRAINT "check_results_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "check_results_check_id_idx" ON "check_results"("check_id");
CREATE INDEX "check_results_control_id_idx" ON "check_results"("control_id");
CREATE INDEX "check_results_status_idx" ON "check_results"("status");

-- Manual / hybrid review queue
CREATE TABLE "review_queue_items" (
  "id" TEXT NOT NULL,
  "check_id" TEXT NOT NULL,
  "result_id" TEXT,
  "assigned_to" TEXT,
  "due_at" TIMESTAMP(3),
  "priority" "ReviewQueuePriority" NOT NULL DEFAULT 'MEDIUM',
  "state" "ReviewQueueState" NOT NULL DEFAULT 'OPEN',
  "sla_minutes" INTEGER,
  "acknowledged_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "escalation_level" TEXT,
  "evidence_bundle_id" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "review_queue_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "review_queue_items_result_id_key" ON "review_queue_items"("result_id");
CREATE INDEX "review_queue_items_check_id_idx" ON "review_queue_items"("check_id");
CREATE INDEX "review_queue_items_state_idx" ON "review_queue_items"("state");

-- Control coverage links
CREATE TABLE "check_control_links" (
  "id" TEXT NOT NULL,
  "check_id" TEXT NOT NULL,
  "control_id" TEXT NOT NULL,
  "weight" DOUBLE PRECISION DEFAULT 1,
  "enforcement_level" "CheckControlEnforcementLevel" NOT NULL DEFAULT 'OPTIONAL',
  "evidence_requirements" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "check_control_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "check_control_links_check_id_control_id_key" ON "check_control_links"("check_id", "control_id");

-- Notification ledger
CREATE TABLE "check_notifications" (
  "id" TEXT NOT NULL,
  "check_id" TEXT NOT NULL,
  "result_id" TEXT,
  "template" TEXT NOT NULL,
  "channel" TEXT,
  "recipient" TEXT,
  "status" "CheckNotificationStatus" NOT NULL DEFAULT 'PENDING',
  "correlation_id" TEXT,
  "metadata" JSONB,
  "sent_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "check_notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "check_notifications_check_id_idx" ON "check_notifications"("check_id");
CREATE INDEX "check_notifications_result_id_idx" ON "check_notifications"("result_id");

-- Foreign keys
ALTER TABLE "check_versions"
  ADD CONSTRAINT "check_versions_check_id_fkey" FOREIGN KEY ("check_id") REFERENCES "checks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "check_results"
  ADD CONSTRAINT "check_results_check_id_fkey" FOREIGN KEY ("check_id") REFERENCES "checks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "review_queue_items"
  ADD CONSTRAINT "review_queue_items_check_id_fkey" FOREIGN KEY ("check_id") REFERENCES "checks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "review_queue_items"
  ADD CONSTRAINT "review_queue_items_result_id_fkey" FOREIGN KEY ("result_id") REFERENCES "check_results"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "check_control_links"
  ADD CONSTRAINT "check_control_links_check_id_fkey" FOREIGN KEY ("check_id") REFERENCES "checks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "check_notifications"
  ADD CONSTRAINT "check_notifications_check_id_fkey" FOREIGN KEY ("check_id") REFERENCES "checks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "check_notifications"
  ADD CONSTRAINT "check_notifications_result_id_fkey" FOREIGN KEY ("result_id") REFERENCES "check_results"("id") ON DELETE SET NULL ON UPDATE CASCADE;
