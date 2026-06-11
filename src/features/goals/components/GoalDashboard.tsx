import { useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, TrendingUp, TrendingDown, Minus, Compass, Rocket } from 'lucide-react';
import { ProgressRing } from '../../../components/ui/ProgressRing';
import { CountUp } from '../../../components/ui/CountUp';
import { useWorkoutStore } from '../../../stores/useWorkoutStore';
import { useBwWorkoutStore } from '../../../stores/useBwWorkoutStore';
import { useCardioStore } from '../../../stores/useCardioStore';
import { useBodyStore } from '../../../stores/useBodyStore';
import { useNutritionStore } from '../../../stores/useNutritionStore';
import { useGoalsStore, type WeightDirection } from '../../../stores/useGoalsStore';
import { calcTrainingScore } from '../../../lib/trainingScience';
import { computeJourney } from '../../../lib/journeyStats';
import { formatNumber } from '../../../lib/format';
import { useFX } from '../../../hooks/useFX';
import { GoalEditor } from './GoalEditor';

const GREEN = '#2ecc71';
const AMBER = '#F59E0B';
const RED = '#EF4444';
const MUTED = '#4B5563';
const SAPPHIRE = '#3b82f6';

type Status = 'green' | 'amber' | 'red' | 'muted';
type Trend = 'up' | 'down' | 'flat';

const STATUS_COLOR: Record<Status, string> = { green: GREEN, amber: AMBER, red: RED, muted: MUTED };

/** YYYY-MM-DD from LOCAL date components (matches useProgressInsights). */
function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function TrendArrow({ trend }: { trend: Trend | null }) {
  if (trend === null) return null;
  const Icon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const color = trend === 'up' ? GREEN : trend === 'down' ? RED : '#8a8a8a';
  return <Icon size={11} style={{ color }} aria-hidden />;
}

/** One compact KPI cell — value (CountUp), label, trend arrow + status dot. */
function KpiCell({
  label, value, decimals = 0, suffix, trend, status, sub, hint, children,
}: {
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  trend: Trend | null;
  status: Status;
  sub?: string;
  /** Plain-language one-liner under the label (jargon explainer). */
  hint?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] px-2.5 py-2 min-w-0">
      <div className="flex items-center gap-1">
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: STATUS_COLOR[status], boxShadow: `0 0 6px ${STATUS_COLOR[status]}88` }}
          aria-hidden
        />
        <span className="label-cap text-[8px] text-forge-muted flex-1 leading-tight">{label}</span>
        <TrendArrow trend={trend} />
      </div>
      {hint && <div className="text-[8px] text-forge-dim font-condensed leading-tight mt-0.5">{hint}</div>}
      <div className="flex items-baseline gap-0.5 mt-1">
        <CountUp value={value} decimals={decimals} format={(n) => formatNumber(n, { maximumFractionDigits: decimals })} className="kpi-md text-forge-text leading-none" />
        {suffix && <span className="text-[9px] font-condensed text-forge-muted">{suffix}</span>}
      </div>
      {sub && <div className="text-[9px] text-forge-dim font-mono mt-0.5 truncate">{sub}</div>}
      {children}
    </div>
  );
}

/** Is this weight delta moving the right way for the user's direction? */
function weightDeltaStatus(delta: number | null, direction: WeightDirection): Status {
  if (delta === null) return 'muted';
  if (direction === 'maintain') return Math.abs(delta) <= 0.5 ? 'green' : 'amber';
  const good = direction === 'lose' ? delta < 0 : delta > 0;
  if (delta === 0) return 'amber';
  return good ? 'green' : 'red';
}

/**
 * "Am I on Track?" dashboard — headline Training Score ring + leading
 * (behavior) and lagging (outcome) KPI rows. First section of Stats Overview.
 */
