// src/lib/validation/shared.ts
// Reusable Zod field rules shared by all validation schemas.

import { z } from "zod";

/**
 * A YYYY-MM-DD calendar date string.
 * Validates that the date is real (no 2026-02-30 etc.).
 */
export const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date in YYYY-MM-DD format.")
  .refine((s) => {
    const d = new Date(s + "T00:00:00Z");
    return !isNaN(d.getTime()) && d.toISOString().startsWith(s);
  }, "Enter a valid calendar date.")
  .nullable()
  .optional();

/** Phone: allows digits, spaces, +, -, (, ) */
export const phoneSchema = z
  .string()
  .transform((v) => (v.trim() === "" ? null : v.trim()))
  .pipe(
    z
      .string()
      .regex(
        /^[+\d\s\-()]+$/,
        "Phone may only contain digits, spaces, +, -, ( and )."
      )
      .refine(
        (v) => v.replace(/\D/g, "").length >= 7,
        "Enter at least 7 digits."
      )
      .refine(
        (v) => v.replace(/\D/g, "").length <= 15,
        "Phone number is too long (max 15 digits)."
      )
      .nullable()
  )
  .nullable()
  .optional();

/** Email — optional but must be valid if present */
export const emailSchema = z
  .string()
  .transform((v) => (v.trim() === "" ? null : v.trim().toLowerCase()))
  .pipe(
    z
      .string()
      .email("Enter a valid email address.")
      .max(254, "Email is too long.")
      .nullable()
  )
  .nullable()
  .optional();

/** Text field that converts empty string → null */
export const optionalText = (max: number) =>
  z
    .string()
    .transform((v) => (v.trim() === "" ? null : v.trim()))
    .pipe(z.string().max(max).nullable())
    .nullable()
    .optional();
