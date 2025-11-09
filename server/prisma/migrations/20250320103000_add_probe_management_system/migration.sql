-- Create enums for the Probe Management domain
CREATE TYPE "ProbeStatus" AS ENUM ('DRAFT', 'ACTIVE', 'DEPRECATED');
CREATE TYPE "ProbeDeploymentStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'ROLLED_BACK', 'CANCELLED');
CREATE TYPE "ProbeScheduleType" AS ENUM ('CRON', 'EVENT', 'ADHOC');
CREATE TYPE "ProbeSchedulePriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
CREATE TYPE "ProbeScheduleStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DISABLED');
CREATE TYPE "ProbeHeartbeatStatus" AS ENUM ('OPERATIONAL', 'DEGRADED', 'OUTAGE', 'UNKNOWN');
CREATE TYPE "ProbeCredentialType" AS ENUM ('API_KEY', 'MTLS', 'TOKEN');
CREATE TYPE "ProbeCredentialStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'REVOKED');
CREATE TYPE "ProbeEventType" AS ENUM ('HEARTBEAT', 'EVIDENCE', 'FAILURE', 'DEPLOYMENT', 'RUN');

-- Central probe registry metadata
CREATE TABLE "probes" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "owner_email" TEXT NOT NULL,
  "owner_team" TEXT,
  "status" "ProbeStatus" NOT NULL DEFAULT 'DRAFT',
  "framework_bindings" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "evidence_schema" JSONB,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "environment_overlays" JSONB,
  "sdk_version_min" TEXT,
  "sdk_version_target" TEXT,
  "heartbeat_interval_seconds" INTEGER,
  "alert_channels" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "last_deployed_at" TIMESTAMP(3),
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "probes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "probes_slug_key" ON "probes"("slug");
CREATE INDEX "probes_status_idx" ON "probes"("status");

-- Deployment history per probe + environment
CREATE TABLE "probe_deployments" (
  "id" TEXT NOT NULL,
  "probe_id" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "environment" TEXT NOT NULL,
  "canary_percent" INTEGER,
  "status" "ProbeDeploymentStatus" NOT NULL DEFAULT 'PENDING',
  "summary" TEXT,
  "manifest" JSONB,
  "metadata" JSONB,
  "self_test_snapshot" JSONB,
  "started_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "rolled_back_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "probe_deployments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "probe_deployments_probe_id_idx" ON "probe_deployments"("probe_id");
CREATE INDEX "probe_deployments_probe_id_environment_idx" ON "probe_deployments"("probe_id", "environment");

-- Schedules + triggers
CREATE TABLE "probe_schedules" (
  "id" TEXT NOT NULL,
  "probe_id" TEXT NOT NULL,
  "type" "ProbeScheduleType" NOT NULL,
  "expression" TEXT,
  "priority" "ProbeSchedulePriority" NOT NULL DEFAULT 'NORMAL',
  "status" "ProbeScheduleStatus" NOT NULL DEFAULT 'ACTIVE',
  "controls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "trigger_metadata" JSONB,
  "metadata" JSONB,
  "last_run_at" TIMESTAMP(3),
  "next_run_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "probe_schedules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "probe_schedules_probe_id_idx" ON "probe_schedules"("probe_id");
CREATE INDEX "probe_schedules_probe_id_status_idx" ON "probe_schedules"("probe_id", "status");

-- Real-time metrics snapshot per probe
CREATE TABLE "probe_metrics" (
  "id" TEXT NOT NULL,
  "probe_id" TEXT NOT NULL,
  "heartbeat_status" "ProbeHeartbeatStatus" NOT NULL DEFAULT 'UNKNOWN',
  "heartbeat_interval_seconds" INTEGER,
  "last_heartbeat_at" TIMESTAMP(3),
  "failure_count_24h" INTEGER NOT NULL DEFAULT 0,
  "latency_p95_ms" INTEGER,
  "latency_p99_ms" INTEGER,
  "error_rate_percent" DOUBLE PRECISION,
  "evidence_throughput_per_hour" INTEGER,
  "last_error_code" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "probe_metrics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "probe_metrics_probe_id_key" ON "probe_metrics"("probe_id");

-- Credential issuance + status
CREATE TABLE "probe_credentials" (
  "id" TEXT NOT NULL,
  "probe_id" TEXT NOT NULL,
  "type" "ProbeCredentialType" NOT NULL,
  "credential_hash" TEXT NOT NULL,
  "status" "ProbeCredentialStatus" NOT NULL DEFAULT 'ACTIVE',
  "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMP(3),
  "rotated_at" TIMESTAMP(3),
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "probe_credentials_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "probe_credentials_probe_id_idx" ON "probe_credentials"("probe_id");

-- Append-only probe events
CREATE TABLE "probe_events" (
  "id" TEXT NOT NULL,
  "probe_id" TEXT NOT NULL,
  "type" "ProbeEventType" NOT NULL,
  "payload" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "probe_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "probe_events_probe_id_idx" ON "probe_events"("probe_id");
CREATE INDEX "probe_events_created_at_idx" ON "probe_events"("created_at");

-- Foreign keys
ALTER TABLE "probe_deployments"
  ADD CONSTRAINT "probe_deployments_probe_id_fkey" FOREIGN KEY ("probe_id") REFERENCES "probes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "probe_schedules"
  ADD CONSTRAINT "probe_schedules_probe_id_fkey" FOREIGN KEY ("probe_id") REFERENCES "probes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "probe_metrics"
  ADD CONSTRAINT "probe_metrics_probe_id_fkey" FOREIGN KEY ("probe_id") REFERENCES "probes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "probe_credentials"
  ADD CONSTRAINT "probe_credentials_probe_id_fkey" FOREIGN KEY ("probe_id") REFERENCES "probes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "probe_events"
  ADD CONSTRAINT "probe_events_probe_id_fkey" FOREIGN KEY ("probe_id") REFERENCES "probes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
