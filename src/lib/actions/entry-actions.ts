"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-utils";
import { MoodDescriptor, DayQuality } from "@/generated/prisma/client";

interface QuickLogInput {
  tenantId: string;
  mood: MoodDescriptor;
  dayQuality: DayQuality;
  date?: string; // ISO date string, defaults to today
}

export async function saveQuickLog(input: QuickLogInput) {
  const user = await requireUser();

  // Verify user belongs to this tenant
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
  // Normalize to date only (strip time)
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
    },
    create: {
      date: dateOnly,
      mood: input.mood,
      dayQuality: input.dayQuality,
      userId: user.id,
      tenantId: input.tenantId,
    },
  });

  return { success: true, entryId: entry.id };
}
