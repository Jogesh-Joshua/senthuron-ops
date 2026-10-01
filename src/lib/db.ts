import "server-only";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma";

// Prisma 7 requires a driver adapter — the binary query engine is gone.
// We use @prisma/adapter-pg (pg Pool) with the pooled Neon connection string.
// The singleton pattern prevents connection pool exhaustion during Next.js HMR.

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

function createClient(): PrismaClient {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5, // stay within Neon's free-tier connection limits
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  });

  const adapter = new PrismaPg(pool);

  const client = new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["warn", "error"],
  });

  // Store the pool reference so we can reuse it in dev across HMR reloads
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pgPool = pool;
  }

  return client;
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
