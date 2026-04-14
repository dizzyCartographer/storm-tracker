import { type DailyScore, type DayClassification } from "./daily-score";
import { type DayWithScore } from "./episode-detection";

/**
 * Pattern Prediction Engine
 *
 * Analyzes historical mood data to predict upcoming mood states:
 * 1. Cycle length estimation — average days between manic/depressive shifts
 * 2. Trend detection — is the current trajectory escalating or resolving?
 * 3. Day-of-week patterns — certain days consistently worse?
 * 4. Predicted next state — what's likely coming based on recent trajectory
 */

export interface Prediction {
  id: string;
  type: "CYCLE" | "TREND" | "DAY_PATTERN" | "FORECAST";
  title: string;
  description: string;
  confidence: "LOW" | "MEDIUM" | "HIGH";
}

export function generatePredictions(days: DayWithScore[]): Prediction[] {
  if (days.length < 7) return [];

  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const predictions: Prediction[] = [];

  // 1. Cycle length estimation
  const cyclePrediction = estimateCycleLength(sorted);
  if (cyclePrediction) predictions.push(cyclePrediction);

  // 2. Trend detection — escalating or resolving?
  const trendPrediction = detectTrend(sorted);
  if (trendPrediction) predictions.push(trendPrediction);

  // 3. Day-of-week patterns
  const dayPatterns = detectDayPatterns(sorted);
  predictions.push(...dayPatterns);

  // 4. Forecast next likely state
  const forecast = forecastNextState(sorted);
  if (forecast) predictions.push(forecast);

  return predictions;
}

/**
 * Estimate the average cycle length between manic and depressive phases.
 * A "cycle" is defined as the gap between consecutive runs of the same classification.
 */
