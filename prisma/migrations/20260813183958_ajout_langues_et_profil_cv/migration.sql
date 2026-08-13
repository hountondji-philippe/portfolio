/*
  Warnings:

  - You are about to drop the column `cv_url` on the `site_settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "site_settings" DROP COLUMN "cv_url",
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "email_public" VARCHAR(254),
ADD COLUMN     "localisation" VARCHAR(150),
ADD COLUMN     "photo_url" TEXT,
ADD COLUMN     "qualites" VARCHAR(500),
ADD COLUMN     "telephone" VARCHAR(30),
ADD COLUMN     "titre_pro" VARCHAR(150);

-- CreateTable
CREATE TABLE "langues" (
    "id" TEXT NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "niveau" VARCHAR(50) NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "langues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "langues_ordre_idx" ON "langues"("ordre");
