// src/app/(app)/page.tsx
// Dashboard — Server Component. Calls dashboard service directly (no self-fetch).
// Each section gracefully degrades; a service failure shows an inline error panel.

export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { getDashboardData } from "@/lib/services/dashboard.service";
import { FollowUpChip } from "@/components/dashboard/FollowUpChip";
import { StageMark } from "@/components/dashboard/StageMark";
import { SOURCE_LABELS, STATUS_LABELS } from "@/lib/constants";
import { relativeTime } from "@/lib/dates";
import { formatCompactCurrency, formatCurrency } from "@/lib/format";

export const metadata: Metadata = {
  title: "Dashboard",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toDateString();
  const dayLabel = d.toDateString() === today
    ? "Today"
    : d.toDateString() === yStr
      ? "Yesterday"
      : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const time = d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${dayLabel} ${time}`;
}

function buildHeadline(overdue: number, dueToday: number): string {
  if (overdue === 0 && dueToday === 0) {
    return "You're clear. No follow-ups due today.";
  }
  const parts: string[] = [];
  if (overdue > 0) {
    parts.push(`${overdue} follow-up${overdue !== 1 ? "s are" : " is"} overdue`);
  }
  if (dueToday > 0) {
    parts.push(`${dueToday} ${dueToday !== 1 ? "are" : "is"} due today`);
  }
  return parts.join(" and ") + ".";
}

function buildFullDate(): string {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).toUpperCase();
}

function activitySentence(type: string, from: string | null, to: string | null): string {
  switch (type) {
    case "CREATED":
      return "New enquiry created";
    case "STATUS_CHANGED":
      return `Status changed ${(STATUS_LABELS as Record<string, string>)[from ?? ""] ?? from} → ${(STATUS_LABELS as Record<string, string>)[to ?? ""] ?? to}`;
    case "FOLLOW_UP_CHANGED":
      return to ? `Follow-up set to ${to}` : "Follow-up cleared";
    case "ASSIGNEE_CHANGED":
      return to ? `Assigned to ${to}` : "Unassigned";
    case "DETAILS_UPDATED":
      return from ? `Updated: ${from}` : "Details updated";
    default:
      return type.replace(/_/g, " ").toLowerCase();
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  let data;
  let loadError = false;

  try {
    data = await getDashboardData();
  } catch (err) {
    console.error(JSON.stringify({ level: "error", page: "dashboard", message: String(err) }));
    loadError = true;
  }

  if (loadError || !data) {
    return (
      <div style={{ padding: "32px" }}>
        <div className="error-panel">
          <p className="error-panel-msg">
            We couldn't load the dashboard. Please check your database connection and try again.
          </p>
          <a href="/" className="btn-secondary btn-sm" style={{ alignSelf: "flex-start" }}>
            Try again
          </a>
        </div>
      </div>
    );
  }

  const { figures, needsAttention, stages, sources, workload, recentActivity } = data;
  const headline = buildHeadline(figures.overdue, figures.dueToday);
  const totalAttention = needsAttention.overdue.length + needsAttention.dueToday.length + needsAttention.noFollowUp.length;

  // Max bar values
  const maxStageCount = Math.max(...stages.filter(s => !["WON","LOST"].includes(s.status)).map(s => s.count), 1);
  const maxSourceTotal = Math.max(...sources.map(s => s.total), 1);
  const maxWorkloadOpen = Math.max(...workload.map(w => w.open), 1);

  const winRatePct = figures.winRate !== null
    ? Math.round(figures.winRate * 100)
    : null;

  return (
    <>
      {/* ── Page header ────────────────────────────────────────────────────── */}
      <header className="page-header" aria-label="Dashboard header">
        <div className="page-header-top">
          <div>
            <p className="page-eyebrow" aria-hidden="true">{buildFullDate()}</p>
            <h1
              className="text-headline"
              style={{ marginTop: "8px", maxWidth: "640px" }}
              aria-label={`Dashboard: ${headline}`}
            >
              {headline}
            </h1>
          </div>
          <Link href="/enquiries/new" className="btn-primary" style={{ flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New enquiry
          </Link>
        </div>
        <div className="masthead-rule" role="presentation" />
      </header>

      {/* ── Ledger band ────────────────────────────────────────────────────── */}
      <section aria-label="Pipeline figures" style={{ marginBottom: "48px" }}>
        <div className="ledger-band">
          {/* Open */}
          <Link href="/enquiries?status=OPEN" className="ledger-figure">
            <span className="ledger-number">{figures.open}</span>
            <span className="ledger-label">Open enquiries</span>
          </Link>

          {/* Overdue */}
          <Link href="/enquiries?due=OVERDUE" className="ledger-figure">
            <span
              className={`ledger-number${figures.overdue > 0 ? " ledger-number--danger" : ""}`}
            >
              {figures.overdue}
            </span>
            <span className="ledger-label">Overdue</span>
            {figures.oldestOverdueDays !== null && figures.oldestOverdueDays > 0 && (
              <span className="ledger-caption">oldest {figures.oldestOverdueDays}d</span>
            )}
          </Link>

          {/* Due today */}
          <Link href="/enquiries?due=TODAY" className="ledger-figure">
            <span className="ledger-number">{figures.dueToday}</span>
            <span className="ledger-label">Due today</span>
          </Link>

          {/* Pipeline value */}
          <Link href="/enquiries?status=OPEN" className="ledger-figure">
            <span className="ledger-number" style={{ fontSize: "32px", lineHeight: "38px" }}>
              {formatCompactCurrency(figures.pipelineValue)}
            </span>
            <span className="ledger-label">Open pipeline</span>
            {figures.openWithoutBudget > 0 && (
              <span className="ledger-caption">{figures.openWithoutBudget} without budget</span>
            )}
          </Link>

          {/* Win rate */}
          <div className="ledger-figure" style={{ cursor: "default" }}>
            <span className="ledger-number">
              {winRatePct !== null ? `${winRatePct}%` : "—"}
            </span>
            <span className="ledger-label">Win rate</span>
            <span className="ledger-caption">
              {figures.won} won · {figures.lost} lost
            </span>
          </div>
        </div>
      </section>

      {/* ── Two-column: Attention + Pipeline ───────────────────────────────── */}
      <section className="dash-two-col section-block" aria-label="Needs attention and pipeline">

        {/* Left: Needs attention */}
        <div>
          <h2 className="section-heading-serif">Needs attention</h2>

          {totalAttention === 0 ? (
            <div className="empty-block" style={{ padding: "32px 0", alignItems: "flex-start" }}>
              <p className="empty-title" style={{ fontSize: "16px" }}>You're clear</p>
              <p className="empty-body">No overdue or unscheduled enquiries right now.</p>
            </div>
          ) : (
            <>
              {/* Overdue group */}
              {needsAttention.overdue.length > 0 && (
                <div style={{ marginBottom: "8px" }}>
                  <p style={{
                    fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em",
                    textTransform: "uppercase", color: "var(--color-danger)",
                    padding: "8px 0", borderBottom: "1px solid var(--color-rule)",
                    margin: 0
                  }}>
                    Overdue · {needsAttention.overdue.length}
                  </p>
                  {needsAttention.overdue.map((item, i) => (
                    <Link
                      key={item.id}
                      href={`/enquiries/${item.id}`}
                      className="attention-row"
                      style={{ animationDelay: `${i * 20}ms` }}
                    >
                      <FollowUpChip state={item.followUpState} date={item.nextFollowUpAt} days={item.followUpDays} />
                      <div style={{ minWidth: 0 }}>
                        <div className="attention-client">{item.clientName}</div>
                        <div className="attention-contact">{item.contactPerson}</div>
                      </div>
                      <StageMark status={item.status} />
                      {item.assignedTo ? (
                        <span className="avatar" title={item.assignedTo.name}>{getInitials(item.assignedTo.name)}</span>
                      ) : (
                        <span className="avatar" title="Unassigned" style={{ borderStyle: "dashed", color: "var(--color-ink-3)" }}>—</span>
                      )}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-3)" strokeWidth="1.5" aria-hidden="true">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </Link>
                  ))}
                </div>
              )}

              {/* Due today group */}
              {needsAttention.dueToday.length > 0 && (
                <div style={{ marginBottom: "8px" }}>
                  <p style={{
                    fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em",
                    textTransform: "uppercase", color: "var(--color-warning)",
                    padding: "8px 0", borderBottom: "1px solid var(--color-rule)",
                    margin: 0
                  }}>
                    Due today · {needsAttention.dueToday.length}
                  </p>
                  {needsAttention.dueToday.map((item, i) => (
                    <Link
                      key={item.id}
                      href={`/enquiries/${item.id}`}
                      className="attention-row"
                      style={{ animationDelay: `${(needsAttention.overdue.length + i) * 20}ms` }}
                    >
                      <FollowUpChip state={item.followUpState} date={item.nextFollowUpAt} days={item.followUpDays} />
                      <div style={{ minWidth: 0 }}>
                        <div className="attention-client">{item.clientName}</div>
                        <div className="attention-contact">{item.contactPerson}</div>
                      </div>
                      <StageMark status={item.status} />
                      {item.assignedTo ? (
                        <span className="avatar" title={item.assignedTo.name}>{getInitials(item.assignedTo.name)}</span>
                      ) : (
                        <span className="avatar" title="Unassigned" style={{ borderStyle: "dashed", color: "var(--color-ink-3)" }}>—</span>
                      )}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-3)" strokeWidth="1.5" aria-hidden="true">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </Link>
                  ))}
                </div>
              )}

              {/* No follow-up group */}
              {needsAttention.noFollowUp.length > 0 && (
                <div>
                  <p style={{
                    fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em",
                    textTransform: "uppercase", color: "var(--color-ink-3)",
                    padding: "8px 0", borderBottom: "1px solid var(--color-rule)",
                    margin: 0
                  }}>
                    No follow-up set · {needsAttention.noFollowUp.length}
                  </p>
                  {needsAttention.noFollowUp.map((item, i) => (
                    <Link
                      key={item.id}
                      href={`/enquiries/${item.id}`}
                      className="attention-row"
                      style={{ animationDelay: `${(needsAttention.overdue.length + needsAttention.dueToday.length + i) * 20}ms` }}
                    >
                      <FollowUpChip state={item.followUpState} date={item.nextFollowUpAt} days={item.followUpDays} />
                      <div style={{ minWidth: 0 }}>
                        <div className="attention-client">{item.clientName}</div>
                        <div className="attention-contact">{item.contactPerson}</div>
                      </div>
                      <StageMark status={item.status} />
                      {item.assignedTo ? (
                        <span className="avatar" title={item.assignedTo.name}>{getInitials(item.assignedTo.name)}</span>
                      ) : (
                        <span className="avatar" title="Unassigned" style={{ borderStyle: "dashed", color: "var(--color-ink-3)" }}>—</span>
                      )}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-3)" strokeWidth="1.5" aria-hidden="true">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </Link>
                  ))}
                </div>
              )}

              {/* View all link */}
              {data.needsAttention.totalCount > totalAttention && (
                <Link
                  href="/enquiries?due=OVERDUE"
                  style={{
                    display: "block",
                    paddingTop: "12px",
                    fontSize: "13px",
                    color: "var(--color-brand)",
                    textDecoration: "none",
                  }}
                >
                  View all {data.needsAttention.totalCount} ›
                </Link>
              )}
            </>
          )}
        </div>

        {/* Right: Pipeline by stage */}
        <div>
          <h2 className="section-heading-serif">Pipeline by stage</h2>

          {stages.filter(s => !["WON","LOST"].includes(s.status)).map((stage) => (
            <Link
              key={stage.status}
              href={`/enquiries?status=${stage.status}`}
              className="bar-row"
              style={{ gridTemplateColumns: "140px 1fr 80px" }}
            >
              <StageMark status={stage.status} />
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${(stage.count / maxStageCount) * 100}%` }}
                />
              </div>
              <span className="bar-meta">
                {stage.count}
                {stage.value ? ` · ${formatCompactCurrency(stage.value)}` : ""}
              </span>
            </Link>
          ))}

          {/* Divider before Won/Lost */}
          <div style={{ borderTop: "1px solid var(--color-rule)", margin: "8px 0" }} />

          {stages.filter(s => ["WON","LOST"].includes(s.status)).map((stage) => (
            <Link
              key={stage.status}
              href={`/enquiries?status=${stage.status}`}
              className="bar-row"
              style={{ gridTemplateColumns: "140px 1fr 80px" }}
            >
              <StageMark status={stage.status} />
              <div />
              <span className="bar-meta">{stage.count}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Two-column: By source + Workload ────────────────────────────────── */}
      <div className="dash-two-col section-block">
        {/* By source */}
        <section aria-label="Enquiries by source">
          <h2 className="section-heading-serif">By source</h2>
          {sources.length === 0 ? (
            <p style={{ color: "var(--color-ink-3)", fontSize: "13px", paddingTop: "12px" }}>
              Nothing to show until enquiries are added.
            </p>
          ) : (
            sources.map((row) => (
              <Link
                key={row.source}
                href={`/enquiries?source=${row.source}`}
                className="bar-row"
              >
                <span style={{ fontSize: "13px", color: "var(--color-ink-2)", fontWeight: 500 }}>
                  {SOURCE_LABELS[row.source as keyof typeof SOURCE_LABELS] ?? row.source}
                </span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${(row.total / maxSourceTotal) * 100}%` }}
                  />
                </div>
                <span className="bar-meta">
                  {row.total} · <span style={{ color: "var(--color-success)" }}>{row.won} won</span>
                </span>
              </Link>
            ))
          )}
        </section>

        {/* Workload */}
        <section aria-label="Workload by team member">
          <h2 className="section-heading-serif">Workload</h2>
          {workload.length === 0 ? (
            <p style={{ color: "var(--color-ink-3)", fontSize: "13px", paddingTop: "12px" }}>
              Nothing to show until enquiries are added.
            </p>
          ) : (
            workload
              .slice() // don't mutate
              .sort((a, b) => {
                // Unassigned always last
                if (!a.assignee && b.assignee) return 1;
                if (a.assignee && !b.assignee) return -1;
                return b.open - a.open;
              })
              .map((row, i) => {
              const name = row.assignee?.name ?? "Unassigned";
              const firstName = row.assignee ? name.split(" ")[0] : "Unassigned";
              const href = row.assignee
                ? `/enquiries?assignee=${row.assignee.id}`
                : "/enquiries?assignee=UNASSIGNED";
              return (
                <Link key={i} href={href} className="bar-row" style={{ gridTemplateColumns: "100px 1fr 130px" }}>
                  <span className="bar-assignee-label">
                    {row.assignee ? (
                      <>
                        <span className="avatar" aria-label={name}>{getInitials(name)}</span>
                        <span className="bar-assignee-name">{firstName}</span>
                      </>
                    ) : (
                      <>
                        <span className="avatar" aria-label="Unassigned" style={{ borderStyle: "dashed", color: "var(--color-ink-3)" }}>—</span>
                        <span className="bar-assignee-name" style={{ color: "var(--color-ink-3)" }}>Unassigned</span>
                      </>
                    )}
                  </span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${(row.open / maxWorkloadOpen) * 100}%` }}
                    />
                  </div>
                  <span className="bar-meta">
                    <span className="bar-meta-num">{row.open}</span>
                    <span className="bar-meta-text"> open</span>
                    {row.overdue > 0 && (
                      <>
                        <span className="bar-meta-text"> · </span>
                        <span className="bar-meta-num" style={{ color: "var(--color-danger)" }}>{row.overdue}</span>
                        <span className="bar-meta-text" style={{ color: "var(--color-danger)" }}> overdue</span>
                      </>
                    )}
                  </span>
                </Link>
              );
            })
          )}
        </section>
      </div>

      {/* ── Recent activity ─────────────────────────────────────────────────── */}
      {recentActivity.length > 0 && (
        <section className="section-block" aria-label="Recent activity">
          <h2 className="section-heading-serif">Recent activity</h2>
          <div>
            {recentActivity.map((act) => (
              <Link
                key={act.id}
                href={`/enquiries/${act.enquiry.id}`}
                className="activity-row"
              >
                <span className="activity-time">{formatDate(act.createdAt)}</span>
                <span className="activity-text">
                  <span className="activity-ref">{act.enquiry.reference}</span>
                  {" "}
                  <span className="activity-client">{act.enquiry.clientName}</span>
                  {" · "}
                  {activitySentence(act.type, act.fromValue, act.toValue)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
