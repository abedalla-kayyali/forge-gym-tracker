import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarCheck, Trophy, Wrench, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useWorkoutStore } from '../../../stores/useWorkoutStore';
import { useBwWorkoutStore } from '../../../stores/useBwWorkoutStore';
import { useCardioStore } from '../../../stores/useCardioStore';
import { useNutritionStore } from '../../../stores/useNutritionStore';
import { useGoalsStore } from '../../../stores/useGoalsStore';
import { formatNumber } from '../../../lib/format';

const GREEN = '#2ecc71';
const RED = '#EF4444';

function startOfWeekTs(now: Date): number {
  const x = new Date(now);
  x.setHours(0, 0, 0, 0);
  const dow = (x.getDay() + 6) % 7; // 0 = Monday
  x.setDate(x.getDate() - dow);
  return x.getTime();
}

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function DeltaPill({ delta }: { delta: number }) {
  const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const color = delta > 0 ? GREEN : delta < 0 ? RED : '#8a8a8a';
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[9px] font-mono font-semibold px-1 py-0.5 rounded-full"
      style={{ color, background: `${color === '#8a8a8a' ? 'rgba(138,138,138,0.1)' : `${color}1f`}` }}
    >
      <Icon size={10} aria-hidden />
      {delta !== 0 ? `${delta > 0 ? '+' : ''}${formatNumber(delta)}` : '—'}
    </span>
  );
}

/**
 * Weekly Review — this week vs last week (sessions, volume, PRs), one WIN
 * line, one FIX line, and a 4-week projection. Second section of Stats
 * Overview.
 */
