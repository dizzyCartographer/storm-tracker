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
import { BEHAVIOR_ITEMS } from "@/lib/behavior-items";

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
    const checks = input.behaviorKeys
      .map((key) => {
        const item = BEHAVIOR_ITEMS.find((i) => i.key === key);
        if (!item) return null;
        return {
          entryId: entry.id,
          category: item.category as BehaviorCategory,
          itemKey: key,
          checked: true,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);
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

export async function getRecentEntries(tenantId: string, limit = 14) {
  const user = await requireUser();

  const membership = await prisma.tenantMember.findUnique({
    where: { userId_tenantId: { userId: user.id, tenantId } },
  });
  if (!membership) return [];

  return prisma.entry.findMany({
    where: { tenantId },
    include: {
      user: { select: { name: true } },
      behaviorChecks: true,
      impairments: true,
      menstrualLog: true,
    },
    orderBy: { date: "desc" },
    take: limit,
  });
}
