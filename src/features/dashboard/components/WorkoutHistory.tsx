import { useMemo } from 'react';
import { useWorkoutStore } from '../../../stores/useWorkoutStore';
import { Card } from '../../../components/ui/Card';

export function WorkoutHistory() {
  const workouts = useWorkoutStore((s) => s.workouts);

  const recent = useMemo(() => {
    return [...workouts]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20);
  }, [workouts]);

  if (recent.length === 0) {
    return (
      <div className="text-center py-8 text-forge-muted">
        <span className="text-3xl block mb-2">📊</span>
        <p className="font-condensed">No workouts yet. Start logging!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {recent.map((w) => {
        const totalSets = w.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
        const totalVolume = w.exercises.reduce(
          (acc, ex) => acc + ex.sets.reduce((s, set) => s + set.reps * set.weight, 0),
          0,
        );
        const muscles = [...new Set(w.exercises.map((e) => e.muscle))];
        const dateStr = new Date(w.date).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });

        return (
          <Card key={w.id} className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-forge-text text-sm font-body font-medium truncate">{w.name}</span>
                {w.duration && (
                  <span className="text-forge-muted text-xs font-mono">{w.duration}m</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-forge-muted text-xs">{dateStr}</span>
                <span className="text-forge-muted text-xs">·</span>
                <span className="text-forge-muted text-xs">{w.exercises.length} exercises</span>
                <span className="text-forge-muted text-xs">·</span>
                <span className="text-forge-muted text-xs">{totalSets} sets</span>
              </div>
              <div className="flex gap-1 mt-1">
                {muscles.slice(0, 4).map((m) => (
                  <span key={m} className="text-forge-green/60 text-[10px] bg-forge-green/10 px-1.5 py-0.5 rounded font-condensed">
                    {m}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right ml-3">
              <div className="text-forge-green font-mono text-sm font-bold">
                {Math.round(totalVolume).toLocaleString()}
              </div>
              <div className="text-forge-muted text-[10px] font-condensed">kg vol</div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
