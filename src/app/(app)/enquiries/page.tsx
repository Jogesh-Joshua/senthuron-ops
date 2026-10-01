import type { Metadata } from "next";
import Link from "next/link";
import { listEnquiries, getTeamMembers } from "@/lib/services/enquiry.service";
import { listQuerySchema } from "@/lib/validation/enquiry";
import { StatusStrip } from "@/components/enquiries/StatusStrip";
import { EnquiryFilters } from "@/components/enquiries/EnquiryFilters";
import { EnquiryTable } from "@/components/enquiries/EnquiryTable";
import { EnquiryPagination } from "@/components/enquiries/EnquiryPagination";

export const metadata: Metadata = {
  title: "Enquiries",
};

export const dynamic = "force-dynamic";

interface EnquiriesPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function EnquiriesPage({ searchParams }: EnquiriesPageProps) {
  // Parse query params safely
  const queryParse = listQuerySchema.safeParse(searchParams);
  const query = queryParse.success ? queryParse.data : listQuerySchema.parse({});

  let data;
  let teamMembers;
  let loadError = false;

  try {
    [data, teamMembers] = await Promise.all([
      listEnquiries(query),
      getTeamMembers()
    ]);
  } catch (err) {
    console.error(JSON.stringify({ level: "error", page: "enquiries", message: String(err) }));
    loadError = true;
  }

  if (loadError || !data || !teamMembers) {
    return (
      <div style={{ padding: "32px" }}>
        <div className="error-panel">
          <p className="error-panel-msg">
            We couldn't load the enquiries. Please check your database connection and try again.
          </p>
          <a href="/enquiries" className="btn-secondary btn-sm" style={{ alignSelf: "flex-start" }}>
            Try again
          </a>
        </div>
      </div>
    );
  }

  // Header display logic
  const isFiltered = query.status || query.q || query.source || query.assignee || query.due !== "ANY";
  const headerTotal = data.total === 0
    ? "0 total"
    : (isFiltered ? `${data.total} of ${Object.values(data.statusCounts).reduce((a, b) => a + b, 0)}` : `${data.total} total`);

  return (
    <>
      <header className="page-header" aria-label="Enquiries header">
        <div className="page-header-top">
          <div>
            <p className="page-eyebrow" aria-hidden="true">PIPELINE</p>
            <h1 className="page-title" aria-label="Enquiries list">Enquiries</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ fontSize: "14px", color: "var(--color-ink-3)", fontVariantNumeric: "tabular-nums" }}>
              {headerTotal}
            </span>
            <Link href="/enquiries/new" className="btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New enquiry
            </Link>
          </div>
        </div>
        <div className="masthead-rule" role="presentation" />
      </header>

      {/* List controls */}
      <section aria-label="Filters and list">
        <StatusStrip
          counts={data.statusCounts}
          total={Object.values(data.statusCounts).reduce((a, b) => a + b, 0)}
        />
        <EnquiryFilters teamMembers={teamMembers} />
        
        {/* The data table */}
        <EnquiryTable items={data.items} />

        {/* Pagination */}
        <EnquiryPagination 
          page={data.page} 
          pageSize={data.pageSize} 
          total={data.total} 
          totalPages={data.totalPages} 
        />
      </section>
    </>
  );
}
