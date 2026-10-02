import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { prisma } from "./db";
import { env } from "./env";
import { APIError } from "better-auth/api";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
  },
  socialProviders: {
    google: env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    } : undefined,
  },
  session: {
    expiresIn: 7 * 24 * 60 * 60, // 7 days
    updateAge: 24 * 60 * 60,     // 1 day
  },
  trustedOrigins: env.NODE_ENV === "production" 
    ? [env.BETTER_AUTH_URL] 
    : ["http://localhost:3000"],
});
