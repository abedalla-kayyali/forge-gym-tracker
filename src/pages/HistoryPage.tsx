import { useState, useMemo, useCallback } from 'react';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { useBwWorkoutStore } from '../stores/useBwWorkoutStore';
import { useCardioStore } from '../stores/useCardioStore';
import { useFX } from '../hooks/useFX';
import { Clock, Dumbbell, Scaling, HeartPulse, ArrowUpDown, Trophy, ChevronDown, Flame, Route, Heart } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import type { Workout, BwWorkout, CardioEntry } from '../types/workout';

type SortMode = 'newest' | 'oldest' | 'volume';
type TypeFilter = 'all' | 'weighted' | 'bodyweight' | 'cardio';

const SORT_LABELS: Record<SortMode, string> = { newest: 'Newest', oldest: 'Oldest', volume: 'Volume' };
const MUSCLES = ['All', 'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Core', 'Legs', 'Glutes', 'Calves', 'Forearms'];
const TYPE_TABS: { id: TypeFilter; label: string; Icon: typeof Dumbbell }[] = [
  { id: 'all',        label: 'All',      Icon: Flame },
  { id: 'weighted',   label: 'Weights',  Icon: Dumbbell },
  { id: 'bodyweight', label: 'Cali',     Icon: Scaling },
  { id: 'cardio',     label: 'Cardio',   Icon: HeartPulse },
];

type UnifiedEntry =
  | (Workout & { kind: 'weighted' })
  | (BwWorkout & { kind: 'bodyweight' })
  | (CardioEntry & { name: string; exercises: never[]; kind: 'cardio' });

function getVolume(entry: UnifiedEntry): number {
  if (entry.kind !== 'weighted') return 0;
  return entry.exercises.reduce(
    (acc, ex) => acc + ex.sets.reduce((s, set) => s + (set.reps ?? 0) * (set.weight ?? 0), 0),
    0,
  );
}

function getTotalReps(entry: UnifiedEntry): number {
  if (entry.kind === 'cardio') return 0;
  return (entry.exercises as Array<{ sets: { reps: number }[] }>).reduce(
    (a, ex) => a + ex.sets.reduce((s, set) => s + (set.reps ?? 0), 0),
    0,
  );
}

function getMuscles(entry: UnifiedEntry): string[] {
  if (entry.kind === 'cardio') return [];
  return [...new Set((entry.exercises as Array<{ muscle?: string }>).map((e) => e.muscle).filter(Boolean))] as string[];
}

const INTENSITY_COLOR: Record<string, string> = {
  low: '#8BC34A',
  medium: '#F59E0B',
  high: '#EF4444',
};

