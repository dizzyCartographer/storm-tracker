/**
 * Seed script — creates realistic test entries across 21 days
 * to trigger Phase 6 analysis features (predictions, suggestions, discrepancies).
 *
 * Pattern: 5 days escalating manic → 3 days mixed → 7 days depressive → 6 neutral/mild
 *
 * Usage: npx tsx scripts/seed-test-entries.ts <tenantId> <userId>
 *
 * Get IDs from your database:
 *   SELECT id FROM tenants LIMIT 1;
 *   SELECT id FROM users LIMIT 1;
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

interface DayPlan {
  daysAgo: number;
  mood: "MANIC" | "DEPRESSIVE" | "NEUTRAL" | "MIXED";
  dayQuality: "GOOD" | "NEUTRAL" | "BAD";
  behaviors: string[];
  impairments: { domain: string; severity: string }[];
}

const plan: DayPlan[] = [
  // Days 21-17: Manic escalation
  { daysAgo: 21, mood: "NEUTRAL", dayQuality: "GOOD", behaviors: ["very-little-sleep", "high-energy"], impairments: [] },
  { daysAgo: 20, mood: "MANIC", dayQuality: "GOOD", behaviors: ["very-little-sleep", "high-energy", "pressured-speech"], impairments: [{ domain: "SCHOOL_WORK", severity: "PRESENT" }] },
  { daysAgo: 19, mood: "MANIC", dayQuality: "GOOD", behaviors: ["very-little-sleep", "high-energy", "pressured-speech", "racing-thoughts", "euphoria"], impairments: [{ domain: "SCHOOL_WORK", severity: "PRESENT" }, { domain: "FAMILY_LIFE", severity: "PRESENT" }] },
  { daysAgo: 18, mood: "MANIC", dayQuality: "BAD", behaviors: ["very-little-sleep", "high-energy", "pressured-speech", "racing-thoughts", "euphoria", "grandiose", "nonstop-activity"], impairments: [{ domain: "SCHOOL_WORK", severity: "SEVERE" }, { domain: "FAMILY_LIFE", severity: "SEVERE" }] },
  { daysAgo: 17, mood: "MANIC", dayQuality: "BAD", behaviors: ["very-little-sleep", "pressured-speech", "racing-thoughts", "grandiose", "reckless-choices", "disproportionate-rage", "denies-anything-wrong"], impairments: [{ domain: "SCHOOL_WORK", severity: "SEVERE" }, { domain: "FAMILY_LIFE", severity: "SEVERE" }, { domain: "SAFETY_CONCERN", severity: "PRESENT" }] },

  // Days 16-14: Mixed transition
  { daysAgo: 16, mood: "MIXED", dayQuality: "BAD", behaviors: ["irregular-sleep", "agitated-depressed", "disproportionate-rage", "mood-swings"], impairments: [{ domain: "SCHOOL_WORK", severity: "SEVERE" }, { domain: "FAMILY_LIFE", severity: "PRESENT" }] },
  { daysAgo: 15, mood: "MIXED", dayQuality: "BAD", behaviors: ["irregular-sleep", "agitated-depressed", "unprovoked-temper", "sad-empty-hopeless", "restless-agitation"], impairments: [{ domain: "SCHOOL_WORK", severity: "SEVERE" }, { domain: "FAMILY_LIFE", severity: "SEVERE" }] },
  { daysAgo: 14, mood: "MIXED", dayQuality: "BAD", behaviors: ["slept-too-much", "mood-swings", "sad-empty-hopeless", "cant-focus", "unusual-anxiety"], impairments: [{ domain: "SCHOOL_WORK", severity: "PRESENT" }, { domain: "FRIENDSHIPS", severity: "PRESENT" }] },

  // Days 13-7: Depressive episode
  { daysAgo: 13, mood: "DEPRESSIVE", dayQuality: "BAD", behaviors: ["slept-too-much", "no-energy", "sad-empty-hopeless", "lost-interest", "withdrawn"], impairments: [{ domain: "SCHOOL_WORK", severity: "PRESENT" }, { domain: "FRIENDSHIPS", severity: "PRESENT" }] },
  { daysAgo: 12, mood: "DEPRESSIVE", dayQuality: "BAD", behaviors: ["slept-too-much", "no-energy", "sad-empty-hopeless", "lost-interest", "eating-less", "withdrawn"], impairments: [{ domain: "SCHOOL_WORK", severity: "SEVERE" }, { domain: "FRIENDSHIPS", severity: "SEVERE" }, { domain: "SELF_CARE", severity: "PRESENT" }] },
  { daysAgo: 11, mood: "DEPRESSIVE", dayQuality: "BAD", behaviors: ["slept-too-much", "no-energy", "sad-empty-hopeless", "lost-interest", "eating-less", "worthless-guilt", "cant-focus"], impairments: [{ domain: "SCHOOL_WORK", severity: "SEVERE" }, { domain: "FRIENDSHIPS", severity: "SEVERE" }, { domain: "SELF_CARE", severity: "SEVERE" }] },
  { daysAgo: 10, mood: "DEPRESSIVE", dayQuality: "BAD", behaviors: ["slept-too-much", "no-energy", "sad-empty-hopeless", "lost-interest", "eating-less", "worthless-guilt", "cant-focus", "mentioned-death"], impairments: [{ domain: "SCHOOL_WORK", severity: "SEVERE" }, { domain: "SELF_CARE", severity: "SEVERE" }, { domain: "SAFETY_CONCERN", severity: "SEVERE" }] },
  { daysAgo: 9, mood: "DEPRESSIVE", dayQuality: "BAD", behaviors: ["slept-too-much", "no-energy", "sad-empty-hopeless", "lost-interest", "withdrawn", "worthless-guilt"], impairments: [{ domain: "SCHOOL_WORK", severity: "SEVERE" }, { domain: "SELF_CARE", severity: "PRESENT" }] },
  { daysAgo: 8, mood: "DEPRESSIVE", dayQuality: "BAD", behaviors: ["slept-too-much", "no-energy", "sad-empty-hopeless", "eating-less", "withdrawn"], impairments: [{ domain: "SCHOOL_WORK", severity: "PRESENT" }, { domain: "FRIENDSHIPS", severity: "PRESENT" }] },
  { daysAgo: 7, mood: "DEPRESSIVE", dayQuality: "NEUTRAL", behaviors: ["slept-too-much", "no-energy", "sad-empty-hopeless", "cant-focus"], impairments: [{ domain: "SCHOOL_WORK", severity: "PRESENT" }] },

  // Days 6-1: Recovery / neutral
  { daysAgo: 6, mood: "NEUTRAL", dayQuality: "NEUTRAL", behaviors: ["selective-energy"], impairments: [] },
  { daysAgo: 5, mood: "NEUTRAL", dayQuality: "NEUTRAL", behaviors: [], impairments: [] },
  { daysAgo: 4, mood: "NEUTRAL", dayQuality: "GOOD", behaviors: [], impairments: [] },
  { daysAgo: 3, mood: "NEUTRAL", dayQuality: "GOOD", behaviors: ["irregular-sleep"], impairments: [] },
  { daysAgo: 2, mood: "NEUTRAL", dayQuality: "NEUTRAL", behaviors: ["very-little-sleep", "high-energy"], impairments: [] },
  { daysAgo: 1, mood: "MANIC", dayQuality: "NEUTRAL", behaviors: ["very-little-sleep", "high-energy", "pressured-speech"], impairments: [{ domain: "SCHOOL_WORK", severity: "PRESENT" }] },
];

async function seed() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log("Usage: npx tsx scripts/seed-test-entries.ts <tenantId> <userId>");
    console.log("\nFetching available tenants and users...\n");
    const tenants = await prisma.tenant.findMany({ select: { id: true, name: true } });
    const users = await prisma.user.findMany({ select: { id: true, name: true, email: true } });
    console.log("Tenants:");
    for (const t of tenants) console.log(`  ${t.id}  ${t.name}`);
    console.log("\nUsers:");
    for (const u of users) console.log(`  ${u.id}  ${u.name ?? u.email}`);
    process.exit(0);
  }

  const [tenantId, userId] = args;

  // Load behavior definitions for linking
  const defs = await prisma.behaviorDefinition.findMany();
  const defMap = new Map(defs.map((d) => [d.itemKey, d.id]));

  // Category mapping
  const categoryMap: Record<string, string> = {
    sleep: "SLEEP", energy: "ENERGY", manic: "MANIC",
    depressive: "DEPRESSIVE", "mixed-cycling": "MIXED_CYCLING",
  };

  // Load framework behaviors for category lookup
  const framework = await prisma.behaviorDefinition.findMany({
    include: { category: true },
  });
  const catMap = new Map(framework.map((b) => [b.itemKey, categoryMap[b.category.slug] ?? "MIXED_CYCLING"]));

  console.log(`Seeding ${plan.length} test entries for tenant ${tenantId}, user ${userId}...\n`);

  for (const day of plan) {
    const date = new Date();
    date.setDate(date.getDate() - day.daysAgo);
    const dateOnly = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

    const entry = await prisma.entry.upsert({
      where: {
        userId_tenantId_date: { userId, tenantId, date: dateOnly },
      },
      update: { mood: day.mood, dayQuality: day.dayQuality },
      create: {
        date: dateOnly,
        mood: day.mood,
        dayQuality: day.dayQuality,
        userId,
        tenantId,
      },
    });

    // Behaviors
    await prisma.behaviorCheck.deleteMany({ where: { entryId: entry.id } });
    if (day.behaviors.length > 0) {
      await prisma.behaviorCheck.createMany({
        data: day.behaviors.map((key) => ({
          entryId: entry.id,
          category: (catMap.get(key) ?? "MIXED_CYCLING") as "SLEEP" | "ENERGY" | "MANIC" | "DEPRESSIVE" | "MIXED_CYCLING",
          itemKey: key,
          checked: true,
          behaviorDefinitionId: defMap.get(key) ?? null,
        })),
      });
    }

    // Impairments
    await prisma.impairment.deleteMany({ where: { entryId: entry.id } });
    if (day.impairments.length > 0) {
      await prisma.impairment.createMany({
        data: day.impairments.map((imp) => ({
          entryId: entry.id,
          domain: imp.domain as "SCHOOL_WORK" | "FAMILY_LIFE" | "FRIENDSHIPS" | "SELF_CARE" | "SAFETY_CONCERN",
          severity: imp.severity as "NONE" | "PRESENT" | "SEVERE",
        })),
      });
    }

    const dateStr = dateOnly.toISOString().slice(0, 10);
    console.log(`  ${dateStr}  ${day.mood.padEnd(12)} ${day.behaviors.length} behaviors`);
  }

  console.log("\nDone! Check your dashboard for analysis results.");
}

seed()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
