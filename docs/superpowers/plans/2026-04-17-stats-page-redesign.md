# Stats Page Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild all four Stats tabs (Overview, Progress, Muscles, Body) with a Whoop-style athletic analytics aesthetic — activity rings, KPI deltas, progressive overload bars, composition donut, while keeping all existing stores, types, and reusable components untouched.

**Architecture:** All new components are written inline in `src/pages/StatsPage.tsx`. No new files, no store changes, no type changes. New components replace or supplement existing inline components (`HeroKPIStrip`, `InBodyCard`, `MeasurementsGrid`) while reusing `MuscleHeatmap`, `BodyMap`, `PRBoard`, `WorkoutHistory`, `StepsPanel`, `XPBar`, `BalanceChart`, `VolumeChart`, `FreqChart` unchanged.

**Tech Stack:** React 18, TypeScript, Zustand stores (`useWorkoutStore`, `useBwWorkoutStore`, `useCardioStore`, `useBodyStore`), Lucide icons, Tailwind + FORGE design tokens, inline SVG for rings and donut.

> **Note:** No test framework is configured in this project. Each task verifies via `npm run dev` visual inspection. Run the dev server once at the start and keep it open throughout.

---

## Key Types (reference throughout)

```ts
// src/types/body.ts
interface BodyWeightEntry { date: string; weight_kg: number; notes?: string }
interface Measurement { date: string; chest?: number; waist?: number; hips?: number;
  left_arm?: number; right_arm?: number; left_thigh?: number; right_thigh?: number;
  left_calf?: number; right_calf?: number; shoulders?: number; neck?: number; notes?: string }
interface InBodyEntry { date: string; muscle_mass?: number; body_fat?: number;
  body_fat_pct?: number; water?: number; bmi?: number; notes?: string }

// src/types/workout.ts — Workout has:
//   exercises: Array<{ name: string; muscle: string; sets: Array<{ reps: number; weight: number; isPR?: boolean }> }>
//   date: string (ISO)
```

## File Map

| File | Action | What changes |
|------|--------|--------------|
| `src/pages/StatsPage.tsx` | Modify | All tasks — all new components live here |

No other files change.

---

## Task 1: Start dev server and read the current file

**Files:**
- Modify: `src/pages/StatsPage.tsx`

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Open the browser to the running URL (typically `http://localhost:5173`). Navigate to the Stats tab. Keep the server running for the rest of the plan.

- [ ] **Step 2: Read the current StatsPage**

Open `src/pages/StatsPage.tsx` and note the location of:
- `HeroKPIStrip` component definition (lines ~53–125)
- `KpiBigCell` component definition (lines ~127–156)
- `PeriodSummary` component definition (lines ~549–582)
- The Overview tab render block (`tab === 'overview'`, lines ~608–621)
- The Progress tab render block (`tab === 'progress'`, lines ~624–644)
- The Muscles tab render block (`tab === 'muscles'`, lines ~647–659)
- The Body tab render block (`tab === 'body'`, lines ~662–675)

---

## Task 2: Overview — ActivityRingsHero component

Replace `HeroKPIStrip` with a new `ActivityRingsHero` that shows three SVG rings + weekly dot strip + latest PR pill.

**Files:**
- Modify: `src/pages/StatsPage.tsx`

- [ ] **Step 1: Add `Trophy` to the existing import** (it may already be imported — check line 1–6)

Ensure `Trophy` is in the lucide-react import list at the top of the file. If already present, skip.

- [ ] **Step 2: Replace the `HeroKPIStrip` function** (the entire function, lines ~53–125) with `ActivityRingsHero`:

