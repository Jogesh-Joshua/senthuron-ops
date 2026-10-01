// src/app/api/enquiries/route.ts
// GET  /api/enquiries  — list with search, filters, sort, pagination
// POST /api/enquiries  — create an enquiry

import { withErrorHandling, ok, fail, assertSameOrigin } from "@/lib/api-response";
import { listEnquiries, createEnquiry } from "@/lib/services/enquiry.service";
import { listQuerySchema, createEnquirySchema } from "@/lib/validation/enquiry";
import { BadRequestError } from "@/lib/errors";

// ─── GET /api/enquiries ────────────────────────────────────────────────────────

export const GET = withErrorHandling(async (req) => {
  const { searchParams } = new URL(req.url);

  // Convert URLSearchParams to a plain object for Zod
  const raw: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    raw[key] = value;
  });

  const parsed = listQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return fail(
      "BAD_REQUEST",
      "Invalid query parameters.",
      400,
      parsed.error.flatten().fieldErrors as Record<string, string[]>
    );
  }

  const result = await listEnquiries(parsed.data);
  return ok(result);
});

// ─── POST /api/enquiries ───────────────────────────────────────────────────────

export const POST = withErrorHandling(async (req) => {
  assertSameOrigin(req);

  // Require application/json
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

  // Server-side validation (authoritative)
  const parsed = createEnquirySchema.safeParse(body);
  if (!parsed.success) {
    return fail(
      "VALIDATION_ERROR",
      "Please correct the highlighted fields.",
      422,
      parsed.error.flatten().fieldErrors as Record<string, string[]>
    );
  }

  const enquiry = await createEnquiry(parsed.data);
  return ok(enquiry, 201);
});
