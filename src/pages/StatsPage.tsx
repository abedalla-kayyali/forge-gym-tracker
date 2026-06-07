import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp, TrendingDown, Minus, Target, Activity as MuscleIcon, Scaling, BarChart3,
  Flame, Dumbbell, Trophy, HeartPulse, Award, ChevronRight,
  Ruler, Weight, Gauge, Plus, Minus as MinusIcon, Zap, Rocket,
} from 'lucide-react';
import { TabPills } from '../components/ui/TabPills';
import { Badge } from '../components/ui/Badge';
import { useFX } from '../hooks/useFX';
import {
  WorkoutHistory,
  DashboardSection,
  VolumeChart,
  FreqChart,
  BalanceChart,
  WeightChart,
  MuscleHeatmap,
  PRBoard,
} from '../features/dashboard';
import { JourneyTab } from '../features/dashboard/components/JourneyTab';
import { StepsPanel } from '../features/steps';
import { XPBar } from '../features/gamification';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { useBwWorkoutStore } from '../stores/useBwWorkoutStore';
import { useCardioStore } from '../stores/useCardioStore';
import { useBodyStore } from '../stores/useBodyStore';
import { readStorage, writeStorage } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/constants';
import { formatNumber } from '../lib/format';

type StatsTab = 'overview' | 'journey' | 'progress' | 'muscles' | 'body' | 'cali';
type PeriodKey = '7D' | '1M' | '3M' | '6M' | 'ALL';

const SESSION_TARGET = 12;
const DOW_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const WEEKLY_GOAL_MIN = 1;
const WEEKLY_GOAL_MAX = 14;
const WEEKLY_GOAL_DEFAULT = 4;

/** Days to look back for a given progress period; null = all-time. */
function daysForPeriod(period: PeriodKey): number | null {
  switch (period) {
    case '7D': return 7;
    case '1M': return 30;
    case '3M': return 90;
    case '6M': return 180;
    default:   return null;
  }
}

const TABS: { key: StatsTab; label: string; Icon: typeof TrendingUp }[] = [
  { key: 'overview',  label: 'Overview', Icon: BarChart3 },
  { key: 'journey',   label: 'Journey',  Icon: Rocket },
  { key: 'progress',  label: 'Progress', Icon: TrendingUp },
  { key: 'muscles',   label: 'Muscles',  Icon: MuscleIcon },
  { key: 'body',      label: 'Body',     Icon: Target },
  { key: 'cali',      label: 'Cali',     Icon: Scaling },
];

const PERIODS: PeriodKey[] = ['7D', '1M', '3M', '6M', 'ALL'];

function freshLabel(days: number | null): { label: string; color: string } {
  if (days === null)    return { label: 'Never',      color: '#4B5563' };
  if (days < 1)         return { label: 'Sore',       color: '#EF4444' };
  if (days <= 2)        return { label: 'Worked',     color: '#2ecc71' };
  if (days <= 4)        return { label: 'Recovering', color: '#8BC34A' };
  if (days <= 6)        return { label: 'Ready',      color: '#F59E0B' };
  return                 { label: 'Overdue',    color: '#4B5563' };
}

// ═════════════════════════════════════════════════════════════════════════════
// OVERVIEW TAB
// ═════════════════════════════════════════════════════════════════════════════

