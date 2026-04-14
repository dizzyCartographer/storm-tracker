/**
 * Prodrome Signal Detection — Framework-Driven
 *
 * Flags early warning signs based on signal rules defined in the
 * diagnostic framework. Each signal rule specifies:
 *   - Which behaviors to watch
 *   - Time window and minimum occurrences
 *   - Whether to compare early vs late halves (trend detection)
 *
 * Also includes framework-independent signals:
 *   - Safety concern (any day with safety flag)
 *   - Mood instability (classification changes)
 *   - Withdrawal trend (increasing criteria on negative poles)
 */

import { type DailyScore } from "./daily-score";
import { type DayWithScore } from "./episode-detection";
import { type LoadedFramework, type LoadedSignalRule } from "./framework-loader";

export type SignalLevel = "INFO" | "WARNING" | "ALERT";

export interface ProdromeSignal {
  id: string;
  level: SignalLevel;
  title: string;
  description: string;
  relatedDates: string[];
}

export function detectProdromeSignals(
  days: DayWithScore[],
  behaviorsByDate: Map<string, string[]>,
  framework?: LoadedFramework
): ProdromeSignal[] {
  if (days.length < 3) return [];

  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const signals: ProdromeSignal[] = [];

  // Framework-driven signal rules
  if (framework) {
    for (const rule of framework.signalRules) {
      const signal = evaluateSignalRule(rule, sorted, behaviorsByDate);
      if (signal) signals.push(signal);
    }
  }

  // Framework-independent: withdrawal trend (negative-direction poles increasing)
  const last14 = sorted.slice(-14);
  if (framework && last14.length >= 6) {
    const firstHalf = last14.slice(0, Math.floor(last14.length / 2));
    const secondHalf = last14.slice(Math.floor(last14.length / 2));

    for (const pole of framework.poles) {
      if (pole.direction >= 0) continue; // Only check negative-direction poles (depressive)

      const firstAvg =
        firstHalf.reduce((s, d) => s + (d.score.criteriaCounts[pole.slug] ?? 0), 0) /
        (firstHalf.length || 1);
      const secondAvg =
        secondHalf.reduce((s, d) => s + (d.score.criteriaCounts[pole.slug] ?? 0), 0) /
        (secondHalf.length || 1);

      if (secondAvg >= 3 && secondAvg > firstAvg * 1.5) {
        signals.push({
          id: `withdrawal-trend-${pole.slug}`,
          level: "WARNING",
          title: `Increasing ${pole.name.toLowerCase()} symptoms`,
          description: `${pole.name} criteria trending up (avg ${firstAvg.toFixed(1)} → ${secondAvg.toFixed(1)} criteria/day). Watch for withdrawal and loss of interest.`,
          relatedDates: secondHalf.map((d) => d.date),
        });
      }
    }
  }

  // Framework-independent: safety concern
  const recentDays = sorted.slice(-7);
  const safetyDays = recentDays.filter((d) => d.score.safetyConcern);
  if (safetyDays.length > 0) {
    // Only add if not already covered by a framework signal rule
    if (!signals.some((s) => s.id === "safety-concern")) {
      signals.push({
        id: "safety-concern",
        level: "ALERT",
        title: "Safety concern detected",
        description: `References to death, self-harm, or safety concerns were logged on ${safetyDays.length} recent day(s). Please discuss with a clinician.`,
        relatedDates: safetyDays.map((d) => d.date),
      });
    }
  }

  // Framework-independent: mood instability (3+ classification changes in 7 days)
  let classChanges = 0;
  for (let i = 1; i < recentDays.length; i++) {
    if (
      recentDays[i].score.classification !== recentDays[i - 1].score.classification &&
      recentDays[i].score.classification !== "NEUTRAL" &&
      recentDays[i - 1].score.classification !== "NEUTRAL"
    ) {
      classChanges++;
    }
  }
  if (classChanges >= 3) {
    signals.push({
      id: "mood-instability",
      level: "WARNING",
      title: "Rapid mood cycling",
      description: `Mood classification changed ${classChanges} times in ${recentDays.length} days. Rapid cycling is a key prodromal indicator.`,
      relatedDates: recentDays.map((d) => d.date),
    });
  }

  // Sort: ALERT first, then WARNING, then INFO
  const levelOrder: Record<string, number> = { ALERT: 0, WARNING: 1, INFO: 2 };
  signals.sort((a, b) => (levelOrder[a.level] ?? 3) - (levelOrder[b.level] ?? 3));

  return signals;
}

function evaluateSignalRule(
  rule: LoadedSignalRule,
  sortedDays: DayWithScore[],
  behaviorsByDate: Map<string, string[]>
): ProdromeSignal | null {
  const window = sortedDays.slice(-rule.windowDays);
  if (window.length === 0) return null;

  if (rule.trendCompare) {
    // Trend detection: compare first half vs second half of window
    const extended = sortedDays.slice(-rule.windowDays * 2); // Use double window for comparison
    const firstHalf = extended.slice(0, Math.floor(extended.length / 2));
    const secondHalf = extended.slice(Math.floor(extended.length / 2));

    const countInSlice = (slice: DayWithScore[]) => {
      let count = 0;
      for (const day of slice) {
        const behaviors = behaviorsByDate.get(day.date) ?? [];
        if (behaviors.some((b) => rule.behaviorKeys.includes(b))) count++;
      }
      return count;
    };

    const earlyCount = countInSlice(firstHalf);
    const lateCount = countInSlice(secondHalf);

    if (lateCount >= rule.trendMinLate && lateCount > earlyCount) {
      const desc = rule.descriptionTemplate
        .replace(/\{count\}/g, String(lateCount))
        .replace(/\{window\}/g, String(extended.length));
      return {
        id: rule.signalId,
        level: rule.level as SignalLevel,
        title: rule.title,
        description: desc,
        relatedDates: secondHalf.map((d) => d.date),
      };
    }
  } else {
    // Simple occurrence count
    let count = 0;
    const relatedDates: string[] = [];
    for (const day of window) {
      const behaviors = behaviorsByDate.get(day.date) ?? [];
      if (behaviors.some((b) => rule.behaviorKeys.includes(b))) {
        count++;
        relatedDates.push(day.date);
      }
    }

    if (count >= rule.minOccurrences) {
      const desc = rule.descriptionTemplate
        .replace(/\{count\}/g, String(count))
        .replace(/\{window\}/g, String(window.length));
      return {
        id: rule.signalId,
        level: rule.level as SignalLevel,
        title: rule.title,
        description: desc,
        relatedDates,
      };
    }
  }

  return null;
}