```tsx
const SESSION_TARGET = 12;
const DOW_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

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
    const bestMonth = Math.max(...Object.values(monthlyVol), volumeThisMonth, 1);
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
                  border: data.weekDays[i] ? 'none' : '1.5px solid #333',
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
            <span className="text-[10px] text-forge-muted ml-0.5">KG · {data.latestPR.reps}R</span>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Update Overview tab render** — find `{tab === 'overview' && (` and replace `<HeroKPIStrip />` with `<ActivityRingsHero />`:

```tsx
{tab === 'overview' && (
  <div className="space-y-4">
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
```

- [ ] **Step 4: Verify in browser**

Navigate to Stats → Overview. You should see:
- Three green/amber/indigo rings with labels and values
- A 7-dot weekly strip below
- A gold PR pill (if any PR exists in the data)
- XP bar, Steps, Heatmap, Recent Workouts below (unchanged)

- [ ] **Step 5: Commit**

```bash
git add src/pages/StatsPage.tsx
git commit -m "feat(stats): replace KPI strip with activity rings + weekly dots + PR pill on Overview"
```

---

## Task 3: Progress — KPI deltas

Update `KpiBigCell` to accept a `delta` prop, and update `PeriodSummary` to compute and pass deltas vs the previous period.

**Files:**
- Modify: `src/pages/StatsPage.tsx`

- [ ] **Step 1: Update `KpiBigCell` signature and render** — replace the entire `KpiBigCell` function with:

```tsx
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
            color:       delta!.value > 0 ? '#2ecc71' : '#EF4444',
            background:  delta!.value > 0 ? 'rgba(46,204,113,0.1)' : 'rgba(239,68,68,0.1)',
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
```

- [ ] **Step 2: Replace `PeriodSummary` with a version that computes previous-period deltas:**

```tsx
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

    const now = Date.now();
    const cutoff     = durMs ? now - durMs : 0;
    const prevCutoff = durMs ? cutoff - durMs : 0;

    const calc = (from: number, to: number) => {
      const w  = workouts.filter((x) => { const t = new Date(x.date).getTime(); return t >= from && t < to; });
      const bw = bwWorkouts.filter((x) => { const t = new Date(x.date).getTime(); return t >= from && t < to; });
      const c  = cardio.filter((x) => { const t = new Date(x.date).getTime(); return t >= from && t < to; });
      const sessions = w.length + bw.length + c.length;
      const volume   = Math.round(w.reduce((a, x) => a + x.exercises.reduce((b, ex) => b + ex.sets.reduce((c2, s) => c2 + s.reps * s.weight, 0), 0), 0));
      const prs      = w.reduce((a, x) => a + x.exercises.reduce((b, ex) => b + ex.sets.filter((s) => s.isPR).length, 0), 0);
      const minutes  = c.reduce((a, x) => a + x.duration, 0);
      return { sessions, volume, prs, minutes };
    };

    const current = calc(cutoff, Infinity);
    const prev    = durMs ? calc(prevCutoff, cutoff) : null;
    return { current, prev };
  }, [period, workouts, bwWorkouts, cardio]);

  const mkDelta = (cur: number, p: number | undefined, unit?: string) =>
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
```

- [ ] **Step 3: Verify in browser**

Navigate to Stats → Progress. Change periods. Each KPI cell should show a colored delta pill (↑ green / ↓ red) when there's data for both the current and previous period. For `ALL` period, no delta appears (correct — no previous window).

- [ ] **Step 4: Commit**

```bash
git add src/pages/StatsPage.tsx
git commit -m "feat(stats): add period deltas to Progress KPI cells"
```

---

## Task 4: Progress — Weekly Volume Bars

Add a bar chart showing total volume per week inside the selected period.

**Files:**
- Modify: `src/pages/StatsPage.tsx`

- [ ] **Step 1: Add `WeeklyVolumeBars` component** — insert this new function after `PeriodSummary`:

```tsx
function WeeklyVolumeBars({ period }: { period: PeriodKey }) {
  const workouts = useWorkoutStore((s) => s.workouts);

  const weeks = useMemo(() => {
    const durMs =
      period === '7D'  ?  7 * 86400000 :
      period === '1M'  ? 30 * 86400000 :
      period === '3M'  ? 90 * 86400000 :
      period === '6M'  ? 180 * 86400000 : null;

    const now    = Date.now();
    const cutoff = durMs ? now - durMs : 0;

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
```

- [ ] **Step 2: Add `<WeeklyVolumeBars period={period} />` to the Progress tab render**, below `<PeriodSummary period={period} />` and above the existing `DashboardSection` for VolumeChart:

```tsx
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
```

- [ ] **Step 3: Verify in browser**

Stats → Progress. Should see a bar chart below the KPI grid. Bars should be tallest for the most recent week. Different periods show different bar groupings.

- [ ] **Step 4: Commit**

```bash
git add src/pages/StatsPage.tsx
git commit -m "feat(stats): add weekly volume bar chart to Progress tab"
```

---

## Task 5: Progress — Progressive Overload section

Show per-exercise weight progress vs the previous equivalent period.

**Files:**
- Modify: `src/pages/StatsPage.tsx`

- [ ] **Step 1: Add `ProgressiveOverload` component** — insert after `WeeklyVolumeBars`:

```tsx
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
      const cur  = maxWeight(name, cutoff, Infinity);
      const prev = maxWeight(name, prevCutoff, cutoff);
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
              className="text-[11px] font-mono font-semibold w-14 text-right flex-shrink-0"
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
```

- [ ] **Step 2: Add `<ProgressiveOverload period={period} />` to Progress tab render**, below `<WeeklyVolumeBars period={period} />`:

```tsx
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
```

- [ ] **Step 3: Verify in browser**

Stats → Progress → 1M. Below the volume bars you should see up to 5 exercise rows with colored bars. Green = improved vs prior month, red = regressed. For `ALL` period, no overload section appears (correct — no prior window).

- [ ] **Step 4: Commit**

```bash
git add src/pages/StatsPage.tsx
git commit -m "feat(stats): add progressive overload section to Progress tab"
```

---

## Task 6: Muscles — Volume by Muscle Group

Add horizontal volume bars sorted by total kg in the last 30 days.

**Files:**
- Modify: `src/pages/StatsPage.tsx`

- [ ] **Step 1: Add `MuscleVolumeByGroup` component** — insert before the `MuscleFreshnessList` function:

```tsx
function MuscleVolumeByGroup() {
  const workouts   = useWorkoutStore((s) => s.workouts);
  const bwWorkouts = useBwWorkoutStore((s) => s.bwWorkouts);

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
    }));
  }, [workouts, bwWorkouts]);

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
          <span className="text-forge-muted text-[10px] font-mono w-12 text-right flex-shrink-0">
            {r.label} kg
          </span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Update Muscles tab render** — replace the existing Muscles tab with:

```tsx
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
```

- [ ] **Step 3: Verify in browser**

Stats → Muscles. Body map at top, then horizontal bars sorted by volume, then freshness list, then balance chart.

- [ ] **Step 4: Commit**

```bash
git add src/pages/StatsPage.tsx
git commit -m "feat(stats): add muscle volume bars to Muscles tab, reorder sections"
```

---

## Task 7: Body — Weight Hero Card

Replace the weight display in the Body tab with a hero card using `bodyWeight` store (not `measurements`).

**Files:**
- Modify: `src/pages/StatsPage.tsx`

- [ ] **Step 1: Add `WeightHeroCard` component** — insert before `MeasurementsGrid`:

```tsx
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
```

- [ ] **Step 2: Verify the `Weight` icon is imported** — check the lucide-react import at line 1. `Weight` should already be there (it was used in the old `KpiBigCell` calls). If not, add it.

- [ ] **Step 3: Commit**

```bash
git add src/pages/StatsPage.tsx
git commit -m "feat(stats): add WeightHeroCard component for Body tab"
```

---

## Task 8: Body — Composition Donut

Replace `InBodyCard` (3-col grid) with a segmented SVG donut showing body composition.

**Files:**
- Modify: `src/pages/StatsPage.tsx`

- [ ] **Step 1: Add `CompositionDonut` component** — replace the entire existing `InBodyCard` function with:

```tsx
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

  type IKey = keyof typeof latest;
  const d = (key: IKey, lowerBetter = false) => {
    if (!previous) return null;
    const cur  = latest[key]  as number | undefined ?? 0;
    const prev = previous[key] as number | undefined ?? 0;
    const diff = +(cur - prev).toFixed(1);
    if (diff === 0) return null;
    const good = lowerBetter ? diff < 0 : diff > 0;
    return { diff, color: good ? '#2ecc71' : '#EF4444' };
  };

  const metrics: Array<{ label: string; color: string; value: number | undefined; unit: string; delta: ReturnType<typeof d> }> = [
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
            <span className="text-forge-green font-bold text-[13px] leading-none">
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
                  <span className="text-[9px] ml-1" style={{ color: m.delta.color }}>
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
```

- [ ] **Step 2: Update Body tab render** — replace the current Body tab render with:

```tsx
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
```

- [ ] **Step 3: Verify in browser**

Stats → Body. Should see: weight hero card → weight trend chart → InBody donut with legend → measurements grid. If no InBody data logged, the donut shows the empty state.

- [ ] **Step 4: Commit**

```bash
git add src/pages/StatsPage.tsx
git commit -m "feat(stats): replace InBodyCard with CompositionDonut, add WeightHeroCard to Body tab"
```

---

## Task 9: Final polish and TypeScript check

- [ ] **Step 1: Run TypeScript type check**

```bash
npx tsc --noEmit
```

Fix any type errors. Common issues to watch for:
- `delta` prop on `KpiBigCell` where old call sites don't pass it — that's fine (prop is optional)
- `setPeriod(p as PeriodKey)` cast needed in `TabPills` onChange
- `InBodyEntry` key indexing in `CompositionDonut` — use `as IKey` cast as shown

- [ ] **Step 2: Full visual walkthrough**

Open `http://localhost:<port>` on the Stats tab and walk through all 5 tabs:

| Tab | Check |
|-----|-------|
| Overview | Rings render with correct colors; weekly dots visible; PR pill shows if PR data exists; sections below unchanged |
| Progress | Period pills work; KPIs show delta pills; weekly bars render; overload rows appear for 1M/3M/6M/ALL with data |
| Muscles | BodyMap heatmap at top; muscle volume bars sorted below; freshness list; balance chart |
| Body | Weight hero card; weight chart; composition donut or empty state; measurements grid |
| Cali | Completely unchanged |

- [ ] **Step 3: Final commit**

```bash
git add src/pages/StatsPage.tsx
git commit -m "feat(stats): Stats page redesign complete — Whoop-style rings, overload, donut, muscle volume"
```
