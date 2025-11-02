-- AlterTable
ALTER TABLE "audit_logs"
    ADD COLUMN "changes" JSONB,
    ADD COLUMN "affected_user_id" TEXT,
    ADD COLUMN "performed_by_id" TEXT;

-- DropIndex
DROP INDEX IF EXISTS "audit_logs_user_id_idx";

-- CreateIndex
CREATE INDEX "audit_logs_performed_by_id_idx" ON "audit_logs" ("performed_by_id");
CREATE INDEX "audit_logs_affected_user_id_idx" ON "audit_logs" ("affected_user_id");
