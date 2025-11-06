-- Add RBAC metadata columns to auth_roles
ALTER TABLE "auth_roles"
  ADD COLUMN "tenant_id" TEXT,
  ADD COLUMN "domain" TEXT,
  ADD COLUMN "inherits_role_id" TEXT,
  ADD COLUMN "review_cadence_days" INTEGER,
  ADD COLUMN "metadata" JSONB,
  ADD COLUMN "archived_at" TIMESTAMP(3);

CREATE INDEX "auth_roles_tenant_id_idx" ON "auth_roles"("tenant_id");
CREATE INDEX "auth_roles_domain_idx" ON "auth_roles"("domain");
CREATE INDEX "auth_roles_inherits_role_id_idx" ON "auth_roles"("inherits_role_id");

ALTER TABLE "auth_roles"
  ADD CONSTRAINT "auth_roles_inherits_role_id_fkey"
  FOREIGN KEY ("inherits_role_id") REFERENCES "auth_roles"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Extend auth_role_assignments with domain scoping
ALTER TABLE "auth_role_assignments"
  ADD COLUMN "domain" TEXT;

CREATE INDEX "auth_role_assignments_domain_idx" ON "auth_role_assignments"("domain");

-- Create Casbin policy storage
CREATE TABLE "auth_policies" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "subject" TEXT,
  "domain" TEXT,
  "object" TEXT,
  "action" TEXT,
  "effect" TEXT NOT NULL DEFAULT 'allow',
  "description" TEXT,
  "metadata" JSONB,
  "created_by_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "auth_policies_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "auth_policies_type_idx" ON "auth_policies"("type");
CREATE INDEX "auth_policies_subject_idx" ON "auth_policies"("subject");
CREATE INDEX "auth_policies_domain_idx" ON "auth_policies"("domain");
CREATE INDEX "auth_policies_object_idx" ON "auth_policies"("object");
CREATE INDEX "auth_policies_action_idx" ON "auth_policies"("action");

ALTER TABLE "auth_policies"
  ADD CONSTRAINT "auth_policies_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "auth_users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Create policy revision history
CREATE TABLE "auth_policy_revisions" (
  "id" TEXT NOT NULL,
  "policy_id" TEXT,
  "change_type" TEXT NOT NULL,
  "justification" TEXT,
  "summary" TEXT,
  "payload" JSONB,
  "created_by_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "auth_policy_revisions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "auth_policy_revisions_policy_id_idx" ON "auth_policy_revisions"("policy_id");
CREATE INDEX "auth_policy_revisions_created_by_id_idx" ON "auth_policy_revisions"("created_by_id");

ALTER TABLE "auth_policy_revisions"
  ADD CONSTRAINT "auth_policy_revisions_policy_id_fkey"
  FOREIGN KEY ("policy_id") REFERENCES "auth_policies"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "auth_policy_revisions"
  ADD CONSTRAINT "auth_policy_revisions_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "auth_users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
