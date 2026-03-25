"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-utils";

async function requireMembership(tenantId: string) {
  const user = await requireUser();
  const membership = await prisma.tenantMember.findUnique({
    where: { userId_tenantId: { userId: user.id, tenantId } },
  });
  if (!membership) throw new Error("Not a member");
  return { user, membership };
}

const DEFAULT_STRATEGIES = [
  { name: "Sleep hygiene routine", category: "Sleep", description: "Consistent bedtime, no screens 1hr before, cool dark room" },
  { name: "De-escalation pause", category: "De-escalation", description: "When tension rises, agree to take a 15-minute break before continuing" },
  { name: "Active listening", category: "Communication", description: "Reflect back what the teen said before responding — 'I hear you saying...'" },
  { name: "Physical activity", category: "Environment", description: "Walk, bike ride, or other movement to regulate energy and mood" },
  { name: "Mood check-in", category: "Communication", description: "Brief daily check-in using a 1-5 scale or emoji to track how they feel" },
  { name: "Sensory grounding", category: "De-escalation", description: "5-4-3-2-1 technique: 5 things you see, 4 hear, 3 touch, 2 smell, 1 taste" },
  { name: "Routine consistency", category: "Environment", description: "Maintain predictable daily structure — meals, school, activities at same times" },
  { name: "Caregiver self-care", category: "Self-Care", description: "Take time for your own wellbeing — you can't pour from an empty cup" },
];

export async function getStrategies(tenantId: string) {
  await requireMembership(tenantId);
  return prisma.strategy.findMany({
    where: { tenantId },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
}

export async function seedDefaultStrategies(tenantId: string) {
  await requireMembership(tenantId);

  const existing = await prisma.strategy.count({ where: { tenantId, isDefault: true } });
  if (existing > 0) return { count: 0 };

  const created = await prisma.strategy.createMany({
    data: DEFAULT_STRATEGIES.map((s) => ({
      ...s,
      tenantId,
      isDefault: true,
    })),
  });

  return { count: created.count };
}

export async function createStrategy(
  tenantId: string,
  data: { name: string; description?: string; category?: string }
) {
  await requireMembership(tenantId);

  const trimmedName = data.name.trim();
  if (!trimmedName) return { error: "Strategy name is required" };

  const strategy = await prisma.strategy.create({
    data: {
      tenantId,
      name: trimmedName,
      description: data.description?.trim() || null,
      category: data.category?.trim() || null,
    },
  });

  return { id: strategy.id };
}

export async function deleteStrategy(id: string) {
  const strategy = await prisma.strategy.findUnique({ where: { id } });
  if (!strategy) return { error: "Not found" };
  await requireMembership(strategy.tenantId);

  await prisma.strategy.delete({ where: { id } });
  return { success: true };
}

export async function logStrategyUsage(
  strategyId: string,
  data: { date: string; effectiveness?: number; notes?: string; entryId?: string }
) {
  const strategy = await prisma.strategy.findUnique({ where: { id: strategyId } });
  if (!strategy) return { error: "Not found" };
  await requireMembership(strategy.tenantId);

  const usage = await prisma.strategyUsage.create({
    data: {
      strategyId,
      date: new Date(data.date),
      effectiveness: data.effectiveness ?? null,
      notes: data.notes?.trim() || null,
      entryId: data.entryId ?? null,
    },
  });

  return { id: usage.id };
}

export async function getRecentStrategyUsages(tenantId: string, days = 30) {
  await requireMembership(tenantId);

  const since = new Date();
  since.setDate(since.getDate() - days);

  return prisma.strategyUsage.findMany({
    where: {
      strategy: { tenantId },
      date: { gte: since },
    },
    include: { strategy: { select: { name: true, category: true } } },
    orderBy: { date: "desc" },
  });
}
