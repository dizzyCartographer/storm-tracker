-- AlterTable
ALTER TABLE "behavior_checks" ADD COLUMN     "behaviorDefinitionId" TEXT;

-- CreateTable
CREATE TABLE "diagnostic_frameworks" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diagnostic_frameworks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "criterion_poles" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "direction" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "frameworkId" TEXT NOT NULL,

    CONSTRAINT "criterion_poles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "criteria" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "criterionType" TEXT NOT NULL DEFAULT 'STANDARD',
    "description" TEXT,
    "poleId" TEXT NOT NULL,

    CONSTRAINT "criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "framework_behavior_categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "frameworkId" TEXT NOT NULL,

    CONSTRAINT "framework_behavior_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "behavior_definitions" (
    "id" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isSafetyConcern" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "behavior_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "behavior_criterion_mappings" (
    "id" TEXT NOT NULL,
    "behaviorId" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,

    CONSTRAINT "behavior_criterion_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mood_descriptor_mappings" (
    "id" TEXT NOT NULL,
    "moodValue" TEXT NOT NULL,
    "satisfiesGate" BOOLEAN NOT NULL DEFAULT false,
    "addsCriterionId" TEXT,
    "poleId" TEXT,
    "frameworkId" TEXT NOT NULL,

    CONSTRAINT "mood_descriptor_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classification_rules" (
    "id" TEXT NOT NULL,
    "classificationLabel" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "gateRequired" BOOLEAN NOT NULL DEFAULT true,
    "minStandardCriteria" INTEGER NOT NULL,
    "coreRequired" BOOLEAN NOT NULL DEFAULT false,
    "gateOnlyAdjustment" INTEGER NOT NULL DEFAULT 0,
    "minOppositeCriteria" INTEGER NOT NULL DEFAULT 0,
    "mixedLabel" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "poleId" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,

    CONSTRAINT "classification_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episode_thresholds" (
    "id" TEXT NOT NULL,
    "episodeLabel" TEXT NOT NULL,
    "confidenceLevel" TEXT NOT NULL,
    "minDays" INTEGER NOT NULL,
    "requiresDsmSymptoms" BOOLEAN NOT NULL DEFAULT false,
    "poleId" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,

    CONSTRAINT "episode_thresholds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signal_rules" (
    "id" TEXT NOT NULL,
    "signalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "descriptionTemplate" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "windowDays" INTEGER NOT NULL,
    "minOccurrences" INTEGER NOT NULL,
    "trendCompare" BOOLEAN NOT NULL DEFAULT false,
    "trendMinLate" INTEGER NOT NULL DEFAULT 0,
    "frameworkId" TEXT NOT NULL,

    CONSTRAINT "signal_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signal_behaviors" (
    "id" TEXT NOT NULL,
    "signalRuleId" TEXT NOT NULL,
    "behaviorId" TEXT NOT NULL,

    CONSTRAINT "signal_behaviors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_frameworks" (
    "id" TEXT NOT NULL,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,

    CONSTRAINT "tenant_frameworks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "diagnostic_frameworks_slug_key" ON "diagnostic_frameworks"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "criterion_poles_frameworkId_slug_key" ON "criterion_poles"("frameworkId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "criteria_poleId_number_key" ON "criteria"("poleId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "framework_behavior_categories_frameworkId_slug_key" ON "framework_behavior_categories"("frameworkId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "behavior_definitions_categoryId_itemKey_key" ON "behavior_definitions"("categoryId", "itemKey");

-- CreateIndex
CREATE UNIQUE INDEX "behavior_criterion_mappings_behaviorId_criterionId_key" ON "behavior_criterion_mappings"("behaviorId", "criterionId");

-- CreateIndex
CREATE UNIQUE INDEX "mood_descriptor_mappings_frameworkId_moodValue_poleId_key" ON "mood_descriptor_mappings"("frameworkId", "moodValue", "poleId");

-- CreateIndex
CREATE UNIQUE INDEX "signal_behaviors_signalRuleId_behaviorId_key" ON "signal_behaviors"("signalRuleId", "behaviorId");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_frameworks_tenantId_frameworkId_key" ON "tenant_frameworks"("tenantId", "frameworkId");

-- AddForeignKey
ALTER TABLE "behavior_checks" ADD CONSTRAINT "behavior_checks_behaviorDefinitionId_fkey" FOREIGN KEY ("behaviorDefinitionId") REFERENCES "behavior_definitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "criterion_poles" ADD CONSTRAINT "criterion_poles_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "diagnostic_frameworks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "criteria" ADD CONSTRAINT "criteria_poleId_fkey" FOREIGN KEY ("poleId") REFERENCES "criterion_poles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "framework_behavior_categories" ADD CONSTRAINT "framework_behavior_categories_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "diagnostic_frameworks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "behavior_definitions" ADD CONSTRAINT "behavior_definitions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "framework_behavior_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "behavior_criterion_mappings" ADD CONSTRAINT "behavior_criterion_mappings_behaviorId_fkey" FOREIGN KEY ("behaviorId") REFERENCES "behavior_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "behavior_criterion_mappings" ADD CONSTRAINT "behavior_criterion_mappings_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "criteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mood_descriptor_mappings" ADD CONSTRAINT "mood_descriptor_mappings_poleId_fkey" FOREIGN KEY ("poleId") REFERENCES "criterion_poles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mood_descriptor_mappings" ADD CONSTRAINT "mood_descriptor_mappings_addsCriterionId_fkey" FOREIGN KEY ("addsCriterionId") REFERENCES "criteria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mood_descriptor_mappings" ADD CONSTRAINT "mood_descriptor_mappings_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "diagnostic_frameworks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classification_rules" ADD CONSTRAINT "classification_rules_poleId_fkey" FOREIGN KEY ("poleId") REFERENCES "criterion_poles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classification_rules" ADD CONSTRAINT "classification_rules_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "diagnostic_frameworks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episode_thresholds" ADD CONSTRAINT "episode_thresholds_poleId_fkey" FOREIGN KEY ("poleId") REFERENCES "criterion_poles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episode_thresholds" ADD CONSTRAINT "episode_thresholds_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "diagnostic_frameworks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signal_rules" ADD CONSTRAINT "signal_rules_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "diagnostic_frameworks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signal_behaviors" ADD CONSTRAINT "signal_behaviors_signalRuleId_fkey" FOREIGN KEY ("signalRuleId") REFERENCES "signal_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signal_behaviors" ADD CONSTRAINT "signal_behaviors_behaviorId_fkey" FOREIGN KEY ("behaviorId") REFERENCES "behavior_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_frameworks" ADD CONSTRAINT "tenant_frameworks_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_frameworks" ADD CONSTRAINT "tenant_frameworks_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "diagnostic_frameworks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
