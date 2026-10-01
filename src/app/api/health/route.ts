// src/app/api/health/route.ts
import { ok, withErrorHandling } from "@/lib/api-response";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async () => {
  const count = await prisma.teamMember.count();
  return ok({ status: "ok", teamMemberCount: count });
});
