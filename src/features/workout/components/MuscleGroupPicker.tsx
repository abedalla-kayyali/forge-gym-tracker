import { useMemo } from 'react';
import type { MuscleGroup } from '../../../types/workout';
import { BodyMap, MUSCLE_LABELS, MUSCLE_ORDER } from '../../../components/body/BodyMap';

interface Props {
  selected: MuscleGroup | null;
  onSelect: (muscle: MuscleGroup) => void;
}

/**
 * Premium muscle-group picker — taps a region on the body map to select,
 * and mirrors the selection as a scrollable chip row so users can also pick
 * by label. Single-select.
 */
export function MuscleGroupPicker({ selected, onSelect }: Props) {
  const selectedSet = useMemo(
    () => new Set<MuscleGroup>(selected ? [selected] : []),
    [selected],
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Body-map selector */}
      <div className="card-elevated rounded-2xl p-2 pt-3 card-luxury-border">
        <div className="flex items-center justify-between px-2 mb-1">
          <span className="label-cap">Tap a muscle</span>
          <span className="label-cap text-forge-green/80">
            {selected ? MUSCLE_LABELS[selected] : 'None selected'}
          </span>
        </div>
        <BodyMap
          selected={selectedSet}
          onSelect={onSelect}
          interactive
          maxWidth={320}
        />
      </div>

      {/* Fallback chip row */}
      <div className="overflow-x-auto -mx-1 px-1 scroll-hint">
        <div className="flex gap-2 snap-x snap-mandatory">
          {MUSCLE_ORDER.map((m) => {
            const isSel = selected === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => onSelect(m)}
                className={[
                  'shrink-0 snap-start',
                  'px-3.5 py-2 rounded-full text-[13px] font-condensed uppercase tracking-wider',
                  'cursor-pointer press-scale transition-all duration-200 min-h-[38px]',
                  isSel
                    ? 'bg-gradient-to-br from-forge-green to-forge-green-dark text-forge-bg-deep font-semibold shadow-[0_4px_14px_rgba(46,204,113,0.3)]'
                    : 'bg-white/[0.04] text-forge-text-soft border border-white/[0.06] hover:text-forge-text hover:bg-white/[0.08]',
                ].join(' ')}
                aria-pressed={isSel}
              >
                {MUSCLE_LABELS[m]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
