import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { jwt } from "better-auth/plugins";
import { expo } from "@better-auth/expo";
import { authPrisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(authPrisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  secret: process.env.STRM_TRKR_BETTER_AUTH_SECRET,
  baseURL: process.env.STRM_TRKR_BETTER_AUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined),
  trustedOrigins: (request) => {
    const origins: string[] = [
      "stormtracker://",
      "http://localhost:3000",
    ];
    if (process.env.STRM_TRKR_BETTER_AUTH_URL) {
      origins.push(process.env.STRM_TRKR_BETTER_AUTH_URL);
    }
    // Vercel preview deployments use dynamic subdomains
    const origin = request?.headers.get("origin");
    if (origin && /^https:\/\/storm-tracker-.*\.vercel\.app$/.test(origin)) {
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
      },
    }),
    nextCookies(), // MUST be last — ordering matters
  ],
});
