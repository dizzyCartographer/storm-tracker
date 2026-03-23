"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-utils";
import { redirect } from "next/navigation";

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
  }));
}
