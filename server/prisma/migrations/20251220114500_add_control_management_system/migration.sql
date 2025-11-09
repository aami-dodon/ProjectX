-- Control Management enums
CREATE TYPE "ControlStatus" AS ENUM ('DRAFT', 'ACTIVE', 'DEPRECATED');
CREATE TYPE "ControlRiskTier" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "ControlEnforcementLevel" AS ENUM ('ADVISORY', 'MANDATORY');
CREATE TYPE "ControlCoverageLevel" AS ENUM ('FULL', 'PARTIAL', 'COMPENSATING');
CREATE TYPE "ControlFrameworkLinkStatus" AS ENUM ('ACTIVE', 'IN_REVIEW', 'RETIRED');
CREATE TYPE "ControlScoreGranularity" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');
CREATE TYPE "ControlScoreClassification" AS ENUM ('PASSING', 'NEEDS_ATTENTION', 'FAILING');

-- Control catalog
CREATE TABLE "controls" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "rationale" TEXT,
  "implementation_guidance" TEXT,
  "owner_team" TEXT,
  "status" "ControlStatus" NOT NULL DEFAULT 'DRAFT',
  "risk_tier" "ControlRiskTier" NOT NULL DEFAULT 'MEDIUM',
  "enforcement_level" "ControlEnforcementLevel" NOT NULL DEFAULT 'ADVISORY',
  "version" INTEGER NOT NULL DEFAULT 1,
  "domain" TEXT,
  "category" TEXT,
  "sub_category" TEXT,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "metadata" JSONB,
  "impact_weight" DOUBLE PRECISION,
  "created_by" TEXT,
  "updated_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "published_at" TIMESTAMP(3),
  "deprecated_at" TIMESTAMP(3),
  "deprecated_reason" TEXT,
  "remediation_notes" TEXT,
  CONSTRAINT "controls_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "controls_slug_key" ON "controls"("slug");
CREATE INDEX "controls_status_idx" ON "controls"("status");
CREATE INDEX "controls_risk_tier_idx" ON "controls"("risk_tier");
CREATE INDEX "controls_domain_idx" ON "controls"("domain");
CREATE INDEX "controls_category_idx" ON "controls"("category");

-- Framework mappings
CREATE TABLE "control_framework_links" (
  "id" TEXT NOT NULL,
  "control_id" TEXT NOT NULL,
  "framework_id" TEXT,
  "framework_control_id" TEXT,
  "coverage_level" "ControlCoverageLevel" NOT NULL DEFAULT 'PARTIAL',
  "status" "ControlFrameworkLinkStatus" NOT NULL DEFAULT 'ACTIVE',
  "evidence_references" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "effective_from" TIMESTAMP(3),
  "effective_to" TIMESTAMP(3),
  "notes" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "control_framework_links_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "control_framework_links_control_id_idx" ON "control_framework_links"("control_id");
CREATE INDEX "control_framework_links_framework_id_idx" ON "control_framework_links"("framework_id");
CREATE INDEX "control_framework_links_framework_control_id_idx" ON "control_framework_links"("framework_control_id");
CREATE INDEX "control_framework_links_status_idx" ON "control_framework_links"("status");

-- Score snapshots
CREATE TABLE "control_scores" (
  "id" TEXT NOT NULL,
  "control_id" TEXT NOT NULL,
  "granularity" "ControlScoreGranularity" NOT NULL DEFAULT 'DAILY',
  "window_start" TIMESTAMP(3) NOT NULL,
  "window_end" TIMESTAMP(3) NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  "classification" "ControlScoreClassification" NOT NULL,
  "sample_size" INTEGER NOT NULL DEFAULT 0,
  "numerator" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "denominator" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "control_scores_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "control_scores_control_id_granularity_window_start_key"
  ON "control_scores"("control_id", "granularity", "window_start");
CREATE INDEX "control_scores_control_id_idx" ON "control_scores"("control_id");

-- Control audit events
CREATE TABLE "control_audit_events" (
  "id" TEXT NOT NULL,
  "control_id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "actor_id" TEXT,
  "change_summary" TEXT,
  "payload_before" JSONB,
  "payload_after" JSONB,
  "comment" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "control_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "control_audit_events_control_id_idx" ON "control_audit_events"("control_id");

-- Extend check_control_links with assertion metadata
ALTER TABLE "check_control_links"
  ADD COLUMN "assertion_type" TEXT,
  ADD COLUMN "frequency_cadence" TEXT;

-- Backfill placeholder controls for existing references
WITH source AS (
  SELECT DISTINCT control_id, trim(control_id) AS normalized_id
  FROM "check_control_links"
  WHERE control_id IS NOT NULL
  UNION
  SELECT DISTINCT control_id, trim(control_id) AS normalized_id
  FROM "checks"
  WHERE control_id IS NOT NULL
  UNION
  SELECT DISTINCT control_id, trim(control_id) AS normalized_id
  FROM "check_results"
  WHERE control_id IS NOT NULL
)
INSERT INTO "controls" ("id", "slug", "title", "description")
SELECT
  source.control_id,
  substring(
    regexp_replace(
      lower(COALESCE(NULLIF(source.normalized_id, ''), source.control_id, 'legacy-control')),
      '[^a-z0-9]+',
      '-',
      'g'
    ) || '-' || substr(md5(source.control_id || coalesce(source.normalized_id, 'legacy')), 1, 6),
    1,
    80
  ) AS slug,
  COALESCE(NULLIF(source.normalized_id, ''), source.control_id, 'Migrated Control') AS title,
  'Migrated legacy control identifier' AS description
FROM source
ON CONFLICT ("id") DO NOTHING;

-- Foreign keys
ALTER TABLE "control_framework_links"
  ADD CONSTRAINT "control_framework_links_control_id_fkey"
    FOREIGN KEY ("control_id") REFERENCES "controls"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "control_framework_links_framework_id_fkey"
    FOREIGN KEY ("framework_id") REFERENCES "frameworks"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "control_framework_links_framework_control_id_fkey"
    FOREIGN KEY ("framework_control_id") REFERENCES "framework_controls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "control_scores"
  ADD CONSTRAINT "control_scores_control_id_fkey"
    FOREIGN KEY ("control_id") REFERENCES "controls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "control_audit_events"
  ADD CONSTRAINT "control_audit_events_control_id_fkey"
    FOREIGN KEY ("control_id") REFERENCES "controls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "checks"
  ADD CONSTRAINT "checks_control_id_fkey"
    FOREIGN KEY ("control_id") REFERENCES "controls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "check_results"
  ADD CONSTRAINT "check_results_control_id_fkey"
    FOREIGN KEY ("control_id") REFERENCES "controls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "check_control_links"
  ADD CONSTRAINT "check_control_links_control_id_fkey"
    FOREIGN KEY ("control_id") REFERENCES "controls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