export function WeeklyReview() {
  const { t } = useTranslation();
  const workouts = useWorkoutStore((s) => s.workouts);
  const bwWorkouts = useBwWorkoutStore((s) => s.bwWorkouts);
  const cardio = useCardioStore((s) => s.entries);
  const meals = useNutritionStore((s) => s.meals);
  const macroProtein = useNutritionStore((s) => s.macroTargets.protein_g);
  const weeklySessions = useGoalsStore((s) => s.weeklySessions);
  const proteinTargetG = useGoalsStore((s) => s.proteinTargetG);

  const r = useMemo(() => {
    const now = new Date();
    const thisStart = startOfWeekTs(now);
    const lastStart = thisStart - 7 * 86400000;

    const calc = (from: number, to: number) => {
      let sessions = 0, volume = 0, prs = 0;
      const inRange = (iso: string) => {
        const ts = new Date(iso).getTime();
        return Number.isFinite(ts) && ts >= from && ts < to;
      };
      for (const w of workouts) {
        if (!inRange(w.date)) continue;
        sessions++;
        for (const ex of w.exercises) {
          for (const s of ex.sets) {
            volume += (s.reps || 0) * (s.weight || 0);
            if (s.isPR) prs++;
          }
        }
      }
      for (const w of bwWorkouts) {
        if (!inRange(w.date)) continue;
        sessions++;
        // Bodyweight volume counts only the added external load.
        for (const ex of w.exercises) {
          for (const s of ex.sets) volume += (s.reps || 0) * (s.addedWeight || 0);
        }
      }
      for (const c of cardio) {
        if (inRange(c.date)) sessions++;
      }
      return { sessions, volume: Math.round(volume), prs };
    };

    const cur = calc(thisStart, Infinity);
    const prev = calc(lastStart, thisStart);

    // ── WIN — biggest positive delta this week ───────────────────────────────
    const sessionsDelta = cur.sessions - prev.sessions;
    const volumeDelta = cur.volume - prev.volume;
    const volumePct = prev.volume > 0 ? Math.round((volumeDelta / prev.volume) * 100) : null;
    const prsDelta = cur.prs - prev.prs;

    let win: string;
    if (cur.prs > 0 && prsDelta >= 0) {
      win = t('goals.review.winPRs', { count: cur.prs });
    } else if (volumePct !== null && volumePct > 0 && volumePct >= Math.abs(sessionsDelta) * 10) {
      win = t('goals.review.winVolume', { pct: volumePct });
    } else if (sessionsDelta > 0) {
      win = t('goals.review.winSessions', { count: sessionsDelta });
    } else if (cur.sessions > 0) {
      win = t('goals.review.winShowedUp', { count: cur.sessions });
    } else {
      win = t('goals.review.winFreshStart');
    }

    // ── FIX — weakest leading KPI ────────────────────────────────────────────
    // Protein adherence (7d) for the fix heuristic.
    const target = proteinTargetG ?? macroProtein;
    let daysWithMeals = 0, adherenceSum = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const day = meals[localDateKey(d)];
      if (!day || day.meals.length === 0) continue;
      daysWithMeals++;
      const protein = day.meals.reduce((a, meal) => a + (meal.protein || 0), 0);
      adherenceSum += target > 0 ? Math.min(1, protein / target) : 0;
    }
    const proteinPct = daysWithMeals > 0 ? Math.round((adherenceSum / daysWithMeals) * 100) : null;

    let fix: string;
    if (cur.sessions < weeklySessions) {
      fix = t('goals.review.fixSessions', { count: weeklySessions - cur.sessions });
    } else if (volumeDelta < 0) {
      fix = t('goals.review.fixOverload');
    } else if (proteinPct !== null && proteinPct < 80) {
      fix = t('goals.review.fixProtein', { pct: proteinPct });
    } else {
      fix = t('goals.review.fixNone');
    }

    // ── 4-week projection: sessions in the last 28 days → per-month rate ────
    const cutoff28 = now.getTime() - 28 * 86400000;
    const count28 =
      workouts.filter((w) => new Date(w.date).getTime() >= cutoff28).length +
      bwWorkouts.filter((w) => new Date(w.date).getTime() >= cutoff28).length +
      cardio.filter((c) => new Date(c.date).getTime() >= cutoff28).length;
    const perMonth = Math.round((count28 / 28) * 30);

    return { cur, prev, sessionsDelta, volumeDelta, prsDelta, win, fix, perMonth };
  }, [workouts, bwWorkouts, cardio, meals, macroProtein, proteinTargetG, weeklySessions, t]);

  const fmtVol = (v: number) =>
    v >= 1000 ? `${formatNumber(v / 1000, { maximumFractionDigits: 1 })}k` : formatNumber(v);

  return (
    <section className="card-elevated card-luxury-border rounded-2xl p-4 space-y-3" aria-label={t('goals.review.title')}>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-forge-green/15 border border-forge-green/25 flex items-center justify-center shrink-0">
          <CalendarCheck size={13} className="text-forge-green" />
        </div>
        <span className="label-cap-strong text-forge-text flex-1">{t('goals.review.title')}</span>
        <span className="text-[10px] font-mono text-forge-muted">{t('goals.review.thisVsLast')}</span>
      </div>

      {/* This week vs last week */}
      <div className="grid grid-cols-3 gap-1.5">
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] px-2.5 py-2">
          <div className="flex items-center justify-between gap-1">
            <span className="label-cap text-[8px] text-forge-muted">{t('goals.review.sessions')}</span>
            <DeltaPill delta={r.sessionsDelta} />
          </div>
          <div className="kpi-md text-forge-green leading-none mt-1">{formatNumber(r.cur.sessions)}</div>
          <div className="text-[9px] text-forge-dim font-mono mt-0.5">
            {t('goals.review.lastWeekValue', { value: formatNumber(r.prev.sessions) })}
          </div>
        </div>
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] px-2.5 py-2">
          <div className="flex items-center justify-between gap-1">
            <span className="label-cap text-[8px] text-forge-muted">{t('goals.review.volume')}</span>
            <DeltaPill delta={r.volumeDelta} />
          </div>
          <div className="kpi-md text-forge-green leading-none mt-1">
            {fmtVol(r.cur.volume)}
            <span className="text-[9px] text-forge-muted ms-0.5">{t('log.kgUnit')}</span>
          </div>
          <div className="text-[9px] text-forge-dim font-mono mt-0.5">
            {t('goals.review.lastWeekValue', { value: fmtVol(r.prev.volume) })}
          </div>
        </div>
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] px-2.5 py-2">
          <div className="flex items-center justify-between gap-1">
            <span className="label-cap text-[8px] text-forge-muted">{t('goals.review.prs')}</span>
            <DeltaPill delta={r.prsDelta} />
          </div>
          <div className="kpi-md text-forge-gold leading-none mt-1">{formatNumber(r.cur.prs)}</div>
          <div className="text-[9px] text-forge-dim font-mono mt-0.5">
            {t('goals.review.lastWeekValue', { value: formatNumber(r.prev.prs) })}
          </div>
        </div>
      </div>

      {/* WIN + FIX */}
      <div className="space-y-1.5">
        <div className="flex items-start gap-2 rounded-xl bg-forge-green/[0.06] border border-forge-green/15 px-3 py-2">
          <Trophy size={12} className="text-forge-green shrink-0 mt-0.5" aria-hidden />
          <p className="text-forge-text-soft text-[12px] font-condensed leading-snug">
            <span className="text-forge-green font-semibold uppercase tracking-wider me-1.5">{t('goals.review.win')}</span>
            {r.win}
          </p>
        </div>
        <div className="flex items-start gap-2 rounded-xl bg-amber-500/[0.06] border border-amber-500/15 px-3 py-2">
          <Wrench size={12} className="text-amber-400 shrink-0 mt-0.5" aria-hidden />
          <p className="text-forge-text-soft text-[12px] font-condensed leading-snug">
            <span className="text-amber-400 font-semibold uppercase tracking-wider me-1.5">{t('goals.review.fix')}</span>
            {r.fix}
          </p>
        </div>
      </div>

      {/* 4-week projection */}
      <div className="text-[10px] font-mono text-forge-muted text-center">
        {t('goals.review.projection', { count: r.perMonth })}
      </div>
    </section>
  );
}
