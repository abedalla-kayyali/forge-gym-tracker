import { useMemo, type ReactNode } from 'react';
import type { MuscleGroup } from '../../types/workout';
import { PATHS_BY_MUSCLE, DECORATIVE_PATHS, BODY_MAP_CENTROIDS, BODY_MAP_VIEWBOX } from './body-map-data';

/**
 * FORGE anatomical body map — 100% SVG, every path vector-traced from the
 * reference asset `public/body-map.png`. No raster at runtime.
 *
 * Viewbox: PNG pixel space (475×460). Front silhouette on the left half,
 * back on the right half. Each MuscleGroup is rendered as a <g> containing
 * the union of its traced sub-paths, so clicking any part of (e.g.) the
 * chest lights up both pecs simultaneously.
 */

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Chest', back: 'Back', shoulders: 'Shoulders',
  biceps: 'Biceps', triceps: 'Triceps', forearms: 'Forearms',
  core: 'Core', legs: 'Legs', glutes: 'Glutes', calves: 'Calves',
};

export const MUSCLE_ORDER: MuscleGroup[] = [
  'chest', 'shoulders', 'biceps', 'forearms', 'core',
  'back', 'triceps', 'glutes', 'legs', 'calves',
];

// Re-export for consumers (SessionPoster still uses legacy ellipse shape)
export { BODY_MAP_VIEWBOX };
export const BODY_MAP_REGIONS: Record<MuscleGroup, { type: 'ellipse'; cx: number; cy: number; rx: number; ry: number }[]> =
  Object.fromEntries(
    (Object.entries(BODY_MAP_CENTROIDS) as [MuscleGroup, { cx: number; cy: number }[]][])
      .map(([k, arr]) => [
        k,
        arr.map((c) => ({ type: 'ellipse' as const, cx: c.cx, cy: c.cy, rx: 18, ry: 22 })),
      ]),
  ) as Record<MuscleGroup, { type: 'ellipse'; cx: number; cy: number; rx: number; ry: number }[]>;

export interface BodyMapProps {
  selected?: Set<MuscleGroup> | MuscleGroup[];
  tints?: Partial<Record<MuscleGroup, string>>;
  values?: Partial<Record<MuscleGroup, string | number>>;
  onSelect?: (m: MuscleGroup) => void;
  interactive?: boolean;
  maxWidth?: number;
  className?: string;
  showLegend?: boolean;
  overlay?: ReactNode;
}

const BASE_FILL = 'url(#bm-muscle)';
const STROKE_W = 0.7;

