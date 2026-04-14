// Better Auth server config for Vercel serverless functions
// Mirrors src/lib/auth.ts but without Prisma or Next.js dependencies

import { betterAuth } from "better-auth";
import { Pool } from "@neondatabase/serverless";
import { jwt } from "better-auth/plugins";
import { expo } from "@better-auth/expo";

const pool = new Pool({
  connectionString: process.env.STRM_TRKR_DATABASE_URL,
});

export const auth = betterAuth({
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
    // Vercel preview deployments use dynamic subdomains
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
    // No nextCookies() — not needed outside Next.js
  ],
});
