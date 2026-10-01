// src/app/api/enquiries/route.ts
// GET  /api/enquiries  — list with search, filters, sort, pagination
// POST /api/enquiries  — create an enquiry

import { withErrorHandling, ok, fail, readJson } from "@/lib/api-response";
import { listEnquiries, createEnquiry } from "@/lib/services/enquiry.service";
import { listQuerySchema, createEnquirySchema } from "@/lib/validation/enquiry";

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
  const input = createEnquirySchema.parse(await readJson(req));
  const enquiry = await createEnquiry(input);
  return ok(enquiry, 201);
});
