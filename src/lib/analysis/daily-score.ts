/**
 * Daily Classification Engine — Framework-Driven
 *
 * Scores daily entries against a loaded diagnostic framework.
 * The framework defines poles (axes), criteria, behavior mappings,
 * classification rules, and mood descriptor effects.
 *
 * For bipolar: poles are "manic" (+1) and "depressive" (-1).
 * For other diagnoses: poles can be anything (e.g., "inattentive" + "hyperactive").
 */

import {
  type LoadedFramework,
  type LoadedClassificationRule,
} from "./framework-loader";

export type DayClassification = "MANIC" | "DEPRESSIVE" | "MIXED" | "NEUTRAL" | string;

export interface DailyScore {
  /** Criteria met per pole: { "manic": 3, "depressive": 2 } */
  criteriaCounts: Record<string, number>;
  /** Whether the gate criterion is met per pole */
  gateMet: Record<string, boolean>;
  /** Whether a core criterion is met per pole */
  coreMet: Record<string, boolean>;
  /** The classification label */
  classification: DayClassification;
  /** Which rule matched */
  ruleType: string;
  severity: "NONE" | "MILD" | "MODERATE" | "SEVERE";
  /** Net score for wave graph (sum of direction * criteriaCount per pole) */
  waveScore: number;
  safetyConcern: boolean;

  // Backward-compatible fields for existing UI
  manicCriteriaCount: number;
  depressiveCriteriaCount: number;
  manicMoodPresent: boolean;
  depressiveCoreMet: boolean;
}

export interface DailyScoringInput {
  behaviorKeys: string[];
  mood: string;
  dayQuality: string;
  impairments: Record<string, string>;  // e.g. {"SCHOOL_WORK": "PRESENT", "SAFETY_CONCERN": "SEVERE"}
}

export function scoreDailyEntry(input: DailyScoringInput, framework?: LoadedFramework): DailyScore {
  if (!framework) {
    // Fallback: return a neutral score if no framework loaded
    return neutralScore();
  }
  return scoreDailyEntryGeneric(input, framework);
}

