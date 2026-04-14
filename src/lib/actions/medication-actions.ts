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

export async function getMedications(tenantId: string) {
  await requireMembership(tenantId);
  return prisma.medication.findMany({
    where: { tenantId },
    orderBy: [{ isActive: "desc" }, { startDate: "desc" }, { name: "asc" }],
  });
}

export async function createMedication(
  tenantId: string,
  data: {
    name: string;
    dosage?: string;
    frequency?: string;
    instructions?: string;
    startDate?: string;
  }
) {
  await requireMembership(tenantId);

  const trimmedName = data.name.trim();
  if (!trimmedName) return { error: "Medication name is required" };

  const med = await prisma.medication.create({
    data: {
      tenantId,
      name: trimmedName,
      dosage: data.dosage?.trim() || null,
      frequency: data.frequency?.trim() || null,
      instructions: data.instructions?.trim() || null,
      startDate: data.startDate ? new Date(data.startDate) : null,
    },
  });

  return { id: med.id };
}

export async function updateMedication(
  id: string,
  data: {
    name?: string;
    dosage?: string;
    frequency?: string;
    instructions?: string;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
  }
) {
  const med = await prisma.medication.findUnique({ where: { id } });
  if (!med) return { error: "Not found" };
  await requireMembership(med.tenantId);

  await prisma.medication.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.dosage !== undefined && { dosage: data.dosage.trim() || null }),
      ...(data.frequency !== undefined && { frequency: data.frequency.trim() || null }),
      ...(data.instructions !== undefined && { instructions: data.instructions.trim() || null }),
      ...(data.startDate !== undefined && { startDate: data.startDate ? new Date(data.startDate) : null }),
      ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });

  return { success: true };
}

export async function deleteMedication(id: string) {
  const med = await prisma.medication.findUnique({ where: { id } });
  if (!med) return { error: "Not found" };
  await requireMembership(med.tenantId);

  await prisma.medication.delete({ where: { id } });
  return { success: true };
}

export async function discontinueMedication(id: string) {
  const med = await prisma.medication.findUnique({ where: { id } });
  if (!med) return { error: "Not found" };
  await requireMembership(med.tenantId);

  const today = new Date().toISOString().split("T")[0];
  await prisma.medication.update({
    where: { id },
    data: { isActive: false, endDate: new Date(today) },
  });

  return { success: true };
}
