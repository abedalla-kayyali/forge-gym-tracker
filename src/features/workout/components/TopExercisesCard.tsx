import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Repeat, Clock } from 'lucide-react';
import { useWorkoutStore } from '../../../stores/useWorkoutStore';
import { useBwWorkoutStore } from '../../../stores/useBwWorkoutStore';
import { useFX } from '../../../hooks/useFX';
import { ExerciseProgressionCard } from '../../dashboard/components/ExerciseProgressionCard';
import type { MuscleGroup } from '../../../types/workout';

interface Props {
  muscle: MuscleGroup | null;
  /** When a suggestion is tapped, auto-select it in the logger. */
  onPick?: (exerciseName: string) => void;
  /** Filter to bw-only or weighted-only (default: both). */
  scope?: 'weighted' | 'bodyweight' | 'any';
  /** Number of rows to show (default 3). */
  limit?: number;
  /** When true (and no `onPick`), tapping a row expands a progression chart. */
  enableProgression?: boolean;
}

interface ExerciseStat {
  name: string;
  count: number;           // number of sessions the exercise appeared in
  totalSets: number;       // total sets across all sessions
  lastDate: string;        // ISO date of most recent occurrence
  bestWeight: number;      // max weight ever (weighted only)
  bestReps: number;        // max reps in a single set
}

function daysAgo(iso: string, t: (key: string, options?: Record<string, unknown>) => string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff < 1) return t('topExercises.today');
  if (diff === 1) return t('topExercises.yesterday');
  if (diff < 7) return t('topExercises.daysAgo', { count: diff });
  if (diff < 30) return t('topExercises.weeksAgo', { count: Math.floor(diff / 7) });
  return t('topExercises.monthsAgo', { count: Math.floor(diff / 30) });
}

