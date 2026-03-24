/**
 * Episode Detection — Framework-Driven
 *
 * Uses episode thresholds from the loaded diagnostic framework
 * instead of hardcoded DSM-5 duration constants.
 *
 * For bipolar:
 *   - Manic episode:     ≥7 days + DSM-5 symptom threshold
 *   - Hypomanic episode: ≥4 days + symptoms
 *   - Depressive episode: ≥14 days + core criterion
 *   - Prodromal concerns at lower thresholds
 */

import { type DailyScore } from "./daily-score";
import { type LoadedFramework, type LoadedEpisodeThreshold } from "./framework-loader";

export type EpisodeType = "MANIC" | "HYPOMANIC" | "DEPRESSIVE" | "MIXED" | string;
export type EpisodeConfidence = "DSM5_MET" | "PRODROMAL_CONCERN" | string;

export interface Episode {
  type: EpisodeType;
  confidence: EpisodeConfidence;
  startDate: string;
  endDate: string;
  dayCount: number;
  peakSeverity: DailyScore["severity"];
  averageWaveScore: number;
  hasSafetyConcern: boolean;
  criteriaNote: string;
}

export interface DayWithScore {
  date: string;
  score: DailyScore;
}

export function detectEpisodes(days: DayWithScore[], framework?: LoadedFramework): Episode[] {
  if (days.length === 0) return [];
  if (!framework) return [];

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

      // Allow 1-day gap for missed logging
      const currentDate = new Date(sorted[runEnd].date);
      const nextDate = new Date(sorted[runEnd + 1].date);
      const dayGap = (nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);
      if (dayGap > 2) break;

      runEnd++;
    }

    const runDays = sorted.slice(runStart, runEnd + 1);
    const dayCount = runDays.length;

    if (dayCount < 2) {
      runStart = runEnd + 1;
      continue;
    }

    // Count days per pole classification
    const poleDayCounts: Record<string, number> = {};
    for (const pole of framework.poles) {
      poleDayCounts[pole.slug] = 0;
    }
    for (const day of runDays) {
      const cls = day.score.classification;
      // "MIXED" counts toward both poles
      if (cls === "MIXED") {
        for (const pole of framework.poles) poleDayCounts[pole.slug]++;
      } else {
        // Find which pole this classification belongs to
        for (const rule of framework.classificationRules) {
          if (rule.classificationLabel === cls) {
            poleDayCounts[rule.poleSlug]++;
            break;
          }
        }
      }
    }

    // Check if any day meets DSM-5 symptom thresholds per pole
    const anyDayMeetsDsm: Record<string, boolean> = {};
    for (const pole of framework.poles) {
      anyDayMeetsDsm[pole.slug] = runDays.some((d) => {
        const count = d.score.criteriaCounts[pole.slug] ?? 0;
        const gate = d.score.gateMet[pole.slug] ?? false;
        const core = d.score.coreMet[pole.slug] ?? false;
        // Find the DSM5_FULL rule for this pole
        const fullRule = framework.classificationRules.find(
          (r) => r.poleSlug === pole.slug && r.ruleType === "DSM5_FULL" && !r.mixedLabel
        );
        if (!fullRule) return count >= 3;
        if (fullRule.gateRequired && !gate) return false;
        if (fullRule.coreRequired && !core) return false;
        return count >= fullRule.minStandardCriteria;
      });
    }

    const peakSeverity = getHighestSeverity(runDays.map((d) => d.score.severity));
    const avgWave = runDays.reduce((sum, d) => sum + d.score.waveScore, 0) / runDays.length;
    const hasSafety = runDays.some((d) => d.score.safetyConcern);

    // Evaluate against episode thresholds (sorted: DSM5_MET first, then PRODROMAL)
    const sortedThresholds = [...framework.episodeThresholds].sort((a, b) => {
      // DSM5_MET before PRODROMAL_CONCERN
      if (a.confidenceLevel !== b.confidenceLevel) {
        return a.confidenceLevel === "DSM5_MET" ? -1 : 1;
      }
      // Higher minDays first (more specific)
      return b.minDays - a.minDays;
    });

    // Track matched episodes per pole
    const poleMatches: Record<string, { threshold: LoadedEpisodeThreshold } | null> = {};
    for (const pole of framework.poles) {
      poleMatches[pole.slug] = null;
    }

    for (const threshold of sortedThresholds) {
      const poleCount = poleDayCounts[threshold.poleSlug] ?? 0;
      if (poleCount < threshold.minDays) continue;
      if (threshold.requiresDsmSymptoms && !anyDayMeetsDsm[threshold.poleSlug]) continue;

      // Take the first (best) match per pole
      if (!poleMatches[threshold.poleSlug]) {
        poleMatches[threshold.poleSlug] = { threshold };
      }
    }

    // Build episode from pole matches
    const matchedPoles = Object.entries(poleMatches).filter(([, v]) => v !== null);

    if (matchedPoles.length >= 2) {
      // Mixed episode
      const bestConfidence = matchedPoles.some(([, v]) => v!.threshold.confidenceLevel === "DSM5_MET")
        ? "DSM5_MET" : "PRODROMAL_CONCERN";
      const notes = matchedPoles.map(([slug, v]) => {
        const pole = framework.poles.find((p) => p.slug === slug);
        return `${pole?.name ?? slug}: ${poleDayCounts[slug]} days (${v!.threshold.confidenceLevel === "DSM5_MET" ? "DSM-5 met" : "prodromal"})`;
      });
      episodes.push({
        type: "MIXED",
        confidence: bestConfidence,
        startDate: runDays[0].date,
        endDate: runDays[runDays.length - 1].date,
        dayCount,
        peakSeverity,
        averageWaveScore: Math.round(avgWave * 10) / 10,
        hasSafetyConcern: hasSafety,
        criteriaNote: `Mixed: ${notes.join("; ")}`,
      });
    } else if (matchedPoles.length === 1) {
      const [, match] = matchedPoles[0];
      const t = match!.threshold;
      const poleCount = poleDayCounts[t.poleSlug];
      const pole = framework.poles.find((p) => p.slug === t.poleSlug);
      const noteParts: string[] = [];
      if (t.confidenceLevel === "DSM5_MET") {
        noteParts.push(`${poleCount} days of ${pole?.name ?? t.poleSlug} symptoms meeting DSM-5 criteria (≥${t.minDays} days required)`);
      } else {
        noteParts.push(`${poleCount} days of ${pole?.name ?? t.poleSlug} symptoms (prodromal concern, DSM-5 requires ≥${t.minDays}+ for full criteria)`);
      }
      episodes.push({
        type: t.episodeLabel,
        confidence: t.confidenceLevel,
        startDate: runDays[0].date,
        endDate: runDays[runDays.length - 1].date,
        dayCount,
        peakSeverity,
        averageWaveScore: Math.round(avgWave * 10) / 10,
        hasSafetyConcern: hasSafety,
        criteriaNote: noteParts.join("; "),
      });
    }

    runStart = runEnd + 1;
  }

  return episodes;
}

const SEVERITY_ORDER: DailyScore["severity"][] = ["NONE", "MILD", "MODERATE", "SEVERE"];

function getHighestSeverity(severities: DailyScore["severity"][]): DailyScore["severity"] {
  let highest = 0;
  for (const s of severities) {
    const idx = SEVERITY_ORDER.indexOf(s);
    if (idx > highest) highest = idx;
  }
  return SEVERITY_ORDER[highest];
}
