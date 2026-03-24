import { type DailyScore, type DayClassification } from "./daily-score";

/**
 * Episode Detection — DSM-5 Duration Criteria
 *
 * DSM-5 duration requirements:
 *   - Manic episode:     ≥7 consecutive days (Criterion A) or any duration if hospitalized
 *   - Hypomanic episode: ≥4 consecutive days (Criterion A)
 *   - Major Depressive:  ≥14 consecutive days (2 weeks, Criterion A)
 *
 * Since this app tracks a prodrome (pre-diagnosis), we report at two levels:
 *   1. "DSM-5 criteria met" — full duration + symptom threshold
 *   2. "Prodromal concern" — sub-threshold duration but pattern is emerging
 *
 * Prodromal thresholds (shorter, for early detection):
 *   - Manic concern:      ≥4 days (approaching hypomanic threshold)
 *   - Hypomanic concern:  ≥2 days
 *   - Depressive concern:  ≥7 days (half of DSM-5 threshold)
 */

export type EpisodeType = "MANIC" | "HYPOMANIC" | "DEPRESSIVE" | "MIXED";
export type EpisodeConfidence = "DSM5_MET" | "PRODROMAL_CONCERN";

export interface Episode {
  type: EpisodeType;
  confidence: EpisodeConfidence;
  startDate: string;
  endDate: string;
  dayCount: number;
  peakSeverity: DailyScore["severity"];
  averageWaveScore: number;
  hasSafetyConcern: boolean;
  /** Summary of which DSM-5 criteria were met */
  criteriaNote: string;
}

export interface DayWithScore {
  date: string;
  score: DailyScore;
}

export function detectEpisodes(days: DayWithScore[]): Episode[] {
  if (days.length === 0) return [];

  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const episodes: Episode[] = [];

  let runStart = 0;

  while (runStart < sorted.length) {
    const startClass = sorted[runStart].score.classification;

    if (startClass === "NEUTRAL") {
      runStart++;
      continue;
    }

    // Find the end of this run of non-neutral days
    let runEnd = runStart;

    while (runEnd + 1 < sorted.length) {
      const nextClass = sorted[runEnd + 1].score.classification;
      if (nextClass === "NEUTRAL") break;

      // Check date continuity (allow 1 day gap for missed logging)
      const currentDate = new Date(sorted[runEnd].date);
      const nextDate = new Date(sorted[runEnd + 1].date);
      const dayGap =
        (nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);
      if (dayGap > 2) break;

      runEnd++;
    }

    const runDays = sorted.slice(runStart, runEnd + 1);
    const dayCount = runDays.length;

    // Count day types
    const manicDays = runDays.filter(
      (d) => d.score.classification === "MANIC" || d.score.classification === "MIXED"
    ).length;
    const depressiveDays = runDays.filter(
      (d) => d.score.classification === "DEPRESSIVE" || d.score.classification === "MIXED"
    ).length;

    // Check if any day in the run fully meets DSM-5 symptom thresholds
    const anyDayMeetsDsmManic = runDays.some(
      (d) => d.score.manicMoodPresent && d.score.manicCriteriaCount >= 3
    );
    const anyDayMeetsDsmDepressive = runDays.some(
      (d) => d.score.depressiveCoreMet && d.score.depressiveCriteriaCount >= 5
    );

    const peakSeverity = getHighestSeverity(runDays.map((d) => d.score.severity));
    const avgWave =
      runDays.reduce((sum, d) => sum + d.score.waveScore, 0) / runDays.length;
    const hasSafety = runDays.some((d) => d.score.safetyConcern);

    // Evaluate against DSM-5 duration + symptom criteria
    let episodeType: EpisodeType | null = null;
    let confidence: EpisodeConfidence = "PRODROMAL_CONCERN";
    let criteriaNote = "";

    // Manic episode: DSM-5 = 7+ days with Criterion A + 3+ B criteria
    if (manicDays >= 7 && anyDayMeetsDsmManic) {
      episodeType = "MANIC";
      confidence = "DSM5_MET";
      criteriaNote = `${manicDays} days of manic symptoms meeting DSM-5 Criteria A+B (≥7 days required)`;
    }
    // Hypomanic episode: DSM-5 = 4+ days with Criterion A + 3+ B criteria
    else if (manicDays >= 4 && anyDayMeetsDsmManic) {
      episodeType = "HYPOMANIC";
      confidence = "DSM5_MET";
      criteriaNote = `${manicDays} days of hypomanic symptoms meeting DSM-5 Criteria A+B (≥4 days required)`;
    }
    // Prodromal manic concern: 4+ days subthreshold
    else if (manicDays >= 4) {
      episodeType = "MANIC";
      confidence = "PRODROMAL_CONCERN";
      criteriaNote = `${manicDays} days of manic-leaning symptoms (below DSM-5 symptom threshold but duration concerning)`;
    }
    // Prodromal hypomanic concern: 2+ days
    else if (manicDays >= 2) {
      episodeType = "HYPOMANIC";
      confidence = "PRODROMAL_CONCERN";
      criteriaNote = `${manicDays} days of elevated symptoms (below DSM-5 4-day threshold for hypomania)`;
    }

    // Depressive episode: DSM-5 = 14+ days with 5+ criteria including core
    if (depressiveDays >= 14 && anyDayMeetsDsmDepressive) {
      const prevType = episodeType;
      episodeType = prevType ? "MIXED" : "DEPRESSIVE";
      confidence = "DSM5_MET";
      criteriaNote = prevType
        ? `Mixed: ${criteriaNote}; plus ${depressiveDays} depressive days meeting DSM-5 criteria (≥14 days)`
        : `${depressiveDays} days of depressive symptoms meeting DSM-5 criteria (≥14 days required)`;
    }
    // Prodromal depressive concern: 7+ days
    else if (depressiveDays >= 7) {
      if (!episodeType) {
        episodeType = "DEPRESSIVE";
        confidence = "PRODROMAL_CONCERN";
        criteriaNote = `${depressiveDays} days of depressive symptoms (below DSM-5 14-day threshold but pattern is emerging)`;
      } else {
        episodeType = "MIXED";
        criteriaNote = `${criteriaNote}; plus ${depressiveDays} depressive days (prodromal concern)`;
      }
    }
    // Shorter depressive runs noted if significant
    else if (depressiveDays >= 5 && !episodeType) {
      episodeType = "DEPRESSIVE";
      confidence = "PRODROMAL_CONCERN";
      criteriaNote = `${depressiveDays} days of depressive symptoms (early pattern, DSM-5 requires ≥14 days)`;
    }

    if (episodeType && dayCount >= 2) {
      episodes.push({
        type: episodeType,
        confidence,
        startDate: runDays[0].date,
        endDate: runDays[runDays.length - 1].date,
        dayCount,
        peakSeverity,
        averageWaveScore: Math.round(avgWave * 10) / 10,
        hasSafetyConcern: hasSafety,
        criteriaNote,
      });
    }

    runStart = runEnd + 1;
  }

  return episodes;
}

const SEVERITY_ORDER: DailyScore["severity"][] = ["NONE", "MILD", "MODERATE", "SEVERE"];

function getHighestSeverity(
  severities: DailyScore["severity"][]
): DailyScore["severity"] {
  let highest = 0;
  for (const s of severities) {
    const idx = SEVERITY_ORDER.indexOf(s);
    if (idx > highest) highest = idx;
  }
  return SEVERITY_ORDER[highest];
}
