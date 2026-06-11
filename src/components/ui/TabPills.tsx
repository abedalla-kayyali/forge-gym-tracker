import { useCallback, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useFX } from '../../hooks/useFX';

export interface TabPill<T extends string> {
  id: T;
  label: string;
  Icon?: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  badge?: ReactNode;
}

interface Props<T extends string> {
  tabs: TabPill<T>[];
  value: T;
  onChange: (next: T) => void;
  /** Extra className for outer wrapper */
  className?: string;
  /** Size preset. Default 'md' (38px min-height). */
  size?: 'sm' | 'md';
  /** Optional label shown before the tabs for context */
  ariaLabel?: string;
}

/**
 * Unified sub-nav tab pills used across Stats / Coach / Social / History / etc.
 * Active: luxury-green gradient pill that *slides* between tabs (spring easing,
 * auto-disabled by the global reduced-motion rule). Inactive: glass white
 * hover-to-text. Roving tabindex + arrow keys (RTL-aware). Scroll-hints fade
 * on overflow. Haptic tap on change.
 */
export function TabPills<T extends string>({
  tabs,
  value,
  onChange,
  className = '',
  size = 'md',
  ariaLabel = 'Sub navigation',
}: Props<T>) {
  const { play } = useFX();
  const listRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef(new Map<T, HTMLButtonElement>());
  const valueRef = useRef(value);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  // Measure the active button so the indicator can translate to it. Reads the
  // current value from a ref so the ResizeObserver never sees a stale closure.
  const measure = useCallback(() => {
    const btn = btnRefs.current.get(valueRef.current);
    if (!btn) {
      setIndicator(null);
      return;
    }
    setIndicator((prev) => {
      const next = { left: btn.offsetLeft, width: btn.offsetWidth };
      return prev && prev.left === next.left && prev.width === next.width ? prev : next;
    });
  }, []);

  // Re-measure after every render (cheap; setState bails out when unchanged)
  // so value/tabs/size/label changes all keep the indicator in sync.
  useLayoutEffect(() => {
    valueRef.current = value;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- DOM measurement must set state before paint (sanctioned useLayoutEffect pattern); the setter bails out when unchanged.
    measure();
  });

  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const select = (id: T) => {
    if (id !== value) {
      play('tap');
      onChange(id);
    }
    btnRefs.current.get(id)?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const idx = tabs.findIndex((t) => t.id === value);
    if (idx < 0 || tabs.length === 0) return;
    const rtl = window.getComputedStyle(e.currentTarget).direction === 'rtl';
    let next: number;
    switch (e.key) {
      case 'ArrowRight':
        next = rtl ? idx - 1 : idx + 1;
        break;
      case 'ArrowLeft':
        next = rtl ? idx + 1 : idx - 1;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = tabs.length - 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    const target = tabs[(next + tabs.length) % tabs.length];
    if (target) select(target.id);
  };

  const sizeClass = size === 'sm'
    ? 'px-3 py-1.5 min-h-[34px] text-[11px]'
    : 'px-3.5 py-2 min-h-[38px] text-[12px]';

  return (
    <div
      className={`scroll-hint overflow-x-auto -mx-1 px-1 ${className}`}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
    >
      <div ref={listRef} className="relative flex gap-2">
        {/* Sliding active indicator (single gradient pill translating between tabs).
            offsetLeft/translateX are physical, so this is RTL-correct as-is. */}
        {indicator && (
          <span
            aria-hidden
            className={[
              'absolute top-0 bottom-0 left-0 rounded-full pointer-events-none',
              'bg-gradient-to-br from-forge-green to-forge-green-dark',
              'shadow-[0_4px_14px_rgba(46,204,113,0.32)]',
              'transition-[transform,width] duration-300 [transition-timing-function:var(--ease-spring)]',
            ].join(' ')}
            style={{ width: indicator.width, transform: `translateX(${indicator.left}px)` }}
          />
        )}
        {tabs.map((t) => {
          const active = value === t.id;
          return (
            <button
              key={t.id}
              ref={(el) => {
                if (el) btnRefs.current.set(t.id, el);
                else btnRefs.current.delete(t.id);
              }}
              type="button"
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => select(t.id)}
              className={[
                'relative z-[1] shrink-0 inline-flex items-center gap-1.5 rounded-full',
                sizeClass,
                'cursor-pointer press-scale transition-colors duration-200',
                'font-condensed uppercase tracking-wider',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge-green',
                active
                  ? 'text-forge-bg-deep font-semibold'
                  : 'bg-white/[0.04] text-forge-text-soft border border-white/[0.06] hover:text-forge-text hover:bg-white/[0.08]',
              ].join(' ')}
            >
              {t.Icon && (
                <t.Icon size={13} strokeWidth={active ? 2.4 : 1.8} />
              )}
              <span>{t.label}</span>
              {t.badge && <span className="ms-1">{t.badge}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
