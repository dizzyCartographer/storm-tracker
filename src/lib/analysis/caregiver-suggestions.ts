import { type DayWithScore } from "./episode-detection";
import { type Prediction } from "./pattern-prediction";
import { type ProdromeSignal } from "./prodrome-signals";

/**
 * Caregiver Suggestions Engine
 *
 * Generates context-aware, actionable tips for caregivers based on:
 * - Current mood state and severity
 * - Active prodrome signals
 * - Pattern predictions
 * - Recent behavior patterns
 */

export interface Suggestion {
  id: string;
  category: "SAFETY" | "COMMUNICATION" | "ENVIRONMENT" | "SELF_CARE" | "CLINICAL";
  title: string;
  description: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
}

const categoryIcons: Record<string, string> = {
  SAFETY: "!!",
  COMMUNICATION: "💬",
  ENVIRONMENT: "🏠",
  SELF_CARE: "🧘",
  CLINICAL: "🩺",
};

export function generateSuggestions(
  days: DayWithScore[],
  signals: ProdromeSignal[],
  predictions: Prediction[],
  behaviorsByDate: Map<string, string[]>
): Suggestion[] {
  if (days.length < 3) return [];

  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const recent = sorted.slice(-7);
  const suggestions: Suggestion[] = [];

  // Current dominant state
  const recentClassifications = recent.map((d) => d.score.classification);
  const manicDays = recentClassifications.filter((c) => c === "MANIC" || c === "MIXED").length;
  const depDays = recentClassifications.filter((c) => c === "DEPRESSIVE" || c === "MIXED").length;

  // Safety first — always
  const hasSafetyConcern = recent.some((d) => d.score.safetyConcern);
  const hasSafetySignal = signals.some((s) => s.id === "safety-concern");

  if (hasSafetyConcern || hasSafetySignal) {
    suggestions.push({
      id: "safety-immediate",
      category: "SAFETY",
      title: "Safety concern — take action",
      description:
        "References to death or self-harm were logged recently. Secure the environment (medications, sharp objects). If there's immediate danger, contact 988 (Suicide & Crisis Lifeline) or go to the nearest ER. Otherwise, contact the clinician as soon as possible.",
      priority: "HIGH",
    });
  }

  // Manic state suggestions
  if (manicDays >= 3) {
    suggestions.push({
      id: "manic-environment",
      category: "ENVIRONMENT",
      title: "Reduce stimulation",
      description:
        "During manic phases, reduce environmental stimulation: dim lights in the evening, limit screen time, keep the household calm. Avoid power struggles — redirect rather than confront.",
      priority: "HIGH",
    });
    suggestions.push({
      id: "manic-sleep",
      category: "ENVIRONMENT",
      title: "Protect sleep schedule",
      description:
        "Sleep disruption fuels mania. Enforce a consistent bedtime routine even if they resist. Remove devices from the bedroom. Consider melatonin if approved by their clinician.",
      priority: "HIGH",
    });
    suggestions.push({
      id: "manic-communication",
      category: "COMMUNICATION",
      title: "Use calm, brief language",
      description:
        "During elevated states, keep conversations short and clear. Avoid lengthy reasoning or emotional appeals. Use 'I notice' statements instead of accusations. Pick your battles — address safety issues only.",
      priority: "MEDIUM",
    });
  }

  // Depressive state suggestions
  if (depDays >= 3) {
    suggestions.push({
      id: "dep-connection",
      category: "COMMUNICATION",
      title: "Maintain gentle connection",
      description:
        "During depressive phases, be present without pressure. Sit nearby, offer food, suggest brief walks. Avoid 'cheer up' or 'just try harder' language. Validate their feelings: 'This is hard, and I'm here.'",
      priority: "HIGH",
    });
    suggestions.push({
      id: "dep-routine",
      category: "ENVIRONMENT",
      title: "Simplify daily expectations",
      description:
        "Lower the bar temporarily. Focus on basics: eating, hydration, minimal hygiene. School/social pressure can wait. Small accomplishments (getting dressed, eating a meal) are real wins during depressive episodes.",
      priority: "MEDIUM",
    });
    suggestions.push({
      id: "dep-selfcare",
      category: "SELF_CARE",
      title: "Check in on yourself",
      description:
        "Caring for a depressed teen is emotionally exhausting. Make sure you're eating, sleeping, and reaching out to your own support system. Caregiver burnout helps no one.",
      priority: "MEDIUM",
    });
  }

  // Escalation-specific
  const escalating = predictions.some(
    (p) => p.id === "trend-manic-escalating" || p.id === "trend-depressive-escalating"
  );
  if (escalating) {
    suggestions.push({
      id: "escalation-clinical",
      category: "CLINICAL",
      title: "Consider contacting the clinician",
      description:
        "Symptoms are trending upward. If the teen has a psychiatrist or therapist, consider reaching out proactively rather than waiting for the next scheduled appointment. Share this report if helpful.",
      priority: "HIGH",
    });
  }

  // Sleep disruption signal
  if (signals.some((s) => s.id === "sleep-disruption")) {
    suggestions.push({
      id: "sleep-intervention",
      category: "ENVIRONMENT",
      title: "Prioritize sleep intervention",
      description:
        "Persistent sleep disruption is one of the strongest predictors of episode onset. Review sleep hygiene: consistent bedtime, no caffeine after noon, dark/cool room, no screens 1 hour before bed.",
      priority: "HIGH",
    });
  }

  // Irritability signal
  if (signals.some((s) => s.id === "escalating-irritability")) {
    suggestions.push({
      id: "irritability-response",
      category: "COMMUNICATION",
      title: "De-escalation strategies",
      description:
        "Irritability is increasing. Avoid matching their energy. Give space before engaging. Use a calm, low tone. If rage escalates, prioritize physical safety and wait for the storm to pass before discussing behavior.",
      priority: "HIGH",
    });
  }

  // Mood instability signal
  if (signals.some((s) => s.id === "mood-instability")) {
    suggestions.push({
      id: "instability-log",
      category: "CLINICAL",
      title: "Increase logging detail",
      description:
        "Mood is shifting rapidly. Try to log entries daily and note the time of day when shifts happen. This data is extremely valuable for clinicians trying to distinguish bipolar from other conditions.",
      priority: "MEDIUM",
    });
  }

  // Approaching cycle transition
  const cyclePred = predictions.find((p) => p.id === "cycle-length");
  if (cyclePred && cyclePred.description.includes("imminent")) {
    suggestions.push({
      id: "cycle-prepare",
      category: "ENVIRONMENT",
      title: "Prepare for a mood transition",
      description:
        "Based on past patterns, a mood shift may be approaching. Stock up on easy meals, clear the schedule of non-essentials, and make sure support contacts are fresh in your phone.",
      priority: "MEDIUM",
    });
  }

  // Sort: HIGH first
  const priorityOrder: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return suggestions;
}
