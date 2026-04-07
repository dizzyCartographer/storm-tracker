import { auth } from "./auth";
import { prisma } from "./prisma";

/**
 * Verify a Better Auth session from the request and return the user ID.
 * Works with both cookie-based (web/Expo) and Bearer token auth.
 */
export async function requireMobileUser(request: Request): Promise<string> {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user?.id) {
    throw new AuthError("Not authenticated", 401);
  }

  return session.user.id;
}

/**
 * Check that a user is a member of a tenant. Returns the membership record.
 */
export async function requireTenantMembership(
  userId: string,
  tenantId: string
) {
  const membership = await prisma.tenantMember.findUnique({
    where: { userId_tenantId: { userId, tenantId } },
  });
  if (!membership) {
    throw new AuthError("Not a member of this tenant", 403);
  }
  return membership;
}

/**
 * Custom error class for auth failures with HTTP status codes.
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Create a JSON error response from an AuthError or generic error.
 */
export function errorResponse(err: unknown): Response {
  if (err instanceof AuthError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  console.error("Unexpected error:", err);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}
