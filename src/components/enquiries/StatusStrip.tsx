"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { STATUS_ORDER, STATUS_LABELS } from "@/lib/constants";
import type { StatusCounts } from "@/types/dto";

interface StatusStripProps {
  counts: StatusCounts;
  total: number;
}

export function StatusStrip({ counts, total }: StatusStripProps) {
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") || "ALL";

  function buildHref(status: string) {
    const params = new URLSearchParams(searchParams);
    if (status === "ALL") {
      params.delete("status");
    } else {
      params.set("status", status);
    }
    params.delete("page"); // Reset page on filter change
    const q = params.toString();
    return `/enquiries${q ? `?${q}` : ""}`;
  }

  return (
    <div className="status-strip">
      <Link
        href={buildHref("ALL")}
        className={`status-link ${currentStatus === "ALL" ? "status-link--active" : ""}`}
      >
        <span>All</span>
        <span className="status-link-count">{total}</span>
      </Link>
      {STATUS_ORDER.map((s) => (
        <Link
          key={s}
          href={buildHref(s)}
          className={`status-link ${currentStatus === s ? "status-link--active" : ""}`}
        >
          <span>{STATUS_LABELS[s]}</span>
          <span className="status-link-count">{counts[s]}</span>
        </Link>
      ))}
    </div>
  );
}
