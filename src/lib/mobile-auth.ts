import { createRemoteJWKSet, jwtVerify } from "jose";
import { prisma } from "./prisma";

const JWKS = createRemoteJWKSet(
  new URL("/api/auth/jwks", process.env.STRM_TRKR_BETTER_AUTH_URL!)
);

/**
 * Verify a JWT from the Authorization header and return the user ID.
 * Used by custom mobile API endpoints.
 */
export async function requireMobileUser(request: Request): Promise<string> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AuthError("Missing or invalid Authorization header", 401);
  }

  const token = authHeader.slice(7);

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: process.env.STRM_TRKR_BETTER_AUTH_URL,
    });

    if (!payload.sub) {
      throw new AuthError("Token missing sub claim", 401);
    }

    return payload.sub;
  } catch (err) {
    if (err instanceof AuthError) throw err;
    throw new AuthError("Invalid or expired token", 401);
  }
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
