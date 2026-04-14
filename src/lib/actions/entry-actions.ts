"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-utils";
import { MoodDescriptor, DayQuality } from "@/generated/prisma/client";
import { loadTenantFramework } from "@/lib/analysis/framework-loader";
import {
  scoreDailyEntry,
  type DailyScoringInput,
} from "@/lib/analysis/daily-score";

interface DailyLogInput {
  tenantId: string;
  mood: MoodDescriptor;
  dayQuality: DayQuality;
  behaviorKeys?: string[];
  customItemIds?: string[];
  strategyIds?: string[];
  missedMedIds?: string[];
  impairments?: Record<string, string>;
  notes?: string;
  menstrualSeverity?: string | null;
  date?: string;
}

export async function saveDailyLog(input: DailyLogInput) {
  const user = await requireUser();

  const membership = await prisma.tenantMember.findUnique({
    where: {
      userId_tenantId: {
        userId: user.id,
        tenantId: input.tenantId,
      },
    },
  });

  if (!membership) {
    return { error: "You don't have access to this project" };
  }

  const date = input.date ? new Date(input.date) : new Date();
  const dateOnly = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );

  const behaviorKeys = input.behaviorKeys ?? [];
  const customItemIds = input.customItemIds ?? [];
  const strategyIds = input.strategyIds ?? [];
  const missedMedIds = input.missedMedIds ?? [];
  const impairments = input.impairments ?? {};
  const menstrualSeverity = input.menstrualSeverity ?? null;

  // Compute classification at write time
  let computedMood: string | null = null;
  let computedScore: number | null = null;

  if (behaviorKeys.length > 0) {
    const framework = await loadTenantFramework(input.tenantId);
    const scoringInput: DailyScoringInput = {
      behaviorKeys,
      mood: input.mood,
      dayQuality: input.dayQuality,
      impairments,
    };
    const score = scoreDailyEntry(scoringInput, framework ?? undefined);
    computedMood = score.classification;
    computedScore = score.waveScore;
  }

  const entry = await prisma.entry.upsert({
    where: {
      userId_tenantId_date: {
        userId: user.id,
        tenantId: input.tenantId,
        date: dateOnly,
      },
    },
    update: {
      mood: input.mood,
      dayQuality: input.dayQuality,
      notes: input.notes ?? null,
      behaviorKeys,
      customItemIds,
      strategyIds,
      missedMedIds,
      impairments,
      menstrualSeverity,
      computedMood,
      computedScore,
    },
    create: {
      date: dateOnly,
      mood: input.mood,
      dayQuality: input.dayQuality,
      notes: input.notes ?? null,
      userId: user.id,
      tenantId: input.tenantId,
      behaviorKeys,
      customItemIds,
      strategyIds,
      missedMedIds,
      impairments,
      menstrualSeverity,
      computedMood,
      computedScore,
    },
  });

  return { success: true, entryId: entry.id };
}

export async function getEntriesByMonth(
  tenantId: string,
  year: number,
  month: number
) {
  const user = await requireUser();

  const membership = await prisma.tenantMember.findUnique({
    where: { userId_tenantId: { userId: user.id, tenantId } },
  });
  if (!membership) return [];

  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  const entries = await prisma.entry.findMany({
    where: {
      tenantId,
      date: { gte: start, lt: end },
    },
    include: {
      user: { select: { id: true, name: true } },
    },
    orderBy: { date: "asc" },
  });

  return entries.map((entry) => {
    const behaviorKeys = (entry.behaviorKeys as string[]) ?? [];
    const hasBehaviorDetail = behaviorKeys.length > 0;
    const displayMood = entry.computedMood ?? entry.mood;

    return {
      ...entry,
      behaviorKeys,
      customItemIds: (entry.customItemIds as string[]) ?? [],
      impairments: (entry.impairments as Record<string, string>) ?? {},
      displayMood,
      hasBehaviorDetail,
    };
  });
}

