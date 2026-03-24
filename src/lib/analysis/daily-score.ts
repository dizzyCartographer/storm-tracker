/**
 * Daily Classification Engine — DSM-5 Based
 *
 * Maps tracked behaviors to DSM-5 diagnostic criteria for manic and
 * depressive episodes, then classifies each day.
 *
 * DSM-5 Manic Episode Criterion B — 3+ of these (4 if mood is only irritable):
 *   1. Inflated self-esteem / grandiosity
 *   2. Decreased need for sleep
 *   3. More talkative / pressure of speech
 *   4. Flight of ideas / racing thoughts
 *   5. Distractibility
 *   6. Increase in goal-directed activity / psychomotor agitation
 *   7. Excessive involvement in risky activities
 *
 * DSM-5 Major Depressive Episode — 5+ of 9 during same period
 *   (at least one must be #1 or #2):
 *   1. Depressed mood most of the day
 *   2. Markedly diminished interest / pleasure
 *   3. Significant weight/appetite change
 *   4. Insomnia or hypersomnia
 *   5. Psychomotor agitation or retardation
 *   6. Fatigue / loss of energy
 *   7. Feelings of worthlessness / excessive guilt
 *   8. Diminished ability to think / concentrate
 *   9. Recurrent thoughts of death / suicidal ideation
 *
 * DSM-5 Mixed Features Specifier:
 *   Manic/hypomanic episode + 3+ depressive symptoms, or
 *   Depressive episode + 3+ manic symptoms
 */

// Map each behavior item to the DSM-5 criterion it satisfies.
// A behavior can satisfy exactly one manic and/or one depressive criterion.
const DSM5_MAPPING: Record<string, { manicCriterion?: number; depressiveCriterion?: number }> = {
  // SLEEP
  "very-little-sleep":    { manicCriterion: 2 },                // Decreased need for sleep
  "slept-too-much":       { depressiveCriterion: 4 },           // Hypersomnia
  "irregular-sleep":      { manicCriterion: 2, depressiveCriterion: 4 }, // Sleep disruption (either pole)

  // ENERGY
  "no-energy":            { depressiveCriterion: 6 },           // Fatigue / loss of energy
  "high-energy":          { manicCriterion: 6 },                // Increase in goal-directed activity
  "selective-energy":     { depressiveCriterion: 6 },           // Fatigue (variant)
  "psychosomatic":        { depressiveCriterion: 5 },           // Psychomotor (somatic expression)

  // MANIC
  "pressured-speech":     { manicCriterion: 3 },                // Pressure of speech
  "racing-thoughts":      { manicCriterion: 4 },                // Flight of ideas / racing thoughts
  "euphoria":             {},                                    // Criterion A (mood) — counted separately
  "grandiose":            { manicCriterion: 1 },                // Inflated self-esteem / grandiosity
  "nonstop-activity":     { manicCriterion: 6 },                // Increase in goal-directed activity
  "restless-agitation":   { manicCriterion: 6 },                // Psychomotor agitation
  "disproportionate-rage":{},                                    // Criterion A (irritable mood) — counted separately
  "reckless-choices":     { manicCriterion: 7 },                // Excessive involvement in risky activities
  "bizarre-behavior":     { manicCriterion: 7 },                // Risky / out-of-character (variant)
  "denies-anything-wrong":{},                                    // Insight deficit — not a B criterion but clinically relevant

  // DEPRESSIVE
  "sad-empty-hopeless":   { depressiveCriterion: 1 },           // Depressed mood
  "lost-interest":        { depressiveCriterion: 2 },           // Diminished interest / pleasure
  "eating-more":          { depressiveCriterion: 3 },           // Appetite/weight change
  "eating-less":          { depressiveCriterion: 3 },           // Appetite/weight change
  "withdrawn":            { depressiveCriterion: 2 },           // Diminished interest (social variant)
  "worthless-guilt":      { depressiveCriterion: 7 },           // Worthlessness / excessive guilt
  "cant-focus":           { manicCriterion: 5, depressiveCriterion: 8 }, // Distractibility (manic) / can't concentrate (depressive)
  "mentioned-death":      { depressiveCriterion: 9 },           // Thoughts of death / suicidal ideation

  // MIXED / CYCLING
  "mood-swings":          {},                                    // Not a single criterion — signals mixed features
  "agitated-depressed":   { manicCriterion: 6, depressiveCriterion: 1 }, // Agitation (manic) + depressed mood
  "unprovoked-temper":    {},                                    // Irritable mood — Criterion A for mania
  "unusual-anxiety":      {},                                    // Comorbid feature, not a DSM criterion per se
  "aggressive-destructive":{ manicCriterion: 7 },               // Risky/destructive behavior
};

export type DayClassification = "MANIC" | "DEPRESSIVE" | "MIXED" | "NEUTRAL";

