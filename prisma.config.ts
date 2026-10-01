// prisma.config.ts
// Prisma 7 CLI configuration.
// Loads .env.local first (Next.js convention), then .env.
// DIRECT_URL  — non-pooled Neon connection. Used by Prisma CLI (migrate/seed).
// DATABASE_URL — pooled Neon connection. Used at runtime by PrismaClient.
// If only DATABASE_URL is set (pooled), the CLI will still work — Neon's
// pooler supports DDL statements on single-connection sessions.

import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: ".env.local" });
config(); // .env fallback (dotenv never overrides values already set)

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "" },
});
