import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useWorkoutStore } from '../../../stores/useWorkoutStore';

export function FreqChart() {
  const workouts = useWorkoutStore((s) => s.workouts);

  const data = useMemo(() => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recent = workouts.filter((w) => new Date(w.date).getTime() >= thirtyDaysAgo);

    const freq: Record<string, number> = {};
    for (const w of recent) {
      for (const ex of w.exercises) {
        freq[ex.name] = (freq[ex.name] ?? 0) + 1;
      }
    }

    return Object.entries(freq)
      .map(([exercise, count]) => ({ exercise, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [workouts]);

  if (data.length === 0) {
    return (
      <div className="text-center py-6 text-forge-muted text-sm font-condensed">
        No exercise data yet
      </div>
    );
  }

  return (
    <div style={{ height: Math.max(150, data.length * 28) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <XAxis
            type="number"
            tick={{ fill: '#8a8a8a', fontSize: 10 }}
            axisLine={{ stroke: '#1a2e1f' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="exercise"
            width={120}
            tick={{ fill: '#8a8a8a', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f1a12', border: '1px solid #1a2e1f', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#e0e0e0' }}
            itemStyle={{ color: '#2ecc71' }}
            formatter={(value: number) => [`${value}x`, 'Frequency']}
          />
          <Bar dataKey="count" fill="#2ecc71" radius={[0, 4, 4, 0]} barSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
