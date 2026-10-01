// src/components/dashboard/FollowUpChip.tsx
// Renders the follow-up status chip per the UI spec §3.5.
// OVERDUE and TODAY keep filled chips. UPCOMING is plain mono text (no pill).

import { formatFollowUpDate } from "@/lib/dates";
import type { FollowUpState } from "@/lib/constants";

interface FollowUpChipProps {
  state: FollowUpState;
  date: string | null;
  days: number | null;
}

export function FollowUpChip({ state, date, days }: FollowUpChipProps) {
  if (state === "CLOSED") {
    return <span className="followup-chip followup-chip--closed">—</span>;
  }

  if (state === "NONE" || !date) {
    return (
      <span className="followup-chip followup-chip--none">No follow-up</span>
    );
  }

  if (state === "OVERDUE") {
    const d = Math.abs(days ?? 0);
    return (
      <span className="followup-chip followup-chip--overdue">
        {/* AlertCircle icon */}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Overdue · {d}d
      </span>
    );
  }

  if (state === "TODAY") {
    return (
      <span className="followup-chip followup-chip--today">Today</span>
    );
  }

  // UPCOMING — plain mono text, no pill border
  return (
    <span className="followup-chip--upcoming-plain">
      {formatFollowUpDate(date)}
    </span>
  );
}