function estimateCycleLength(days: DayWithScore[]): Prediction | null {
  const transitions: { date: string; from: DayClassification; to: DayClassification }[] = [];

  for (let i = 1; i < days.length; i++) {
    const prev = days[i - 1].score.classification;
    const curr = days[i].score.classification;
    if (prev !== curr && prev !== "NEUTRAL" && curr !== "NEUTRAL") {
      transitions.push({ date: days[i].date, from: prev, to: curr });
    }
  }

  if (transitions.length < 2) return null;

  // Calculate average days between transitions
  const gaps: number[] = [];
  for (let i = 1; i < transitions.length; i++) {
    const d1 = new Date(transitions[i - 1].date);
    const d2 = new Date(transitions[i].date);
    gaps.push((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  }

  const avgGap = gaps.reduce((s, g) => s + g, 0) / gaps.length;
  if (avgGap < 1 || avgGap > 90) return null;

  const lastTransition = transitions[transitions.length - 1];
  const daysSinceLast = Math.round(
    (Date.now() - new Date(lastTransition.date).getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysUntilNext = Math.max(0, Math.round(avgGap - daysSinceLast));

  return {
    id: "cycle-length",
    type: "CYCLE",
    title: `Average cycle: ~${Math.round(avgGap)} days between mood shifts`,
    description:
      daysUntilNext > 0
        ? `Based on ${transitions.length} observed transitions, a mood shift may occur in roughly ${daysUntilNext} days. Continue monitoring closely.`
        : `The current phase has lasted longer than the average cycle (${daysSinceLast} days vs ~${Math.round(avgGap)} day average). A transition may be imminent.`,
    confidence: transitions.length >= 4 ? "MEDIUM" : "LOW",
  };
}

/**
 * Detect whether the current trajectory is escalating or resolving.
 * Compares the last 3 days to the preceding 4 days.
 */
function detectTrend(days: DayWithScore[]): Prediction | null {
  if (days.length < 7) return null;

  const recent3 = days.slice(-3);
  const prior4 = days.slice(-7, -3);

  const recentAvgManic =
    recent3.reduce((s, d) => s + d.score.manicCriteriaCount, 0) / recent3.length;
  const priorAvgManic =
    prior4.reduce((s, d) => s + d.score.manicCriteriaCount, 0) / prior4.length;

  const recentAvgDep =
    recent3.reduce((s, d) => s + d.score.depressiveCriteriaCount, 0) / recent3.length;
  const priorAvgDep =
    prior4.reduce((s, d) => s + d.score.depressiveCriteriaCount, 0) / prior4.length;

  // Escalating manic
  if (recentAvgManic >= 2 && recentAvgManic > priorAvgManic * 1.5) {
    return {
      id: "trend-manic-escalating",
      type: "TREND",
      title: "Manic symptoms escalating",
      description: `Manic criteria averaging ${recentAvgManic.toFixed(1)}/day over the last 3 days, up from ${priorAvgManic.toFixed(1)}/day prior. This upward trend suggests the current episode may intensify.`,
      confidence: recentAvgManic >= 3 ? "HIGH" : "MEDIUM",
    };
  }

  // Escalating depressive
  if (recentAvgDep >= 2 && recentAvgDep > priorAvgDep * 1.5) {
    return {
      id: "trend-depressive-escalating",
      type: "TREND",
      title: "Depressive symptoms escalating",
      description: `Depressive criteria averaging ${recentAvgDep.toFixed(1)}/day over the last 3 days, up from ${priorAvgDep.toFixed(1)}/day prior. Monitor closely for withdrawal and safety concerns.`,
      confidence: recentAvgDep >= 4 ? "HIGH" : "MEDIUM",
    };
  }

  // Resolving
  if (
    priorAvgManic >= 2 &&
    recentAvgManic < priorAvgManic * 0.5 &&
    recentAvgDep < 2
  ) {
    return {
      id: "trend-resolving",
      type: "TREND",
      title: "Symptoms appear to be resolving",
      description: `Manic criteria dropped from ${priorAvgManic.toFixed(1)} to ${recentAvgManic.toFixed(1)}/day. The current episode may be subsiding — continue monitoring for a potential depressive swing.`,
      confidence: "MEDIUM",
    };
  }

  if (
    priorAvgDep >= 2 &&
    recentAvgDep < priorAvgDep * 0.5 &&
    recentAvgManic < 2
  ) {
    return {
      id: "trend-dep-resolving",
      type: "TREND",
      title: "Depressive symptoms easing",
      description: `Depressive criteria dropped from ${priorAvgDep.toFixed(1)} to ${recentAvgDep.toFixed(1)}/day. Watch for a potential rebound into elevated mood.`,
      confidence: "MEDIUM",
    };
  }

  return null;
}

/**
 * Detect day-of-week patterns — are certain days consistently worse?
 */
function detectDayPatterns(days: DayWithScore[]): Prediction[] {
  if (days.length < 14) return [];

  const dayTotals: Record<number, { sum: number; count: number }> = {};
  for (let i = 0; i < 7; i++) dayTotals[i] = { sum: 0, count: 0 };

  for (const day of days) {
    const dow = new Date(day.date + "T00:00:00Z").getUTCDay();
    const total = day.score.manicCriteriaCount + day.score.depressiveCriteriaCount;
    dayTotals[dow].sum += total;
    dayTotals[dow].count++;
  }

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const overallAvg =
    days.reduce((s, d) => s + d.score.manicCriteriaCount + d.score.depressiveCriteriaCount, 0) /
    days.length;

  const predictions: Prediction[] = [];

  for (let i = 0; i < 7; i++) {
    const { sum, count } = dayTotals[i];
    if (count < 2) continue;
    const avg = sum / count;
    if (avg >= overallAvg * 2 && avg >= 3) {
      predictions.push({
        id: `day-pattern-${i}`,
        type: "DAY_PATTERN",
        title: `${dayNames[i]}s tend to be harder`,
        description: `${dayNames[i]}s average ${avg.toFixed(1)} total criteria vs ${overallAvg.toFixed(1)} overall. Consider proactive support on ${dayNames[i]}s.`,
        confidence: count >= 3 ? "MEDIUM" : "LOW",
      });
    }
  }

  return predictions;
}

/**
 * Forecast the most likely mood state for the coming days
 * based on the trajectory of the last 5 days.
 */
function forecastNextState(days: DayWithScore[]): Prediction | null {
  if (days.length < 5) return null;

  const recent5 = days.slice(-5);
  const classifications = recent5.map((d) => d.score.classification);

  // Count classifications
  const counts: Record<string, number> = {};
  for (const c of classifications) {
    counts[c] = (counts[c] || 0) + 1;
  }

  // Find dominant classification
  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (!dominant || dominant[0] === "NEUTRAL") return null;

  const dominantClass = dominant[0] as DayClassification;
  const dominantCount = dominant[1];

  // Check if the trend is consistent (3+ of last 5 same classification)
  if (dominantCount < 3) return null;

  // Check trajectory (is it getting more or less severe?)
  const recentSeverities = recent5.map((d) => {
    const total = d.score.manicCriteriaCount + d.score.depressiveCriteriaCount;
    return total;
  });
  const firstHalf = recentSeverities.slice(0, 2).reduce((s, v) => s + v, 0) / 2;
  const secondHalf = recentSeverities.slice(3).reduce((s, v) => s + v, 0) / 2;
  const trajectory = secondHalf > firstHalf ? "intensifying" : secondHalf < firstHalf ? "stabilizing" : "steady";

  const classLabel: Record<string, string> = {
    MANIC: "manic",
    DEPRESSIVE: "depressive",
    MIXED: "mixed",
  };

  return {
    id: "forecast",
    type: "FORECAST",
    title: `Likely continued ${classLabel[dominantClass] || dominantClass.toLowerCase()} pattern`,
    description: `${dominantCount} of the last 5 days were classified as ${classLabel[dominantClass] || dominantClass.toLowerCase()}, and the pattern appears to be ${trajectory}. ${
      trajectory === "intensifying"
        ? "Extra vigilance is recommended."
        : trajectory === "stabilizing"
          ? "Symptoms may be easing, but continue monitoring."
          : "Maintain current monitoring level."
    }`,
    confidence: dominantCount >= 4 ? "HIGH" : "MEDIUM",
  };
}
