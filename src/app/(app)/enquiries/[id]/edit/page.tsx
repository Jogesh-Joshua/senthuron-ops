import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEnquiry, listTeamMembers } from "@/lib/services/enquiry.service";
import { EnquiryForm } from "@/components/enquiries/EnquiryForm";
import { getSessionUser } from "@/lib/auth-guard";

export const metadata: Metadata = {
  title: "Edit Enquiry",
};

export const dynamic = "force-dynamic";

export default async function EditEnquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  const { id } = await params;
  if (!user) {
    notFound(); // or redirect
  }
  const [enquiry, teamMembers] = await Promise.all([
    getEnquiry(id).catch((e) => {
      if (e?.name === "NotFoundError") notFound();
      throw e;
    }),
    listTeamMembers(),
  ]);

  return (
    <>
      <header className="page-header" aria-label="Edit enquiry header">
        <div className="page-header-top">
          <div>
            <p className="page-eyebrow" aria-hidden="true">ENQUIRIES / EDIT</p>
            <h1 className="page-title" aria-label="Edit enquiry">Edit enquiry</h1>
          </div>
        </div>
        <div className="masthead-rule" role="presentation" style={{ marginBottom: "0" }} />
      </header>
      
      <EnquiryForm mode="edit" enquiry={enquiry} teamMembers={teamMembers} />
    </>
  );
}
