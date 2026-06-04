import { useMemo } from 'react';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { useBwWorkoutStore } from '../stores/useBwWorkoutStore';
import { useCardioStore } from '../stores/useCardioStore';
import { useGamificationStore } from '../stores/useGamificationStore';
import type { MuscleGroup } from '../types/workout';

const VALID_MUSCLES: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'forearms', 'core', 'legs', 'glutes', 'calves',
];

export interface ProgressInsights {
  /** Weekly goal ring data. */
  weekGoal: {
    target: number;                  // user-set or default 4
    current: number;                 // sessions this week
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

  return useMemo(() => {
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);
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
    workouts.filter((w) => inThisWeek(w.date)).forEach((w) => weekDays.add(w.date.slice(0, 10)));
    bwWorkouts.filter((w) => inThisWeek(w.date)).forEach((w) => weekDays.add(w.date.slice(0, 10)));
    cardio.filter((c) => inThisWeek(c.date)).forEach((c) => weekDays.add(c.date.slice(0, 10)));
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
    [...workouts, ...bwWorkouts].forEach((w) => { if (w.date) allDays.add(w.date.slice(0, 10)); });
    cardio.forEach((c) => { if (typeof c.date === 'string' && c.date) allDays.add(c.date.slice(0, 10)); });
    let days = 0;
    const cursor = new Date(todayKey);
    const yesterdayKey = new Date(cursor.getTime() - 86400000).toISOString().slice(0, 10);
    const todayLogged = allDays.has(todayKey);
    const atRisk = !todayLogged;
    if (allDays.has(todayKey) || allDays.has(yesterdayKey)) {
      if (!allDays.has(todayKey)) cursor.setTime(cursor.getTime() - 86400000);
      while (allDays.has(cursor.toISOString().slice(0, 10))) {
        days++;
        cursor.setTime(cursor.getTime() - 86400000);
      }
    }
    // Longest ever
    const sortedDays = [...allDays].sort();
    let longest = 0, run = 0, last: string | null = null;
    for (const d of sortedDays) {
      if (last && new Date(d).getTime() - new Date(last).getTime() === 86400000) run++;
      else run = 1;
      if (run > longest) longest = run;
      last = d;
    }
    const hoursUntilMidnight = Math.floor((new Date(todayKey + 'T23:59:59').getTime() - Date.now()) / 3600000);

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
        ? Math.floor((Date.now() - new Date(last.date).getTime()) / 86400000)
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
        target: weeklyGoal, current, percentage, remaining, pace, daysLeftInWeek,
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
        sessions: workouts.filter((w) => w.date?.startsWith(todayKey)).length
          + bwWorkouts.filter((w) => w.date?.startsWith(todayKey)).length
          + cardio.filter((c) => typeof c.date === 'string' && c.date.startsWith(todayKey)).length,
        anyLoggedToday: todayLogged,
      },
    };
  }, [workouts, bwWorkouts, cardio, weeklyGoal, getLevel, experience]);
}
