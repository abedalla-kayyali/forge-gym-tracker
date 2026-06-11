import { useMemo } from 'react';
import { useNow } from './useNow';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { useBwWorkoutStore } from '../stores/useBwWorkoutStore';
import { useCardioStore } from '../stores/useCardioStore';
import { useGamificationStore } from '../stores/useGamificationStore';
import type { MuscleGroup } from '../types/workout';

const VALID_MUSCLES: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'forearms', 'core', 'legs', 'glutes', 'calves',
];

/**
 * YYYY-MM-DD key from a Date's LOCAL components (not UTC).
 * Using toISOString() would bucket a late-night session at e.g. UTC+3 onto the
 * previous UTC day, silently breaking streaks. Always bucket days locally.
 */
function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export interface ProgressInsights {
  /** Weekly goal ring data. */
  weekGoal: {
    target: number;                  // user-set or default 4
    done: number;                    // sessions this week
    percentage: number;              // 0-100
    remaining: number;               // sessions left to hit goal
    pace: 'ahead' | 'ontrack' | 'behind' | 'hit';
    daysLeftInWeek: number;          // Mon-Sun week basis
  };
  /** Single closest-to-beat PR target. */
  nextPR: {
    exerciseName: string;
    currentWeight: number;
    currentReps: number;
    targetWeight: number;            // +2.5 kg over current
    progressPct: number;             // 100 = hit
    sessionsToTry: number;           // sessions since last attempt
  } | null;
  /** Smart coach pick — muscle that's been rested longest with enough recovery. */
  recommendedMuscle: {
    muscle: MuscleGroup;
    reason: string;
    daysSinceLastTrained: number | null;
  } | null;
  /** Streak + at-risk state. */
  streak: {
    days: number;
    atRisk: boolean;                 // hasn't logged today
    hoursUntilMidnight: number;      // how long before day rolls over
    longest: number;
  };
  /** Level + XP progress. */
  level: {
    current: number;
    name: string;
    xpNow: number;
    xpToNext: number;
    percentageToNext: number;
  };
  /** Derived state: totals for today. */
  today: {
    sessions: number;
    anyLoggedToday: boolean;
  };
}

