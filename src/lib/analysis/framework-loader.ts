import { prisma } from "@/lib/prisma";

/**
 * Framework Loader — loads diagnostic framework config from the database
 * with in-memory caching (5-min TTL). Frameworks change rarely (admin-only),
 * so aggressive caching is safe.
 */

export interface LoadedCriterion {
  id: string;
  number: number;
  name: string;
  criterionType: "GATE" | "CORE" | "STANDARD";
  poleSlug: string;
}

export interface LoadedBehavior {
  id: string;
  itemKey: string;
  label: string;
  description: string;
  recognitionExamples: string[] | null;
  isSafetyConcern: boolean;
  categorySlug: string;
  categoryName: string;
  categorySortOrder: number;
  sortOrder: number;
  /** Criteria this behavior satisfies, keyed by poleSlug */
  criterionMappings: { poleSlug: string; criterionNumber: number; criterionType: string }[];
}

export interface LoadedClassificationRule {
  classificationLabel: string;
  ruleType: string;
  poleSlug: string;
  gateRequired: boolean;
  minStandardCriteria: number;
  coreRequired: boolean;
  gateOnlyAdjustment: number;
  minOppositeCriteria: number;
  mixedLabel: string | null;
  priority: number;
}

export interface LoadedEpisodeThreshold {
  episodeLabel: string;
  confidenceLevel: string;
  poleSlug: string;
  minDays: number;
  requiresDsmSymptoms: boolean;
}

export interface LoadedSignalRule {
  signalId: string;
  title: string;
  descriptionTemplate: string;
  level: string;
  windowDays: number;
  minOccurrences: number;
  trendCompare: boolean;
  trendMinLate: number;
  behaviorKeys: string[];
}

export interface LoadedMoodMapping {
  moodValue: string;
  poleSlug: string | null;
  satisfiesGate: boolean;
  addsCriterionNumber: number | null;
  addsCriterionPoleSlug: string | null;
}

export interface LoadedPole {
  slug: string;
  name: string;
  direction: number;
}

export interface LoadedFramework {
  id: string;
  slug: string;
  name: string;
  poles: LoadedPole[];
  behaviors: LoadedBehavior[];
  behaviorMap: Map<string, LoadedBehavior>;
  classificationRules: LoadedClassificationRule[];
  episodeThresholds: LoadedEpisodeThreshold[];
  signalRules: LoadedSignalRule[];
  moodMappings: LoadedMoodMapping[];
}

