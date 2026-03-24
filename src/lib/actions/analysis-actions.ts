"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-utils";
import { scoreDailyEntry, type DailyScore, type DailyScoringInput } from "@/lib/analysis/daily-score";
import { detectEpisodes, type Episode, type DayWithScore } from "@/lib/analysis/episode-detection";
import { detectProdromeSignals, type ProdromeSignal } from "@/lib/analysis/prodrome-signals";

export interface AnalysisResult {
  dailyScores: { date: string; score: DailyScore; userId: string; userName: string | null }[];
  episodes: Episode[];
  signals: ProdromeSignal[];
}

export async function getAnalysis(tenantId: string, days = 30): Promise<AnalysisResult> {
  const user = await requireUser();

  const membership = await prisma.tenantMember.findUnique({
    where: { userId_tenantId: { userId: user.id, tenantId } },
  });
  if (!membership) return { dailyScores: [], episodes: [], signals: [] };

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
    const totalScore = scored.score.manicScore + scored.score.depressiveScore;
    const currentTotal = current
      ? current.score.manicScore + current.score.depressiveScore
      : 0;

    if (!current || totalScore > currentTotal) {
      byDate.set(dateStr, { date: dateStr, score: scored.score });
    }
  }

  const daysWithScores = Array.from(byDate.values());
  const episodes = detectEpisodes(daysWithScores);
  const signals = detectProdromeSignals(daysWithScores, behaviorsByDate);

  return { dailyScores, episodes, signals };
}
