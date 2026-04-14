import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireMobileUser,
  requireTenantMembership,
  errorResponse,
} from "@/lib/mobile-auth";
import { loadTenantFramework } from "@/lib/analysis/framework-loader";
import {
  scoreDailyEntry,
  type DailyScoringInput,
} from "@/lib/analysis/daily-score";
import { MoodDescriptor, DayQuality } from "@/generated/prisma/client";

export async function POST(request: NextRequest) {
  try {
    const userId = await requireMobileUser(request);

    const body = await request.json();
    const {
      tenantId,
      mood,
      dayQuality,
      behaviorKeys = [],
      customItemIds = [],
      strategyIds = [],
      impairments = {},
      notes,
      menstrualSeverity,
      date,
    } = body;

    if (!tenantId || !mood || !dayQuality) {
      return Response.json(
        { error: "tenantId, mood, and dayQuality are required" },
        { status: 400 }
      );
    }

    await requireTenantMembership(userId, tenantId);

    const entryDate = date ? new Date(date) : new Date();
    const dateOnly = new Date(
      Date.UTC(
        entryDate.getFullYear(),
        entryDate.getMonth(),
        entryDate.getDate()
      )
    );

    // Compute classification at write time
    let computedMood: string | null = null;
    let computedScore: number | null = null;

    if (behaviorKeys.length > 0) {
      const framework = await loadTenantFramework(tenantId);
      const scoringInput: DailyScoringInput = {
        behaviorKeys,
        mood: mood as MoodDescriptor,
        dayQuality: dayQuality as DayQuality,
        impairments,
      };
      const score = scoreDailyEntry(scoringInput, framework ?? undefined);
      computedMood = score.classification;
      computedScore = score.waveScore;
    }

    const entry = await prisma.entry.upsert({
      where: {
        userId_tenantId_date: {
          userId,
          tenantId,
          date: dateOnly,
        },
      },
      update: {
        mood: mood as MoodDescriptor,
        dayQuality: dayQuality as DayQuality,
        notes: notes ?? null,
        behaviorKeys,
        customItemIds,
        strategyIds,
        impairments,
        menstrualSeverity: menstrualSeverity ?? null,
        computedMood,
        computedScore,
      },
      create: {
        date: dateOnly,
        mood: mood as MoodDescriptor,
        dayQuality: dayQuality as DayQuality,
        notes: notes ?? null,
        userId,
        tenantId,
        behaviorKeys,
        customItemIds,
        strategyIds,
        impairments,
        menstrualSeverity: menstrualSeverity ?? null,
        computedMood,
        computedScore,
      },
    });

    return Response.json({ success: true, entryId: entry.id });
  } catch (err) {
    return errorResponse(err);
  }
}
