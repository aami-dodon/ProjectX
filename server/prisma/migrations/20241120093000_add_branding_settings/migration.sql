-- CreateTable
CREATE TABLE "branding_settings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sidebar_title" TEXT NOT NULL,
    "logo_url" TEXT NOT NULL,
    "search_placeholder" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "branding_settings_pkey" PRIMARY KEY ("id")
);
