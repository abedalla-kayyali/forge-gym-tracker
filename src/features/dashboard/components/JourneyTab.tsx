import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dumbbell, Flame, CalendarDays, Layers, Repeat, HeartPulse, Award,
  TrendingUp, TrendingDown, Minus, Lock, Rocket, Zap,
} from 'lucide-react';
import { useWorkoutStore } from '../../../stores/useWorkoutStore';
import { useBwWorkoutStore } from '../../../stores/useBwWorkoutStore';
import { useCardioStore } from '../../../stores/useCardioStore';
import { CountUp } from '../../../components/ui/CountUp';
import { computeJourney, type StrengthTrend, type Milestone } from '../../../lib/journeyStats';
import { formatNumber } from '../../../lib/format';

const GREEN = '#2ecc71';

function formatKg(n: number): string {
  if (n >= 1_000_000) return `${formatNumber(n / 1_000_000, { maximumFractionDigits: n >= 10_000_000 ? 0 : 1 })}M`;
  if (n >= 1_000) return `${formatNumber(n / 1_000, { maximumFractionDigits: n >= 10_000 ? 0 : 1 })}k`;
  return formatNumber(Math.round(n));
}

// ── Lifetime totals ──────────────────────────────────────────────────────────

function StatCell({
  icon, label, value, unit, format, accent = 'green',
}: {
  icon: React.ReactNode; label: string; value: number; unit?: string;
  format?: (n: number) => string; accent?: 'green' | 'gold';
}) {
  return (
    <div className="card-elevated rounded-2xl p-3.5">
      <div className="flex items-center gap-1.5 text-forge-muted mb-1.5">
        {icon}
        <span className="label-cap text-[9px]">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <CountUp
          value={value}
          format={format}
          className={`kpi-lg leading-none ${accent === 'gold' ? 'text-forge-gold' : 'text-forge-green'}`}
        />
        {unit && <span className="text-[10px] font-condensed text-forge-muted">{unit}</span>}
      </div>
    </div>
  );
}

// ── e1RM sparkline ─────────────────────────────────────────────────────────

