import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getEnquiry, listTeamMembers } from "@/lib/services/enquiry.service";
import { StageTrack } from "@/components/enquiries/StageTrack";
import { HandlingPanel } from "@/components/enquiries/HandlingPanel";
import { RequireAuthLink } from "@/components/auth/RequireAuthLink";
import { ActivityList } from "@/components/enquiries/ActivityList";
import { SERVICE_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

interface EnquiryDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EnquiryDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const enquiry = await getEnquiry(id);
    return { title: `${enquiry.clientName} - Senthuron Ops` };
  } catch {
    return { title: "Enquiry Not Found" };
  }
}

export default async function EnquiryDetailPage({ params }: EnquiryDetailPageProps) {
  const { id } = await params;
  
  let enquiry;
  let teamMembers;
  try {
    [enquiry, teamMembers] = await Promise.all([
      getEnquiry(id),
      listTeamMembers()
    ]);
  } catch (e: unknown) {
    if (e instanceof Error && e.name === "NotFoundError") {
      notFound();
    }
    throw e;
  }

  const phoneDigits = enquiry.phone ? enquiry.phone.replace(/\D/g, "") : "";
  const hasWhatsApp = phoneDigits.length >= 10;

  return (
    <>
      <header className="page-header" aria-label="Enquiry detail header">
        <div className="page-header-top" style={{ alignItems: "flex-end" }}>
          <div>
            <p className="page-eyebrow" aria-hidden="true">
              <Link href="/enquiries" className="breadcrumb-link">ENQUIRIES</Link> / {enquiry.reference}
            </p>
            <h1 className="page-title">{enquiry.clientName}</h1>
            <p className="page-contact-person" style={{ color: "var(--color-ink-2)", fontSize: "16px", marginTop: "4px" }}>
              {enquiry.contactPerson}
            </p>
          </div>
          <div style={{ marginBottom: "6px" }}>
            <RequireAuthLink href={`/enquiries/${enquiry.id}/edit`} className="btn-secondary">
              Edit
            </RequireAuthLink>
          </div>
        </div>
        <div className="masthead-rule" role="presentation" />
      </header>

      <StageTrack currentStatus={enquiry.status} />

      <div className="detail-layout">
        {/* MAIN COLUMN */}
        <div className="detail-main">
          {/* Requirement section */}
          <section className="detail-section">
            <h2 className="page-eyebrow">REQUIREMENT</h2>
            <h3 className="detail-service-title">{SERVICE_LABELS[enquiry.service]}</h3>
            <p className="detail-description">{enquiry.description}</p>
          </section>

          <div className="masthead-rule" />

          {/* Contact section */}
          <section className="detail-section">
            <h2 className="page-eyebrow">CONTACT</h2>
            <div style={{ fontSize: "14px", fontWeight: "500", color: "var(--color-ink)", marginBottom: "4px" }}>
              {enquiry.contactPerson}
            </div>
            <div className="contact-methods-text" style={{ fontSize: "14px", color: "var(--color-ink-2)", marginBottom: "16px", display: "flex", gap: "24px" }}>
              {enquiry.email && <span>✉ {enquiry.email}</span>}
              {enquiry.phone && <span>☎ {enquiry.phone}</span>}
            </div>
            
            <div className="contact-action-buttons" style={{ display: "flex", gap: "12px" }}>
              {enquiry.email && (
                <a href={`mailto:${enquiry.email}`} className="btn-secondary btn-sm">Email</a>
              )}
              {enquiry.phone && (
                <a href={`tel:${enquiry.phone}`} className="btn-secondary btn-sm">Call</a>
              )}
              {hasWhatsApp && (
                <a href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm">WhatsApp</a>
              )}
            </div>
          </section>

          <div className="masthead-rule" />

          {/* Notes section */}
          <section className="detail-section">
            <h2 className="page-eyebrow">NOTES</h2>
            {enquiry.notes ? (
              <p className="detail-description">{enquiry.notes}</p>
            ) : (
              <p className="empty-body" style={{ textAlign: "left", margin: 0 }}>
                No notes. <RequireAuthLink href={`/enquiries/${enquiry.id}/edit`} className="text-brand">Add</RequireAuthLink>
              </p>
            )}
          </section>

          <div className="masthead-rule" />

          {/* Activity section */}
          <section className="detail-section">
            <h2 className="page-eyebrow">ACTIVITY</h2>
            <ActivityList activities={enquiry.activities} />
          </section>
        </div>

        {/* HANDLING PANEL (RIGHT COLUMN) */}
        <aside className="detail-aside">
          <div className="handling-panel-wrapper">
            <div style={{ padding: "0 24px" }}>
              <h2 className="page-eyebrow">HANDLING</h2>
            </div>
            <HandlingPanel enquiry={enquiry} teamMembers={teamMembers} />
          </div>
        </aside>
      </div>
    </>
  );
}
