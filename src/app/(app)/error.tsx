"use client";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="error-panel" role="alert" style={{ margin: "32px auto", maxWidth: "640px" }}>
      <p className="error-panel-msg">Something went wrong on our side. This is usually temporary.</p>
      <button type="button" className="btn-secondary" onClick={reset}>Try again</button>
    </div>
  );
}
