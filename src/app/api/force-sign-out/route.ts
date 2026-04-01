import { NextResponse } from "next/server";

/**
 * Force sign-out by clearing all Better Auth cookies.
 * Works even when the session is corrupt or the auth system is erroring.
 * GET /api/force-sign-out → clears cookies and redirects to /sign-in
 */
export async function GET() {
  const response = NextResponse.redirect(
    new URL("/sign-in", process.env.STRM_TRKR_BETTER_AUTH_URL ?? "http://localhost:3000")
  );

  // Clear all Better Auth session cookies
  response.cookies.set("better-auth.session_token", "", {
    maxAge: 0,
    path: "/",
  });
  response.cookies.set("better-auth.session_data", "", {
    maxAge: 0,
    path: "/",
  });
  response.cookies.set("__Secure-better-auth.session_token", "", {
    maxAge: 0,
    path: "/",
    secure: true,
  });

  return response;
}
