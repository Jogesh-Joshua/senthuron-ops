"use client";

import { useRef, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SOURCE_LABELS, DUE_LABELS, SORT_LABELS } from "@/lib/constants";

interface TeamMember {
  id: string;
  name: string;
}

interface EnquiryFiltersProps {
  teamMembers: TeamMember[];
}

export function EnquiryFilters({ teamMembers }: EnquiryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function applyFilters() {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    const params = new URLSearchParams(searchParams);
    
    // Always reset to page 1 on filter change
    params.delete("page");

    // Update query params
    const q = formData.get("q") as string;
    if (q) params.set("q", q);
    else params.delete("q");

    const source = formData.get("source") as string;
    if (source && source !== "ALL") params.set("source", source);
    else params.delete("source");

    const assignee = formData.get("assignee") as string;
    if (assignee && assignee !== "ALL") params.set("assignee", assignee);
    else params.delete("assignee");

    const due = formData.get("due") as string;
    if (due && due !== "ANY") params.set("due", due);
    else params.delete("due");

    const sort = formData.get("sort") as string;
    if (sort && sort !== "followup") params.set("sort", sort);
    else params.delete("sort");

    const queryString = params.toString();
    startTransition(() => {
      router.replace(`/enquiries${queryString ? `?${queryString}` : ""}`);
    });
  }

  function handleFormChange(e: React.ChangeEvent<HTMLFormElement>) {
    if ((e.target as unknown as HTMLInputElement).name === "q") {
      clearTimeout(timer.current);
      timer.current = setTimeout(applyFilters, 300);
    } else {
      applyFilters();
    }
  }

  const currentQ = searchParams.get("q") || "";
  const currentSource = searchParams.get("source") || "ALL";
  const currentAssignee = searchParams.get("assignee") || "ALL";
  const currentDue = searchParams.get("due") || "ANY";
  const currentSort = searchParams.get("sort") || "followup";

  return (
    <div className="filters-bar">
      {/* Search progress line */}
      <div className="filters-progress" style={{ opacity: isPending ? 1 : 0 }} />

      <form ref={formRef} className="filters-form" onChange={handleFormChange} onSubmit={(e) => { e.preventDefault(); applyFilters(); }}>
        
        {/* Search */}
        <div className="filter-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="filter-search-icon">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="search"
            name="q"
            defaultValue={currentQ}
            placeholder="Search by company, contact, email or phone"
            className="filter-input-search"
            aria-label="Search enquiries"
          />
          <kbd className="filter-kbd" aria-hidden="true">/</kbd>
        </div>

        {/* Filters */}
        <div className="filter-group">
          <select name="source" value={currentSource} onChange={() => {}} className="filter-select" aria-label="Filter by source">
            <option value="ALL">Source</option>
            {Object.entries(SOURCE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>

          <select name="assignee" value={currentAssignee} onChange={() => {}} className="filter-select" aria-label="Filter by assignee">
            <option value="ALL">Assigned</option>
            <option value="UNASSIGNED">Unassigned</option>
            {teamMembers.map((tm) => (
              <option key={tm.id} value={tm.id}>{tm.name.split(' ')[0]}</option>
            ))}
          </select>

          <select name="due" value={currentDue} onChange={() => {}} className="filter-select" aria-label="Filter by follow-up">
            <option value="ANY">Follow-up</option>
            {Object.entries(DUE_LABELS).filter(([val]) => val !== "ANY").map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="filter-sort">
          <span className="filter-sort-label">Sort:</span>
          <select name="sort" value={currentSort} onChange={() => {}} className="filter-select filter-select--sort" aria-label="Sort by">
            {Object.entries(SORT_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

      </form>
    </div>
  );
}
