import { useMemo } from 'react';
import { useNow } from '../../../hooks/useNow';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useWorkoutStore } from '../../../stores/useWorkoutStore';
import { formatNumber } from '../../../lib/format';

interface Props {
  /** Number of days to look back. Derive from the selected period so the
   *  chart matches the section label. `null` (or undefined) means all-time. */
  days?: number | null;
}

const FALLBACK_DAYS = 30;

export function FreqChart({ days = FALLBACK_DAYS }: Props) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language?.startsWith('ar');
  const workouts = useWorkoutStore((s) => s.workouts);

  const now = useNow();
  const data = useMemo(() => {
    const durMs = days != null ? days * 86400000 : null;
    const cutoff = durMs ? now - durMs : 0;
    const recent = workouts.filter((w) => new Date(w.date).getTime() >= cutoff);

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
  }, [workouts, days, now]);

  if (data.length === 0) {
    return (
      <div className="text-center py-6 text-forge-muted text-sm font-condensed">
        {t('stats.freqChart.empty')}
      </div>
    );
  }

  return (
    <div style={{ height: Math.max(150, data.length * 28) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
        >
          <XAxis
            type="number"
            reversed={isRTL}
            tick={{ fill: '#8a8a8a', fontSize: 11 }}
            axisLine={{ stroke: '#1a2e1f' }}
            tickLine={false}
            allowDecimals={false}
            tickFormatter={(v: number) => formatNumber(v)}
          />
          <YAxis
            type="category"
            dataKey="exercise"
            orientation={isRTL ? 'right' : 'left'}
            width={120}
            tick={{ fill: '#8a8a8a', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(46,204,113,0.06)' }}
            contentStyle={{ backgroundColor: '#0f1a12', border: '1px solid #1a2e1f', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#e0e0e0' }}
            itemStyle={{ color: '#2ecc71' }}
            formatter={(value: number) => [`${formatNumber(value)}×`, t('stats.freqChart.frequency')]}
          />
          <Bar dataKey="count" fill="#2ecc71" radius={isRTL ? [4, 0, 0, 4] : [0, 4, 4, 0]} barSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
