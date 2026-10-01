"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createEnquirySchema } from "@/lib/validation/enquiry";
import { SOURCE_LABELS, SERVICE_LABELS, STATUS_LABELS } from "@/lib/constants";
import type { z } from "zod";

interface TeamMember {
  id: string;
  name: string;
}

interface EnquiryFormProps {
  teamMembers: TeamMember[];
}

export function EnquiryForm({ teamMembers }: EnquiryFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Focus the first input on mount
  useEffect(() => {
    const firstInput = formRef.current?.querySelector('input[name="clientName"]') as HTMLInputElement;
    if (firstInput) {
      firstInput.focus();
    }
  }, []);

  function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const name = e.target.name;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateForm();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const name = e.target.name;
    if (touched[name]) {
      validateForm();
    }
  }

  function validateForm(): boolean {
    if (!formRef.current) return false;
    
    const formData = new FormData(formRef.current);
    const data = Object.fromEntries(formData.entries());
    
    // Normalize budget to a string for parsing if empty
    if (!data.budget) {
      data.budget = "";
    }

    const result = createEnquirySchema.safeParse(data);
    
    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
      return false;
    } else {
      setErrors({});
      return true;
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    // Mark all as touched
    const newTouched: Record<string, boolean> = {};
    const elements = formRef.current?.elements;
    if (elements) {
      for (let i = 0; i < elements.length; i++) {
        const name = (elements[i] as any).name;
        if (name) newTouched[name] = true;
      }
    }
    setTouched(newTouched);

    if (!validateForm()) {
      // Focus first error
      setTimeout(() => {
        const firstErrorEl = formRef.current?.querySelector('[aria-invalid="true"]') as HTMLElement;
        if (firstErrorEl) firstErrorEl.focus();
      }, 0);
      return;
    }

    if (!formRef.current) return;
    setIsSubmitting(true);
    
    const formData = new FormData(formRef.current);
    const payload = Object.fromEntries(formData.entries());
    if (!payload.budget) delete payload.budget;
    if (!payload.nextFollowUpAt) delete payload.nextFollowUpAt;
    if (!payload.assignedToId) delete payload.assignedToId;
    if (!payload.notes) delete payload.notes;

    // Convert budget to integer if present
    if (payload.budget) {
      payload.budget = parseInt(payload.budget as string, 10) as any;
    }

    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        // Success: navigate to the new enquiry
        router.push(`/enquiries/${result.data.id}`);
        router.refresh();
      } else {
        // Validation or server error
        if (result.errors) {
          setErrors(result.errors);
        } else {
          setErrors({ _root: [result.message || "Failed to create enquiry"] });
        }
        setIsSubmitting(false);
      }
    } catch (err) {
      setErrors({ _root: ["A network error occurred. Please try again."] });
      setIsSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    // Ctrl+Enter or Cmd+Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      formRef.current?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    }
  }

  const renderError = (fieldName: string) => {
    if (touched[fieldName] && errors[fieldName]) {
      return (
        <div className="field-error" id={`${fieldName}-error`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{ marginTop: "2px", flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{errors[fieldName][0]}</span>
        </div>
      );
    }
    return null;
  };

  return (
    <form 
      ref={formRef} 
      onSubmit={handleSubmit} 
      onKeyDown={handleKeyDown}
      className="form-ledger" 
      aria-busy={isSubmitting}
    >
      <fieldset disabled={isSubmitting} style={{ margin: 0, padding: 0, border: "none" }}>
        {errors._root && (
          <div className="error-panel" style={{ margin: "24px", maxWidth: "640px" }}>
            <p className="error-panel-msg">{errors._root[0]}</p>
          </div>
        )}

        <div className="form-info-bar">
          All fields are required unless marked optional.
        </div>

        {/* ─── Group 1: Who ──────────────────────────────────────────────────────── */}
        <div className="form-group">
          <div className="form-gutter">
            <h2 className="form-gutter-title">Who</h2>
            <p className="form-gutter-meta">Who is asking?</p>
            <p className="form-gutter-meta" style={{ marginTop: "8px" }}>Add at least an email or a phone number.</p>
          </div>
          
          <div className="form-fields">
            <div className="field-row">
              <label className="field-label" htmlFor="clientName">Client / company</label>
              <input
                id="clientName"
                name="clientName"
                type="text"
                className="input-field"
                onBlur={handleBlur}
                onChange={handleChange}
                aria-invalid={!!(touched.clientName && errors.clientName)}
                aria-describedby={touched.clientName && errors.clientName ? "clientName-error" : undefined}
              />
              {renderError("clientName")}
            </div>

            <div className="field-row">
              <label className="field-label" htmlFor="contactPerson">Contact person</label>
              <input
                id="contactPerson"
                name="contactPerson"
                type="text"
                className="input-field"
                onBlur={handleBlur}
                onChange={handleChange}
                aria-invalid={!!(touched.contactPerson && errors.contactPerson)}
                aria-describedby={touched.contactPerson && errors.contactPerson ? "contactPerson-error" : undefined}
              />
              {renderError("contactPerson")}
            </div>

            <div className="field-grid-2">
              <div className="field-row">
                <label className="field-label" htmlFor="email">Email <span className="field-optional">optional</span></label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="input-field"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  aria-invalid={!!(touched.email && errors.email)}
                  aria-describedby={touched.email && errors.email ? "email-error" : undefined}
                />
                {renderError("email")}
              </div>
              <div className="field-row">
                <label className="field-label" htmlFor="phone">Phone <span className="field-optional">optional</span></label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="input-field"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  aria-invalid={!!(touched.phone && errors.phone)}
                  aria-describedby={touched.phone && errors.phone ? "phone-error" : undefined}
                />
                {renderError("phone")}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Group 2: What ─────────────────────────────────────────────────────── */}
        <div className="form-group">
          <div className="form-gutter">
            <h2 className="form-gutter-title">What</h2>
            <p className="form-gutter-meta">What do they need?</p>
          </div>
          
          <div className="form-fields">
            <div className="field-grid-2">
              <div className="field-row">
                <label className="field-label" htmlFor="source">Source</label>
                <select
                  id="source"
                  name="source"
                  className="input-field"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  aria-invalid={!!(touched.source && errors.source)}
                  aria-describedby={touched.source && errors.source ? "source-error" : undefined}
                >
                  <option value="">Choose source</option>
                  {Object.entries(SOURCE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
                {renderError("source")}
              </div>
              <div className="field-row">
                <label className="field-label" htmlFor="service">Service</label>
                <select
                  id="service"
                  name="service"
                  className="input-field"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  aria-invalid={!!(touched.service && errors.service)}
                  aria-describedby={touched.service && errors.service ? "service-error" : undefined}
                >
                  <option value="">Choose service</option>
                  {Object.entries(SERVICE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
                {renderError("service")}
              </div>
            </div>

            <div className="field-row">
              <label className="field-label" htmlFor="description">Requirement description</label>
              <textarea
                id="description"
                name="description"
                rows={4}
                className="input-field"
                onBlur={handleBlur}
                onChange={handleChange}
                aria-invalid={!!(touched.description && errors.description)}
                aria-describedby={touched.description && errors.description ? "description-error" : undefined}
                style={{ resize: "vertical", height: "auto" }}
              />
              {renderError("description")}
            </div>

            <div className="field-row" style={{ maxWidth: "312px" }}>
              <label className="field-label" htmlFor="budget">Estimated budget <span className="field-optional">optional</span></label>
              <div className="input-with-prefix">
                <span className="input-prefix">₹</span>
                <input
                  id="budget"
                  name="budget"
                  type="number"
                  min="0"
                  step="1"
                  className="input-field"
                  style={{ paddingLeft: "32px" }}
                  onBlur={handleBlur}
                  onChange={handleChange}
                  aria-invalid={!!(touched.budget && errors.budget)}
                  aria-describedby={touched.budget && errors.budget ? "budget-error" : undefined}
                />
              </div>
              {renderError("budget")}
            </div>
          </div>
        </div>

        {/* ─── Group 3: Handling ─────────────────────────────────────────────────── */}
        <div className="form-group">
          <div className="form-gutter">
            <h2 className="form-gutter-title">Handling</h2>
            <p className="form-gutter-meta">Who owns it and what happens next?</p>
          </div>
          
          <div className="form-fields">
            <div className="field-grid-2">
              <div className="field-row">
                <label className="field-label" htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  className="input-field"
                  defaultValue="NEW"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  aria-invalid={!!(touched.status && errors.status)}
                  aria-describedby={touched.status && errors.status ? "status-error" : undefined}
                >
                  {Object.entries(STATUS_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
                {renderError("status")}
              </div>
              <div className="field-row">
                <label className="field-label" htmlFor="assignedToId">Assigned to <span className="field-optional">optional</span></label>
                <select
                  id="assignedToId"
                  name="assignedToId"
                  className="input-field"
                  defaultValue=""
                  onBlur={handleBlur}
                  onChange={handleChange}
                  aria-invalid={!!(touched.assignedToId && errors.assignedToId)}
                  aria-describedby={touched.assignedToId && errors.assignedToId ? "assignedToId-error" : undefined}
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map((tm) => (
                    <option key={tm.id} value={tm.id}>{tm.name}</option>
                  ))}
                </select>
                {renderError("assignedToId")}
              </div>
            </div>

            <div className="field-row" style={{ maxWidth: "312px" }}>
              <label className="field-label" htmlFor="nextFollowUpAt">Next follow-up <span className="field-optional">optional</span></label>
              <input
                id="nextFollowUpAt"
                name="nextFollowUpAt"
                type="date"
                className="input-field"
                onBlur={handleBlur}
                onChange={handleChange}
                aria-invalid={!!(touched.nextFollowUpAt && errors.nextFollowUpAt)}
                aria-describedby={touched.nextFollowUpAt && errors.nextFollowUpAt ? "nextFollowUpAt-error" : undefined}
              />
              {renderError("nextFollowUpAt")}
            </div>

            <div className="field-row">
              <label className="field-label" htmlFor="notes">Additional notes <span className="field-optional">optional</span></label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                className="input-field"
                onBlur={handleBlur}
                onChange={handleChange}
                aria-invalid={!!(touched.notes && errors.notes)}
                aria-describedby={touched.notes && errors.notes ? "notes-error" : undefined}
                style={{ resize: "vertical", height: "auto" }}
              />
              {renderError("notes")}
            </div>
          </div>
        </div>
        
        {/* ─── Action Bar ────────────────────────────────────────────────────────── */}
        <div className="form-action-bar">
          <div className="form-action-hint">Ctrl+Enter to create</div>
          <div className="form-action-buttons">
            <button type="button" className="btn-secondary" onClick={() => router.back()}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="spinner">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Creating…
                </>
              ) : "Create enquiry"}
            </button>
          </div>
        </div>
      </fieldset>
    </form>
  );
}
