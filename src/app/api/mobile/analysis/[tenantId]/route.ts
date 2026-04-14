import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireMobileUser,
  requireTenantMembership,
  errorResponse,
} from "@/lib/mobile-auth";
import {
  scoreDailyEntry,
  type DailyScoringInput,
} from "@/lib/analysis/daily-score";
import {
  detectEpisodes,
  type DayWithScore,
} from "@/lib/analysis/episode-detection";
import { detectProdromeSignals } from "@/lib/analysis/prodrome-signals";
import { generatePredictions } from "@/lib/analysis/pattern-prediction";
import { generateSuggestions } from "@/lib/analysis/caregiver-suggestions";
import { loadTenantFramework } from "@/lib/analysis/framework-loader";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const userId = await requireMobileUser(request);
    const { tenantId } = await params;

    await requireTenantMembership(userId, tenantId);

    const days = parseInt(
      request.nextUrl.searchParams.get("days") ?? "30",
      10
    );

    const framework = await loadTenantFramework(tenantId);

    const since = new Date();
    since.setDate(since.getDate() - days);

    const entries = await prisma.entry.findMany({
      where: {
        tenantId,
        date: { gte: since },
      },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { date: "asc" },
    });

    // Score each entry
    const dailyScores = entries.map((entry) => {
      const behaviorKeys = (entry.behaviorKeys as string[]) ?? [];
      const impairments =
        (entry.impairments as Record<string, string>) ?? {};
      const input: DailyScoringInput = {
        behaviorKeys,
        mood: entry.mood,
        dayQuality: entry.dayQuality,
        impairments,
      };
      return {
        date: entry.date.toISOString().slice(0, 10),
        score: scoreDailyEntry(input, framework ?? undefined),
        userId: entry.user.id,
        userName: entry.user.name,
      };
    });

    // Aggregate by date for episode/prodrome detection
    const byDate = new Map<string, DayWithScore>();
    const behaviorsByDate = new Map<string, string[]>();

    for (const entry of entries) {
      const dateStr = entry.date.toISOString().slice(0, 10);
      const behaviors = (entry.behaviorKeys as string[]) ?? [];

      const existing = behaviorsByDate.get(dateStr) ?? [];
      behaviorsByDate.set(dateStr, [
        ...new Set([...existing, ...behaviors]),
      ]);

      const scored = dailyScores.find(
        (d) => d.date === dateStr && d.userId === entry.userId
      );
      if (!scored) continue;

      const current = byDate.get(dateStr);
      const totalCriteria =
        scored.score.manicCriteriaCount +
        scored.score.depressiveCriteriaCount;
      const currentTotal = current
        ? current.score.manicCriteriaCount +
          current.score.depressiveCriteriaCount
        : 0;

      if (!current || totalCriteria > currentTotal) {
        byDate.set(dateStr, { date: dateStr, score: scored.score });
      }
    }

    const daysWithScores = Array.from(byDate.values());
    const episodes = detectEpisodes(
      daysWithScores,
      framework ?? undefined
    );
    const signals = detectProdromeSignals(
      daysWithScores,
      behaviorsByDate,
      framework ?? undefined
    );
    const predictions = generatePredictions(daysWithScores);
    const suggestions = generateSuggestions(
      daysWithScores,
      signals,
      predictions,
      behaviorsByDate
    );

    // Discrepancy detection
    const discrepancies: {
      date: string;
      entries: {
        userName: string | null;
        mood: string;
        classification: string;
        criteriaCount: number;
      }[];
    }[] = [];

    const entriesByDate = new Map<string, typeof dailyScores>();
    for (const ds of dailyScores) {
      const arr = entriesByDate.get(ds.date) ?? [];
      arr.push(ds);
      entriesByDate.set(ds.date, arr);
    }
    for (const [date, dateEntries] of entriesByDate) {
      if (dateEntries.length < 2) continue;
      const classifications = new Set(
        dateEntries.map((e) => e.score.classification)
      );
      if (classifications.size > 1) {
        discrepancies.push({
          date,
          entries: dateEntries.map((e) => ({
            userName: e.userName,
            mood:
              entries.find(
                (en) =>
                  en.date.toISOString().slice(0, 10) === date &&
                  en.userId === e.userId
              )?.mood ?? "Unknown",
            classification: e.score.classification,
            criteriaCount:
              e.score.manicCriteriaCount +
              e.score.depressiveCriteriaCount,
          })),
        });
      }
    }

    return Response.json({
      dailyScores,
      episodes,
      signals,
      predictions,
      suggestions,
      discrepancies,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
