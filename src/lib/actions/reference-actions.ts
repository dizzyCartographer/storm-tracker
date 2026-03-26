"use server";

import { prisma } from "@/lib/prisma";

export interface ReferenceCriterion {
  number: number;
  name: string;
  criterionType: "GATE" | "CORE" | "STANDARD";
}

export interface ReferenceBehavior {
  itemKey: string;
  label: string;
  description: string;
  recognitionExamples: string[] | null;
  isSafetyConcern: boolean;
  criterionMappings: {
    poleSlug: string;
    poleName: string;
    criterionNumber: number;
    criterionName: string;
    criterionType: string;
  }[];
}

export interface ReferenceBehaviorCategory {
  slug: string;
  name: string;
  behaviors: ReferenceBehavior[];
}

export interface ReferencePole {
  slug: string;
  name: string;
  direction: number;
  criteria: ReferenceCriterion[];
}

export interface ReferenceClassificationRule {
  classificationLabel: string;
  ruleType: string;
  poleSlug: string;
  poleName: string;
  gateRequired: boolean;
  minStandardCriteria: number;
  coreRequired: boolean;
  gateOnlyAdjustment: number;
  minOppositeCriteria: number;
  mixedLabel: string | null;
  priority: number;
}

export interface ReferenceEpisodeThreshold {
  episodeLabel: string;
  confidenceLevel: string;
  poleSlug: string;
  poleName: string;
  minDays: number;
  requiresDsmSymptoms: boolean;
}

export interface ReferenceFramework {
  name: string;
  slug: string;
  description: string | null;
  poles: ReferencePole[];
  behaviorCategories: ReferenceBehaviorCategory[];
  classificationRules: ReferenceClassificationRule[];
  episodeThresholds: ReferenceEpisodeThreshold[];
}

export async function getReferenceData(): Promise<ReferenceFramework[]> {
  const frameworks = await prisma.diagnosticFramework.findMany({
    where: { isActive: true },
    include: {
      poles: {
        include: { criteria: { orderBy: { number: "asc" } } },
        orderBy: { sortOrder: "asc" },
      },
      behaviorCategories: {
        include: {
          behaviors: {
            include: {
              criterionMappings: {
                include: {
                  criterion: { include: { pole: true } },
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
        orderBy: { minDays: "asc" },
      },
    },
  });

  return frameworks.map((fw) => ({
    name: fw.name,
    slug: fw.slug,
    description: fw.description,
    poles: fw.poles.map((p) => ({
      slug: p.slug,
      name: p.name,
      direction: p.direction,
      criteria: p.criteria.map((c) => ({
        number: c.number,
        name: c.name,
        criterionType: c.criterionType as "GATE" | "CORE" | "STANDARD",
      })),
    })),
    behaviorCategories: fw.behaviorCategories.map((cat) => ({
      slug: cat.slug,
      name: cat.name,
      behaviors: cat.behaviors.map((beh) => {
        let parsedExamples: string[] | null = null;
        if (beh.recognitionExamples) {
          try { parsedExamples = JSON.parse(beh.recognitionExamples); } catch { parsedExamples = null; }
        }
        return {
        itemKey: beh.itemKey,
        label: beh.label,
        description: beh.description,
        recognitionExamples: parsedExamples,
        isSafetyConcern: beh.isSafetyConcern,
        criterionMappings: beh.criterionMappings.map((m) => ({
          poleSlug: m.criterion.pole.slug,
          poleName: m.criterion.pole.name,
          criterionNumber: m.criterion.number,
          criterionName: m.criterion.name,
          criterionType: m.criterion.criterionType,
        })),
      };
      }),
    })),
    classificationRules: fw.classificationRules.map((r) => ({
      classificationLabel: r.classificationLabel,
      ruleType: r.ruleType,
      poleSlug: r.pole.slug,
      poleName: r.pole.name,
      gateRequired: r.gateRequired,
      minStandardCriteria: r.minStandardCriteria,
      coreRequired: r.coreRequired,
      gateOnlyAdjustment: r.gateOnlyAdjustment,
      minOppositeCriteria: r.minOppositeCriteria,
      mixedLabel: r.mixedLabel,
      priority: r.priority,
    })),
    episodeThresholds: fw.episodeThresholds.map((t) => ({
      episodeLabel: t.episodeLabel,
      confidenceLevel: t.confidenceLevel,
      poleSlug: t.pole.slug,
      poleName: t.pole.name,
      minDays: t.minDays,
      requiresDsmSymptoms: t.requiresDsmSymptoms,
    })),
  }));
}
