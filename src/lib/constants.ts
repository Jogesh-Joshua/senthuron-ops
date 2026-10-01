// src/lib/constants.ts
// Shared constants — safe to import in both server and client code.

import type {
  EnquiryStatus,
  EnquirySource,
  ServiceType,
} from "@/generated/prisma";

// ─── Currency & timezone ─────────────────────────────────────────────────────

/** ISO 4217 currency code used throughout the app */
export const CURRENCY_CODE = "INR";
/** Currency symbol shown in the UI */
export const CURRENCY_SYMBOL = "₹";
/** The business timezone for all "today" calculations */
export const BUSINESS_TIMEZONE = process.env.APP_TIMEZONE ?? "Asia/Kolkata";

// ─── Pagination ───────────────────────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 15;
export const MAX_PAGE_SIZE = 50;

// ─── Enquiry status ──────────────────────────────────────────────────────────

/** Statuses that count as "open" in pipeline queries */
export const OPEN_STATUSES: EnquiryStatus[] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL_SENT",
  "NEGOTIATION",
];

/** Terminal statuses */
export const CLOSED_STATUSES: EnquiryStatus[] = ["WON", "LOST"];

/** Ordered status stages for the pipeline track */
export const STATUS_ORDER: EnquiryStatus[] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "WON",
  "LOST",
];

/** Human-readable labels for each status */
export const STATUS_LABELS: Record<EnquiryStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  PROPOSAL_SENT: "Proposal Sent",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
};

// ─── Source labels ────────────────────────────────────────────────────────────

export const SOURCE_LABELS: Record<EnquirySource, string> = {
  WHATSAPP: "WhatsApp",
  INSTAGRAM: "Instagram",
  EMAIL: "Email",
  WEBSITE: "Website",
  REFERRAL: "Referral",
  DIRECT: "Direct",
  OTHER: "Other",
};

// ─── Service labels ───────────────────────────────────────────────────────────

export const SERVICE_LABELS: Record<ServiceType, string> = {
  WEB_DEVELOPMENT: "Web Development",
  MOBILE_APP: "Mobile App",
  UI_UX_DESIGN: "UI / UX Design",
  CUSTOM_SOFTWARE: "Custom Software",
  MAINTENANCE_SUPPORT: "Maintenance & Support",
  CONSULTING: "Consulting",
  OTHER: "Other",
};

// ─── Follow-up state ──────────────────────────────────────────────────────────

export type FollowUpState =
  | "OVERDUE"
  | "TODAY"
  | "UPCOMING"
  | "NONE"
  | "CLOSED";

// ─── Sort options ─────────────────────────────────────────────────────────────

export type SortOption = "followup" | "updated" | "newest" | "budget";

export const SORT_LABELS: Record<SortOption, string> = {
  followup: "Follow-up (soonest)",
  updated: "Recently updated",
  newest: "Newest",
  budget: "Budget (high → low)",
};

// ─── Due filter options ───────────────────────────────────────────────────────

export type DueFilter = "ANY" | "OVERDUE" | "TODAY" | "NEXT7" | "NONE";

export const DUE_LABELS: Record<DueFilter, string> = {
  ANY: "Any",
  OVERDUE: "Overdue",
  TODAY: "Due today",
  NEXT7: "Next 7 days",
  NONE: "Not set",
};
