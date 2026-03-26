"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-utils";
import {
  MoodDescriptor,
  DayQuality,
  BehaviorCategory,
  ImpairmentDomain,
  ImpairmentSeverity,
  BleedingSeverity,
} from "@/generated/prisma/client";
import { loadTenantFramework } from "@/lib/analysis/framework-loader";
import { scoreDailyEntry, type DailyScoringInput } from "@/lib/analysis/daily-score";

interface ImpairmentInput {
  domain: ImpairmentDomain;
  severity: ImpairmentSeverity;
}

interface DailyLogInput {
  tenantId: string;
  mood: MoodDescriptor;
  dayQuality: DayQuality;
  behaviorKeys?: string[];
  customItemIds?: string[];
  impairments?: ImpairmentInput[];
  notes?: string;
  menstrualSeverity?: BleedingSeverity | null;
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
    },
    create: {
      date: dateOnly,
      mood: input.mood,
      dayQuality: input.dayQuality,
      notes: input.notes ?? null,
      userId: user.id,
      tenantId: input.tenantId,
    },
  });

  // Behavior checks: delete + recreate
  await prisma.behaviorCheck.deleteMany({ where: { entryId: entry.id } });
  if (input.behaviorKeys && input.behaviorKeys.length > 0) {
    // Load framework to map keys to categories and definition IDs
    const framework = await loadTenantFramework(input.tenantId);
    const checks = input.behaviorKeys
      .map((key) => {
        const behavior = framework?.behaviorMap.get(key);
        // Map framework category slug to BehaviorCategory enum
        const categoryMap: Record<string, BehaviorCategory> = {
          manic: "MANIC",
          depressive: "DEPRESSIVE",
          // Legacy mappings (pre-Phase 16)
          sleep: "SLEEP",
          energy: "ENERGY",
          "mixed-cycling": "MIXED_CYCLING",
        };
        const category = behavior
          ? (categoryMap[behavior.categorySlug] ?? "MANIC")
          : "MANIC";
        return {
          entryId: entry.id,
          category,
          itemKey: key,
          checked: true,
          behaviorDefinitionId: behavior?.id ?? null,
        };
      });
    if (checks.length > 0) {
      await prisma.behaviorCheck.createMany({ data: checks });
    }
  }

  // Custom checks: delete + recreate
  await prisma.customCheck.deleteMany({ where: { entryId: entry.id } });
  if (input.customItemIds && input.customItemIds.length > 0) {
    await prisma.customCheck.createMany({
      data: input.customItemIds.map((itemId) => ({
        entryId: entry.id,
        itemId,
        checked: true,
      })),
    });
  }

  // Impairments: delete + recreate
  await prisma.impairment.deleteMany({ where: { entryId: entry.id } });
  if (input.impairments && input.impairments.length > 0) {
    await prisma.impairment.createMany({
      data: input.impairments.map((imp) => ({
        entryId: entry.id,
        domain: imp.domain,
        severity: imp.severity,
      })),
    });
  }

  // Menstrual log: upsert or delete
  if (input.menstrualSeverity) {
    await prisma.menstrualLog.upsert({
      where: { entryId: entry.id },
      update: { severity: input.menstrualSeverity },
      create: { entryId: entry.id, severity: input.menstrualSeverity },
    });
  } else {
    await prisma.menstrualLog.deleteMany({ where: { entryId: entry.id } });
  }

  return { success: true, entryId: entry.id };
}

export async function getEntriesByMonth(tenantId: string, year: number, month: number) {
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
      behaviorChecks: true,
      customChecks: { include: { item: true } },
      impairments: true,
      menstrualLog: true,
    },
    orderBy: { date: "asc" },
  });

  const framework = await loadTenantFramework(tenantId);

  return entries.map((entry) => {
    const hasBehaviorDetail = entry.behaviorChecks.length > 0;
    let displayMood: string = entry.mood;

    if (hasBehaviorDetail) {
      const input: DailyScoringInput = {
        behaviorKeys: entry.behaviorChecks.map((bc) => bc.itemKey),
        mood: entry.mood,
        dayQuality: entry.dayQuality,
        impairments: entry.impairments.map((imp) => ({
          domain: imp.domain,
          severity: imp.severity,
        })),
      };
      const score = scoreDailyEntry(input, framework ?? undefined);
      displayMood = score.classification;
    }

    return {
      ...entry,
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
      behaviorChecks: true,
      customChecks: true,
      impairments: true,
      menstrualLog: true,
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
    behaviorKeys: entry.behaviorChecks.map((bc) => bc.itemKey),
    customItemIds: entry.customChecks.map((cc) => cc.itemId),
    impairments: entry.impairments.map((imp) => ({
      domain: imp.domain,
      severity: imp.severity,
    })),
    menstrualSeverity: entry.menstrualLog?.severity ?? null,
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
    include: {
      behaviorChecks: true,
      customChecks: true,
      impairments: true,
      menstrualLog: true,
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
    behaviorKeys: entry.behaviorChecks.map((bc) => bc.itemKey),
    customItemIds: entry.customChecks.map((cc) => cc.itemId),
    impairments: entry.impairments.map((imp) => ({
      domain: imp.domain,
      severity: imp.severity,
    })),
    menstrualSeverity: entry.menstrualLog?.severity ?? null,
  };
}

export async function getEntryDetail(entryId: string) {
  const user = await requireUser();

  const entry = await prisma.entry.findUnique({
    where: { id: entryId },
    include: {
      user: { select: { id: true, name: true } },
      behaviorChecks: true,
      customChecks: { include: { item: true } },
      impairments: true,
      menstrualLog: true,
      attachments: true,
      tenant: { select: { id: true, name: true } },
    },
  });

  if (!entry) return null;

  // Verify membership
  const membership = await prisma.tenantMember.findUnique({
    where: { userId_tenantId: { userId: user.id, tenantId: entry.tenantId } },
  });
  if (!membership) return null;

  const hasBehaviorDetail = entry.behaviorChecks.length > 0;
  let displayMood: string = entry.mood;

  if (hasBehaviorDetail) {
    const framework = await loadTenantFramework(entry.tenantId);
    const input: DailyScoringInput = {
      behaviorKeys: entry.behaviorChecks.map((bc) => bc.itemKey),
      mood: entry.mood,
      dayQuality: entry.dayQuality,
      impairments: entry.impairments.map((imp) => ({
        domain: imp.domain,
        severity: imp.severity,
      })),
    };
    const score = scoreDailyEntry(input, framework ?? undefined);
    displayMood = score.classification;
  }

  return {
    ...entry,
    date: entry.date.toISOString().slice(0, 10),
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
  if (entry.userId !== user.id) return { error: "You can only delete your own entries" };

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
      behaviorChecks: true,
      impairments: true,
      menstrualLog: true,
    },
    orderBy: { date: "desc" },
    take: limit,
  });

  const framework = await loadTenantFramework(tenantId);

  return entries.map((entry) => {
    const hasBehaviorDetail = entry.behaviorChecks.length > 0;
    let displayMood: string = entry.mood;

    if (hasBehaviorDetail) {
      const input: DailyScoringInput = {
        behaviorKeys: entry.behaviorChecks.map((bc) => bc.itemKey),
        mood: entry.mood,
        dayQuality: entry.dayQuality,
        impairments: entry.impairments.map((imp) => ({
          domain: imp.domain,
          severity: imp.severity,
        })),
      };
      const score = scoreDailyEntry(input, framework ?? undefined);
      displayMood = score.classification;
    }

    return {
      ...entry,
      displayMood,
      hasBehaviorDetail,
    };
  });
}
