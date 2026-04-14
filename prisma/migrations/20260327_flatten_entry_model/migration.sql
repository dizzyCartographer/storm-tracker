-- Phase 1: Add new columns to entries table
-- (Old tables kept temporarily for data migration)

-- Add JSONB columns for flattened sub-entry data
ALTER TABLE "entries" ADD COLUMN "behaviorKeys" JSONB DEFAULT '[]';
ALTER TABLE "entries" ADD COLUMN "customItemIds" JSONB DEFAULT '[]';
ALTER TABLE "entries" ADD COLUMN "impairments" JSONB DEFAULT '{}';
ALTER TABLE "entries" ADD COLUMN "menstrualSeverity" TEXT;

-- Add computed fields (persisted at write time)
ALTER TABLE "entries" ADD COLUMN "computedMood" TEXT;
ALTER TABLE "entries" ADD COLUMN "computedScore" DOUBLE PRECISION;

-- Migrate data from child tables into JSONB columns
UPDATE "entries" e SET
  "behaviorKeys" = COALESCE(
    (SELECT jsonb_agg(bc."itemKey") FROM "behavior_checks" bc WHERE bc."entryId" = e.id),
    '[]'::jsonb
  ),
  "customItemIds" = COALESCE(
    (SELECT jsonb_agg(cc."itemId") FROM "custom_checks" cc WHERE cc."entryId" = e.id),
    '[]'::jsonb
  ),
  "impairments" = COALESCE(
    (SELECT jsonb_object_agg(i."domain", i."severity") FROM "impairments" i WHERE i."entryId" = e.id),
    '{}'::jsonb
  ),
  "menstrualSeverity" = (
    SELECT ml."severity"::text FROM "menstrual_logs" ml WHERE ml."entryId" = e.id
  );

-- Drop foreign key constraints first
ALTER TABLE "behavior_checks" DROP CONSTRAINT IF EXISTS "behavior_checks_entryId_fkey";
ALTER TABLE "behavior_checks" DROP CONSTRAINT IF EXISTS "behavior_checks_behaviorDefinitionId_fkey";
ALTER TABLE "custom_checks" DROP CONSTRAINT IF EXISTS "custom_checks_entryId_fkey";
ALTER TABLE "custom_checks" DROP CONSTRAINT IF EXISTS "custom_checks_itemId_fkey";
ALTER TABLE "impairments" DROP CONSTRAINT IF EXISTS "impairments_entryId_fkey";
ALTER TABLE "menstrual_logs" DROP CONSTRAINT IF EXISTS "menstrual_logs_entryId_fkey";

-- Drop old tables
DROP TABLE "behavior_checks";
DROP TABLE "custom_checks";
DROP TABLE "impairments";
DROP TABLE "menstrual_logs";

-- Drop unused enums
DROP TYPE IF EXISTS "BehaviorCategory";
DROP TYPE IF EXISTS "ImpairmentDomain";
DROP TYPE IF EXISTS "ImpairmentSeverity";
DROP TYPE IF EXISTS "BleedingSeverity";

-- Add GIN index on behaviorKeys for efficient JSONB queries
CREATE INDEX "entries_behaviorKeys_idx" ON "entries" USING GIN ("behaviorKeys");
