import { useState, useMemo, useCallback } from 'react';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { useBwWorkoutStore } from '../stores/useBwWorkoutStore';
import { useCardioStore } from '../stores/useCardioStore';
import { Clock, Dumbbell, Scaling, HeartPulse, ArrowUpDown, Trophy, ChevronDown } from 'lucide-react';
import type { Workout, BwWorkout, CardioEntry } from '../types/workout';

type SortMode = 'newest' | 'oldest' | 'volume';
const SORT_LABELS: Record<SortMode, string> = { newest: 'Newest', oldest: 'Oldest', volume: 'Volume' };
const MUSCLES = ['All', 'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Core', 'Legs', 'Glutes', 'Calves', 'Forearms'];

type UnifiedEntry =
  | (Workout & { type: 'weighted' })
  | (BwWorkout & { type: 'bodyweight' })
  | (CardioEntry & { name: string; exercises: never[]; type: 'cardio' });

function getVolume(entry: UnifiedEntry): number {
  if (entry.type !== 'weighted') return 0;
  return entry.exercises.reduce(
    (acc, ex) => acc + ex.sets.reduce((s, set) => s + (set.reps ?? 0) * (set.weight ?? 0), 0),
    0
  );
}

function getMuscles(entry: UnifiedEntry): string[] {
  if (entry.type === 'cardio') return [];
  return [...new Set((entry.exercises as Array<{ muscle?: string }>).map((e) => e.muscle).filter(Boolean))] as string[];
}

