import { useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { MuscleGroup } from '../../types/workout';
import { PATHS_BY_MUSCLE, getDecorativePaths, BODY_MAP_CENTROIDS, BODY_MAP_VIEWBOX } from './body-map-data';
import { useProfileStore } from '../../stores/useProfileStore';
import { FRESHNESS_COLORS } from '../../lib/freshness';

/**
 * FORGE anatomical body map — 100% SVG, hand-authored clean regions.
 *
 * Viewbox 240×360: FRONT figure on the left, BACK figure on the right. Each
 * MuscleGroup is a <g> of deliberately-placed, non-overlapping anatomical
 * regions (e.g. both pecs for chest), so tapping a muscle reliably selects
 * that muscle.
 */

export const MUSCLE_ORDER: MuscleGroup[] = [
  'chest', 'shoulders', 'biceps', 'forearms', 'core',
  'back', 'triceps', 'glutes', 'legs', 'calves',
];

export { BODY_MAP_VIEWBOX };

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
const STROKE_W = 0.6;

export function BodyMap({
  selected, tints, values, onSelect,
  interactive = false, maxWidth = 360, className = '',
  showLegend = false, overlay,
}: BodyMapProps) {
  const { t } = useTranslation();
  const selectedSet = useMemo(
    () => (selected instanceof Set ? selected : new Set(selected ?? [])),
    [selected],
  );
  const isInteractive = interactive && !!onSelect;
  const sex = useProfileStore((s) => s.profile.sex);
  const decorative = useMemo(() => getDecorativePaths(sex), [sex]);

  return (
    <div
      className={`relative mx-auto w-full ${className}`}
      style={{ maxWidth }}
      role={isInteractive ? 'group' : 'img'}
      aria-label={t('bodyMap.mapAria')}
    >
      <svg
        viewBox={`0 0 ${BODY_MAP_VIEWBOX.w} ${BODY_MAP_VIEWBOX.h}`}
        preserveAspectRatio="xMidYMid meet"
        className="block w-full h-auto"
      >
        <defs>
          {/* Selected muscle — signature green, lit from above */}
          <linearGradient id="bm-green" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#62dd97" />
            <stop offset="55%"  stopColor="#2ecc71" />
            <stop offset="100%" stopColor="#1e9e55" />
          </linearGradient>
          {/* Idle muscle — sculpted steel with a faint top sheen */}
          <linearGradient id="bm-muscle" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#525c66" />
            <stop offset="45%"  stopColor="#434c55" />
            <stop offset="100%" stopColor="#353d45" />
          </linearGradient>
          {/* Silhouette under-layer — deep graphite so muscles read in relief */}
          <linearGradient id="bm-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#262d34" />
            <stop offset="100%" stopColor="#181d22" />
          </linearGradient>
          {/* Ambient aura behind each figure */}
          <radialGradient id="bm-aura" cx="50%" cy="42%" r="60%">
            <stop offset="0%"   stopColor="rgba(46,204,113,0.10)" />
            <stop offset="55%"  stopColor="rgba(46,204,113,0.04)" />
            <stop offset="100%" stopColor="rgba(46,204,113,0)" />
          </radialGradient>
          {/* Green glow for the selected muscle */}
          <filter id="bm-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.6" result="blur" />
            <feFlood floodColor="#2ecc71" floodOpacity="0.32" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Soft grounding shadow under the whole figure */}
          <filter id="bm-soft" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="1.4" stdDeviation="2.2" floodColor="#000000" floodOpacity="0.45" />
          </filter>
        </defs>

        {/* Ambient halos — pure atmosphere, never interactive */}
        <g pointerEvents="none" aria-hidden="true">
          <ellipse cx={70}  cy={150} rx={60} ry={138} fill="url(#bm-aura)" />
          <ellipse cx={170} cy={150} rx={60} ry={138} fill="url(#bm-aura)" />
        </g>

        <g filter="url(#bm-soft)">
          {/* Decorative paths — head, neck, hands, feet silhouette.
              Drawn first (behind), not clickable. */}
          <g pointerEvents="none">
            {decorative.map((d, i) => (
              <path
                key={i}
                d={d}
                fill="url(#bm-body)"
                stroke="rgba(255,255,255,0.07)"
                strokeWidth={STROKE_W}
                strokeLinejoin="round"
              />
            ))}
          </g>

          {/* Muscle groups — each rendered as a <g> with all its sub-paths */}
          {MUSCLE_ORDER.map((muscle, mi) => {
            const paths = PATHS_BY_MUSCLE[muscle];
            if (!paths || paths.length === 0) return null;

            const active = selectedSet.has(muscle);
            const tint = tints?.[muscle];
            const fill = tint ?? (active ? 'url(#bm-green)' : BASE_FILL);
            const fillOpacity = active ? 1 : tint ? 0.92 : 1;
            const filter = active ? 'url(#bm-glow)' : undefined;

            const handleClick = isInteractive ? () => onSelect!(muscle) : undefined;
            const style = {
              cursor: isInteractive ? 'pointer' : 'default',
              pointerEvents: isInteractive ? 'auto' : 'none',
              transition: 'fill 220ms ease, filter 220ms ease, transform 160ms ease',
              // Stagger the heat pulse so the map breathes instead of blinking
              '--bm-delay': `${mi * 0.22}s`,
            } as React.CSSProperties;

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
                aria-label={
                  isInteractive
                    ? t(active ? 'bodyMap.regionAriaSelected' : 'bodyMap.regionAria', {
                        name: t('muscles.' + String(muscle).toLowerCase()),
                      })
                    : undefined
                }
                aria-pressed={isInteractive ? active : undefined}
                className={[isInteractive ? 'bm-region' : '', tint && !active ? 'bm-heat' : '']
                  .filter(Boolean).join(' ') || undefined}
                style={style}
              >
                {paths.map((d, i) => (
                  <path
                    key={i}
                    d={d}
                    fill={fill}
                    fillOpacity={fillOpacity}
                    stroke={active ? 'rgba(212,175,55,0.55)' : 'rgba(255,255,255,0.10)'}
                    strokeWidth={active ? 0.9 : STROKE_W}
                    strokeLinejoin="round"
                    filter={filter}
                  />
                ))}
                {/* Value badges (heatmap mode) — one per figure the muscle spans.
                    Auto-width pills so long labels (e.g. "today") never overflow. */}
                {values?.[muscle] !== undefined &&
                  BODY_MAP_CENTROIDS[muscle].map((c, ci) => {
                    const label = String(values[muscle]);
                    const w = Math.max(17, label.length * 5.4 + 7);
                    return (
                      <g pointerEvents="none" key={ci}>
                        <rect
                          x={c.cx - w / 2}
                          y={c.cy - 6.5}
                          width={w}
                          height={13}
                          rx={6.5}
                          fill="rgba(2,3,5,0.6)"
                          stroke="rgba(255,255,255,0.18)"
                          strokeWidth={0.5}
                        />
                        <text
                          x={c.cx}
                          y={c.cy + 3.2}
                          textAnchor="middle"
                          fontSize="9"
                          fontFamily="DM Mono, monospace"
                          fontWeight={700}
                          fill="#ffffff"
                          opacity={0.95}
                        >
                          {label}
                        </text>
                      </g>
                    );
                  })}
              </g>
            );
          })}
        </g>

        {/* Front / Back labels */}
        <g pointerEvents="none">
          <text x={70} y={352} textAnchor="middle" fontSize="11" fontFamily="Barlow Condensed, sans-serif"
                fontWeight={600} letterSpacing={2.5} fill="rgba(255,255,255,0.45)">{t('bodyMap.front')}</text>
          <text x={170} y={352} textAnchor="middle" fontSize="11" fontFamily="Barlow Condensed, sans-serif"
                fontWeight={600} letterSpacing={2.5} fill="rgba(255,255,255,0.45)">{t('bodyMap.back')}</text>
        </g>
      </svg>

      <style>{`
        .bm-region:not([aria-pressed="true"]):hover path {
          fill: #3ecf8e !important;
          fill-opacity: 0.7 !important;
        }
        .bm-region[aria-pressed="true"]:hover path {
          opacity: 0.88;
        }
        .bm-region:active { transform: scale(0.985); transform-box: fill-box; transform-origin: center; }
        .bm-region:focus-visible { outline: none; }
        .bm-region:focus-visible path {
          stroke: #58d68d !important;
          stroke-width: ${STROKE_W * 3};
        }
        @keyframes bm-pulse { 0%, 100% { fill-opacity: 0.78; } 50% { fill-opacity: 1; } }
        .bm-heat path { animation: bm-pulse 2.8s ease-in-out infinite; animation-delay: var(--bm-delay, 0s); }
        @media (prefers-reduced-motion: reduce) { .bm-heat path { animation: none; } }
      `}</style>

      {overlay && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {overlay}
        </div>
      )}

      {showLegend && (
        <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10px] font-condensed text-forge-muted">
          <LegendDot color={FRESHNESS_COLORS.sore}       labelKey="bodyMap.legendSore" />
          <LegendDot color={FRESHNESS_COLORS.worked}     labelKey="bodyMap.legendWorked" />
          <LegendDot color={FRESHNESS_COLORS.recovering} labelKey="bodyMap.legendRecovering" />
          <LegendDot color={FRESHNESS_COLORS.ready}      labelKey="bodyMap.legendReady" />
          <LegendDot color={FRESHNESS_COLORS.overdue}    labelKey="bodyMap.legendOverdue" />
        </div>
      )}
    </div>
  );
}

function LegendDot({ color, labelKey }: { color: string; labelKey: string }) {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block w-2 h-2 rounded-full"
        style={{ background: color, boxShadow: `0 0 6px ${color}88` }}
      />
      {t(labelKey)}
    </span>
  );
}
