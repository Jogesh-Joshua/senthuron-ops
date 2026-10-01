import type { Metadata } from "next";
import { getTeamMembers } from "@/lib/services/enquiry.service";
import { EnquiryForm } from "@/components/enquiries/EnquiryForm";

export const metadata: Metadata = {
  title: "New Enquiry",
};

export const dynamic = "force-dynamic";

export default async function NewEnquiryPage() {
  const teamMembers = await getTeamMembers();

  return (
    <>
      <header className="page-header" aria-label="New enquiry header">
        <div className="page-header-top">
          <div>
            <p className="page-eyebrow" aria-hidden="true">ENQUIRIES / NEW</p>
            <h1 className="page-title" aria-label="New enquiry">New enquiry</h1>
          </div>
        </div>
        <div className="masthead-rule" role="presentation" style={{ marginBottom: "0" }} />
      </header>
      
      <EnquiryForm teamMembers={teamMembers} />
    </>
  );
}
