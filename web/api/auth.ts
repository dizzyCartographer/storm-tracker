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

function withOriginalPath(request: Request): Request {
  const url = new URL(request.url);
  const authPath = url.searchParams.get("authPath");
  if (!authPath) return request;

  const originalUrl = new URL(`/api/auth/${authPath}`, url.origin);
  for (const [key, value] of url.searchParams) {
    if (key !== "authPath") originalUrl.searchParams.set(key, value);
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  return new Request(originalUrl.toString(), {
    method: request.method,
    headers: request.headers,
    body: hasBody ? request.body : undefined,
    // @ts-expect-error duplex is required for streaming request bodies in Node.js fetch
    duplex: hasBody ? "half" : undefined,
  });
}

async function handle(request: Request): Promise<Response> {
  try {
    const patched = withOriginalPath(request);
    return await auth.handler(patched);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.stack || err.message : String(err);
    console.error("AUTH_HANDLER_ERROR:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const GET = (request: Request) => handle(request);
export const POST = (request: Request) => handle(request);
