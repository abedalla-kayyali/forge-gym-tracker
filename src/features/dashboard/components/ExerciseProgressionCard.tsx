import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, Minus, Dumbbell } from 'lucide-react';
import {
  AreaChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import type { Workout } from '../../../types/workout';
import { formatNumber, formatDate } from '../../../lib/format';

interface Props {
  /** Exercise name to chart (matched case-insensitively against workout exercises). */
  exercise: string;
  workouts: Workout[];
  /** Max number of recent sessions to plot (default 12). */
  limit?: number;
}

interface Point {
  date: string;
  label: string;
  topSet: number; // heaviest set weight that session
  e1rm: number;   // best Epley estimated 1RM that session
}

/** Epley estimated 1RM: weight * (1 + reps/30). */
function epley(weight: number, reps: number): number {
  return weight * (1 + reps / 30);
}

export function ExerciseProgressionCard({ exercise, workouts, limit = 12 }: Props) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language?.startsWith('ar');

  const points = useMemo<Point[]>(() => {
    const target = exercise.toLowerCase();
    const sessions: Point[] = [];

    for (const w of workouts) {
      let topSet = 0;
      let best1rm = 0;
      let matched = false;
      for (const ex of w.exercises) {
        if (ex.name.toLowerCase() !== target) continue;
        for (const s of ex.sets) {
          if (!s.weight || s.weight <= 0 || s.isWarmup) continue;
          matched = true;
          if (s.weight > topSet) topSet = s.weight;
          const est = epley(s.weight, s.reps);
          if (est > best1rm) best1rm = est;
        }
      }
      if (matched && topSet > 0) {
        sessions.push({
          date: w.date,
          label: formatDate(w.date),
          topSet: Math.round(topSet * 10) / 10,
          e1rm: Math.round(best1rm),
        });
      }
    }

    sessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return sessions.slice(-limit);
  }, [exercise, workouts, limit]);

  const trend = useMemo(() => {
    if (points.length < 2) return null;
    const first = points[0]!.e1rm;
    const last = points[points.length - 1]!.e1rm;
    const diff = last - first;
    const pct = first > 0 ? Math.round((diff / first) * 100) : 0;
    const dir: 'up' | 'down' | 'flat' = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat';
    return { diff, pct, dir };
  }, [points]);

  if (points.length === 0) {
    return (
      <div className="text-center py-6 text-forge-muted text-sm font-condensed">
        {t('stats.progression.empty')}
      </div>
    );
  }

  const e1rms = points.map((p) => p.e1rm);
  const tops = points.map((p) => p.topSet);
  const lo = Math.floor(Math.min(...e1rms, ...tops) * 0.92);
  const hi = Math.ceil(Math.max(...e1rms, ...tops) * 1.05);

  const TrendIcon = trend?.dir === 'up' ? TrendingUp : trend?.dir === 'down' ? TrendingDown : Minus;
  const trendColor = !trend || trend.dir === 'flat'
    ? '#8a8a8a'
    : trend.dir === 'up' ? '#2ecc71' : '#EF4444';

  const current = points[points.length - 1]!;

  return (
    <div className="card-elevated card-luxury-border rounded-2xl p-4 space-y-3 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-forge-green/15 border border-forge-green/25 flex items-center justify-center shrink-0">
          <Dumbbell size={13} className="text-forge-green" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-forge-text text-[13px] font-condensed font-semibold truncate capitalize">
            {exercise}
          </div>
          <div className="text-forge-muted text-[10px] font-mono">
            {t('stats.progression.sessions', { count: points.length })}
          </div>
        </div>
        {trend && (
          <span
            className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full shrink-0"
            style={{
              color: trendColor,
              background: trend.dir === 'flat' ? 'rgba(138,138,138,0.1)'
                : trend.dir === 'up' ? 'rgba(46,204,113,0.12)' : 'rgba(239,68,68,0.12)',
            }}
            aria-label={t('stats.progression.trendAria', {
              pct: Math.abs(trend.pct),
              direction: t(`stats.progression.${trend.dir}`),
            })}
          >
            <TrendIcon size={12} aria-hidden />
            {trend.diff > 0 ? '+' : ''}{formatNumber(trend.pct)}%
          </span>
        )}
      </div>

      {/* Current numbers */}
      <div className="flex items-center gap-4">
        <div>
          <div className="label-cap text-[9px] text-forge-muted">{t('stats.progression.topSet')}</div>
          <div className="kpi-md text-forge-green leading-none">
            {formatNumber(current.topSet)}
            <span className="text-[10px] text-forge-muted ml-0.5">{t('log.kgUnit')}</span>
          </div>
        </div>
        <div>
          <div className="label-cap text-[9px] text-forge-muted">{t('stats.progression.e1rm')}</div>
          <div className="kpi-md text-forge-gold leading-none">
            {formatNumber(current.e1rm)}
            <span className="text-[10px] text-forge-muted ml-0.5">{t('log.kgUnit')}</span>
          </div>
        </div>
      </div>

      {/* Sparkline */}
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 6, right: 6, bottom: 2, left: 0 }}>
            <defs>
              <linearGradient id="e1rmGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2ecc71" stopOpacity={0.28} />
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
              domain={[lo, hi]}
              width={36}
              tick={{ fill: '#8a8a8a', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => formatNumber(v)}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f1a12', border: '1px solid #1a2e1f', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#e0e0e0' }}
              formatter={(value: number, name) => {
                const label = name === 'e1rm'
                  ? t('stats.progression.e1rm')
                  : t('stats.progression.topSet');
                return [`${formatNumber(value)} ${t('log.kgUnit')}`, label];
              }}
            />
            <Area
              type="monotone"
              dataKey="e1rm"
              stroke="#2ecc71"
              strokeWidth={2}
              fill="url(#e1rmGradient)"
              dot={{ r: 2, fill: '#2ecc71' }}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="topSet"
              stroke="#F5A623"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-[10px] font-mono text-forge-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded-full bg-forge-green" /> {t('stats.progression.e1rm')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded-full" style={{ background: '#F5A623' }} /> {t('stats.progression.topSet')}
        </span>
      </div>
    </div>
  );
}
