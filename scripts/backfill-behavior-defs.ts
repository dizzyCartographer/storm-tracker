/**
 * Backfill script — populates behaviorDefinitionId on existing BehaviorCheck rows.
 *
 * Usage: npx tsx scripts/backfill-behavior-defs.ts
 */

import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const pool = new Pool({
  connectionString: process.env.STRM_TRKR_DATABASE_URL_UNPOOLED || process.env.STRM_TRKR_DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function backfill() {
  // Load all behavior definitions
  const defs = await prisma.behaviorDefinition.findMany();
  const defMap = new Map(defs.map((d) => [d.itemKey, d.id]));
  console.log(`Loaded ${defs.length} behavior definitions`);

  // Find all checks missing behaviorDefinitionId
  const checks = await prisma.behaviorCheck.findMany({
    where: { behaviorDefinitionId: null },
    select: { id: true, itemKey: true },
  });
  console.log(`Found ${checks.length} checks to backfill`);

  let updated = 0;
  let skipped = 0;
  for (const check of checks) {
    const defId = defMap.get(check.itemKey);
    if (defId) {
      await prisma.behaviorCheck.update({
        where: { id: check.id },
        data: { behaviorDefinitionId: defId },
      });
      updated++;
    } else {
      skipped++;
    }
  }

  console.log(`Updated: ${updated}, Skipped (no matching def): ${skipped}`);
  console.log("Done!");
}

backfill()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
