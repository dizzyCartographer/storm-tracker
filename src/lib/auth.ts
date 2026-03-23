import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { authPrisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(authPrisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  secret: process.env.STRM_TRKR_BETTER_AUTH_SECRET,
  baseURL: process.env.STRM_TRKR_BETTER_AUTH_URL,
  trustedOrigins: process.env.STRM_TRKR_BETTER_AUTH_URL
    ? [process.env.STRM_TRKR_BETTER_AUTH_URL]
    : [],
  plugins: [nextCookies()],
});
