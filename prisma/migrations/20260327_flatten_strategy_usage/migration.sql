-- Add strategyIds JSONB column to entries
ALTER TABLE "entries" ADD COLUMN "strategyIds" JSONB DEFAULT '[]';

-- Migrate strategy usage data into Entry.strategyIds JSONB column
-- For each entry that has strategy usages, collect the strategyIds into a JSON array
UPDATE "entries" e SET
  "strategyIds" = COALESCE(
    (SELECT jsonb_agg(DISTINCT su."strategyId") FROM "strategy_usages" su WHERE su."entryId" = e.id),
    '[]'::jsonb
  )
WHERE EXISTS (SELECT 1 FROM "strategy_usages" su WHERE su."entryId" = e.id);

-- Drop the strategy_usages table
DROP TABLE IF EXISTS "strategy_usages";
