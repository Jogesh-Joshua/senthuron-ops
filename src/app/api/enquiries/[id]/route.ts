// src/app/api/enquiries/[id]/route.ts
// GET   /api/enquiries/[id]  — single enquiry with activities
// PUT   /api/enquiries/[id]  — full or partial update (PATCH semantics)
//
// Note: Next.js 16 dynamic params are Promises. Always await them.

import {
  withErrorHandling,
  ok,
  fail,
  readJson,
} from "@/lib/api-response";
import { getEnquiry, updateEnquiry } from "@/lib/services/enquiry.service";
import { updateEnquirySchema } from "@/lib/validation/enquiry";
import { requireUser } from "@/lib/auth-guard";

// ─── GET /api/enquiries/[id] ──────────────────────────────────────────────────

export const GET = withErrorHandling(async (_req, ctx) => {
  const { id } = await ctx.params;

  if (!id || typeof id !== "string") {
    return fail("NOT_FOUND", "Enquiry not found.", 404);
  }

  const enquiry = await getEnquiry(id);
  return ok(enquiry);
});

// ─── PATCH /api/enquiries/[id] ────────────────────────────────────────────────
// Partial update semantics.

export const PATCH = withErrorHandling(async (req, ctx) => {
  const { id } = await ctx.params;

  if (!id || typeof id !== "string") {
    return fail("NOT_FOUND", "Enquiry not found.", 404);
  }

  const actor = await requireUser(req);
  const input = updateEnquirySchema.parse(await readJson(req));
  const enquiry = await updateEnquiry(id, input, actor);
  return ok(enquiry);
});

export const PUT = PATCH;
