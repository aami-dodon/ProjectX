-- Framework Mapping System schema additions
CREATE TYPE "FrameworkStatus" AS ENUM ('DRAFT', 'ACTIVE', 'RETIRED');
CREATE TYPE "FrameworkVersionStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'RETIRED');
CREATE TYPE "FrameworkControlStatus" AS ENUM ('DRAFT', 'ACTIVE', 'RETIRED');
CREATE TYPE "FrameworkMappingStrength" AS ENUM ('EXACT', 'PARTIAL', 'INFORMATIVE');
CREATE TYPE "FrameworkMappingStatus" AS ENUM ('ACTIVE', 'IN_REVIEW', 'RETIRED');
CREATE TYPE "FrameworkJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

CREATE TABLE "frameworks" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "domain" TEXT,
  "jurisdiction" TEXT,
  "publisher" TEXT,
  "status" "FrameworkStatus" NOT NULL DEFAULT 'DRAFT',
  "valid_from" TIMESTAMP(3),
  "valid_to" TIMESTAMP(3),
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "metadata" JSONB,
  "active_version_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "frameworks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "frameworks_slug_key" ON "frameworks"("slug");
CREATE UNIQUE INDEX "frameworks_active_version_id_key" ON "frameworks"("active_version_id");
CREATE INDEX "frameworks_status_idx" ON "frameworks"("status");
CREATE INDEX "frameworks_jurisdiction_idx" ON "frameworks"("jurisdiction");
CREATE INDEX "frameworks_publisher_idx" ON "frameworks"("publisher");
CREATE INDEX "frameworks_domain_idx" ON "frameworks"("domain");

