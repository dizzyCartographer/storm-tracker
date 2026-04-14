// Temporary debug endpoint to isolate auth function crash

export async function GET() {
  const errors: string[] = [];

  // Test 1: Can we import better-auth?
  try {
    const { betterAuth } = await import("better-auth");
    errors.push("betterAuth import: OK");
  } catch (e: any) {
    errors.push(`betterAuth import: FAIL - ${e.message}`);
  }

  // Test 2: Can we import @neondatabase/serverless?
  try {
    const { Pool } = await import("@neondatabase/serverless");
    errors.push("Pool import: OK");
  } catch (e: any) {
    errors.push(`Pool import: FAIL - ${e.message}`);
  }

  // Test 3: Can we import @better-auth/expo?
  try {
    const { expo } = await import("@better-auth/expo");
    errors.push("expo import: OK");
  } catch (e: any) {
    errors.push(`expo import: FAIL - ${e.message}`);
  }

  // Test 4: Env vars present?
  errors.push(`DATABASE_URL: ${process.env.STRM_TRKR_DATABASE_URL ? "SET" : "MISSING"}`);
  errors.push(`AUTH_SECRET: ${process.env.STRM_TRKR_BETTER_AUTH_SECRET ? "SET" : "MISSING"}`);
  errors.push(`AUTH_URL: ${process.env.STRM_TRKR_BETTER_AUTH_URL || "NOT SET"}`);

  // Test 5: Can we create the auth instance?
  try {
    const { auth } = await import("./_auth-config");
    errors.push("auth instance: OK");
  } catch (e: any) {
    errors.push(`auth instance: FAIL - ${e.message}`);
  }

  return new Response(JSON.stringify({ checks: errors }, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
}
