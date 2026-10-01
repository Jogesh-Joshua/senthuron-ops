// src/components/dashboard/StageMark.tsx
// Progressive-fill circle glyph + label per the UI spec §3.5.
// Pure server component — no interactivity.



const STAGE_CONFIG: Record<string, { color: string; fill: number; cross?: boolean; tick?: boolean }> = {
  NEW:           { color: "#4B5A6B", fill: 0 },
  CONTACTED:     { color: "#2F5F8A", fill: 0.25 },
  QUALIFIED:     { color: "#1E6B66", fill: 0.5 },
  PROPOSAL_SENT: { color: "#7A4E00", fill: 0.75 },
  NEGOTIATION:   { color: "#963F14", fill: 0.917 },
  WON:           { color: "#23663F", fill: 1, tick: true },
  LOST:          { color: "#5F584D", fill: 0, cross: true },
};

const STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  PROPOSAL_SENT: "Proposal Sent",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
};

interface StageMarkProps {
  status: string;
  showLabel?: boolean;
  size?: number;
}

/** Build the SVG arc path for a partial fill */
function buildArcPath(fill: number, r: number, cx: number, cy: number): string {
  if (fill === 0) return "";
  if (fill >= 1) return "";

  const angle = fill * 2 * Math.PI;
  const startX = cx;
  const startY = cy - r;
  const endX = cx + r * Math.sin(angle);
  const endY = cy - r * Math.cos(angle);
  const large = fill > 0.5 ? 1 : 0;

  return `M ${cx} ${cy} L ${startX} ${startY} A ${r} ${r} 0 ${large} 1 ${endX} ${endY} Z`;
}

export function StageMark({ status, showLabel = true, size = 16 }: StageMarkProps) {
  const config = STAGE_CONFIG[status] ?? STAGE_CONFIG.NEW;
  const label = STATUS_LABELS[status] ?? status;
  const cx = size / 2;
  const cy = size / 2;
  const r = (size / 2) - 1.5;

  return (
    <span className="stage-mark" style={{ color: config.color }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        {/* Ring */}
        <circle cx={cx} cy={cy} r={r} stroke={config.color} strokeWidth="1.5" fill="none"/>

        {/* Partial fill wedge */}
        {config.fill > 0 && config.fill < 1 && (
          <path
            d={buildArcPath(config.fill, r, cx, cy)}
            fill={config.color}
          />
        )}

        {/* Full fill */}
        {config.fill >= 1 && !config.cross && (
          <circle cx={cx} cy={cy} r={r} fill={config.color}/>
        )}

        {/* Tick for Won */}
        {config.tick && (
          <polyline
            points={`${size * 0.28} ${size * 0.52} ${size * 0.44} ${size * 0.68} ${size * 0.72} ${size * 0.36}`}
            stroke="#FBF9F4"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}

        {/* Diagonal slash for Lost */}
        {config.cross && (
          <line
            x1={cx + r * 0.55}
            y1={cy - r * 0.55}
            x2={cx - r * 0.55}
            y2={cy + r * 0.55}
            stroke={config.color}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        )}
      </svg>

      {showLabel && (
        <span style={status === "LOST" ? { textDecoration: "line-through" } : undefined}>
          {label}
        </span>
      )}
    </span>
  );
}
