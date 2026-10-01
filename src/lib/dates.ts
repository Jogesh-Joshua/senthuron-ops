// src/lib/dates.ts
// Date helpers. Safe for both server and client code.

import { BUSINESS_TIMEZONE } from "@/lib/constants";
import type { FollowUpState } from "@/lib/constants";

/**
 * Returns today's date string in YYYY-MM-DD format, using the business
 * timezone. This is the canonical source of "today" for all comparisons.
 */
export function todayString(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Returns a UTC-midnight Date for a YYYY-MM-DD string.
 * Used for Prisma queries comparing against @db.Date columns.
 */
export function toDateOnly(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Computes the follow-up state for a given nextFollowUpAt and status.
 * The server always computes this — the UI never does timezone math.
 */
export function computeFollowUpState(
  nextFollowUpAt: Date | null | undefined,
  isClosed: boolean
): FollowUpState {
  if (isClosed) return "CLOSED";
  if (!nextFollowUpAt) return "NONE";

  const today = todayString();
  const followUpStr = nextFollowUpAt.toISOString().slice(0, 10);

  if (followUpStr < today) return "OVERDUE";
  if (followUpStr === today) return "TODAY";
  return "UPCOMING";
}

/**
 * Returns the number of days between nextFollowUpAt and today.
 * Negative = overdue. 0 = today. Positive = upcoming.
 */
export function computeFollowUpDays(
  nextFollowUpAt: Date | null | undefined
): number | null {
  if (!nextFollowUpAt) return null;
  const today = toDateOnly(todayString());
  const followUp = toDateOnly(nextFollowUpAt.toISOString().slice(0, 10));
  const diffMs = followUp.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Formats a YYYY-MM-DD string for display: "Today", "Tomorrow", "Fri 3 Oct".
 * Adds the year when it differs from the current year.
 */
export function formatFollowUpDate(dateStr: string): string {
  const today = todayString();
  const tomorrow = toDateOnly(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  if (dateStr === today) return "Today";
  if (dateStr === tomorrowStr) return "Tomorrow";

  const date = toDateOnly(dateStr);
  const currentYear = new Date().getFullYear();
  const dateYear = date.getUTCFullYear();

  return date.toLocaleDateString("en-GB", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(dateYear !== currentYear ? { year: "numeric" } : {}),
  });
}

/**
 * Returns a relative time string for a timestamp: "2h ago", "3 days ago",
 * falling back to "12 Sep 2026" for anything older than 7 days.
 */
export function relativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
