import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useNavigate } from 'react-router';
import {
  Dumbbell, Zap, Smile, Activity, Target, Moon, Droplets, Scaling,
  Sun, Lightbulb, CalendarDays, Apple, AlertTriangle, Play, ChevronRight,
  Utensils, Plus, Minus, ArrowRight, Trophy,
} from 'lucide-react';
import { useCoachState } from '../features/coach';
import { useCoachTriggers } from '../features/coach';
import { useNutritionStore } from '../stores/useNutritionStore';
import { useProfileStore } from '../stores/useProfileStore';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { useBwWorkoutStore } from '../stores/useBwWorkoutStore';
import { useSessionStore } from '../stores/useSessionStore';
import { getExercisesByMuscle } from '../lib/exercises-db';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { TabPills } from '../components/ui/TabPills';
import { BodyMap } from '../components/body/BodyMap';
import { detectPlateaus, calcTrainingScore, suggestNextWeight } from '../lib/trainingScience';
import { useFX } from '../hooks/useFX';
import type { MuscleGroup } from '../types/workout';

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = 'today' | 'insights' | 'train' | 'plan' | 'nutrition' | 'cali';

interface CheckInValues {
  energy: number;
  mood: number;
  soreness: number;
  motivation: number;
  sleep: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS: { id: TabId; labelKey: string; Icon: typeof Sun }[] = [
  { id: 'today',     labelKey: 'coachPage.tabToday',     Icon: Sun },
  { id: 'insights',  labelKey: 'coachPage.tabInsights',  Icon: Lightbulb },
  { id: 'train',     labelKey: 'coachPage.tabTrain',     Icon: Dumbbell },
  { id: 'plan',      labelKey: 'coachPage.tabPlan',      Icon: CalendarDays },
  { id: 'nutrition', labelKey: 'coachPage.tabNutrition', Icon: Apple },
  { id: 'cali',      labelKey: 'coachPage.tabCali',      Icon: Scaling },
];

const CHECKIN_FIELDS: { key: keyof CheckInValues; labelKey: string; Icon: React.ElementType }[] = [
  { key: 'energy', labelKey: 'coachPage.checkInEnergy', Icon: Zap },
  { key: 'mood', labelKey: 'coachPage.checkInMood', Icon: Smile },
  { key: 'soreness', labelKey: 'coachPage.checkInSoreness', Icon: Activity },
  { key: 'motivation', labelKey: 'coachPage.checkInMotivation', Icon: Target },
  { key: 'sleep', labelKey: 'coachPage.checkInSleep', Icon: Moon },
];

// Semantic color tiers for recovery / score / macros. Extracted to avoid
// hex-string sprinkling and to keep everything on-brand.
const RECOVERY_TIER: Record<string, { labelKey: string; text: string; bg: string; border: string; dot: string }> = {
  fresh:      { labelKey: 'coachPage.tierFresh',      text: 'text-forge-green',  bg: 'bg-forge-green/10',    border: 'border-forge-green/25',  dot: '#2ecc71' },
  recovering: { labelKey: 'coachPage.tierRecovering', text: 'text-[#8BC34A]',     bg: 'bg-[#8BC34A]/10',       border: 'border-[#8BC34A]/25',    dot: '#8BC34A' },
  ready:      { labelKey: 'coachPage.tierReady',      text: 'text-forge-warn',    bg: 'bg-forge-warn/10',      border: 'border-forge-warn/25',    dot: '#F59E0B' },
  overdue:    { labelKey: 'coachPage.tierOverdue',    text: 'text-forge-danger',  bg: 'bg-forge-danger/10',    border: 'border-forge-danger/25',  dot: '#EF4444' },
};

const SEVERITY_BADGE: Record<string, 'success' | 'warning' | 'default' | 'danger'> = {
  success: 'success',
  warning: 'warning',
  info: 'default',
  error: 'danger',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
function getDayLabel(date: Date, t: TFunction): string {
  const key = DAY_KEYS[date.getDay()];
  return key ? t('coachPage.day.' + key) : '?';
}

function getGreeting(streak: number, totalWorkouts7d: number, name: string, t: TFunction): string {
  // Punctuation-only address segment (e.g. ", Ahmed") — kept out of translation
  // text so an empty name never leaves a dangling separator.
  const first = name ? t('coachPage.greetingName', { name }) : '';
  if (streak >= 14) return t('coachPage.greetingOnFire', { count: streak, first });
  if (streak >= 7) return t('coachPage.greetingCrushing', { count: streak, first });
  if (totalWorkouts7d >= 4) return t('coachPage.greetingGreatWeek', { count: totalWorkouts7d, first });
  if (totalWorkouts7d >= 1) return t('coachPage.greetingGoodWork', { first });
  return t('coachPage.greetingReady', { first });
}

function formatFullDate(t: TFunction): string {
  return new Date().toLocaleDateString(t('coachPage.dateLocale'), {
    weekday: 'long', month: 'short', day: 'numeric',
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// TODAY TAB
// ═════════════════════════════════════════════════════════════════════════════

function TodayTab() {
  const { t } = useTranslation();
  const { totalWorkouts7d, totalWorkouts30d, streak, muscleRecovery } = useCoachState();
  const profile = useProfileStore((s) => s.profile);
  const readinessToday = useProfileStore((s) => s.readinessToday);
  const setReadinessToday = useProfileStore((s) => s.setReadinessToday);
  const session = useSessionStore();
  const navigate = useNavigate();
  const { play } = useFX();

  const [checkIn, setCheckIn] = useState<CheckInValues>({
    energy: 3, mood: 3, soreness: 3, motivation: 3, sleep: 3,
  });

  const alreadyCheckedIn = readinessToday != null;

  const handleSave = () => {
    const score = Math.round((checkIn.energy + checkIn.mood + checkIn.motivation) / 3);
    setReadinessToday({
      score,
      sleep_hours: checkIn.sleep * 1.4,
      stress: checkIn.soreness,
      notes: JSON.stringify(checkIn),   // persist per-dimension
    });
    play('success');
  };

  // Parse per-dimension values from notes blob (fallback to score)
  const storedValues = useMemo(() => {
    if (!readinessToday) return null;
    try {
      return JSON.parse(readinessToday.notes ?? '{}') as Partial<CheckInValues>;
    } catch { return null; }
  }, [readinessToday]);

  const bestMuscle = muscleRecovery
    .filter((m) => m.status === 'ready' || m.status === 'overdue')
    .sort((a, b) => b.daysSince - a.daysSince)[0];

  const handleStartWorkout = () => {
    if (bestMuscle) {
      session.start('weighted');
      session.setMuscle(bestMuscle.muscle as MuscleGroup);
    }
    play('tap');
    navigate('/log');
  };

  return (
    <div className="space-y-5">
      {/* Dynamic date hero */}
      <Card variant="luxury">
        <div className="flex items-center gap-4 p-1">
          <div
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-forge-green to-forge-green-dark flex items-center justify-center flex-shrink-0 shadow-[0_6px_20px_rgba(46,204,113,0.35)]"
          >
            <Dumbbell size={26} className="text-forge-bg-deep" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="label-cap">{formatFullDate(t)}</span>
            <p className="text-forge-text font-condensed font-semibold text-[15px] leading-snug mt-0.5">
              {getGreeting(streak, totalWorkouts7d, profile.name, t)}
            </p>
          </div>
        </div>
      </Card>

      {/* Stats row — premium KPI */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { labelKey: 'coachPage.statThisWeek',  value: totalWorkouts7d },
          { labelKey: 'coachPage.statThisMonth', value: totalWorkouts30d },
          { labelKey: 'coachPage.statDayStreak', value: streak },
        ].map(({ labelKey, value }) => (
          <div key={labelKey} className="card-elevated rounded-2xl p-3 text-center">
            <div className="kpi-lg text-forge-green leading-none">{value}</div>
            <div className="label-cap text-[9px] mt-1">{t(labelKey)}</div>
          </div>
        ))}
      </div>

      {/* Daily Check-In */}
      <div>
        <div className="label-cap mb-3">{t('coachPage.dailyCheckIn')}</div>
        {alreadyCheckedIn ? (
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-forge-green glow-dot" />
              <span className="text-forge-green text-[12px] font-condensed font-semibold uppercase tracking-wider">{t('coachPage.checkedInToday')}</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {CHECKIN_FIELDS.map(({ key, labelKey, Icon }) => {
                const val = storedValues?.[key] ?? (
                  key === 'energy' ? readinessToday?.score ?? 3 :
                  key === 'sleep' ? Math.round((readinessToday?.sleep_hours ?? 4.2) / 1.4) :
                  key === 'soreness' ? readinessToday?.stress ?? 3 :
                  readinessToday?.score ?? 3
                );
                return (
                  <div key={key} className="text-center">
                    <Icon size={12} className="text-forge-green mx-auto mb-1" />
                    <div className="kpi-md text-forge-green">{val}</div>
                    <div className="text-[9px] text-forge-muted font-condensed uppercase tracking-wider mt-0.5">{t(labelKey)}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        ) : (
          <Card>
            <div className="space-y-4">
              {CHECKIN_FIELDS.map(({ key, labelKey, Icon }) => {
                const val = checkIn[key];
                const label = t(labelKey);
                // Color changes with value — 1-2 amber, 3 green, 4-5 bright green
                const color = val <= 2 ? '#F59E0B' : val === 3 ? '#8BC34A' : '#2ecc71';
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Icon size={14} className="text-forge-muted" />
                        <span className="text-forge-text text-[13px] font-condensed">{label}</span>
                      </div>
                      <span className="kpi-md" style={{ color }}>{val}<span className="text-forge-muted text-[10px] ml-0.5">/5</span></span>
                    </div>
                    <input
                      type="range" min={1} max={5} value={val}
                      onChange={(e) => {
                        setCheckIn((prev) => ({ ...prev, [key]: Number(e.target.value) }));
                        play('tap');
                      }}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${color} ${(val - 1) * 25}%, rgba(255,255,255,0.06) ${(val - 1) * 25}%)`,
                      }}
                      aria-label={label}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-4">
              <Button onClick={handleSave} variant="primary" size="md" fullWidth>
                {t('coachPage.saveCheckIn')}
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Today's Recommendation with CTA */}
      {bestMuscle && (
        <div>
          <div className="label-cap mb-3">{t('coachPage.todaysRecommendation')}</div>
          <Card variant="luxury" className="card-gold-border">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-forge-gold/25 to-forge-gold/5 border border-forge-gold/30 flex items-center justify-center shrink-0">
                <Target size={18} className="text-forge-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-forge-text font-condensed font-semibold text-[14px]">
                  {t('coachPage.trainMuscleTodayPrefix')}<span className="text-forge-gold capitalize">{t('muscles.' + String(bestMuscle.muscle).toLowerCase())}</span>{t('coachPage.trainMuscleTodaySuffix')}
                </div>
                <div className="text-forge-muted text-[11px] font-condensed mt-0.5">
                  {bestMuscle.daysSince === 999
                    ? t('coachPage.neverTrainedLockIn')
                    : t('coachPage.lastTrainedAgo', { count: bestMuscle.daysSince })}
                </div>
              </div>
            </div>
            <Button onClick={handleStartWorkout} variant="luxury" size="md" fullWidth>
              <Play size={14} /> {t('coachPage.startWorkout')}
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// INSIGHTS TAB
// ═════════════════════════════════════════════════════════════════════════════

function InsightsTab() {
  const { t } = useTranslation();
  const triggers = useCoachTriggers();
  const { muscleRecovery } = useCoachState();
  const workouts = useWorkoutStore((s) => s.workouts);
  const plateaus = detectPlateaus(workouts);
  const score = calcTrainingScore(workouts);

  const scoreTier =
    score.score >= 80 ? { label: t('coachPage.scoreDialedIn'),      color: '#58d68d' } :
    score.score >= 60 ? { label: t('coachPage.scoreOnTrack'),        color: '#8BC34A' } :
    score.score >= 40 ? { label: t('coachPage.scoreNeedsWork'),      color: '#F59E0B' } :
                        { label: t('coachPage.scoreGettingStarted'), color: '#7a8289' };

  // Freshness map for mini-body-map
  const freshnessTints = useMemo(() => {
    const tints: Partial<Record<MuscleGroup, string>> = {};
    muscleRecovery.forEach((m) => {
      const tier = RECOVERY_TIER[m.status];
      if (tier) tints[m.muscle as MuscleGroup] = tier.dot;
    });
    return tints;
  }, [muscleRecovery]);

  return (
    <div className="space-y-5">
      {/* Training Score */}
      <div>
        <div className="label-cap mb-3">{t('coachPage.trainingScore')}</div>
        <Card variant="luxury">
          <div className="flex items-center gap-4 p-1">
            <div className="relative w-16 h-16 shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15" fill="none"
                  stroke="url(#score-grad)" strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={`${(score.score / 100) * 94.25} 94.25`}
                  style={{ transition: 'stroke-dasharray 0.6s ease-out' }}
                />
                <defs>
                  <linearGradient id="score-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#58d68d" />
                    <stop offset="100%" stopColor="#1e9e55" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="kpi-lg text-forge-green leading-none">{score.score}</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-condensed font-semibold text-[14px]" style={{ color: scoreTier.color }}>
                {scoreTier.label}
              </div>
              <div className="flex items-center gap-3 text-[11px] font-condensed mt-0.5">
                <span className="text-forge-muted">{t('coachPage.trend')} <span className="text-forge-green ml-0.5">{score.volumeTrend}</span></span>
                <span className="text-forge-muted">{t('coachPage.consistency')} <span className="text-forge-green ml-0.5">{score.consistency}</span></span>
              </div>
              <div className="text-forge-dim text-[10px] font-mono mt-1">
                {t('coachPage.sessionsLast30Days', { count: score.sessionsLast30Days })}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Body-map freshness preview */}
      <div>
        <div className="label-cap mb-3">{t('coachPage.recoveryMap')}</div>
        <Card>
          <BodyMap tints={freshnessTints} maxWidth={320} />
        </Card>
      </div>

      {/* Plateau detection */}
      {plateaus.length > 0 && (
        <div>
          <div className="label-cap mb-3 flex items-center gap-1.5">
            <AlertTriangle size={12} className="text-forge-warn" />
            {t('coachPage.plateausDetected')}
          </div>
          <div className="space-y-2">
            {plateaus.slice(0, 3).map((p) => (
              <Card key={p.exerciseName}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-forge-text text-[13px] font-condensed font-semibold truncate">{p.exerciseName}</div>
                    <div className="text-forge-muted text-[11px] font-mono mt-0.5">
                      {p.lastWeight > 0
                        ? t('coachPage.plateauDetailWeighted', { weeks: p.weeksStuck, weight: p.lastWeight, reps: p.lastReps, sessions: p.sessions })
                        : t('coachPage.plateauDetailBodyweight', { weeks: p.weeksStuck, reps: p.lastReps, sessions: p.sessions })}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-condensed text-forge-green/80">
                      <Lightbulb size={10} />
                      {t('coachPage.plateauTip')}
                    </div>
                  </div>
                  <Badge variant="warning" dot>{t('coachPage.stall')}</Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Coach Triggers */}
      <div>
        <div className="label-cap mb-3">{t('coachPage.coachAlerts')}</div>
        {triggers.length === 0 ? (
          <Card className="text-center">
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="w-10 h-10 rounded-full bg-forge-green/10 border border-forge-green/25 flex items-center justify-center">
                <Activity size={16} className="text-forge-green" />
              </div>
              <span className="text-forge-text text-[13px] font-condensed">{t('coachPage.allSystemsGreen')}</span>
              <span className="text-forge-muted text-[11px] font-condensed">{t('coachPage.trainingBalanced')}</span>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {triggers.map((trigger, i) => (
              <Card key={i}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-forge-text text-[13px] font-condensed flex-1">{trigger.message}</p>
                  <Badge variant={SEVERITY_BADGE[trigger.severity] ?? 'default'}>
                    {trigger.type}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Muscle Recovery Grid */}
      <div>
        <div className="label-cap mb-3">{t('coachPage.muscleRecovery')}</div>
        <div className="grid grid-cols-2 gap-2">
          {muscleRecovery.map((m) => {
            const tier = RECOVERY_TIER[m.status] ?? RECOVERY_TIER.overdue!;
            return (
              <div
                key={m.muscle}
                className={`card-elevated rounded-2xl p-3 border ${tier.bg} ${tier.border}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-forge-text text-[13px] font-condensed capitalize font-semibold">
                    {t('muscles.' + String(m.muscle).toLowerCase())}
                  </p>
                  <span className={`text-[10px] font-condensed font-bold uppercase tracking-wider ${tier.text}`}>
                    {t(tier.labelKey)}
                  </span>
                </div>
                <p className="text-forge-muted text-[11px] font-mono">
                  {m.daysSince === 999 ? t('coachPage.neverTrained') : t('coachPage.recoveryMeta', { days: m.daysSince, sets: m.totalSets7d })}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// TRAIN TAB — hero + prescription + Start CTA
// ═════════════════════════════════════════════════════════════════════════════

function TrainTab() {
  const { t } = useTranslation();
  const { neglectedMuscles, muscleRecovery } = useCoachState();
  const workouts = useWorkoutStore((s) => s.workouts);
  const session = useSessionStore();
  const navigate = useNavigate();
  const { play } = useFX();

  const targetMuscle = (
    neglectedMuscles[0] ??
    muscleRecovery.sort((a, b) => b.daysSince - a.daysSince)[0]?.muscle ??
    'chest'
  ) as MuscleGroup;

  const exercises = getExercisesByMuscle(targetMuscle).slice(0, 5);
  const muscleMeta = muscleRecovery.find((m) => m.muscle === targetMuscle);

  // Progressive overload hints — find user's last session for this muscle
  const lastSession = useMemo(() => {
    return workouts
      .filter((w) => w.exercises.some((e) => e.muscle.toLowerCase() === targetMuscle))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }, [workouts, targetMuscle]);

  const overloadHints = useMemo(() => {
    const hints: Record<string, { weight: number; reps: number; hint: string }> = {};
    exercises.forEach((ex) => {
      const lastForEx = lastSession?.exercises.find((e) => e.name === ex.name);
      if (!lastForEx) return;
      hints[ex.name] = suggestNextWeight(ex.name, lastForEx.sets);
    });
    return hints;
  }, [exercises, lastSession]);

  const handleStart = () => {
    session.start('weighted');
    session.setMuscle(targetMuscle);
    play('tap');
    navigate('/log');
  };

  return (
    <div className="space-y-5">
      {/* Hero */}
      <Card variant="luxury">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-forge-green/25 to-forge-green/5 border border-forge-green/20 flex items-center justify-center shrink-0">
            <Dumbbell size={18} className="text-forge-green" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="label-cap">{t('coachPage.todaysFocus')}</div>
            <div className="text-forge-text font-display text-[22px] tracking-wide capitalize mt-0.5">{t('muscles.' + String(targetMuscle).toLowerCase())}</div>
            <div className="text-forge-muted text-[11px] font-mono mt-0.5">
              {muscleMeta ? (
                muscleMeta.daysSince === 999
                  ? t('coachPage.neverTrained')
                  : t('coachPage.restMeta', { days: muscleMeta.daysSince, sets: muscleMeta.totalSets7d })
              ) : '—'}
            </div>
          </div>
          {neglectedMuscles.includes(targetMuscle) && <Badge variant="warning" dot>{t('coachPage.neglected')}</Badge>}
        </div>
        <Button onClick={handleStart} variant="primary" size="md" fullWidth>
          <Play size={14} /> {t('coachPage.startWorkout')}
        </Button>
      </Card>

      {/* Exercise prescription */}
      <div>
        <div className="label-cap mb-3 flex items-center justify-between">
          <span>{t('coachPage.suggestedExercises')}</span>
          <span className="text-[10px] font-mono text-forge-muted">{exercises.length}</span>
        </div>
        {exercises.length === 0 ? (
          <Card className="text-center">
            <p className="text-forge-muted text-[13px] font-condensed py-3">
              {t('coachPage.noExercisesFound')}
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {exercises.map((ex, i) => {
              const hint = overloadHints[ex.name];
              return (
                <Card key={ex.name}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-forge-green/10 border border-forge-green/15 flex items-center justify-center text-[10px] font-display text-forge-green shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-forge-text font-condensed font-semibold text-[13px] truncate">{ex.name}</p>
                        <p className="text-forge-muted text-[11px] font-condensed mt-0.5 leading-relaxed line-clamp-2">{ex.tip}</p>
                        {hint && (
                          <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg bg-forge-gold/10 border border-forge-gold/20 px-2 py-1">
                            <Trophy size={10} className="text-forge-gold" />
                            <span className="text-forge-gold text-[10px] font-mono font-semibold">
                              {t('coachPage.nextLift', { weight: hint.weight, reps: hint.reps })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant={ex.equipment === 'bodyweight' ? 'gold' : 'default'} className="shrink-0">
                      {ex.equipment}
                    </Badge>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PLAN TAB — weekly calendar with muscle chips
// ═════════════════════════════════════════════════════════════════════════════

function PlanTab() {
  const { t } = useTranslation();
  const workouts = useWorkoutStore((s) => s.workouts);
  const bwWorkouts = useBwWorkoutStore((s) => s.bwWorkouts);
  const navigate = useNavigate();
  const { play } = useFX();

  // Build last 7 days (Mon-Sun)
  const days = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysFromMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - daysFromMon);
    monday.setHours(0, 0, 0, 0);

    const out: {
      date: string;
      label: string;
      isToday: boolean;
      muscles: string[];
      volume: number;
    }[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const isToday = dateStr === todayKey();
      const daySessions = [...workouts, ...bwWorkouts].filter((w) => w.date.startsWith(dateStr));
      const muscles = [...new Set(daySessions.flatMap((s) => s.exercises.map((e) => e.muscle)))];
      const volume = workouts.filter((w) => w.date.startsWith(dateStr))
        .reduce((a, w) => a + w.exercises.reduce((b, ex) => b + ex.sets.reduce((c, s) => c + s.reps * s.weight, 0), 0), 0);
      out.push({ date: dateStr, label: getDayLabel(d, t), isToday, muscles, volume });
    }
    return out;
  }, [workouts, bwWorkouts, t]);

  const totalSessions = days.filter((d) => d.muscles.length > 0).length;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="card-elevated rounded-2xl p-3 text-center">
          <div className="kpi-lg text-forge-green leading-none">{totalSessions}</div>
          <div className="label-cap text-[9px] mt-1">{t('coachPage.sessions')}</div>
        </div>
        <div className="card-elevated rounded-2xl p-3 text-center">
          <div className="kpi-lg text-forge-green leading-none">{7 - totalSessions}</div>
          <div className="label-cap text-[9px] mt-1">{t('coachPage.restDays')}</div>
        </div>
        <div className="card-elevated rounded-2xl p-3 text-center">
          <div className="kpi-lg text-forge-gold leading-none">{Math.round(days.reduce((a, d) => a + d.volume, 0) / 1000)}<span className="text-forge-muted text-[10px] ml-0.5">K</span></div>
          <div className="label-cap text-[9px] mt-1">{t('coachPage.kgVolume')}</div>
        </div>
      </div>

      {/* Weekly calendar */}
      <div>
        <div className="label-cap mb-3">{t('coachPage.thisWeek')}</div>
        <div className="space-y-1.5">
          {days.map((d) => (
            <button
              key={d.date}
              type="button"
              onClick={() => { if (d.muscles.length > 0) { play('tap'); navigate('/history'); } }}
              disabled={d.muscles.length === 0}
              className={[
                'w-full card-elevated rounded-2xl p-3 flex items-center gap-3 text-left transition-all duration-200',
                d.isToday ? 'card-luxury-border' : '',
                d.muscles.length > 0 ? 'cursor-pointer press-scale hover:bg-white/[0.04]' : 'opacity-60 cursor-default',
              ].join(' ')}
            >
              <div className={[
                'w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0',
                d.isToday ? 'bg-forge-green/20 border-2 border-forge-green/60 shadow-[0_0_12px_rgba(46,204,113,0.4)]' : 'bg-white/[0.04] border border-white/[0.08]',
              ].join(' ')}>
                <span className={`text-[9px] font-condensed uppercase tracking-wider ${d.isToday ? 'text-forge-green' : 'text-forge-muted'}`}>
                  {d.label}
                </span>
                <span className={`text-[13px] font-display ${d.isToday ? 'text-forge-green' : 'text-forge-text-soft'}`}>
                  {new Date(d.date).getDate()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                {d.muscles.length === 0 ? (
                  <span className="text-forge-muted text-[12px] font-condensed">{d.isToday ? t('coachPage.noSessionToday') : t('coachPage.restDay')}</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {d.muscles.slice(0, 4).map((m) => (
                      <span
                        key={m}
                        className="text-forge-green/85 text-[10px] font-condensed uppercase tracking-wider bg-forge-green/10 px-1.5 py-0.5 rounded border border-forge-green/15 capitalize"
                      >
                        {t('muscles.' + String(m).toLowerCase())}
                      </span>
                    ))}
                  </div>
                )}
                {d.volume > 0 && (
                  <div className="text-[10px] text-forge-muted font-mono mt-1">
                    {Math.round(d.volume).toLocaleString()} {t('log.kgUnit')}
                  </div>
                )}
              </div>
              {d.muscles.length > 0 && <ChevronRight size={14} className="text-forge-dim shrink-0" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// NUTRITION TAB — with quick-add water + surplus/deficit
// ═════════════════════════════════════════════════════════════════════════════

function NutritionTab() {
  const { t } = useTranslation();
  const meals = useNutritionStore((s) => s.meals);
  const water = useNutritionStore((s) => s.water);
  const macroTargets = useNutritionStore((s) => s.macroTargets);
  const addWater = useNutritionStore((s) => s.addWater);
  const undoWater = useNutritionStore((s) => s.undoWater);
  const navigate = useNavigate();
  const { play } = useFX();

  const today = todayKey();
  const todayWater = water[today] ?? { cups_drunk: 0, goal_cups: 8 };
  const todayMeals = meals[today]?.meals ?? [];

  const totals = todayMeals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories ?? 0),
      protein: acc.protein + (m.protein ?? 0),
      carbs: acc.carbs + (m.carbs ?? 0),
      fat: acc.fat + (m.fat ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const calDeficit = macroTargets.calories - totals.calories;
  const calPct = Math.round((totals.calories / (macroTargets.calories || 1)) * 100);
  const calTier = calPct < 70 ? 'under' : calPct <= 105 ? 'onpoint' : 'over';

  const macros: {
    labelKey: string; totKey: keyof typeof totals; targetKey: 'calories' | 'protein_g' | 'carbs_g' | 'fat_g'; unit: string;
  }[] = [
    { labelKey: 'more.protein', totKey: 'protein', targetKey: 'protein_g', unit: t('more.unitGram') },
    { labelKey: 'more.carbs',   totKey: 'carbs',   targetKey: 'carbs_g',   unit: t('more.unitGram') },
    { labelKey: 'more.fat',     totKey: 'fat',     targetKey: 'fat_g',     unit: t('more.unitGram') },
  ];

  const handleWater = (n: number) => {
    for (let i = 0; i < n; i++) addWater(today);
    play('tap');
  };

  return (
    <div className="space-y-5">
      {/* Calorie balance hero */}
      <div>
        <div className="label-cap mb-3">{t('coachPage.calorieBalance')}</div>
        <Card variant="luxury" className={calTier === 'onpoint' ? 'card-gold-border' : ''}>
          <div className="flex items-baseline justify-between mb-2">
            <div>
              <div className="kpi-xl text-forge-green leading-none">
                {Math.round(totals.calories)}
              </div>
              <div className="text-forge-muted text-[11px] font-condensed mt-1">
                {t('coachPage.ofKcalTarget', { target: macroTargets.calories })}
              </div>
            </div>
            <div className="text-right">
              <div
                className="kpi-lg leading-none"
                style={{ color: calTier === 'under' ? '#F59E0B' : calTier === 'over' ? '#EF4444' : '#d4af37' }}
              >
                {calDeficit > 0 ? `-${calDeficit}` : `+${Math.abs(calDeficit)}`}
              </div>
              <div className="label-cap text-[9px] mt-1">
                {calDeficit > 0 ? t('coachPage.remaining') : t('coachPage.surplus')}
              </div>
            </div>
          </div>
          <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, calPct)}%`,
                background: calTier === 'over' ? 'linear-gradient(90deg, #F59E0B, #EF4444)'
                  : calTier === 'onpoint' ? 'linear-gradient(90deg, #f0cc55, #d4af37)'
                  : 'linear-gradient(90deg, #58d68d, #1e9e55)',
                boxShadow: calTier === 'onpoint' ? '0 0 10px rgba(212,175,55,0.45)' : '0 0 10px rgba(46,204,113,0.35)',
              }}
            />
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              onClick={() => { play('tap'); navigate('/more'); }}
              variant="primary" size="sm" fullWidth
            >
              <Utensils size={13} /> {t('coachPage.logMeal')}
            </Button>
          </div>
        </Card>
      </div>

      {/* Macros */}
      <div>
        <div className="label-cap mb-3">{t('coachPage.macros')}</div>
        <div className="grid grid-cols-3 gap-2">
          {macros.map(({ labelKey, totKey, targetKey, unit }) => {
            const val = totals[totKey];
            const target = typeof macroTargets[targetKey] === 'number' ? (macroTargets[targetKey] as number) : 1;
            const pct = Math.min(100, Math.round((val / target) * 100));
            const tier = pct < 70 ? 'under' : pct <= 105 ? 'onpoint' : 'over';
            const color = tier === 'over' ? '#EF4444' : tier === 'onpoint' ? '#d4af37' : '#2ecc71';
            return (
              <div key={labelKey} className="card-elevated rounded-2xl p-2.5">
                <div className="label-cap text-[9px]">{t(labelKey)}</div>
                <div className="kpi-lg leading-none mt-0.5" style={{ color }}>
                  {(val as number).toFixed(0)}
                </div>
                <div className="text-forge-muted text-[10px] font-mono mt-0.5">
                  / {target}{unit}
                </div>
                <div className="mt-1.5 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}66` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Water */}
      <div>
        <div className="label-cap mb-3">{t('coachPage.waterIntake')}</div>
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Droplets size={18} className="text-forge-sapphire" />
              <div>
                <div className="kpi-lg text-forge-text leading-none">
                  {todayWater.cups_drunk}<span className="text-forge-muted text-[11px] ml-1">{t('coachPage.slashCups', { count: todayWater.goal_cups })}</span>
                </div>
                <div className="label-cap text-[9px] mt-1">{t('coachPage.mlValue', { value: (todayWater.cups_drunk * 250).toLocaleString() })}</div>
              </div>
            </div>
            <Button
              onClick={() => { undoWater(today); play('tap'); }}
              variant="secondary"
              size="sm"
              disabled={todayWater.cups_drunk === 0}
              aria-label={t('coachPage.removeCup')}
            >
              <Minus size={13} />
            </Button>
          </div>
          <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (todayWater.cups_drunk / todayWater.goal_cups) * 100)}%`,
                background: 'linear-gradient(90deg, #60a5fa, #3b82f6)',
                boxShadow: '0 0 8px rgba(96,165,250,0.45)',
              }}
            />
          </div>
          {/* Quick-add pill row */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[
              { labelKey: 'coachPage.add250ml', cups: 1 },
              { labelKey: 'coachPage.add500ml', cups: 2 },
              { labelKey: 'coachPage.add750ml', cups: 3 },
            ].map((opt) => (
              <button
                key={opt.labelKey}
                onClick={() => handleWater(opt.cups)}
                className="rounded-xl py-2.5 cursor-pointer press-scale transition-all duration-200 font-condensed font-semibold uppercase tracking-wider text-[12px] bg-gradient-to-br from-forge-sapphire/20 to-forge-sapphire/5 border border-forge-sapphire/25 text-forge-sapphire hover:bg-forge-sapphire/15"
              >
                <Plus size={12} className="inline -mt-0.5 mr-0.5" />
                {t(opt.labelKey)}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Coaching tip */}
      <div>
        <div className="label-cap mb-3">{t('coachPage.coachingTip')}</div>
        <Card>
          <div className="flex items-start gap-2">
            <Lightbulb size={14} className="text-forge-gold mt-0.5 shrink-0" />
            <p className="text-forge-text text-[13px] font-condensed leading-relaxed">
              {totals.protein < macroTargets.protein_g * 0.7
                ? t('coachPage.tipProteinShort', { grams: Math.round(macroTargets.protein_g - totals.protein) })
                : calTier === 'over'
                  ? t('coachPage.tipOverCalories', { kcal: Math.round(totals.calories - macroTargets.calories) })
                  : t('coachPage.tipProteinFirst')}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// CALI TAB — no longer a dead placeholder
// ═════════════════════════════════════════════════════════════════════════════

function CaliTab() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const session = useSessionStore();
  const { play } = useFX();

  const progressions = [
    { nameKey: 'coachPage.progPushUp.name',  pathKey: 'coachPage.progPushUp.path', muscle: 'chest' },
    { nameKey: 'coachPage.progPullUp.name',  pathKey: 'coachPage.progPullUp.path', muscle: 'back' },
    { nameKey: 'coachPage.progDip.name',     pathKey: 'coachPage.progDip.path',    muscle: 'triceps' },
    { nameKey: 'coachPage.progSquat.name',   pathKey: 'coachPage.progSquat.path',  muscle: 'legs' },
    { nameKey: 'coachPage.progLSit.name',    pathKey: 'coachPage.progLSit.path',   muscle: 'core' },
  ] as const;

  const handlePick = (muscle: string) => {
    session.start('bodyweight');
    session.setMuscle(muscle as MuscleGroup);
    play('tap');
    navigate('/log');
  };

  return (
    <div className="space-y-5">
      {/* Hero */}
      <Card variant="luxury" className="card-gold-border">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-forge-gold/25 to-forge-gold/5 border border-forge-gold/30 flex items-center justify-center shrink-0">
            <Scaling size={18} className="text-forge-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-forge-text font-condensed font-semibold text-[15px]">{t('coachPage.calisthenicsProgressions')}</div>
            <div className="text-forge-muted text-[11px] font-condensed mt-0.5 leading-relaxed">
              {t('coachPage.calisthenicsSubtitle')}
            </div>
          </div>
        </div>
      </Card>

      {/* Progression list */}
      <div className="space-y-2">
        {progressions.map((p) => (
          <button
            key={p.nameKey}
            type="button"
            onClick={() => handlePick(p.muscle)}
            className="w-full card-elevated rounded-2xl p-3.5 flex items-center gap-3 cursor-pointer press-scale hover:bg-white/[0.04] transition-all duration-200 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge-green"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-forge-green/20 to-forge-green/5 border border-forge-green/15 flex items-center justify-center shrink-0">
              <Scaling size={16} className="text-forge-green" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-forge-text font-condensed font-semibold text-[13px]">{t(p.nameKey)}</span>
                <Badge variant="success" className="text-[9px] capitalize">{t('muscles.' + String(p.muscle).toLowerCase())}</Badge>
              </div>
              <div className="text-forge-muted text-[10px] font-mono mt-0.5 truncate">
                {t(p.pathKey)}
              </div>
            </div>
            <ArrowRight size={14} className="text-forge-dim shrink-0" />
          </button>
        ))}
      </div>

      <p className="text-center text-[11px] text-forge-muted font-condensed">
        {t('coachPage.progressionsFooter')}
      </p>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PAGE
// ═════════════════════════════════════════════════════════════════════════════

export function CoachPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>('today');

  // Resolve i18n labels into the shape TabPills expects ({ id, label, Icon }).
  const tabs = TABS.map(({ id, labelKey, Icon }) => ({ id, label: t(labelKey), Icon }));

  return (
    <div className="page-enter pb-28">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <h2 className="text-forge-green font-display text-2xl tracking-wide">{t('nav.coach')}</h2>
      </div>

      {/* Sub-tab pills (unified premium) */}
      <div className="px-4 pb-3">
        <TabPills
          tabs={tabs}
          value={activeTab}
          onChange={setActiveTab}
          ariaLabel={t('coachPage.subNavAria')}
        />
      </div>

      {/* Tab content */}
      <div className="px-4 pt-1">
        {activeTab === 'today' && <TodayTab />}
        {activeTab === 'insights' && <InsightsTab />}
        {activeTab === 'train' && <TrainTab />}
        {activeTab === 'plan' && <PlanTab />}
        {activeTab === 'nutrition' && <NutritionTab />}
        {activeTab === 'cali' && <CaliTab />}
      </div>
    </div>
  );
}
