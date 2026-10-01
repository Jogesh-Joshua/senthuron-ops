import Link from "next/link";
import { FollowUpChip } from "@/components/dashboard/FollowUpChip";
import { StageMark } from "@/components/dashboard/StageMark";
import { SERVICE_LABELS, SOURCE_LABELS } from "@/lib/constants";
import { formatCurrency, formatReference, getInitials } from "@/lib/format";
import type { EnquiryListItem } from "@/types/dto";

interface EnquiryTableProps {
  items: EnquiryListItem[];
}

export function EnquiryTable({ items }: EnquiryTableProps) {
  if (items.length === 0) {
    return (
      <div className="empty-block" style={{ borderTop: "1px solid var(--color-rule)", paddingTop: "64px" }}>
        <div className="empty-ruled-lines" aria-hidden="true" />
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-3)" strokeWidth="1.5" style={{ marginBottom: "16px" }}>
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <p className="empty-title">No enquiries found</p>
        <p className="empty-body">Try adjusting your search or filters.</p>
        <Link href="/enquiries" className="btn-ghost">Clear all filters</Link>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="table" aria-label="Enquiries">
        <thead>
          <tr>
            <th>Enquiry</th>
            <th>Service</th>
            <th>Source</th>
            <th>Stage</th>
            <th style={{ textAlign: "right" }}>Budget</th>
            <th>Assigned</th>
            <th style={{ textAlign: "right" }}>Follow-up</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="table-row-link">
              <td>
                <Link href={`/enquiries/${item.id}`} className="table-cell-link table-cell-link--two-line">
                  <div className="table-main-text">{item.clientName}</div>
                  <div className="table-sub-text">
                    <span className="table-sub-ref">{formatReference(item.number)}</span>
                    {" · "}{item.contactPerson}
                  </div>
                </Link>
              </td>
              <td>
                <Link href={`/enquiries/${item.id}`} className="table-cell-link">
                  {SERVICE_LABELS[item.service] ?? item.service}
                </Link>
              </td>
              <td>
                <Link href={`/enquiries/${item.id}`} className="table-cell-link">
                  {SOURCE_LABELS[item.source] ?? item.source}
                </Link>
              </td>
              <td>
                <Link href={`/enquiries/${item.id}`} className="table-cell-link">
                  <StageMark status={item.status} />
                </Link>
              </td>
              <td style={{ textAlign: "right" }}>
                <Link href={`/enquiries/${item.id}`} className="table-cell-link" style={{ justifyContent: "flex-end", fontVariantNumeric: "tabular-nums" }}>
                  {formatCurrency(item.budget)}
                </Link>
              </td>
              <td>
                <Link href={`/enquiries/${item.id}`} className="table-cell-link">
                  {item.assignedTo ? (
                    <span className="avatar-label">
                      <span className="avatar" aria-hidden="true">{getInitials(item.assignedTo.name)}</span>
                      {item.assignedTo.name.split(' ')[0]}
                    </span>
                  ) : (
                    <span className="avatar-label" style={{ color: "var(--color-ink-3)" }}>
                      <span className="avatar" style={{ borderStyle: "dashed" }} aria-hidden="true">—</span>
                      Unassigned
                    </span>
                  )}
                </Link>
              </td>
              <td style={{ textAlign: "right" }}>
                <Link href={`/enquiries/${item.id}`} className="table-cell-link" style={{ justifyContent: "flex-end" }}>
                  <FollowUpChip state={item.followUpState} date={item.nextFollowUpAt} days={item.followUpDays} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