export function HistoryPage() {
  const workouts = useWorkoutStore((s) => s.workouts);
  const bwWorkouts = useBwWorkoutStore((s) => s.bwWorkouts);
  const cardioEntries = useCardioStore((s) => s.entries);
  const { play } = useFX();

  const [filter, setFilter] = useState<string>('All');
  const [sort, setSort] = useState<SortMode>('newest');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = useCallback((id: string) => {
    play('tap');
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, [play]);

  const cycleSort = () => {
    play('tap');
    setSort((s) => (s === 'newest' ? 'oldest' : s === 'oldest' ? 'volume' : 'newest'));
  };

  // PR maps:
  //   weighted:    exerciseName → max weight ever (kg)
  //   bodyweight:  exerciseName → max reps ever
  const { prWeightMap, prRepsMap } = useMemo(() => {
    const prWeight: Record<string, number> = {};
    const prReps: Record<string, number> = {};
    for (const w of workouts) {
      for (const ex of w.exercises) {
        for (const s of ex.sets) {
          const cur = prWeight[ex.name] ?? 0;
          if (s.weight > 0 && s.weight > cur) prWeight[ex.name] = s.weight;
        }
      }
    }
    for (const w of bwWorkouts) {
      for (const ex of w.exercises) {
        for (const s of ex.sets) {
          const cur = prReps[ex.name] ?? 0;
          if (s.reps > cur) prReps[ex.name] = s.reps;
        }
      }
    }
    return { prWeightMap: prWeight, prRepsMap: prReps };
  }, [workouts, bwWorkouts]);

  const allEntries = useMemo<UnifiedEntry[]>(
    () => [
      ...workouts.map((w) => ({ ...w, kind: 'weighted' as const })),
      ...bwWorkouts.map((w) => ({ ...w, kind: 'bodyweight' as const })),
      ...cardioEntries.map((e) => ({ ...e, name: `${e.type}`, exercises: [] as never[], kind: 'cardio' as const })),
    ],
    [workouts, bwWorkouts, cardioEntries],
  );

  const filtered = useMemo<UnifiedEntry[]>(() => {
    let list = [...allEntries];

    if (typeFilter !== 'all') {
      list = list.filter((e) => e.kind === typeFilter);
    }

    if (filter !== 'All') {
      list = list.filter((entry) => {
        if (entry.kind === 'cardio') return false;
        return (entry.exercises as Array<{ muscle?: string }>).some(
          (e) => (e.muscle ?? '').toLowerCase() === filter.toLowerCase(),
        );
      });
    }

    if (sort === 'newest') {
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (sort === 'oldest') {
      list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else {
      list.sort((a, b) => getVolume(b) - getVolume(a));
    }

    return list;
  }, [allEntries, filter, typeFilter, sort]);

  const typeIcon = { weighted: Dumbbell, bodyweight: Scaling, cardio: HeartPulse };

  // Top-line totals
  const totals = useMemo(() => {
    const totalVolume = workouts.reduce((a, w) =>
      a + w.exercises.reduce((b, ex) => b + ex.sets.reduce((c, s) => c + s.reps * s.weight, 0), 0), 0);
    const totalBwReps = bwWorkouts.reduce((a, w) =>
      a + w.exercises.reduce((b, ex) => b + ex.sets.reduce((c, s) => c + s.reps, 0), 0), 0);
    const totalCardioMin = cardioEntries.reduce((a, c) => a + c.duration, 0);
    const totalSessions = workouts.length + bwWorkouts.length + cardioEntries.length;
    return { totalVolume, totalBwReps, totalCardioMin, totalSessions };
  }, [workouts, bwWorkouts, cardioEntries]);

  return (
    <div className="p-4 space-y-3 pb-28 page-enter">
      {/* Hero: title + total count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-forge-green font-display text-2xl tracking-wide">History</h2>
          <Badge variant="success" dot>{filtered.length}</Badge>
        </div>
        <button
          onClick={cycleSort}
          className="inline-flex items-center gap-1.5 card-elevated border border-forge-border-light rounded-full px-3 py-1.5 text-xs font-medium text-forge-text cursor-pointer press-scale hover:bg-white/5 transition-all duration-200"
        >
          <ArrowUpDown size={12} className="text-forge-green" />
          {SORT_LABELS[sort]}
        </button>
      </div>

      {/* KPI strip */}
      {totals.totalSessions > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <KpiCell label="Sessions" value={totals.totalSessions} accent="green" />
          <KpiCell label="Vol (kg)" value={Math.round(totals.totalVolume).toLocaleString()} accent="gold" />
          <KpiCell label={totals.totalCardioMin > 0 ? 'Cardio min' : 'BW reps'} value={totals.totalCardioMin > 0 ? totals.totalCardioMin : totals.totalBwReps} accent="green" />
        </div>
      )}

      {/* Type tabs */}
      <div className="scroll-hint overflow-x-auto -mx-1 px-1">
        <div className="flex gap-2">
          {TYPE_TABS.map((t) => {
            const active = typeFilter === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { play('tap'); setTypeFilter(t.id); }}
                className={[
                  'shrink-0 inline-flex items-center gap-1.5 rounded-full',
                  'px-3.5 py-2 min-h-[38px] cursor-pointer press-scale transition-all duration-200',
                  'font-condensed uppercase tracking-wider text-[12px]',
                  active
                    ? 'bg-gradient-to-br from-forge-green to-forge-green-dark text-forge-bg-deep font-semibold shadow-[0_4px_14px_rgba(46,204,113,0.3)]'
                    : 'bg-white/[0.04] text-forge-text-soft border border-white/[0.06] hover:text-forge-text',
                ].join(' ')}
                aria-pressed={active}
              >
                <t.Icon size={13} strokeWidth={active ? 2.4 : 1.8} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Muscle filter chips */}
      {typeFilter !== 'cardio' && (
        <div className="scroll-hint overflow-x-auto -mx-1 px-1">
          <div className="flex gap-2">
            {MUSCLES.map((muscle) => {
              const active = filter === muscle;
              return (
                <button
                  key={muscle}
                  onClick={() => { play('tap'); setFilter(muscle); }}
                  className={[
                    'shrink-0 px-3 py-1.5 rounded-full text-[11px] font-condensed uppercase tracking-wider cursor-pointer press-scale transition-all',
                    active
                      ? 'bg-gradient-to-r from-forge-green/20 to-forge-green/10 text-forge-green border border-forge-green/30'
                      : 'bg-white/[0.03] text-forge-muted border border-white/[0.06]',
                  ].join(' ')}
                >
                  {muscle}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Entries */}
      {filtered.length === 0 ? (
        <EmptyState typeFilter={typeFilter} filter={filter} />
      ) : (
        <div className="space-y-2">
          {filtered.map((entry) => {
            const Icon = typeIcon[entry.kind];
            const isExpanded = expanded.has(entry.id);
            const totalSets =
              entry.kind !== 'cardio'
                ? (entry.exercises as Array<{ sets: unknown[] }>).reduce((acc, ex) => acc + (ex.sets?.length ?? 0), 0)
                : 0;
            const totalVolume = getVolume(entry);
            const totalReps = getTotalReps(entry);
            const muscles = getMuscles(entry);
            const dateStr = new Date(entry.date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });
            const exCount = entry.kind !== 'cardio' ? entry.exercises.length : 0;

            return (
              <div
                key={entry.id}
                className={[
                  'card-elevated rounded-2xl overflow-hidden cursor-pointer',
                  'transition-all duration-300',
                  isExpanded ? 'card-luxury-border' : '',
                ].join(' ')}
                onClick={() => toggleExpand(entry.id)}
              >
                {/* Collapsed row */}
                <div className="flex items-center gap-3 p-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-forge-green/20 to-forge-green/5 flex items-center justify-center border border-forge-green/15 shrink-0">
                    <Icon size={19} className="text-forge-green" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-forge-text text-[14px] font-condensed font-semibold truncate capitalize">{entry.name}</span>
                      {entry.kind !== 'cardio' && entry.duration != null && entry.duration > 0 && (
                        <span className="text-forge-dim text-[10px] font-mono shrink-0">{entry.duration}m</span>
                      )}
                      {entry.kind === 'cardio' && (
                        <span className="text-forge-dim text-[10px] font-mono shrink-0">{entry.duration}m</span>
                      )}
                    </div>
                    <div className="text-forge-muted text-[11px] mt-0.5 font-condensed">
                      {dateStr}
                      {exCount > 0 && ` · ${exCount} ex · ${totalSets} sets`}
                      {entry.kind === 'bodyweight' && totalReps > 0 && ` · ${totalReps} reps`}
                      {entry.kind === 'cardio' && entry.distance != null && entry.distance > 0 && ` · ${entry.distance} km`}
                      {entry.kind === 'cardio' && entry.heartRate != null && ` · ${entry.heartRate} bpm`}
                    </div>
                    {muscles.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {muscles.slice(0, 4).map((m) => (
                          <span
                            key={m}
                            className="text-forge-green/80 text-[9px] bg-forge-green/10 px-1.5 py-0.5 rounded font-condensed uppercase tracking-wider border border-forge-green/15"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {entry.kind === 'weighted' && totalVolume > 0 && (
                      <div className="text-right">
                        <div className="kpi-md text-forge-green leading-none">{Math.round(totalVolume).toLocaleString()}</div>
                        <div className="text-forge-dim text-[9px] font-condensed uppercase tracking-wider mt-0.5">kg vol</div>
                      </div>
                    )}
                    {entry.kind === 'bodyweight' && totalReps > 0 && (
                      <div className="text-right">
                        <div className="kpi-md text-forge-green leading-none">{totalReps}</div>
                        <div className="text-forge-dim text-[9px] font-condensed uppercase tracking-wider mt-0.5">reps</div>
                      </div>
                    )}
                    {entry.kind === 'cardio' && entry.intensity && (
                      <span
                        className="text-[9px] font-condensed uppercase tracking-wider px-2 py-0.5 rounded-full border"
                        style={{
                          color: INTENSITY_COLOR[entry.intensity] ?? '#8BC34A',
                          borderColor: INTENSITY_COLOR[entry.intensity] + '66',
                          background: INTENSITY_COLOR[entry.intensity] + '14',
                        }}
                      >
                        {entry.intensity}
                      </span>
                    )}
                    <ChevronDown
                      size={14}
                      className={`text-forge-dim transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </div>
                </div>

                {/* Weighted expansion */}
                {isExpanded && entry.kind === 'weighted' && (
                  <div className="animate-fade-in border-t border-white/5 px-3 pb-3 pt-2 space-y-3">
                    {entry.exercises.map((ex, ei) => {
                      const maxWeight = Math.max(0, ...ex.sets.map((s) => s.weight));
                      const maxReps = Math.max(0, ...ex.sets.map((s) => s.reps));
                      const isAllTimePR = prWeightMap[ex.name] != null && maxWeight >= (prWeightMap[ex.name] as number);
                      return (
                        <div key={`${ex.name}-${ei}`}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-forge-text text-[13px] font-condensed font-semibold">{ex.name}</span>
                            {ex.muscle && <Badge variant="success" className="text-[9px]">{ex.muscle}</Badge>}
                            {isAllTimePR && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-condensed uppercase tracking-wider text-forge-gold">
                                <Trophy size={10} /> PR
                              </span>
                            )}
                            <span className="ml-auto text-[10px] text-forge-muted font-mono">
                              best · {maxReps}×{maxWeight > 0 ? `${maxWeight}kg` : 'bw'}
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            {ex.sets.map((set, si) => {
                              const isPr = set.weight > 0 && prWeightMap[ex.name] != null && set.weight >= (prWeightMap[ex.name] as number);
                              return (
                                <div
                                  key={si}
                                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12px] ${si % 2 === 0 ? 'bg-white/[0.02]' : ''}`}
                                >
                                  <span className="text-forge-dim font-mono w-5 text-right shrink-0">{si + 1}</span>
                                  <span className="text-forge-text font-mono">{set.reps}</span>
                                  <span className="text-forge-dim">×</span>
                                  <span className="text-forge-text font-mono">{set.weight}kg</span>
                                  {set.rpe != null && <span className="text-forge-dim text-[10px]">RPE {set.rpe}</span>}
                                  {set.isWarmup && <span className="text-amber-400/70 text-[9px] font-condensed">WU</span>}
                                  <span className="ml-auto text-forge-green/70 font-mono text-[10px]">
                                    {set.weight > 0 ? (set.reps * set.weight).toLocaleString() : '—'}
                                  </span>
                                  {isPr && <Trophy size={11} className="text-forge-gold shrink-0" />}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Bodyweight expansion */}
                {isExpanded && entry.kind === 'bodyweight' && (
                  <div className="animate-fade-in border-t border-white/5 px-3 pb-3 pt-2 space-y-3">
                    {entry.exercises.map((ex, ei) => {
                      const maxReps = Math.max(0, ...ex.sets.map((s) => s.reps));
                      const isAllTimePR = prRepsMap[ex.name] != null && maxReps >= (prRepsMap[ex.name] as number);
                      return (
                        <div key={`${ex.name}-${ei}`}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-forge-text text-[13px] font-condensed font-semibold">{ex.name}</span>
                            {ex.muscle && <Badge variant="success" className="text-[9px]">{ex.muscle}</Badge>}
                            {isAllTimePR && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-condensed uppercase tracking-wider text-forge-gold">
                                <Trophy size={10} /> PR
                              </span>
                            )}
                            <span className="ml-auto text-[10px] text-forge-muted font-mono">max {maxReps}</span>
                          </div>
                          <div className="space-y-0.5">
                            {ex.sets.map((set, si) => {
                              const isPr = prRepsMap[ex.name] != null && set.reps >= (prRepsMap[ex.name] as number);
                              return (
                                <div
                                  key={si}
                                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12px] ${si % 2 === 0 ? 'bg-white/[0.02]' : ''}`}
                                >
                                  <span className="text-forge-dim font-mono w-5 text-right shrink-0">{si + 1}</span>
                                  <span className="text-forge-text font-mono">{set.reps}</span>
                                  <span className="text-forge-muted text-[11px]">reps</span>
                                  {set.variation && (
                                    <span className="text-forge-dim text-[10px] capitalize">· {set.variation}</span>
                                  )}
                                  {set.assisted && (
                                    <span className="text-amber-400/70 text-[9px] font-condensed">assisted</span>
                                  )}
                                  {isPr && <Trophy size={11} className="text-forge-gold ml-auto shrink-0" />}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Cardio expansion */}
                {isExpanded && entry.kind === 'cardio' && (
                  <div className="animate-fade-in border-t border-white/5 px-3 pb-3 pt-2">
                    <div className="grid grid-cols-2 gap-2">
                      <CardioStat Icon={Clock} label="Duration" value={`${entry.duration} min`} />
                      {entry.distance != null && entry.distance > 0 && (
                        <CardioStat Icon={Route} label="Distance" value={`${entry.distance} km`} />
                      )}
                      {entry.heartRate != null && (
                        <CardioStat Icon={Heart} label="Avg HR" value={`${entry.heartRate} bpm`} />
                      )}
                      {entry.intensity && (
                        <CardioStat
                          Icon={Flame}
                          label="Intensity"
                          value={entry.intensity}
                          color={INTENSITY_COLOR[entry.intensity]}
                        />
                      )}
                    </div>
                    {entry.notes && (
                      <div className="mt-3 text-[12px] text-forge-muted italic leading-relaxed">
                        "{entry.notes}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function KpiCell({ label, value, accent }: { label: string; value: string | number; accent: 'green' | 'gold' }) {
  const color = accent === 'gold' ? 'text-forge-gold' : 'text-forge-green';
  return (
    <div className="card-elevated rounded-xl p-2.5 text-center">
      <div className={`kpi-lg ${color}`}>{value}</div>
      <div className="label-cap text-[9px] mt-0.5">{label}</div>
    </div>
  );
}

function CardioStat({
  Icon, label, value, color,
}: {
  Icon: typeof Clock;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="bg-black/25 rounded-xl p-3 flex items-start gap-2">
      <Icon size={14} className="shrink-0 mt-0.5" style={{ color: color ?? 'rgba(46,204,113,0.8)' }} />
      <div className="min-w-0">
        <div className="label-cap text-[9px]">{label}</div>
        <div className="text-forge-text font-mono text-[13px] capitalize" style={{ color: color ?? undefined }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ typeFilter, filter }: { typeFilter: TypeFilter; filter: string }) {
  const msg =
    typeFilter === 'weighted' ? 'No weighted workouts yet' :
    typeFilter === 'bodyweight' ? 'No calisthenics workouts yet' :
    typeFilter === 'cardio' ? 'No cardio sessions yet' :
    filter !== 'All' ? `No ${filter.toLowerCase()} workouts found` :
    'No workouts yet';

  const hint =
    typeFilter === 'cardio' ? 'Log your first run, ride or swim from the Log tab' :
    typeFilter === 'bodyweight' ? 'Switch to Bodyweight mode in Log to start calisthenics' :
    filter !== 'All' ? 'Try a different muscle filter or type' :
    'Head to the Log tab and hit START SESSION';

  return (
    <div className="card-elevated rounded-2xl p-10 flex flex-col items-center text-center gap-2 mt-4">
      <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-1">
        <Clock size={22} className="text-forge-muted" />
      </div>
      <p className="text-forge-text font-condensed font-semibold">{msg}</p>
      <p className="text-forge-muted text-[12px] leading-snug max-w-[260px]">{hint}</p>
    </div>
  );
}
