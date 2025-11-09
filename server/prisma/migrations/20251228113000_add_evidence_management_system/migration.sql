-- Enums for the Evidence Management system
CREATE TYPE "EvidenceRetentionState" AS ENUM ('ACTIVE', 'ARCHIVED', 'LEGAL_HOLD', 'PURGE_SCHEDULED');
CREATE TYPE "EvidenceSource" AS ENUM ('MANUAL', 'PROBE', 'API', 'IMPORT');
CREATE TYPE "EvidenceEventAction" AS ENUM (
  'UPLOAD_REQUESTED',
  'UPLOAD_CONFIRMED',
  'DOWNLOAD_ISSUED',
  'METADATA_UPDATED',
  'LINK_ATTACHED',
  'LINK_REMOVED',
  'RETENTION_UPDATED'
);

-- Retention policies master table
CREATE TABLE "evidence_retention_policies" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "retention_months" INTEGER NOT NULL,
  "archive_after_months" INTEGER,
  "description" TEXT,
  "is_default" BOOLEAN NOT NULL DEFAULT FALSE,
  "legal_hold_allowed" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "evidence_retention_policies_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "evidence_retention_policies_is_default_idx"
  ON "evidence_retention_policies"("is_default");

-- Evidence catalogue
CREATE TABLE "evidence" (
  "id" TEXT NOT NULL,
  "display_name" TEXT NOT NULL,
  "description" TEXT,
  "storage_key" TEXT NOT NULL,
  "object_name" TEXT NOT NULL,
  "bucket" TEXT NOT NULL,
  "mime_type" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "checksum" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "source" "EvidenceSource" NOT NULL DEFAULT 'MANUAL',
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "retention_state" "EvidenceRetentionState" NOT NULL DEFAULT 'ACTIVE',
  "retention_policy_id" TEXT,
  "purge_scheduled_for" TIMESTAMP(3),
  "archived_at" TIMESTAMP(3),
  "legal_hold_applied_at" TIMESTAMP(3),
  "metadata" JSONB,
  "uploader_id" TEXT NOT NULL,
  "download_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "evidence_storage_key_key" ON "evidence"("storage_key");
CREATE INDEX "evidence_retention_state_idx" ON "evidence"("retention_state");
CREATE INDEX "evidence_retention_policy_id_idx" ON "evidence"("retention_policy_id");
CREATE INDEX "evidence_created_at_idx" ON "evidence"("created_at");
CREATE INDEX "evidence_uploader_id_idx" ON "evidence"("uploader_id");

ALTER TABLE "evidence"
  ADD CONSTRAINT "evidence_uploader_id_fkey"
    FOREIGN KEY ("uploader_id") REFERENCES "auth_users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "evidence"
  ADD CONSTRAINT "evidence_retention_policy_id_fkey"
    FOREIGN KEY ("retention_policy_id") REFERENCES "evidence_retention_policies"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Evidence linkage to governance entities
CREATE TABLE "evidence_links" (
  "id" TEXT NOT NULL,
  "evidence_id" TEXT NOT NULL,
  "control_id" TEXT,
  "check_id" TEXT,
  "task_reference" TEXT,
  "role" TEXT,
  "justification" TEXT,
  "linked_by" TEXT,
  "linked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,
  CONSTRAINT "evidence_links_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "evidence_links_control_id_idx" ON "evidence_links"("control_id");
CREATE INDEX "evidence_links_check_id_idx" ON "evidence_links"("check_id");
CREATE INDEX "evidence_links_task_reference_idx" ON "evidence_links"("task_reference");

ALTER TABLE "evidence_links"
  ADD CONSTRAINT "evidence_links_evidence_id_fkey"
    FOREIGN KEY ("evidence_id") REFERENCES "evidence"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "evidence_links"
  ADD CONSTRAINT "evidence_links_control_id_fkey"
    FOREIGN KEY ("control_id") REFERENCES "controls"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "evidence_links"
  ADD CONSTRAINT "evidence_links_check_id_fkey"
    FOREIGN KEY ("check_id") REFERENCES "checks"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Evidence event ledger
CREATE TABLE "evidence_events" (
  "id" TEXT NOT NULL,
  "evidence_id" TEXT NOT NULL,
  "actor_id" TEXT,
  "action" "EvidenceEventAction" NOT NULL,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "evidence_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "evidence_events_evidence_id_idx" ON "evidence_events"("evidence_id");
CREATE INDEX "evidence_events_action_idx" ON "evidence_events"("action");

ALTER TABLE "evidence_events"
  ADD CONSTRAINT "evidence_events_evidence_id_fkey"
    FOREIGN KEY ("evidence_id") REFERENCES "evidence"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Evidence version snapshots
CREATE TABLE "evidence_versions" (
  "id" TEXT NOT NULL,
  "evidence_id" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "checksum" TEXT NOT NULL,
  "storage_key" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" TEXT,
  CONSTRAINT "evidence_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "evidence_versions_evidence_id_version_key"
  ON "evidence_versions"("evidence_id", "version");

ALTER TABLE "evidence_versions"
  ADD CONSTRAINT "evidence_versions_evidence_id_fkey"
    FOREIGN KEY ("evidence_id") REFERENCES "evidence"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "task_evidence_links"
  ADD CONSTRAINT "task_evidence_links_evidence_id_fkey"
    FOREIGN KEY ("evidence_id") REFERENCES "evidence"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
