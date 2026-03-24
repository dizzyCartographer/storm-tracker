import { type DailyScore } from "./daily-score";
import { type DayWithScore } from "./episode-detection";

/**
 * Prodrome Signal Detection
 *
 * Flags early warning signs of bipolar development even when
 * full episode criteria aren't met. Based on research-identified
 * prodromal indicators:
 *
 * 1. Sleep disruption pattern — irregular sleep across multiple days
 * 2. Escalating irritability — rage/temper appearing with increasing frequency
 * 3. Energy volatility — alternating high/low energy days
 * 4. Social withdrawal trend — increasing depressive markers over time
 * 5. Safety concern — any mention of death/self-harm
 * 6. Mood instability — frequent classification changes
 */

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
  behaviorsByDate: Map<string, string[]>
): ProdromeSignal[] {
  if (days.length < 3) return [];

  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const signals: ProdromeSignal[] = [];

  // 1. Sleep disruption — 3+ sleep-related behaviors in 7 days
  const recentDays = sorted.slice(-7);
  const sleepBehaviors = ["very-little-sleep", "slept-too-much", "irregular-sleep"];
  let sleepIssues = 0;
  const sleepDates: string[] = [];
  for (const day of recentDays) {
    const behaviors = behaviorsByDate.get(day.date) ?? [];
    if (behaviors.some((b) => sleepBehaviors.includes(b))) {
      sleepIssues++;
      sleepDates.push(day.date);
    }
  }
  if (sleepIssues >= 3) {
    signals.push({
      id: "sleep-disruption",
      level: "WARNING",
      title: "Sleep disruption pattern",
      description: `Sleep issues logged ${sleepIssues} of the last ${recentDays.length} days. Persistent sleep changes are one of the earliest prodromal indicators.`,
      relatedDates: sleepDates,
    });
  }

  // 2. Escalating irritability — rage/temper behaviors increasing
  const irritabilityKeys = [
    "disproportionate-rage",
    "unprovoked-temper",
    "aggressive-destructive",
  ];
  const last14 = sorted.slice(-14);
  const firstHalf = last14.slice(0, Math.floor(last14.length / 2));
  const secondHalf = last14.slice(Math.floor(last14.length / 2));

  const countIrritability = (slice: DayWithScore[]) => {
    let count = 0;
    for (const day of slice) {
      const behaviors = behaviorsByDate.get(day.date) ?? [];
      if (behaviors.some((b) => irritabilityKeys.includes(b))) count++;
    }
    return count;
  };

  const earlyIrrit = countIrritability(firstHalf);
  const lateIrrit = countIrritability(secondHalf);
  if (lateIrrit >= 2 && lateIrrit > earlyIrrit) {
    signals.push({
      id: "escalating-irritability",
      level: "WARNING",
      title: "Escalating irritability",
      description: `Irritability and rage behaviors are increasing (${earlyIrrit} → ${lateIrrit} over the last ${last14.length} days). This pattern often precedes a manic or mixed episode.`,
      relatedDates: secondHalf.map((d) => d.date),
    });
  }

  // 3. Energy volatility — alternating high/low energy
  const energyPattern: ("high" | "low" | "none")[] = [];
  for (const day of recentDays) {
    const behaviors = behaviorsByDate.get(day.date) ?? [];
    if (behaviors.includes("high-energy")) energyPattern.push("high");
    else if (behaviors.includes("no-energy")) energyPattern.push("low");
    else energyPattern.push("none");
  }
  let switches = 0;
  let lastEnergy: "high" | "low" | "none" = "none";
  for (const e of energyPattern) {
    if (e !== "none" && lastEnergy !== "none" && e !== lastEnergy) switches++;
    if (e !== "none") lastEnergy = e;
  }
  if (switches >= 2) {
    signals.push({
      id: "energy-volatility",
      level: "INFO",
      title: "Energy level volatility",
      description: `Energy levels are swinging between high and low (${switches} switches in ${recentDays.length} days). This instability can signal mood cycling.`,
      relatedDates: recentDays.map((d) => d.date),
    });
  }

  // 4. Social withdrawal trend — depressive score increasing over 14 days
  if (last14.length >= 6) {
    const firstAvg =
      firstHalf.reduce((s, d) => s + d.score.depressiveScore, 0) /
      (firstHalf.length || 1);
    const secondAvg =
      secondHalf.reduce((s, d) => s + d.score.depressiveScore, 0) /
      (secondHalf.length || 1);

    if (secondAvg >= 4 && secondAvg > firstAvg * 1.5) {
      signals.push({
        id: "withdrawal-trend",
        level: "WARNING",
        title: "Increasing depressive symptoms",
        description: `Depressive scores are trending up (avg ${firstAvg.toFixed(1)} → ${secondAvg.toFixed(1)}). Watch for withdrawal and loss of interest.`,
        relatedDates: secondHalf.map((d) => d.date),
      });
    }
  }

  // 5. Safety concern — any recent day with safety flag
  const safetyDays = recentDays.filter((d) => d.score.safetyConcern);
  if (safetyDays.length > 0) {
    signals.push({
      id: "safety-concern",
      level: "ALERT",
      title: "Safety concern detected",
      description: `References to death, self-harm, or safety concerns were logged on ${safetyDays.length} recent day(s). Please discuss with a clinician.`,
      relatedDates: safetyDays.map((d) => d.date),
    });
  }

  // 6. Mood instability — 3+ classification changes in 7 days
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
  const levelOrder: Record<SignalLevel, number> = { ALERT: 0, WARNING: 1, INFO: 2 };
  signals.sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);

  return signals;
}
