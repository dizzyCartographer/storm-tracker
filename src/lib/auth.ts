import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { jwt } from "better-auth/plugins";
import { authPrisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(authPrisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  secret: process.env.STRM_TRKR_BETTER_AUTH_SECRET,
  baseURL: process.env.STRM_TRKR_BETTER_AUTH_URL,
  trustedOrigins: (origin) => {
    // Allow requests with no Origin header (React Native / mobile clients)
    if (!origin) return true;
    // Allow the configured base URL
    if (
      process.env.STRM_TRKR_BETTER_AUTH_URL &&
      origin === process.env.STRM_TRKR_BETTER_AUTH_URL
    )
      return true;
    return false;
  },
  plugins: [
    nextCookies(),
    jwt({
      jwt: {
        issuer: process.env.STRM_TRKR_BETTER_AUTH_URL,
        expirationTime: "15m",
      },
    }),
  ],
});
