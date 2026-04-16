import { useState } from 'react';
import {
  Dumbbell,
  Zap,
  Smile,
  Activity,
  Target,
  Moon,
  Droplets,
  Scaling,
} from 'lucide-react';
import { useCoachState } from '../features/coach';
import { useCoachTriggers } from '../features/coach';
import { useNutritionStore } from '../stores/useNutritionStore';
import { useProfileStore } from '../stores/useProfileStore';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { getExercisesByMuscle } from '../lib/exercises-db';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

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

const TABS: { id: TabId; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'insights', label: 'Insights' },
  { id: 'train', label: 'Train' },
  { id: 'plan', label: 'Plan' },
  { id: 'nutrition', label: 'Nutrition' },
  { id: 'cali', label: 'Cali' },
];

const CHECKIN_FIELDS: { key: keyof CheckInValues; label: string; Icon: React.ElementType }[] = [
  { key: 'energy', label: 'Energy', Icon: Zap },
  { key: 'mood', label: 'Mood', Icon: Smile },
  { key: 'soreness', label: 'Soreness', Icon: Activity },
  { key: 'motivation', label: 'Motivation', Icon: Target },
  { key: 'sleep', label: 'Sleep', Icon: Moon },
];

const STATUS_COLORS: Record<string, string> = {
  fresh: 'text-blue-400',
  recovering: 'text-yellow-400',
  ready: 'text-forge-green',
  overdue: 'text-red-400',
};

const STATUS_BG: Record<string, string> = {
  fresh: 'bg-blue-500/10 border-blue-500/20',
  recovering: 'bg-yellow-500/10 border-yellow-500/20',
  ready: 'bg-forge-green/10 border-forge-green/20',
  overdue: 'bg-red-500/10 border-red-500/20',
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
  if (streak >= 14) return `On fire${first}! ${streak}-day streak — unstoppable!`;
  if (streak >= 7) return `Crushing it${first}! ${streak} days strong.`;
  if (totalWorkouts7d >= 4) return `Great week${first}! ${totalWorkouts7d} sessions logged.`;
  if (totalWorkouts7d >= 1) return `Good work${first}! Keep the momentum going.`;
  return `Ready to train${first}? Let's get to work.`;
}

// ─── Sub-tabs ─────────────────────────────────────────────────────────────────

