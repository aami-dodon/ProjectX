-- Add a unique constraint to prevent duplicate role assignments per user
CREATE UNIQUE INDEX "auth_role_assignments_user_id_role_id_key"
  ON "auth_role_assignments"("user_id", "role_id");
