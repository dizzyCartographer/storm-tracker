/**
 * Seed script — generates realistic test entries for Phase 6 testing.
 *
 * Usage:
 *   npx tsx scripts/seed-test-data.ts <tenantId> <userId>
 *
 * Finds IDs by running:
 *   Open the app → Settings page → look at the URL (?tenant=xxx)
 *   Or query the database directly.
 *
 * Generates 21 days of entries simulating:
 *   Days 1-5:   Neutral baseline
 *   Days 6-10:  Escalating manic episode
 *   Days 11-13: Peak mania with safety concern on day 12
 *   Days 14-16: Mixed state transition
 *   Days 17-21: Depressive dip
 *
 * This gives the analysis engine enough data to trigger:
 *   - Episode detection (manic + depressive)
 *   - Prodrome signals (sleep, irritability, energy volatility, safety)
 *   - Pattern predictions (trend, cycle, forecast)
 *   - Caregiver suggestions (safety, manic, depressive, clinical)
 */

import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const tenantId = process.argv[2];
const userId = process.argv[3];

if (!tenantId || !userId) {
  console.error("Usage: npx tsx scripts/seed-test-data.ts <tenantId> <userId>");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.STRM_TRKR_DATABASE_URL_UNPOOLED || process.env.STRM_TRKR_DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type Mood = "MANIC" | "DEPRESSIVE" | "NEUTRAL" | "MIXED";
type Quality = "GOOD" | "NEUTRAL" | "BAD";
type ImpSev = "NONE" | "PRESENT" | "SEVERE";
type BehaviorCat = "SLEEP" | "ENERGY" | "MANIC" | "DEPRESSIVE" | "MIXED_CYCLING";

interface DayPlan {
  mood: Mood;
  quality: Quality;
  behaviors: { key: string; category: BehaviorCat }[];
  impairments: { domain: string; severity: ImpSev }[];
  notes?: string;
  period?: "LIGHT" | "MEDIUM" | "HEAVY";
}

// Behavior shorthand
const b = (key: string, category: BehaviorCat) => ({ key, category });

const dayPlans: DayPlan[] = [
  // Days 1-5: Neutral baseline
  {
    mood: "NEUTRAL", quality: "GOOD",
    behaviors: [],
    impairments: [
      { domain: "SCHOOL_WORK", severity: "NONE" },
      { domain: "FAMILY_LIFE", severity: "NONE" },
      { domain: "FRIENDSHIPS", severity: "NONE" },
      { domain: "SELF_CARE", severity: "NONE" },
      { domain: "SAFETY_CONCERN", severity: "NONE" },
    ],
    notes: "Normal day. Went to school, hung out with friends after.",
  },
  {
    mood: "NEUTRAL", quality: "GOOD",
    behaviors: [b("irregular-sleep", "SLEEP")],
    impairments: [
      { domain: "SCHOOL_WORK", severity: "NONE" },
      { domain: "FAMILY_LIFE", severity: "NONE" },
      { domain: "FRIENDSHIPS", severity: "NONE" },
      { domain: "SELF_CARE", severity: "NONE" },
      { domain: "SAFETY_CONCERN", severity: "NONE" },
    ],
  },
  {
    mood: "NEUTRAL", quality: "NEUTRAL",
    behaviors: [],
    impairments: [
      { domain: "SCHOOL_WORK", severity: "NONE" },
      { domain: "FAMILY_LIFE", severity: "NONE" },
      { domain: "FRIENDSHIPS", severity: "NONE" },
      { domain: "SELF_CARE", severity: "NONE" },
      { domain: "SAFETY_CONCERN", severity: "NONE" },
    ],
    period: "LIGHT",
  },
  {
    mood: "NEUTRAL", quality: "NEUTRAL",
    behaviors: [b("selective-energy", "ENERGY")],
    impairments: [
      { domain: "SCHOOL_WORK", severity: "NONE" },
      { domain: "FAMILY_LIFE", severity: "NONE" },
      { domain: "FRIENDSHIPS", severity: "NONE" },
      { domain: "SELF_CARE", severity: "NONE" },
      { domain: "SAFETY_CONCERN", severity: "NONE" },
    ],
    period: "MEDIUM",
  },
  {
    mood: "NEUTRAL", quality: "GOOD",
    behaviors: [],
    impairments: [
      { domain: "SCHOOL_WORK", severity: "NONE" },
      { domain: "FAMILY_LIFE", severity: "NONE" },
      { domain: "FRIENDSHIPS", severity: "NONE" },
      { domain: "SELF_CARE", severity: "NONE" },
      { domain: "SAFETY_CONCERN", severity: "NONE" },
    ],
    period: "LIGHT",
  },

  // Days 6-10: Escalating manic
  {
    mood: "MANIC", quality: "GOOD",
    behaviors: [
      b("very-little-sleep", "SLEEP"),
      b("high-energy", "ENERGY"),
      b("racing-thoughts", "MANIC"),
    ],
    impairments: [
      { domain: "SCHOOL_WORK", severity: "NONE" },
      { domain: "FAMILY_LIFE", severity: "PRESENT" },
      { domain: "FRIENDSHIPS", severity: "NONE" },
      { domain: "SELF_CARE", severity: "NONE" },
      { domain: "SAFETY_CONCERN", severity: "NONE" },
    ],
    notes: "Stayed up until 2am 'working on a project'. Very talkative at dinner.",
  },
  {
    mood: "MANIC", quality: "GOOD",
    behaviors: [
      b("very-little-sleep", "SLEEP"),
      b("high-energy", "ENERGY"),
      b("pressured-speech", "MANIC"),
      b("racing-thoughts", "MANIC"),
      b("nonstop-activity", "MANIC"),
    ],
    impairments: [
      { domain: "SCHOOL_WORK", severity: "PRESENT" },
      { domain: "FAMILY_LIFE", severity: "PRESENT" },
      { domain: "FRIENDSHIPS", severity: "NONE" },
      { domain: "SELF_CARE", severity: "NONE" },
      { domain: "SAFETY_CONCERN", severity: "NONE" },
    ],
    notes: "Started 3 new 'businesses' today. Talking nonstop. Can't interrupt.",
  },
  {
    mood: "MANIC", quality: "NEUTRAL",
    behaviors: [
      b("very-little-sleep", "SLEEP"),
      b("high-energy", "ENERGY"),
      b("pressured-speech", "MANIC"),
      b("grandiose", "MANIC"),
      b("restless-agitation", "MANIC"),
      b("disproportionate-rage", "MANIC"),
    ],
    impairments: [
      { domain: "SCHOOL_WORK", severity: "SEVERE" },
      { domain: "FAMILY_LIFE", severity: "SEVERE" },
      { domain: "FRIENDSHIPS", severity: "PRESENT" },
      { domain: "SELF_CARE", severity: "PRESENT" },
      { domain: "SAFETY_CONCERN", severity: "NONE" },
    ],
    notes: "Refused to go to school. Says teachers 'aren't smart enough'. Screamed at sister for 20 minutes over nothing.",
  },
  {
    mood: "MANIC", quality: "BAD",
    behaviors: [
      b("very-little-sleep", "SLEEP"),
      b("high-energy", "ENERGY"),
      b("pressured-speech", "MANIC"),
      b("grandiose", "MANIC"),
      b("reckless-choices", "MANIC"),
      b("bizarre-behavior", "MANIC"),
      b("denies-anything-wrong", "MANIC"),
    ],
    impairments: [
      { domain: "SCHOOL_WORK", severity: "SEVERE" },
      { domain: "FAMILY_LIFE", severity: "SEVERE" },
      { domain: "FRIENDSHIPS", severity: "SEVERE" },
      { domain: "SELF_CARE", severity: "PRESENT" },
      { domain: "SAFETY_CONCERN", severity: "PRESENT" },
    ],
    notes: "Gave away $200 to a stranger online. Wearing bizarre outfit. Insists everything is fine.",
  },
  {
    mood: "MANIC", quality: "BAD",
    behaviors: [
      b("very-little-sleep", "SLEEP"),
      b("high-energy", "ENERGY"),
      b("grandiose", "MANIC"),
      b("reckless-choices", "MANIC"),
      b("aggressive-destructive", "MIXED_CYCLING"),
      b("unprovoked-temper", "MIXED_CYCLING"),
    ],
    impairments: [
      { domain: "SCHOOL_WORK", severity: "SEVERE" },
      { domain: "FAMILY_LIFE", severity: "SEVERE" },
      { domain: "FRIENDSHIPS", severity: "SEVERE" },
      { domain: "SELF_CARE", severity: "SEVERE" },
      { domain: "SAFETY_CONCERN", severity: "PRESENT" },
    ],
    notes: "Punched a hole in the wall. Up for 36 hours straight. Called the psychiatrist.",
  },

  // Days 11-13: Peak mania with safety concern
  {
    mood: "MANIC", quality: "BAD",
    behaviors: [
      b("very-little-sleep", "SLEEP"),
      b("high-energy", "ENERGY"),
      b("euphoria", "MANIC"),
      b("grandiose", "MANIC"),
      b("reckless-choices", "MANIC"),
      b("cant-focus", "DEPRESSIVE"),
    ],
    impairments: [
      { domain: "SCHOOL_WORK", severity: "SEVERE" },
      { domain: "FAMILY_LIFE", severity: "SEVERE" },
      { domain: "FRIENDSHIPS", severity: "SEVERE" },
      { domain: "SELF_CARE", severity: "SEVERE" },
      { domain: "SAFETY_CONCERN", severity: "SEVERE" },
    ],
  },
  {
    mood: "MIXED", quality: "BAD",
    behaviors: [
      b("irregular-sleep", "SLEEP"),
      b("high-energy", "ENERGY"),
      b("agitated-depressed", "MIXED_CYCLING"),
      b("mood-swings", "MIXED_CYCLING"),
      b("mentioned-death", "DEPRESSIVE"),
      b("disproportionate-rage", "MANIC"),
    ],
    impairments: [
      { domain: "SCHOOL_WORK", severity: "SEVERE" },
      { domain: "FAMILY_LIFE", severity: "SEVERE" },
      { domain: "FRIENDSHIPS", severity: "SEVERE" },
      { domain: "SELF_CARE", severity: "SEVERE" },
      { domain: "SAFETY_CONCERN", severity: "SEVERE" },
    ],
    notes: "Said 'I don't want to be here anymore' during an argument. Alternating between rage and crying.",
  },
  {
    mood: "MIXED", quality: "BAD",
    behaviors: [
      b("slept-too-much", "SLEEP"),
      b("no-energy", "ENERGY"),
      b("mood-swings", "MIXED_CYCLING"),
      b("agitated-depressed", "MIXED_CYCLING"),
      b("sad-empty-hopeless", "DEPRESSIVE"),
      b("cant-focus", "DEPRESSIVE"),
    ],
    impairments: [
      { domain: "SCHOOL_WORK", severity: "SEVERE" },
      { domain: "FAMILY_LIFE", severity: "PRESENT" },
      { domain: "FRIENDSHIPS", severity: "PRESENT" },
      { domain: "SELF_CARE", severity: "SEVERE" },
      { domain: "SAFETY_CONCERN", severity: "PRESENT" },
    ],
    notes: "Crash after the mania. Slept 14 hours. Barely spoke.",
  },

  // Days 14-16: Mixed transition
  {
    mood: "MIXED", quality: "BAD",
    behaviors: [
      b("slept-too-much", "SLEEP"),
      b("no-energy", "ENERGY"),
      b("sad-empty-hopeless", "DEPRESSIVE"),
      b("lost-interest", "DEPRESSIVE"),
      b("unprovoked-temper", "MIXED_CYCLING"),
    ],
    impairments: [
      { domain: "SCHOOL_WORK", severity: "SEVERE" },
      { domain: "FAMILY_LIFE", severity: "PRESENT" },
      { domain: "FRIENDSHIPS", severity: "SEVERE" },
      { domain: "SELF_CARE", severity: "PRESENT" },
      { domain: "SAFETY_CONCERN", severity: "NONE" },
    ],
  },
  {
    mood: "DEPRESSIVE", quality: "BAD",
    behaviors: [
      b("slept-too-much", "SLEEP"),
      b("no-energy", "ENERGY"),
      b("sad-empty-hopeless", "DEPRESSIVE"),
      b("lost-interest", "DEPRESSIVE"),
      b("withdrawn", "DEPRESSIVE"),
      b("eating-less", "DEPRESSIVE"),
    ],
    impairments: [
      { domain: "SCHOOL_WORK", severity: "SEVERE" },
      { domain: "FAMILY_LIFE", severity: "PRESENT" },
      { domain: "FRIENDSHIPS", severity: "SEVERE" },
      { domain: "SELF_CARE", severity: "SEVERE" },
      { domain: "SAFETY_CONCERN", severity: "NONE" },
    ],
    notes: "Hasn't left the room in 2 days. Won't eat. Won't talk.",
  },
  {
    mood: "DEPRESSIVE", quality: "BAD",
    behaviors: [
      b("slept-too-much", "SLEEP"),
      b("no-energy", "ENERGY"),
      b("sad-empty-hopeless", "DEPRESSIVE"),
      b("lost-interest", "DEPRESSIVE"),
      b("withdrawn", "DEPRESSIVE"),
      b("worthless-guilt", "DEPRESSIVE"),
      b("eating-less", "DEPRESSIVE"),
    ],
    impairments: [
      { domain: "SCHOOL_WORK", severity: "SEVERE" },
      { domain: "FAMILY_LIFE", severity: "PRESENT" },
      { domain: "FRIENDSHIPS", severity: "SEVERE" },
      { domain: "SELF_CARE", severity: "SEVERE" },
      { domain: "SAFETY_CONCERN", severity: "NONE" },
    ],
    notes: "Said 'I'm a terrible person and everyone would be better off without me'. Crying on and off all day.",
  },

  // Days 17-21: Deepening depression
  {
    mood: "DEPRESSIVE", quality: "BAD",
    behaviors: [
      b("slept-too-much", "SLEEP"),
      b("no-energy", "ENERGY"),
      b("sad-empty-hopeless", "DEPRESSIVE"),
      b("lost-interest", "DEPRESSIVE"),
      b("withdrawn", "DEPRESSIVE"),
      b("worthless-guilt", "DEPRESSIVE"),
      b("cant-focus", "DEPRESSIVE"),
    ],
    impairments: [
      { domain: "SCHOOL_WORK", severity: "SEVERE" },
      { domain: "FAMILY_LIFE", severity: "SEVERE" },
      { domain: "FRIENDSHIPS", severity: "SEVERE" },
      { domain: "SELF_CARE", severity: "SEVERE" },
      { domain: "SAFETY_CONCERN", severity: "NONE" },
    ],
  },
  {
    mood: "DEPRESSIVE", quality: "BAD",
    behaviors: [
      b("slept-too-much", "SLEEP"),
      b("no-energy", "ENERGY"),
      b("sad-empty-hopeless", "DEPRESSIVE"),
      b("lost-interest", "DEPRESSIVE"),
      b("withdrawn", "DEPRESSIVE"),
      b("worthless-guilt", "DEPRESSIVE"),
      b("cant-focus", "DEPRESSIVE"),
      b("eating-less", "DEPRESSIVE"),
    ],
    impairments: [
      { domain: "SCHOOL_WORK", severity: "SEVERE" },
      { domain: "FAMILY_LIFE", severity: "SEVERE" },
      { domain: "FRIENDSHIPS", severity: "SEVERE" },
      { domain: "SELF_CARE", severity: "SEVERE" },
      { domain: "SAFETY_CONCERN", severity: "PRESENT" },
    ],
    notes: "Barely eating. Sleeping 16 hours. Missing school all week.",
  },
  {
    mood: "DEPRESSIVE", quality: "BAD",
    behaviors: [
      b("irregular-sleep", "SLEEP"),
      b("no-energy", "ENERGY"),
      b("sad-empty-hopeless", "DEPRESSIVE"),
      b("lost-interest", "DEPRESSIVE"),
      b("withdrawn", "DEPRESSIVE"),
      b("cant-focus", "DEPRESSIVE"),
      b("psychosomatic", "ENERGY"),
    ],
    impairments: [
      { domain: "SCHOOL_WORK", severity: "SEVERE" },
      { domain: "FAMILY_LIFE", severity: "PRESENT" },
      { domain: "FRIENDSHIPS", severity: "SEVERE" },
      { domain: "SELF_CARE", severity: "PRESENT" },
      { domain: "SAFETY_CONCERN", severity: "NONE" },
    ],
    notes: "Complaining of headaches and stomach pain. Doctor says nothing physical.",
  },
  {
    mood: "DEPRESSIVE", quality: "NEUTRAL",
    behaviors: [
      b("slept-too-much", "SLEEP"),
      b("selective-energy", "ENERGY"),
      b("sad-empty-hopeless", "DEPRESSIVE"),
      b("lost-interest", "DEPRESSIVE"),
    ],
    impairments: [
      { domain: "SCHOOL_WORK", severity: "PRESENT" },
      { domain: "FAMILY_LIFE", severity: "PRESENT" },
      { domain: "FRIENDSHIPS", severity: "PRESENT" },
      { domain: "SELF_CARE", severity: "PRESENT" },
      { domain: "SAFETY_CONCERN", severity: "NONE" },
    ],
    notes: "Slightly better today. Ate breakfast. Still won't go to school.",
  },
  {
    mood: "DEPRESSIVE", quality: "NEUTRAL",
    behaviors: [
      b("slept-too-much", "SLEEP"),
      b("no-energy", "ENERGY"),
      b("sad-empty-hopeless", "DEPRESSIVE"),
      b("withdrawn", "DEPRESSIVE"),
      b("eating-less", "DEPRESSIVE"),
    ],
    impairments: [
      { domain: "SCHOOL_WORK", severity: "PRESENT" },
      { domain: "FAMILY_LIFE", severity: "PRESENT" },
      { domain: "FRIENDSHIPS", severity: "PRESENT" },
      { domain: "SELF_CARE", severity: "PRESENT" },
      { domain: "SAFETY_CONCERN", severity: "NONE" },
    ],
  },
];

async function seed() {
  console.log(`Seeding ${dayPlans.length} days for tenant=${tenantId}, user=${userId}`);

  // Verify tenant and user exist
  const member = await prisma.tenantMember.findUnique({
    where: { userId_tenantId: { userId, tenantId } },
  });
  if (!member) {
    console.error("Error: User is not a member of this tenant.");
    process.exit(1);
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - dayPlans.length);

  for (let i = 0; i < dayPlans.length; i++) {
    const plan = dayPlans[i];
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateOnly = new Date(date.toISOString().slice(0, 10) + "T00:00:00Z");

    // Check if entry already exists for this date/user
    const existing = await prisma.entry.findFirst({
      where: { tenantId, userId, date: dateOnly },
    });
    if (existing) {
      console.log(`  Day ${i + 1} (${dateOnly.toISOString().slice(0, 10)}): skipped (entry exists)`);
      continue;
    }

    const entry = await prisma.entry.create({
      data: {
        date: dateOnly,
        mood: plan.mood,
        dayQuality: plan.quality,
        notes: plan.notes ?? null,
        userId,
        tenantId,
        behaviorChecks: {
          create: plan.behaviors.map((beh) => ({
            category: beh.category,
            itemKey: beh.key,
            checked: true,
          })),
        },
        impairments: {
          create: plan.impairments.map((imp) => ({
            domain: imp.domain as any,
            severity: imp.severity as any,
          })),
        },
        ...(plan.period && {
          menstrualLog: {
            create: { severity: plan.period },
          },
        }),
      },
    });

    console.log(
      `  Day ${i + 1} (${dateOnly.toISOString().slice(0, 10)}): ${plan.mood} / ${plan.quality} — ${plan.behaviors.length} behaviors, ${plan.impairments.filter((i) => i.severity !== "NONE").length} impairments`
    );
  }

  console.log("\nDone! Open the dashboard to see analysis results.");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