export interface DailyScore {
  /** Count of distinct DSM-5 manic B criteria met */
  manicCriteriaCount: number;
  /** Count of distinct DSM-5 depressive criteria met */
  depressiveCriteriaCount: number;
  /** Whether Criterion A for mania is met (elevated/expansive/irritable mood) */
  manicMoodPresent: boolean;
  /** Whether core depressive criterion met (depressed mood OR loss of interest) */
  depressiveCoreMet: boolean;
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
  // Track which DSM criteria are satisfied (using Sets to avoid double-counting)
  const manicCriteria = new Set<number>();
  const depressiveCriteria = new Set<number>();
  let safetyConcern = false;

  for (const key of input.behaviorKeys) {
    const mapping = DSM5_MAPPING[key];
    if (!mapping) continue;
    if (mapping.manicCriterion) manicCriteria.add(mapping.manicCriterion);
    if (mapping.depressiveCriterion) depressiveCriteria.add(mapping.depressiveCriterion);
    if (key === "mentioned-death") safetyConcern = true;
  }

  // Criterion A for mania: elevated, expansive, or irritable mood
  const manicMoodBehaviors = ["euphoria", "disproportionate-rage", "unprovoked-temper"];
  const manicMoodPresent =
    input.mood === "MANIC" ||
    input.mood === "MIXED" ||
    input.behaviorKeys.some((k) => manicMoodBehaviors.includes(k));

  // Core depressive criteria: depressed mood (#1) or loss of interest (#2)
  const depressiveCoreMet =
    depressiveCriteria.has(1) || depressiveCriteria.has(2);

  // Mood descriptor can add criteria
  if (input.mood === "MANIC" || input.mood === "MIXED") {
    // Elevated mood itself doesn't add a B criterion, but confirms Criterion A
  }
  if (input.mood === "DEPRESSIVE" || input.mood === "MIXED") {
    depressiveCriteria.add(1); // Depressed mood
  }

  const manicCriteriaCount = manicCriteria.size;
  const depressiveCriteriaCount = depressiveCriteria.size;

  // Safety concern from impairment domain
  if (input.impairments.some((i) => i.domain === "SAFETY_CONCERN" && i.severity !== "NONE")) {
    safetyConcern = true;
  }

  // Classification based on DSM-5 thresholds
  // Manic: Criterion A + 3+ B criteria (4 if only irritable)
  const manicThreshold = manicMoodPresent ? 3 : 4;
  const meetsManic = manicMoodPresent && manicCriteriaCount >= manicThreshold;

  // Depressive: 5+ criteria with at least one core criterion
  const meetsDepressive = depressiveCoreMet && depressiveCriteriaCount >= 5;

  // Mixed features specifier: primary episode + 3+ symptoms from opposite pole
  const meetsMixed =
    (meetsManic && depressiveCriteriaCount >= 3) ||
    (meetsDepressive && manicCriteriaCount >= 3);

  // Subthreshold classifications for prodromal tracking
  const subthresholdManic = manicMoodPresent && manicCriteriaCount >= 2;
  const subthresholdDepressive = depressiveCoreMet && depressiveCriteriaCount >= 3;

  let classification: DayClassification;
  if (meetsMixed) {
    classification = "MIXED";
  } else if (meetsManic) {
    classification = "MANIC";
  } else if (meetsDepressive) {
    classification = "DEPRESSIVE";
  } else if (subthresholdManic && subthresholdDepressive) {
    classification = "MIXED";
  } else if (subthresholdManic) {
    classification = "MANIC";
  } else if (subthresholdDepressive) {
    classification = "DEPRESSIVE";
  } else {
    classification = "NEUTRAL";
  }

  // Severity based on criteria count + impairment
  const severeImpairments = input.impairments.filter((i) => i.severity === "SEVERE").length;
  const presentImpairments = input.impairments.filter((i) => i.severity === "PRESENT").length;
  const maxCriteria = Math.max(manicCriteriaCount, depressiveCriteriaCount);

  let severity: DailyScore["severity"];
  if (classification === "NEUTRAL") {
    severity = "NONE";
  } else if (meetsManic || meetsDepressive) {
    // Full DSM threshold met
    severity = severeImpairments >= 2 ? "SEVERE" : "MODERATE";
  } else {
    // Subthreshold
    severity = severeImpairments >= 1 || maxCriteria >= 3 ? "MODERATE" : "MILD";
  }

  // Wave score for graphing: manic criteria positive, depressive negative
  const waveScore = manicCriteriaCount - depressiveCriteriaCount;

  return {
    manicCriteriaCount,
    depressiveCriteriaCount,
    manicMoodPresent,
    depressiveCoreMet,
    classification,
    severity,
    waveScore,
    safetyConcern,
  };
}
