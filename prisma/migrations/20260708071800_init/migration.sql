-- CreateEnum
CREATE TYPE "CategorieCompetence" AS ENUM ('FRONTEND', 'BACKEND', 'MOBILE', 'RESEAUX_INFRA', 'MARKETING_DIGITAL', 'DESIGN_CONTENU', 'AUTRE');

-- CreateEnum
CREATE TYPE "TypeProjet" AS ENUM ('ACADEMIQUE', 'PROFESSIONNEL');

-- CreateEnum
CREATE TYPE "StatutProjet" AS ENUM ('TERMINE', 'EN_COURS', 'PREVU');

-- CreateEnum
CREATE TYPE "StatutExperience" AS ENUM ('TERMINE', 'EN_COURS', 'PREVU', 'RECHERCHE');

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revoked_tokens" (
    "jti" VARCHAR(128) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revoked_tokens_pkey" PRIMARY KEY ("jti")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "phone" VARCHAR(20),
    "message" TEXT NOT NULL,
    "ip_address" VARCHAR(45),
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "replied_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "icone" VARCHAR(255) NOT NULL,
    "categorie" "CategorieCompetence" NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "titre" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "technologies" VARCHAR(500),
    "lien_site" VARCHAR(500),
    "lien_github" VARCHAR(500),
    "image_url" TEXT,
    "type" "TypeProjet" NOT NULL,
    "statut" "StatutProjet" NOT NULL DEFAULT 'TERMINE',
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiences" (
    "id" TEXT NOT NULL,
    "titre" VARCHAR(200) NOT NULL,
    "type_exp" VARCHAR(100),
    "entreprise" VARCHAR(200),
    "lieu" VARCHAR(200),
    "date_debut" VARCHAR(100),
    "date_fin" VARCHAR(100),
    "description" TEXT,
    "tags" VARCHAR(500),
    "statut" "StatutExperience" NOT NULL DEFAULT 'TERMINE',
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitor_sessions" (
    "session_id" VARCHAR(64) NOT NULL,
    "premiere_vue" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "derniere_vue" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nb_pages" INTEGER NOT NULL DEFAULT 1,
    "nb_actions" INTEGER NOT NULL DEFAULT 0,
    "user_agent" TEXT,
    "ip_hash" VARCHAR(64),
    "pays" VARCHAR(100),
    "ville" VARCHAR(100),

    CONSTRAINT "visitor_sessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "visits" (
    "id" TEXT NOT NULL,
    "session_id" VARCHAR(64) NOT NULL,
    "page" VARCHAR(255) NOT NULL,
    "referrer" TEXT,
    "user_agent" TEXT,
    "ip_hash" VARCHAR(64),
    "pays" VARCHAR(100),
    "ville" VARCHAR(100),
    "duree_sec" INTEGER NOT NULL DEFAULT 0,
    "entree_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sortie_at" TIMESTAMP(3),

    CONSTRAINT "visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitor_actions" (
    "id" TEXT NOT NULL,
    "session_id" VARCHAR(64) NOT NULL,
    "type_action" VARCHAR(64) NOT NULL,
    "cible" VARCHAR(255),
    "page" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visitor_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE INDEX "revoked_tokens_expires_at_idx" ON "revoked_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "messages_created_at_idx" ON "messages"("created_at");

-- CreateIndex
CREATE INDEX "messages_is_read_idx" ON "messages"("is_read");

-- CreateIndex
CREATE INDEX "skills_categorie_ordre_idx" ON "skills"("categorie", "ordre");

-- CreateIndex
CREATE INDEX "projects_type_ordre_idx" ON "projects"("type", "ordre");

-- CreateIndex
CREATE INDEX "experiences_ordre_idx" ON "experiences"("ordre");

-- CreateIndex
CREATE INDEX "visitor_sessions_derniere_vue_idx" ON "visitor_sessions"("derniere_vue");

-- CreateIndex
CREATE INDEX "visits_entree_at_idx" ON "visits"("entree_at");

-- CreateIndex
CREATE INDEX "visits_session_id_idx" ON "visits"("session_id");

-- CreateIndex
CREATE INDEX "visitor_actions_created_at_idx" ON "visitor_actions"("created_at");