export function BodyMap({
  selected, tints, values, onSelect,
  interactive = false, maxWidth = 360, className = '',
  showLegend = false, overlay,
}: BodyMapProps) {
  const selectedSet = useMemo(
    () => (selected instanceof Set ? selected : new Set(selected ?? [])),
    [selected],
  );
  const isInteractive = interactive && !!onSelect;

  return (
    <div
      className={`relative mx-auto w-full ${className}`}
      style={{ maxWidth }}
      role={isInteractive ? 'group' : 'img'}
      aria-label="Body muscle map"
    >
      <svg
        viewBox={`0 0 ${BODY_MAP_VIEWBOX.w} ${BODY_MAP_VIEWBOX.h}`}
        preserveAspectRatio="xMidYMid meet"
        className="block w-full h-auto"
      >
        <defs>
          <linearGradient id="bm-green" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#58d68d" />
            <stop offset="100%" stopColor="#1e9e55" />
          </linearGradient>
          <linearGradient id="bm-muscle" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#9ca3af" />
            <stop offset="100%" stopColor="#6b7280" />
          </linearGradient>
          <filter id="bm-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feFlood floodColor="#2ecc71" floodOpacity="0.25" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="bm-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="#8a9098" />
            <stop offset="100%" stopColor="#747a83" />
          </linearGradient>
        </defs>

        {/* Decorative paths — head, neck, knees, hands, feet, artifacts.
            Drawn first (behind), not clickable. */}
        <g pointerEvents="none">
          {DECORATIVE_PATHS.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="url(#bm-body)"
              stroke="rgba(255,255,255,0.22)"
              strokeWidth={STROKE_W}
              strokeLinejoin="round"
            />
          ))}
        </g>

        {/* Muscle groups — each rendered as a <g> with all its traced sub-paths */}
        {MUSCLE_ORDER.map((muscle) => {
          const paths = PATHS_BY_MUSCLE[muscle];
          if (!paths || paths.length === 0) return null;

          const active = selectedSet.has(muscle);
          const tint = tints?.[muscle];
          const fill = tint ?? (active ? 'url(#bm-green)' : BASE_FILL);
          const fillOpacity = active ? 1 : tint ? 0.92 : 1;
          const filter = active ? 'url(#bm-glow)' : undefined;

          const handleClick = isInteractive ? () => onSelect!(muscle) : undefined;
          const style: React.CSSProperties = {
            cursor: isInteractive ? 'pointer' : 'default',
            pointerEvents: isInteractive ? 'auto' : 'none',
            transition: 'fill 220ms ease, filter 220ms ease',
          };

          return (
            <g
              key={muscle}
              onClick={handleClick}
              onKeyDown={(e) => {
                if (!isInteractive) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect!(muscle);
                }
              }}
              tabIndex={isInteractive ? 0 : -1}
              role={isInteractive ? 'button' : undefined}
              aria-label={isInteractive ? `${active ? 'Selected ' : ''}${MUSCLE_LABELS[muscle]}` : undefined}
              aria-pressed={isInteractive ? active : undefined}
              className={isInteractive ? 'bm-region' : undefined}
              style={style}
            >
              {paths.map((d, i) => (
                <path
                  key={i}
                  d={d}
                  fill={fill}
                  fillOpacity={fillOpacity}
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth={STROKE_W}
                  strokeLinejoin="round"
                  filter={filter}
                />
              ))}
              {/* Value badge (heatmap mode) */}
              {values?.[muscle] !== undefined && BODY_MAP_CENTROIDS[muscle][0] && (
                <g pointerEvents="none">
                  <circle
                    cx={BODY_MAP_CENTROIDS[muscle][0].cx}
                    cy={BODY_MAP_CENTROIDS[muscle][0].cy}
                    r={11}
                    fill="rgba(0,0,0,0.45)"
                  />
                  <text
                    x={BODY_MAP_CENTROIDS[muscle][0].cx}
                    y={BODY_MAP_CENTROIDS[muscle][0].cy + 4}
                    textAnchor="middle"
                    fontSize="11"
                    fontFamily="DM Mono, monospace"
                    fontWeight={700}
                    fill="#ffffff"
                    opacity={0.95}
                  >
                    {values[muscle]}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Front / Back labels */}
        <g pointerEvents="none">
          <text x={120} y={456} textAnchor="middle" fontSize="10" fontFamily="Barlow Condensed, sans-serif"
                fontWeight={600} letterSpacing={2.5} fill="rgba(255,255,255,0.45)">FRONT</text>
          <text x={355} y={456} textAnchor="middle" fontSize="10" fontFamily="Barlow Condensed, sans-serif"
                fontWeight={600} letterSpacing={2.5} fill="rgba(255,255,255,0.45)">BACK</text>
        </g>
      </svg>

      <style>{`
        .bm-region:not([aria-pressed="true"]):hover path {
          fill: #3ecf8e !important;
          fill-opacity: 0.85 !important;
        }
        .bm-region[aria-pressed="true"]:hover path {
          opacity: 0.88;
        }
        .bm-region:focus-visible { outline: none; }
        .bm-region:focus-visible path {
          stroke: #58d68d !important;
          stroke-width: ${STROKE_W * 3};
        }
      `}</style>

      {overlay && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {overlay}
        </div>
      )}

      {showLegend && (
        <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10px] font-condensed text-forge-muted">
          <LegendDot color="#EF4444" label="Sore" />
          <LegendDot color="#2ecc71" label="Worked" />
          <LegendDot color="#8BC34A" label="Recovering" />
          <LegendDot color="#F59E0B" label="Ready" />
          <LegendDot color="#4B5563" label="Overdue" />
        </div>
      )}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block w-2 h-2 rounded-full"
        style={{ background: color, boxShadow: `0 0 6px ${color}88` }}
      />
      {label}
    </span>
  );
}
