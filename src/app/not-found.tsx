import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "var(--color-paper)" }}>
      <div style={{ flex: 1, padding: "32px 24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="empty-state" style={{ maxWidth: "480px" }}>
          <h2 className="empty-title">Page not found</h2>
          <p className="empty-body" style={{ marginTop: "12px", marginBottom: "24px" }}>
            The page you are looking for doesn&apos;t exist or has been moved.
          </p>
          <Link href="/" className="btn-primary">
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
