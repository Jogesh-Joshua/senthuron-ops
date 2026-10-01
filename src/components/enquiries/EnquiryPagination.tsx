"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface EnquiryPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function EnquiryPagination({ page, pageSize, total, totalPages }: EnquiryPaginationProps) {
  const searchParams = useSearchParams();

  if (total === 0) return null;

  function buildHref(newPage: number) {
    const params = new URLSearchParams(searchParams);
    if (newPage === 1) {
      params.delete("page");
    } else {
      params.set("page", newPage.toString());
    }
    const q = params.toString();
    return `/enquiries${q ? `?${q}` : ""}`;
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="pagination">
      <div className="pagination-info">
        Showing {start}–{end} of {total}
      </div>
      
      <div className="pagination-controls">
        <span className="pagination-page">Page {page} of {totalPages}</span>
        
        <div className="pagination-buttons">
          {page > 1 ? (
            <Link href={buildHref(page - 1)} className="btn-secondary btn-sm">
              ‹ Prev
            </Link>
          ) : (
            <span className="btn-secondary btn-sm" aria-disabled="true" style={{ opacity: 0.4, cursor: "not-allowed" }}>
              ‹ Prev
            </span>
          )}

          {page < totalPages ? (
            <Link href={buildHref(page + 1)} className="btn-secondary btn-sm">
              Next ›
            </Link>
          ) : (
            <span className="btn-secondary btn-sm" aria-disabled="true" style={{ opacity: 0.4, cursor: "not-allowed" }}>
              Next ›
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
