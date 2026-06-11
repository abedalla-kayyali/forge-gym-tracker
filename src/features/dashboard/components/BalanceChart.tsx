import { useMemo } from 'react';
import { useNow } from '../../../hooks/useNow';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { useWorkoutStore } from '../../../stores/useWorkoutStore';

const TRACKED_MUSCLES = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'core', 'legs', 'glutes'];

export function BalanceChart() {
  const workouts = useWorkoutStore((s) => s.workouts);

  const now = useNow();
  const data = useMemo(() => {
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const recent = workouts.filter((w) => new Date(w.date).getTime() >= thirtyDaysAgo);

    const volumeByMuscle: Record<string, number> = {};
    for (const w of recent) {
      for (const ex of w.exercises) {
        const muscle = ex.muscle.toLowerCase();
        volumeByMuscle[muscle] = (volumeByMuscle[muscle] ?? 0) +
          ex.sets.reduce((acc, s) => acc + s.reps * s.weight, 0);
      }
    }

    // Normalize to 0-100 scale
    const maxVol = Math.max(...Object.values(volumeByMuscle), 1);
    return TRACKED_MUSCLES.map((m) => ({
      muscle: m.charAt(0).toUpperCase() + m.slice(1),
      volume: Math.round(((volumeByMuscle[m] ?? 0) / maxVol) * 100),
    }));
  }, [workouts, now]);

  const hasData = data.some((d) => d.volume > 0);

  if (!hasData) {
    return (
      <div className="text-center py-6 text-forge-muted text-sm font-condensed">
        No muscle data yet
      </div>
    );
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="#1a2e1f" />
          <PolarAngleAxis
            dataKey="muscle"
            tick={{ fill: '#8a8a8a', fontSize: 10 }}
          />
          <Radar
            dataKey="volume"
            stroke="#2ecc71"
            fill="#2ecc71"
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
