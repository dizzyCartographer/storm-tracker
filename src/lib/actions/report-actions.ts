"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-utils";
import { scoreDailyEntry, type DailyScore, type DailyScoringInput } from "@/lib/analysis/daily-score";
import { detectEpisodes, type Episode, type DayWithScore } from "@/lib/analysis/episode-detection";
import { detectProdromeSignals, type ProdromeSignal } from "@/lib/analysis/prodrome-signals";
import { loadTenantFramework } from "@/lib/analysis/framework-loader";

export interface ReportDay {
  date: string;
  score: DailyScore;
  userId: string;
  userName: string | null;
  mood: string;
  dayQuality: string;
  behaviors: string[];
  impairments: Record<string, string>;
  hasPeriod: boolean;
  periodSeverity: string | null;
  hasNotes: boolean;
  notes: string | null;
}

export interface ReportData {
  days: ReportDay[];
  episodes: Episode[];
  signals: ProdromeSignal[];
  behaviorFrequency: { key: string; count: number; percentage: number }[];
  impairmentSummary: { domain: string; presentCount: number; severeCount: number }[];
  tenantName: string;
  dateRange: { from: string; to: string };
  projectInfo: {
    teenFullName: string | null;
    teenNickname: string | null;
    teenBirthday: Date | null;
    teenDiagnosis: string | null;
    teenOtherHealth: string | null;
    teenSchool: string | null;
    teenHasIep: boolean | null;
    onsetDate: Date | null;
    familyHistory: string | null;
    description: string | null;
    purpose: string | null;
  } | null;
  medications: { name: string; dosage: string | null; frequency: string | null; instructions: string | null }[];
  strategies: { name: string; category: string | null }[];
}

export async function getReportData(
  tenantId: string,
  fromDate: string,
  toDate: string
): Promise<ReportData | null> {
  const user = await requireUser();

  const membership = await prisma.tenantMember.findUnique({
    where: { userId_tenantId: { userId: user.id, tenantId } },
  });
  if (!membership) return null;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      name: true,
      teenFullName: true,
      teenNickname: true,
      teenBirthday: true,
      teenDiagnosis: true,
      teenOtherHealth: true,
      teenSchool: true,
      teenHasIep: true,
      onsetDate: true,
      familyHistory: true,
      description: true,
      purpose: true,
    },
  });

  const medications = await prisma.medication.findMany({
    where: { tenantId, isActive: true },
    select: { name: true, dosage: true, frequency: true, instructions: true },
    orderBy: { name: "asc" },
  });

  const strategies = await prisma.strategy.findMany({
    where: { tenantId },
    select: { name: true, category: true },
    orderBy: { name: "asc" },
  });

  // Load the tenant's diagnostic framework
  const framework = await loadTenantFramework(tenantId);

  const from = new Date(fromDate + "T00:00:00Z");
  const to = new Date(toDate + "T23:59:59Z");

  const entries = await prisma.entry.findMany({
    where: {
      tenantId,
      date: { gte: from, lte: to },
    },
    include: {
      user: { select: { id: true, name: true } },
    },
    orderBy: { date: "asc" },
  });

  const days: ReportDay[] = entries.map((entry) => {
    const behaviorKeys = (entry.behaviorKeys as string[]) ?? [];
    const impairments = (entry.impairments as Record<string, string>) ?? {};
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
      mood: entry.mood,
      dayQuality: entry.dayQuality,
      behaviors: behaviorKeys,
      impairments,
      hasPeriod: !!entry.menstrualSeverity,
      periodSeverity: entry.menstrualSeverity,
      hasNotes: !!entry.notes,
      notes: entry.notes,
    };
  });

  // Episode + signal detection
  const byDate = new Map<string, DayWithScore>();
  const behaviorsByDate = new Map<string, string[]>();

  for (const day of days) {
    const existing = behaviorsByDate.get(day.date) ?? [];
    behaviorsByDate.set(day.date, [...new Set([...existing, ...day.behaviors])]);

    const current = byDate.get(day.date);
    const total = day.score.manicCriteriaCount + day.score.depressiveCriteriaCount;
    const currentTotal = current
      ? current.score.manicCriteriaCount + current.score.depressiveCriteriaCount
      : 0;
    if (!current || total > currentTotal) {
      byDate.set(day.date, { date: day.date, score: day.score });
    }
  }

  const daysWithScores = Array.from(byDate.values());
  const episodes = detectEpisodes(daysWithScores, framework ?? undefined);
  const signals = detectProdromeSignals(daysWithScores, behaviorsByDate, framework ?? undefined);

  // Behavior frequency
  const behaviorCounts = new Map<string, number>();
  for (const day of days) {
    for (const b of day.behaviors) {
      behaviorCounts.set(b, (behaviorCounts.get(b) || 0) + 1);
    }
  }
  const totalDays = new Set(days.map((d) => d.date)).size;
  const behaviorFrequency = Array.from(behaviorCounts.entries())
    .map(([key, count]) => ({
      key,
      count,
      percentage: Math.round((count / totalDays) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  // Impairment summary
  const impDomains = ["SCHOOL_WORK", "FAMILY_LIFE", "FRIENDSHIPS", "SELF_CARE", "SAFETY_CONCERN"];
  const impairmentSummary = impDomains.map((domain) => {
    let presentCount = 0;
    let severeCount = 0;
    for (const day of days) {
      const severity = day.impairments[domain];
      if (severity === "PRESENT") presentCount++;
      if (severity === "SEVERE") severeCount++;
    }
    return { domain, presentCount, severeCount };
  });

  return {
    days,
    episodes,
    signals,
    behaviorFrequency,
    impairmentSummary,
    tenantName: tenant?.name ?? "Unknown",
    dateRange: { from: fromDate, to: toDate },
    projectInfo: tenant
      ? {
          teenFullName: tenant.teenFullName,
          teenNickname: tenant.teenNickname,
          teenBirthday: tenant.teenBirthday,
          teenDiagnosis: tenant.teenDiagnosis,
          teenOtherHealth: tenant.teenOtherHealth,
          teenSchool: tenant.teenSchool,
          teenHasIep: tenant.teenHasIep,
          onsetDate: tenant.onsetDate,
          familyHistory: tenant.familyHistory,
          description: tenant.description,
          purpose: tenant.purpose,
        }
      : null,
    medications,
    strategies,
  };
}