export async function getEntryForEdit(entryId: string) {
  const user = await requireUser();

  const entry = await prisma.entry.findUnique({
    where: { id: entryId },
    include: {
      user: { select: { id: true } },
    },
  });

  if (!entry) return null;
  if (entry.user.id !== user.id) return null;

  return {
    id: entry.id,
    tenantId: entry.tenantId,
    date: entry.date.toISOString().slice(0, 10),
    mood: entry.mood,
    dayQuality: entry.dayQuality,
    notes: entry.notes,
    behaviorKeys: (entry.behaviorKeys as string[]) ?? [],
    customItemIds: (entry.customItemIds as string[]) ?? [],
    strategyIds: (entry.strategyIds as string[]) ?? [],
    missedMedIds: (entry.missedMedIds as string[]) ?? [],
    impairments: (entry.impairments as Record<string, string>) ?? {},
    menstrualSeverity: entry.menstrualSeverity ?? null,
  };
}

export async function getEntryByDate(tenantId: string, dateStr: string) {
  const user = await requireUser();

  const date = new Date(dateStr);
  const dateOnly = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );

  const entry = await prisma.entry.findUnique({
    where: {
      userId_tenantId_date: {
        userId: user.id,
        tenantId,
        date: dateOnly,
      },
    },
  });

  if (!entry) return null;

  return {
    id: entry.id,
    tenantId: entry.tenantId,
    date: entry.date.toISOString().slice(0, 10),
    mood: entry.mood,
    dayQuality: entry.dayQuality,
    notes: entry.notes,
    behaviorKeys: (entry.behaviorKeys as string[]) ?? [],
    customItemIds: (entry.customItemIds as string[]) ?? [],
    strategyIds: (entry.strategyIds as string[]) ?? [],
    missedMedIds: (entry.missedMedIds as string[]) ?? [],
    impairments: (entry.impairments as Record<string, string>) ?? {},
    menstrualSeverity: entry.menstrualSeverity ?? null,
  };
}

export async function getEntryDetail(entryId: string) {
  const user = await requireUser();

  const entry = await prisma.entry.findUnique({
    where: { id: entryId },
    include: {
      user: { select: { id: true, name: true } },
      attachments: true,
      tenant: { select: { id: true, name: true } },
    },
  });

  if (!entry) return null;

  // Verify membership
  const membership = await prisma.tenantMember.findUnique({
    where: {
      userId_tenantId: { userId: user.id, tenantId: entry.tenantId },
    },
  });
  if (!membership) return null;

  const behaviorKeys = (entry.behaviorKeys as string[]) ?? [];
  const hasBehaviorDetail = behaviorKeys.length > 0;
  const displayMood = entry.computedMood ?? entry.mood;

  return {
    ...entry,
    date: entry.date.toISOString().slice(0, 10),
    behaviorKeys,
    customItemIds: (entry.customItemIds as string[]) ?? [],
    missedMedIds: (entry.missedMedIds as string[]) ?? [],
    impairments: (entry.impairments as Record<string, string>) ?? {},
    displayMood,
    hasBehaviorDetail,
    isOwn: entry.user.id === user.id,
  };
}

export async function deleteEntry(entryId: string) {
  const user = await requireUser();

  const entry = await prisma.entry.findUnique({
    where: { id: entryId },
    select: { userId: true, tenantId: true },
  });

  if (!entry) return { error: "Entry not found" };
  if (entry.userId !== user.id)
    return { error: "You can only delete your own entries" };

  await prisma.entry.delete({ where: { id: entryId } });
  return { success: true, tenantId: entry.tenantId };
}

export async function getRecentEntries(tenantId: string, limit = 14) {
  const user = await requireUser();

  const membership = await prisma.tenantMember.findUnique({
    where: { userId_tenantId: { userId: user.id, tenantId } },
  });
  if (!membership) return [];

  const entries = await prisma.entry.findMany({
    where: { tenantId },
    include: {
      user: { select: { id: true, name: true } },
    },
    orderBy: { date: "desc" },
    take: limit,
  });

  return entries.map((entry) => {
    const behaviorKeys = (entry.behaviorKeys as string[]) ?? [];
    const hasBehaviorDetail = behaviorKeys.length > 0;
    const displayMood = entry.computedMood ?? entry.mood;

    return {
      ...entry,
      behaviorKeys,
      impairments: (entry.impairments as Record<string, string>) ?? {},
      displayMood,
      hasBehaviorDetail,
    };
  });
}
