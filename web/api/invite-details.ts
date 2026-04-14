import { neonFetchServer } from "./_auth.js";

// Public endpoint — returns invite details without requiring auth
// Uses server-side connection to bypass RLS for invite lookup

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return new Response(JSON.stringify({ error: "Missing token" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Use a direct database connection for public invite lookup
    // since the user may not be authenticated yet
    const NEON_DATA_API_URL =
      "https://ep-shy-breeze-ami5dzoi.apirest.c-5.us-east-1.aws.neon.tech/neondb/rest/v1";
    const DATABASE_URL = process.env.STRM_TRKR_DATABASE_URL_UNPOOLED || process.env.STRM_TRKR_DATABASE_URL;

    if (!DATABASE_URL) {
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Query invites table directly using the service role
    // We need the Neon serverless driver for unauthenticated queries
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(DATABASE_URL);

    const rows = await sql`
      SELECT i.token, i.role, i.status, i."expiresAt", t.name as "tenantName"
      FROM "Invite" i
      JOIN "Tenant" t ON t.id = i."tenantId"
      WHERE i.token = ${token}
        AND i.status = 'PENDING'
        AND i."expiresAt" > NOW()
      LIMIT 1
    `;

    if (rows.length === 0) {
      return new Response(JSON.stringify({ valid: false }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const invite = rows[0];
    return new Response(
      JSON.stringify({
        valid: true,
        tenantName: invite.tenantName,
        role: invite.role,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Invite lookup failed:", err);
    return new Response(JSON.stringify({ error: "Failed to look up invite" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
