"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-utils";
import { scoreDailyEntry, type DailyScore, type DailyScoringInput } from "@/lib/analysis/daily-score";
import { detectEpisodes, type Episode, type DayWithScore } from "@/lib/analysis/episode-detection";
import { detectProdromeSignals, type ProdromeSignal } from "@/lib/analysis/prodrome-signals";
import { generatePredictions, type Prediction } from "@/lib/analysis/pattern-prediction";
import { generateSuggestions, type Suggestion } from "@/lib/analysis/caregiver-suggestions";

export interface AnalysisResult {
  dailyScores: { date: string; score: DailyScore; userId: string; userName: string | null }[];
  episodes: Episode[];
  signals: ProdromeSignal[];
  predictions: Prediction[];
  suggestions: Suggestion[];
  discrepancies: Discrepancy[];
}

export interface Discrepancy {
  date: string;
  entries: { userName: string | null; mood: string; classification: string; criteriaCount: number }[];
}

export async function getAnalysis(tenantId: string, days = 30): Promise<AnalysisResult> {
  const user = await requireUser();

  const membership = await prisma.tenantMember.findUnique({
    where: { userId_tenantId: { userId: user.id, tenantId } },
  });
  if (!membership) return { dailyScores: [], episodes: [], signals: [], predictions: [], suggestions: [], discrepancies: [] };

  const since = new Date();
  since.setDate(since.getDate() - days);

  const entries = await prisma.entry.findMany({
    where: {
      tenantId,
      date: { gte: since },
    },
    include: {
      user: { select: { id: true, name: true } },
      behaviorChecks: true,
      impairments: true,
    },
    orderBy: { date: "asc" },
  });

  // Score each entry
  const dailyScores = entries.map((entry) => {
    const input: DailyScoringInput = {
      behaviorKeys: entry.behaviorChecks.map((bc) => bc.itemKey),
      mood: entry.mood,
      dayQuality: entry.dayQuality,
      impairments: entry.impairments.map((imp) => ({
        domain: imp.domain,
        severity: imp.severity,
      })),
    };
    return {
      date: entry.date.toISOString().slice(0, 10),
      score: scoreDailyEntry(input),
      userId: entry.user.id,
      userName: entry.user.name,
    };
  });

  // For episode and prodrome detection, aggregate by date
  // (use the highest-scoring entry if multiple users logged same day)
  const byDate = new Map<string, DayWithScore>();
  const behaviorsByDate = new Map<string, string[]>();

  for (const entry of entries) {
    const dateStr = entry.date.toISOString().slice(0, 10);
    const behaviors = entry.behaviorChecks.map((bc) => bc.itemKey);

    // Merge behaviors for the date
    const existing = behaviorsByDate.get(dateStr) ?? [];
    behaviorsByDate.set(dateStr, [...new Set([...existing, ...behaviors])]);

    // Keep the entry with higher total score
    const scored = dailyScores.find(
      (d) => d.date === dateStr && d.userId === entry.userId
    );
    if (!scored) continue;

    const current = byDate.get(dateStr);
    const totalCriteria = scored.score.manicCriteriaCount + scored.score.depressiveCriteriaCount;
    const currentTotal = current
      ? current.score.manicCriteriaCount + current.score.depressiveCriteriaCount
      : 0;

    if (!current || totalCriteria > currentTotal) {
      byDate.set(dateStr, { date: dateStr, score: scored.score });
    }
  }

  const daysWithScores = Array.from(byDate.values());
  const episodes = detectEpisodes(daysWithScores);
  const signals = detectProdromeSignals(daysWithScores, behaviorsByDate);
  const predictions = generatePredictions(daysWithScores);
  const suggestions = generateSuggestions(daysWithScores, signals, predictions, behaviorsByDate);

  // Discrepancy detection — flag dates where multiple observers logged conflicting moods
  const discrepancies: Discrepancy[] = [];
  const entriesByDate = new Map<string, typeof dailyScores>();
  for (const ds of dailyScores) {
    const arr = entriesByDate.get(ds.date) ?? [];
    arr.push(ds);
    entriesByDate.set(ds.date, arr);
  }
  for (const [date, dateEntries] of entriesByDate) {
    if (dateEntries.length < 2) continue;
    const classifications = new Set(dateEntries.map((e) => e.score.classification));
    if (classifications.size > 1) {
      discrepancies.push({
        date,
        entries: dateEntries.map((e) => ({
          userName: e.userName,
          mood: entries.find((en) => en.date.toISOString().slice(0, 10) === date && en.userId === e.userId)?.mood ?? "Unknown",
          classification: e.score.classification,
          criteriaCount: e.score.manicCriteriaCount + e.score.depressiveCriteriaCount,
        })),
      });
    }
  }

  return { dailyScores, episodes, signals, predictions, suggestions, discrepancies };
}
