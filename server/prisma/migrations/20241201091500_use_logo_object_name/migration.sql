-- AlterTable
ALTER TABLE "branding_settings"
ADD COLUMN     "logo_object_name" TEXT,
DROP COLUMN    "logo_url";
