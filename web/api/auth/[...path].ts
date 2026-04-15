// Better Auth catch-all handler for /api/auth/*
// Web API format (named GET/POST exports) for Vercel + Vite

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

// Pass request directly to Better Auth — no URL reconstruction needed
export const GET = (request: Request) => auth.handler(request);
export const POST = (request: Request) => auth.handler(request);
