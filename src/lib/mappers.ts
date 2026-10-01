// src/lib/mappers.ts
// Converts Prisma rows to API DTOs. Must not query the database.
// All fields are explicitly whitelisted — nothing leaks accidentally.

import { computeFollowUpState, computeFollowUpDays } from "@/lib/dates";
import { CLOSED_STATUSES } from "@/lib/constants";
import type {
  EnquiryDTO,
  EnquiryListItem,
  EnquiryDetailDTO,
  ActivityDTO,
} from "@/types/dto";
import { formatReference } from "@/lib/format";

// ─── Types for the Prisma row shapes we accept ────────────────────────────────

type PrismaEnquiry = {
  id: string;
  number: number;
  clientName: string;
  contactPerson: string;
  email: string | null;
  phone: string | null;
  source: string;
  service: string;
  description: string;
  budget: number | null;
  status: string;
  assignedTo: { id: string; name: string } | null;
  nextFollowUpAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type PrismaActivity = {
  id: string;
  type: string;
  fromValue: string | null;
  toValue: string | null;
  note: string | null;
  createdAt: Date;
};

// ─── Formatters ───────────────────────────────────────────────────────────────



/** Formats a Date-only DB value to "YYYY-MM-DD" */
function toDateString(d: Date | null): string | null {
  if (!d) return null;
  return d.toISOString().slice(0, 10);
}

// ─── Enquiry → DTO ────────────────────────────────────────────────────────────

export function toEnquiryDTO(row: PrismaEnquiry): EnquiryDTO {
  const isClosed = CLOSED_STATUSES.includes(row.status as never);

  return {
    id: row.id,
    number: row.number,
    reference: formatReference(row.number),

    clientName: row.clientName,
    contactPerson: row.contactPerson,
    email: row.email,
    phone: row.phone,

    source: row.source as EnquiryDTO["source"],
    service: row.service as EnquiryDTO["service"],
    description: row.description,
    budget: row.budget,

    status: row.status as EnquiryDTO["status"],
    assignedTo: row.assignedTo
      ? { id: row.assignedTo.id, name: row.assignedTo.name }
      : null,
    nextFollowUpAt: toDateString(row.nextFollowUpAt),
    followUpState: computeFollowUpState(row.nextFollowUpAt, isClosed),
    followUpDays: computeFollowUpDays(row.nextFollowUpAt),
    notes: row.notes,

    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ─── Enquiry → List item (omits description & notes) ─────────────────────────

export function toEnquiryListItem(row: PrismaEnquiry): EnquiryListItem {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { description, notes, ...rest } = toEnquiryDTO(row);
  return rest;
}

// ─── Enquiry + activities → Detail DTO ───────────────────────────────────────

export function toEnquiryDetailDTO(
  row: PrismaEnquiry & { activities: PrismaActivity[] }
): EnquiryDetailDTO {
  return {
    ...toEnquiryDTO(row),
    activities: row.activities.map(toActivityDTO),
  };
}

// ─── Activity → DTO ───────────────────────────────────────────────────────────

export function toActivityDTO(row: PrismaActivity): ActivityDTO {
  return {
    id: row.id,
    type: row.type as ActivityDTO["type"],
    fromValue: row.fromValue,
    toValue: row.toValue,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
  };
}
