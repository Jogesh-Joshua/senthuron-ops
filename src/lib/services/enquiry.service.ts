// src/lib/services/enquiry.service.ts
// All database access for enquiries. Route handlers and Server Components call
// these functions only — Prisma is never imported outside this file and db.ts.

import "server-only";
import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { CLOSED_STATUSES, OPEN_STATUSES } from "@/lib/constants";
import { todayString, toDateOnly } from "@/lib/dates";
import {
  toEnquiryDTO,
  toEnquiryListItem,
  toEnquiryDetailDTO,
} from "@/lib/mappers";
import { extractDigits } from "@/lib/format";
import type {
  CreateEnquiryInput,
  UpdateEnquiryInput,
  ListQuery,
} from "@/lib/validation/enquiry";
import type {
  EnquiryDTO,
  EnquiryDetailDTO,
  EnquiryListResponse,
  StatusCounts,
} from "@/types/dto";

// ─── Prisma select shape — used for all enquiry queries ──────────────────────
// Keeps selected fields consistent between list, get, and update.

const ENQUIRY_SELECT = {
  id: true,
  number: true,
  clientName: true,
  contactPerson: true,
  email: true,
  phone: true,
  source: true,
  service: true,
  description: true,
  budget: true,
  status: true,
  assignedTo: { select: { id: true, name: true } },
  nextFollowUpAt: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.EnquirySelect;

// Same shape + activities for the detail view
const ENQUIRY_DETAIL_SELECT = {
  ...ENQUIRY_SELECT,
  activities: {
    select: {
      id: true,
      type: true,
      fromValue: true,
      toValue: true,
      note: true,
      createdAt: true,
      actorName: true,
    },
    orderBy: { createdAt: "desc" as const },
    take: 50,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────



/** Builds the Prisma `where` clause from a validated list query. */
export function buildWhere(query: ListQuery): Prisma.EnquiryWhereInput {
  const where: Prisma.EnquiryWhereInput = {};
  const conditions: Prisma.EnquiryWhereInput[] = [];

  // Status filter — "OPEN" expands to all open stages
  if (query.status) {
    if (query.status === "OPEN") {
      conditions.push({ status: { in: OPEN_STATUSES } });
    } else {
      conditions.push({ status: query.status });
    }
  }

  // Source filter
  if (query.source) {
    conditions.push({ source: query.source });
  }

  // Assignee filter
  if (query.assignee) {
    if (query.assignee === "UNASSIGNED") {
      conditions.push({ assignedToId: null });
    } else {
      conditions.push({ assignedToId: query.assignee });
    }
  }

  // Due filter
  const today = toDateOnly(todayString());
  if (query.due && query.due !== "ANY") {
    switch (query.due) {
      case "OVERDUE":
        conditions.push({
          status: { in: OPEN_STATUSES },
          nextFollowUpAt: { lt: today },
        });
        break;
      case "TODAY":
        conditions.push({
          status: { in: OPEN_STATUSES },
          nextFollowUpAt: today,
        });
        break;
      case "NEXT7": {
        const next7 = new Date(today);
        next7.setUTCDate(next7.getUTCDate() + 7);
        conditions.push({
          status: { in: OPEN_STATUSES },
          nextFollowUpAt: { gte: today, lte: next7 },
        });
        break;
      }
      case "NONE":
        conditions.push({
          status: { in: OPEN_STATUSES },
          nextFollowUpAt: null,
        });
        break;
    }
  }

  // Full-text search (client, contact, email, description, phone digits)
  if (query.q) {
    const q = query.q.trim();
    const searchConditions: Prisma.EnquiryWhereInput[] = [
      { clientName: { contains: q, mode: "insensitive" } },
      { contactPerson: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];

    // Phone digit search — only meaningful when query has ≥ 3 digits
    const digits = q.replace(/\D/g, "");
    if (digits.length >= 3) {
      searchConditions.push({
        phoneDigits: { contains: digits, mode: "insensitive" },
      });
    }

    conditions.push({ OR: searchConditions });
  }

  if (conditions.length > 0) {
    where.AND = conditions;
  }

  return where;
}

/** Builds the Prisma `orderBy` from a sort option. */
function buildOrderBy(sort: ListQuery["sort"]): Prisma.EnquiryOrderByWithRelationInput[] {
  switch (sort) {
    case "updated":
      return [{ updatedAt: "desc" }, { id: "desc" }];
    case "newest":
      return [{ createdAt: "desc" }, { id: "desc" }];
    case "budget":
      return [{ budget: { sort: "desc", nulls: "last" } }, { id: "desc" }];
    case "followup":
    default:
      return [{ nextFollowUpAt: { sort: "asc", nulls: "last" } }, { id: "asc" }];
  }
}

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * List enquiries with search, filters, sort, and pagination.
 * Also returns per-status counts (without the status filter applied).
 */
export async function listEnquiries(query: ListQuery): Promise<EnquiryListResponse> {
  const where = buildWhere(query);
  const orderBy = buildOrderBy(query.sort);
  const skip = (query.page - 1) * query.pageSize;

  // whereWithoutStatus — for status counts that reflect all other filters
  const whereWithoutStatus = buildWhere({ ...query, status: undefined });

  const [rows, total, statusGroups] = await Promise.all([
    prisma.enquiry.findMany({
      where,
      select: ENQUIRY_SELECT,
      orderBy,
      skip,
      take: query.pageSize,
    }),
    prisma.enquiry.count({ where }),
    prisma.enquiry.groupBy({
      by: ["status"],
      where: whereWithoutStatus,
      _count: { _all: true },
    }),
  ]);

  // Build statusCounts with explicit zeroes for missing statuses
  const statusCounts: StatusCounts = {
    NEW: 0,
    CONTACTED: 0,
    QUALIFIED: 0,
    PROPOSAL_SENT: 0,
    NEGOTIATION: 0,
    WON: 0,
    LOST: 0,
  };
  for (const g of statusGroups) {
    statusCounts[g.status as keyof StatusCounts] = g._count._all;
  }

  return {
    items: rows.map(toEnquiryListItem),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.ceil(total / query.pageSize),
    statusCounts,
  };
}

/**
 * Get all team members for filter dropdowns, ordered by name.
 */
export async function getTeamMembers() {
  return prisma.teamMember.findMany({
    orderBy: { name: "asc" },
  });
}

/**
 * Get a single enquiry by ID, with its last 50 activities.
 * Throws NotFoundError when missing.
 */
export async function getEnquiry(id: string): Promise<EnquiryDetailDTO> {
  const row = await prisma.enquiry.findUnique({
    where: { id },
    select: ENQUIRY_DETAIL_SELECT,
  });

  if (!row) {
    throw new NotFoundError(`Enquiry not found.`);
  }

  return toEnquiryDetailDTO(row);
}

/**
 * Create a new enquiry.
 * Validates that assignedToId refers to a real team member.
 * Writes a CREATED activity in the same transaction.
 */
export type Actor = { id: string; name: string };

export async function createEnquiry(input: CreateEnquiryInput, actor: Actor): Promise<EnquiryDTO> {
  // Validate assignee exists
  if (input.assignedToId) {
    const member = await prisma.teamMember.findUnique({
      where: { id: input.assignedToId },
      select: { id: true },
    });
    if (!member) {
      throw new ValidationError("Please correct the highlighted fields.", {
        assignedToId: ["Choose a valid team member."],
      });
    }
  }

  // Won/Lost clears follow-up
  const isClosed = CLOSED_STATUSES.includes(input.status ?? "NEW");
  const nextFollowUpAt =
    isClosed ? null : (input.nextFollowUpAt ? toDateOnly(input.nextFollowUpAt) : null);

  const row = await prisma.$transaction(async (tx) => {
    const enquiry = await tx.enquiry.create({
      data: {
        clientName: input.clientName,
        contactPerson: input.contactPerson,
        email: input.email ?? null,
        phone: input.phone ?? null,
        phoneDigits: input.phone ? extractDigits(input.phone) : null,
        source: input.source,
        service: input.service,
        description: input.description,
        budget: input.budget ?? null,
        status: input.status ?? "NEW",
        assignedToId: input.assignedToId ?? null,
        nextFollowUpAt,
        notes: input.notes ?? null,
      },
      select: ENQUIRY_SELECT,
    });

    await tx.enquiryActivity.create({
      data: {
        enquiryId: enquiry.id,
        type: "CREATED",
        actorId: actor.id,
        actorName: actor.name,
      },
    });

    return enquiry;
  });

  return toEnquiryDTO(row);
}

/**
 * Partially update an enquiry.
 * Writes granular activity entries for each type of change.
 * Validates assignee existence. Enforces Won/Lost clearing follow-up.
 */
export async function updateEnquiry(
  id: string,
  input: UpdateEnquiryInput,
  actor: Actor
): Promise<EnquiryDTO> {
  const updatedRow = await prisma.$transaction(async (tx) => {
    // Load current record
    const current = await tx.enquiry.findUnique({
      where: { id },
      select: {
        ...ENQUIRY_SELECT,
        assignedTo: { select: { id: true, name: true } },
      },
    });

    if (!current) {
      throw new NotFoundError("Enquiry not found.");
    }

    // Validate assignee exists (if changing)
    let newAssigneeName: string | null = null;
    if (input.assignedToId !== undefined && input.assignedToId !== null) {
      const member = await tx.teamMember.findUnique({
      where: { id: input.assignedToId },
      select: { id: true, name: true },
    });
    if (!member) {
      throw new ValidationError("Please correct the highlighted fields.", {
        assignedToId: ["Choose a valid team member."],
      });
    }
    newAssigneeName = member.name;
  }

  // Validate email/phone constraint on merged result
  const mergedEmail = input.email !== undefined ? input.email : current.email;
  const mergedPhone = input.phone !== undefined ? input.phone : current.phone;
  if (!mergedEmail && !mergedPhone) {
    throw new ValidationError("Please correct the highlighted fields.", {
      email: ["Add an email or a phone number so you can reach them."],
      phone: ["Add an email or a phone number so you can reach them."],
    });
  }

  // Determine if status is changing to/staying closed
  const newStatus = input.status ?? current.status;
  const isClosed = CLOSED_STATUSES.includes(newStatus as never);

  // Won/Lost clears follow-up
  let newFollowUpAt: Date | null =
    input.nextFollowUpAt !== undefined
      ? input.nextFollowUpAt
        ? toDateOnly(input.nextFollowUpAt)
        : null
      : current.nextFollowUpAt;

  if (isClosed) {
    newFollowUpAt = null;
  }

  // Build the data payload
  const updateData: Prisma.EnquiryUpdateInput = {};
  if (input.clientName !== undefined) updateData.clientName = input.clientName;
  if (input.contactPerson !== undefined) updateData.contactPerson = input.contactPerson;
  if (input.email !== undefined) updateData.email = input.email ?? null;
  if (input.phone !== undefined) {
    updateData.phone = input.phone ?? null;
    updateData.phoneDigits = input.phone ? extractDigits(input.phone) : null;
  }
  if (input.source !== undefined) updateData.source = input.source;
  if (input.service !== undefined) updateData.service = input.service;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.budget !== undefined) updateData.budget = input.budget ?? null;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.assignedToId !== undefined) {
    updateData.assignedTo = input.assignedToId
      ? { connect: { id: input.assignedToId } }
      : { disconnect: true };
  }
  updateData.nextFollowUpAt = newFollowUpAt;
  if (input.notes !== undefined) updateData.notes = input.notes ?? null;

  // ─── Activity entries ─────────────────────────────────────────────────────

  const activitiesToCreate: Prisma.EnquiryActivityCreateManyInput[] = [];

  // Status changed
  if (input.status && input.status !== current.status) {
    activitiesToCreate.push({
      enquiryId: id,
      type: "STATUS_CHANGED",
      fromValue: current.status,
      toValue: input.status,
      note: input.closingNote ?? null,
    });
  }

  // Assignee changed
  const currentAssigneeId = current.assignedTo?.id ?? null;
  if (input.assignedToId !== undefined && input.assignedToId !== currentAssigneeId) {
    activitiesToCreate.push({
      enquiryId: id,
      type: "ASSIGNEE_CHANGED",
      fromValue: current.assignedTo?.name ?? null,
      toValue: newAssigneeName,
    });
  }

  // Follow-up changed (don't log if it was cleared automatically by Won/Lost)
  const prevFollowUp = current.nextFollowUpAt?.toISOString().slice(0, 10) ?? null;
  const nextFollowUp = newFollowUpAt?.toISOString().slice(0, 10) ?? null;
  const followUpChangedManually =
    input.nextFollowUpAt !== undefined && prevFollowUp !== nextFollowUp;

  if (followUpChangedManually) {
    activitiesToCreate.push({
      enquiryId: id,
      type: "FOLLOW_UP_CHANGED",
      fromValue: prevFollowUp,
      toValue: nextFollowUp,
    });
  }

  // Other detail changes (everything except status, assignee, follow-up)
  const detailFields: Array<keyof UpdateEnquiryInput> = [
    "clientName",
    "contactPerson",
    "email",
    "phone",
    "source",
    "service",
    "description",
    "budget",
    "notes",
  ];

  const changedDetailFields = detailFields.filter((f) => {
    if (!(f in input)) return false;
    const inputVal = input[f] ?? null;
    const currentVal = (current as Record<string, unknown>)[f] ?? null;
    return String(inputVal) !== String(currentVal);
  });

  if (changedDetailFields.length > 0) {
    activitiesToCreate.push({
      enquiryId: id,
      type: "DETAILS_UPDATED",
      note: changedDetailFields.join(", "),
    });
  }

    // ─── Transactional write ──────────────────────────────────────────────────

    const enquiry = await tx.enquiry.update({
      where: { id },
      data: updateData,
      select: ENQUIRY_SELECT,
    });

    if (activitiesToCreate.length > 0) {
      const withActor = activitiesToCreate.map(a => ({
        ...a,
        actorId: actor.id,
        actorName: actor.name,
      }));
      await tx.enquiryActivity.createMany({ data: withActor });
    }

    return enquiry;
  });

  return toEnquiryDTO(updatedRow);
}

/**
 * List all team members. Used by selects and the team-members endpoint.
 */
export async function listTeamMembers() {
  return prisma.teamMember.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
