/**
 * Seed script — creates the DSM-5 Bipolar Disorder diagnostic framework
 * with all behaviors, criteria, mappings, rules, and thresholds.
 *
 * Idempotent: uses upserts on unique constraints.
 * Also assigns all existing tenants to this framework.
 *
 * Usage: npx tsx scripts/seed-frameworks.ts
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

async function seed() {
  console.log("Seeding DSM-5 Bipolar framework...\n");

  // ── Framework ──
  const fw = await prisma.diagnosticFramework.upsert({
    where: { slug: "dsm5-bipolar" },
    update: {},
    create: {
      slug: "dsm5-bipolar",
      name: "DSM-5 Bipolar Disorder",
      version: "1.0",
      description: "Diagnostic criteria for bipolar I, bipolar II, and related disorders per the DSM-5.",
    },
  });
  console.log(`Framework: ${fw.name} (${fw.id})`);

  // ── Poles ──
  const manicPole = await upsertPole(fw.id, "manic", "Manic", 1, 0);
  const depPole = await upsertPole(fw.id, "depressive", "Depressive", -1, 1);
  console.log(`Poles: ${manicPole.slug}, ${depPole.slug}`);

  // ── Criteria ──
  // Manic Criterion A (gate) + 7 B criteria
  const manicA = await upsertCriterion(manicPole.id, 0, "Elevated, expansive, or irritable mood", "GATE");
  const manicB1 = await upsertCriterion(manicPole.id, 1, "Inflated self-esteem / grandiosity", "STANDARD");
  const manicB2 = await upsertCriterion(manicPole.id, 2, "Decreased need for sleep", "STANDARD");
  const manicB3 = await upsertCriterion(manicPole.id, 3, "More talkative / pressure of speech", "STANDARD");
  const manicB4 = await upsertCriterion(manicPole.id, 4, "Flight of ideas / racing thoughts", "STANDARD");
  const manicB5 = await upsertCriterion(manicPole.id, 5, "Distractibility", "STANDARD");
  const manicB6 = await upsertCriterion(manicPole.id, 6, "Increase in goal-directed activity / psychomotor agitation", "STANDARD");
  const manicB7 = await upsertCriterion(manicPole.id, 7, "Excessive involvement in risky activities", "STANDARD");

  // Depressive criteria 1-9
  const dep1 = await upsertCriterion(depPole.id, 1, "Depressed mood most of the day", "CORE");
  const dep2 = await upsertCriterion(depPole.id, 2, "Markedly diminished interest / pleasure", "CORE");
  const dep3 = await upsertCriterion(depPole.id, 3, "Significant weight/appetite change", "STANDARD");
  const dep4 = await upsertCriterion(depPole.id, 4, "Insomnia or hypersomnia", "STANDARD");
  const dep5 = await upsertCriterion(depPole.id, 5, "Psychomotor agitation or retardation", "STANDARD");
  const dep6 = await upsertCriterion(depPole.id, 6, "Fatigue / loss of energy", "STANDARD");
  const dep7 = await upsertCriterion(depPole.id, 7, "Feelings of worthlessness / excessive guilt", "STANDARD");
  const dep8 = await upsertCriterion(depPole.id, 8, "Diminished ability to think / concentrate", "STANDARD");
  const dep9 = await upsertCriterion(depPole.id, 9, "Recurrent thoughts of death / suicidal ideation", "STANDARD");

  console.log("Criteria: 8 manic (A + B1-B7), 9 depressive");

  // ── Behavior Categories ──
  const catSleep = await upsertCategory(fw.id, "sleep", "Sleep", 0);
  const catEnergy = await upsertCategory(fw.id, "energy", "Energy", 1);
  const catManic = await upsertCategory(fw.id, "manic", "Manic", 2);
  const catDep = await upsertCategory(fw.id, "depressive", "Depressive", 3);
  const catMixed = await upsertCategory(fw.id, "mixed-cycling", "Mixed / Cycling", 4);

  // ── Behavior Definitions + Criterion Mappings ──
  // Each call: upsertBehavior(categoryId, itemKey, label, description, isSafetyConcern, sortOrder, criterionIds[])

  // SLEEP
  await upsertBehavior(catSleep.id, "very-little-sleep", "Very little sleep", "Got much less sleep than normal", false, 0, [manicB2.id]);
  await upsertBehavior(catSleep.id, "slept-too-much", "Slept too much", "Way more sleep than normal or couldn't get out of bed", false, 1, [dep4.id]);
  await upsertBehavior(catSleep.id, "irregular-sleep", "Irregular sleep pattern", "Up and down, couldn't fall asleep, woke repeatedly", false, 2, [manicB2.id, dep4.id]);

  // ENERGY
  await upsertBehavior(catEnergy.id, "no-energy", "No energy today", "Dragging, sluggish, couldn't get going", false, 0, [dep6.id]);
  await upsertBehavior(catEnergy.id, "high-energy", "Unusually high energy", "Wired, amped up, more energy than usual", false, 1, [manicB6.id]);
  await upsertBehavior(catEnergy.id, "selective-energy", "Selective energy", "Too tired for obligations but fine for preferred activities", false, 2, [dep6.id]);
  await upsertBehavior(catEnergy.id, "psychosomatic", "Psychosomatic complaints", "Headache, stomachache, body aches with no clear medical cause", false, 3, [dep5.id]);

  // MANIC
  await upsertBehavior(catManic.id, "pressured-speech", "Pressured rapid speech", "Talking fast, loud, or impossible to interrupt", false, 0, [manicB3.id]);
  await upsertBehavior(catManic.id, "racing-thoughts", "Racing jumping thoughts", "Bouncing between topics, can't stay on one thing", false, 1, [manicB4.id]);
  await upsertBehavior(catManic.id, "euphoria", "Euphoria without cause", "Unusually happy, giddy, or wired for no clear reason", false, 2, [manicA.id]); // Gate
  await upsertBehavior(catManic.id, "grandiose", "Grandiose or invincible", "Acting like they're the best, special, or can't be touched", false, 3, [manicB1.id]);
  await upsertBehavior(catManic.id, "nonstop-activity", "Nonstop goal activity", "Starting tons of projects, plans, tasks all at once", false, 4, [manicB6.id]);
  await upsertBehavior(catManic.id, "restless-agitation", "Physical restless agitation", "Pacing, can't sit still, excess physical energy", false, 5, [manicB6.id]);
  await upsertBehavior(catManic.id, "disproportionate-rage", "Disproportionate rage", "Explosive anger way beyond what the situation warranted", false, 6, [manicA.id]); // Gate (irritable)
  await upsertBehavior(catManic.id, "reckless-choices", "Reckless dangerous choices", "Risky behavior they'd normally never do", false, 7, [manicB7.id]);
  await upsertBehavior(catManic.id, "bizarre-behavior", "Bizarre out-of-character", "Dressing, acting, or talking in ways that aren't them", false, 8, [manicB7.id]);
  await upsertBehavior(catManic.id, "denies-anything-wrong", "Denies anything wrong", "Insists they're fine when they clearly aren't", false, 9, []);

  // DEPRESSIVE
  await upsertBehavior(catDep.id, "sad-empty-hopeless", "Sad empty hopeless", "Down, flat, or hopeless most of the day", false, 0, [dep1.id]);
  await upsertBehavior(catDep.id, "lost-interest", "Lost all interest", "No motivation for things they usually love", false, 1, [dep2.id]);
  await upsertBehavior(catDep.id, "eating-more", "Eating way more", "Noticeably increased appetite or food intake", false, 2, [dep3.id]);
  await upsertBehavior(catDep.id, "eating-less", "Eating way less", "Skipping meals or barely eating", false, 3, [dep3.id]);
  await upsertBehavior(catDep.id, "withdrawn", "Withdrawn from people", "Avoiding friends, family, or any social contact", false, 4, [dep2.id]);
  await upsertBehavior(catDep.id, "worthless-guilt", "Worthless excessive guilt", "Saying they're a burden, a failure, not enough", false, 5, [dep7.id]);
  await upsertBehavior(catDep.id, "cant-focus", "Can't focus decide", "Unable to concentrate or make simple decisions", false, 6, [manicB5.id, dep8.id]);
  await upsertBehavior(catDep.id, "mentioned-death", "Mentioned death dying", "Any reference to death, not wanting to be here, or self-harm", true, 7, [dep9.id]);

  // MIXED / CYCLING
  await upsertBehavior(catMixed.id, "mood-swings", "Mood energy swings", "Shifted between high and low mood or energy within the day", false, 0, []);
  await upsertBehavior(catMixed.id, "agitated-depressed", "Agitated but depressed", "Sad or hopeless but also restless, wired, can't settle", false, 1, [manicB6.id, dep1.id]);
  await upsertBehavior(catMixed.id, "unprovoked-temper", "Unprovoked temper explosion", "Came out of nowhere, no proportional trigger", false, 2, [manicA.id]); // Gate (irritable)
  await upsertBehavior(catMixed.id, "unusual-anxiety", "Unusual anxiety panic", "Anxious, panicky, or clingy beyond what's typical for them", false, 3, []);
  await upsertBehavior(catMixed.id, "aggressive-destructive", "Aggressive or destructive", "Broke things, hit, or got physically aggressive", false, 4, [manicB7.id]);

  console.log("Behaviors: 25 definitions with criterion mappings");

  // ── Mood Descriptor Mappings ──
  // mood=MANIC satisfies manic gate
  await prisma.moodDescriptorMapping.upsert({
    where: { frameworkId_moodValue_poleId: { frameworkId: fw.id, moodValue: "MANIC", poleId: manicPole.id } },
    update: {},
    create: { frameworkId: fw.id, moodValue: "MANIC", poleId: manicPole.id, satisfiesGate: true },
  });
  // mood=MIXED satisfies manic gate
  await prisma.moodDescriptorMapping.upsert({
    where: { frameworkId_moodValue_poleId: { frameworkId: fw.id, moodValue: "MIXED", poleId: manicPole.id } },
    update: {},
    create: { frameworkId: fw.id, moodValue: "MIXED", poleId: manicPole.id, satisfiesGate: true },
  });
  // mood=DEPRESSIVE adds depressive criterion #1
  await prisma.moodDescriptorMapping.upsert({
    where: { frameworkId_moodValue_poleId: { frameworkId: fw.id, moodValue: "DEPRESSIVE", poleId: depPole.id } },
    update: {},
    create: { frameworkId: fw.id, moodValue: "DEPRESSIVE", poleId: depPole.id, satisfiesGate: false, addsCriterionId: dep1.id },
  });
  // mood=MIXED adds depressive criterion #1
  await prisma.moodDescriptorMapping.upsert({
    where: { frameworkId_moodValue_poleId: { frameworkId: fw.id, moodValue: "MIXED", poleId: depPole.id } },
    update: {},
    create: { frameworkId: fw.id, moodValue: "MIXED", poleId: depPole.id, satisfiesGate: false, addsCriterionId: dep1.id },
  });
  console.log("Mood descriptor mappings: 4");

  // ── Classification Rules ──
  // Manic DSM5_FULL: gate + 3 B criteria (4 if irritable-only)
  await upsertRule(fw.id, manicPole.id, "MANIC", "DSM5_FULL", true, 3, false, 1, 0, null, 10);
  // Manic SUBTHRESHOLD: gate + 2 B criteria
  await upsertRule(fw.id, manicPole.id, "MANIC", "SUBTHRESHOLD", true, 2, false, 0, 0, null, 5);
  // Depressive DSM5_FULL: core + 5 criteria
  await upsertRule(fw.id, depPole.id, "DEPRESSIVE", "DSM5_FULL", false, 5, true, 0, 0, null, 10);
  // Depressive SUBTHRESHOLD: core + 3 criteria
  await upsertRule(fw.id, depPole.id, "DEPRESSIVE", "SUBTHRESHOLD", false, 3, true, 0, 0, null, 5);
  // Mixed: manic + 3 opposite depressive criteria
  await upsertRule(fw.id, manicPole.id, "MIXED", "DSM5_FULL", true, 3, false, 0, 3, "MIXED", 15);
  // Mixed: depressive + 3 opposite manic criteria
  await upsertRule(fw.id, depPole.id, "MIXED", "DSM5_FULL", false, 5, true, 0, 3, "MIXED", 15);
  console.log("Classification rules: 6");

  // ── Episode Thresholds ──
  const thresholds = [
    { pole: manicPole.id, label: "MANIC", conf: "DSM5_MET", days: 7, dsm: true },
    { pole: manicPole.id, label: "HYPOMANIC", conf: "DSM5_MET", days: 4, dsm: true },
    { pole: manicPole.id, label: "MANIC", conf: "PRODROMAL_CONCERN", days: 4, dsm: false },
    { pole: manicPole.id, label: "HYPOMANIC", conf: "PRODROMAL_CONCERN", days: 2, dsm: false },
    { pole: depPole.id, label: "DEPRESSIVE", conf: "DSM5_MET", days: 14, dsm: true },
    { pole: depPole.id, label: "DEPRESSIVE", conf: "PRODROMAL_CONCERN", days: 7, dsm: false },
    { pole: depPole.id, label: "DEPRESSIVE", conf: "PRODROMAL_CONCERN", days: 5, dsm: false },
  ];
  for (const t of thresholds) {
    await prisma.episodeThreshold.create({
      data: {
        frameworkId: fw.id,
        poleId: t.pole,
        episodeLabel: t.label,
        confidenceLevel: t.conf,
        minDays: t.days,
        requiresDsmSymptoms: t.dsm,
      },
    });
  }
  console.log("Episode thresholds: 7");

  // ── Signal Rules ──
  // 1. Sleep disruption
  await upsertSignalRule(fw.id, "sleep-disruption", "Sleep disruption pattern",
    "Sleep issues logged {count} of the last {window} days. Persistent sleep changes are one of the earliest prodromal indicators.",
    "WARNING", 7, 3, false, 0,
    ["very-little-sleep", "slept-too-much", "irregular-sleep"]
  );
  // 2. Escalating irritability
  await upsertSignalRule(fw.id, "escalating-irritability", "Escalating irritability",
    "Irritability and rage behaviors are increasing over the last {window} days. This pattern often precedes a manic or mixed episode.",
    "WARNING", 14, 2, true, 2,
    ["disproportionate-rage", "unprovoked-temper", "aggressive-destructive"]
  );
  // 3. Energy volatility
  await upsertSignalRule(fw.id, "energy-volatility", "Energy level volatility",
    "Energy levels are swinging between high and low ({count} switches in {window} days). This instability can signal mood cycling.",
    "INFO", 7, 2, false, 0,
    ["high-energy", "no-energy"]
  );
  // 4. Safety concern (behavior-driven via isSafetyConcern flag, but also a signal)
  await upsertSignalRule(fw.id, "safety-concern", "Safety concern detected",
    "References to death, self-harm, or safety concerns were logged on {count} recent day(s). Please discuss with a clinician.",
    "ALERT", 7, 1, false, 0,
    ["mentioned-death"]
  );
  console.log("Signal rules: 4 (withdrawal + mood instability handled by score-based logic)");

  // ── Assign all existing tenants ──
  const tenants = await prisma.tenant.findMany({ select: { id: true } });
  let assigned = 0;
  for (const t of tenants) {
    await prisma.tenantFramework.upsert({
      where: { tenantId_frameworkId: { tenantId: t.id, frameworkId: fw.id } },
      update: {},
      create: { tenantId: t.id, frameworkId: fw.id },
    });
    assigned++;
  }
  console.log(`\nAssigned ${assigned} tenants to DSM-5 Bipolar framework.`);
  console.log("Done!");
}

// ── Helpers ──

async function upsertPole(frameworkId: string, slug: string, name: string, direction: number, sortOrder: number) {
  return prisma.criterionPole.upsert({
    where: { frameworkId_slug: { frameworkId, slug } },
    update: {},
    create: { frameworkId, slug, name, direction, sortOrder },
  });
}

async function upsertCriterion(poleId: string, number: number, name: string, criterionType: string) {
  return prisma.criterion.upsert({
    where: { poleId_number: { poleId, number } },
    update: {},
    create: { poleId, number, name, criterionType },
  });
}

async function upsertCategory(frameworkId: string, slug: string, name: string, sortOrder: number) {
  return prisma.frameworkBehaviorCategory.upsert({
    where: { frameworkId_slug: { frameworkId, slug } },
    update: {},
    create: { frameworkId, slug, name, sortOrder },
  });
}

async function upsertBehavior(
  categoryId: string, itemKey: string, label: string, description: string,
  isSafetyConcern: boolean, sortOrder: number, criterionIds: string[]
) {
  const behavior = await prisma.behaviorDefinition.upsert({
    where: { categoryId_itemKey: { categoryId, itemKey } },
    update: {},
    create: { categoryId, itemKey, label, description, isSafetyConcern, sortOrder },
  });

  // Upsert criterion mappings
  for (const criterionId of criterionIds) {
    await prisma.behaviorCriterionMapping.upsert({
      where: { behaviorId_criterionId: { behaviorId: behavior.id, criterionId } },
      update: {},
      create: { behaviorId: behavior.id, criterionId },
    });
  }

  return behavior;
}

async function upsertRule(
  frameworkId: string, poleId: string, classificationLabel: string, ruleType: string,
  gateRequired: boolean, minStandardCriteria: number, coreRequired: boolean,
  gateOnlyAdjustment: number, minOppositeCriteria: number, mixedLabel: string | null, priority: number
) {
  // Can't easily upsert without a unique constraint, so create
  // Check if exists first
  const existing = await prisma.classificationRule.findFirst({
    where: { frameworkId, poleId, classificationLabel, ruleType },
  });
  if (existing) return existing;

  return prisma.classificationRule.create({
    data: {
      frameworkId, poleId, classificationLabel, ruleType,
      gateRequired, minStandardCriteria, coreRequired,
      gateOnlyAdjustment, minOppositeCriteria, mixedLabel, priority,
    },
  });
}

async function upsertSignalRule(
  frameworkId: string, signalId: string, title: string, descriptionTemplate: string,
  level: string, windowDays: number, minOccurrences: number,
  trendCompare: boolean, trendMinLate: number, behaviorKeys: string[]
) {
  // Find or create signal rule
  let rule = await prisma.signalRule.findFirst({
    where: { frameworkId, signalId },
  });
  if (!rule) {
    rule = await prisma.signalRule.create({
      data: { frameworkId, signalId, title, descriptionTemplate, level, windowDays, minOccurrences, trendCompare, trendMinLate },
    });
  }

  // Link behaviors
  for (const key of behaviorKeys) {
    const behavior = await prisma.behaviorDefinition.findFirst({ where: { itemKey: key } });
    if (!behavior) {
      console.warn(`  Warning: behavior "${key}" not found for signal "${signalId}"`);
      continue;
    }
    await prisma.signalBehavior.upsert({
      where: { signalRuleId_behaviorId: { signalRuleId: rule.id, behaviorId: behavior.id } },
      update: {},
      create: { signalRuleId: rule.id, behaviorId: behavior.id },
    });
  }

  return rule;
}

seed()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
