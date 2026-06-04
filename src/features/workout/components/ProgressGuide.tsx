import { useProgressInsights } from '../../../hooks/useProgressInsights';
import { Target, Trophy, Zap, Flame, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';
import { MUSCLE_LABELS } from '../../../components/body/BodyMap';
import { useFX } from '../../../hooks/useFX';
import type { MuscleGroup } from '../../../types/workout';

interface Props {
  /** Triggered when user taps a "quick start" CTA — pre-selects this muscle. */
  onPickMuscle?: (m: MuscleGroup) => void;
  /** Weekly session target (user-configurable later; default 4). */
  weeklyGoal?: number;
}

/**
 * Premium 4-card KPI guide shown on the Log idle screen and Stats overview.
 * Surfaces:
 *   1. Weekly goal progress ring — sessions this week vs target
 *   2. Next PR target — closest-to-beat lift with progress bar
 *   3. Recommended muscle — smart "train this next" pick
 *   4. Streak saver — flame pulse + urgency copy when streak at risk
 *
 * Motivational copy escalates with state. Haptic feedback on CTA taps.
 */
export function ProgressGuide({ onPickMuscle, weeklyGoal = 4 }: Props) {
  const insights = useProgressInsights(weeklyGoal);
  const { play } = useFX();

  return (
    <div className="grid grid-cols-2 gap-2">
      <WeeklyGoalRing data={insights.weekGoal} todayLogged={insights.today.anyLoggedToday} />
      <StreakSaver data={insights.streak} />
      <NextPRCard data={insights.nextPR} />
      <RecommendedMuscle
        data={insights.recommendedMuscle}
        onPick={(m) => { play('tap'); onPickMuscle?.(m); }}
      />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// CARD 1: Weekly goal ring
// ═════════════════════════════════════════════════════════════════════════════

function WeeklyGoalRing({
  data,
  todayLogged,
}: {
  data: ReturnType<typeof useProgressInsights>['weekGoal'];
  todayLogged: boolean;
}) {
  const copy =
    data.pace === 'hit'     ? 'Goal hit — legendary' :
    data.pace === 'ahead'   ? "You're ahead of pace" :
    data.pace === 'ontrack' ? 'On track' :
                              `${data.remaining} to go`;
  const copyColor =
    data.pace === 'hit'     ? 'text-forge-gold' :
    data.pace === 'ahead'   ? 'text-forge-green' :
    data.pace === 'ontrack' ? 'text-forge-green' :
                              'text-forge-ember';

  return (
    <div className="card-elevated card-luxury-border rounded-2xl p-3.5 relative overflow-hidden">
      <div className="flex items-start gap-3">
        <div className="relative w-14 h-14 shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15" fill="none"
              stroke="url(#wk-grad)" strokeWidth="3" strokeLinecap="round"
              strokeDasharray={`${(data.percentage / 100) * 94.25} 94.25`}
              style={{ transition: 'stroke-dasharray 0.6s ease-out' }}
            />
            <defs>
              <linearGradient id="wk-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#58d68d" />
                <stop offset="100%" stopColor="#1e9e55" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-forge-green font-display text-[18px] leading-none">
              {data.current}<span className="text-forge-muted text-[10px] font-mono">/{data.target}</span>
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Target size={11} className="text-forge-green" />
            <span className="label-cap">Week Goal</span>
          </div>
          <div className={`font-condensed font-semibold text-[13px] truncate ${copyColor}`}>
            {copy}
          </div>
          <div className="text-forge-muted text-[10px] font-mono mt-0.5">
            {data.daysLeftInWeek}d left · {todayLogged ? '✓ today' : '· today pending'}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// CARD 2: Streak saver
// ═════════════════════════════════════════════════════════════════════════════

function StreakSaver({ data }: { data: ReturnType<typeof useProgressInsights>['streak'] }) {
  const hot = data.days > 0 && !data.atRisk;
  const urgent = data.days > 0 && data.atRisk && data.hoursUntilMidnight <= 12;

  return (
    <div
      className={[
        'card-elevated rounded-2xl p-3.5 relative overflow-hidden',
        urgent ? 'card-luxury-border card-gold-border' : data.days > 0 ? 'card-luxury-border' : '',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <div
          className={[
            'w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 relative',
            hot
              ? 'bg-gradient-to-br from-forge-ember/30 to-forge-ember/5 border border-forge-ember/40'
              : data.days > 0
                ? 'bg-gradient-to-br from-forge-gold/25 to-forge-gold/5 border border-forge-gold/30'
                : 'bg-white/[0.04] border border-white/[0.06]',
          ].join(' ')}
        >
          <Flame
            size={22}
            strokeWidth={data.days > 0 ? 2.4 : 1.6}
            className={[
              hot ? 'text-forge-ember drop-shadow-[0_0_10px_rgba(255,122,69,0.7)]'
                   : data.days > 0 ? 'text-forge-gold drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]'
                   : 'text-forge-muted',
              urgent ? 'animate-pulse' : '',
            ].join(' ')}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Zap size={11} className={data.days > 0 ? 'text-forge-ember' : 'text-forge-muted'} />
            <span className="label-cap">Streak</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="kpi-lg leading-none text-forge-text">{data.days}</span>
            <span className="text-[10px] text-forge-muted font-condensed uppercase tracking-wider">days</span>
          </div>
          <div className={[
            'text-[10px] font-condensed mt-0.5',
            urgent ? 'text-forge-ember' : data.days > 0 ? 'text-forge-green/80' : 'text-forge-muted',
          ].join(' ')}>
            {data.days === 0
              ? 'Start your streak today'
              : urgent
                ? `⚠ Log in ${data.hoursUntilMidnight}h to save it`
                : data.atRisk
                  ? "Don't break it — log today"
                  : `Best: ${data.longest}d`}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// CARD 3: Next PR target
// ═════════════════════════════════════════════════════════════════════════════

function NextPRCard({ data }: { data: ReturnType<typeof useProgressInsights>['nextPR'] }) {
  if (!data) {
    return (
      <div className="card-elevated rounded-2xl p-3.5 flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
          <Trophy size={18} className="text-forge-muted" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="label-cap">Next PR</span>
          <div className="text-forge-text-soft text-[12px] font-condensed mt-0.5 leading-tight">
            Log a weighted lift to unlock PR targets
          </div>
        </div>
      </div>
    );
  }

  const steps = Math.max(1, (data.targetWeight - data.currentWeight));
  const almostThere = data.progressPct >= 95;
  return (
    <div className="card-elevated card-luxury-border card-gold-border rounded-2xl p-3.5 relative overflow-hidden col-span-2">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-forge-gold/25 to-forge-gold/5 border border-forge-gold/30 flex items-center justify-center shrink-0">
          <Trophy size={18} className="text-forge-gold" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <TrendingUp size={11} className="text-forge-gold" />
            <span className="label-cap">Next PR Target</span>
          </div>
          <div className="text-forge-text text-[14px] font-condensed font-semibold truncate">
            {data.exerciseName}
          </div>
          <div className="text-forge-muted text-[11px] font-mono mt-0.5">
            Current {data.currentWeight}kg × {data.currentReps}r → Target <span className="text-forge-gold">{data.targetWeight}kg</span>
            <span className="text-forge-dim"> · +{steps}kg</span>
          </div>
          <div className="mt-2 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${data.progressPct}%`,
                background: 'linear-gradient(90deg, #f0cc55, #d4af37)',
                boxShadow: '0 0 10px rgba(212,175,55,0.45)',
              }}
            />
          </div>
          <div className="text-[10px] text-forge-gold font-condensed mt-1 uppercase tracking-wider">
            {almostThere ? '🔥 attempt it next session' : `Tried ${data.sessionsToTry}× since last PR`}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// CARD 4: Recommended muscle (smart pick)
// ═════════════════════════════════════════════════════════════════════════════

function RecommendedMuscle({
  data,
  onPick,
}: {
  data: ReturnType<typeof useProgressInsights>['recommendedMuscle'];
  onPick: (m: MuscleGroup) => void;
}) {
  if (!data) {
    return (
      <div className="card-elevated rounded-2xl p-3.5 col-span-2 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
          <CheckCircle2 size={18} className="text-forge-muted" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="label-cap">Coach Pick</span>
          <div className="text-forge-text-soft text-[12px] font-condensed mt-0.5">
            All muscles fresh — train anything
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onPick(data.muscle)}
      className="col-span-2 card-elevated card-luxury-border rounded-2xl p-3.5 flex items-center gap-3 cursor-pointer press-scale hover:bg-white/[0.04] transition-all duration-200 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge-green"
      aria-label={`Recommended: train ${MUSCLE_LABELS[data.muscle]}`}
    >
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-forge-green/25 to-forge-green/5 border border-forge-green/30 flex items-center justify-center shrink-0">
        <AlertCircle size={18} className="text-forge-green" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <CheckCircle2 size={11} className="text-forge-green" />
          <span className="label-cap">Train next</span>
        </div>
        <div className="text-forge-text text-[15px] font-condensed font-semibold">
          {MUSCLE_LABELS[data.muscle]}
        </div>
        <div className="text-forge-muted text-[11px] font-condensed mt-0.5">
          {data.reason}
        </div>
      </div>
      <div className="text-forge-green text-[11px] font-condensed uppercase tracking-wider shrink-0">
        Tap →
      </div>
    </button>
  );
}
