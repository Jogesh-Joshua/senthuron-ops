"use client";

import { useState } from "react";
import type { EnquiryDetailDTO } from "@/types/dto";

interface ActivityListProps {
  activities: EnquiryDetailDTO["activities"];
}

function formatRelativeTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function ActivityList({ activities }: ActivityListProps) {
  const [showAll, setShowAll] = useState(false);
  
  if (!activities || activities.length === 0) {
    return <p className="empty-body">No activity yet.</p>;
  }

  const limit = 20;
  const visible = showAll ? activities : activities.slice(0, limit);
  const hasMore = activities.length > limit;

  return (
    <div className="activity-list">
      {visible.map((act) => (
        <div key={act.id} className="activity-item">
          <div className="activity-icon-col">
            {act.type === "CREATED" ? (
              <div className="activity-dot-solid" />
            ) : (
              <div className="activity-dot-ring" />
            )}
            <div className="activity-line" />
          </div>
          <div className="activity-content">
            <span className="activity-text">
              {act.type === "CREATED" && "Enquiry created"}
              {act.type === "STATUS_CHANGED" && `Status changed from ${act.fromValue || 'New'} to ${act.toValue}`}
              {act.type === "ASSIGNEE_CHANGED" && (act.toValue ? `Assigned to ${act.toValue}` : "Unassigned")}
              {act.type === "FOLLOW_UP_CHANGED" && (act.toValue ? `Follow-up set to ${act.toValue}` : "Follow-up cleared")}
              {act.type === "DETAILS_UPDATED" && (act.note || "Details updated")}
              {act.actorName && ` by ${act.actorName}`}
            </span>
            <span className="activity-time">{formatRelativeTime(act.createdAt)}</span>
            {act.type === "STATUS_CHANGED" && act.note && (
              <div className="activity-note">Note: {act.note}</div>
            )}
          </div>
        </div>
      ))}
      
      {!showAll && hasMore && (
        <button 
          onClick={() => setShowAll(true)} 
          className="btn-ghost" 
          style={{ marginLeft: "24px", marginTop: "16px" }}
        >
          Show earlier
        </button>
      )}
    </div>
  );
}