function RingCircle({
  pct, color, dim, label, value,
}: { pct: number; color: string; dim: string; label: string; value: string }) {
  const R = 24;
  const CIRC = 2 * Math.PI * R;
  const dash = (pct / 100) * CIRC;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="30" cy="30" r={R} fill="none" stroke={dim} strokeWidth="5" />
        <circle cx="30" cy="30" r={R} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${dash} ${CIRC}`} strokeLinecap="round" />
      </svg>
      <span className="label-cap text-[9px] text-forge-muted">{label}</span>
      <span className="font-condensed font-bold text-[13px] text-forge-text -mt-1">{value}</span>
    </div>
  );
}

// ─── Momentum headline (#30) ─────────────────────────────────────────────────

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const dow = x.getDay() === 0 ? 6 : x.getDay() - 1; // 0 = Mon
  x.setDate(x.getDate() - dow);
  x.setHours(0, 0, 0, 0);
  return x;
}

function DeltaPill({ pct }: { pct: number | null }) {
  const dir = pct == null || pct === 0 ? 'flat' : pct > 0 ? 'up' : 'down';
  const Icon = dir === 'up' ? TrendingUp : dir === 'down' ? TrendingDown : Minus;
  const color = dir === 'up' ? '#2ecc71' : dir === 'down' ? '#EF4444' : '#8a8a8a';
  const bg = dir === 'up' ? 'rgba(46,204,113,0.12)' : dir === 'down' ? 'rgba(239,68,68,0.12)' : 'rgba(138,138,138,0.1)';
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-full shrink-0"
      style={{ color, background: bg }}
    >
      <Icon size={11} aria-hidden />
      {pct != null && pct !== 0 ? `${pct > 0 ? '+' : ''}${formatNumber(pct)}%` : '—'}
    </span>
  );
}

function MomentumHeadline() {
  const { t } = useTranslation();
  const { play } = useFX();
  const workouts   = useWorkoutStore((s) => s.workouts);
  const bwWorkouts = useBwWorkoutStore((s) => s.bwWorkouts);
  const cardio     = useCardioStore((s) => s.entries);

  const [goal, setGoal] = useState<number>(() => {
    const v = Number(readStorage<number>(STORAGE_KEYS.WEEKLY_GOAL, WEEKLY_GOAL_DEFAULT));
    return Number.isFinite(v) && v > 0 ? v : WEEKLY_GOAL_DEFAULT;
  });

  const setGoalClamped = (next: number) => {
    const clamped = Math.max(WEEKLY_GOAL_MIN, Math.min(WEEKLY_GOAL_MAX, next));
    setGoal(clamped);
    writeStorage(STORAGE_KEYS.WEEKLY_GOAL, clamped);
    play('tap');
  };

  const m = useMemo(() => {
    const now = new Date();
    const thisStart = startOfWeek(now).getTime();
    const lastStart = thisStart - 7 * 86400000;

    const volOf = (w: { exercises: { sets: { reps: number; weight: number }[] }[] }) =>
      w.exercises.reduce((a, ex) => a + ex.sets.reduce((b, s) => b + s.reps * (s.weight || 0), 0), 0);

    let thisSessions = 0, lastSessions = 0, thisVol = 0, lastVol = 0;

    const bump = (dateStr: string, vol: number) => {
      const t0 = new Date(dateStr).getTime();
      if (t0 >= thisStart) { thisSessions++; thisVol += vol; }
      else if (t0 >= lastStart && t0 < thisStart) { lastSessions++; lastVol += vol; }
    };

    for (const w of workouts) bump(w.date, volOf(w));
    for (const w of bwWorkouts) bump(w.date, 0);
    for (const c of cardio) bump(c.date, 0);

    const pct = (cur: number, prev: number): number | null =>
      prev > 0 ? Math.round(((cur - prev) / prev) * 100) : cur > 0 ? 100 : null;

    return {
      thisSessions, lastSessions, thisVol: Math.round(thisVol), lastVol: Math.round(lastVol),
      sessionsPct: pct(thisSessions, lastSessions),
      volPct: pct(thisVol, lastVol),
    };
  }, [workouts, bwWorkouts, cardio]);

  const goalPct = Math.min(100, Math.round((m.thisSessions / goal) * 100));
  const goalMet = m.thisSessions >= goal;

  return (
    <div className="card-elevated card-luxury-border rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-forge-green/15 border border-forge-green/25 flex items-center justify-center shrink-0">
          <Zap size={13} className="text-forge-green" />
        </div>
        <span className="label-cap-strong text-forge-text flex-1">{t('stats.momentum.title')}</span>
        <span className="text-[10px] font-mono text-forge-muted">{t('stats.momentum.thisVsLast')}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="label-cap text-[9px] text-forge-muted">{t('stats.momentum.sessions')}</span>
            <DeltaPill pct={m.sessionsPct} />
          </div>
          <div className="kpi-md text-forge-green leading-none mt-1">{formatNumber(m.thisSessions)}</div>
          <div className="text-[10px] text-forge-dim font-mono mt-0.5">
            {t('stats.momentum.lastWeek', { count: m.lastSessions })}
          </div>
        </div>
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="label-cap text-[9px] text-forge-muted">{t('stats.momentum.volume')}</span>
            <DeltaPill pct={m.volPct} />
          </div>
          <div className="kpi-md text-forge-green leading-none mt-1">
            {m.thisVol >= 1000 ? `${formatNumber(m.thisVol / 1000, { maximumFractionDigits: 1 })}k` : formatNumber(m.thisVol)}
            <span className="text-[10px] text-forge-muted ms-0.5">{t('log.kgUnit')}</span>
          </div>
          <div className="text-[10px] text-forge-dim font-mono mt-0.5">
            {t('stats.momentum.lastWeekVol', {
              vol: m.lastVol >= 1000 ? `${formatNumber(m.lastVol / 1000, { maximumFractionDigits: 1 })}k` : formatNumber(m.lastVol),
            })}
          </div>
        </div>
      </div>

      {/* Weekly goal stepper + progress */}
      <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] px-3 py-2.5 space-y-2">
        <div className="flex items-center gap-3">
          <Target size={14} className={goalMet ? 'text-forge-green' : 'text-forge-muted'} aria-hidden />
          <span className="text-[11px] font-condensed text-forge-text-soft flex-1">
            {t('stats.momentum.weeklyGoal')}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setGoalClamped(goal - 1)}
              disabled={goal <= WEEKLY_GOAL_MIN}
              className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-forge-text-soft disabled:opacity-30 cursor-pointer press-scale transition-colors hover:bg-white/10"
              aria-label={t('stats.momentum.decreaseGoal')}
            >
              <MinusIcon size={13} />
            </button>
            <span className="kpi-sm text-forge-green font-mono w-6 text-center tabular-nums" aria-live="polite">
              {formatNumber(goal)}
            </span>
            <button
              type="button"
              onClick={() => setGoalClamped(goal + 1)}
              disabled={goal >= WEEKLY_GOAL_MAX}
              className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-forge-text-soft disabled:opacity-30 cursor-pointer press-scale transition-colors hover:bg-white/10"
              aria-label={t('stats.momentum.increaseGoal')}
            >
              <Plus size={13} />
            </button>
          </div>
        </div>
        <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${goalPct}%`, background: goalMet ? '#F5A623' : '#2ecc71' }}
          />
        </div>
        <div className="text-[10px] font-mono text-forge-muted text-center">
          {goalMet
            ? t('stats.momentum.goalMet', { count: m.thisSessions })
            : t('stats.momentum.goalProgress', { done: m.thisSessions, goal })}
        </div>
      </div>
    </div>
  );
}

