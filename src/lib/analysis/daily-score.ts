import { BEHAVIOR_ITEMS } from "@/lib/behavior-items";

/**
 * Daily Classification Engine
 *
 * Scores a day's behaviors to produce manic and depressive scores,
 * then classifies the day. Scoring is inspired by the YMRS approach:
 * core symptoms weighted higher, supporting symptoms add context.
 *
 * Manic score:  sum of manic-leaning behavior weights
 * Depressive score: sum of depressive-leaning behavior weights
 *
 * Sleep and energy items contribute to both poles depending on direction.
 * Mixed/cycling items contribute to both scores.
 * Impairments amplify severity.
 */

// Behavior weights: how much each checked behavior contributes to manic or depressive score
const BEHAVIOR_WEIGHTS: Record<string, { manic: number; depressive: number }> = {
  // SLEEP
  "very-little-sleep":    { manic: 2, depressive: 0 },
  "slept-too-much":       { manic: 0, depressive: 2 },
  "irregular-sleep":      { manic: 1, depressive: 1 },

  // ENERGY
  "no-energy":            { manic: 0, depressive: 2 },
  "high-energy":          { manic: 2, depressive: 0 },
  "selective-energy":     { manic: 0, depressive: 1 },
  "psychosomatic":        { manic: 0, depressive: 1 },

  // MANIC (core symptoms weighted 2, supporting 1)
  "pressured-speech":     { manic: 2, depressive: 0 },
  "racing-thoughts":      { manic: 2, depressive: 0 },
  "euphoria":             { manic: 2, depressive: 0 },
  "grandiose":            { manic: 2, depressive: 0 },
  "nonstop-activity":     { manic: 2, depressive: 0 },
  "restless-agitation":   { manic: 1, depressive: 0 },
  "disproportionate-rage":{ manic: 1, depressive: 0 },
  "reckless-choices":     { manic: 2, depressive: 0 },
  "bizarre-behavior":     { manic: 2, depressive: 0 },
  "denies-anything-wrong":{ manic: 1, depressive: 0 },

  // DEPRESSIVE (core symptoms weighted 2, supporting 1)
  "sad-empty-hopeless":   { manic: 0, depressive: 2 },
  "lost-interest":        { manic: 0, depressive: 2 },
  "eating-more":          { manic: 0, depressive: 1 },
  "eating-less":          { manic: 0, depressive: 1 },
  "withdrawn":            { manic: 0, depressive: 2 },
  "worthless-guilt":      { manic: 0, depressive: 2 },
  "cant-focus":           { manic: 0, depressive: 1 },
  "mentioned-death":      { manic: 0, depressive: 3 }, // highest weight — safety signal

  // MIXED / CYCLING (contribute to both)
  "mood-swings":          { manic: 1, depressive: 1 },
  "agitated-depressed":   { manic: 1, depressive: 2 },
  "unprovoked-temper":    { manic: 1, depressive: 1 },
  "unusual-anxiety":      { manic: 0, depressive: 1 },
  "aggressive-destructive":{ manic: 1, depressive: 1 },
};

export type DayClassification = "MANIC" | "DEPRESSIVE" | "MIXED" | "NEUTRAL";

export interface DailyScore {
  manicScore: number;
  depressiveScore: number;
  classification: DayClassification;
  severity: "NONE" | "MILD" | "MODERATE" | "SEVERE";
  /** Net score for wave graph: positive = manic, negative = depressive */
  waveScore: number;
  safetyConcern: boolean;
}

export interface DailyScoringInput {
  behaviorKeys: string[];
  mood: string;
  dayQuality: string;
  impairments: { domain: string; severity: string }[];
}

export function scoreDailyEntry(input: DailyScoringInput): DailyScore {
  let manicScore = 0;
  let depressiveScore = 0;
  let safetyConcern = false;

  // Score behaviors
  for (const key of input.behaviorKeys) {
    const weight = BEHAVIOR_WEIGHTS[key];
    if (weight) {
      manicScore += weight.manic;
      depressiveScore += weight.depressive;
    }
    if (key === "mentioned-death") {
      safetyConcern = true;
    }
  }

  // Mood descriptor adds base context
  if (input.mood === "MANIC") manicScore += 2;
  if (input.mood === "DEPRESSIVE") depressiveScore += 2;
  if (input.mood === "MIXED") {
    manicScore += 1;
    depressiveScore += 1;
  }

  // Day quality adds mild signal
  if (input.dayQuality === "BAD") {
    depressiveScore += 1;
  }

  // Impairment amplifier: severe impairments indicate higher episode severity
  const severeCount = input.impairments.filter((i) => i.severity === "SEVERE").length;
  const presentCount = input.impairments.filter((i) => i.severity === "PRESENT").length;
  const impairmentBoost = severeCount * 1.5 + presentCount * 0.5;

  // Safety concern from impairment domain
  if (input.impairments.some((i) => i.domain === "SAFETY_CONCERN" && i.severity !== "NONE")) {
    safetyConcern = true;
  }

  // Apply impairment boost to the dominant score
  if (manicScore >= depressiveScore && manicScore > 0) {
    manicScore += impairmentBoost;
  }
  if (depressiveScore >= manicScore && depressiveScore > 0) {
    depressiveScore += impairmentBoost;
  }

  // Classify
  const totalScore = manicScore + depressiveScore;
  let classification: DayClassification;

  if (totalScore < 3) {
    classification = "NEUTRAL";
  } else if (manicScore >= 3 && depressiveScore >= 3) {
    classification = "MIXED";
  } else if (manicScore > depressiveScore) {
    classification = "MANIC";
  } else if (depressiveScore > manicScore) {
    classification = "DEPRESSIVE";
  } else {
    classification = "MIXED";
  }

  // Severity based on the dominant score
  const dominantScore = Math.max(manicScore, depressiveScore);
  let severity: DailyScore["severity"];
  if (dominantScore < 3) {
    severity = "NONE";
  } else if (dominantScore < 6) {
    severity = "MILD";
  } else if (dominantScore < 10) {
    severity = "MODERATE";
  } else {
    severity = "SEVERE";
  }

  // Wave score: positive = manic, negative = depressive
  const waveScore = manicScore - depressiveScore;

  return {
    manicScore: Math.round(manicScore * 10) / 10,
    depressiveScore: Math.round(depressiveScore * 10) / 10,
    classification,
    severity,
    waveScore: Math.round(waveScore * 10) / 10,
    safetyConcern,
  };
}