function TodayTab() {
  const { totalWorkouts7d, totalWorkouts30d, streak, muscleRecovery } = useCoachState();
  const profile = useProfileStore((s) => s.profile);
  const readinessToday = useProfileStore((s) => s.readinessToday);
  const setReadinessToday = useProfileStore((s) => s.setReadinessToday);

  const [checkIn, setCheckIn] = useState<CheckInValues>({
    energy: 3,
    mood: 3,
    soreness: 3,
    motivation: 3,
    sleep: 3,
  });

  // Derive today's check-in from stored readiness
  const alreadyCheckedIn = readinessToday != null;

  const handleSave = () => {
    const score = Math.round((checkIn.energy + checkIn.mood + checkIn.motivation) / 3);
    setReadinessToday({
      score,
      sleep_hours: checkIn.sleep * 1.4, // scale 1-5 → ~1.4–7h
      stress: checkIn.soreness,
      notes: new Date().toISOString(),
    });
  };

  // Best muscle to train today (ready or overdue, longest rest)
  const bestMuscle = muscleRecovery
    .filter((m) => m.status === 'ready' || m.status === 'overdue')
    .sort((a, b) => b.daysSince - a.daysSince)[0];

  return (
    <div className="space-y-5">
      {/* Mascot greeting */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)', boxShadow: '0 0 20px rgba(0,255,136,0.35)' }}>
            <Dumbbell className="w-7 h-7 text-black" />
          </div>
          <div>
            <p className="text-forge-dim text-xs font-condensed uppercase tracking-wider mb-0.5">Today</p>
            <p className="text-forge-text font-display text-base leading-snug">
              {getGreeting(streak, totalWorkouts7d, profile.name)}
            </p>
          </div>
        </div>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'This Week', value: totalWorkouts7d },
          { label: 'This Month', value: totalWorkouts30d },
          { label: 'Day Streak', value: streak },
        ].map(({ label, value }) => (
          <Card key={label} className="text-center py-3">
            <p className="text-forge-green text-2xl font-display"
              style={{ textShadow: '0 0 12px rgba(0,255,136,0.5)' }}>
              {value}
            </p>
            <p className="text-forge-dim text-xs font-condensed uppercase tracking-wider mt-1">
              {label}
            </p>
          </Card>
        ))}
      </div>

      {/* Daily Check-In */}
      <div>
        <p className="text-forge-dim text-xs font-condensed uppercase tracking-wider mb-3">
          Daily Check-In
        </p>
        {alreadyCheckedIn ? (
          <Card>
            <p className="text-forge-green text-sm font-condensed font-semibold mb-3">
              Checked in today
            </p>
            <div className="grid grid-cols-3 gap-2">
              {CHECKIN_FIELDS.map(({ key, label, Icon }) => {
                // Map stored values back to display
                let val = 3;
                if (key === 'energy') val = readinessToday?.score ?? 3;
                else if (key === 'sleep') val = Math.round((readinessToday?.sleep_hours ?? 4.2) / 1.4);
                else if (key === 'soreness') val = readinessToday?.stress ?? 3;
                else val = readinessToday?.score ?? 3;
                return (
                  <div key={key} className="text-center">
                    <Icon className="w-4 h-4 text-forge-dim mx-auto mb-1" />
                    <p className="text-forge-green text-lg font-display">{val}</p>
                    <p className="text-forge-dim text-xs font-condensed">{label}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        ) : (
          <Card>
            <div className="space-y-4">
              {CHECKIN_FIELDS.map(({ key, label, Icon }) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-forge-dim" />
                      <span className="text-forge-text text-sm font-condensed">{label}</span>
                    </div>
                    <span className="text-forge-green text-sm font-display"
                      style={{ textShadow: '0 0 8px rgba(0,255,136,0.4)' }}>
                      {checkIn[key]}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={checkIn[key]}
                    onChange={(e) =>
                      setCheckIn((prev) => ({ ...prev, [key]: Number(e.target.value) }))
                    }
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: '#00ff88' }}
                  />
                  <div className="flex justify-between text-forge-dim text-xs font-condensed mt-0.5">
                    <span>1</span><span>5</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={handleSave}
              className="mt-4 w-full min-h-[44px] rounded-xl font-condensed font-semibold text-sm text-black press-scale cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)', boxShadow: '0 0 16px rgba(0,255,136,0.3)' }}>
              Save Check-In
            </button>
          </Card>
        )}
      </div>

      {/* Today's Recommendation */}
      {bestMuscle && (
        <div>
          <p className="text-forge-dim text-xs font-condensed uppercase tracking-wider mb-3">
            Today's Recommendation
          </p>
          <Card>
            <p className="text-forge-text font-condensed text-sm">
              Train{' '}
              <span className="text-forge-green font-semibold capitalize">{bestMuscle.muscle}</span>
              {' '}today —{' '}
              {bestMuscle.daysSince === 999
                ? 'never trained'
                : `last trained ${bestMuscle.daysSince} day${bestMuscle.daysSince !== 1 ? 's' : ''} ago`}
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}

function InsightsTab() {
  const triggers = useCoachTriggers();
  const { muscleRecovery } = useCoachState();

  return (
    <div className="space-y-5">
      {/* Coach Triggers */}
      <div>
        <p className="text-forge-dim text-xs font-condensed uppercase tracking-wider mb-3">
          Coach Alerts
        </p>
        {triggers.length === 0 ? (
          <Card>
            <p className="text-forge-dim text-sm font-condensed text-center py-2">
              No alerts — training looks balanced.
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {triggers.map((t, i) => (
              <Card key={i}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-forge-text text-sm font-condensed flex-1">{t.message}</p>
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
        <p className="text-forge-dim text-xs font-condensed uppercase tracking-wider mb-3">
          Muscle Recovery
        </p>
        <div className="grid grid-cols-2 gap-2">
          {muscleRecovery.map((m) => (
            <div
              key={m.muscle}
              className={`card-elevated rounded-2xl p-3 border ${STATUS_BG[m.status]}`}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-forge-text text-sm font-condensed capitalize font-semibold">
                  {m.muscle}
                </p>
                <span className={`text-xs font-condensed font-bold uppercase ${STATUS_COLORS[m.status]}`}>
                  {m.status}
                </span>
              </div>
              <p className="text-forge-dim text-xs font-condensed">
                {m.daysSince === 999 ? 'Never trained' : `${m.daysSince}d ago`}
              </p>
              <p className="text-forge-dim text-xs font-condensed">
                {m.totalSets7d} sets this week
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TrainTab() {
  const { neglectedMuscles, muscleRecovery } = useCoachState();

  // Pick the most overdue muscle
  const targetMuscle =
    neglectedMuscles[0] ??
    muscleRecovery.sort((a, b) => b.daysSince - a.daysSince)[0]?.muscle ??
    'chest';

  const exercises = getExercisesByMuscle(targetMuscle).slice(0, 4);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-forge-dim text-xs font-condensed uppercase tracking-wider mb-3">
          Suggested Workout
        </p>
        <Card className="mb-3">
          <p className="text-forge-text text-sm font-condensed">
            Focus:{' '}
            <span className="text-forge-green font-semibold capitalize">{targetMuscle}</span>
            {neglectedMuscles.length > 0 && (
              <span className="text-forge-dim"> — neglected muscle group</span>
            )}
          </p>
        </Card>
        {exercises.length === 0 ? (
          <Card>
            <p className="text-forge-dim text-sm font-condensed text-center py-2">
              No exercises found for this muscle group.
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {exercises.map((ex) => (
              <Card key={ex.name}>
                <div className="flex items-start justify-between gap-3 mb-1">
                  <p className="text-forge-text font-condensed font-semibold text-sm">{ex.name}</p>
                  <Badge>{ex.equipment}</Badge>
                </div>
                <p className="text-forge-dim text-xs font-condensed leading-relaxed">{ex.tip}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PlanTab() {
  const workouts = useWorkoutStore((s) => s.workouts);

  // Build last 7 days (Mon-Sun relative to today)
  const days: { date: string; label: string; trained: boolean }[] = [];
  const now = new Date();

  // Find the most recent Monday
  const dayOfWeek = now.getDay(); // 0=Sun
  const daysFromMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysFromMon);
  monday.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const trained = workouts.some((w) => w.date.startsWith(dateStr));
    const isToday = dateStr === todayKey();
    days.push({ date: dateStr, label: getDayLabel(d) + (isToday ? '*' : ''), trained });
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-forge-dim text-xs font-condensed uppercase tracking-wider mb-3">
          Weekly Overview
        </p>
        <Card>
          <div className="grid grid-cols-7 gap-1">
            {days.map(({ date, label, trained }) => (
              <div key={date} className="flex flex-col items-center gap-1.5">
                <p className="text-forge-dim text-xs font-condensed">{label}</p>
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-condensed font-bold transition-all ${
                    trained
                      ? 'text-black'
                      : 'text-forge-dim'
                  }`}
                  style={
                    trained
                      ? { background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)', boxShadow: '0 0 10px rgba(0,255,136,0.4)' }
                      : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }
                  }>
                  {trained ? '✓' : '—'}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-forge-border">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ background: '#00ff88' }} />
              <span className="text-forge-dim text-xs font-condensed">Trained</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-white/5 border border-white/10" />
              <span className="text-forge-dim text-xs font-condensed">Rest</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function NutritionTab() {
  const meals = useNutritionStore((s) => s.meals);
  const water = useNutritionStore((s) => s.water);
  const macroTargets = useNutritionStore((s) => s.macroTargets);
  const addWater = useNutritionStore((s) => s.addWater);
  const undoWater = useNutritionStore((s) => s.undoWater);

  const today = todayKey();
  const todayWater = water[today] ?? { cups_drunk: 0, goal_cups: 8 };
  const todayMeals = meals[today]?.meals ?? [];

  // Sum macros
  const totals = todayMeals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories ?? 0),
      protein: acc.protein + (m.protein ?? 0),
      carbs: acc.carbs + (m.carbs ?? 0),
      fat: acc.fat + (m.fat ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const macros: { label: string; totKey: keyof typeof totals; targetKey: 'calories' | 'protein_g' | 'carbs_g' | 'fat_g'; unit: string }[] = [
    { label: 'Calories', totKey: 'calories', targetKey: 'calories', unit: 'kcal' },
    { label: 'Protein', totKey: 'protein', targetKey: 'protein_g', unit: 'g' },
    { label: 'Carbs', totKey: 'carbs', targetKey: 'carbs_g', unit: 'g' },
    { label: 'Fat', totKey: 'fat', targetKey: 'fat_g', unit: 'g' },
  ];

  return (
    <div className="space-y-5">
      {/* Water tracking */}
      <div>
        <p className="text-forge-dim text-xs font-condensed uppercase tracking-wider mb-3">
          Water Intake
        </p>
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-400" />
              <span className="text-forge-text font-condensed font-semibold">
                {todayWater.cups_drunk} / {todayWater.goal_cups} cups
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => undoWater(today)}
                disabled={todayWater.cups_drunk === 0}
                className="min-h-[44px] px-3 rounded-xl text-forge-dim text-sm font-condensed press-scale cursor-pointer disabled:opacity-30 card-elevated">
                Undo
              </button>
              <button
                onClick={() => addWater(today)}
                className="min-h-[44px] px-4 rounded-xl text-black text-sm font-condensed font-semibold press-scale cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)' }}>
                + Cup
              </button>
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (todayWater.cups_drunk / todayWater.goal_cups) * 100)}%`,
                background: 'linear-gradient(90deg, #60a5fa, #3b82f6)',
                boxShadow: '0 0 8px rgba(96,165,250,0.5)',
              }}
            />
          </div>
        </Card>
      </div>

      {/* Macro summary */}
      <div>
        <p className="text-forge-dim text-xs font-condensed uppercase tracking-wider mb-3">
          Macro Summary
        </p>
        <div className="grid grid-cols-2 gap-2">
          {macros.map(({ label, totKey, targetKey, unit }) => {
            const val = totals[totKey];
            const rawTarget = macroTargets[targetKey];
            const target = typeof rawTarget === 'number' ? rawTarget : 1;
            const pct = Math.min(100, Math.round((val / target) * 100));
            return (
              <Card key={label} className="py-3">
                <p className="text-forge-dim text-xs font-condensed uppercase tracking-wider mb-1">
                  {label}
                </p>
                <p className="text-forge-green text-xl font-display"
                  style={{ textShadow: '0 0 10px rgba(0,255,136,0.4)' }}>
                  {(val as number).toFixed(0)}
                  <span className="text-forge-dim text-xs font-condensed ml-1">{unit}</span>
                </p>
                <p className="text-forge-dim text-xs font-condensed mt-0.5">
                  / {target} {unit}
                </p>
                <div className="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: pct >= 100 ? '#f59e0b' : 'linear-gradient(90deg, #00ff88, #00cc6a)',
                    }}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Coaching tip */}
      <div>
        <p className="text-forge-dim text-xs font-condensed uppercase tracking-wider mb-3">
          Coaching Tip
        </p>
        <Card>
          <p className="text-forge-text text-sm font-condensed leading-relaxed">
            Aim to hit your protein target first. Once protein is covered, distribute remaining
            calories between carbs and fats based on your energy needs and training schedule.
          </p>
        </Card>
      </div>
    </div>
  );
}

function CaliTab() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)', boxShadow: '0 0 24px rgba(0,255,136,0.3)' }}>
        <Scaling className="w-8 h-8 text-black" />
      </div>
      <p className="text-forge-dim text-xs font-condensed uppercase tracking-wider">Coming Soon</p>
      <p className="text-forge-text font-display text-lg text-center">
        Calisthenics Coach
      </p>
      <p className="text-forge-dim text-sm font-condensed text-center max-w-[240px] leading-relaxed">
        Personalized bodyweight progressions and skill coaching arriving soon.
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function CoachPage() {
  const [activeTab, setActiveTab] = useState<TabId>('today');

  return (
    <div className="page-enter pb-20">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-forge-green font-display text-2xl"
          style={{ textShadow: '0 0 12px rgba(0,255,136,0.4)' }}>
          Coach
        </h2>
      </div>

      {/* Sub-tab pills */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-none">
        {TABS.map(({ id, label }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-shrink-0 min-h-[44px] px-4 rounded-xl font-condensed font-semibold text-sm press-scale cursor-pointer transition-all duration-200 ${
                isActive ? 'text-black' : 'text-forge-dim card-elevated'
              }`}
              style={
                isActive
                  ? {
                      background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
                      boxShadow: '0 0 16px rgba(0,255,136,0.4)',
                    }
                  : undefined
              }>
              {label}
            </button>
          );
        })}
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