CREATE TABLE "framework_versions" (
  "id" TEXT NOT NULL,
  "framework_id" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "status" "FrameworkVersionStatus" NOT NULL DEFAULT 'DRAFT',
  "changelog" TEXT,
  "diff_hash" TEXT,
  "diff_summary" JSONB,
  "approvals" JSONB,
  "metadata" JSONB,
  "effective_from" TIMESTAMP(3),
  "effective_to" TIMESTAMP(3),
  "published_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "framework_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "framework_versions_framework_id_version_key" ON "framework_versions"("framework_id", "version");
CREATE INDEX "framework_versions_framework_id_idx" ON "framework_versions"("framework_id");
CREATE INDEX "framework_versions_status_idx" ON "framework_versions"("status");

CREATE TABLE "framework_controls" (
  "id" TEXT NOT NULL,
  "framework_id" TEXT NOT NULL,
  "framework_version_id" TEXT,
  "code" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT,
  "risk_level" TEXT,
  "status" "FrameworkControlStatus" NOT NULL DEFAULT 'DRAFT',
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "evidence_requirements" JSONB,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "framework_controls_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "framework_controls_framework_id_code_key" ON "framework_controls"("framework_id", "code");
CREATE INDEX "framework_controls_framework_version_id_idx" ON "framework_controls"("framework_version_id");
CREATE INDEX "framework_controls_status_idx" ON "framework_controls"("status");

CREATE TABLE "framework_mappings" (
  "id" TEXT NOT NULL,
  "source_framework_id" TEXT NOT NULL,
  "source_control_id" TEXT NOT NULL,
  "target_framework_id" TEXT NOT NULL,
  "target_control_id" TEXT NOT NULL,
  "mapping_strength" "FrameworkMappingStrength" NOT NULL DEFAULT 'EXACT',
  "status" "FrameworkMappingStatus" NOT NULL DEFAULT 'ACTIVE',
  "justification" TEXT,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "framework_mappings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "framework_mappings_source_control_id_target_control_id_key" ON "framework_mappings"("source_control_id", "target_control_id");
CREATE INDEX "framework_mappings_source_framework_id_idx" ON "framework_mappings"("source_framework_id");
CREATE INDEX "framework_mappings_target_framework_id_idx" ON "framework_mappings"("target_framework_id");
CREATE INDEX "framework_mappings_mapping_strength_idx" ON "framework_mappings"("mapping_strength");

CREATE TABLE "framework_mapping_history" (
  "id" TEXT NOT NULL,
  "mapping_id" TEXT NOT NULL,
  "change_type" TEXT NOT NULL,
  "actor_id" TEXT,
  "payload_before" JSONB,
  "payload_after" JSONB,
  "justification" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "framework_mapping_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "framework_mapping_history_mapping_id_idx" ON "framework_mapping_history"("mapping_id");

CREATE TABLE "framework_imports" (
  "id" TEXT NOT NULL,
  "framework_id" TEXT,
  "source" TEXT,
  "format" TEXT,
  "status" "FrameworkJobStatus" NOT NULL DEFAULT 'PENDING',
  "artifact_uri" TEXT,
  "error_details" JSONB,
  "metadata" JSONB,
  "started_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "framework_imports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "framework_imports_framework_id_idx" ON "framework_imports"("framework_id");
CREATE INDEX "framework_imports_status_idx" ON "framework_imports"("status");

CREATE TABLE "framework_exports" (
  "id" TEXT NOT NULL,
  "framework_id" TEXT,
  "format" TEXT,
  "status" "FrameworkJobStatus" NOT NULL DEFAULT 'PENDING',
  "destination" TEXT,
  "artifact_uri" TEXT,
  "error_details" JSONB,
  "metadata" JSONB,
  "started_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "framework_exports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "framework_exports_framework_id_idx" ON "framework_exports"("framework_id");
CREATE INDEX "framework_exports_status_idx" ON "framework_exports"("status");

CREATE TABLE "framework_audit_log" (
  "id" TEXT NOT NULL,
  "framework_id" TEXT,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT,
  "action" TEXT NOT NULL,
  "actor_id" TEXT,
  "payload_before" JSONB,
  "payload_after" JSONB,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "framework_audit_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "framework_audit_log_framework_id_idx" ON "framework_audit_log"("framework_id");
CREATE INDEX "framework_audit_log_entity_type_idx" ON "framework_audit_log"("entity_type");

ALTER TABLE "framework_versions"
  ADD CONSTRAINT "framework_versions_framework_id_fkey" FOREIGN KEY ("framework_id") REFERENCES "frameworks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "frameworks"
  ADD CONSTRAINT "frameworks_active_version_id_fkey" FOREIGN KEY ("active_version_id") REFERENCES "framework_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "framework_controls"
  ADD CONSTRAINT "framework_controls_framework_id_fkey" FOREIGN KEY ("framework_id") REFERENCES "frameworks"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "framework_controls_framework_version_id_fkey" FOREIGN KEY ("framework_version_id") REFERENCES "framework_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "framework_mappings"
  ADD CONSTRAINT "framework_mappings_source_framework_id_fkey" FOREIGN KEY ("source_framework_id") REFERENCES "frameworks"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "framework_mappings_target_framework_id_fkey" FOREIGN KEY ("target_framework_id") REFERENCES "frameworks"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "framework_mappings_source_control_id_fkey" FOREIGN KEY ("source_control_id") REFERENCES "framework_controls"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "framework_mappings_target_control_id_fkey" FOREIGN KEY ("target_control_id") REFERENCES "framework_controls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "framework_mapping_history"
  ADD CONSTRAINT "framework_mapping_history_mapping_id_fkey" FOREIGN KEY ("mapping_id") REFERENCES "framework_mappings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "framework_imports"
  ADD CONSTRAINT "framework_imports_framework_id_fkey" FOREIGN KEY ("framework_id") REFERENCES "frameworks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "framework_exports"
  ADD CONSTRAINT "framework_exports_framework_id_fkey" FOREIGN KEY ("framework_id") REFERENCES "frameworks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "framework_audit_log"
  ADD CONSTRAINT "framework_audit_log_framework_id_fkey" FOREIGN KEY ("framework_id") REFERENCES "frameworks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
