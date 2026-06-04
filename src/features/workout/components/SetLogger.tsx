import { useState, useCallback, useEffect, useMemo } from 'react';
import { Plus, Minus, Copy, X, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useGhostSets } from '../hooks/useGhostSets';
import { useWorkoutStore } from '../../../stores/useWorkoutStore';
import { useFX } from '../../../hooks/useFX';
import type { WorkoutSet } from '../../../types/workout';

interface Props {
  exerciseName: string;
  sets: WorkoutSet[];
  onAddSet: (set: WorkoutSet) => void;
  onRemoveSet: (index: number) => void;
}

export function SetLogger({ exerciseName, sets, onAddSet, onRemoveSet }: Props) {
  const { t } = useTranslation();
  const { play } = useFX();
  const ghostSets = useGhostSets(exerciseName);
  const workouts = useWorkoutStore((s) => s.workouts);
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [prFlash, setPrFlash] = useState(false);

  // All-time best weight logged for this exercise (for real-time PR detection).
  const histBest = useMemo(() => {
    let m = 0;
    const key = exerciseName.toLowerCase();
    for (const w of workouts) {
      for (const ex of w.exercises) {
        if (ex.name.toLowerCase() === key) {
          for (const s of ex.sets) if ((s.weight ?? 0) > m) m = s.weight ?? 0;
        }
      }
    }
    return m;
  }, [workouts, exerciseName]);

  // Which of the in-progress sets are new records (running max from the all-time best).
  const prFlags = useMemo(() => {
    let running = histBest;
    return sets.map((s) => {
      if (s.weight > 0 && s.weight > running) { running = s.weight; return true; }
      return false;
    });
  }, [sets, histBest]);

  // Prefill from "last time" whenever the exercise changes and we're starting
  // fresh — so the user can tap Add immediately. Gets easier the more history
  // exists for an exercise.
  useEffect(() => {
    if (ghostSets.length > 0) {
      const g = ghostSets[0]!;
      setReps(String(g.reps));
      setWeight(String(g.weight));
    } else {
      setReps('');
      setWeight('');
    }
    // Only re-run when switching exercises, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseName]);

  // Reference set for the progressive-overload nudge: the last set logged this
  // session, else the most representative set from last time.
  const lastRef = sets[sets.length - 1] ?? ghostSets[0];
  const overloadReps = lastRef ? lastRef.reps : null;
  const overloadWeight = lastRef ? Math.round((lastRef.weight + 2.5) * 4) / 4 : null;

  const handleAdd = useCallback(() => {
    const r = parseInt(reps, 10);
    const w = parseFloat(weight);
    if (isNaN(r) || r <= 0 || isNaN(w) || w < 0) return;
    // Real-time PR: this set beats the best weight seen so far for this exercise.
    const priorBest = Math.max(histBest, 0, ...sets.map((s) => s.weight));
    const willPR = w > 0 && w > priorBest;
    onAddSet({ reps: r, weight: w });
    if (willPR) {
      play('pr');
      setPrFlash(true);
      window.setTimeout(() => setPrFlash(false), 1300);
    }
    // Keep the values so tapping Add again logs another identical set fast.
  }, [reps, weight, onAddSet, histBest, sets, play]);

  const adjustReps = (d: number) =>
    setReps((v) => String(Math.max(0, (parseInt(v, 10) || 0) + d)));
  const adjustWeight = (d: number) =>
    setWeight((v) => String(Math.max(0, Math.round(((parseFloat(v) || 0) + d) * 4) / 4)));

  const handleDitto = useCallback(() => {
    const lastSet = sets[sets.length - 1];
    if (lastSet) {
      onAddSet({ reps: lastSet.reps, weight: lastSet.weight, rpe: lastSet.rpe });
    } else if (ghostSets.length > 0) {
      const ghost = ghostSets[0];
      if (ghost) onAddSet({ reps: ghost.reps, weight: ghost.weight, rpe: ghost.rpe });
    }
  }, [sets, ghostSets, onAddSet]);

  const applyOverload = () => {
    if (overloadReps != null && overloadWeight != null) {
      setReps(String(overloadReps));
      setWeight(String(overloadWeight));
    }
  };

  return (
    <div
      className="space-y-3 rounded-2xl transition-shadow duration-300"
      style={prFlash ? { boxShadow: '0 0 0 2px rgba(212,175,55,0.6), 0 0 28px rgba(212,175,55,0.35)' } : undefined}
    >
      {/* Ghost sets hint */}
      {sets.length === 0 && ghostSets.length > 0 && (
        <div className="card-elevated rounded-xl px-3.5 py-2.5 border border-forge-green/10">
          <div className="text-forge-dim text-xs font-condensed uppercase tracking-wider mb-1">{t('log.lastTime')}</div>
          <div className="flex flex-wrap gap-2">
            {ghostSets.map((g, i) => (
              <span key={i} className="text-forge-green/70 text-xs font-mono bg-forge-green/5 px-2 py-0.5 rounded-lg">
                {g.reps} × {g.weight}{t('log.kgUnit')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Logged sets */}
      {sets.length > 0 && (
        <div className="space-y-1.5">
          <div className="grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 text-forge-dim text-[10px] font-condensed uppercase tracking-wider px-1">
            <span>#</span><span>{t('log.reps')}</span><span>{t('log.weight')}</span><span></span>
          </div>
          {sets.map((s, i) => (
            <div key={i} className="grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 items-center card-elevated rounded-xl px-3 py-2.5 text-sm">
              <span className="text-forge-dim font-mono text-xs">{i + 1}</span>
              <span className="text-forge-text font-mono">{s.reps}</span>
              <span className="text-forge-text font-mono flex items-center gap-1">
                {s.weight}
                {prFlags[i] && (
                  <span className="text-[8px] font-condensed font-bold text-forge-gold bg-forge-gold/15 border border-forge-gold/30 rounded px-1 py-0.5 leading-none">{t('log.prBadge')}</span>
                )}
              </span>
              <button onClick={() => onRemoveSet(i)} className="text-forge-dim hover:text-red-400 cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors duration-150" aria-label={t('log.removeSet')}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Progressive-overload nudge */}
      {lastRef && overloadReps != null && overloadWeight != null && (
        <button
          type="button"
          onClick={applyOverload}
          className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-forge-green/25 bg-forge-green/[0.08] text-forge-green py-2 text-xs font-condensed uppercase tracking-wider cursor-pointer press-scale hover:bg-forge-green/[0.14] transition-all duration-200"
        >
          <TrendingUp size={13} />
          {t('log.beatLast')} · {overloadReps} × {overloadWeight}{t('log.kgUnit')}
        </button>
      )}

      {/* Input row with thumb-sized steppers */}
      <div className="grid grid-cols-2 gap-2">
        <StepperField
          label={t('log.reps')}
          value={reps}
          onChange={setReps}
          onDec={() => adjustReps(-1)}
          onInc={() => adjustReps(1)}
          decLabel={t('log.decreaseReps')}
          incLabel={t('log.increaseReps')}
          inputMode="numeric"
          onEnter={handleAdd}
        />
        <StepperField
          label={`${t('log.weight')} (${t('log.kgUnit')})`}
          value={weight}
          onChange={setWeight}
          onDec={() => adjustWeight(-2.5)}
          onInc={() => adjustWeight(2.5)}
          decLabel={t('log.decreaseWeight')}
          incLabel={t('log.increaseWeight')}
          inputMode="decimal"
          onEnter={handleAdd}
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button onClick={handleAdd} disabled={!reps || !weight}
          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-br from-forge-green to-forge-green-dark text-forge-bg py-3 rounded-xl font-condensed font-semibold text-sm cursor-pointer press-scale min-h-[44px] shadow-[0_4px_16px_rgba(46,204,113,0.25)] disabled:opacity-40 disabled:pointer-events-none transition-all duration-200">
          <Plus size={16} /><span>{t('log.addSet')}</span>
        </button>
        <button onClick={handleDitto} disabled={sets.length === 0 && ghostSets.length === 0}
          className="flex items-center justify-center gap-2 card-elevated text-forge-muted px-5 py-3 rounded-xl font-condensed text-sm cursor-pointer press-scale min-h-[44px] hover:text-forge-text disabled:opacity-40 disabled:pointer-events-none transition-all duration-200">
          <Copy size={14} /><span>{t('log.ditto')}</span>
        </button>
      </div>
    </div>
  );
}

function StepperField({
  label, value, onChange, onDec, onInc, decLabel, incLabel, inputMode, onEnter,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onDec: () => void;
  onInc: () => void;
  decLabel: string;
  incLabel: string;
  inputMode: 'numeric' | 'decimal';
  onEnter: () => void;
}) {
  return (
    <div>
      <label className="block text-forge-dim text-[10px] font-condensed uppercase tracking-wider mb-1 px-1">{label}</label>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onDec}
          aria-label={decLabel}
          className="shrink-0 w-11 h-11 rounded-xl card-elevated border border-forge-border-light flex items-center justify-center cursor-pointer press-scale text-forge-muted hover:text-forge-text transition-colors duration-150"
        >
          <Minus size={16} />
        </button>
        <input
          type="number"
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onEnter()}
          className="w-full min-w-0 bg-[#0a0d0b] border border-[rgba(255,255,255,0.06)] rounded-xl px-2 py-3 text-center text-forge-text text-base font-mono min-h-[44px] placeholder:text-forge-muted/40 focus:outline-none focus:border-forge-green/40 focus:shadow-[0_0_0_3px_rgba(46,204,113,0.12)] transition-all duration-200"
        />
        <button
          type="button"
          onClick={onInc}
          aria-label={incLabel}
          className="shrink-0 w-11 h-11 rounded-xl card-elevated border border-forge-border-light flex items-center justify-center cursor-pointer press-scale text-forge-muted hover:text-forge-text transition-colors duration-150"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
