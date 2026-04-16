import { useMemo } from 'react';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { useBwWorkoutStore } from '../stores/useBwWorkoutStore';
import { useCardioStore } from '../stores/useCardioStore';
import { Card } from '../components/ui/Card';
import { Clock, Dumbbell, Scaling, HeartPulse } from 'lucide-react';

export function HistoryPage() {
  const workouts = useWorkoutStore((s) => s.workouts);
  const bwWorkouts = useBwWorkoutStore((s) => s.bwWorkouts);
  const cardioEntries = useCardioStore((s) => s.entries);

  const allEntries = useMemo(() => {
    const entries = [
      ...workouts.map((w) => ({ ...w, type: 'weighted' as const })),
      ...bwWorkouts.map((w) => ({ ...w, type: 'bodyweight' as const })),
      ...cardioEntries.map((e) => ({ ...e, name: `${e.type} cardio`, exercises: [], type: 'cardio' as const })),
    ];
    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [workouts, bwWorkouts, cardioEntries]);

  const typeIcon = { weighted: Dumbbell, bodyweight: Scaling, cardio: HeartPulse };

  return (
    <div className="p-4 space-y-3 pb-20 page-enter">
      <h2 className="text-forge-green font-display text-2xl">History</h2>

      {allEntries.length === 0 ? (
        <div className="text-center py-12">
          <Clock size={40} className="text-forge-dim mx-auto mb-3" />
          <p className="text-forge-muted font-condensed">No workouts yet. Start logging!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {allEntries.map((entry, i) => {
            const Icon = typeIcon[entry.type];
            const totalSets = 'exercises' in entry ? entry.exercises.reduce((acc: number, ex: any) => acc + (ex.sets?.length ?? 0), 0) : 0;
            const totalVolume = 'exercises' in entry ? entry.exercises.reduce((acc: number, ex: any) => acc + (ex.sets?.reduce((s: number, set: any) => s + (set.reps ?? 0) * (set.weight ?? 0), 0) ?? 0), 0) : 0;
            const muscles = 'exercises' in entry ? [...new Set(entry.exercises.map((e: any) => e.muscle).filter(Boolean))] : [];
            const dateStr = new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

            return (
              <Card key={`${entry.type}-${i}`} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-forge-green/15 to-forge-green/5 flex items-center justify-center border border-forge-green/10 shrink-0">
                  <Icon size={18} className="text-forge-green" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-forge-text text-sm font-medium truncate">{entry.name}</span>
                    {entry.duration && <span className="text-forge-dim text-xs font-mono">{entry.duration}m</span>}
                  </div>
                  <div className="text-forge-dim text-xs mt-0.5">{dateStr} · {totalSets} sets</div>
                  {muscles.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {(muscles as string[]).slice(0, 3).map((m) => (
                        <span key={m} className="text-forge-green/60 text-[9px] bg-forge-green/8 px-1.5 py-0.5 rounded font-condensed">{m}</span>
                      ))}
                    </div>
                  )}
                </div>
                {totalVolume > 0 && (
                  <div className="text-right shrink-0">
                    <div className="text-forge-green font-mono text-sm font-bold">{Math.round(totalVolume).toLocaleString()}</div>
                    <div className="text-forge-dim text-[9px] font-condensed">kg</div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
