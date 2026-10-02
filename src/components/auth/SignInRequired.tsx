"use client";

import React from "react";
import { useAuth } from "./AuthProvider";

export function SignInRequired() {
  const { openAuth } = useAuth();
  
  return (
    <div className="empty-state sign-in-required" style={{ margin: "24px 0", textAlign: "center", padding: "32px", border: "1px dashed var(--gray-300)", borderRadius: "var(--radius-lg)" }}>
      <div style={{ fontSize: "2rem", marginBottom: "16px" }}>🔒</div>
      <h3 style={{ margin: "0 0 8px 0", fontSize: "1.125rem", color: "var(--gray-900)" }}>Sign in to make changes</h3>
      <p style={{ margin: "0 0 24px 0", color: "var(--gray-500)", fontSize: "0.875rem" }}>
        This is a read-only view. You must be signed in to edit this enquiry or add activities.
      </p>
      <button className="btn-primary" onClick={() => openAuth({ mode: "signin" })}>
        Sign In
      </button>
    </div>
  );
}
