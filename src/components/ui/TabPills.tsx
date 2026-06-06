import { type ReactNode } from 'react';
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
 * Active: luxury-green gradient pill. Inactive: glass white hover-to-text.
 * Scroll-hints fade on overflow. Haptic tap on change.
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
  const sizeClass = size === 'sm'
    ? 'px-3 py-1.5 min-h-[34px] text-[11px]'
    : 'px-3.5 py-2 min-h-[38px] text-[12px]';

  return (
    <div className={`scroll-hint overflow-x-auto -mx-1 px-1 ${className}`} role="tablist" aria-label={ariaLabel}>
      <div className="flex gap-2">
        {tabs.map((t) => {
          const active = value === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-pressed={active}
              onClick={() => { if (!active) play('tap'); onChange(t.id); }}
              className={[
                'shrink-0 inline-flex items-center gap-1.5 rounded-full',
                sizeClass,
                'cursor-pointer press-scale transition-all duration-200',
                'font-condensed uppercase tracking-wider',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge-green',
                active
                  ? 'bg-gradient-to-br from-forge-green to-forge-green-dark text-forge-bg-deep font-semibold shadow-[0_4px_14px_rgba(46,204,113,0.32)]'
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
