// Shared auth helper for serverless functions
// Verifies session and gets JWT by calling Better Auth endpoints with forwarded cookies

const AUTH_URL = process.env.STRM_TRKR_BETTER_AUTH_URL
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

const NEON_DATA_API_URL = "https://ep-shy-breeze-ami5dzoi.apirest.c-5.us-east-1.aws.neon.tech/neondb/rest/v1";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
}

export async function getSessionUser(request: Request): Promise<SessionUser | null> {
  const cookie = request.headers.get("cookie");
  if (!cookie) return null;

  try {
    const res = await fetch(`${AUTH_URL}/api/auth/get-session`, {
      headers: { cookie },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.user ?? null;
  } catch {
    return null;
  }
}

export async function getJwtFromCookies(request: Request): Promise<string | null> {
  const cookie = request.headers.get("cookie");
  if (!cookie) return null;

  try {
    const res = await fetch(`${AUTH_URL}/api/auth/token`, {
      headers: { cookie },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.token ?? null;
  } catch {
    return null;
  }
}

export async function neonFetchServer(
  path: string,
  jwt: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${NEON_DATA_API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
      ...options.headers,
    },
  });
}
