import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useWorkoutStore } from '../../../stores/useWorkoutStore';

export function VolumeChart() {
  const workouts = useWorkoutStore((s) => s.workouts);

  const data = useMemo(() => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recent = workouts.filter((w) => new Date(w.date).getTime() >= thirtyDaysAgo);

    const volumeByMuscle: Record<string, number> = {};
    for (const w of recent) {
      for (const ex of w.exercises) {
        const muscle = ex.muscle || 'Other';
        const vol = ex.sets.reduce((acc, s) => acc + s.reps * s.weight, 0);
        volumeByMuscle[muscle] = (volumeByMuscle[muscle] ?? 0) + vol;
      }
    }

    return Object.entries(volumeByMuscle)
      .map(([muscle, volume]) => ({ muscle, volume: Math.round(volume) }))
      .sort((a, b) => b.volume - a.volume);
  }, [workouts]);

  if (data.length === 0) {
    return (
      <div className="text-center py-6 text-forge-muted text-sm font-condensed">
        No volume data yet
      </div>
    );
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <XAxis
            dataKey="muscle"
            tick={{ fill: '#8a8a8a', fontSize: 10 }}
            axisLine={{ stroke: '#1a2e1f' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#8a8a8a', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f1a12', border: '1px solid #1a2e1f', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#e0e0e0' }}
            itemStyle={{ color: '#2ecc71' }}
            formatter={(value: number) => [`${value.toLocaleString()} kg`, 'Volume']}
          />
          <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === 0 ? '#2ecc71' : '#2ecc7180'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