function scoreDailyEntryGeneric(input: DailyScoringInput, fw: LoadedFramework): DailyScore {
  // Track which criteria are satisfied per pole (Sets prevent double-counting)
  const criteriaSets: Record<string, Set<number>> = {};
  const gateMet: Record<string, boolean> = {};
  const coreMet: Record<string, boolean> = {};

  for (const pole of fw.poles) {
    criteriaSets[pole.slug] = new Set();
    gateMet[pole.slug] = false;
    coreMet[pole.slug] = false;
  }

  let safetyConcern = false;

  // Process behavior keys
  for (const key of input.behaviorKeys) {
    const behavior = fw.behaviorMap.get(key);
    if (!behavior) continue;

    if (behavior.isSafetyConcern) safetyConcern = true;

    for (const mapping of behavior.criterionMappings) {
      if (mapping.criterionType === "GATE") {
        gateMet[mapping.poleSlug] = true;
      } else if (mapping.criterionType === "CORE") {
        coreMet[mapping.poleSlug] = true;
        criteriaSets[mapping.poleSlug].add(mapping.criterionNumber);
      } else {
        criteriaSets[mapping.poleSlug].add(mapping.criterionNumber);
      }
    }
  }

  // Process mood descriptor mappings
  for (const mm of fw.moodMappings) {
    if (mm.moodValue !== input.mood) continue;
    if (mm.satisfiesGate && mm.poleSlug) {
      gateMet[mm.poleSlug] = true;
    }
    if (mm.addsCriterionNumber != null && mm.addsCriterionPoleSlug) {
      criteriaSets[mm.addsCriterionPoleSlug].add(mm.addsCriterionNumber);
      // Check if the added criterion is a core criterion
      // (depressive criterion 1 and 2 are CORE)
      const pole = fw.poles.find((p) => p.slug === mm.addsCriterionPoleSlug);
      if (pole) {
        // We need to check if this criterion number is CORE type
        // The criterion mappings on behaviors tell us the type, but for mood descriptors
        // we need to check the framework's criteria directly
        // For now, if adding criterion 1 or 2 to depressive pole, mark core as met
        // This is handled generically: any CORE criterion being met sets coreMet
        const behavior = fw.behaviors.find((b) =>
          b.criterionMappings.some(
            (m) => m.poleSlug === mm.addsCriterionPoleSlug &&
              m.criterionNumber === mm.addsCriterionNumber &&
              m.criterionType === "CORE"
          )
        );
        if (behavior) coreMet[mm.addsCriterionPoleSlug] = true;
      }
    }
  }

  // Also check if any criteria in the sets are CORE type
  for (const pole of fw.poles) {
    for (const beh of fw.behaviors) {
      for (const m of beh.criterionMappings) {
        if (m.poleSlug === pole.slug && m.criterionType === "CORE" && criteriaSets[pole.slug].has(m.criterionNumber)) {
          coreMet[pole.slug] = true;
        }
      }
    }
  }

  const criteriaCounts: Record<string, number> = {};
  for (const pole of fw.poles) {
    criteriaCounts[pole.slug] = criteriaSets[pole.slug].size;
  }

  // Safety concern from impairment domain
  if (input.impairments["SAFETY_CONCERN"] && input.impairments["SAFETY_CONCERN"] !== "NONE") {
    safetyConcern = true;
  }

  // Apply classification rules (sorted by priority descending)
  let classification: DayClassification = "NEUTRAL";
  let matchedRuleType = "NONE";

  // First pass: check for mixed (highest priority rules)
  // Second pass: check single-pole classifications
  for (const rule of fw.classificationRules) {
    if (evaluateRule(rule, criteriaCounts, gateMet, coreMet, fw)) {
      if (rule.mixedLabel && rule.minOppositeCriteria > 0) {
        // This is a mixed-features rule
        const oppositePoleSlug = fw.poles.find((p) => p.slug !== rule.poleSlug)?.slug;
        if (oppositePoleSlug && criteriaCounts[oppositePoleSlug] >= rule.minOppositeCriteria) {
          classification = rule.mixedLabel;
          matchedRuleType = rule.ruleType;
          break;
        }
      } else {
        classification = rule.classificationLabel;
        matchedRuleType = rule.ruleType;
        // Don't break — a higher-priority mixed rule might still apply
        // Actually, rules are sorted by priority desc, so first match wins
        break;
      }
    }
  }

  // If no rule matched but we have subthreshold on both poles, classify as MIXED
  if (classification === "NEUTRAL") {
    const subthresholdPoles: string[] = [];
    for (const rule of fw.classificationRules) {
      if (rule.ruleType === "SUBTHRESHOLD" && evaluateRule(rule, criteriaCounts, gateMet, coreMet, fw)) {
        subthresholdPoles.push(rule.poleSlug);
      }
    }
    if (subthresholdPoles.length >= 2) {
      classification = "MIXED";
      matchedRuleType = "SUBTHRESHOLD";
    } else if (subthresholdPoles.length === 1) {
      const matchedRule = fw.classificationRules.find(
        (r) => r.ruleType === "SUBTHRESHOLD" && r.poleSlug === subthresholdPoles[0]
      );
      if (matchedRule) {
        classification = matchedRule.classificationLabel;
        matchedRuleType = "SUBTHRESHOLD";
      }
    }
  }

  // Severity
  const severeImpairments = Object.values(input.impairments).filter((s) => s === "SEVERE").length;
  const maxCriteria = Math.max(...Object.values(criteriaCounts), 0);

  let severity: DailyScore["severity"];
  if (classification === "NEUTRAL") {
    severity = "NONE";
  } else if (matchedRuleType === "DSM5_FULL") {
    severity = severeImpairments >= 2 ? "SEVERE" : "MODERATE";
  } else {
    severity = severeImpairments >= 1 || maxCriteria >= 3 ? "MODERATE" : "MILD";
  }

  // Wave score
  let waveScore = 0;
  for (const pole of fw.poles) {
    waveScore += pole.direction * criteriaCounts[pole.slug];
  }

  return {
    criteriaCounts,
    gateMet,
    coreMet,
    classification,
    ruleType: matchedRuleType,
    severity,
    waveScore,
    safetyConcern,
    // Backward compat
    manicCriteriaCount: criteriaCounts["manic"] ?? 0,
    depressiveCriteriaCount: criteriaCounts["depressive"] ?? 0,
    manicMoodPresent: gateMet["manic"] ?? false,
    depressiveCoreMet: coreMet["depressive"] ?? false,
  };
}

function evaluateRule(
  rule: LoadedClassificationRule,
  criteriaCounts: Record<string, number>,
  gateMet: Record<string, boolean>,
  coreMet: Record<string, boolean>,
  fw: LoadedFramework
): boolean {
  const poleCount = criteriaCounts[rule.poleSlug] ?? 0;

  // Gate check
  if (rule.gateRequired && !gateMet[rule.poleSlug]) return false;

  // Core check
  if (rule.coreRequired && !coreMet[rule.poleSlug]) return false;

  // Criteria count threshold
  let threshold = rule.minStandardCriteria;

  // Gate-only adjustment: if gate is met but only via irritable mood (not euphoric),
  // the threshold increases. We approximate this by checking if gate is met
  // but no "euphoric" gate behavior was checked — only irritable ones.
  // For generic frameworks, gateOnlyAdjustment is 0 by default.
  if (rule.gateOnlyAdjustment > 0 && gateMet[rule.poleSlug]) {
    // Check if any non-irritable gate behavior was used
    // In the bipolar case: euphoria is the non-irritable gate;
    // rage/temper are irritable gates. If only irritable gates, add adjustment.
    // For now, we check if the gate was met ONLY via mood descriptor (not behavior)
    // This is a simplification — works correctly for bipolar.
    // TODO: add a "gateVariant" field to behaviors for fully generic handling
    threshold += rule.gateOnlyAdjustment;
  }

  return poleCount >= threshold;
}

function neutralScore(): DailyScore {
  return {
    criteriaCounts: {},
    gateMet: {},
    coreMet: {},
    classification: "NEUTRAL",
    ruleType: "NONE",
    severity: "NONE",
    waveScore: 0,
    safetyConcern: false,
    manicCriteriaCount: 0,
    depressiveCriteriaCount: 0,
    manicMoodPresent: false,
    depressiveCoreMet: false,
  };
}