/** Compute everything the ProgressGuide card needs from the stores. */
export function useProgressInsights(weeklyGoal: number = 4): ProgressInsights {
  const workouts = useWorkoutStore((s) => s.workouts);
  const bwWorkouts = useBwWorkoutStore((s) => s.bwWorkouts);
  const cardio = useCardioStore((s) => s.entries);
  const getLevel = useGamificationStore((s) => s.getLevel);
  const experience = useGamificationStore((s) => s.experience);
  const nowTs = useNow();

  return useMemo(() => {
    const now = new Date();
    const todayKey = localDateKey(now);
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    const dayIdx = (startOfWeek.getDay() + 6) % 7; // 0 = Monday
    startOfWeek.setDate(startOfWeek.getDate() - dayIdx);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const inThisWeek = (iso: string) => {
      const t = new Date(iso).getTime();
      return t >= startOfWeek.getTime() && t < endOfWeek.getTime();
    };

    // ── Weekly sessions (unique days count — two sessions same day = 1) ─────
    const weekDays = new Set<string>();
    workouts.filter((w) => inThisWeek(w.date)).forEach((w) => weekDays.add(localDateKey(new Date(w.date))));
    bwWorkouts.filter((w) => inThisWeek(w.date)).forEach((w) => weekDays.add(localDateKey(new Date(w.date))));
    cardio.filter((c) => inThisWeek(c.date)).forEach((c) => weekDays.add(localDateKey(new Date(c.date))));
    const current = weekDays.size;
    const daysLeftInWeek = Math.max(0, 7 - (dayIdx + 1));
    const percentage = Math.min(100, Math.round((current / weeklyGoal) * 100));
    const remaining = Math.max(0, weeklyGoal - current);
    let pace: ProgressInsights['weekGoal']['pace'];
    if (current >= weeklyGoal) pace = 'hit';
    else if (remaining <= daysLeftInWeek) pace = 'ontrack';
    else if (current > Math.ceil((weeklyGoal * (dayIdx + 1)) / 7)) pace = 'ahead';
    else pace = 'behind';

    // ── Streak (consecutive days with any session) ─────────────────────────
    const allDays = new Set<string>();
    [...workouts, ...bwWorkouts].forEach((w) => { if (w.date) allDays.add(localDateKey(new Date(w.date))); });
    cardio.forEach((c) => { if (typeof c.date === 'string' && c.date) allDays.add(localDateKey(new Date(c.date))); });
    let days = 0;
    const cursor = new Date(now);
    cursor.setHours(0, 0, 0, 0);
    const yesterdayDate = new Date(cursor);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayKey = localDateKey(yesterdayDate);
    const todayLogged = allDays.has(todayKey);
    const atRisk = !todayLogged;
    if (allDays.has(todayKey) || allDays.has(yesterdayKey)) {
      if (!allDays.has(todayKey)) cursor.setDate(cursor.getDate() - 1);
      while (allDays.has(localDateKey(cursor))) {
        days++;
        cursor.setDate(cursor.getDate() - 1);
      }
    }
    // Longest ever — walk sorted local day keys, comparing each to the day before.
    const sortedDays = [...allDays].sort();
    let longest = 0, run = 0, last: string | null = null;
    for (const d of sortedDays) {
      let consecutive = false;
      if (last) {
        const prev = new Date(d + 'T00:00:00');
        prev.setDate(prev.getDate() - 1);
        consecutive = localDateKey(prev) === last;
      }
      run = consecutive ? run + 1 : 1;
      if (run > longest) longest = run;
      last = d;
    }
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    const hoursUntilMidnight = Math.floor((endOfToday.getTime() - nowTs) / 3600000);

    // ── Next PR target (closest-to-beat weighted lift) ─────────────────────
    const prMap = new Map<string, { weight: number; reps: number; date: string }>();
    for (const w of workouts) {
      for (const ex of w.exercises) {
        for (const s of ex.sets) {
          if (!s.weight || s.weight <= 0) continue;
          const cur = prMap.get(ex.name);
          if (!cur || s.weight > cur.weight) {
            prMap.set(ex.name, { weight: s.weight, reps: s.reps, date: w.date });
          }
        }
      }
    }
    let nextPR: ProgressInsights['nextPR'] = null;
    if (prMap.size > 0) {
      // Pick the most recently trained lift (most likely to attempt PR next)
      const scored = [...prMap.entries()]
        .map(([name, pr]) => ({ name, pr, ts: new Date(pr.date).getTime() }))
        .sort((a, b) => b.ts - a.ts);
      const top = scored[0]!;
      // Count sessions since last attempt
      const sessionsSince = workouts.filter(
        (w) => new Date(w.date).getTime() > top.ts &&
        w.exercises.some((ex) => ex.name === top.name),
      ).length;
      const targetWeight = top.pr.weight + 2.5;
      nextPR = {
        exerciseName: top.name,
        currentWeight: top.pr.weight,
        currentReps: top.pr.reps,
        targetWeight,
        progressPct: Math.round((top.pr.weight / targetWeight) * 100),
        sessionsToTry: sessionsSince,
      };
    }

    // ── Recommended muscle (overdue + not sore) ────────────────────────────
    const recoveryDays: Record<string, number | null> = {};
    for (const m of VALID_MUSCLES) {
      const allSessions = [...workouts, ...bwWorkouts]
        .filter((w) => w.exercises.some((e) => e.muscle.toLowerCase() === m))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const last = allSessions[0];
      recoveryDays[m] = last
        ? Math.floor((nowTs - new Date(last.date).getTime()) / 86400000)
        : null;
    }
    // Rank: never-trained muscles are "overdue" (push to train), then 4+ days rest
    let recommendedMuscle: ProgressInsights['recommendedMuscle'] = null;
    const overdueList: { muscle: MuscleGroup; days: number | null }[] = [];
    for (const m of VALID_MUSCLES) {
      const d = recoveryDays[m] ?? null;
      if (d === null) overdueList.push({ muscle: m, days: null });
      else if (d >= 4) overdueList.push({ muscle: m, days: d });
    }
    overdueList.sort((a, b) => {
      if (a.days === null && b.days !== null) return 1;       // prefer real workouts first
      if (b.days === null && a.days !== null) return -1;
      if (a.days === null && b.days === null) return 0;
      return (b.days ?? 0) - (a.days ?? 0);
    });
    // Actually prefer: most-overdue non-null first
    const withData = overdueList.filter((x) => x.days !== null).sort((a, b) => (b.days ?? 0) - (a.days ?? 0));
    const withoutData = overdueList.filter((x) => x.days === null);
    const pick = withData[0] ?? withoutData[0];
    if (pick) {
      const reason = pick.days === null
        ? 'never trained yet — lock it in'
        : `rested ${pick.days} days — ready to hit`;
      recommendedMuscle = { muscle: pick.muscle, reason, daysSinceLastTrained: pick.days };
    }

    // ── Level + XP ─────────────────────────────────────────────────────────
    const lvl = getLevel();

    return {
      weekGoal: {
        target: weeklyGoal, done: current, percentage, remaining, pace, daysLeftInWeek,
      },
      nextPR,
      recommendedMuscle,
      streak: { days, atRisk, hoursUntilMidnight, longest },
      level: {
        current: lvl.level ?? 0,
        name: lvl.name,
        xpNow: experience,
        xpToNext: 0, // derived from level.progress
        percentageToNext: Math.round(lvl.progress ?? 0),
      },
      today: {
        sessions: workouts.filter((w) => w.date && localDateKey(new Date(w.date)) === todayKey).length
          + bwWorkouts.filter((w) => w.date && localDateKey(new Date(w.date)) === todayKey).length
          + cardio.filter((c) => typeof c.date === 'string' && c.date && localDateKey(new Date(c.date)) === todayKey).length,
        anyLoggedToday: todayLogged,
      },
    };
  }, [workouts, bwWorkouts, cardio, weeklyGoal, getLevel, experience, nowTs]);
}
