import Link from "next/link";

export default function EnquiryNotFound() {
  return (
    <div className="empty-state" style={{ marginTop: "64px" }}>
      <h2 className="empty-title">Enquiry not found</h2>
      <p className="empty-body" style={{ marginTop: "12px", marginBottom: "24px" }}>
        That enquiry doesn&apos;t exist or you don&apos;t have access to it.
      </p>
      <Link href="/enquiries" className="btn-primary">
        Return to enquiries
      </Link>
    </div>
  );
}
