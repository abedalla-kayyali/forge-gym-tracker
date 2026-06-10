import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../../lib/fx';

interface Props {
  value: number;
  durationMs?: number;
  /** Decimal places kept while animating (and in the default render). Default 0. */
  decimals?: number;
  format?: (n: number) => string;
  className?: string;
}

/**
 * Animates a number from its previous value to `value` (ease-out). Honours
 * prefers-reduced-motion (snaps instantly). Uses rAF + performance.now().
 * Pass `decimals` for fractional values (e.g. 72.5 kg → decimals={1}).
 */
export function CountUp({ value, durationMs = 900, decimals = 0, format, className }: Props) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const to = value;
    const from = fromRef.current;
    if (prefersReducedMotion() || from === to) {
      setDisplay(to);
      fromRef.current = to;
      return;
    }
    const factor = 10 ** Math.max(0, decimals);
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setDisplay(Math.round((from + (to - from) * eased) * factor) / factor);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = to;
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [value, durationMs, decimals]);

  const rendered = format
    ? format(display)
    : decimals > 0
      ? display.toFixed(decimals)
      : display;
  return <span className={className}>{rendered}</span>;
}
