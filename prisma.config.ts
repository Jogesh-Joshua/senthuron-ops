// prisma.config.ts
// Prisma 7 CLI configuration.
// Loads .env.local first (Next.js convention), then .env.
// DIRECT_URL  — non-pooled Neon connection. Used by Prisma CLI (migrate/seed).
// DATABASE_URL — pooled Neon connection. Used at runtime by PrismaClient.
// If only DATABASE_URL is set (pooled), the CLI will still work — Neon's
// pooler supports DDL statements on single-connection sessions.

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// Manually parse .env.local so dotenv doesn't need to know the filename
function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

// Load .env.local then .env (Next.js precedence)
loadEnvFile(resolve(process.cwd(), ".env.local"));
loadEnvFile(resolve(process.cwd(), ".env"));

import { defineConfig } from "prisma/config";

// Use DIRECT_URL if provided; otherwise fall back to DATABASE_URL.
// For Neon: remove "-pooler" from the host to derive the direct URL.
const migrationUrl =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL?.replace("-pooler", "") ??
  "";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: migrationUrl,
  },
});
