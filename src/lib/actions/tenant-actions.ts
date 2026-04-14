"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { ProjectPurpose } from "@/generated/prisma/client";
import { autoLinkDefaultFramework } from "./framework-actions";

export interface TenantProfileInput {
  name: string;
  description?: string | null;
  purpose?: ProjectPurpose | null;
  teenFullName?: string | null;
  teenNickname?: string | null;
  teenBirthday?: string | null;
  teenFavoriteColor?: string | null;
  teenInterests?: string | null;
  teenSchool?: string | null;
  teenFavoriteSubject?: string | null;
  teenHasIep?: boolean | null;
  teenDiagnosis?: string | null;
  teenOtherHealth?: string | null;
  teenPhotoUrl?: string | null;
  onsetDate?: string | null;
  familyHistory?: string | null;
}

export async function createTenant(formData: FormData) {
  const user = await requireUser();
  const name = formData.get("name") as string;

  if (!name || name.trim().length === 0) {
    throw new Error("Name is required");
  }

  const tenant = await prisma.tenant.create({
    data: {
      name: name.trim(),
      members: {
        create: {
          userId: user.id,
          role: "OWNER",
        },
      },
    },
  });

  redirect(`/dashboard?tenant=${tenant.id}`);
}

export async function createTenantWithProfile(input: TenantProfileInput & { copyFromTenantId?: string }) {
  const user = await requireUser();

  if (!input.name || input.name.trim().length === 0) {
    return { error: "Name is required" };
  }

  let profileData: Partial<TenantProfileInput> = {};

  // Copy profile from existing project if requested
  if (input.copyFromTenantId) {
    const sourceMembership = await prisma.tenantMember.findUnique({
      where: { userId_tenantId: { userId: user.id, tenantId: input.copyFromTenantId } },
    });
    if (sourceMembership) {
      const source = await prisma.tenant.findUnique({
        where: { id: input.copyFromTenantId },
        select: {
          description: true, purpose: true,
          teenFullName: true, teenNickname: true, teenBirthday: true,
          teenFavoriteColor: true, teenInterests: true, teenSchool: true,
          teenFavoriteSubject: true, teenHasIep: true, teenDiagnosis: true,
          teenOtherHealth: true, teenPhotoUrl: true,
          onsetDate: true, familyHistory: true,
        },
      });
      if (source) {
        profileData = {
          description: source.description,
          purpose: source.purpose,
          teenFullName: source.teenFullName,
          teenNickname: source.teenNickname,
          teenBirthday: source.teenBirthday?.toISOString().slice(0, 10),
          teenFavoriteColor: source.teenFavoriteColor,
          teenInterests: source.teenInterests,
          teenSchool: source.teenSchool,
          teenFavoriteSubject: source.teenFavoriteSubject,
          teenHasIep: source.teenHasIep,
          teenDiagnosis: source.teenDiagnosis,
          teenOtherHealth: source.teenOtherHealth,
          teenPhotoUrl: source.teenPhotoUrl,
          onsetDate: source.onsetDate?.toISOString().slice(0, 10),
          familyHistory: source.familyHistory,
        };
      }
    }
  }

  // Merge: explicit input overrides copied data
  const merged = { ...profileData, ...stripUndefined(input as unknown as Record<string, unknown>) } as TenantProfileInput;

  const tenant = await prisma.tenant.create({
    data: {
      name: merged.name!.trim(),
      description: merged.description ?? null,
      purpose: merged.purpose ?? null,
      teenFullName: merged.teenFullName ?? null,
      teenNickname: merged.teenNickname ?? null,
      teenBirthday: merged.teenBirthday ? new Date(merged.teenBirthday) : null,
      teenFavoriteColor: merged.teenFavoriteColor ?? null,
      teenInterests: merged.teenInterests ?? null,
      teenSchool: merged.teenSchool ?? null,
      teenFavoriteSubject: merged.teenFavoriteSubject ?? null,
      teenHasIep: merged.teenHasIep ?? null,
      teenDiagnosis: merged.teenDiagnosis ?? null,
      teenOtherHealth: merged.teenOtherHealth ?? null,
      teenPhotoUrl: merged.teenPhotoUrl ?? null,
      onsetDate: merged.onsetDate ? new Date(merged.onsetDate) : null,
      familyHistory: merged.familyHistory ?? null,
      members: {
        create: {
          userId: user.id,
          role: "OWNER",
        },
      },
    },
  });

  // Auto-link to the default DSM-5 bipolar framework so behaviors appear immediately
  await autoLinkDefaultFramework(tenant.id);

  return { success: true, tenantId: tenant.id };
}

