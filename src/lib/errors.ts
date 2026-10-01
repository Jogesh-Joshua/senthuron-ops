// src/lib/errors.ts
// Typed error classes for the service layer. Server-only.

export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
    public readonly fieldErrors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request") {
    super("BAD_REQUEST", 400, message);
  }
}

export class ForbiddenOriginError extends AppError {
  constructor() {
    super("FORBIDDEN_ORIGIN", 403, "Cross-origin requests are not allowed.");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super("NOT_FOUND", 404, message);
  }
}

export class ValidationError extends AppError {
  constructor(
    message = "Please correct the highlighted fields.",
    fieldErrors?: Record<string, string[]>
  ) {
    super("VALIDATION_ERROR", 422, message, fieldErrors);
  }
}

export class InternalError extends AppError {
  constructor(message = "Something went wrong. Please try again.") {
    super("INTERNAL_ERROR", 500, message);
  }
}
