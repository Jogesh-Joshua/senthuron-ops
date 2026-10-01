"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { STATUS_LABELS } from "@/lib/constants";
import type { EnquiryDetailDTO } from "@/types/dto";

interface TeamMember {
  id: string;
  name: string;
}

interface HandlingPanelProps {
  enquiry: EnquiryDetailDTO;
  teamMembers: TeamMember[];
}

export function HandlingPanel({ enquiry, teamMembers }: HandlingPanelProps) {
  const router = useRouter();
  
  const [status, setStatus] = useState(enquiry.status);
  const [assignedToId, setAssignedToId] = useState(enquiry.assignedTo?.id || "");
  const [nextFollowUpAt, setNextFollowUpAt] = useState(
    enquiry.nextFollowUpAt ? new Date(enquiry.nextFollowUpAt).toISOString().split("T")[0] : ""
  );

  const [savingField, setSavingField] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<string | null>(null);

  async function updateField(field: string, value: any, originalValue: any) {
    setSavingField(field);
    setErrorField(null);
    
    // Optimistic update
    if (field === "status") setStatus(value);
    if (field === "assignedToId") setAssignedToId(value);
    if (field === "nextFollowUpAt") setNextFollowUpAt(value);

    // If setting status to WON or LOST, clear follow-up optimistically
    let payload: any = { [field]: value };
    if (field === "status" && (value === "WON" || value === "LOST")) {
      setNextFollowUpAt("");
      payload.nextFollowUpAt = null;
    }

    if (field === "nextFollowUpAt" && value === "") {
      payload.nextFollowUpAt = null;
    }

    try {
      const res = await fetch(`/api/enquiries/${enquiry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      
      if (res.ok && result.success) {
        // Show saved state for 2s
        setSavingField(`${field}-saved`);
        setTimeout(() => {
          setSavingField((prev) => prev === `${field}-saved` ? null : prev);
        }, 2000);
        router.refresh(); // refresh server components
      } else {
        // Revert on error
        throw new Error(result.message || "Failed to update");
      }
    } catch (err) {
      // Revert state
      if (field === "status") setStatus(originalValue);
      if (field === "assignedToId") setAssignedToId(originalValue);
      if (field === "nextFollowUpAt") setNextFollowUpAt(originalValue);
      
      setErrorField(field);
      setSavingField(null);
    }
  }

  const isClosed = status === "WON" || status === "LOST";

  return (
    <div className="handling-panel">
      <div className="handling-panel-inner">
        {/* Status */}
        <div className="handling-row">
          <label className="field-label" htmlFor="handling-status">
            STATUS 
            {savingField === "status" && <span className="handling-saving">Saving…</span>}
            {savingField === "status-saved" && <span className="handling-saved">Saved</span>}
            {errorField === "status" && <span className="handling-error">Failed</span>}
          </label>
          <select
            id="handling-status"
            className="input-field"
            value={status}
            onChange={(e) => updateField("status", e.target.value, status)}
          >
            {Object.entries(STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        {/* Assigned */}
        <div className="handling-row">
          <label className="field-label" htmlFor="handling-assignee">
            ASSIGNED TO
            {savingField === "assignedToId" && <span className="handling-saving">Saving…</span>}
            {savingField === "assignedToId-saved" && <span className="handling-saved">Saved</span>}
            {errorField === "assignedToId" && <span className="handling-error">Failed</span>}
          </label>
          <select
            id="handling-assignee"
            className="input-field"
            value={assignedToId}
            onChange={(e) => updateField("assignedToId", e.target.value, assignedToId)}
          >
            <option value="">Unassigned</option>
            {teamMembers.map((tm) => (
              <option key={tm.id} value={tm.id}>{tm.name}</option>
            ))}
          </select>
        </div>

        {/* Follow up */}
        <div className="handling-row">
          <label className="field-label" htmlFor="handling-followup">
            NEXT FOLLOW-UP
            {savingField === "nextFollowUpAt" && <span className="handling-saving">Saving…</span>}
            {savingField === "nextFollowUpAt-saved" && <span className="handling-saved">Saved</span>}
            {errorField === "nextFollowUpAt" && <span className="handling-error">Failed</span>}
          </label>
          <input
            type="date"
            id="handling-followup"
            className="input-field"
            value={nextFollowUpAt}
            disabled={isClosed}
            onChange={(e) => updateField("nextFollowUpAt", e.target.value, nextFollowUpAt)}
          />
          {isClosed && <p className="handling-helper">Not needed for closed enquiries.</p>}
        </div>

        <div className="masthead-rule" style={{ margin: "24px 0" }} />

        {/* Read-only info */}
        <div className="handling-meta-grid">
          <div className="handling-meta-label">BUDGET</div>
          <div className="handling-meta-value">
            {enquiry.budget !== null ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(enquiry.budget) : "—"}
          </div>
          
          <div className="handling-meta-label">SOURCE</div>
          <div className="handling-meta-value capitalize-first">
            {enquiry.source.toLowerCase()}
          </div>
          
          <div className="handling-meta-label">CREATED</div>
          <div className="handling-meta-value">
            {new Date(enquiry.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
          
          <div className="handling-meta-label">UPDATED</div>
          <div className="handling-meta-value">
            {new Date(enquiry.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
      </div>
    </div>
  );
}
