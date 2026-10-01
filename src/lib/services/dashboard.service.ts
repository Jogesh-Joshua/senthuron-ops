// src/lib/services/dashboard.service.ts
// All database aggregates for the dashboard. Server-only.
// Returns plain serialisable objects — no Prisma types in return values.

import "server-only";
import { prisma } from "@/lib/db";
import { OPEN_STATUSES } from "@/lib/constants";
import { todayString, toDateOnly } from "@/lib/dates";
import { toEnquiryListItem } from "@/lib/mappers";
import type { EnquiryListItem } from "@/types/dto";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DashboardFigures {
  open: number;
  overdue: number;
  dueToday: number;
  pipelineValue: number;
  openWithoutBudget: number;
  won: number;
  lost: number;
  winRate: number | null;
  oldestOverdueDays: number | null;
}

export interface AttentionGroup {
  overdue: EnquiryListItem[];
  dueToday: EnquiryListItem[];
  noFollowUp: EnquiryListItem[];
  totalCount: number;
}

export interface StageRow {
  status: string;
  count: number;
  value: number | null;
}

export interface SourceRow {
  source: string;
  total: number;
  won: number;
}

export interface WorkloadRow {
  assignee: { id: string; name: string } | null;
  open: number;
  overdue: number;
}

export interface RecentActivityRow {
  id: string;
  type: string;
  fromValue: string | null;
  toValue: string | null;
  createdAt: string;
  enquiry: {
    id: string;
    reference: string;
    clientName: string;
  };
}

export interface DashboardData {
  asOf: string;
  figures: DashboardFigures;
  needsAttention: AttentionGroup;
  stages: StageRow[];
  sources: SourceRow[];
  workload: WorkloadRow[];
  recentActivity: RecentActivityRow[];
}

// ─── Shared select shapes ─────────────────────────────────────────────────────

const LIST_ITEM_SELECT = {
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
} as const;

// ─── Helper ───────────────────────────────────────────────────────────────────

function makeReference(n: number) {
  return `ENQ-${String(n).padStart(4, "0")}`;
}

// ─── Main service function ────────────────────────────────────────────────────

