export default function Loading() {
  return (
    <div style={{ padding: "32px 24px", maxWidth: "var(--content-max-width)", margin: "0 auto" }}>
      <div className="skeleton" style={{ height: "40px", width: "200px", marginBottom: "32px" }} />
      <div className="skeleton" style={{ height: "120px", width: "100%", marginBottom: "16px" }} />
      <div className="skeleton" style={{ height: "120px", width: "100%", marginBottom: "16px" }} />
      <div className="skeleton" style={{ height: "120px", width: "100%", marginBottom: "16px" }} />
    </div>
  );
}
