import { useState, useMemo } from 'react';
import {
  TrendingUp, Target, Activity as MuscleIcon, Scaling, BarChart3,
  Flame, Dumbbell, Trophy,
} from 'lucide-react';
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
import { StepsPanel } from '../features/steps';
import { XPBar } from '../features/gamification';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { useBodyStore } from '../stores/useBodyStore';

type StatsTab = 'overview' | 'progress' | 'muscles' | 'body' | 'cali';
type PeriodKey = '7D' | '1M' | '3M' | '6M' | 'ALL';

const TABS: { key: StatsTab; label: string; Icon: typeof TrendingUp }[] = [
  { key: 'overview',  label: 'Overview', Icon: BarChart3 },
  { key: 'progress',  label: 'Progress',  Icon: TrendingUp },
  { key: 'muscles',   label: 'Muscles',   Icon: MuscleIcon },
  { key: 'body',      label: 'Body',      Icon: Target },
  { key: 'cali',      label: 'Cali',      Icon: Scaling },
];

const PERIODS: PeriodKey[] = ['7D', '1M', '3M', '6M', 'ALL'];


const MUSCLE_GROUPS = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'forearms', 'core', 'legs', 'glutes', 'calves',
] as const;

function freshLabel(days: number | null): { label: string; color: string } {
  if (days === null)    return { label: 'Never',     color: '#374151' };
  if (days <= 1)        return { label: 'Fresh',     color: '#2ecc71' };
  if (days <= 3)        return { label: 'Recovering', color: '#8BC34A' };
  if (days <= 5)        return { label: 'Ready',     color: '#FFC107' };
  return               { label: 'Overdue',   color: '#EF4444' };
}

// ── Snapshot stat card ──────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof Flame }) {
  return (
    <div className="card-elevated rounded-2xl p-3 flex flex-col gap-1 flex-1 min-w-0">
      <div className="flex items-center gap-1.5 text-forge-dim">
        <Icon size={12} />
        <span className="text-[10px] font-condensed uppercase tracking-wider truncate">{label}</span>
      </div>
      <div
        className="text-2xl font-display text-forge-green leading-none"
        style={{ textShadow: '0 0 20px rgba(46,204,113,0.3)' }}
      >
        {value}
      </div>
    </div>
  );
}

// ── Overview snapshot ───────────────────────────────────────────────────────
function OverviewSnapshot() {
  const workouts = useWorkoutStore((s) => s.workouts);

  const { streak, thisMonthCount, prsThisMonth } = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    // Streak: consecutive days with a workout ending today or yesterday
    const daySet = new Set(workouts.map((w) => w.date.slice(0, 10)));
    let streak = 0;
    const cursor = new Date(todayStr);
    while (daySet.has(cursor.toISOString().slice(0, 10))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    // This month
    const monthPrefix = todayStr.slice(0, 7);
    const thisMonthCount = workouts.filter((w) => w.date.startsWith(monthPrefix)).length;

    // PRs this month: sets flagged isPR
    let prsThisMonth = 0;
    for (const w of workouts) {
      if (!w.date.startsWith(monthPrefix)) continue;
      for (const ex of w.exercises) {
        for (const set of ex.sets) {
          if (set.isPR) prsThisMonth++;
        }
      }
    }

    return { streak, thisMonthCount, prsThisMonth };
  }, [workouts]);

  return (
    <div className="flex gap-2">
      <StatCard label="Streak" value={`${streak}d`} icon={Flame} />
      <StatCard label="This Month" value={thisMonthCount} icon={Dumbbell} />
      <StatCard label="PRs / Mo" value={prsThisMonth} icon={Trophy} />
    </div>
  );
}

