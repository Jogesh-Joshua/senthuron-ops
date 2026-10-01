import { STATUS_ORDER, STATUS_LABELS } from "@/lib/constants";
import type { EnquiryStatus } from "@/lib/validation/enquiry";
import { StageMark } from "@/components/dashboard/StageMark";

interface StageTrackProps {
  currentStatus: EnquiryStatus;
}

export function StageTrack({ currentStatus }: StageTrackProps) {
  const isWon = currentStatus === "WON";
  const isLost = currentStatus === "LOST";

  const activeIndex = isWon || isLost ? -1 : STATUS_ORDER.indexOf(currentStatus);
  const trackStatuses = STATUS_ORDER.filter(s => s !== "WON" && s !== "LOST");

  return (
    <div className="stage-track-container">
      {/* Current stage mark on the left */}
      <div className="stage-track-primary">
        <StageMark status={currentStatus} size={20} />
      </div>

      <div className="stage-track-line-wrapper">
        {trackStatuses.map((status, index) => {
          let nodeClass = "";
          let labelClass = "stage-track-label";
          
          if (isWon) {
            nodeClass = "node-won";
          } else if (isLost) {
            nodeClass = "node-lost-muted";
          } else {
            if (index < activeIndex) {
              nodeClass = "node-passed";
            } else if (index === activeIndex) {
              nodeClass = "node-current";
              labelClass += " stage-track-label--current";
            } else {
              nodeClass = "node-future";
            }
          }

          const hasNext = index < trackStatuses.length - 1 || isWon || isLost;
          let lineClass = "";
          if (hasNext) {
            if (isWon) lineClass = "line-won";
            else if (isLost) lineClass = "line-lost-muted";
            else if (index < activeIndex) lineClass = "line-passed";
            else lineClass = "line-future";
          }

          return (
            <div key={status} className="stage-track-step">
              <div className="stage-track-node-container">
                <div className={`stage-track-node ${nodeClass}`} />
                {hasNext && (
                  <div className={`stage-track-line ${lineClass}`} />
                )}
              </div>
              <div className={labelClass}>{STATUS_LABELS[status]}</div>
            </div>
          );
        })}

        {/* Terminal Node (Won or Lost) */}
        {isWon && (
          <div className="stage-track-step">
            <div className="stage-track-node-container">
              <div className="stage-track-node node-won" />
            </div>
            <div className="stage-track-label">Won</div>
          </div>
        )}
        
        {isLost && (
          <div className="stage-track-step">
            <div className="stage-track-node-container">
              <div className="stage-track-node node-lost" />
            </div>
            <div className="stage-track-label">Lost</div>
          </div>
        )}
      </div>
    </div>
  );
}
