import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Minus, Plus } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { useFX } from '../../../hooks/useFX';
import {
  useGoalsStore,
  WEEKLY_SESSIONS_MIN,
  WEEKLY_SESSIONS_MAX,
  type WeightDirection,
} from '../../../stores/useGoalsStore';
import { useNutritionStore } from '../../../stores/useNutritionStore';
import { formatNumber } from '../../../lib/format';

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Numeric input that commits on blur or Enter only (project convention —
 * committing oninput would re-render mid-typing). Empty input commits null.
 */
function CommitNumberInput({
  initial,
  onCommit,
  placeholder,
  ariaLabel,
  step = '0.1',
}: {
  initial: number | null;
  onCommit: (value: number | null) => void;
  placeholder: string;
  ariaLabel: string;
  step?: string;
}) {
  const [text, setText] = useState(initial !== null ? String(initial) : '');

  const commit = () => {
    const trimmed = text.trim();
    if (trimmed === '') {
      onCommit(null);
      return;
    }
    const n = Number(trimmed);
    onCommit(Number.isFinite(n) && n > 0 ? n : null);
  };

  return (
    <input
      type="number"
      inputMode="decimal"
      step={step}
      min="0"
      value={text}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
      }}
      className="w-full bg-forge-surface border border-forge-border rounded-xl px-3 py-2.5 text-forge-text text-sm font-mono min-h-[44px] placeholder:text-forge-muted/40 focus:outline-none focus:border-forge-green/50 transition-all duration-200"
    />
  );
}

const DIRECTIONS: WeightDirection[] = ['lose', 'maintain', 'gain'];

/** Bottom-sheet editor for all goal targets. Writes straight to useGoalsStore. */
export function GoalEditor({ open, onClose }: Props) {
  const { t } = useTranslation();
  const { play } = useFX();
  const weeklySessions = useGoalsStore((s) => s.weeklySessions);
  const targetWeightKg = useGoalsStore((s) => s.targetWeightKg);
  const weightDirection = useGoalsStore((s) => s.weightDirection);
  const proteinTargetG = useGoalsStore((s) => s.proteinTargetG);
  const setWeeklySessions = useGoalsStore((s) => s.setWeeklySessions);
  const setTargetWeightKg = useGoalsStore((s) => s.setTargetWeightKg);
  const setWeightDirection = useGoalsStore((s) => s.setWeightDirection);
  const setProteinTargetG = useGoalsStore((s) => s.setProteinTargetG);
  const macroProtein = useNutritionStore((s) => s.macroTargets.protein_g);

  const stepGoal = (delta: number) => {
    setWeeklySessions(weeklySessions + delta);
    play('tap');
  };

  return (
    <Modal open={open} onClose={onClose} title={t('goals.editor.title')} subtitle={t('goals.editor.subtitle')} size="sm">
      <div className="space-y-5">
        {/* Weekly sessions stepper */}
        <div className="space-y-2">
          <span className="label-cap block">{t('goals.editor.weeklySessions')}</span>
          <div className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/[0.05] px-3 py-2">
            <button
              type="button"
              onClick={() => stepGoal(-1)}
              disabled={weeklySessions <= WEEKLY_SESSIONS_MIN}
              className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-forge-text-soft disabled:opacity-30 cursor-pointer press-scale transition-colors hover:bg-white/10"
              aria-label={t('goals.editor.decreaseSessions')}
            >
              <Minus size={14} />
            </button>
            <span className="kpi-md text-forge-green font-mono tabular-nums" aria-live="polite">
              {formatNumber(weeklySessions)}
              <span className="text-[10px] text-forge-muted ms-1">{t('goals.editor.perWeek')}</span>
            </span>
            <button
              type="button"
              onClick={() => stepGoal(1)}
              disabled={weeklySessions >= WEEKLY_SESSIONS_MAX}
              className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-forge-text-soft disabled:opacity-30 cursor-pointer press-scale transition-colors hover:bg-white/10"
              aria-label={t('goals.editor.increaseSessions')}
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Target weight (commit on blur / Enter) */}
        <div className="space-y-2">
          <span className="label-cap block">{t('goals.editor.targetWeight')}</span>
          <CommitNumberInput
            initial={targetWeightKg}
            onCommit={setTargetWeightKg}
            placeholder={t('goals.editor.targetWeightPlaceholder')}
            ariaLabel={t('goals.editor.targetWeight')}
          />
        </div>

        {/* Direction segmented control */}
        <div className="space-y-2">
          <span className="label-cap block">{t('goals.editor.direction')}</span>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-white/[0.03] border border-white/[0.05] p-1" role="radiogroup" aria-label={t('goals.editor.direction')}>
            {DIRECTIONS.map((d) => {
              const active = weightDirection === d;
              return (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => { setWeightDirection(d); play('tap'); }}
                  className={[
                    'rounded-lg px-2 py-2 text-[12px] font-condensed font-semibold uppercase tracking-wider min-h-[40px] cursor-pointer press-scale transition-all duration-200',
                    active
                      ? 'bg-forge-green/15 border border-forge-green/40 text-forge-green'
                      : 'border border-transparent text-forge-muted hover:text-forge-text',
                  ].join(' ')}
                >
                  {t(`goals.editor.${d}`)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Protein target (commit on blur / Enter; empty = macro targets) */}
        <div className="space-y-2">
          <span className="label-cap block">{t('goals.editor.proteinTarget')}</span>
          <CommitNumberInput
            initial={proteinTargetG}
            onCommit={setProteinTargetG}
            placeholder={t('goals.editor.proteinPlaceholder', { grams: macroProtein })}
            ariaLabel={t('goals.editor.proteinTarget')}
            step="1"
          />
          <p className="text-forge-dim text-[10px] font-condensed">
            {t('goals.editor.proteinHint', { grams: macroProtein })}
          </p>
        </div>

        <Button variant="primary" size="md" fullWidth onClick={onClose}>
          {t('goals.editor.done')}
        </Button>
      </div>
    </Modal>
  );
}