// ── Muscle freshness list ───────────────────────────────────────────────────
function MuscleFreshnessList() {
  const workouts = useWorkoutStore((s) => s.workouts);

  const rows = useMemo(() => {
    const now = Date.now();
    return MUSCLE_GROUPS.map((m) => {
      const last = workouts
        .filter((w) => w.exercises.some((e) => e.muscle.toLowerCase() === m))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      const days = last
        ? Math.floor((now - new Date(last.date).getTime()) / 86400000)
        : null;

      const { label, color } = freshLabel(days);
      const dateStr = last
        ? new Date(last.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : '—';

      return { muscle: m, days, label, color, dateStr };
    });
  }, [workouts]);

  return (
    <div className="space-y-1.5">
      {rows.map((r) => (
        <div key={r.muscle} className="card-elevated rounded-xl px-3 py-2.5 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.color }} />
          <span className="flex-1 text-forge-text text-sm font-medium capitalize">{r.muscle}</span>
          <span className="text-forge-dim text-xs">{r.dateStr}</span>
          <span
            className="text-xs font-condensed font-semibold w-20 text-right"
            style={{ color: r.color }}
          >
            {r.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Body measurements grid ──────────────────────────────────────────────────
function MeasurementsGrid() {
  const measurements = useBodyStore((s) => s.measurements);
  const latest = useMemo(
    () => [...measurements].sort((a, b) => b.date.localeCompare(a.date))[0] ?? null,
    [measurements],
  );

  if (!latest) {
    return (
      <p className="text-forge-dim text-sm text-center py-4 font-condensed">
        No measurements recorded yet.
      </p>
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
    <div>
      <p className="text-forge-dim text-xs font-condensed uppercase tracking-wider mb-2">
        Latest — {new Date(latest.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {defined.map(({ key, label }) => (
          <div key={key} className="card-elevated rounded-xl p-2.5 text-center">
            <div className="text-forge-dim text-[10px] font-condensed uppercase tracking-wider">{label}</div>
            <div
              className="text-lg font-display text-forge-green mt-0.5"
              style={{ textShadow: '0 0 16px rgba(46,204,113,0.25)' }}
            >
              {latest[key] as number}
            </div>
            <div className="text-forge-dim text-[9px]">cm</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── InBody card ─────────────────────────────────────────────────────────────
function InBodyCard() {
  const inbody = useBodyStore((s) => s.inbody);
  const latest = useMemo(
    () => [...inbody].sort((a, b) => b.date.localeCompare(a.date))[0] ?? null,
    [inbody],
  );

  if (!latest) return null;

  const metrics: Array<{ key: keyof typeof latest; label: string; unit: string }> = [
    { key: 'muscle_mass',   label: 'Muscle',   unit: 'kg' },
    { key: 'body_fat',      label: 'Fat Mass',  unit: 'kg' },
    { key: 'body_fat_pct',  label: 'Fat %',     unit: '%'  },
    { key: 'water',         label: 'Water',     unit: 'L'  },
    { key: 'bmi',           label: 'BMI',       unit: ''   },
  ];

  const defined = metrics.filter((m) => latest[m.key] !== undefined && latest[m.key] !== null);

  return (
    <div>
      <p className="text-forge-dim text-xs font-condensed uppercase tracking-wider mb-2">
        InBody — {new Date(latest.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {defined.map(({ key, label, unit }) => (
          <div key={key} className="card-elevated rounded-xl p-2.5 text-center">
            <div className="text-forge-dim text-[10px] font-condensed uppercase tracking-wider">{label}</div>
            <div
              className="text-lg font-display text-forge-green mt-0.5"
              style={{ textShadow: '0 0 16px rgba(46,204,113,0.25)' }}
            >
              {latest[key] as number}
            </div>
            {unit && <div className="text-forge-dim text-[9px]">{unit}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export function StatsPage() {
  const [tab, setTab]       = useState<StatsTab>('overview');
  const [period, setPeriod] = useState<PeriodKey>('1M');

  return (
    <div className="p-4 space-y-4 pb-20 page-enter">
      <h2 className="text-forge-green font-display text-2xl">Stats</h2>

      {/* Sub-tabs */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-condensed font-semibold whitespace-nowrap cursor-pointer press-scale min-h-[44px] transition-all duration-200 ${
              tab === t.key
                ? 'bg-gradient-to-br from-forge-green to-forge-green-dark text-forge-bg shadow-[0_2px_12px_rgba(46,204,113,0.25)]'
                : 'card-elevated text-forge-muted hover:text-forge-text'
            }`}
          >
            <t.Icon size={14} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <OverviewSnapshot />
          <XPBar />
          <StepsPanel />

          <DashboardSection title="Muscle Freshness">
            <MuscleHeatmap />
          </DashboardSection>

          <DashboardSection title="Recent Workouts">
            <WorkoutHistory />
          </DashboardSection>
        </div>
      )}

      {/* ── PROGRESS ─────────────────────────────────────────────────────── */}
      {tab === 'progress' && (
        <div className="space-y-4">
          {/* Period filter */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-condensed font-semibold whitespace-nowrap cursor-pointer press-scale min-h-[36px] transition-all duration-200 ${
                  period === p
                    ? 'bg-gradient-to-br from-forge-green to-forge-green-dark text-forge-bg shadow-[0_2px_8px_rgba(46,204,113,0.2)]'
                    : 'card-elevated text-forge-muted hover:text-forge-text'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <DashboardSection title={`Volume by Muscle (${period})`}>
            <VolumeChart />
          </DashboardSection>

          <DashboardSection title={`Exercise Frequency (${period})`}>
            <FreqChart />
          </DashboardSection>

          <DashboardSection title="PR Board">
            <PRBoard />
          </DashboardSection>
        </div>
      )}

      {/* ── MUSCLES ──────────────────────────────────────────────────────── */}
      {tab === 'muscles' && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <p className="text-forge-dim text-xs font-condensed uppercase tracking-wider mb-2">Heatmap</p>
              <MuscleHeatmap />
            </div>
          </div>

          <DashboardSection title="Muscle Balance">
            <BalanceChart />
          </DashboardSection>

          <DashboardSection title="Freshness by Group">
            <MuscleFreshnessList />
          </DashboardSection>

          <DashboardSection title="Volume by Muscle (30 days)">
            <VolumeChart />
          </DashboardSection>
        </div>
      )}

      {/* ── BODY ─────────────────────────────────────────────────────────── */}
      {tab === 'body' && (
        <div className="space-y-4">
          <DashboardSection title="Weight Trend">
            <WeightChart />
          </DashboardSection>

          <DashboardSection title="Measurements">
            <MeasurementsGrid />
          </DashboardSection>

          <DashboardSection title="InBody Analysis">
            <InBodyCard />
          </DashboardSection>
        </div>
      )}

      {/* ── CALI ─────────────────────────────────────────────────────────── */}
      {tab === 'cali' && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-forge-green/10 to-forge-green/5 flex items-center justify-center">
            <Scaling size={32} className="text-forge-dim" />
          </div>
          <div className="text-center">
            <p className="text-forge-text font-display text-lg">Calisthenics</p>
            <p className="text-forge-dim font-condensed text-sm mt-1">Progression tree coming soon</p>
          </div>
          <div className="flex gap-2 mt-2">
            {['Push', 'Pull', 'Core', 'Legs'].map((g) => (
              <div key={g} className="card-elevated rounded-xl px-3 py-2 text-xs font-condensed text-forge-dim">
                {g}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
