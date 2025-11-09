-- Enums for the Task Management system
CREATE TYPE "TaskStatus" AS ENUM ('DRAFT', 'OPEN', 'IN_PROGRESS', 'AWAITING_EVIDENCE', 'PENDING_VERIFICATION', 'RESOLVED', 'CLOSED');
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "TaskSource" AS ENUM ('CHECK_FAILURE', 'CONTROL_REMEDIATION', 'MANUAL', 'IMPORT', 'OTHER');
CREATE TYPE "TaskEvidenceStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Task records
CREATE TABLE "tasks" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
  "status" "TaskStatus" NOT NULL DEFAULT 'DRAFT',
  "source" "TaskSource" NOT NULL DEFAULT 'MANUAL',
  "control_id" TEXT,
  "check_id" TEXT,
  "framework_id" TEXT,
  "created_by" TEXT,
  "assignee_id" TEXT,
  "team_id" TEXT,
  "delegation_expires_at" TIMESTAMP(3),
  "sla_due_at" TIMESTAMP(3),
  "escalation_level" INTEGER NOT NULL DEFAULT 0,
  "external_issue_key" TEXT,
  "external_provider" TEXT,
  "verification_required" BOOLEAN NOT NULL DEFAULT TRUE,
  "verification_completed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolved_at" TIMESTAMP(3),
  "closed_at" TIMESTAMP(3),
  CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tasks_status_idx" ON "tasks"("status");
CREATE INDEX "tasks_assignee_id_idx" ON "tasks"("assignee_id");
CREATE INDEX "tasks_team_id_idx" ON "tasks"("team_id");
CREATE INDEX "tasks_sla_due_at_idx" ON "tasks"("sla_due_at");
CREATE INDEX "tasks_escalation_level_idx" ON "tasks"("escalation_level");

-- Event ledger
CREATE TABLE "task_events" (
  "id" TEXT NOT NULL,
  "task_id" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "payload" JSONB,
  "actor_id" TEXT,
  "actor_type" TEXT,
  "origin" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "task_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "task_events_task_id_idx" ON "task_events"("task_id");
CREATE INDEX "task_events_event_type_idx" ON "task_events"("event_type");
CREATE INDEX "task_events_actor_id_idx" ON "task_events"("actor_id");

-- Assignment history
CREATE TABLE "task_assignments" (
  "id" TEXT NOT NULL,
  "task_id" TEXT NOT NULL,
  "assignee_id" TEXT,
  "team_id" TEXT,
  "delegated_by" TEXT,
  "delegation_expires_at" TIMESTAMP(3),
  "justification" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revoked_at" TIMESTAMP(3),
  CONSTRAINT "task_assignments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "task_assignments_task_id_idx" ON "task_assignments"("task_id");
CREATE INDEX "task_assignments_assignee_id_idx" ON "task_assignments"("assignee_id");
CREATE INDEX "task_assignments_team_id_idx" ON "task_assignments"("team_id");

-- Evidence linkage bridge
CREATE TABLE "task_evidence_links" (
  "id" TEXT NOT NULL,
  "task_id" TEXT NOT NULL,
  "evidence_id" TEXT NOT NULL,
  "link_type" TEXT,
  "reviewer_id" TEXT,
  "verification_status" "TaskEvidenceStatus" NOT NULL DEFAULT 'PENDING',
  "verified_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "task_evidence_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "task_evidence_links_task_id_evidence_id_key" ON "task_evidence_links"("task_id", "evidence_id");
CREATE INDEX "task_evidence_links_verification_status_idx" ON "task_evidence_links"("verification_status");

-- SLA metrics
CREATE TABLE "task_sla_metrics" (
  "id" TEXT NOT NULL,
  "task_id" TEXT NOT NULL,
  "time_to_acknowledge" INTEGER,
  "time_in_status" JSONB,
  "time_to_close" INTEGER,
  "breach_count" INTEGER NOT NULL DEFAULT 0,
  "last_breach_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "task_sla_metrics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "task_sla_metrics_task_id_key" ON "task_sla_metrics"("task_id");
CREATE INDEX "task_sla_metrics_last_breach_at_idx" ON "task_sla_metrics"("last_breach_at");

-- Foreign keys
ALTER TABLE "tasks"
  ADD CONSTRAINT "tasks_check_id_fkey" FOREIGN KEY ("check_id") REFERENCES "checks"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "task_events"
  ADD CONSTRAINT "task_events_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "task_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "task_assignments"
  ADD CONSTRAINT "task_assignments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "task_assignments_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "task_assignments_delegated_by_fkey" FOREIGN KEY ("delegated_by") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "task_evidence_links"
  ADD CONSTRAINT "task_evidence_links_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "task_evidence_links_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "task_sla_metrics"
  ADD CONSTRAINT "task_sla_metrics_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
