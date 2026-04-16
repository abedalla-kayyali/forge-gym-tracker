import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useBodyStore } from '../../../stores/useBodyStore';

export function WeightChart() {
  const bodyWeight = useBodyStore((s) => s.bodyWeight);

  const data = useMemo(() => {
    return [...bodyWeight]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-60) // last 60 entries
      .map((e) => ({
        date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weight: e.weight_kg,
      }));
  }, [bodyWeight]);

  if (data.length === 0) {
    return (
      <div className="text-center py-6 text-forge-muted text-sm font-condensed">
        No weight data yet. Log your weight in the Body tab.
      </div>
    );
  }

  const weights = data.map((d) => d.weight);
  const minW = Math.floor(Math.min(...weights) - 2);
  const maxW = Math.ceil(Math.max(...weights) + 2);

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <defs>
            <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2ecc71" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#2ecc71" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fill: '#8a8a8a', fontSize: 10 }}
            axisLine={{ stroke: '#1a2e1f' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[minW, maxW]}
            tick={{ fill: '#8a8a8a', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${v}kg`}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f1a12', border: '1px solid #1a2e1f', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#e0e0e0' }}
            itemStyle={{ color: '#2ecc71' }}
            formatter={(value: number) => [`${value} kg`, 'Weight']}
          />
          <Area
            type="monotone"
            dataKey="weight"
            stroke="#2ecc71"
            strokeWidth={2}
            fill="url(#weightGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
