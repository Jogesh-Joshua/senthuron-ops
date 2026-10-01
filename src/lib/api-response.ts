// src/lib/api-response.ts
// Route handler helpers. Server-only.

import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "@/lib/errors";

interface ApiSuccess<T> {
  data: T;
}

interface ApiError {
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
    requestId?: string;
  };
}

/** Wrap a successful response in the standard envelope */
export function ok<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ data }, { status, headers: noStore() });
}

/** Wrap an error in the standard envelope */
export function fail(
  code: string,
  message: string,
  status: number,
  fieldErrors?: Record<string, string[]>
): NextResponse<ApiError> {
  const requestId = crypto.randomUUID().slice(0, 8);
  return NextResponse.json(
    { error: { code, message, ...(fieldErrors ? { fieldErrors } : {}), requestId } },
    { status, headers: noStore() }
  );
}

/** Cache-Control headers for all API responses */
function noStore() {
  return { "Cache-Control": "no-store" };
}

type RouteHandler = (
  req: Request,
  ctx: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

/**
 * Wraps a route handler with unified error handling.
 * - ZodError → 422 with field errors
 * - AppError → its status/code
 * - Prisma P2025 → 404
 * - Anything else → generic 500 with requestId logged server-side
 */
export function withErrorHandling(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof ZodError) {
        return fail(
          "VALIDATION_ERROR",
          "Please correct the highlighted fields.",
          422,
          err.flatten().fieldErrors as Record<string, string[]>
        );
      }

      if (err instanceof AppError) {
        return fail(err.code, err.message, err.status, err.fieldErrors);
      }

      // Prisma known errors
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code: string }).code === "P2025"
      ) {
        return fail("NOT_FOUND", "Record not found.", 404);
      }

      // Unexpected — log with request ID but return generic message
      const requestId = crypto.randomUUID().slice(0, 8);
      console.error(
        JSON.stringify({
          level: "error",
          requestId,
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
        })
      );
      return fail(
        "INTERNAL_ERROR",
        "Something went wrong. Please try again.",
        500
      );
    }
  };
}

/**
 * Asserts that a mutating request (POST/PATCH) comes from the same origin.
 * Throws ForbiddenOriginError if not.
 */
export function assertSameOrigin(req: Request): void {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin && host && !origin.endsWith(host)) {
    const { ForbiddenOriginError } = require("@/lib/errors");
    throw new ForbiddenOriginError();
  }
}