// In-memory cache with TTL
const frameworkCache = new Map<string, { data: LoadedFramework; loadedAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function loadFramework(frameworkId: string): Promise<LoadedFramework> {
  const cached = frameworkCache.get(frameworkId);
  if (cached && Date.now() - cached.loadedAt < CACHE_TTL) return cached.data;

  const fw = await prisma.diagnosticFramework.findUniqueOrThrow({
    where: { id: frameworkId },
    include: {
      poles: {
        include: {
          criteria: true,
        },
        orderBy: { sortOrder: "asc" },
      },
      behaviorCategories: {
        include: {
          behaviors: {
            include: {
              criterionMappings: {
                include: {
                  criterion: {
                    include: { pole: true },
                  },
                },
              },
            },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
      classificationRules: {
        include: { pole: true },
        orderBy: { priority: "desc" },
      },
      episodeThresholds: {
        include: { pole: true },
      },
      signalRules: {
        include: {
          behaviors: {
            include: { behavior: true },
          },
        },
      },
      moodDescriptorMappings: {
        include: {
          pole: true,
          addsCriterion: {
            include: { pole: true },
          },
        },
      },
    },
  });

  const poles: LoadedPole[] = fw.poles.map((p) => ({
    slug: p.slug,
    name: p.name,
    direction: p.direction,
  }));

  const behaviors: LoadedBehavior[] = [];
  for (const cat of fw.behaviorCategories) {
    for (const beh of cat.behaviors) {
      let parsedExamples: string[] | null = null;
      if (beh.recognitionExamples) {
        try { parsedExamples = JSON.parse(beh.recognitionExamples); } catch { parsedExamples = null; }
      }
      behaviors.push({
        id: beh.id,
        itemKey: beh.itemKey,
        label: beh.label,
        description: beh.description,
        recognitionExamples: parsedExamples,
        isSafetyConcern: beh.isSafetyConcern,
        categorySlug: cat.slug,
        categoryName: cat.name,
        categorySortOrder: cat.sortOrder,
        sortOrder: beh.sortOrder,
        criterionMappings: beh.criterionMappings.map((m) => ({
          poleSlug: m.criterion.pole.slug,
          criterionNumber: m.criterion.number,
          criterionType: m.criterion.criterionType,
        })),
      });
    }
  }

  const behaviorMap = new Map<string, LoadedBehavior>();
  for (const b of behaviors) behaviorMap.set(b.itemKey, b);

  const classificationRules: LoadedClassificationRule[] = fw.classificationRules.map((r) => ({
    classificationLabel: r.classificationLabel,
    ruleType: r.ruleType,
    poleSlug: r.pole.slug,
    gateRequired: r.gateRequired,
    minStandardCriteria: r.minStandardCriteria,
    coreRequired: r.coreRequired,
    gateOnlyAdjustment: r.gateOnlyAdjustment,
    minOppositeCriteria: r.minOppositeCriteria,
    mixedLabel: r.mixedLabel,
    priority: r.priority,
  }));

  const episodeThresholds: LoadedEpisodeThreshold[] = fw.episodeThresholds.map((t) => ({
    episodeLabel: t.episodeLabel,
    confidenceLevel: t.confidenceLevel,
    poleSlug: t.pole.slug,
    minDays: t.minDays,
    requiresDsmSymptoms: t.requiresDsmSymptoms,
  }));

  const signalRules: LoadedSignalRule[] = fw.signalRules.map((r) => ({
    signalId: r.signalId,
    title: r.title,
    descriptionTemplate: r.descriptionTemplate,
    level: r.level,
    windowDays: r.windowDays,
    minOccurrences: r.minOccurrences,
    trendCompare: r.trendCompare,
    trendMinLate: r.trendMinLate,
    behaviorKeys: r.behaviors.map((b) => b.behavior.itemKey),
  }));

  const moodMappings: LoadedMoodMapping[] = fw.moodDescriptorMappings.map((m) => ({
    moodValue: m.moodValue,
    poleSlug: m.pole?.slug ?? null,
    satisfiesGate: m.satisfiesGate,
    addsCriterionNumber: m.addsCriterion?.number ?? null,
    addsCriterionPoleSlug: m.addsCriterion?.pole?.slug ?? null,
  }));

  const loaded: LoadedFramework = {
    id: fw.id,
    slug: fw.slug,
    name: fw.name,
    poles,
    behaviors,
    behaviorMap,
    classificationRules,
    episodeThresholds,
    signalRules,
    moodMappings,
  };

  frameworkCache.set(frameworkId, { data: loaded, loadedAt: Date.now() });
  return loaded;
}

/** Load the first active framework for a tenant */
export async function loadTenantFramework(tenantId: string): Promise<LoadedFramework | null> {
  const tf = await prisma.tenantFramework.findFirst({
    where: { tenantId },
    include: { framework: true },
  });
  if (!tf) return null;
  return loadFramework(tf.frameworkId);
}

/** Load all active frameworks for a tenant */
export async function loadTenantFrameworks(tenantId: string): Promise<LoadedFramework[]> {
  const tfs = await prisma.tenantFramework.findMany({
    where: { tenantId },
    include: { framework: true },
  });
  return Promise.all(tfs.map((tf) => loadFramework(tf.frameworkId)));
}

/** Get behavior items for rendering in the UI (from tenant's active frameworks) */
export async function getTenantBehaviorItems(tenantId: string): Promise<{
  items: { key: string; category: string; categoryName: string; label: string; description: string; recognitionExamples: string[] | null; sortOrder: number; categorySortOrder: number }[];
}> {
  const frameworks = await loadTenantFrameworks(tenantId);
  const items: { key: string; category: string; categoryName: string; label: string; description: string; recognitionExamples: string[] | null; sortOrder: number; categorySortOrder: number }[] = [];

  for (const fw of frameworks) {
    for (const beh of fw.behaviors) {
      items.push({
        key: beh.itemKey,
        category: beh.categorySlug,
        categoryName: beh.categoryName,
        label: beh.label,
        description: beh.description,
        recognitionExamples: beh.recognitionExamples,
        sortOrder: beh.sortOrder,
        categorySortOrder: beh.categorySortOrder,
      });
    }
  }

  return { items };
}
