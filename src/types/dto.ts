// src/types/dto.ts
// Data Transfer Objects — plain serialisable shapes returned by the API.
// All types are derived from Zod or manually composed; no Prisma types leak here.

import type { FollowUpState } from "@/lib/constants";

// ─── Shared sub-objects ───────────────────────────────────────────────────────

export interface AssigneeRef {
  id: string;
  name: string;
}

export interface ActivityDTO {
  id: string;
  type:
    | "CREATED"
    | "STATUS_CHANGED"
    | "FOLLOW_UP_CHANGED"
    | "ASSIGNEE_CHANGED"
    | "DETAILS_UPDATED";
  fromValue: string | null;
  toValue: string | null;
  note: string | null;
  createdAt: string; // ISO timestamp
  actorName: string | null;
}

// ─── Enquiry DTO (full record) ────────────────────────────────────────────────

export interface EnquiryDTO {
  id: string;
  number: number;
  reference: string; // "ENQ-0042"

  clientName: string;
  contactPerson: string;
  email: string | null;
  phone: string | null;

  source:
    | "WHATSAPP"
    | "INSTAGRAM"
    | "EMAIL"
    | "WEBSITE"
    | "REFERRAL"
    | "DIRECT"
    | "OTHER";
  service:
    | "WEB_DEVELOPMENT"
    | "MOBILE_APP"
    | "UI_UX_DESIGN"
    | "CUSTOM_SOFTWARE"
    | "MAINTENANCE_SUPPORT"
    | "CONSULTING"
    | "OTHER";
  description: string;
  budget: number | null;

  status:
    | "NEW"
    | "CONTACTED"
    | "QUALIFIED"
    | "PROPOSAL_SENT"
    | "NEGOTIATION"
    | "WON"
    | "LOST";
  assignedTo: AssigneeRef | null;
  nextFollowUpAt: string | null; // "YYYY-MM-DD"
  followUpState: FollowUpState;
  followUpDays: number | null;
  notes: string | null;

  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

// ─── Enquiry list item (omits description & notes for compactness) ─────────────

export type EnquiryListItem = Omit<EnquiryDTO, "description" | "notes">;

// ─── Enquiry detail (full DTO + activities) ───────────────────────────────────

export interface EnquiryDetailDTO extends EnquiryDTO {
  activities: ActivityDTO[];
}

// ─── List response ────────────────────────────────────────────────────────────

export interface StatusCounts {
  NEW: number;
  CONTACTED: number;
  QUALIFIED: number;
  PROPOSAL_SENT: number;
  NEGOTIATION: number;
  WON: number;
  LOST: number;
}

export interface EnquiryListResponse {
  items: EnquiryListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  statusCounts: StatusCounts;
}

// ─── API error envelope ───────────────────────────────────────────────────────

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
    requestId?: string;
  };
}
