/**
 * Backfill computedMood and computedScore for all existing entries.
 *
 * Run: npx tsx scripts/backfill-computed-mood.ts
 */

import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { loadTenantFramework } from "../src/lib/analysis/framework-loader";
import { scoreDailyEntry } from "../src/lib/analysis/daily-score";

const pool = new Pool({ connectionString: process.env.STRM_TRKR_DATABASE_URL });
const adapter = new PrismaPg(pool, { schema: "public" });
const prisma = new PrismaClient({ adapter });

async function backfill() {
  const entries = await prisma.entry.findMany({
    select: {
      id: true,
      tenantId: true,
      mood: true,
      dayQuality: true,
      behaviorKeys: true,
      impairments: true,
    },
  });

  console.log(`Found ${entries.length} entries to process`);

  // Cache frameworks by tenant to avoid repeated loads
  const frameworkCache = new Map<string, Awaited<ReturnType<typeof loadTenantFramework>>>();

  let updated = 0;
  let skipped = 0;

  for (const entry of entries) {
    const behaviorKeys = (entry.behaviorKeys as string[]) ?? [];
    const impairments = (entry.impairments as Record<string, string>) ?? {};

    if (behaviorKeys.length === 0) {
      skipped++;
      continue;
    }

    if (!frameworkCache.has(entry.tenantId)) {
      frameworkCache.set(entry.tenantId, await loadTenantFramework(entry.tenantId));
    }
    const framework = frameworkCache.get(entry.tenantId);

    const score = scoreDailyEntry(
      {
        behaviorKeys,
        mood: entry.mood,
        dayQuality: entry.dayQuality,
        impairments,
      },
      framework ?? undefined
    );

    await prisma.entry.update({
      where: { id: entry.id },
      data: {
        computedMood: score.classification,
        computedScore: score.waveScore,
      },
    });

    updated++;
  }

  console.log(`Done: ${updated} entries scored, ${skipped} skipped (no behaviors)`);
  await prisma.$disconnect();
  await pool.end();
}

backfill().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
