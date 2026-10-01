export default function EnquiriesLoading() {
  return (
    <>
      <header className="page-header">
        <div className="page-header-top">
          <div>
            <div className="skeleton" style={{ height: "14px", width: "100px", marginBottom: "8px" }} />
            <div className="skeleton" style={{ height: "32px", width: "200px" }} />
          </div>
          <div className="skeleton" style={{ height: "36px", width: "120px" }} />
        </div>
        <div className="masthead-rule" />
      </header>
      <div style={{ padding: "32px 0" }}>
        <div className="skeleton" style={{ height: "64px", width: "100%", marginBottom: "8px", borderRadius: "var(--radius)" }} />
        <div className="skeleton" style={{ height: "64px", width: "100%", marginBottom: "8px", borderRadius: "var(--radius)" }} />
        <div className="skeleton" style={{ height: "64px", width: "100%", marginBottom: "8px", borderRadius: "var(--radius)" }} />
        <div className="skeleton" style={{ height: "64px", width: "100%", marginBottom: "8px", borderRadius: "var(--radius)" }} />
        <div className="skeleton" style={{ height: "64px", width: "100%", marginBottom: "8px", borderRadius: "var(--radius)" }} />
      </div>
    </>
  );
}