function Sparkline({ points, color }: { points: number[]; color: string }) {
  const W = 72, H = 26, P = 2;
  if (points.length < 2) return <div style={{ width: W, height: H }} />;
  const min = Math.min(...points), max = Math.max(...points);
  const span = max - min || 1;
  const step = (W - P * 2) / (points.length - 1);
  const coords = points.map((v, i) => {
    const x = P + i * step;
    const y = P + (H - P * 2) * (1 - (v - min) / span);
    return [x, y] as const;
  });
  const line = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${line} L${coords[coords.length - 1]![0].toFixed(1)} ${H} L${coords[0]![0].toFixed(1)} ${H} Z`;
  const last = coords[coords.length - 1]!;
  return (
    <svg width={W} height={H} className="shrink-0" aria-hidden>
      <path d={area} fill={color} fillOpacity={0.12} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r={2.2} fill={color} />
    </svg>
  );
}

function DeltaPill({ pct }: { pct: number | null }) {
  const { t } = useTranslation();
  const dir = pct == null || pct === 0 ? 'flat' : pct > 0 ? 'up' : 'down';
  const Icon = dir === 'up' ? TrendingUp : dir === 'down' ? TrendingDown : Minus;
  const color = dir === 'up' ? GREEN : dir === 'down' ? '#EF4444' : '#8a8a8a';
  const bg = dir === 'up' ? 'rgba(46,204,113,0.12)' : dir === 'down' ? 'rgba(239,68,68,0.12)' : 'rgba(138,138,138,0.1)';
  const ariaLabel = dir === 'flat'
    ? t('journey.a11y.flat')
    : dir === 'up' ? t('journey.a11y.up', { pct }) : t('journey.a11y.down', { pct: Math.abs(pct!) });
  return (
    <span role="img" aria-label={ariaLabel}
      className="inline-flex items-center gap-0.5 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-full shrink-0"
      style={{ color, background: bg }}>
      <Icon size={11} aria-hidden />
      {pct != null && pct !== 0 ? `${pct > 0 ? '+' : ''}${pct}%` : '—'}
    </span>
  );
}

function StrengthRow({ trend }: { trend: StrengthTrend }) {
  const { t } = useTranslation();
  const up = (trend.deltaPct ?? 0) >= 0;
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.05] px-3 py-2.5">
      <div className="flex-1 min-w-0">
        <div className="text-forge-text text-[13px] font-condensed font-semibold truncate capitalize">{trend.name}</div>
        <div className="text-forge-muted text-[10px] font-mono">{t('journey.strength.best')} {trend.best} kg</div>
      </div>
      <Sparkline points={trend.points} color={up ? GREEN : '#EF4444'} />
      <div className="text-end shrink-0 w-[58px]">
        <div className="kpi-md text-forge-green leading-none">{trend.current}<span className="text-[9px] text-forge-muted ms-0.5">kg</span></div>
        <div className="mt-1 flex justify-end"><DeltaPill pct={trend.deltaPct} /></div>
      </div>
    </div>
  );
}

// ── Consistency calendar ─────────────────────────────────────────────────────

function cellColor(count: number): string {
  if (count <= 0) return 'rgba(255,255,255,0.05)';
  if (count === 1) return 'rgba(46,204,113,0.35)';
  if (count === 2) return 'rgba(46,204,113,0.62)';
  return GREEN;
}

function ConsistencyCalendar({ days, weeks }: { days: { date: string; count: number }[]; weeks: number }) {
  const { t } = useTranslation();
  const columns: { date: string; count: number }[][] = [];
  for (let i = 0; i < days.length; i += 7) columns.push(days.slice(i, i + 7));
  const trained = days.filter((d) => d.count > 0).length;

  return (
    <div className="card-elevated rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <CalendarDays size={14} className="text-forge-green" />
        <span className="label-cap-strong text-forge-text flex-1">{t('journey.calendar.title')}</span>
      </div>
      <div className="text-[11px] text-forge-muted font-mono mb-3">
        {t('journey.calendar.subtitle', { count: trained, weeks })}
      </div>
      {/* dir=ltr keeps weeks chronological (oldest → newest) even in RTL UI */}
      <div dir="ltr" className="flex gap-[3px] overflow-x-auto pb-1" role="group" aria-label={t('journey.calendar.title')}>
        {columns.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-[3px]">
            {col.map((d) => (
              <div
                key={d.date}
                className="w-[10px] h-[10px] rounded-[2px]"
                style={{ background: cellColor(d.count) }}
                title={`${d.date}: ${d.count}`}
                {...(d.count > 0
                  ? { role: 'img', 'aria-label': t('journey.calendar.dayAria', { count: d.count, date: d.date }) }
                  : { 'aria-hidden': true })}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-1.5 mt-2.5">
        <span className="text-[9px] text-forge-dim">{t('journey.calendar.less')}</span>
        {[0, 1, 2, 3].map((c) => (
          <div key={c} className="w-[10px] h-[10px] rounded-[2px]" style={{ background: cellColor(c) }} />
        ))}
        <span className="text-[9px] text-forge-dim">{t('journey.calendar.more')}</span>
      </div>
    </div>
  );
}

// ── Milestones ───────────────────────────────────────────────────────────────

const TIER_COLOR = { bronze: '#b08d57', silver: '#c7ccd6', gold: '#d4af37' } as const;

function MilestoneBadge({ m }: { m: Milestone }) {
  const { t } = useTranslation();
  const color = TIER_COLOR[m.tier];
  const name = t(`journey.milestones.${m.key}`);
  const stateLabel = m.achieved ? t('journey.a11y.achieved') : t('journey.a11y.locked');
  const ariaLabel = m.achieved
    ? `${name} — ${stateLabel}`
    : `${name} — ${stateLabel} (${Math.round(m.progress * 100)}%)`;
  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className="card-elevated rounded-xl p-3 flex flex-col items-center text-center gap-1.5 relative overflow-hidden"
      style={m.achieved ? { borderColor: `${color}66`, boxShadow: `0 0 14px ${color}22` } : undefined}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center"
        style={{
          background: m.achieved ? `${color}22` : 'rgba(255,255,255,0.04)',
          border: `1px solid ${m.achieved ? `${color}88` : 'rgba(255,255,255,0.08)'}`,
        }}
        aria-hidden
      >
        {m.achieved
          ? <Award size={16} style={{ color }} />
          : <Lock size={14} className="text-forge-dim" />}
      </div>
      <span className={`text-[11px] font-condensed font-semibold leading-tight ${m.achieved ? 'text-forge-text' : 'text-forge-muted'}`}>
        {t(`journey.milestones.${m.key}`)}
      </span>
      {!m.achieved && (
        <div className="w-full">
          <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${Math.round(m.progress * 100)}%`, background: color, opacity: 0.7 }} />
          </div>
          <span className="text-[8px] font-mono text-forge-dim mt-0.5 block">{Math.round(m.progress * 100)}%</span>
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function JourneyTab() {
  const { t, i18n } = useTranslation();
  const workouts = useWorkoutStore((s) => s.workouts);
  const bwWorkouts = useBwWorkoutStore((s) => s.bwWorkouts);
  const cardio = useCardioStore((s) => s.entries);

  const journey = useMemo(
    () => computeJourney({ workouts, bwWorkouts, cardio }),
    [workouts, bwWorkouts, cardio],
  );

  if (journey.totals.sessions === 0) {
    return (
      <div className="card-elevated card-luxury-border rounded-2xl p-8 flex flex-col items-center gap-3 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-forge-green/15 to-forge-green/5 border border-forge-green/20 flex items-center justify-center">
          <Rocket size={24} className="text-forge-green" />
        </div>
        <p className="text-forge-text font-condensed font-semibold text-[15px]">{t('journey.title')}</p>
        <p className="text-forge-muted text-[12px] leading-snug max-w-[260px]">{t('journey.empty')}</p>
      </div>
    );
  }

  const { totals, strength, milestones } = journey;
  const unlocked = milestones.filter((m) => m.achieved).length;
  const sinceDate = totals.firstDate
    ? new Date(totals.firstDate).toLocaleDateString(i18n.language, { month: 'short', year: 'numeric' })
    : '';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-forge-text font-condensed font-bold text-[17px] leading-tight">{t('journey.title')}</h3>
          <p className="label-cap text-forge-green/80">{t('journey.subtitle')}</p>
        </div>
        {sinceDate && <span className="text-[10px] font-mono text-forge-muted">{t('journey.totals.since', { date: sinceDate })}</span>}
      </div>

      {/* Lifetime totals */}
      <div className="grid grid-cols-3 gap-2">
        <StatCell icon={<Flame size={13} />} label={t('journey.totals.sessions')} value={totals.sessions} />
        <StatCell icon={<Dumbbell size={13} />} label={t('journey.totals.volume')} value={totals.totalVolumeKg} unit="kg" format={formatKg} accent="gold" />
        <StatCell icon={<CalendarDays size={13} />} label={t('journey.totals.trainingDays')} value={totals.trainingDays} />
        <StatCell icon={<Layers size={13} />} label={t('journey.totals.sets')} value={totals.totalSets} />
        <StatCell icon={<Repeat size={13} />} label={t('journey.totals.reps')} value={totals.totalReps} />
        <StatCell icon={<HeartPulse size={13} />} label={t('journey.totals.cardioMin')} value={totals.cardioMinutes} unit="min" />
      </div>

      {/* Streaks — current run vs all-time best (already computed by computeJourney) */}
      <div className="grid grid-cols-2 gap-2">
        <StatCell
          icon={<Zap size={13} />}
          label={t('journey.totals.currentStreak')}
          value={journey.currentStreak}
          unit={t('journey.totals.daysUnit')}
          accent={journey.currentStreak > 0 ? 'gold' : 'green'}
        />
        <StatCell
          icon={<Flame size={13} />}
          label={t('journey.totals.longestStreak')}
          value={journey.longestStreak}
          unit={t('journey.totals.daysUnit')}
        />
      </div>

      {/* Strength trends */}
      <div className="card-elevated card-luxury-border rounded-2xl p-4 space-y-2.5">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-forge-green" />
          <span className="label-cap-strong text-forge-text flex-1">{t('journey.strength.title')}</span>
          <span className="text-[10px] font-mono text-forge-muted">{t('journey.strength.subtitle')}</span>
        </div>
        {strength.length > 0 ? (
          <div className="space-y-1.5">
            {strength.map((s) => <StrengthRow key={s.name} trend={s} />)}
          </div>
        ) : (
          <p className="text-forge-muted text-[12px] py-2">{t('journey.strength.empty')}</p>
        )}
      </div>

      {/* Consistency calendar */}
      <ConsistencyCalendar days={journey.calendar} weeks={journey.calendarWeeks} />

      {/* Milestones */}
      <div className="card-elevated card-luxury-border card-gold-border rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Award size={14} className="text-forge-gold" />
          <span className="label-cap-strong text-forge-text flex-1">{t('journey.milestones.title')}</span>
          <span className="text-[10px] font-mono text-forge-gold">{t('journey.milestones.unlocked', { count: unlocked, total: milestones.length })}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {milestones.map((m) => <MilestoneBadge key={m.key} m={m} />)}
        </div>
      </div>
    </div>
  );
}
