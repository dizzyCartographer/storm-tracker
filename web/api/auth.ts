// Better Auth handler for /api/auth/*
// Vercel catch-all [...path] doesn't match multi-segment paths with Vite.
// A rewrite in vercel.json routes /api/auth/sign-in/email → /api/auth?authPath=sign-in/email
// We reconstruct the original URL so Better Auth can route internally.

import { betterAuth } from "better-auth";
import { Pool } from "@neondatabase/serverless";
import { jwt } from "better-auth/plugins";
import { expo } from "@better-auth/expo";

const pool = new Pool({
  connectionString: process.env.STRM_TRKR_DATABASE_URL,
});

const auth = betterAuth({
  database: pool,
  emailAndPassword: { enabled: true },
  secret: process.env.STRM_TRKR_BETTER_AUTH_SECRET,
  baseURL:
    process.env.STRM_TRKR_BETTER_AUTH_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : undefined),
  trustedOrigins: (request) => {
    const origins: string[] = [
      "stormtracker://",
      "http://localhost:3000",
      "http://localhost:5173",
    ];
    if (process.env.STRM_TRKR_BETTER_AUTH_URL) {
      origins.push(process.env.STRM_TRKR_BETTER_AUTH_URL);
    }
    const origin = request?.headers.get("origin");
    if (
      origin &&
      /^https:\/\/storm-tracker-.*\.vercel\.app$/.test(origin)
    ) {
      origins.push(origin);
    }
    return origins;
  },
  plugins: [
    expo(),
    jwt({
      jwks: {
        keyPairConfig: { alg: "RS256" },
      },
      jwt: {
        issuer: process.env.STRM_TRKR_BETTER_AUTH_URL,
        expirationTime: "15m",
        definePayload: (session) => ({
          ...session.user,
          role: "authenticated",
        }),
      },
    }),
  ],
});

async function withOriginalPath(request: Request): Promise<Request> {
  const url = new URL(request.url);
  const authPath = url.searchParams.get("authPath");
  if (!authPath) return request;

  const originalUrl = new URL(`/api/auth/${authPath}`, url.origin);
  // Only forward params that aren't from the Vercel rewrite itself.
  // Vercel adds both "authPath" (our explicit param) and "path" (from the
  // :path capture group). Better Auth uses "path" internally, so passing
  // Vercel's "path" param breaks its routing.
  for (const [key, value] of url.searchParams) {
    if (key !== "authPath" && key !== "path") originalUrl.searchParams.set(key, value);
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  // Read body as text first — passing request.body (ReadableStream) to new Request
  // fails silently in Vercel's serverless runtime
  const bodyText = hasBody ? await request.text() : undefined;

  return new Request(originalUrl.toString(), {
    method: request.method,
    headers: request.headers,
    body: bodyText,
  });
}

async function handle(request: Request): Promise<Response> {
  try {
    const patched = await withOriginalPath(request);
    const response = await auth.handler(patched);
    if (response.status >= 400) {
      const body = await response.clone().text();
      console.error("AUTH_RESPONSE_ERROR:", response.status, body);
      // Return the error body so we can see it in curl
      return new Response(
        JSON.stringify({ status: response.status, body, url: patched.url }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.stack || err.message : String(err);
    console.error("AUTH_THROW_ERROR:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const GET = (request: Request) => handle(request);
export const POST = (request: Request) => handle(request);
