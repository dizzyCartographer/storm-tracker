/**
 * Migration script — converts existing BehaviorCheck records from
 * the old per-behavior model (25 items) to the new per-criterion model (17 items).
 *
 * For each old BehaviorCheck, maps it to the corresponding new criterion-level
 * itemKey. Old observational items (denies-anything-wrong, mood-swings,
 * unusual-anxiety) are converted to CustomCheck records.
 *
 * Must be run AFTER seed-frameworks.ts has populated the new definitions.
 *
 * Usage: npx tsx scripts/migrate-checklist-to-criteria.ts
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

// Old itemKey → new criterion-level itemKey(s)
const BEHAVIOR_MIGRATION_MAP: Record<string, string[]> = {
  "very-little-sleep": ["decreased-need-for-sleep"],
  "slept-too-much": ["insomnia-hypersomnia"],
  "irregular-sleep": ["decreased-need-for-sleep", "insomnia-hypersomnia"],
  "no-energy": ["fatigue-loss-of-energy"],
  "high-energy": ["goal-directed-activity"],
  "selective-energy": ["fatigue-loss-of-energy"],
  "psychosomatic": ["psychomotor-change"],
  "pressured-speech": ["pressured-speech"],
  "racing-thoughts": ["racing-thoughts"],
  "euphoria": ["elevated-expansive-irritable-mood"],
  "grandiose": ["inflated-self-image"],
  "nonstop-activity": ["goal-directed-activity"],
  "restless-agitation": ["goal-directed-activity"],
  "disproportionate-rage": ["elevated-expansive-irritable-mood"],
  "reckless-choices": ["risky-reckless-activities"],
  "bizarre-behavior": ["risky-reckless-activities"],
  "sad-empty-hopeless": ["depressed-mood"],
  "lost-interest": ["diminished-interest"],
  "eating-more": ["weight-appetite-change"],
  "eating-less": ["weight-appetite-change"],
  "withdrawn": ["diminished-interest"],
  "worthless-guilt": ["worthlessness-guilt"],
  "cant-focus": ["diminished-concentration"],
  "mentioned-death": ["thoughts-of-death"],
  "agitated-depressed": ["psychomotor-change", "depressed-mood"],
  "unprovoked-temper": ["elevated-expansive-irritable-mood"],
  "aggressive-destructive": ["risky-reckless-activities"],
};

// Old observational items → custom checklist labels
const OBSERVATIONAL_TO_CUSTOM: Record<string, string> = {
  "denies-anything-wrong": "Denies anything wrong",
  "mood-swings": "Mood energy swings",
  "unusual-anxiety": "Unusual anxiety panic",
};

async function migrate() {
  console.log("Migrating BehaviorCheck records to criterion-level model...\n");

  // Load new behavior definitions for lookup
  const newDefs = await prisma.behaviorDefinition.findMany();
  const defByKey = new Map(newDefs.map((d) => [d.itemKey, d]));

  // Load all existing BehaviorCheck records
  const oldChecks = await prisma.behaviorCheck.findMany({
    include: { entry: { select: { tenantId: true } } },
  });
  console.log(`Found ${oldChecks.length} existing BehaviorCheck records.`);

  let migrated = 0;
  let skippedDuplicate = 0;
  let movedToCustom = 0;
  let unmapped = 0;

  for (const check of oldChecks) {
    const oldKey = check.itemKey;

    // Check if this is an observational item → move to custom
    if (OBSERVATIONAL_TO_CUSTOM[oldKey]) {
      const customLabel = OBSERVATIONAL_TO_CUSTOM[oldKey];
      const tenantId = check.entry.tenantId;

      // Find or create the custom checklist item for this tenant
      let customItem = await prisma.customChecklistItem.findFirst({
        where: { tenantId, label: customLabel },
      });
      if (!customItem) {
        customItem = await prisma.customChecklistItem.create({
          data: { tenantId, label: customLabel },
        });
      }

      // Create a custom check if it doesn't exist
      const existingCustomCheck = await prisma.customCheck.findUnique({
        where: { entryId_itemId: { entryId: check.entryId, itemId: customItem.id } },
      });
      if (!existingCustomCheck) {
        await prisma.customCheck.create({
          data: { entryId: check.entryId, itemId: customItem.id, checked: true },
        });
        movedToCustom++;
      }

      // Delete the old behavior check
      await prisma.behaviorCheck.delete({ where: { id: check.id } });
      continue;
    }

    // Check if this maps to new criterion-level items
    const newKeys = BEHAVIOR_MIGRATION_MAP[oldKey];
    if (!newKeys) {
      console.warn(`  Unmapped behavior: "${oldKey}" (check ${check.id})`);
      unmapped++;
      // Delete the orphaned check
      await prisma.behaviorCheck.delete({ where: { id: check.id } });
      continue;
    }

    // For each new key this old behavior maps to
    for (const newKey of newKeys) {
      const newDef = defByKey.get(newKey);
      if (!newDef) {
        console.warn(`  New definition not found for key: "${newKey}"`);
        continue;
      }

      // Determine the category enum value from the new definition's category
      const newCategory = newDef.categoryId === (await getCategoryId("manic")) ? "MANIC" : "DEPRESSIVE";

      // Check if this entry already has a check for this new key (dedup)
      const existing = await prisma.behaviorCheck.findUnique({
        where: { entryId_itemKey: { entryId: check.entryId, itemKey: newKey } },
      });

      if (existing) {
        skippedDuplicate++;
      } else {
        // Create the new criterion-level check
        await prisma.behaviorCheck.create({
          data: {
            entryId: check.entryId,
            itemKey: newKey,
            category: newCategory as "MANIC" | "DEPRESSIVE",
            checked: true,
            behaviorDefinitionId: newDef.id,
          },
        });
        migrated++;
      }
    }

    // Delete the old check (it's been replaced)
    // But only if the old key differs from any new key (avoid deleting if key was reused)
    if (!newKeys.includes(oldKey)) {
      await prisma.behaviorCheck.delete({ where: { id: check.id } });
    }
  }

  console.log(`\nMigration complete:`);
  console.log(`  Migrated: ${migrated} new criterion-level checks created`);
  console.log(`  Deduplicated: ${skippedDuplicate} skipped (already existed)`);
  console.log(`  Moved to custom: ${movedToCustom} observational items`);
  console.log(`  Unmapped: ${unmapped} deleted`);
}

// Cache for category lookups
const categoryCache = new Map<string, string>();
async function getCategoryId(slug: string): Promise<string> {
  if (categoryCache.has(slug)) return categoryCache.get(slug)!;
  const cat = await prisma.frameworkBehaviorCategory.findFirst({ where: { slug } });
  if (!cat) throw new Error(`Category "${slug}" not found`);
  categoryCache.set(slug, cat.id);
  return cat.id;
}

migrate()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
