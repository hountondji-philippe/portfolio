-- CreateEnum
CREATE TYPE "StatutFormation" AS ENUM ('EN_COURS', 'OBTENU');

-- CreateTable
CREATE TABLE "formations" (
    "id" TEXT NOT NULL,
    "titre" VARCHAR(200) NOT NULL,
    "ecole" VARCHAR(200),
    "periode" VARCHAR(100),
    "description" TEXT,
    "statut" "StatutFormation" NOT NULL DEFAULT 'OBTENU',
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "formations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "formations_statut_ordre_idx" ON "formations"("statut", "ordre");
