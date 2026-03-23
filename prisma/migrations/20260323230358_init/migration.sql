-- CreateEnum
CREATE TYPE "TenantRole" AS ENUM ('OWNER', 'CAREGIVER', 'TEEN_SELF');

-- CreateEnum
CREATE TYPE "MoodDescriptor" AS ENUM ('MANIC', 'DEPRESSIVE', 'NEUTRAL', 'MIXED');

-- CreateEnum
CREATE TYPE "DayQuality" AS ENUM ('GOOD', 'NEUTRAL', 'BAD');

-- CreateEnum
CREATE TYPE "BehaviorCategory" AS ENUM ('SLEEP', 'ENERGY', 'MANIC', 'DEPRESSIVE', 'MIXED_CYCLING');

-- CreateEnum
CREATE TYPE "ImpairmentDomain" AS ENUM ('SCHOOL_WORK', 'FAMILY_LIFE', 'FRIENDSHIPS', 'SELF_CARE', 'SAFETY_CONCERN');

-- CreateEnum
CREATE TYPE "ImpairmentSeverity" AS ENUM ('NONE', 'PRESENT', 'SEVERE');

-- CreateEnum
CREATE TYPE "BleedingSeverity" AS ENUM ('LIGHT', 'MEDIUM', 'HEAVY');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "idToken" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_members" (
    "id" TEXT NOT NULL,
    "role" "TenantRole" NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "tenant_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entries" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "mood" "MoodDescriptor" NOT NULL,
    "dayQuality" "DayQuality" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "behavior_checks" (
    "id" TEXT NOT NULL,
    "category" "BehaviorCategory" NOT NULL,
    "itemKey" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT true,
    "entryId" TEXT NOT NULL,

    CONSTRAINT "behavior_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_checklist_items" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "custom_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_checks" (
    "id" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT true,
    "entryId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,

    CONSTRAINT "custom_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impairments" (
    "id" TEXT NOT NULL,
    "domain" "ImpairmentDomain" NOT NULL,
    "severity" "ImpairmentSeverity" NOT NULL,
    "entryId" TEXT NOT NULL,

    CONSTRAINT "impairments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menstrual_logs" (
    "id" TEXT NOT NULL,
    "severity" "BleedingSeverity" NOT NULL,
    "entryId" TEXT NOT NULL,

    CONSTRAINT "menstrual_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_members_userId_tenantId_key" ON "tenant_members"("userId", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "entries_userId_tenantId_date_key" ON "entries"("userId", "tenantId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "behavior_checks_entryId_itemKey_key" ON "behavior_checks"("entryId", "itemKey");

-- CreateIndex
CREATE UNIQUE INDEX "custom_checks_entryId_itemId_key" ON "custom_checks"("entryId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "impairments_entryId_domain_key" ON "impairments"("entryId", "domain");

-- CreateIndex
CREATE UNIQUE INDEX "menstrual_logs_entryId_key" ON "menstrual_logs"("entryId");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_members" ADD CONSTRAINT "tenant_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_members" ADD CONSTRAINT "tenant_members_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "behavior_checks" ADD CONSTRAINT "behavior_checks_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_checklist_items" ADD CONSTRAINT "custom_checklist_items_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_checks" ADD CONSTRAINT "custom_checks_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_checks" ADD CONSTRAINT "custom_checks_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "custom_checklist_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impairments" ADD CONSTRAINT "impairments_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menstrual_logs" ADD CONSTRAINT "menstrual_logs_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
