"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: "#f5f2ea", color: "#1c1b18", padding: "48px", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto", padding: "24px", backgroundColor: "#fbf9f4", borderRadius: "6px", border: "1px solid #d9d3c3" }}>
          <h2 style={{ margin: "0 0 16px 0", fontSize: "20px" }}>Critical Error</h2>
          <p style={{ margin: "0 0 24px 0", color: "#5a574e" }}>Something went catastrophically wrong. Please reload the application.</p>
          <button 
            type="button" 
            onClick={reset}
            style={{ padding: "8px 16px", backgroundColor: "#1f4d3a", color: "white", border: "none", borderRadius: "3px", cursor: "pointer", fontWeight: 500 }}
          >
            Reload application
          </button>
        </div>
      </body>
    </html>
  );
}
