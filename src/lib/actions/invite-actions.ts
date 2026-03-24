"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-utils";
import { TenantRole } from "@/generated/prisma/client";
import { redirect } from "next/navigation";

export async function createInvite(tenantId: string, role: TenantRole = "CAREGIVER") {
  const user = await requireUser();

  // Verify user is OWNER of this tenant
  const membership = await prisma.tenantMember.findUnique({
    where: { userId_tenantId: { userId: user.id, tenantId } },
  });

  if (!membership || membership.role !== "OWNER") {
    return { error: "Only project owners can create invites" };
  }

  const invite = await prisma.invite.create({
    data: {
      tenantId,
      role,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  return { token: invite.token };
}

export async function getInvites(tenantId: string) {
  const user = await requireUser();

  const membership = await prisma.tenantMember.findUnique({
    where: { userId_tenantId: { userId: user.id, tenantId } },
  });

  if (!membership || membership.role !== "OWNER") return [];

  return prisma.invite.findMany({
    where: { tenantId, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
}

export async function revokeInvite(inviteId: string) {
  const user = await requireUser();

  const invite = await prisma.invite.findUnique({
    where: { id: inviteId },
    include: { tenant: { include: { members: true } } },
  });

  if (!invite) return { error: "Invite not found" };

  const isOwner = invite.tenant.members.some(
    (m) => m.userId === user.id && m.role === "OWNER"
  );

  if (!isOwner) return { error: "Only project owners can revoke invites" };

  await prisma.invite.delete({ where: { id: inviteId } });
  return { success: true };
}

export async function acceptInvite(token: string) {
  const user = await requireUser();

  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { tenant: true },
  });

  if (!invite) return { error: "Invalid invite link" };
  if (invite.used) return { error: "This invite has already been used" };
  if (invite.expiresAt < new Date()) return { error: "This invite has expired" };

  // Check if already a member
  const existing = await prisma.tenantMember.findUnique({
    where: { userId_tenantId: { userId: user.id, tenantId: invite.tenantId } },
  });

  if (existing) {
    redirect(`/dashboard?tenant=${invite.tenantId}`);
  }

  // Add user as member and mark invite used
  await prisma.$transaction([
    prisma.tenantMember.create({
      data: {
        userId: user.id,
        tenantId: invite.tenantId,
        role: invite.role,
      },
    }),
    prisma.invite.update({
      where: { id: invite.id },
      data: { used: true },
    }),
  ]);

  redirect(`/dashboard?tenant=${invite.tenantId}`);
}

export async function getInviteDetails(token: string) {
  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { tenant: { select: { name: true } } },
  });

  if (!invite) return null;
  if (invite.used) return null;
  if (invite.expiresAt < new Date()) return null;

  return {
    tenantName: invite.tenant.name,
    role: invite.role,
    token: invite.token,
  };
}