export async function updateTenantProfile(tenantId: string, input: TenantProfileInput) {
  const user = await requireUser();

  const membership = await prisma.tenantMember.findUnique({
    where: { userId_tenantId: { userId: user.id, tenantId } },
  });
  if (!membership || membership.role !== "OWNER") {
    return { error: "Only project owners can update project details" };
  }

  if (!input.name || input.name.trim().length === 0) {
    return { error: "Name is required" };
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      name: input.name.trim(),
      description: input.description ?? null,
      purpose: input.purpose ?? null,
      teenFullName: input.teenFullName ?? null,
      teenNickname: input.teenNickname ?? null,
      teenBirthday: input.teenBirthday ? new Date(input.teenBirthday) : null,
      teenFavoriteColor: input.teenFavoriteColor ?? null,
      teenInterests: input.teenInterests ?? null,
      teenSchool: input.teenSchool ?? null,
      teenFavoriteSubject: input.teenFavoriteSubject ?? null,
      teenHasIep: input.teenHasIep ?? null,
      teenDiagnosis: input.teenDiagnosis ?? null,
      teenOtherHealth: input.teenOtherHealth ?? null,
      teenPhotoUrl: input.teenPhotoUrl ?? null,
      onsetDate: input.onsetDate ? new Date(input.onsetDate) : null,
      familyHistory: input.familyHistory ?? null,
    },
  });

  return { success: true };
}

export async function deleteTenant(tenantId: string) {
  const user = await requireUser();

  const membership = await prisma.tenantMember.findUnique({
    where: { userId_tenantId: { userId: user.id, tenantId } },
  });
  if (!membership || membership.role !== "OWNER") {
    return { error: "Only project owners can delete projects" };
  }

  await prisma.tenant.delete({ where: { id: tenantId } });
  return { success: true };
}

export async function getTenantDetail(tenantId: string) {
  const user = await requireUser();

  const membership = await prisma.tenantMember.findUnique({
    where: { userId_tenantId: { userId: user.id, tenantId } },
  });
  if (!membership) return null;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { joinedAt: "asc" },
      },
      _count: { select: { entries: true } },
    },
  });

  if (!tenant) return null;

  return {
    ...tenant,
    teenBirthday: tenant.teenBirthday?.toISOString().slice(0, 10) ?? null,
    onsetDate: tenant.onsetDate?.toISOString().slice(0, 10) ?? null,
    role: membership.role,
    entryCount: tenant._count.entries,
  };
}

export async function getUserTenants() {
  const user = await requireUser();

  const memberships = await prisma.tenantMember.findMany({
    where: { userId: user.id },
    include: { tenant: true },
    orderBy: { joinedAt: "desc" },
  });

  return memberships.map((m) => ({
    id: m.tenant.id,
    name: m.tenant.name,
    role: m.role,
    teenFavoriteColor: m.tenant.teenFavoriteColor,
    teenPhotoUrl: m.tenant.teenPhotoUrl,
  }));
}

export async function setDefaultTenant(tenantId: string | null) {
  const user = await requireUser();

  if (tenantId) {
    const membership = await prisma.tenantMember.findUnique({
      where: { userId_tenantId: { userId: user.id, tenantId } },
    });
    if (!membership) return { error: "You don't have access to this project" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { defaultTenantId: tenantId },
  });

  return { success: true };
}

export async function getDefaultTenantId(): Promise<string | null> {
  const user = await requireUser();
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: { defaultTenantId: true },
  });
  return userData?.defaultTenantId ?? null;
}

function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
}
