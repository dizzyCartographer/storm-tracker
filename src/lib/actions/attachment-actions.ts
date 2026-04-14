"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-utils";

export async function getEntryAttachments(entryId: string) {
  const user = await requireUser();

  const entry = await prisma.entry.findUnique({
    where: { id: entryId },
    select: { tenantId: true },
  });
  if (!entry) return [];

  const membership = await prisma.tenantMember.findUnique({
    where: { userId_tenantId: { userId: user.id, tenantId: entry.tenantId } },
  });
  if (!membership) return [];

  return prisma.attachment.findMany({
    where: { entryId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTenantAttachments(
  tenantId: string,
  filters?: { fileType?: string; fromDate?: string; toDate?: string }
) {
  const user = await requireUser();

  const membership = await prisma.tenantMember.findUnique({
    where: { userId_tenantId: { userId: user.id, tenantId } },
  });
  if (!membership) return [];

  const where: Record<string, unknown> = { tenantId };

  if (filters?.fileType) {
    where.fileType = { startsWith: filters.fileType };
  }

  if (filters?.fromDate || filters?.toDate) {
    const dateFilter: Record<string, Date> = {};
    if (filters.fromDate) dateFilter.gte = new Date(filters.fromDate);
    if (filters.toDate) {
      const to = new Date(filters.toDate);
      to.setDate(to.getDate() + 1);
      dateFilter.lt = to;
    }
    where.createdAt = dateFilter;
  }

  return prisma.attachment.findMany({
    where,
    include: {
      entry: { select: { id: true, date: true, mood: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
