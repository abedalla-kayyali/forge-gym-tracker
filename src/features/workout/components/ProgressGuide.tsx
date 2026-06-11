import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useProgressInsights } from '../../../hooks/useProgressInsights';
import { Target, Trophy, Zap, Flame, CheckCircle2, TrendingUp, AlertCircle, AlertTriangle } from 'lucide-react';
import { useFX } from '../../../hooks/useFX';
import { useWorkoutStore } from '../../../stores/useWorkoutStore';
import { detectPlateaus, type PlateauEntry } from '../../../lib/trainingScience';
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
  const workouts = useWorkoutStore((s) => s.workouts);
  const { play } = useFX();

  // Plateau / deload signal (#21): prefer a stuck lift that trains the
  // recommended muscle, otherwise surface the most-stuck lift overall.
  const recMuscle = insights.recommendedMuscle?.muscle ?? null;
  const plateau = useMemo<PlateauEntry | null>(() => {
    const plateaus = detectPlateaus(workouts);
    if (plateaus.length === 0) return null;

    if (recMuscle) {
      // Exercise names that target the recommended muscle.
      const namesForMuscle = new Set<string>();
      for (const w of workouts) {
        for (const ex of w.exercises) {
          if (ex.muscle?.toLowerCase() === recMuscle) {
            namesForMuscle.add(ex.name.trim().toLowerCase());
          }
        }
      }
      const matched = plateaus.find((p) => namesForMuscle.has(p.exerciseName.trim().toLowerCase()));
      if (matched) return matched;
    }
    // Fallback: most-stuck lift (detectPlateaus is sorted desc by weeksStuck).
    return plateaus[0] ?? null;
  }, [workouts, recMuscle]);

  return (
    <div className="grid grid-cols-2 gap-2">
      <WeeklyGoalRing data={insights.weekGoal} todayLogged={insights.today.anyLoggedToday} />
      <StreakSaver data={insights.streak} />
      <NextPRCard data={insights.nextPR} />
      <RecommendedMuscle
        data={insights.recommendedMuscle}
        plateau={plateau}
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
  const { t } = useTranslation();
  const copy =
    data.pace === 'hit'     ? t('progressGuide.weekGoal.hit') :
    data.pace === 'ahead'   ? t('progressGuide.weekGoal.ahead') :
    data.pace === 'ontrack' ? t('progressGuide.weekGoal.onTrack') :
                              t('progressGuide.weekGoal.remaining', { count: data.remaining });
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
            <span className="label-cap">{t('progressGuide.weekGoal.label')}</span>
          </div>
          <div className={`font-condensed font-semibold text-[13px] leading-tight ${copyColor}`}>
            {copy}
          </div>
        </div>
      </div>
      {/* Full-width meta row — too narrow next to the ring, it would clip */}
      <div className="text-forge-muted text-[10px] font-mono mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
        <span className="whitespace-nowrap">{t('progressGuide.weekGoal.daysLeft', { count: data.daysLeftInWeek })}</span>
        <span className="whitespace-nowrap">{todayLogged ? t('progressGuide.weekGoal.todayDone') : t('progressGuide.weekGoal.todayPending')}</span>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// CARD 2: Streak saver
// ═════════════════════════════════════════════════════════════════════════════

function StreakSaver({ data }: { data: ReturnType<typeof useProgressInsights>['streak'] }) {
  const { t } = useTranslation();
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
            <span className="label-cap">{t('progressGuide.streak.label')}</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="kpi-lg leading-none text-forge-text">{data.days}</span>
            <span className="text-[10px] text-forge-muted font-condensed uppercase tracking-wider">{t('progressGuide.streak.daysUnit', { count: data.days })}</span>
          </div>
          <div className={[
            'text-[10px] font-condensed mt-0.5',
            urgent ? 'text-forge-ember' : data.days > 0 ? 'text-forge-green/80' : 'text-forge-muted',
          ].join(' ')}>
            {data.days === 0
              ? t('progressGuide.streak.start')
              : urgent
                ? t('progressGuide.streak.urgent', { count: data.hoursUntilMidnight })
                : data.atRisk
                  ? t('progressGuide.streak.atRisk')
                  : t('progressGuide.streak.best', { count: data.longest })}
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
  const { t } = useTranslation();
  if (!data) {
    return (
      <div className="card-elevated rounded-2xl p-3.5 flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
          <Trophy size={18} className="text-forge-muted" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="label-cap">{t('progressGuide.nextPR.label')}</span>
          <div className="text-forge-text-soft text-[12px] font-condensed mt-0.5 leading-tight">
            {t('progressGuide.nextPR.empty')}
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
            <span className="label-cap">{t('progressGuide.nextPR.targetLabel')}</span>
          </div>
          <div className="text-forge-text text-[14px] font-condensed font-semibold truncate">
            {data.exerciseName}
          </div>
          <div className="text-forge-muted text-[11px] font-mono mt-0.5">
            {t('progressGuide.nextPR.current', { weight: data.currentWeight, reps: data.currentReps })} {t('progressGuide.nextPR.target')} <span className="text-forge-gold">{data.targetWeight}{t('log.kgUnit')}</span>
            <span className="text-forge-dim"> · +{steps}{t('log.kgUnit')}</span>
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
            {almostThere ? t('progressGuide.nextPR.almostThere') : t('progressGuide.nextPR.triedSince', { count: data.sessionsToTry })}
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
  plateau,
  onPick,
}: {
  data: ReturnType<typeof useProgressInsights>['recommendedMuscle'];
  plateau: PlateauEntry | null;
  onPick: (m: MuscleGroup) => void;
}) {
  const { t } = useTranslation();
  if (!data) {
    return (
      <div className="card-elevated rounded-2xl p-3.5 col-span-2 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
          <CheckCircle2 size={18} className="text-forge-muted" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="label-cap">{t('progressGuide.coachPick.label')}</span>
          <div className="text-forge-text-soft text-[12px] font-condensed mt-0.5">
            {t('progressGuide.coachPick.allFresh')}
          </div>
          {plateau && <PlateauChip plateau={plateau} />}
        </div>
      </div>
    );
  }

  const muscleLabel = t('muscles.' + String(data.muscle).toLowerCase());

  return (
    <button
      type="button"
      onClick={() => onPick(data.muscle)}
      className="col-span-2 card-elevated card-luxury-border rounded-2xl p-3.5 flex items-center gap-3 cursor-pointer press-scale hover:bg-white/[0.04] transition-all duration-200 text-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge-green"
      aria-label={t('progressGuide.coachPick.aria', { muscle: muscleLabel })}
    >
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-forge-green/25 to-forge-green/5 border border-forge-green/30 flex items-center justify-center shrink-0">
        <AlertCircle size={18} className="text-forge-green" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <CheckCircle2 size={11} className="text-forge-green" />
          <span className="label-cap">{t('progressGuide.coachPick.trainNext')}</span>
        </div>
        <div className="text-forge-text text-[15px] font-condensed font-semibold">
          {muscleLabel}
        </div>
        <div className="text-forge-muted text-[11px] font-condensed mt-0.5">
          {data.reason}
        </div>
        {plateau && <PlateauChip plateau={plateau} />}
      </div>
      <div className="text-forge-green text-[11px] font-condensed uppercase tracking-wider shrink-0">
        {t('progressGuide.coachPick.tap')}
      </div>
    </button>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Plateau / deload chip (#21) — subtle amber nudge to deload or switch
// ═════════════════════════════════════════════════════════════════════════════

function PlateauChip({ plateau }: { plateau: PlateauEntry }) {
  const { t } = useTranslation();
  return (
    <div
      className="mt-1.5 inline-flex items-center gap-1 max-w-full rounded-lg bg-amber-500/10 border border-amber-500/25 px-2 py-1"
      title={plateau.exerciseName}
    >
      <AlertTriangle size={10} className="text-amber-400 shrink-0" aria-hidden />
      <span className="text-amber-300/90 text-[10px] font-condensed leading-tight truncate">
        {t('progressGuide.plateau.chip', { weeks: plateau.weeksStuck, count: plateau.weeksStuck })}
      </span>
    </div>
  );
}