export async function getDashboardData(): Promise<DashboardData> {
  const today = toDateOnly(todayString());
  const next7 = new Date(today);
  next7.setUTCDate(next7.getUTCDate() + 7);

  // ── Run all queries in parallel ───────────────────────────────────────────

  const [
    openCount,
    overdueRows,
    dueTodayRows,
    pipelineAgg,
    openWithoutBudget,
    wonCount,
    lostCount,
    overdueAttention,
    dueTodayAttention,
    noFollowUpAttention,
    totalAttentionCount,
    stageGroups,
    sourceGroups,
    workloadGroups,
    recentActivities,
    wonBySource,
    allMembers,
    overdueByAssignee,
  ] = await Promise.all([
    // 1. Count of open enquiries
    prisma.enquiry.count({ where: { status: { in: OPEN_STATUSES } } }),

    // 2. Overdue open enquiries (for figures)
    prisma.enquiry.findMany({
      where: { status: { in: OPEN_STATUSES }, nextFollowUpAt: { lt: today } },
      select: { nextFollowUpAt: true },
      orderBy: { nextFollowUpAt: "asc" },
    }),

    // 3. Due today (for figures)
    prisma.enquiry.findMany({
      where: { status: { in: OPEN_STATUSES }, nextFollowUpAt: today },
      select: { id: true },
    }),

    // 4. Pipeline value + open budget count
    prisma.enquiry.aggregate({
      where: { status: { in: OPEN_STATUSES } },
      _sum: { budget: true },
    }),

    // 5. Open without budget
    prisma.enquiry.count({
      where: { status: { in: OPEN_STATUSES }, budget: null },
    }),

    // 6. Won count (all-time)
    prisma.enquiry.count({ where: { status: "WON" } }),

    // 7. Lost count (all-time)
    prisma.enquiry.count({ where: { status: "LOST" } }),

    // 8. Needs attention — overdue (up to 5)
    prisma.enquiry.findMany({
      where: { status: { in: OPEN_STATUSES }, nextFollowUpAt: { lt: today } },
      select: LIST_ITEM_SELECT,
      orderBy: { nextFollowUpAt: "asc" },
      take: 5,
    }),

    // 9. Needs attention — due today (up to 4)
    prisma.enquiry.findMany({
      where: { status: { in: OPEN_STATUSES }, nextFollowUpAt: today },
      select: LIST_ITEM_SELECT,
      orderBy: { updatedAt: "desc" },
      take: 4,
    }),

    // 10. Needs attention — no follow-up (open, up to 4)
    prisma.enquiry.findMany({
      where: { status: { in: OPEN_STATUSES }, nextFollowUpAt: null },
      select: LIST_ITEM_SELECT,
      orderBy: { updatedAt: "desc" },
      take: 4,
    }),

    // 11. Total attention count (uncapped, for "View all n" link)
    prisma.enquiry.count({
      where: {
        status: { in: OPEN_STATUSES },
        OR: [
          { nextFollowUpAt: { lt: today } },
          { nextFollowUpAt: today },
          { nextFollowUpAt: null },
        ],
      },
    }),

    // 12. Pipeline by stage (open stages only, grouped)
    prisma.enquiry.groupBy({
      by: ["status"],
      where: { status: { in: OPEN_STATUSES } },
      _count: { _all: true },
      _sum: { budget: true },
    }),

    // 13. By source — all enquiries
    prisma.enquiry.groupBy({
      by: ["source"],
      _count: { _all: true },
    }),

    // 14. Workload by assignee
    prisma.enquiry.groupBy({
      by: ["assignedToId"],
      where: { status: { in: OPEN_STATUSES } },
      _count: { _all: true },
    }),

    // 15. Recent activity (last 8)
    prisma.enquiryActivity.findMany({
      select: {
        id: true,
        type: true,
        fromValue: true,
        toValue: true,
        createdAt: true,
        enquiry: { select: { id: true, number: true, clientName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    // 16. Won count by source
    prisma.enquiry.groupBy({
      by: ["source"],
      where: { status: "WON" },
      _count: { _all: true },
    }),

    // 17. All team members (for workload names)
    prisma.teamMember.findMany({
      select: { id: true, name: true },
    }),

    // 18. Overdue count by assignee (for workload)
    prisma.enquiry.groupBy({
      by: ["assignedToId"],
      where: {
        status: { in: OPEN_STATUSES },
        nextFollowUpAt: { lt: today },
      },
      _count: { _all: true },
    }),
  ]);

  // ── Assignee names for workload rows ─────────────────────────────────────
  const assigneeMap = new Map<string, string>();
  allMembers.forEach((m) => assigneeMap.set(m.id, m.name));

  // ── Overdue count for each assignee (workload) ────────────────────────────
  const overdueAssigneeMap = new Map<string | null, number>();
  overdueByAssignee.forEach((g) => {
    overdueAssigneeMap.set(g.assignedToId, g._count._all);
  });

  // ── Cap attention list at 8 total ─────────────────────────────────────────
  const attentionItems: EnquiryListItem[] = [];
  for (const row of overdueAttention) {
    if (attentionItems.length >= 8) break;
    attentionItems.push(toEnquiryListItem(row));
  }
  const dueTodayMapped = dueTodayAttention.map(toEnquiryListItem);
  const noFollowUpMapped = noFollowUpAttention.map(toEnquiryListItem);

  // ── Figures ───────────────────────────────────────────────────────────────
  const overdueDays = overdueRows.map((r) => {
    if (!r.nextFollowUpAt) return 0;
    const diff = today.getTime() - r.nextFollowUpAt.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  });
  const oldestOverdueDays =
    overdueDays.length > 0 ? Math.max(...overdueDays) : null;

  const won = wonCount;
  const lost = lostCount;
  const winRate = won + lost > 0 ? won / (won + lost) : null;

  const figures: DashboardFigures = {
    open: openCount,
    overdue: overdueRows.length,
    dueToday: dueTodayRows.length,
    pipelineValue: pipelineAgg._sum.budget ?? 0,
    openWithoutBudget,
    won,
    lost,
    winRate,
    oldestOverdueDays,
  };

  // ── Stage rows (in pipeline order) ───────────────────────────────────────
  const stageOrder = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION"];
  const stageMap = new Map(
    stageGroups.map((g) => [g.status, { count: g._count._all, value: g._sum.budget ?? null }])
  );
  const stages: StageRow[] = stageOrder.map((s) => ({
    status: s,
    count: stageMap.get(s as import("@/generated/prisma").EnquiryStatus)?.count ?? 0,
    value: stageMap.get(s as import("@/generated/prisma").EnquiryStatus)?.value ?? null,
  }));
  // Add Won/Lost summary
  stages.push({ status: "WON", count: won, value: null });
  stages.push({ status: "LOST", count: lost, value: null });

  // ── Source rows (sorted by total desc) ────────────────────────────────────
  const wonSourceMap = new Map(wonBySource.map((g) => [g.source, g._count._all]));
  const sources: SourceRow[] = sourceGroups
    .map((g) => ({
      source: g.source,
      total: g._count._all,
      won: wonSourceMap.get(g.source) ?? 0,
    }))
    .sort((a, b) => b.total - a.total);

  // ── Workload rows ─────────────────────────────────────────────────────────
  const workload: WorkloadRow[] = workloadGroups
    .map((g) => ({
      assignee: g.assignedToId
        ? { id: g.assignedToId, name: assigneeMap.get(g.assignedToId) ?? "Unknown" }
        : null,
      open: g._count._all,
      overdue: overdueAssigneeMap.get(g.assignedToId) ?? 0,
    }))
    .sort((a, b) => b.open - a.open);

  // ── Recent activity ───────────────────────────────────────────────────────
  const recentActivity: RecentActivityRow[] = recentActivities.map((a) => ({
    id: a.id,
    type: a.type,
    fromValue: a.fromValue,
    toValue: a.toValue,
    createdAt: a.createdAt.toISOString(),
    enquiry: {
      id: a.enquiry.id,
      reference: makeReference(a.enquiry.number),
      clientName: a.enquiry.clientName,
    },
  }));

  return {
    asOf: todayString(),
    figures,
    needsAttention: {
      overdue: overdueAttention.slice(0, 8).map(toEnquiryListItem),
      dueToday: dueTodayMapped.slice(0, Math.max(0, 8 - overdueAttention.length)),
      noFollowUp: noFollowUpMapped.slice(
        0,
        Math.max(0, 8 - overdueAttention.length - dueTodayAttention.length)
      ),
      totalCount: totalAttentionCount,
    },
    stages,
    sources,
    workload,
    recentActivity,
  };
}
