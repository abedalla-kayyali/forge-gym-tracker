import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { useWorkoutStore } from '../../../stores/useWorkoutStore';
import { formatNumber, formatDate } from '../../../lib/format';

interface Props {
  /** Number of days to look back. Derive from the selected period so the
   *  chart matches the section label. `null` (or undefined) means all-time. */
  days?: number | null;
}

const FALLBACK_DAYS = 30;

export function VolumeChart({ days = FALLBACK_DAYS }: Props) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language?.startsWith('ar');
  const workouts = useWorkoutStore((s) => s.workouts);

  const { weeks, delta } = useMemo(() => {
    const now = Date.now();
    const durMs = days != null ? days * 86400000 : null;
    const cutoff = durMs ? now - durMs : 0;
    const prevCutoff = durMs ? cutoff - durMs : 0;

    // Bucket weekly volume (Mon-anchored) within the window.
    const byWeek: Record<string, number> = {};
    let prevTotal = 0;
    let curTotal = 0;

    for (const w of workouts) {
      const tms = new Date(w.date).getTime();
      const vol = w.exercises.reduce(
        (a, ex) => a + ex.sets.reduce((b, s) => b + s.reps * s.weight, 0), 0,
      );
      if (durMs && tms >= prevCutoff && tms < cutoff) {
        prevTotal += vol;
        continue;
      }
      if (tms < cutoff) continue;
      curTotal += vol;
      const d = new Date(w.date);
      const dof = d.getDay() === 0 ? 6 : d.getDay() - 1; // 0=Mon
      const mon = new Date(d);
      mon.setDate(d.getDate() - dof);
      mon.setHours(0, 0, 0, 0);
      const key = mon.toISOString().slice(0, 10);
      byWeek[key] = (byWeek[key] ?? 0) + vol;
    }

    const weeks = Object.entries(byWeek)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, volume]) => ({
        key,
        label: formatDate(key),
        volume: Math.round(volume),
      }));

    const delta = durMs && prevTotal > 0
      ? { pct: Math.round(((curTotal - prevTotal) / prevTotal) * 100), abs: Math.round(curTotal - prevTotal) }
      : null;

    return { weeks, delta };
  }, [workouts, days]);

  if (weeks.length === 0) {
    return (
      <div className="text-center py-6 text-forge-muted text-sm font-condensed">
        {t('stats.volumeTrend.empty')}
      </div>
    );
  }

  const vols = weeks.map((w) => w.volume);
  const hi = Math.ceil(Math.max(...vols, 1) * 1.1);

  const TrendIcon = !delta || delta.pct === 0 ? Minus : delta.pct > 0 ? TrendingUp : TrendingDown;
  const trendColor = !delta || delta.pct === 0 ? '#8a8a8a' : delta.pct > 0 ? '#2ecc71' : '#EF4444';

  return (
    <div className="space-y-2">
      {delta && (
        <div className="flex items-center justify-between">
          <span className="label-cap text-[9px] text-forge-muted">{t('stats.volumeTrend.vsPrior')}</span>
          <span
            className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full"
            style={{
              color: trendColor,
              background: delta.pct === 0 ? 'rgba(138,138,138,0.1)'
                : delta.pct > 0 ? 'rgba(46,204,113,0.12)' : 'rgba(239,68,68,0.12)',
            }}
            aria-label={t('stats.volumeTrend.deltaAria', {
              pct: Math.abs(delta.pct),
              direction: t(delta.pct >= 0 ? 'stats.volumeTrend.up' : 'stats.volumeTrend.down'),
            })}
          >
            <TrendIcon size={12} aria-hidden />
            {delta.pct > 0 ? '+' : ''}{formatNumber(delta.pct)}%
          </span>
        </div>
      )}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={weeks} margin={{ top: 6, right: 6, bottom: 2, left: 0 }}>
            <defs>
              <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2ecc71" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2ecc71" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1a2e1f" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              reversed={isRTL}
              tick={{ fill: '#8a8a8a', fontSize: 11 }}
              axisLine={{ stroke: '#1a2e1f' }}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={20}
            />
            <YAxis
              orientation={isRTL ? 'right' : 'left'}
              domain={[0, hi]}
              width={40}
              tick={{ fill: '#8a8a8a', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => v >= 1000 ? `${formatNumber(v / 1000, { maximumFractionDigits: 1 })}k` : formatNumber(v)}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f1a12', border: '1px solid #1a2e1f', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#e0e0e0' }}
              itemStyle={{ color: '#2ecc71' }}
              formatter={(value: number) => [`${formatNumber(value)} ${t('log.kgUnit')}`, t('stats.volumeTrend.volume')]}
            />
            <Area
              type="monotone"
              dataKey="volume"
              stroke="#2ecc71"
              strokeWidth={2}
              fill="url(#volumeGradient)"
              dot={{ r: 2, fill: '#2ecc71' }}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
