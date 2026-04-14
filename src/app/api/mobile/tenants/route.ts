import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileUser, errorResponse } from "@/lib/mobile-auth";

export async function GET(request: NextRequest) {
  try {
    const userId = await requireMobileUser(request);

    const memberships = await prisma.tenantMember.findMany({
      where: { userId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            teenFavoriteColor: true,
            teenPhotoUrl: true,
            teenNickname: true,
          },
        },
      },
    });

    const tenants = memberships.map((m) => ({
      id: m.tenant.id,
      name: m.tenant.name,
      role: m.role,
      teenFavoriteColor: m.tenant.teenFavoriteColor,
      teenPhotoUrl: m.tenant.teenPhotoUrl,
      teenNickname: m.tenant.teenNickname,
    }));

    return Response.json({ tenants });
  } catch (err) {
    return errorResponse(err);
  }
}
