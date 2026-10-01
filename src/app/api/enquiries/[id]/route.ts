// src/app/api/enquiries/[id]/route.ts
// GET   /api/enquiries/[id]  — single enquiry with activities
// PUT   /api/enquiries/[id]  — full or partial update (PATCH semantics)
//
// Note: Next.js 16 dynamic params are Promises. Always await them.

import {
  withErrorHandling,
  ok,
  fail,
  assertSameOrigin,
} from "@/lib/api-response";
import { getEnquiry, updateEnquiry } from "@/lib/services/enquiry.service";
import { updateEnquirySchema } from "@/lib/validation/enquiry";
import { BadRequestError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

// ─── GET /api/enquiries/[id] ──────────────────────────────────────────────────

export const GET = withErrorHandling(async (_req, ctx) => {
  const { id } = await ctx.params;

  if (!id || typeof id !== "string") {
    return fail("NOT_FOUND", "Enquiry not found.", 404);
  }

  const enquiry = await getEnquiry(id);
  return ok(enquiry);
});

// ─── PUT /api/enquiries/[id] ──────────────────────────────────────────────────
// We accept PUT (semantically a full replace from the spec request) but apply
// PATCH semantics in the service — only provided fields are overwritten.

export const PUT = withErrorHandling(async (req, ctx) => {
  assertSameOrigin(req);

  const { id } = await ctx.params;

  if (!id || typeof id !== "string") {
    return fail("NOT_FOUND", "Enquiry not found.", 404);
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return fail(
      "UNSUPPORTED_MEDIA_TYPE",
      "Request body must be application/json.",
      415
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new BadRequestError("Request body is not valid JSON.");
  }

  const parsed = updateEnquirySchema.safeParse(body);
  if (!parsed.success) {
    return fail(
      "VALIDATION_ERROR",
      "Please correct the highlighted fields.",
      422,
      parsed.error.flatten().fieldErrors as Record<string, string[]>
    );
  }

  const enquiry = await updateEnquiry(id, parsed.data);
  return ok(enquiry);
});

// Also support PATCH for clients that send partial updates correctly
export const PATCH = PUT;