export function TopExercisesCard({ muscle, onPick, scope = 'any', limit = 3, enableProgression = false }: Props) {
  const { t } = useTranslation();
  const workouts = useWorkoutStore((s) => s.workouts);
  const bwWorkouts = useBwWorkoutStore((s) => s.bwWorkouts);
  const { play } = useFX();
  const [expanded, setExpanded] = useState<string | null>(null);
  const progressionMode = !onPick && enableProgression;

  const stats = useMemo<ExerciseStat[]>(() => {
    if (!muscle) return [];
    const m = muscle.toLowerCase();
    const byName = new Map<string, ExerciseStat>();

    if (scope === 'any' || scope === 'weighted') {
      for (const w of workouts) {
        for (const ex of w.exercises) {
          if (ex.muscle.toLowerCase() !== m) continue;
          const st = byName.get(ex.name) ?? {
            name: ex.name, count: 0, totalSets: 0, lastDate: w.date,
            bestWeight: 0, bestReps: 0,
          };
          st.count += 1;
          st.totalSets += ex.sets.length;
          if (new Date(w.date) > new Date(st.lastDate)) st.lastDate = w.date;
          for (const s of ex.sets) {
            if (s.weight > st.bestWeight) st.bestWeight = s.weight;
            if (s.reps > st.bestReps) st.bestReps = s.reps;
          }
          byName.set(ex.name, st);
        }
      }
    }
    if (scope === 'any' || scope === 'bodyweight') {
      for (const w of bwWorkouts) {
        for (const ex of w.exercises) {
          if (ex.muscle.toLowerCase() !== m) continue;
          const st = byName.get(ex.name) ?? {
            name: ex.name, count: 0, totalSets: 0, lastDate: w.date,
            bestWeight: 0, bestReps: 0,
          };
          st.count += 1;
          st.totalSets += ex.sets.length;
          if (new Date(w.date) > new Date(st.lastDate)) st.lastDate = w.date;
          for (const s of ex.sets) {
            if (s.reps > st.bestReps) st.bestReps = s.reps;
          }
          byName.set(ex.name, st);
        }
      }
    }

    return [...byName.values()]
      .sort((a, b) => b.count - a.count || b.totalSets - a.totalSets)
      .slice(0, limit);
  }, [muscle, workouts, bwWorkouts, scope, limit]);

  if (!muscle || stats.length === 0) return null;

  return (
    <div className="card-elevated card-luxury-border rounded-2xl p-3.5 space-y-2 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-forge-gold/15 flex items-center justify-center border border-forge-gold/25 shrink-0">
            <Trophy size={13} className="text-forge-gold" />
          </div>
          <span className="label-cap-strong text-forge-text">
            {t('topExercises.titlePrefix')}{' '}
            <span className="text-forge-green">{t('muscles.' + String(muscle).toLowerCase())}</span>{' '}
            {t('topExercises.titleSuffix')}
          </span>
        </div>
        <span className="text-[10px] font-mono text-forge-muted">
          {t('topExercises.sessionsCount', {
            shown: stats.length,
            count: stats.reduce((a, s) => a + s.count, 0),
          })}
        </span>
      </div>

      <ul className="space-y-1.5" role="list">
        {stats.map((s, i) => {
          const interactive = !!onPick || progressionMode;
          const isOpen = progressionMode && expanded === s.name;
          const handleClick = () => {
            play('tap');
            if (onPick) { onPick(s.name); return; }
            if (progressionMode) setExpanded(isOpen ? null : s.name);
          };
          return (
            <li key={s.name}>
              <button
                type="button"
                disabled={!interactive}
                onClick={handleClick}
                aria-expanded={progressionMode ? isOpen : undefined}
                className={[
                  'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 min-h-[52px]',
                  'bg-white/[0.03] border border-white/[0.05]',
                  'transition-all duration-200',
                  interactive ? 'cursor-pointer hover:bg-forge-green/10 hover:border-forge-green/30 press-scale' : 'opacity-80 cursor-default',
                ].join(' ')}
                aria-label={
                  s.bestWeight
                    ? t('topExercises.rowAriaWithWeight', {
                        name: s.name,
                        count: s.count,
                        reps: s.bestReps,
                        weight: s.bestWeight,
                      })
                    : t('topExercises.rowAria', {
                        name: s.name,
                        count: s.count,
                        reps: s.bestReps,
                      })
                }
              >
                <span
                  className={[
                    'w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-display',
                    i === 0 ? 'bg-gradient-to-br from-forge-gold-light to-forge-gold text-forge-bg-deep' :
                    i === 1 ? 'bg-white/10 text-forge-text-soft' :
                              'bg-white/5 text-forge-muted',
                  ].join(' ')}
                  aria-hidden
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-forge-text text-[13px] font-condensed font-semibold truncate">
                    {s.name}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-forge-muted">
                    <span className="inline-flex items-center gap-1">
                      <Repeat size={10} /> {s.count}×
                    </span>
                    <span className="text-forge-dim">·</span>
                    <span>{t('topExercises.setsCount', { count: s.totalSets })}</span>
                    <span className="text-forge-dim">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={10} /> {daysAgo(s.lastDate, t)}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {s.bestWeight > 0 ? (
                    <>
                      <div className="kpi-md text-forge-green leading-none">{s.bestWeight}<span className="text-[9px] text-forge-muted ml-0.5">{t('log.kgUnit')}</span></div>
                      <div className="text-[9px] text-forge-dim font-condensed uppercase tracking-wider mt-0.5">{t('topExercises.best')}</div>
                    </>
                  ) : (
                    <>
                      <div className="kpi-md text-forge-green leading-none">{s.bestReps}</div>
                      <div className="text-[9px] text-forge-dim font-condensed uppercase tracking-wider mt-0.5">{t('topExercises.bestReps')}</div>
                    </>
                  )}
                </div>
              </button>
              {isOpen && (
                <div className="mt-1.5">
                  <ExerciseProgressionCard exercise={s.name} workouts={workouts} />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {onPick && (
        <p className="text-[10px] text-forge-muted text-center font-condensed pt-1">
          {t('topExercises.tapToLoad')}
        </p>
      )}
      {progressionMode && (
        <p className="text-[10px] text-forge-muted text-center font-condensed pt-1">
          {t('stats.progression.tapToExpand')}
        </p>
      )}
    </div>
  );
}