export function HistoryPage() {
  const workouts = useWorkoutStore((s) => s.workouts);
  const bwWorkouts = useBwWorkoutStore((s) => s.bwWorkouts);
  const cardioEntries = useCardioStore((s) => s.entries);

  const [filter, setFilter] = useState('All');
  const [sort, setSort] = useState<SortMode>('newest');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const cycleSort = () => {
    setSort((s) => (s === 'newest' ? 'oldest' : s === 'oldest' ? 'volume' : 'newest'));
  };

  // Build PR map for weighted workouts: exerciseName -> max weight ever
  const prMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const w of workouts) {
      for (const ex of w.exercises) {
        for (const s of ex.sets) {
          if (s.weight > 0 && (map[ex.name] == null || s.weight > (map[ex.name] as number))) {
            map[ex.name] = s.weight;
          }
        }
      }
    }
    return map;
  }, [workouts]);

  const allEntries = useMemo<UnifiedEntry[]>(() => {
    return [
      ...workouts.map((w) => ({ ...w, type: 'weighted' as const })),
      ...bwWorkouts.map((w) => ({ ...w, type: 'bodyweight' as const })),
      ...cardioEntries.map((e) => ({ ...e, name: `${e.type} cardio`, exercises: [] as never[], type: 'cardio' as const })),
    ];
  }, [workouts, bwWorkouts, cardioEntries]);

  const filtered = useMemo<UnifiedEntry[]>(() => {
    let list = [...allEntries];

    if (filter !== 'All') {
      list = list.filter((entry) => {
        if (entry.type === 'cardio') return false;
        return (entry.exercises as Array<{ muscle?: string }>).some(
          (e) => (e.muscle ?? '').toLowerCase() === filter.toLowerCase()
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
  }, [allEntries, filter, sort]);

  const typeIcon = { weighted: Dumbbell, bodyweight: Scaling, cardio: HeartPulse };

  return (
    <div className="p-4 space-y-3 pb-20 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-forge-green font-display text-2xl">History</h2>
          <span className="bg-forge-green/15 text-forge-green text-xs font-mono px-2 py-0.5 rounded-full border border-forge-green/20">
            {filtered.length}
          </span>
        </div>
        <button
          onClick={cycleSort}
          className="card-elevated flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-forge-text"
        >
          <ArrowUpDown size={12} className="text-forge-green" />
          {SORT_LABELS[sort]}
        </button>
      </div>

      {/* Muscle filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {MUSCLES.map((muscle) => {
          const active = filter === muscle;
          return (
            <button
              key={muscle}
              onClick={() => setFilter(muscle)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                active
                  ? 'bg-gradient-to-r from-forge-green to-emerald-400 text-black font-semibold shadow-lg shadow-forge-green/20'
                  : 'card-elevated text-forge-muted'
              }`}
            >
              {muscle}
            </button>
          );
        })}
      </div>

      {/* Workout list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Clock size={40} className="text-forge-dim mx-auto mb-3" />
          <p className="text-forge-muted font-condensed text-sm">No workouts found</p>
          <p className="text-forge-dim text-xs mt-1">Try a different filter</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry) => {
            const Icon = typeIcon[entry.type];
            const isExpanded = expanded.has(entry.id);
            const totalSets =
              entry.type !== 'cardio'
                ? (entry.exercises as Array<{ sets: unknown[] }>).reduce((acc, ex) => acc + (ex.sets?.length ?? 0), 0)
                : 0;
            const totalVolume = getVolume(entry);
            const muscles = getMuscles(entry);
            const dateStr = new Date(entry.date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });
            const exCount = entry.type !== 'cardio' ? entry.exercises.length : 0;

            return (
              <div
                key={entry.id}
                className="card-elevated rounded-2xl overflow-hidden cursor-pointer"
                onClick={() => toggleExpand(entry.id)}
              >
                {/* Collapsed row */}
                <div className="flex items-center gap-3 p-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-forge-green/20 to-forge-green/5 flex items-center justify-center border border-forge-green/15 shrink-0">
                    <Icon size={18} className="text-forge-green" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-forge-text text-sm font-semibold truncate">{entry.name}</span>
                      {entry.duration != null && (
                        <span className="text-forge-dim text-xs font-mono shrink-0">{entry.duration}m</span>
                      )}
                    </div>
                    <div className="text-forge-dim text-xs mt-0.5">
                      {dateStr}
                      {exCount > 0 && ` · ${exCount} exercises · ${totalSets} sets`}
                      {entry.type === 'cardio' && entry.distance != null && ` · ${entry.distance} km`}
                    </div>
                    {muscles.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {muscles.slice(0, 4).map((m) => (
                          <span
                            key={m}
                            className="text-forge-green/70 text-[9px] bg-forge-green/8 px-1.5 py-0.5 rounded font-condensed border border-forge-green/10"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {totalVolume > 0 && (
                      <div className="text-right">
                        <div className="text-forge-green font-mono text-sm font-bold">
                          {Math.round(totalVolume).toLocaleString()}
                        </div>
                        <div className="text-forge-dim text-[9px] font-condensed">kg vol</div>
                      </div>
                    )}
                    <ChevronDown
                      size={14}
                      className={`text-forge-dim transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </div>
                </div>

                {/* Expanded exercise breakdown */}
                {isExpanded && entry.type === 'weighted' && (
                  <div className="animate-fade-in border-t border-white/5 px-3 pb-3 pt-2 space-y-3">
                    {entry.exercises.map((ex, ei) => (
                      <div key={`${ex.name}-${ei}`}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-forge-text text-xs font-semibold">{ex.name}</span>
                          {ex.muscle && (
                            <span className="text-forge-green/60 text-[9px] bg-forge-green/8 px-1.5 py-0.5 rounded font-condensed">
                              {ex.muscle}
                            </span>
                          )}
                        </div>
                        <div className="space-y-0.5">
                          {ex.sets.map((set, si) => {
                            const isPr = set.weight > 0 && prMap[ex.name] != null && set.weight >= (prMap[ex.name] as number);
                            return (
                              <div
                                key={si}
                                className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs ${
                                  si % 2 === 0 ? 'bg-white/3' : 'bg-transparent'
                                }`}
                              >
                                <span className="text-forge-dim font-mono w-5 text-right shrink-0">
                                  {si + 1}
                                </span>
                                <span className="text-forge-muted">
                                  {set.reps} reps
                                </span>
                                {set.weight > 0 && (
                                  <>
                                    <span className="text-forge-dim">×</span>
                                    <span className="text-forge-text font-mono font-medium">
                                      {set.weight} kg
                                    </span>
                                  </>
                                )}
                                {set.rpe != null && (
                                  <span className="text-forge-dim text-[10px] ml-1">RPE {set.rpe}</span>
                                )}
                                {set.isWarmup && (
                                  <span className="text-amber-400/60 text-[9px] ml-1 font-condensed">WU</span>
                                )}
                                {isPr && (
                                  <Trophy size={11} className="text-forge-green ml-auto shrink-0" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {isExpanded && entry.type === 'bodyweight' && (
                  <div className="animate-fade-in border-t border-white/5 px-3 pb-3 pt-2 space-y-3">
                    {entry.exercises.map((ex, ei) => (
                      <div key={`${ex.name}-${ei}`}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-forge-text text-xs font-semibold">{ex.name}</span>
                          {ex.muscle && (
                            <span className="text-forge-green/60 text-[9px] bg-forge-green/8 px-1.5 py-0.5 rounded font-condensed">
                              {ex.muscle}
                            </span>
                          )}
                        </div>
                        <div className="space-y-0.5">
                          {ex.sets.map((set, si) => (
                            <div
                              key={si}
                              className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs ${
                                si % 2 === 0 ? 'bg-white/3' : 'bg-transparent'
                              }`}
                            >
                              <span className="text-forge-dim font-mono w-5 text-right shrink-0">{si + 1}</span>
                              <span className="text-forge-muted">{set.reps} reps</span>
                              {set.variation && (
                                <span className="text-forge-dim text-[10px]">· {set.variation}</span>
                              )}
                              {set.assisted && (
                                <span className="text-amber-400/60 text-[9px] font-condensed">assisted</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {isExpanded && entry.type === 'cardio' && (
                  <div className="animate-fade-in border-t border-white/5 px-3 pb-3 pt-2">
                    <div className="flex gap-4 text-xs">
                      <div>
                        <div className="text-forge-dim">Duration</div>
                        <div className="text-forge-text font-mono">{entry.duration} min</div>
                      </div>
                      {entry.distance != null && (
                        <div>
                          <div className="text-forge-dim">Distance</div>
                          <div className="text-forge-text font-mono">{entry.distance} km</div>
                        </div>
                      )}
                      {entry.heartRate != null && (
                        <div>
                          <div className="text-forge-dim">Avg HR</div>
                          <div className="text-forge-text font-mono">{entry.heartRate} bpm</div>
                        </div>
                      )}
                      {entry.intensity && (
                        <div>
                          <div className="text-forge-dim">Intensity</div>
                          <div className="text-forge-text font-mono capitalize">{entry.intensity}</div>
                        </div>
                      )}
                    </div>
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
