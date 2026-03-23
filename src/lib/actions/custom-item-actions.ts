"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-utils";

export async function getCustomItems(tenantId: string) {
  const user = await requireUser();

  const membership = await prisma.tenantMember.findUnique({
    where: { userId_tenantId: { userId: user.id, tenantId } },
  });
  if (!membership) return [];

  return prisma.customChecklistItem.findMany({
    where: { tenantId },
    orderBy: { id: "asc" },
  });
}

export async function addCustomItem(tenantId: string, label: string) {
  const user = await requireUser();

  const membership = await prisma.tenantMember.findUnique({
    where: { userId_tenantId: { userId: user.id, tenantId } },
  });
  if (!membership) return { error: "No access" };

  const item = await prisma.customChecklistItem.create({
    data: { label: label.trim(), tenantId },
  });

  return { success: true, item };
}

export async function deleteCustomItem(itemId: string) {
  const user = await requireUser();

  const item = await prisma.customChecklistItem.findUnique({
    where: { id: itemId },
    include: { tenant: { include: { members: true } } },
  });
  if (!item) return { error: "Not found" };

  const isMember = item.tenant.members.some((m) => m.userId === user.id);
  if (!isMember) return { error: "No access" };

  await prisma.customChecklistItem.delete({ where: { id: itemId } });
  return { success: true };
}