export function GoalDashboard() {
  const { t } = useTranslation();
  const { play } = useFX();
  const [editorOpen, setEditorOpen] = useState(false);

  const workouts = useWorkoutStore((s) => s.workouts);
  const bwWorkouts = useBwWorkoutStore((s) => s.bwWorkouts);
  const cardio = useCardioStore((s) => s.entries);
  const bodyWeight = useBodyStore((s) => s.bodyWeight);
  const meals = useNutritionStore((s) => s.meals);
  const macroProtein = useNutritionStore((s) => s.macroTargets.protein_g);
  const weeklySessions = useGoalsStore((s) => s.weeklySessions);
  const targetWeightKg = useGoalsStore((s) => s.targetWeightKg);
  const weightDirection = useGoalsStore((s) => s.weightDirection);
  const proteinTargetG = useGoalsStore((s) => s.proteinTargetG);

  const score = useMemo(() => calcTrainingScore(workouts), [workouts]);
  const journey = useMemo(
    () => computeJourney({ workouts, bwWorkouts, cardio }),
    [workouts, bwWorkouts, cardio],
  );

  const m = useMemo(() => {
    const now = new Date();

    // ── Sessions this week + per-day dots (Mon-anchored, local days) ────────
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    const dow = (weekStart.getDay() + 6) % 7; // 0 = Monday
    weekStart.setDate(weekStart.getDate() - dow);
    const weekStartTs = weekStart.getTime();

    let sessionsThisWeek = 0;
    const dayTrained = new Set<string>();
    const bump = (iso: string) => {
      const ts = new Date(iso).getTime();
      if (!Number.isFinite(ts) || ts < weekStartTs) return;
      sessionsThisWeek++;
      dayTrained.add(localDateKey(new Date(iso)));
    };
    for (const w of workouts) bump(w.date);
    for (const w of bwWorkouts) bump(w.date);
    for (const c of cardio) bump(c.date);

    const weekDots = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return dayTrained.has(localDateKey(d));
    });
    const daysLeftInWeek = Math.max(0, 7 - (dow + 1));

    // ── Overload % — share of the last 10 weighted sessions whose total
    //    volume beat the previous session's total volume ─────────────────────
    const totals = workouts
      .map((w) => ({
        date: w.date,
        vol: w.exercises.reduce(
          (a, ex) => a + ex.sets.reduce((b, s) => b + (s.reps || 0) * (s.weight || 0), 0),
          0,
        ),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    // Last 10 sessions, each compared to the session right before it.
    const recent = totals.slice(-11);
    let beats = 0, comparisons = 0;
    for (let i = 1; i < recent.length; i++) {
      comparisons++;
      if ((recent[i]?.vol ?? 0) > (recent[i - 1]?.vol ?? 0)) beats++;
    }
    const overloadPct = comparisons > 0 ? Math.round((beats / comparisons) * 100) : null;

    // ── Protein adherence over the last 7 days ───────────────────────────────
    const target = proteinTargetG ?? macroProtein;
    let daysWithMeals = 0;
    let adherenceSum = 0;
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

    // ── Weight + 14d delta ───────────────────────────────────────────────────
    const sortedW = [...bodyWeight].sort((a, b) => a.date.localeCompare(b.date));
    const latest = sortedW.length ? sortedW[sortedW.length - 1]! : null;
    let weightDelta14: number | null = null;
    if (latest && sortedW.length > 1) {
      const cutoff = now.getTime() - 14 * 86400000;
      // Latest entry at or before the 14-day cutoff; fall back to the oldest.
      let baseline = sortedW[0]!;
      for (const e of sortedW) {
        if (new Date(e.date).getTime() <= cutoff) baseline = e;
        else break;
      }
      if (baseline !== latest) weightDelta14 = +(latest.weight_kg - baseline.weight_kg).toFixed(1);
    }

    return { sessionsThisWeek, weekDots, daysLeftInWeek, overloadPct, proteinPct, latest, weightDelta14 };
  }, [workouts, bwWorkouts, cardio, bodyWeight, meals, macroProtein, proteinTargetG]);

  // New-user / early-days framing: never show panic-red to someone who has
  // zero workouts or under two weeks of history — encourage instead.
  const isNew = journey.totals.sessions === 0;
  const isEarly = !isNew && journey.totals.firstDate !== null &&
    Date.now() - Date.parse(journey.totals.firstDate) < 14 * 86400000;

  const tier: Status = score.score >= 70 ? 'green' : score.score >= 40 ? 'amber' : 'red';
  const softened = isEarly && tier !== 'green';
  const headlineColor = softened ? SAPPHIRE : STATUS_COLOR[tier];
  const statusWord =
    softened ? t('goals.status.earlyDays') :
    tier === 'green' ? t('goals.status.onTrack') :
    tier === 'amber' ? t('goals.status.needsAttention') :
                       t('goals.status.offTrack');

  const sessionsStatus: Status =
    isNew ? 'muted' :
    m.sessionsThisWeek >= weeklySessions ? 'green' :
    weeklySessions - m.sessionsThisWeek <= m.daysLeftInWeek ? 'amber' : 'red';
  const overloadStatus: Status =
    m.overloadPct === null ? 'muted' : m.overloadPct >= 50 ? 'green' : m.overloadPct >= 30 ? 'amber' : 'red';
  const proteinStatus: Status =
    m.proteinPct === null ? 'muted' : m.proteinPct >= 90 ? 'green' : m.proteinPct >= 60 ? 'amber' : 'red';

  const bestLift = journey.strength[0] ?? null;
  const liftStatus: Status =
    !bestLift || bestLift.deltaPct === null ? 'muted' :
    bestLift.deltaPct > 0 ? 'green' : bestLift.deltaPct === 0 ? 'amber' : 'red';
  const streakStatus: Status =
    isNew ? 'muted' :
    journey.currentStreak >= 3 ? 'green' : journey.currentStreak >= 1 ? 'amber' : 'red';

  const weightStatus = weightDeltaStatus(m.weightDelta14, weightDirection);
  const weightTrend: Trend | null =
    m.weightDelta14 === null ? null : m.weightDelta14 > 0 ? 'up' : m.weightDelta14 < 0 ? 'down' : 'flat';

  return (
    <section className="card-elevated card-luxury-border rounded-2xl p-4 space-y-3" aria-label={t('goals.title')}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-forge-green/15 border border-forge-green/25 flex items-center justify-center shrink-0">
          <Compass size={13} className="text-forge-green" />
        </div>
        <span className="label-cap-strong text-forge-text flex-1">{t('goals.title')}</span>
        <button
          type="button"
          onClick={() => { play('tap'); setEditorOpen(true); }}
          className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-forge-muted hover:text-forge-text hover:bg-white/10 cursor-pointer press-scale transition-colors"
          aria-label={t('goals.edit')}
        >
          <Pencil size={13} />
        </button>
      </div>

      {/* Headline — neutral "getting started" for brand-new users, otherwise
          the Training Score ring + status word */}
      {isNew ? (
        <div className="flex items-center gap-4">
          <div className="w-[72px] h-[72px] rounded-full bg-forge-sapphire/10 border border-forge-sapphire/25 flex items-center justify-center shrink-0">
            <Rocket size={26} className="text-forge-sapphire" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-condensed font-bold text-[17px] leading-tight text-forge-sapphire">
              {t('goals.status.gettingStarted')}
            </div>
            <div className="text-forge-muted text-[11px] font-condensed mt-0.5">
              {t('goals.status.gettingStartedCta')}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <ProgressRing
            value={score.score / 100}
            size={72}
            stroke={7}
            color={headlineColor}
            ariaLabel={t('goals.trainingScoreAria', { score: score.score })}
          >
            <div className="text-center">
              <CountUp value={score.score} className="kpi-md text-forge-text leading-none block" />
              <span className="text-[8px] text-forge-dim uppercase tracking-wider">/100</span>
            </div>
          </ProgressRing>
          <div className="flex-1 min-w-0">
            <div className="font-condensed font-bold text-[17px] leading-tight" style={{ color: headlineColor }}>
              {statusWord}
            </div>
            <div className="text-forge-muted text-[11px] font-condensed mt-0.5">{t('goals.trainingScore')}</div>
            <div className="text-forge-dim text-[10px] font-mono mt-0.5">
              {t('goals.scoreMeta', { trend: score.volumeTrend, consistency: score.consistency })}
            </div>
            <div className="text-forge-dim text-[9px] font-condensed mt-0.5 leading-tight">
              {t('goals.scoreMetaHint')}
            </div>
          </div>
        </div>
      )}

      {/* LEADING — behaviors */}
      <div className="space-y-1.5">
        <span className="label-cap text-[9px] text-forge-green/80 block">{t('goals.leading')}</span>
        <div className="grid grid-cols-3 gap-1.5">
          <KpiCell
            label={t('goals.kpi.sessions')}
            hint={t('goals.kpi.sessionsHint')}
            value={m.sessionsThisWeek}
            suffix={`/${formatNumber(weeklySessions)}`}
            trend={m.sessionsThisWeek >= weeklySessions ? 'up' : null}
            status={sessionsStatus}
          >
            <div className="flex gap-[3px] mt-1.5" aria-hidden>
              {m.weekDots.map((trained, i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: trained ? GREEN : 'rgba(255,255,255,0.08)' }}
                />
              ))}
            </div>
          </KpiCell>
          <KpiCell
            label={t('goals.kpi.overload')}
            hint={t('goals.kpi.overloadHint')}
            value={m.overloadPct ?? 0}
            suffix="%"
            trend={m.overloadPct === null ? null : m.overloadPct >= 50 ? 'up' : 'down'}
            status={overloadStatus}
            sub={m.overloadPct === null ? t('goals.kpi.noData') : t('goals.kpi.overloadSub')}
          />
          {m.proteinPct !== null && (
            <KpiCell
              label={t('goals.kpi.protein')}
              value={m.proteinPct}
              suffix="%"
              trend={m.proteinPct >= 90 ? 'up' : m.proteinPct >= 60 ? 'flat' : 'down'}
              status={proteinStatus}
              sub={t('goals.kpi.proteinSub', { grams: proteinTargetG ?? macroProtein })}
            />
          )}
        </div>
      </div>

      {/* LAGGING — outcomes */}
      <div className="space-y-1.5">
        <span className="label-cap text-[9px] text-forge-gold/80 block">{t('goals.lagging')}</span>
        <div className="grid grid-cols-3 gap-1.5">
          <KpiCell
            label={t('goals.kpi.weight')}
            value={m.latest ? m.latest.weight_kg : 0}
            decimals={1}
            suffix={t('log.kgUnit')}
            trend={weightTrend}
            status={m.latest ? weightStatus : 'muted'}
            sub={
              m.latest
                ? m.weightDelta14 !== null
                  ? t('goals.kpi.weightDelta', {
                      delta: `${m.weightDelta14 > 0 ? '+' : ''}${formatNumber(m.weightDelta14, { maximumFractionDigits: 1 })}`,
                    })
                  : targetWeightKg !== null
                    ? t('goals.kpi.weightTarget', { target: formatNumber(targetWeightKg, { maximumFractionDigits: 1 }) })
                    : t('goals.kpi.noData')
                : t('goals.kpi.noData')
            }
          />
          <KpiCell
            label={t('goals.kpi.bestLift')}
            hint={t('goals.kpi.bestLiftHint')}
            value={bestLift ? bestLift.current : 0}
            suffix={t('log.kgUnit')}
            trend={
              !bestLift || bestLift.deltaPct === null ? null :
              bestLift.deltaPct > 0 ? 'up' : bestLift.deltaPct < 0 ? 'down' : 'flat'
            }
            status={liftStatus}
            sub={bestLift ? bestLift.name : t('goals.kpi.noData')}
          />
          <KpiCell
            label={t('goals.kpi.streak')}
            value={journey.currentStreak}
            suffix={t('goals.kpi.daysUnit')}
            trend={journey.currentStreak > 0 ? 'up' : 'flat'}
            status={streakStatus}
            sub={t('goals.kpi.streakBest', { count: journey.longestStreak })}
          />
        </div>
      </div>

      <GoalEditor open={editorOpen} onClose={() => setEditorOpen(false)} />
    </section>
  );
}
