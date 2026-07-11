-- CreateTable
CREATE TABLE "site_settings" (
    "id" VARCHAR(20) NOT NULL DEFAULT 'main',
    "cv_url" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);
