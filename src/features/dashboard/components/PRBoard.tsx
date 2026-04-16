import { useMemo } from 'react';
import { Trophy } from 'lucide-react';
import { useWorkoutStore } from '../../../stores/useWorkoutStore';
import { Card } from '../../../components/ui/Card';

export function PRBoard() {
  const workouts = useWorkoutStore((s) => s.workouts);

  const prs = useMemo(() => {
    const prMap: Record<string, { weight: number; reps: number; date: string }> = {};
    for (const w of workouts) {
      for (const ex of w.exercises) {
        for (const set of ex.sets) {
          if (set.weight <= 0) continue;
          const key = ex.name;
          if (!prMap[key] || set.weight > prMap[key].weight) {
            prMap[key] = { weight: set.weight, reps: set.reps, date: w.date };
          }
        }
      }
    }
    return Object.entries(prMap)
      .map(([exercise, data]) => ({ exercise, ...data }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 10);
  }, [workouts]);

  if (prs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <Trophy size={32} className="text-forge-dim" />
        <p className="text-forge-dim text-sm text-center font-condensed">No PRs yet — start lifting!</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {prs.map((pr, i) => (
        <Card key={pr.exercise} padding={false} className="flex items-center gap-3 py-2.5 px-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-forge-green/20 to-forge-green/5 flex items-center justify-center text-forge-green text-xs font-display flex-shrink-0">
            {i === 0 ? <Trophy size={14} /> : i + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-forge-text text-sm font-medium truncate">{pr.exercise}</div>
            <div className="text-forge-dim text-xs">
              {new Date(pr.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div
              className="text-forge-green font-mono text-sm font-bold"
              style={{ textShadow: '0 0 12px rgba(46,204,113,0.2)' }}
            >
              {pr.weight}kg
            </div>
            <div className="text-forge-dim text-[10px]">{pr.reps} reps</div>
          </div>
        </Card>
      ))}
    </div>
  );
}