function ActivityRingsHero() {
  const workouts    = useWorkoutStore((s) => s.workouts);
  const bwWorkouts  = useBwWorkoutStore((s) => s.bwWorkouts);
  const cardio      = useCardioStore((s) => s.entries);

  const data = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    // Sessions this month
    const sessionsThisMonth = [
      ...workouts.filter((w) => new Date(w.date).getTime() >= monthStart),
      ...bwWorkouts.filter((w) => new Date(w.date).getTime() >= monthStart),
      ...cardio.filter((c) => new Date(c.date).getTime() >= monthStart),
    ].length;
    const sessionsPct = Math.min(100, (sessionsThisMonth / SESSION_TARGET) * 100);

    // Streak
    const daySet = new Set<string>();
    [...workouts, ...bwWorkouts].forEach((w) => daySet.add(w.date.slice(0, 10)));
    cardio.forEach((c) => daySet.add(c.date.slice(0, 10)));
    let streak = 0;
    const cursor = new Date();
    const todayKey = cursor.toISOString().slice(0, 10);
    const yestKey  = new Date(cursor.getTime() - 86400000).toISOString().slice(0, 10);
    if (daySet.has(todayKey) || daySet.has(yestKey)) {
      if (!daySet.has(todayKey)) cursor.setTime(cursor.getTime() - 86400000);
      while (daySet.has(cursor.toISOString().slice(0, 10))) {
        streak++;
        cursor.setTime(cursor.getTime() - 86400000);
      }
    }
    const streakPct = Math.min(100, (streak / 7) * 100);

    // Volume this month vs best historical month
    const volMonth = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthlyVol: Record<string, number> = {};
    for (const w of workouts) {
      const key = volMonth(new Date(w.date));
      const v = w.exercises.reduce((a, ex) => a + ex.sets.reduce((b, s) => b + s.reps * s.weight, 0), 0);
      monthlyVol[key] = (monthlyVol[key] ?? 0) + v;
    }
    const currentMonthKey = volMonth(now);
    const volumeThisMonth = monthlyVol[currentMonthKey] ?? 0;
    const volValues = Object.values(monthlyVol);
    const bestMonth = volValues.length ? Math.max(...volValues, volumeThisMonth, 1) : Math.max(volumeThisMonth, 1);
    const volumePct = Math.min(100, (volumeThisMonth / bestMonth) * 100);

    // Latest PR (most recent workout with any isPR set)
    let latestPR: { name: string; weight: number; reps: number; date: string } | null = null;
    for (const w of [...workouts].sort((a, b) => b.date.localeCompare(a.date))) {
      for (const ex of w.exercises) {
        const prSet = ex.sets.find((s) => s.isPR && s.weight > 0);
        if (prSet) {
          latestPR = { name: ex.name, weight: prSet.weight, reps: prSet.reps, date: w.date };
          break;
        }
      }
      if (latestPR) break;
    }

    // Current week training dots (Mon=0 … Sun=6)
    const weekStart = new Date(now);
    const dow = now.getDay() === 0 ? 6 : now.getDay() - 1;
    weekStart.setDate(now.getDate() - dow);
    weekStart.setHours(0, 0, 0, 0);
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return daySet.has(d.toISOString().slice(0, 10));
    });
    const todayDow = dow;

    return { sessionsThisMonth, sessionsPct, streak, streakPct, volumeThisMonth, volumePct, latestPR, weekDays, todayDow };
  }, [workouts, bwWorkouts, cardio]);

  return (
    <div className="space-y-2">
      {/* Activity rings card */}
      <div className="card-elevated rounded-2xl p-4">
        <div className="flex justify-around items-center">
          <RingCircle pct={data.sessionsPct} color="#2ecc71" dim="#1e3a1e" label="Sessions" value={String(data.sessionsThisMonth)} />
          <RingCircle pct={data.streakPct}   color="#f59e0b" dim="#2a1e00" label="Streak"   value={`${data.streak}d`} />
          <RingCircle pct={data.volumePct}   color="#6366f1" dim="#1a1a2e" label="Volume"   value={data.volumeThisMonth >= 1000 ? `${Math.round(data.volumeThisMonth / 1000)}k` : String(Math.round(data.volumeThisMonth))} />
        </div>
        <div className="flex justify-around mt-2">
          <span className="text-[9px] text-forge-green text-center">↑ this month</span>
          <span className="text-[9px] text-forge-ember text-center">{data.streak > 0 ? 'keep going' : 'start today'}</span>
          <span className="text-[9px] text-[#6366f1] text-center">{Math.round(data.volumeThisMonth).toLocaleString()} kg</span>
        </div>
      </div>

      {/* Weekly dot strip */}
      <div className="card-elevated rounded-xl px-4 py-3">
        <div className="label-cap text-forge-muted mb-2">This Week</div>
        <div className="flex justify-between">
          {DOW_LABELS.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  background: data.weekDays[i] ? '#2ecc71' : 'transparent',
                  border: data.weekDays[i]
                    ? 'none'
                    : i === data.todayDow
                      ? '1.5px solid #2ecc71'
                      : '1.5px solid #333',
                  boxShadow: i === data.todayDow && data.weekDays[i] ? '0 0 6px #2ecc71' : 'none',
                }}
              />
              <span className="text-[8px] text-forge-dim">{d}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Latest PR pill */}
      {data.latestPR && (
        <div className="card-elevated card-gold-border rounded-xl px-3 py-2.5 flex items-center gap-3 min-h-[44px]">
          <div className="w-7 h-7 rounded-lg bg-forge-gold/15 border border-forge-gold/30 flex items-center justify-center flex-shrink-0">
            <Trophy size={13} className="text-forge-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-forge-text text-[13px] font-condensed font-semibold truncate">{data.latestPR.name}</div>
            <div className="text-forge-muted text-[10px] font-mono">
              {new Date(data.latestPR.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          </div>
          <div className="kpi-md text-forge-gold leading-none shrink-0">
            {data.latestPR.weight}
            <span className="text-[10px] text-forge-muted ms-0.5">KG · {data.latestPR.reps}R</span>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiBigCell({
  label, value, unit, icon, sub, accent = 'green', delta,
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  sub?: string;
  accent?: 'green' | 'gold' | 'ember' | 'muted';
  delta?: { value: number; unit?: string } | null;
}) {
  const colorMap = {
    green: 'text-forge-green',
    gold:  'text-forge-gold',
    ember: 'text-forge-ember',
    muted: 'text-forge-text-soft',
  } as const;
  const hasDelta = delta != null && delta.value !== 0;
  return (
    <div className="card-elevated rounded-2xl p-3.5 relative overflow-hidden">
      <div className="flex items-center gap-1.5 text-forge-muted mb-1.5">
        {icon}
        <span className="label-cap text-[9px]">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`kpi-lg ${colorMap[accent]} leading-none`}>{value}</span>
        {unit && <span className="text-[10px] font-condensed text-forge-muted">{unit}</span>}
      </div>
      {hasDelta && (
        <div
          className="inline-flex items-center text-[9px] font-mono font-semibold mt-1 px-1.5 py-0.5 rounded-full"
          style={{
            color:      delta!.value > 0 ? '#2ecc71' : '#EF4444',
            background: delta!.value > 0 ? 'rgba(46,204,113,0.1)' : 'rgba(239,68,68,0.1)',
          }}
        >
          {delta!.value > 0 ? '↑' : '↓'} {Math.abs(delta!.value).toLocaleString()}{delta!.unit ?? ''}
        </div>
      )}
      {sub && !hasDelta && (
        <div className="text-[10px] text-forge-dim font-condensed mt-1 uppercase tracking-wider">{sub}</div>
      )}
    </div>
  );
}

function TopPRs() {
  const workouts = useWorkoutStore((s) => s.workouts);
  const bwWorkouts = useBwWorkoutStore((s) => s.bwWorkouts);

  const prs = useMemo(() => {
    const byExercise = new Map<string, { name: string; weight: number; reps: number; date: string; kind: 'weighted' | 'bw' }>();
    for (const w of workouts) {
      for (const ex of w.exercises) {
        for (const s of ex.sets) {
          if (!s.weight || s.weight <= 0) continue;
          const existing = byExercise.get(ex.name);
          if (!existing || s.weight > existing.weight) {
            byExercise.set(ex.name, { name: ex.name, weight: s.weight, reps: s.reps, date: w.date, kind: 'weighted' });
          }
        }
      }
    }
    for (const w of bwWorkouts) {
      for (const ex of w.exercises) {
        for (const s of ex.sets) {
          const key = ex.name;
          const existing = byExercise.get(key);
          if (!existing || s.reps > existing.reps) {
            byExercise.set(key, { name: ex.name, weight: 0, reps: s.reps, date: w.date, kind: 'bw' });
          }
        }
      }
    }
    return [...byExercise.values()]
      .sort((a, b) => {
        const aScore = a.kind === 'weighted' ? a.weight * a.reps : a.reps;
        const bScore = b.kind === 'weighted' ? b.weight * b.reps : b.reps;
        return bScore - aScore;
      })
      .slice(0, 3);
  }, [workouts, bwWorkouts]);

  if (prs.length === 0) return null;

  return (
    <div className="card-elevated card-luxury-border card-gold-border rounded-2xl p-4 space-y-2.5">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-forge-gold/15 border border-forge-gold/30 flex items-center justify-center">
          <Award size={13} className="text-forge-gold" />
        </div>
        <span className="label-cap-strong">Personal Records</span>
        <Badge variant="gold" className="ms-auto">{prs.length}</Badge>
      </div>
      <ul className="space-y-1.5" role="list">
        {prs.map((pr, i) => (
          <li key={pr.name} className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.05] px-3 py-2 min-h-[44px]">
            <span
              className={[
                'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-display shrink-0',
                i === 0 ? 'bg-gradient-to-br from-forge-gold-light to-forge-gold text-forge-bg-deep' :
                i === 1 ? 'bg-white/10 text-forge-text-soft' :
                          'bg-white/5 text-forge-muted',
              ].join(' ')}
            >{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="text-forge-text text-[13px] font-condensed font-semibold truncate">{pr.name}</div>
              <div className="text-forge-muted text-[10px] font-mono">
                {new Date(pr.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
            <div className="text-end shrink-0">
              <div className="kpi-md text-forge-gold leading-none">
                {pr.kind === 'weighted' ? `${pr.weight}` : pr.reps}
                <span className="text-[10px] text-forge-muted ms-0.5">
                  {pr.kind === 'weighted' ? `KG · ${pr.reps}R` : 'REPS'}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MUSCLES TAB
// ═════════════════════════════════════════════════════════════════════════════

function MuscleVolumeByGroup() {
  const workouts   = useWorkoutStore((s) => s.workouts);
  const rows = useMemo(() => {
    const cutoff = Date.now() - 30 * 86400000;
    const byMuscle: Record<string, number> = {};

    for (const w of workouts) {
      if (new Date(w.date).getTime() < cutoff) continue;
      for (const ex of w.exercises) {
        const m   = ex.muscle.toLowerCase();
        const vol = ex.sets.reduce((a, s) => a + s.reps * s.weight, 0);
        byMuscle[m] = (byMuscle[m] ?? 0) + vol;
      }
    }

    const entries = Object.entries(byMuscle)
      .filter(([, v]) => v > 0)
      .sort(([, a], [, b]) => b - a);

    const max = Math.max(...entries.map(([, v]) => v), 1);
    return entries.map(([muscle, vol]) => ({
      muscle,
      pct: (vol / max) * 100,
      label: vol >= 1000 ? `${(vol / 1000).toFixed(1)}k` : String(Math.round(vol)),
      unit: vol >= 1000 ? '' : ' kg',
    }));
  }, [workouts]);

  if (rows.length === 0) return null;

  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.muscle} className="flex items-center gap-3 min-h-[36px]">
          <span className="text-forge-text-soft text-[11px] font-condensed font-semibold capitalize w-[72px] flex-shrink-0">
            {r.muscle}
          </span>
          <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-forge-green transition-all"
              style={{ width: `${r.pct}%` }}
            />
          </div>
          <span className="text-forge-muted text-[10px] font-mono w-12 text-end flex-shrink-0">
            {r.label}{r.unit}
          </span>
        </div>
      ))}
    </div>
  );
}

function MuscleFreshnessList() {
  const workouts = useWorkoutStore((s) => s.workouts);
  const bwWorkouts = useBwWorkoutStore((s) => s.bwWorkouts);

  const rows = useMemo(() => {
    const now = Date.now();
    const MUSCLE_GROUPS = ['chest','back','shoulders','biceps','triceps','forearms','core','legs','glutes','calves'] as const;
    return MUSCLE_GROUPS.map((m) => {
      const allSessions = [...workouts, ...bwWorkouts]
        .filter((w) => w.exercises.some((e) => e.muscle.toLowerCase() === m))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const last = allSessions[0];
      const days = last ? Math.floor((now - new Date(last.date).getTime()) / 86400000) : null;
      const { label, color } = freshLabel(days);
      const dateStr = last
        ? new Date(last.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : '—';
      const sessions = allSessions.length;
      return { muscle: m, days, label, color, dateStr, sessions };
    });
  }, [workouts, bwWorkouts]);

  return (
    <div className="space-y-1.5">
      {rows.map((r) => (
        <div
          key={r.muscle}
          className="card-elevated rounded-xl px-3 py-2.5 flex items-center gap-3 transition-colors hover:bg-white/[0.04]"
        >
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: r.color, boxShadow: `0 0 8px ${r.color}88` }}
            aria-hidden
          />
          <span className="flex-1 text-forge-text text-[13px] font-condensed font-semibold capitalize">{r.muscle}</span>
          <span className="text-forge-muted text-[10px] font-mono">
            {r.sessions}× · {r.dateStr}
          </span>
          <span
            className="text-[10px] font-condensed font-semibold uppercase tracking-wider w-16 text-end"
            style={{ color: r.color }}
          >
            {r.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// BODY TAB — with deltas
// ═════════════════════════════════════════════════════════════════════════════

function WeightHeroCard() {
  const bodyWeight = useBodyStore((s) => s.bodyWeight);

  const { latest, delta } = useMemo(() => {
    const sorted = [...bodyWeight].sort((a, b) => b.date.localeCompare(a.date));
    const latest   = sorted[0] ?? null;
    const previous = sorted[1] ?? null;
    const delta = latest && previous ? +(latest.weight_kg - previous.weight_kg).toFixed(1) : null;
    return { latest, delta };
  }, [bodyWeight]);

  if (!latest) return (
    <div className="card-elevated rounded-2xl p-8 text-center">
      <Weight size={28} className="text-forge-dim mx-auto mb-2" />
      <p className="text-forge-text-soft font-condensed font-semibold">No weight entries yet</p>
      <p className="text-forge-muted text-[12px] mt-1">Log your weight in the Body section</p>
    </div>
  );

  const isDown = delta !== null && delta < 0;

  return (
    <div
      className="card-elevated rounded-2xl p-4"
      style={{ background: 'linear-gradient(135deg, #0d1f0d88, #0f0f0f)' }}
    >
      <div className="label-cap text-forge-muted mb-2">Current Weight</div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-baseline gap-1.5">
          <span className="kpi-lg text-forge-green leading-none">{latest.weight_kg}</span>
          <span className="text-forge-muted text-[12px] font-condensed">KG</span>
        </div>
        {delta !== null && delta !== 0 && (
          <span
            className="inline-flex items-center text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full"
            style={{
              color:      isDown ? '#2ecc71' : '#EF4444',
              background: isDown ? 'rgba(46,204,113,0.12)' : 'rgba(239,68,68,0.12)',
              border:     `1px solid ${isDown ? 'rgba(46,204,113,0.3)' : 'rgba(239,68,68,0.3)'}`,
            }}
          >
            {isDown ? '↓' : '↑'} {Math.abs(delta)} kg
          </span>
        )}
      </div>
      <div className="text-forge-muted text-[10px] font-mono mt-1">
        {new Date(latest.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
      </div>
    </div>
  );
}

function MeasurementsGrid() {
  const measurements = useBodyStore((s) => s.measurements);
  const sorted = useMemo(
    () => [...measurements].sort((a, b) => b.date.localeCompare(a.date)),
    [measurements],
  );
  const latest = sorted[0];
  const previous = sorted[1];

  if (!latest) {
    return (
      <div className="card-elevated rounded-2xl p-8 text-center">
        <Ruler size={28} className="text-forge-dim mx-auto mb-2" />
        <p className="text-forge-text-soft font-condensed font-semibold">No measurements yet</p>
        <p className="text-forge-muted text-[12px] mt-1">Log your first measurement in the Body section</p>
      </div>
    );
  }

  const fields: Array<{ key: keyof typeof latest; label: string }> = [
    { key: 'chest',      label: 'Chest' },
    { key: 'waist',      label: 'Waist' },
    { key: 'hips',       label: 'Hips' },
    { key: 'shoulders',  label: 'Shoulders' },
    { key: 'neck',       label: 'Neck' },
    { key: 'left_arm',   label: 'L Arm' },
    { key: 'right_arm',  label: 'R Arm' },
    { key: 'left_thigh', label: 'L Thigh' },
    { key: 'right_thigh',label: 'R Thigh' },
    { key: 'left_calf',  label: 'L Calf' },
    { key: 'right_calf', label: 'R Calf' },
  ];
  const defined = fields.filter((f) => latest[f.key] !== undefined && latest[f.key] !== null);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="label-cap">Latest — {new Date(latest.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        {previous && <Badge variant="default">vs {new Date(previous.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Badge>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {defined.map(({ key, label }) => {
          const val = latest[key] as number;
          const prev = previous ? (previous[key] as number | undefined) : undefined;
          const delta = prev != null ? val - prev : null;
          const deltaColor = delta == null ? '#4B5563' : delta > 0 ? '#2ecc71' : delta < 0 ? '#EF4444' : '#4B5563';
          return (
            <div key={key} className="card-elevated rounded-xl p-2.5 text-center">
              <div className="label-cap text-[9px]">{label}</div>
              <div className="kpi-lg text-forge-green leading-none mt-0.5">{val}</div>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <span className="text-forge-dim text-[9px]">cm</span>
                {delta != null && delta !== 0 && (
                  <span className="text-[9px] font-mono font-semibold" style={{ color: deltaColor }}>
                    {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CompositionDonut() {
  const inbody = useBodyStore((s) => s.inbody);

  const { latest, previous } = useMemo(() => {
    const sorted = [...inbody].sort((a, b) => b.date.localeCompare(a.date));
    return { latest: sorted[0] ?? null, previous: sorted[1] ?? null };
  }, [inbody]);

  if (!latest) return (
    <div className="card-elevated rounded-2xl p-8 text-center">
      <Gauge size={28} className="text-forge-dim mx-auto mb-2" />
      <p className="text-forge-text-soft font-condensed font-semibold">No InBody tests yet</p>
      <p className="text-forge-muted text-[12px] mt-1">Add your scan in the Body section</p>
    </div>
  );

  const muscle = latest.muscle_mass ?? 0;
  const fat    = latest.body_fat    ?? 0;
  const water  = latest.water       ?? 0;
  const total  = muscle + fat + water || 1;

  const R    = 28;
  const CIRC = 2 * Math.PI * R;
  const mArc = (muscle / total) * CIRC;
  const fArc = (fat    / total) * CIRC;
  const wArc = (water  / total) * CIRC;

  const d = (key: keyof typeof latest, lowerBetter = false) => {
    if (!previous) return null;
    const cur  = (latest[key]   as number | undefined) ?? 0;
    const prev = (previous[key] as number | undefined) ?? 0;
    const diff = +(cur - prev).toFixed(1);
    if (diff === 0) return null;
    const good = lowerBetter ? diff < 0 : diff > 0;
    return { diff, color: good ? '#2ecc71' : '#EF4444' };
  };

  const metrics: Array<{
    label: string; color: string; value: number | undefined; unit: string;
    delta: ReturnType<typeof d>;
  }> = [
    { label: 'Muscle',   color: '#2ecc71', value: latest.muscle_mass,  unit: 'kg', delta: d('muscle_mass') },
    { label: 'Fat Mass', color: '#EF4444', value: latest.body_fat,      unit: 'kg', delta: d('body_fat', true) },
    { label: 'Fat %',    color: '#EF4444', value: latest.body_fat_pct,  unit: '%',  delta: d('body_fat_pct', true) },
    { label: 'Water',    color: '#6366f1', value: latest.water,         unit: 'L',  delta: null },
    { label: 'BMI',      color: '#4B5563', value: latest.bmi,           unit: '',   delta: d('bmi', true) },
  ].filter((m) => m.value != null);

  return (
    <div className="card-elevated rounded-2xl p-4">
      <div className="label-cap text-forge-muted mb-3">Body Composition (InBody)</div>
      <div className="flex items-center gap-5">
        {/* Donut */}
        <div className="relative flex-shrink-0">
          <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="40" cy="40" r={R} fill="none" stroke="#1a1a1a" strokeWidth="10" />
            <circle cx="40" cy="40" r={R} fill="none" stroke="#2ecc71" strokeWidth="10"
              strokeDasharray={`${mArc} ${CIRC}`} strokeLinecap="butt" />
            <circle cx="40" cy="40" r={R} fill="none" stroke="#EF4444" strokeWidth="10"
              strokeDasharray={`${fArc} ${CIRC}`} strokeDashoffset={-mArc} strokeLinecap="butt" />
            <circle cx="40" cy="40" r={R} fill="none" stroke="#6366f1" strokeWidth="10"
              strokeDasharray={`${wArc} ${CIRC}`} strokeDashoffset={-(mArc + fArc)} strokeLinecap="butt" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-forge-text font-bold text-[13px] leading-none">
              {latest.body_fat_pct != null ? `${latest.body_fat_pct}%` : '—'}
            </span>
            <span className="text-forge-dim text-[8px] uppercase tracking-wide">Fat</span>
          </div>
        </div>
        {/* Legend */}
        <div className="flex-1 space-y-1.5">
          {metrics.map((m) => (
            <div key={m.label} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.color }} />
              <span className="text-forge-muted text-[10px] flex-1">{m.label}</span>
              <span className="text-forge-text text-[11px] font-mono font-semibold">
                {m.value}{m.unit}
                {m.delta && (
                  <span className="text-[9px] ms-1" style={{ color: m.delta.color }}>
                    {m.delta.diff > 0 ? '+' : ''}{m.delta.diff}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// CALI TAB — real data
// ═════════════════════════════════════════════════════════════════════════════

function CaliDashboard() {
  const bwWorkouts = useBwWorkoutStore((s) => s.bwWorkouts);

  const data = useMemo(() => {
    const totalSessions = bwWorkouts.length;
    const totalReps = bwWorkouts.reduce(
      (a, w) => a + w.exercises.reduce((b, ex) => b + ex.sets.reduce((c, s) => c + s.reps, 0), 0), 0,
    );
    const totalSets = bwWorkouts.reduce(
      (a, w) => a + w.exercises.reduce((b, ex) => b + ex.sets.length, 0), 0,
    );

    // PRs per exercise (max reps)
    const prs = new Map<string, { name: string; reps: number; date: string; muscle: string }>();
    for (const w of bwWorkouts) {
      for (const ex of w.exercises) {
        for (const s of ex.sets) {
          const cur = prs.get(ex.name);
          if (!cur || s.reps > cur.reps) {
            prs.set(ex.name, { name: ex.name, reps: s.reps, date: w.date, muscle: ex.muscle });
          }
        }
      }
    }
    const topPRs = [...prs.values()].sort((a, b) => b.reps - a.reps).slice(0, 5);

    // Recent sessions
    const recent = [...bwWorkouts]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    return { totalSessions, totalReps, totalSets, topPRs, recent };
  }, [bwWorkouts]);

  if (data.totalSessions === 0) {
    return (
      <div className="card-elevated card-luxury-border rounded-2xl p-8 flex flex-col items-center gap-3 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-forge-green/15 to-forge-green/5 border border-forge-green/20 flex items-center justify-center">
          <Scaling size={24} className="text-forge-green" />
        </div>
        <div>
          <p className="text-forge-text font-condensed font-semibold text-[15px]">Start your calisthenics journey</p>
          <p className="text-forge-muted text-[12px] mt-1 leading-snug max-w-[260px]">
            Log your first bodyweight session in the Log tab (Bodyweight mode) to see progress here.
          </p>
        </div>
        <div className="flex gap-1.5 mt-2">
          {['Push', 'Pull', 'Core', 'Legs'].map((g) => (
            <Badge key={g} variant="default">{g}</Badge>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-2">
        <KpiBigCell label="Sessions" value={data.totalSessions} icon={<Flame size={13} />} accent="green" />
        <KpiBigCell label="Reps"    value={data.totalReps.toLocaleString()} icon={<Dumbbell size={13} />} accent="green" />
        <KpiBigCell label="Sets"    value={data.totalSets} icon={<Trophy size={13} />} accent="gold" />
      </div>

      {/* Top PRs */}
      {data.topPRs.length > 0 && (
        <div className="card-elevated card-luxury-border rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Award size={14} className="text-forge-gold" />
            <span className="label-cap-strong">Top Rep PRs</span>
          </div>
          <ul className="space-y-1.5">
            {data.topPRs.map((pr, i) => (
              <li key={pr.name} className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.05] px-3 py-2">
                <span
                  className={[
                    'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-display shrink-0',
                    i === 0 ? 'bg-gradient-to-br from-forge-gold-light to-forge-gold text-forge-bg-deep' :
                                'bg-white/5 text-forge-muted',
                  ].join(' ')}
                >{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-forge-text text-[13px] font-condensed font-semibold truncate">{pr.name}</div>
                  <div className="text-forge-muted text-[10px] font-mono">{pr.muscle} · {new Date(pr.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                </div>
                <div className="kpi-md text-forge-gold leading-none">{pr.reps}<span className="text-[10px] text-forge-muted ms-0.5">REPS</span></div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent sessions */}
      {data.recent.length > 0 && (
        <div className="space-y-2">
          <span className="label-cap-strong">Recent Sessions</span>
          {data.recent.map((w) => (
            <div key={w.id} className="card-elevated rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-forge-green/10 flex items-center justify-center shrink-0">
                <Scaling size={14} className="text-forge-green" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-forge-text text-[13px] font-condensed font-semibold truncate capitalize">{w.name}</div>
                <div className="text-forge-muted text-[10px] font-mono">
                  {new Date(w.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  {' · '}
                  {w.exercises.length} ex · {w.exercises.reduce((a, ex) => a + ex.sets.reduce((b, s) => b + s.reps, 0), 0)} reps
                </div>
              </div>
              <ChevronRight size={13} className="text-forge-dim" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PROGRESS TAB — period summary + charts
// ═════════════════════════════════════════════════════════════════════════════

function PeriodSummary({ period }: { period: PeriodKey }) {
  const workouts   = useWorkoutStore((s) => s.workouts);
  const bwWorkouts = useBwWorkoutStore((s) => s.bwWorkouts);
  const cardio     = useCardioStore((s) => s.entries);

  const { current, prev } = useMemo(() => {
    const durMs =
      period === '7D'  ?  7 * 86400000 :
      period === '1M'  ? 30 * 86400000 :
      period === '3M'  ? 90 * 86400000 :
      period === '6M'  ? 180 * 86400000 : null;

    const now        = Date.now();
    const cutoff     = durMs ? now - durMs : 0;
    const prevCutoff = durMs ? cutoff - durMs : 0;

    const calc = (from: number, to: number) => {
      const w  = workouts.filter((x)   => { const t = new Date(x.date).getTime(); return t >= from && t < to; });
      const bw = bwWorkouts.filter((x) => { const t = new Date(x.date).getTime(); return t >= from && t < to; });
      const c  = cardio.filter((x)     => { const t = new Date(x.date).getTime(); return t >= from && t < to; });
      const sessions = w.length + bw.length + c.length;
      const volume   = Math.round(w.reduce((a, x) => a + x.exercises.reduce((b, ex) => b + ex.sets.reduce((c2, s) => c2 + s.reps * s.weight, 0), 0), 0));
      const prs      = w.reduce((a, x) => a + x.exercises.reduce((b, ex) => b + ex.sets.filter((s) => s.isPR).length, 0), 0);
      const minutes  = c.reduce((a, x) => a + x.duration, 0);
      return { sessions, volume, prs, minutes };
    };

    const current = calc(cutoff, now);
    const prev    = durMs ? calc(prevCutoff, cutoff) : null;
    return { current, prev };
  }, [period, workouts, bwWorkouts, cardio]);

  const mkDelta = (cur: number, p: number, unit?: string) =>
    p != null ? { value: cur - p, unit } : null;

  return (
    <div className="grid grid-cols-2 gap-2">
      <KpiBigCell label={`Sessions (${period})`} value={current.sessions}
        icon={<Dumbbell size={13} />} accent="green"
        delta={prev ? mkDelta(current.sessions, prev.sessions) : null} />
      <KpiBigCell label="Volume" value={current.volume.toLocaleString()} unit="KG"
        icon={<Weight size={13} />} accent="green"
        delta={prev ? mkDelta(current.volume, prev.volume, ' kg') : null} />
      <KpiBigCell label="PRs" value={current.prs}
        icon={<Trophy size={13} />} accent={current.prs > 0 ? 'gold' : 'muted'}
        delta={prev ? mkDelta(current.prs, prev.prs) : null} />
      <KpiBigCell label="Cardio" value={current.minutes} unit="MIN"
        icon={<HeartPulse size={13} />} accent="green"
        delta={prev ? mkDelta(current.minutes, prev.minutes, ' min') : null} />
    </div>
  );
}

function WeeklyVolumeBars({ period }: { period: PeriodKey }) {
  const workouts = useWorkoutStore((s) => s.workouts);

  const weeks = useMemo(() => {
    const durMs =
      period === '7D'  ?  7 * 86400000 :
      period === '1M'  ? 30 * 86400000 :
      period === '3M'  ? 90 * 86400000 :
      period === '6M'  ? 180 * 86400000 : null;

    const now    = Date.now();
    const cutoff = durMs ? now - durMs : now - 26 * 7 * 86400000;

    const byWeek: Record<string, number> = {};
    for (const w of workouts) {
      if (new Date(w.date).getTime() < cutoff) continue;
      const d   = new Date(w.date);
      const dof = d.getDay() === 0 ? 6 : d.getDay() - 1; // 0=Mon
      const mon = new Date(d);
      mon.setDate(d.getDate() - dof);
      const key = mon.toISOString().slice(0, 10);
      const vol = w.exercises.reduce((a, ex) => a + ex.sets.reduce((b, s) => b + s.reps * s.weight, 0), 0);
      byWeek[key] = (byWeek[key] ?? 0) + vol;
    }

    const entries = Object.entries(byWeek).sort(([a], [b]) => a.localeCompare(b));
    const max = Math.max(...entries.map(([, v]) => v), 1);
    return entries.map(([key, vol], i) => ({
      label: new Date(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      vol,
      pct: (vol / max) * 100,
      opacity: 0.45 + (i / Math.max(entries.length - 1, 1)) * 0.55,
    }));
  }, [period, workouts]);

  if (weeks.length === 0) return null;

  return (
    <div className="card-elevated rounded-2xl p-4">
      <div className="label-cap text-forge-muted mb-3">Weekly Volume</div>
      <div className="flex items-end gap-1.5 h-16">
        {weeks.map((w, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end">
            <div
              className="w-full rounded-t-sm"
              style={{
                height: `${Math.max(w.pct, 2)}%`,
                background: '#2ecc71',
                opacity: w.opacity,
                minHeight: 2,
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 mt-1.5">
        {weeks.map((w, i) => (
          <div key={i} className="flex-1 text-center overflow-hidden">
            <span className="text-[7px] text-forge-dim whitespace-nowrap">{w.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressiveOverload({ period }: { period: PeriodKey }) {
  const workouts = useWorkoutStore((s) => s.workouts);

  const rows = useMemo(() => {
    const durMs =
      period === '7D'  ?  7 * 86400000 :
      period === '1M'  ? 30 * 86400000 :
      period === '3M'  ? 90 * 86400000 :
      period === '6M'  ? 180 * 86400000 : null;

    if (!durMs) return [];

    const now        = Date.now();
    const cutoff     = now - durMs;
    const prevCutoff = cutoff - durMs;

    const maxWeight = (name: string, from: number, to: number) => {
      let max = 0;
      for (const w of workouts) {
        const t = new Date(w.date).getTime();
        if (t < from || t >= to) continue;
        for (const ex of w.exercises) {
          if (ex.name !== name) continue;
          for (const s of ex.sets) { if (s.weight > max) max = s.weight; }
        }
      }
      return max;
    };

    // Rank exercises in current period by volume
    const vol: Record<string, number> = {};
    for (const w of workouts) {
      if (new Date(w.date).getTime() < cutoff) continue;
      for (const ex of w.exercises) {
        const v = ex.sets.reduce((a, s) => a + s.reps * s.weight, 0);
        vol[ex.name] = (vol[ex.name] ?? 0) + v;
      }
    }

    const top5 = Object.entries(vol)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name]) => name);

    return top5.map((name) => {
      const cur   = maxWeight(name, cutoff, Infinity);
      const prev  = maxWeight(name, prevCutoff, cutoff);
      const delta = prev > 0 ? cur - prev : 0;
      return { name, cur, delta, pct: cur > 0 ? Math.min(100, (cur / Math.max(cur, prev, 1)) * 100) : 0 };
    }).filter((r) => r.cur > 0);
  }, [period, workouts]);

  if (rows.length === 0) return null;

  return (
    <div className="card-elevated rounded-2xl p-4 space-y-3">
      <div className="label-cap text-forge-muted">Progressive Overload</div>
      {rows.map((r) => {
        const isGain = r.delta > 0;
        const isLoss = r.delta < 0;
        return (
          <div key={r.name} className="flex items-center gap-3">
            <span className="text-forge-text-soft text-[11px] font-condensed font-semibold w-[72px] truncate flex-shrink-0 capitalize">
              {r.name}
            </span>
            <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${r.pct}%`,
                  background: isLoss ? '#EF4444' : '#2ecc71',
                }}
              />
            </div>
            <span
              className="text-[11px] font-mono font-semibold w-14 text-end flex-shrink-0"
              style={{ color: isGain ? '#2ecc71' : isLoss ? '#EF4444' : '#4B5563' }}
            >
              {r.delta !== 0
                ? `${r.delta > 0 ? '+' : ''}${r.delta}kg`
                : `${r.cur}kg`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PAGE
// ═════════════════════════════════════════════════════════════════════════════

export function StatsPage() {
  const { t } = useTranslation();
  const [tab, setTab]       = useState<StatsTab>('overview');
  const [period, setPeriod] = useState<PeriodKey>('1M');
  const { play } = useFX();

  return (
    <div className="p-4 space-y-4 pb-28 page-enter">
      <div className="flex items-center justify-between">
        <h2 className="text-forge-green font-display text-2xl tracking-wide">Stats</h2>
        <Badge variant="success" dot>live</Badge>
      </div>

      <TabPills
        tabs={TABS.map((t) => ({ id: t.key, label: t.label, Icon: t.Icon }))}
        value={tab}
        onChange={setTab}
        ariaLabel="Stats sub-navigation"
      />

      {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <MomentumHeadline />
          <ActivityRingsHero />
          <XPBar />
          <TopPRs />
          <StepsPanel />
          <DashboardSection title="Muscle Freshness">
            <MuscleHeatmap />
          </DashboardSection>
          <DashboardSection title="Recent Workouts">
            <WorkoutHistory />
          </DashboardSection>
        </div>
      )}

      {/* ── JOURNEY ──────────────────────────────────────────────────── */}
      {tab === 'journey' && <JourneyTab />}

      {/* ── PROGRESS ─────────────────────────────────────────────────── */}
      {tab === 'progress' && (
        <div className="space-y-4">
          <TabPills
            tabs={PERIODS.map((p) => ({ id: p, label: p }))}
            value={period}
            onChange={(p) => { play('tap'); setPeriod(p as PeriodKey); }}
            size="sm"
            ariaLabel="Progress period filter"
          />
          <PeriodSummary period={period} />
          <WeeklyVolumeBars period={period} />
          <ProgressiveOverload period={period} />
          <DashboardSection title={t('stats.sections.volumeTrend', { period })}>
            <VolumeChart days={daysForPeriod(period)} />
          </DashboardSection>
          <DashboardSection title={t('stats.sections.frequency', { period })}>
            <FreqChart days={daysForPeriod(period)} />
          </DashboardSection>
          <DashboardSection title={t('stats.sections.prBoard')}>
            <PRBoard />
          </DashboardSection>
        </div>
      )}

      {/* ── MUSCLES ──────────────────────────────────────────────────── */}
      {tab === 'muscles' && (
        <div className="space-y-4">
          <DashboardSection title="Muscle Status">
            <MuscleHeatmap />
          </DashboardSection>
          <DashboardSection title="Volume by Muscle (30d)">
            <MuscleVolumeByGroup />
          </DashboardSection>
          <DashboardSection title="Freshness by Group">
            <MuscleFreshnessList />
          </DashboardSection>
          <DashboardSection title="Muscle Balance">
            <BalanceChart />
          </DashboardSection>
        </div>
      )}

      {/* ── BODY ─────────────────────────────────────────────────────── */}
      {tab === 'body' && (
        <div className="space-y-4">
          <WeightHeroCard />
          <DashboardSection title="Weight Trend">
            <WeightChart />
          </DashboardSection>
          <DashboardSection title="InBody Analysis">
            <CompositionDonut />
          </DashboardSection>
          <DashboardSection title="Measurements">
            <MeasurementsGrid />
          </DashboardSection>
        </div>
      )}

      {/* ── CALI ─────────────────────────────────────────────────────── */}
      {tab === 'cali' && <CaliDashboard />}
    </div>
  );
}
