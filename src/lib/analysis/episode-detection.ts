import { type DailyScore, type DayClassification } from "./daily-score";

/**
 * Episode Detection
 *
 * Evaluates runs of classified days against clinical criteria:
 * - Manic episode: ≥4 consecutive days with MANIC or MIXED classification
 *   (DSM requires 7 days for full mania, but 4 flags concern in a prodromal context)
 * - Hypomanic episode: 2-3 consecutive days of MANIC classification
 * - Depressive episode: ≥5 consecutive days with DEPRESSIVE or MIXED classification
 *   (DSM requires 14 days, but 5 flags concern in prodromal tracking)
 *
 * These thresholds are deliberately lower than DSM criteria because
 * we're tracking a prodrome, not diagnosing. The goal is early detection.
 */

export type EpisodeType = "MANIC" | "HYPOMANIC" | "DEPRESSIVE" | "MIXED";

export interface Episode {
  type: EpisodeType;
  startDate: string;
  endDate: string;
  dayCount: number;
  peakSeverity: DailyScore["severity"];
  averageWaveScore: number;
  hasSafetyConcern: boolean;
}

export interface DayWithScore {
  date: string;
  score: DailyScore;
}

export function detectEpisodes(days: DayWithScore[]): Episode[] {
  if (days.length === 0) return [];

  // Sort by date ascending
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const episodes: Episode[] = [];

  let runStart = 0;

  while (runStart < sorted.length) {
    const startClass = sorted[runStart].score.classification;

    if (startClass === "NEUTRAL") {
      runStart++;
      continue;
    }

    // Find the end of this run of non-neutral days with compatible classification
    let runEnd = runStart;
    const isManicRun = startClass === "MANIC" || startClass === "MIXED";
    const isDepressiveRun = startClass === "DEPRESSIVE" || startClass === "MIXED";

    while (runEnd + 1 < sorted.length) {
      const nextClass = sorted[runEnd + 1].score.classification;
      if (nextClass === "NEUTRAL") break;

      // Check date continuity (allow 1 day gap for missed logging)
      const currentDate = new Date(sorted[runEnd].date);
      const nextDate = new Date(sorted[runEnd + 1].date);
      const dayGap = (nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);
      if (dayGap > 2) break;

      // Check compatible classification
      const nextIsManic = nextClass === "MANIC" || nextClass === "MIXED";
      const nextIsDepressive = nextClass === "DEPRESSIVE" || nextClass === "MIXED";

      if (isManicRun && !nextIsManic && !nextIsDepressive) break;
      if (isDepressiveRun && !nextIsDepressive && !nextIsManic) break;

      runEnd++;
    }

    const runDays = sorted.slice(runStart, runEnd + 1);
    const dayCount = runDays.length;

    // Categorize the run
    const manicDays = runDays.filter(
      (d) => d.score.classification === "MANIC" || d.score.classification === "MIXED"
    ).length;
    const depressiveDays = runDays.filter(
      (d) => d.score.classification === "DEPRESSIVE" || d.score.classification === "MIXED"
    ).length;

    const peakSeverity = getHighestSeverity(runDays.map((d) => d.score.severity));
    const avgWave =
      runDays.reduce((sum, d) => sum + d.score.waveScore, 0) / runDays.length;
    const hasSafety = runDays.some((d) => d.score.safetyConcern);

    let episodeType: EpisodeType | null = null;

    if (manicDays >= 4) {
      episodeType = "MANIC";
    } else if (manicDays >= 2) {
      episodeType = "HYPOMANIC";
    }

    if (depressiveDays >= 5) {
      // If already flagged as manic, it's mixed
      episodeType = episodeType ? "MIXED" : "DEPRESSIVE";
    }

    if (episodeType && dayCount >= 2) {
      episodes.push({
        type: episodeType,
        startDate: runDays[0].date,
        endDate: runDays[runDays.length - 1].date,
        dayCount,
        peakSeverity,
        averageWaveScore: Math.round(avgWave * 10) / 10,
        hasSafetyConcern: hasSafety,
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
