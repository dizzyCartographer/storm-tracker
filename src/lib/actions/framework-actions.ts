"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-utils";

export async function getAvailableFrameworks() {
  return prisma.diagnosticFramework.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, name: true, version: true },
    orderBy: { name: "asc" },
  });
}

export async function getTenantFrameworks(tenantId: string) {
  const user = await requireUser();

  const membership = await prisma.tenantMember.findUnique({
    where: { userId_tenantId: { userId: user.id, tenantId } },
  });
  if (!membership) return [];

  const links = await prisma.tenantFramework.findMany({
    where: { tenantId },
    select: { frameworkId: true },
  });
  return links.map((l: { frameworkId: string }) => l.frameworkId);
}

export async function linkFramework(tenantId: string, frameworkId: string) {
  const user = await requireUser();

  const membership = await prisma.tenantMember.findUnique({
    where: { userId_tenantId: { userId: user.id, tenantId } },
  });
  if (!membership || membership.role !== "OWNER") {
    return { error: "Only project owners can manage frameworks" };
  }

  await prisma.tenantFramework.upsert({
    where: { tenantId_frameworkId: { tenantId, frameworkId } },
    create: { tenantId, frameworkId },
    update: {},
  });

  return { success: true };
}

export async function unlinkFramework(tenantId: string, frameworkId: string) {
  const user = await requireUser();

  const membership = await prisma.tenantMember.findUnique({
    where: { userId_tenantId: { userId: user.id, tenantId } },
  });
  if (!membership || membership.role !== "OWNER") {
    return { error: "Only project owners can manage frameworks" };
  }

  await prisma.tenantFramework.deleteMany({
    where: { tenantId, frameworkId },
  });

  return { success: true };
}

/** Auto-link a new tenant to the default DSM-5 bipolar framework if it exists. */
export async function autoLinkDefaultFramework(tenantId: string) {
  const framework = await prisma.diagnosticFramework.findFirst({
    where: { slug: "dsm5-bipolar", isActive: true },
    select: { id: true },
  });
  if (!framework) return;

  await prisma.tenantFramework.upsert({
    where: { tenantId_frameworkId: { tenantId, frameworkId: framework.id } },
    create: { tenantId, frameworkId: framework.id },
    update: {},
  });
}
