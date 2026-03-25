"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-utils";

export async function acceptDisclaimer() {
  const user = await requireUser();
  await prisma.user.update({
    where: { id: user.id },
    data: { disclaimerAcceptedAt: new Date() },
  });
}
