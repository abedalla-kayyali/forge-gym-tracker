// Pure, offline "Journey" analytics engine. Given the user's full training
// history it returns all-time totals, estimated-1RM strength trends per lift,
// a consistency calendar (GitHub-style), and milestone badges. No React, no
// network, no Date.now() captured implicitly (pass `now` for testability).

import type { Workout, BwWorkout, CardioEntry } from '../types/workout';

const DAY = 86400000;

/** Epley estimated 1-rep max. reps=1 → the weight itself. */
export function estimateOneRepMax(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export interface LifetimeTotals {
  sessions: number;          // weighted + bodyweight + cardio
  weightedSessions: number;
  bwSessions: number;
  cardioSessions: number;
  totalVolumeKg: number;     // Σ reps × weight (weighted lifts + bw added load)
  totalSets: number;
  totalReps: number;
  trainingDays: number;      // unique calendar days with any session
  weeksActive: number;       // unique Mon-anchored weeks
  cardioMinutes: number;
  firstDate: string | null;  // YYYY-MM-DD of earliest session
}

export interface StrengthTrend {
  name: string;
  current: number;           // latest best e1RM (rounded kg)
  best: number;              // all-time best e1RM (rounded kg)
  deltaPct: number | null;   // % change first → latest
  points: number[];          // chronological e1RM series (rounded) for sparkline
}

export interface ConsistencyDay {
  date: string;              // YYYY-MM-DD (UTC)
  count: number;             // sessions logged that day
}

export type MilestoneTier = 'bronze' | 'silver' | 'gold';

export interface Milestone {
  key: string;               // i18n suffix under journey.milestones.*
  tier: MilestoneTier;
  target: number;
  current: number;
  achieved: boolean;
  progress: number;          // 0..1
}

export interface Journey {
  totals: LifetimeTotals;
  strength: StrengthTrend[];
  calendar: ConsistencyDay[];
  calendarWeeks: number;
  currentStreak: number;
  longestStreak: number;
  milestones: Milestone[];
}

export interface JourneyInput {
  workouts: Workout[];
  bwWorkouts: BwWorkout[];
  cardio: CardioEntry[];
  now?: number;
  calendarWeeks?: number;    // default 18
  topLifts?: number;         // default 4
}

const utcKey = (ts: number) => new Date(ts).toISOString().slice(0, 10);
const utcMidnight = (key: string) => Date.parse(`${key}T00:00:00Z`);

function mondayKeyUTC(key: string): string {
  const ts = utcMidnight(key);
  const dow = new Date(ts).getUTCDay(); // 0 = Sun
  const offset = dow === 0 ? 6 : dow - 1;
  return utcKey(ts - offset * DAY);
}

const MILESTONE_DEFS: { key: string; metric: 'sessions' | 'volume' | 'streak' | 'trainingDays'; target: number; tier: MilestoneTier }[] = [
  { key: 'firstStep', metric: 'sessions',     target: 1,       tier: 'bronze' },
  { key: 'committed', metric: 'sessions',     target: 25,      tier: 'bronze' },
  { key: 'dedicated', metric: 'sessions',     target: 100,     tier: 'silver' },
  { key: 'centurion', metric: 'sessions',     target: 250,     tier: 'gold' },
  { key: 'tonnage1',  metric: 'volume',       target: 50000,   tier: 'bronze' },
  { key: 'tonnage2',  metric: 'volume',       target: 250000,  tier: 'silver' },
  { key: 'tonnage3',  metric: 'volume',       target: 1000000, tier: 'gold' },
  { key: 'streak7',   metric: 'streak',       target: 7,       tier: 'bronze' },
  { key: 'streak30',  metric: 'streak',       target: 30,      tier: 'gold' },
  { key: 'days50',    metric: 'trainingDays', target: 50,      tier: 'silver' },
];

export function computeJourney(input: JourneyInput): Journey {
  const {
    workouts, bwWorkouts, cardio,
    now = Date.now(), calendarWeeks = 18, topLifts = 4,
  } = input;

  let totalVolumeKg = 0, totalSets = 0, totalReps = 0, cardioMinutes = 0;
  let firstTs = Infinity;
  const dayCount = new Map<string, number>();
  const weekSet = new Set<string>();

  const addDay = (iso: string) => {
    if (!iso) return;
    const k = iso.slice(0, 10);
    dayCount.set(k, (dayCount.get(k) ?? 0) + 1);
    weekSet.add(mondayKeyUTC(k));
    const ts = utcMidnight(k);
    if (Number.isFinite(ts) && ts < firstTs) firstTs = ts;
  };

  for (const w of workouts) {
    addDay(w.date);
    for (const ex of w.exercises ?? []) {
      for (const s of ex.sets ?? []) {
        totalSets++;
        totalReps += s.reps || 0;
        totalVolumeKg += (s.reps || 0) * (s.weight || 0);
      }
    }
  }
  for (const w of bwWorkouts) {
    addDay(w.date);
    for (const ex of w.exercises ?? []) {
      for (const s of ex.sets ?? []) {
        totalSets++;
        totalReps += s.reps || 0;
        totalVolumeKg += (s.reps || 0) * (s.addedWeight || 0);
      }
    }
  }
  for (const c of cardio) {
    addDay(c.date);
    cardioMinutes += c.duration || 0;
  }

  // ── Streaks (consecutive calendar days) ──────────────────────────────────
  const dayKeys = [...dayCount.keys()].sort();
  const daySet = new Set(dayKeys);
  let longestStreak = 0, run = 0, prevTs: number | null = null;
  for (const k of dayKeys) {
    const ts = utcMidnight(k);
    run = prevTs !== null && ts - prevTs === DAY ? run + 1 : 1;
    if (run > longestStreak) longestStreak = run;
    prevTs = ts;
  }
  let currentStreak = 0;
  const todayKey = utcKey(now);
  const yesterdayKey = utcKey(now - DAY);
  let cursor = daySet.has(todayKey) ? utcMidnight(todayKey) : daySet.has(yesterdayKey) ? utcMidnight(yesterdayKey) : null;
  while (cursor !== null && daySet.has(utcKey(cursor))) {
    currentStreak++;
    cursor -= DAY;
  }

  // ── Strength trends (e1RM per exercise over time) ────────────────────────
  // Intentionally tracks only external-load (weighted) lifts. The Epley e1RM
  // model assumes barbell/dumbbell loading; bodyweight/calisthenics progression
  // is surfaced separately on the Cali tab, so bwWorkouts are excluded here.
  const byExercise = new Map<string, Map<string, number>>();
  for (const w of workouts) {
    const k = w.date.slice(0, 10);
    for (const ex of w.exercises ?? []) {
      let bestDay = 0;
      for (const s of ex.sets ?? []) {
        if (s.isWarmup) continue;
        const e = estimateOneRepMax(s.weight || 0, s.reps || 0);
        if (e > bestDay) bestDay = e;
      }
      if (bestDay <= 0) continue;
      let series = byExercise.get(ex.name);
      if (!series) { series = new Map(); byExercise.set(ex.name, series); }
      if (bestDay > (series.get(k) ?? 0)) series.set(k, bestDay);
    }
  }
  const trends: StrengthTrend[] = [];
  for (const [name, series] of byExercise) {
    if (series.size < 2) continue; // need at least two points to show a trend
    const points = [...series.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
    const first = points[0]!;
    const last = points[points.length - 1]!;
    const best = Math.max(...points);
    trends.push({
      name,
      current: Math.round(last),
      best: Math.round(best),
      deltaPct: first > 0 ? Math.round(((last - first) / first) * 100) : null,
      points: points.map((p) => Math.round(p)),
    });
  }
  trends.sort((a, b) => (b.points.length - a.points.length) || (b.current - a.current));
  const strength = trends.slice(0, topLifts);

  // ── Consistency calendar (UTC, Mon-anchored, last N weeks) ───────────────
  const dow = new Date(utcMidnight(todayKey)).getUTCDay();
  const mondayOffset = dow === 0 ? 6 : dow - 1;
  const endMonday = utcMidnight(todayKey) - mondayOffset * DAY;
  const startTs = endMonday - (calendarWeeks - 1) * 7 * DAY;
  const calendar: ConsistencyDay[] = [];
  for (let i = 0; i < calendarWeeks * 7; i++) {
    const k = utcKey(startTs + i * DAY);
    calendar.push({ date: k, count: dayCount.get(k) ?? 0 });
  }

  // ── Totals + milestones ──────────────────────────────────────────────────
  const totals: LifetimeTotals = {
    sessions: workouts.length + bwWorkouts.length + cardio.length,
    weightedSessions: workouts.length,
    bwSessions: bwWorkouts.length,
    cardioSessions: cardio.length,
    totalVolumeKg: Math.round(totalVolumeKg),
    totalSets,
    totalReps,
    trainingDays: dayCount.size,
    weeksActive: weekSet.size,
    cardioMinutes: Math.round(cardioMinutes),
    firstDate: Number.isFinite(firstTs) ? utcKey(firstTs) : null,
  };

  const metricVal: Record<string, number> = {
    sessions: totals.sessions,
    volume: totals.totalVolumeKg,
    streak: longestStreak,
    trainingDays: totals.trainingDays,
  };
  const milestones: Milestone[] = MILESTONE_DEFS.map((d) => {
    const current = metricVal[d.metric] ?? 0;
    return {
      key: d.key,
      tier: d.tier,
      target: d.target,
      current: Math.round(current),
      achieved: current >= d.target,
      progress: d.target > 0 ? Math.max(0, Math.min(1, current / d.target)) : 1,
    };
  });

  return { totals, strength, calendar, calendarWeeks, currentStreak, longestStreak, milestones };
}
