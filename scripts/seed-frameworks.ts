/**
 * Seed script — creates the DSM-5 Bipolar Disorder diagnostic framework
 * with criterion-level behavior definitions, recognition examples,
 * criteria, mappings, rules, and thresholds.
 *
 * Phase 16: Restructured to one checkbox per DSM-5 criterion (17 total)
 * with "this might look like" recognition examples for teen presentation.
 *
 * Idempotent: uses upserts on unique constraints.
 * Also assigns all existing tenants to this framework and seeds
 * default custom checklist items.
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
  console.log("Seeding DSM-5 Bipolar framework (criterion-level)...\n");

  // ── Framework ──
  const fw = await prisma.diagnosticFramework.upsert({
    where: { slug: "dsm5-bipolar" },
    update: {},
    create: {
      slug: "dsm5-bipolar",
      name: "DSM-5 Bipolar Disorder",
      version: "2.0",
      description: "Diagnostic criteria for bipolar I, bipolar II, and related disorders per the DSM-5. Criterion-level checklist with recognition examples.",
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

  // ── Clean up old behavior data ──
  // Remove old categories (sleep, energy, mixed-cycling) and their behaviors.
  // Keep manic and depressive categories but clear their old behaviors.
  console.log("\nCleaning up old behavior data...");

  // Delete signal behaviors first (FK constraint)
  await prisma.signalBehavior.deleteMany({});

  // Delete old behavior criterion mappings
  await prisma.behaviorCriterionMapping.deleteMany({});

  // Delete old behavior definitions
  await prisma.behaviorDefinition.deleteMany({});

  // Delete old categories
  await prisma.frameworkBehaviorCategory.deleteMany({
    where: { frameworkId: fw.id },
  });

  console.log("Old behavior data cleaned up.");

  // ── Behavior Categories (2 only: manic, depressive) ──
  const catManic = await upsertCategory(fw.id, "manic", "Manic", 0);
  const catDep = await upsertCategory(fw.id, "depressive", "Depressive", 1);

  // ── Criterion-Level Behavior Definitions ──
  // Each definition maps 1:1 to a DSM-5 criterion with teen-focused recognition examples.

  // MANIC POLE (8 items)
  await upsertBehavior(catManic.id, "elevated-expansive-irritable-mood",
    "Mood is abnormally elevated, expansive, or irritable",
    "Gate criterion — at least one mood presentation must be present before other manic criteria count",
    JSON.stringify([
      "Unusually happy, giddy, or \"up\" for no clear reason",
      "Wired, buzzy, euphoric energy that doesn't match the situation",
      "Explosive anger way out of proportion to what happened",
      "Sudden rage that comes out of nowhere, no real trigger",
      "Acting like everything is amazing when it objectively isn't",
      "Grinning, laughing, or being \"on\" in a way that feels off",
      "Irritable and snapping at everyone over nothing"
    ]),
    false, 0, [manicA.id]);

  await upsertBehavior(catManic.id, "inflated-self-image",
    "Inflated self-image or grandiosity",
    "B1 — Inflated self-esteem or grandiosity",
    JSON.stringify([
      "Talking like they're the best at everything, untouchable",
      "Making grand plans that are wildly unrealistic",
      "Believing they have special abilities, connections, or status",
      "Dismissing anyone who questions them — \"you just don't get it\"",
      "Acting invincible, like consequences don't apply to them",
      "Sudden expertise in things they know little about"
    ]),
    false, 1, [manicB1.id]);

  await upsertBehavior(catManic.id, "decreased-need-for-sleep",
    "Decreased need for sleep",
    "B2 — Decreased need for sleep (not just insomnia — they feel rested on less)",
    JSON.stringify([
      "Sleeping 2–4 hours and bouncing up full of energy",
      "Staying up all night but not seeming tired the next day",
      "Claiming they don't need sleep, or that sleep is a waste of time",
      "Irregular pattern — up and down all night, can't settle",
      "Going days with minimal sleep without crashing"
    ]),
    false, 2, [manicB2.id]);

  await upsertBehavior(catManic.id, "pressured-speech",
    "Pressured speech",
    "B3 — More talkative than usual or pressure to keep talking",
    JSON.stringify([
      "Talking fast, loud, and hard to interrupt",
      "Jumping from one sentence to the next without breathing",
      "Dominating every conversation, not letting anyone get a word in",
      "Talking at people rather than with them",
      "Volume and speed are turned up compared to their baseline",
      "Rambling voicemails, walls of text messages"
    ]),
    false, 3, [manicB3.id]);

  await upsertBehavior(catManic.id, "racing-thoughts",
    "Racing thoughts or flight of ideas",
    "B4 — Flight of ideas or subjective experience of racing thoughts",
    JSON.stringify([
      "Bouncing between topics mid-sentence",
      "Starting to say one thing and veering into something totally different",
      "Saying \"my brain won't stop\" or \"I can't turn it off\"",
      "Making connections between unrelated things that don't track",
      "Ideas coming so fast they can't finish one before starting the next"
    ]),
    false, 4, [manicB4.id]);

  await upsertBehavior(catManic.id, "distractibility",
    "Distractibility",
    "B5 — Distractibility (attention too easily drawn to unimportant things)",
    JSON.stringify([
      "Can't stay on one task, pulled away by every little thing",
      "Losing the thread of a conversation mid-sentence",
      "Starting something and immediately pivoting to something else",
      "Attention grabbed by irrelevant background noise, objects, or thoughts",
      "Unable to follow through on even simple requests"
    ]),
    false, 5, [manicB5.id]);

  await upsertBehavior(catManic.id, "goal-directed-activity",
    "Increase in goal-directed activity or physical agitation",
    "B6 — Increase in goal-directed activity (social, work, sexual) or psychomotor agitation",
    JSON.stringify([
      "Starting a dozen projects, plans, or tasks all at once",
      "Suddenly reorganizing the house, launching a business, writing a book — at 2 AM",
      "Pacing, can't sit still, restless physical energy",
      "Cleaning, organizing, or doing tasks with frantic intensity",
      "Working on something obsessively without stopping to eat or rest",
      "Amped up, wired, more physical energy than usual",
      "Fidgeting, bouncing, tapping — body won't settle"
    ]),
    false, 6, [manicB6.id]);

  await upsertBehavior(catManic.id, "risky-reckless-activities",
    "Excessive involvement in risky or reckless activities",
    "B7 — Excessive involvement in activities with high potential for painful consequences",
    JSON.stringify([
      "Spending money they don't have on things they don't need",
      "Reckless driving, substance use, or sexual behavior that's out of character",
      "Making huge decisions impulsively — quitting a job, signing a lease, buying a car",
      "Dressing, acting, or talking in ways that are totally unlike them",
      "Breaking things, hitting, or getting physically aggressive",
      "Doing things they'd normally never do and can't explain afterward",
      "Picking fights or provoking people without caring about consequences"
    ]),
    false, 7, [manicB7.id]);

  // DEPRESSIVE POLE (9 items)
  await upsertBehavior(catDep.id, "depressed-mood",
    "Depressed mood most of the day",
    "#1 (Core) — Depressed mood most of the day, nearly every day",
    JSON.stringify([
      "Sad, down, flat, or \"empty\" most of the day",
      "Saying things feel hopeless or pointless",
      "Crying spells or tearing up for no clear reason",
      "Looking defeated, heavy, or checked out",
      "Describing everything in bleak terms — nothing good, nothing ahead",
      "In teens: may show up as persistent irritability instead of sadness"
    ]),
    false, 0, [dep1.id]);

  await upsertBehavior(catDep.id, "diminished-interest",
    "Markedly diminished interest or pleasure",
    "#2 (Core) — Markedly diminished interest or pleasure in all or almost all activities",
    JSON.stringify([
      "No motivation for things they usually love",
      "Stopped reaching out to friends, avoiding social contact",
      "Turning down activities they'd normally jump at",
      "\"I just don't care\" about hobbies, plans, or people",
      "Withdrawing from the family — staying in their room, not engaging",
      "Going through the motions without any spark or enjoyment"
    ]),
    false, 1, [dep2.id]);

  await upsertBehavior(catDep.id, "weight-appetite-change",
    "Significant change in weight or appetite",
    "#3 — Significant weight loss or gain, or decrease/increase in appetite",
    JSON.stringify([
      "Eating noticeably more than usual, emotional eating, cravings",
      "Barely eating, skipping meals, food feels unappealing",
      "Noticeable weight gain or loss without trying",
      "Relationship with food has clearly shifted from their baseline"
    ]),
    false, 2, [dep3.id]);

  await upsertBehavior(catDep.id, "insomnia-hypersomnia",
    "Insomnia or hypersomnia",
    "#4 — Insomnia or hypersomnia nearly every day",
    JSON.stringify([
      "Sleeping way more than usual, can't get out of bed",
      "Trouble falling asleep or staying asleep",
      "Waking up in the middle of the night and lying there for hours",
      "Napping during the day on top of a full night's sleep",
      "Sleep schedule is all over the place"
    ]),
    false, 3, [dep4.id]);

  await upsertBehavior(catDep.id, "psychomotor-change",
    "Psychomotor agitation or slowing",
    "#5 — Psychomotor agitation or retardation nearly every day",
    JSON.stringify([
      "Moving in slow motion — slow to get up, walk, respond",
      "Long pauses before answering questions",
      "Physically restless but emotionally flat (agitated depression)",
      "Pacing or hand-wringing paired with low mood",
      "Unexplained headaches, stomachaches, or body aches with no medical cause",
      "Looking physically heavy, like gravity is pulling harder on them"
    ]),
    false, 4, [dep5.id]);

  await upsertBehavior(catDep.id, "fatigue-loss-of-energy",
    "Fatigue or loss of energy",
    "#6 — Fatigue or loss of energy nearly every day",
    JSON.stringify([
      "Dragging, sluggish, can't get going no matter what",
      "Saying \"I'm so tired\" constantly even after sleeping",
      "Simple tasks (shower, getting dressed) feel like climbing a mountain",
      "Needing rest after minimal effort"
    ]),
    false, 5, [dep6.id]);

  await upsertBehavior(catDep.id, "worthlessness-guilt",
    "Feelings of worthlessness or excessive guilt",
    "#7 — Feelings of worthlessness or excessive/inappropriate guilt",
    JSON.stringify([
      "Saying they're a burden, a failure, not good enough",
      "Apologizing constantly for things that aren't their fault",
      "Convinced they've let everyone down",
      "Talking about themselves in harsh, absolute terms — \"I ruin everything\"",
      "Guilt that's way out of proportion to the situation",
      "Believing they don't deserve good things or help"
    ]),
    false, 6, [dep7.id]);

  await upsertBehavior(catDep.id, "diminished-concentration",
    "Diminished ability to think or concentrate",
    "#8 — Diminished ability to think or concentrate, or indecisiveness",
    JSON.stringify([
      "Can't focus on a show, a book, or a conversation",
      "Unable to make simple decisions — paralyzed by small choices",
      "Staring into space, zoned out, mentally foggy",
      "Taking much longer to do things that are usually easy",
      "Forgetting things they'd normally remember",
      "Saying \"I can't think straight\""
    ]),
    false, 7, [dep8.id]);

  await upsertBehavior(catDep.id, "thoughts-of-death",
    "Recurrent thoughts of death or suicidal ideation",
    "#9 — Recurrent thoughts of death, suicidal ideation, or attempt",
    JSON.stringify([
      "Any mention of death, dying, or not wanting to be here",
      "\"Everyone would be better off without me\"",
      "Talking about being a burden in a way that implies the world is better without them",
      "Giving away belongings, saying goodbye in unusual ways",
      "Researching methods or writing notes",
      "Expressing hopelessness about the future in absolute terms",
      "Always flag this — even if you're not sure. Better to be safe."
    ]),
    true, 8, [dep9.id]);

  console.log("Behaviors: 17 criterion-level definitions with recognition examples");

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
  // Clear existing and recreate
  await prisma.episodeThreshold.deleteMany({ where: { frameworkId: fw.id } });
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
  // Clear existing signal rules and recreate with new behavior keys
  await prisma.signalRule.deleteMany({ where: { frameworkId: fw.id } });

  // 1. Sleep disruption
  await createSignalRule(fw.id, "sleep-disruption", "Sleep disruption pattern",
    "Sleep issues logged {count} of the last {window} days. Persistent sleep changes are one of the earliest prodromal indicators.",
    "WARNING", 7, 3, false, 0,
    ["decreased-need-for-sleep", "insomnia-hypersomnia"]
  );
  // 2. Escalating irritability
  await createSignalRule(fw.id, "escalating-irritability", "Escalating irritability",
    "Irritability and rage behaviors are increasing over the last {window} days. This pattern often precedes a manic or mixed episode.",
    "WARNING", 14, 2, true, 2,
    ["elevated-expansive-irritable-mood", "risky-reckless-activities"]
  );
  // 3. Energy volatility
  await createSignalRule(fw.id, "energy-volatility", "Energy level volatility",
    "Energy levels are swinging between high and low ({count} switches in {window} days). This instability can signal mood cycling.",
    "INFO", 7, 2, false, 0,
    ["goal-directed-activity", "fatigue-loss-of-energy"]
  );
  // 4. Safety concern
  await createSignalRule(fw.id, "safety-concern", "Safety concern detected",
    "References to death, self-harm, or safety concerns were logged on {count} recent day(s). Please discuss with a clinician.",
    "ALERT", 7, 1, false, 0,
    ["thoughts-of-death"]
  );
  console.log("Signal rules: 4");

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

  // ── Seed default custom checklist items for all tenants ──
  // These are the 3 observational items that moved out of the behavior checklist.
  const defaultCustomItems = [
    { label: "Denies anything wrong" },
    { label: "Mood energy swings" },
    { label: "Unusual anxiety panic" },
  ];

  let customSeeded = 0;
  for (const t of tenants) {
    for (const item of defaultCustomItems) {
      // Only create if this tenant doesn't already have this label
      const existing = await prisma.customChecklistItem.findFirst({
        where: { tenantId: t.id, label: item.label },
      });
      if (!existing) {
        await prisma.customChecklistItem.create({
          data: { tenantId: t.id, label: item.label },
        });
        customSeeded++;
      }
    }
  }
  console.log(`Seeded ${customSeeded} default custom checklist items across ${tenants.length} tenants.`);
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
    update: { name, sortOrder },
    create: { frameworkId, slug, name, sortOrder },
  });
}

async function upsertBehavior(
  categoryId: string, itemKey: string, label: string, description: string,
  recognitionExamples: string | null,
  isSafetyConcern: boolean, sortOrder: number, criterionIds: string[]
) {
  const behavior = await prisma.behaviorDefinition.upsert({
    where: { categoryId_itemKey: { categoryId, itemKey } },
    update: { label, description, recognitionExamples, isSafetyConcern, sortOrder },
    create: { categoryId, itemKey, label, description, recognitionExamples, isSafetyConcern, sortOrder },
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

async function createSignalRule(
  frameworkId: string, signalId: string, title: string, descriptionTemplate: string,
  level: string, windowDays: number, minOccurrences: number,
  trendCompare: boolean, trendMinLate: number, behaviorKeys: string[]
) {
  const rule = await prisma.signalRule.create({
    data: { frameworkId, signalId, title, descriptionTemplate, level, windowDays, minOccurrences, trendCompare, trendMinLate },
  });

  for (const key of behaviorKeys) {
    const behavior = await prisma.behaviorDefinition.findFirst({ where: { itemKey: key } });
    if (!behavior) {
      console.warn(`  Warning: behavior "${key}" not found for signal "${signalId}"`);
      continue;
    }
    await prisma.signalBehavior.create({
      data: { signalRuleId: rule.id, behaviorId: behavior.id },
    });
  }

  return rule;
}

seed()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
