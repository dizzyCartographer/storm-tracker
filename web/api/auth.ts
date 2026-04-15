// Better Auth handler for /api/auth/*
//
// Vercel doesn't support catch-all [...path] for non-Next.js frameworks.
// A rewrite in vercel.json routes all /api/auth/* requests to this function.
// Hono handles internal routing and passes the raw Request to Better Auth
// — no URL reconstruction or new Request() cloning needed.
//
// See: https://better-auth.com/docs/integrations/hono
// See: https://github.com/better-auth/better-auth/issues/8404

import { Hono } from "hono";
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

const app = new Hono();
app.on(["POST", "GET"], "/api/auth/*", async (c) => {
  try {
    const response = await auth.handler(c.req.raw);
    if (response.status >= 500) {
      const body = await response.clone().text();
      console.error("AUTH_ERROR:", response.status, body);
      return c.json({ error: body || "empty", status: response.status, url: c.req.url }, 500);
    }
    return response;
  } catch (err) {
    const msg = err instanceof Error ? err.stack : String(err);
    console.error("AUTH_THROW:", msg);
    return c.json({ error: msg }, 500);
  }
});

// Debug: shows what URL Hono actually sees from the rewrite
app.all("*", (c) =>
  c.json({ debug: "no route matched", url: c.req.url, method: c.req.method }),
);

export default {
  fetch: app.fetch,
};
