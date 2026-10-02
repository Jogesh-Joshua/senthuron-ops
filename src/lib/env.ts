import "server-only";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().min(1, "DIRECT_URL is required").optional(),
  APP_TIMEZONE: z.string().default("Asia/Kolkata"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL is required"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
});

// Validate at import time — fails fast with a clear message if misconfigured
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:\n",
    parsed.error.flatten().fieldErrors
  );
  throw new Error("Invalid environment variables. Check .env.local.");
}

export const env = parsed.data;
