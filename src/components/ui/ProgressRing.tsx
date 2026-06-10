import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { prefersReducedMotion } from '../../lib/fx';

interface Props {
  /** Progress 0–1 (clamped). */
  value: number;
  /** Outer diameter in px. Default 64. */
  size?: number;
  /** Stroke width in px. Default 6. */
  stroke?: number;
  /** Progress stroke color. Default forge green. */
  color?: string;
  /** Track stroke color. Default faint white. */
  trackColor?: string;
  /** Center content (value label, icon, …). */
  children?: ReactNode;
  /** Extra className for the wrapper. */
  className?: string;
  /** Accessible name for the progressbar (pass a translated string). */
  ariaLabel?: string;
}

/**
 * Generic SVG progress ring with an animated sweep on mount (ring-sweep
 * keyframes + --circle-c/--target-offset tokens from index.css) and a smooth
 * transition on subsequent value changes. Honours prefers-reduced-motion
 * (sweep skipped; the global CSS rule also zeroes the transition).
 */
export function ProgressRing({
  value,
  size = 64,
  stroke = 6,
  color = 'var(--color-forge-green)',
  trackColor = 'rgba(255,255,255,0.06)',
  children,
  className = '',
  ariaLabel,
}: Props) {
  const clamped = Math.min(1, Math.max(0, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped);
  // Decide once per instance — the mount sweep only ever runs on first paint.
  const sweep = useMemo(() => !prefersReducedMotion(), []);

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 100)}
      aria-label={ariaLabel}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={[
            sweep ? 'animate-ring-sweep' : '',
            'transition-[stroke-dashoffset] duration-700 [transition-timing-function:var(--ease-out-quart)]',
          ].join(' ')}
          style={{
            '--circle-c': `${circumference}`,
            '--target-offset': `${offset}`,
          } as CSSProperties}
        />
      </svg>
      {children !== undefined && children !== null && (
        <div className="absolute inset-0 flex items-center justify-center">{children}</div>
      )}
    </div>
  );
}
