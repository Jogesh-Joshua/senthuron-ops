// src/lib/validation/enquiry.ts
// Zod schemas for enquiry create, update, and list query.
// These are the authoritative validation rules — used on both server and client.

import { z } from "zod";
import { dateOnlySchema, emailSchema, optionalText, phoneSchema } from "./shared";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  OPEN_STATUSES,
} from "@/lib/constants";
import { todayString } from "@/lib/dates";

// ─── Enum sets (derived from constants so they cannot drift from the DB) ───────

const STATUS_VALUES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "WON",
  "LOST",
] as const;

const SOURCE_VALUES = [
  "WHATSAPP",
  "INSTAGRAM",
  "EMAIL",
  "WEBSITE",
  "REFERRAL",
  "DIRECT",
  "OTHER",
] as const;

const SERVICE_VALUES = [
  "WEB_DEVELOPMENT",
  "MOBILE_APP",
  "UI_UX_DESIGN",
  "CUSTOM_SOFTWARE",
  "MAINTENANCE_SUPPORT",
  "CONSULTING",
  "OTHER",
] as const;

// ─── Base field rules (§8.2) ──────────────────────────────────────────────────

export const enquiryFieldsSchema = z.object({
  clientName: z
    .string()
    .trim()
    .min(2, "Enter the client or company name (at least 2 characters).")
    .max(120, "Client name must be 120 characters or fewer."),

  contactPerson: z
    .string()
    .trim()
    .min(2, "Enter the contact person's name (at least 2 characters).")
    .max(100, "Contact person name must be 100 characters or fewer."),

  email: emailSchema,
  phone: phoneSchema,

  source: z.enum(SOURCE_VALUES, {
    error: "Choose where this enquiry came from.",
  }),

  service: z.enum(SERVICE_VALUES, {
    error: "Choose a service.",
  }),

  description: z
    .string()
    .trim()
    .min(10, "Describe the requirement in at least 10 characters.")
    .max(2000, "Description must be 2000 characters or fewer."),

  budget: z
    .union([
      z.number().int("Enter a budget as a whole number.").min(0).max(999_999_999),
      z.string().transform((v) => (v.trim() === "" ? null : parseInt(v, 10))),
      z.null(),
    ])
    .optional()
    .nullable()
    .refine(
      (v) => v === null || v === undefined || (Number.isInteger(v) && v >= 0 && v <= 999_999_999),
      "Enter a budget as a whole number (0 – 999,999,999)."
    ),

  status: z.enum(STATUS_VALUES, {
    error: "Choose a valid status.",
  }),

  assignedToId: z
    .string()
    .nullable()
    .optional(),

  nextFollowUpAt: dateOnlySchema,

  notes: optionalText(2000),
});

// ─── Create schema — stricter on follow-up date ───────────────────────────────

export const createEnquirySchema = enquiryFieldsSchema
  .extend({
    status: z.enum(STATUS_VALUES).optional().default("NEW"),
  })
  .superRefine((data, ctx) => {
    // email or phone required
    if (!data.email && !data.phone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add an email or a phone number so you can reach them.",
        path: ["email"],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add an email or a phone number so you can reach them.",
        path: ["phone"],
      });
    }

    // follow-up must not be in the past on create
    if (data.nextFollowUpAt) {
      const today = todayString();
      if (data.nextFollowUpAt < today) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Choose today or a future date.",
          path: ["nextFollowUpAt"],
        });
      }
    }
  });

// ─── Update schema — all fields optional, closingNote allowed ─────────────────

export const updateEnquirySchema = enquiryFieldsSchema
  .partial()
  .extend({
    /**
     * closingNote is accepted alongside status only.
     * It is stored on the STATUS_CHANGED activity entry, not on the enquiry.
     */
    closingNote: optionalText(500),
  })
  .superRefine((data, ctx) => {
    // closingNote requires status
    if (data.closingNote && !data.status) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A closing note can only be provided when changing status.",
        path: ["closingNote"],
      });
    }
  });

// ─── List query schema — coerces URL search params safely ─────────────────────

const STATUS_WITH_OPEN = [...STATUS_VALUES, "OPEN"] as const;
const DUE_VALUES = ["ANY", "OVERDUE", "TODAY", "NEXT7", "NONE"] as const;
const SORT_VALUES = ["followup", "updated", "newest", "budget"] as const;

export const listQuerySchema = z.object({
  q: z.string().max(100).optional(),

  status: z.enum(STATUS_WITH_OPEN).optional(),

  source: z.enum(SOURCE_VALUES).optional(),

  assignee: z.string().optional(), // team member id or "UNASSIGNED"

  due: z.enum(DUE_VALUES).optional().default("ANY"),

  sort: z.enum(SORT_VALUES).optional().default("followup"),

  page: z.coerce
    .number()
    .int()
    .min(1)
    .optional()
    .default(1),

  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .optional()
    .default(DEFAULT_PAGE_SIZE),
});

// ─── Inferred TypeScript types ────────────────────────────────────────────────

export type CreateEnquiryInput = z.infer<typeof createEnquirySchema>;
export type UpdateEnquiryInput = z.infer<typeof updateEnquirySchema>;
export type ListQuery = z.infer<typeof listQuerySchema>;
export type EnquiryStatus = (typeof STATUS_VALUES)[number];
export type EnquirySource = (typeof SOURCE_VALUES)[number];

// ─── Helper — used by the service to expand "OPEN" into individual statuses ───
export { OPEN_STATUSES };
