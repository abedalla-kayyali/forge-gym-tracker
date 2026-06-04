import { useState, useMemo } from 'react';
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

const TABS: { id: TabId; label: string; Icon: typeof Sun }[] = [
  { id: 'today',     label: 'Today',     Icon: Sun },
  { id: 'insights',  label: 'Insights',  Icon: Lightbulb },
  { id: 'train',     label: 'Train',     Icon: Dumbbell },
  { id: 'plan',      label: 'Plan',      Icon: CalendarDays },
  { id: 'nutrition', label: 'Nutrition', Icon: Apple },
  { id: 'cali',      label: 'Cali',      Icon: Scaling },
];

const CHECKIN_FIELDS: { key: keyof CheckInValues; label: string; Icon: React.ElementType }[] = [
  { key: 'energy', label: 'Energy', Icon: Zap },
  { key: 'mood', label: 'Mood', Icon: Smile },
  { key: 'soreness', label: 'Soreness', Icon: Activity },
  { key: 'motivation', label: 'Motivation', Icon: Target },
  { key: 'sleep', label: 'Sleep', Icon: Moon },
];

// Semantic color tiers for recovery / score / macros. Extracted to avoid
// hex-string sprinkling and to keep everything on-brand.
const RECOVERY_TIER: Record<string, { label: string; text: string; bg: string; border: string; dot: string }> = {
  fresh:      { label: 'Fresh',      text: 'text-forge-green',  bg: 'bg-forge-green/10',    border: 'border-forge-green/25',  dot: '#2ecc71' },
  recovering: { label: 'Recovering', text: 'text-[#8BC34A]',     bg: 'bg-[#8BC34A]/10',       border: 'border-[#8BC34A]/25',    dot: '#8BC34A' },
  ready:      { label: 'Ready',      text: 'text-forge-warn',    bg: 'bg-forge-warn/10',      border: 'border-forge-warn/25',    dot: '#F59E0B' },
  overdue:    { label: 'Overdue',    text: 'text-forge-danger',  bg: 'bg-forge-danger/10',    border: 'border-forge-danger/25',  dot: '#EF4444' },
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

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
function getDayLabel(date: Date): string {
  return DAY_LABELS[date.getDay()] ?? '?';
}

function getGreeting(streak: number, totalWorkouts7d: number, name: string): string {
  const first = name ? `, ${name}` : '';
  if (streak >= 14) return `On fire${first}! ${streak}-day streak — unstoppable.`;
  if (streak >= 7) return `Crushing it${first}! ${streak} days strong.`;
  if (totalWorkouts7d >= 4) return `Great week${first}! ${totalWorkouts7d} sessions logged.`;
  if (totalWorkouts7d >= 1) return `Good work${first}! Keep the momentum going.`;
  return `Ready to train${first}? Let's get to work.`;
}

function formatFullDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric',
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// TODAY TAB
// ═════════════════════════════════════════════════════════════════════════════

function TodayTab() {
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
            <span className="label-cap">{formatFullDate()}</span>
            <p className="text-forge-text font-condensed font-semibold text-[15px] leading-snug mt-0.5">
              {getGreeting(streak, totalWorkouts7d, profile.name)}
            </p>
          </div>
        </div>
      </Card>

      {/* Stats row — premium KPI */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'This Week',  value: totalWorkouts7d },
          { label: 'This Month', value: totalWorkouts30d },
          { label: 'Day Streak', value: streak },
        ].map(({ label, value }) => (
          <div key={label} className="card-elevated rounded-2xl p-3 text-center">
            <div className="kpi-lg text-forge-green leading-none">{value}</div>
            <div className="label-cap text-[9px] mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Daily Check-In */}
      <div>
        <div className="label-cap mb-3">Daily Check-In</div>
        {alreadyCheckedIn ? (
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-forge-green glow-dot" />
              <span className="text-forge-green text-[12px] font-condensed font-semibold uppercase tracking-wider">Checked in today</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {CHECKIN_FIELDS.map(({ key, label, Icon }) => {
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
                    <div className="text-[9px] text-forge-muted font-condensed uppercase tracking-wider mt-0.5">{label}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        ) : (
          <Card>
            <div className="space-y-4">
              {CHECKIN_FIELDS.map(({ key, label, Icon }) => {
                const val = checkIn[key];
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
                Save Check-In
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Today's Recommendation with CTA */}
      {bestMuscle && (
        <div>
          <div className="label-cap mb-3">Today's Recommendation</div>
          <Card variant="luxury" className="card-gold-border">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-forge-gold/25 to-forge-gold/5 border border-forge-gold/30 flex items-center justify-center shrink-0">
                <Target size={18} className="text-forge-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-forge-text font-condensed font-semibold text-[14px]">
                  Train <span className="text-forge-gold capitalize">{bestMuscle.muscle}</span> today
                </div>
                <div className="text-forge-muted text-[11px] font-condensed mt-0.5">
                  {bestMuscle.daysSince === 999
                    ? 'Never trained — lock it in'
                    : `Last trained ${bestMuscle.daysSince} day${bestMuscle.daysSince !== 1 ? 's' : ''} ago`}
                </div>
              </div>
            </div>
            <Button onClick={handleStartWorkout} variant="luxury" size="md" fullWidth>
              <Play size={14} /> Start Workout
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
  const triggers = useCoachTriggers();
  const { muscleRecovery } = useCoachState();
  const workouts = useWorkoutStore((s) => s.workouts);
  const plateaus = detectPlateaus(workouts);
  const score = calcTrainingScore(workouts);

  const scoreTier =
    score.score >= 80 ? { label: 'Dialed in',      color: '#58d68d' } :
    score.score >= 60 ? { label: 'On track',        color: '#8BC34A' } :
    score.score >= 40 ? { label: 'Needs work',      color: '#F59E0B' } :
                        { label: 'Getting started', color: '#7a8289' };

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
        <div className="label-cap mb-3">Training Score</div>
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
                <span className="text-forge-muted">Trend <span className="text-forge-green ml-0.5">{score.volumeTrend}</span></span>
                <span className="text-forge-muted">Consistency <span className="text-forge-green ml-0.5">{score.consistency}</span></span>
              </div>
              <div className="text-forge-dim text-[10px] font-mono mt-1">
                {score.sessionsLast30Days} sessions last 30 days
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Body-map freshness preview */}
      <div>
        <div className="label-cap mb-3">Recovery Map</div>
        <Card>
          <BodyMap tints={freshnessTints} maxWidth={320} />
        </Card>
      </div>

      {/* Plateau detection */}
      {plateaus.length > 0 && (
        <div>
          <div className="label-cap mb-3 flex items-center gap-1.5">
            <AlertTriangle size={12} className="text-forge-warn" />
            Plateaus detected
          </div>
          <div className="space-y-2">
            {plateaus.slice(0, 3).map((p) => (
              <Card key={p.exerciseName}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-forge-text text-[13px] font-condensed font-semibold truncate">{p.exerciseName}</div>
                    <div className="text-forge-muted text-[11px] font-mono mt-0.5">
                      Stuck {p.weeksStuck}w at {p.lastWeight > 0 ? `${p.lastWeight}kg · ` : ''}{p.lastReps} reps over {p.sessions} sessions
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-condensed text-forge-green/80">
                      <Lightbulb size={10} />
                      Try: drop-sets, pause-reps, or swap variation
                    </div>
                  </div>
                  <Badge variant="warning" dot>Stall</Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Coach Triggers */}
      <div>
        <div className="label-cap mb-3">Coach Alerts</div>
        {triggers.length === 0 ? (
          <Card className="text-center">
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="w-10 h-10 rounded-full bg-forge-green/10 border border-forge-green/25 flex items-center justify-center">
                <Activity size={16} className="text-forge-green" />
              </div>
              <span className="text-forge-text text-[13px] font-condensed">All systems green</span>
              <span className="text-forge-muted text-[11px] font-condensed">Training looks balanced.</span>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {triggers.map((t, i) => (
              <Card key={i}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-forge-text text-[13px] font-condensed flex-1">{t.message}</p>
                  <Badge variant={SEVERITY_BADGE[t.severity] ?? 'default'}>
                    {t.type}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Muscle Recovery Grid */}
      <div>
        <div className="label-cap mb-3">Muscle Recovery</div>
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
                    {m.muscle}
                  </p>
                  <span className={`text-[10px] font-condensed font-bold uppercase tracking-wider ${tier.text}`}>
                    {tier.label}
                  </span>
                </div>
                <p className="text-forge-muted text-[11px] font-mono">
                  {m.daysSince === 999 ? 'Never trained' : `${m.daysSince}d ago · ${m.totalSets7d} sets / wk`}
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
            <div className="label-cap">Today's Focus</div>
            <div className="text-forge-text font-display text-[22px] tracking-wide capitalize mt-0.5">{targetMuscle}</div>
            <div className="text-forge-muted text-[11px] font-mono mt-0.5">
              {muscleMeta ? (
                muscleMeta.daysSince === 999
                  ? 'Never trained'
                  : `${muscleMeta.daysSince}d rest · ${muscleMeta.totalSets7d} sets / wk`
              ) : '—'}
            </div>
          </div>
          {neglectedMuscles.includes(targetMuscle) && <Badge variant="warning" dot>Neglected</Badge>}
        </div>
        <Button onClick={handleStart} variant="primary" size="md" fullWidth>
          <Play size={14} /> Start Workout
        </Button>
      </Card>

      {/* Exercise prescription */}
      <div>
        <div className="label-cap mb-3 flex items-center justify-between">
          <span>Suggested Exercises</span>
          <span className="text-[10px] font-mono text-forge-muted">{exercises.length}</span>
        </div>
        {exercises.length === 0 ? (
          <Card className="text-center">
            <p className="text-forge-muted text-[13px] font-condensed py-3">
              No exercises found. Try a different muscle group.
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
                              Next: {hint.weight}kg × {hint.reps}
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
      out.push({ date: dateStr, label: getDayLabel(d), isToday, muscles, volume });
    }
    return out;
  }, [workouts, bwWorkouts]);

  const totalSessions = days.filter((d) => d.muscles.length > 0).length;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="card-elevated rounded-2xl p-3 text-center">
          <div className="kpi-lg text-forge-green leading-none">{totalSessions}</div>
          <div className="label-cap text-[9px] mt-1">Sessions</div>
        </div>
        <div className="card-elevated rounded-2xl p-3 text-center">
          <div className="kpi-lg text-forge-green leading-none">{7 - totalSessions}</div>
          <div className="label-cap text-[9px] mt-1">Rest Days</div>
        </div>
        <div className="card-elevated rounded-2xl p-3 text-center">
          <div className="kpi-lg text-forge-gold leading-none">{Math.round(days.reduce((a, d) => a + d.volume, 0) / 1000)}<span className="text-forge-muted text-[10px] ml-0.5">K</span></div>
          <div className="label-cap text-[9px] mt-1">KG Volume</div>
        </div>
      </div>

      {/* Weekly calendar */}
      <div>
        <div className="label-cap mb-3">This Week</div>
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
                  <span className="text-forge-muted text-[12px] font-condensed">{d.isToday ? 'No session yet today' : 'Rest day'}</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {d.muscles.slice(0, 4).map((m) => (
                      <span
                        key={m}
                        className="text-forge-green/85 text-[10px] font-condensed uppercase tracking-wider bg-forge-green/10 px-1.5 py-0.5 rounded border border-forge-green/15 capitalize"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                )}
                {d.volume > 0 && (
                  <div className="text-[10px] text-forge-muted font-mono mt-1">
                    {Math.round(d.volume).toLocaleString()} kg
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
    label: string; totKey: keyof typeof totals; targetKey: 'calories' | 'protein_g' | 'carbs_g' | 'fat_g'; unit: string;
  }[] = [
    { label: 'Protein', totKey: 'protein', targetKey: 'protein_g', unit: 'g' },
    { label: 'Carbs',   totKey: 'carbs',   targetKey: 'carbs_g',   unit: 'g' },
    { label: 'Fat',     totKey: 'fat',     targetKey: 'fat_g',     unit: 'g' },
  ];

  const handleWater = (n: number) => {
    for (let i = 0; i < n; i++) addWater(today);
    play('tap');
  };

  return (
    <div className="space-y-5">
      {/* Calorie balance hero */}
      <div>
        <div className="label-cap mb-3">Today's Calorie Balance</div>
        <Card variant="luxury" className={calTier === 'onpoint' ? 'card-gold-border' : ''}>
          <div className="flex items-baseline justify-between mb-2">
            <div>
              <div className="kpi-xl text-forge-green leading-none">
                {Math.round(totals.calories)}
              </div>
              <div className="text-forge-muted text-[11px] font-condensed mt-1">
                of {macroTargets.calories} kcal target
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
                {calDeficit > 0 ? 'remaining' : 'surplus'}
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
              <Utensils size={13} /> Log meal
            </Button>
          </div>
        </Card>
      </div>

      {/* Macros */}
      <div>
        <div className="label-cap mb-3">Macros</div>
        <div className="grid grid-cols-3 gap-2">
          {macros.map(({ label, totKey, targetKey, unit }) => {
            const val = totals[totKey];
            const target = typeof macroTargets[targetKey] === 'number' ? (macroTargets[targetKey] as number) : 1;
            const pct = Math.min(100, Math.round((val / target) * 100));
            const tier = pct < 70 ? 'under' : pct <= 105 ? 'onpoint' : 'over';
            const color = tier === 'over' ? '#EF4444' : tier === 'onpoint' ? '#d4af37' : '#2ecc71';
            return (
              <div key={label} className="card-elevated rounded-2xl p-2.5">
                <div className="label-cap text-[9px]">{label}</div>
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
        <div className="label-cap mb-3">Water Intake</div>
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Droplets size={18} className="text-forge-sapphire" />
              <div>
                <div className="kpi-lg text-forge-text leading-none">
                  {todayWater.cups_drunk}<span className="text-forge-muted text-[11px] ml-1">/ {todayWater.goal_cups} cups</span>
                </div>
                <div className="label-cap text-[9px] mt-1">{(todayWater.cups_drunk * 250).toLocaleString()}ml</div>
              </div>
            </div>
            <Button
              onClick={() => { undoWater(today); play('tap'); }}
              variant="secondary"
              size="sm"
              disabled={todayWater.cups_drunk === 0}
              aria-label="Remove a cup"
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
              { label: '+250ml', cups: 1 },
              { label: '+500ml', cups: 2 },
              { label: '+750ml', cups: 3 },
            ].map((opt) => (
              <button
                key={opt.label}
                onClick={() => handleWater(opt.cups)}
                className="rounded-xl py-2.5 cursor-pointer press-scale transition-all duration-200 font-condensed font-semibold uppercase tracking-wider text-[12px] bg-gradient-to-br from-forge-sapphire/20 to-forge-sapphire/5 border border-forge-sapphire/25 text-forge-sapphire hover:bg-forge-sapphire/15"
              >
                <Plus size={12} className="inline -mt-0.5 mr-0.5" />
                {opt.label}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Coaching tip */}
      <div>
        <div className="label-cap mb-3">Coaching Tip</div>
        <Card>
          <div className="flex items-start gap-2">
            <Lightbulb size={14} className="text-forge-gold mt-0.5 shrink-0" />
            <p className="text-forge-text text-[13px] font-condensed leading-relaxed">
              {totals.protein < macroTargets.protein_g * 0.7
                ? `You're ${Math.round(macroTargets.protein_g - totals.protein)}g short on protein. Add lean chicken, eggs, or a whey shake.`
                : calTier === 'over'
                  ? `Over by ${Math.round(totals.calories - macroTargets.calories)} kcal. Lighter dinner tonight — keep protein high.`
                  : 'Protein first, then distribute remaining calories between carbs & fats based on today\'s training.'}
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
  const navigate = useNavigate();
  const session = useSessionStore();
  const { play } = useFX();

  const progressions = [
    { name: 'Push-up',  path: 'Incline → Regular → Diamond → Archer → One-Arm', muscle: 'chest' },
    { name: 'Pull-up',  path: 'Assisted → Negatives → Regular → Archer → Muscle-up', muscle: 'back' },
    { name: 'Dip',      path: 'Bench → Parallel → Ring → Weighted → Russian', muscle: 'triceps' },
    { name: 'Squat',    path: 'BW → Bulgarian → Pistol → Shrimp → Weighted Pistol', muscle: 'legs' },
    { name: 'L-Sit',    path: 'Tucked → One-leg → Full → V-sit → Manna', muscle: 'core' },
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
            <div className="text-forge-text font-condensed font-semibold text-[15px]">Calisthenics Progressions</div>
            <div className="text-forge-muted text-[11px] font-condensed mt-0.5 leading-relaxed">
              Master each tier before progressing. Tap a movement to start a bodyweight session.
            </div>
          </div>
        </div>
      </Card>

      {/* Progression list */}
      <div className="space-y-2">
        {progressions.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => handlePick(p.muscle)}
            className="w-full card-elevated rounded-2xl p-3.5 flex items-center gap-3 cursor-pointer press-scale hover:bg-white/[0.04] transition-all duration-200 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge-green"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-forge-green/20 to-forge-green/5 border border-forge-green/15 flex items-center justify-center shrink-0">
              <Scaling size={16} className="text-forge-green" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-forge-text font-condensed font-semibold text-[13px]">{p.name}</span>
                <Badge variant="success" className="text-[9px] capitalize">{p.muscle}</Badge>
              </div>
              <div className="text-forge-muted text-[10px] font-mono mt-0.5 truncate">
                {p.path}
              </div>
            </div>
            <ArrowRight size={14} className="text-forge-dim shrink-0" />
          </button>
        ))}
      </div>

      <p className="text-center text-[11px] text-forge-muted font-condensed">
        5 progressions · more tiers coming
      </p>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PAGE
// ═════════════════════════════════════════════════════════════════════════════

export function CoachPage() {
  const [activeTab, setActiveTab] = useState<TabId>('today');

  return (
    <div className="page-enter pb-28">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <h2 className="text-forge-green font-display text-2xl tracking-wide">Coach</h2>
      </div>

      {/* Sub-tab pills (unified premium) */}
      <div className="px-4 pb-3">
        <TabPills
          tabs={TABS}
          value={activeTab}
          onChange={setActiveTab}
          ariaLabel="Coach sub-navigation"
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
