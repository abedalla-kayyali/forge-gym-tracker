/**
 * FORGE training-science helpers.
 *
 * Ported from the legacy `index.html` utility functions. Kept as pure,
 * dependency-free functions so they can be unit-tested and called from any
 * component/store without coupling.
 */

import type { Workout, BwWorkout, WorkoutExercise } from '../types/workout';

// ═════════════════════════════════════════════════════════════════════════════
// ADAPTIVE REST TIMER
// ═════════════════════════════════════════════════════════════════════════════

const COMPOUND_KEYWORDS = [
  'squat', 'deadlift', 'bench press', 'overhead press', 'ohp', 'row',
  'pull-up', 'pullup', 'chin', 'dip', 'hip thrust', 'rdl', 'romanian',
];

/**
 * Returns recommended rest seconds based on exercise difficulty and RPE.
 *   compound + near-failure (RPE ≥ 9)  → 180s
 *   compound + medium  (RPE 7-8)       → 150s
 *   compound + light   (RPE < 7)       → 120s
 *   isolation + near-failure           →  90s
 *   isolation + light                  →  60s
 */
export function computeAdaptiveRest(exerciseName: string, lastRpe: number | null | undefined): number {
  const name = (exerciseName || '').toLowerCase();
  const isCompound = COMPOUND_KEYWORDS.some((k) => name.includes(k));
  const rir = lastRpe != null ? Math.max(0, 10 - lastRpe) : 3;

  if (isCompound) {
    if (rir <= 1) return 180;
    if (rir <= 3) return 150;
    return 120;
  }
  if (rir <= 1) return 90;
  return 60;
}

// ═════════════════════════════════════════════════════════════════════════════
// MEAL MACRO ESTIMATION
// ═════════════════════════════════════════════════════════════════════════════

interface MacroRow { keys: string[]; kcal: number; p: number; c: number; f: number }

const MEAL_TABLE: MacroRow[] = [
  { keys: ['chicken', 'grilled chicken', 'breast'],      kcal: 240, p: 42,   c: 0,   f: 5    },
  { keys: ['rice', 'white rice', 'brown rice'],          kcal: 205, p: 4,    c: 45,  f: 0.5  },
  { keys: ['egg', 'omelet', 'omelette'],                 kcal: 155, p: 13,   c: 1.1, f: 11   },
  { keys: ['oats', 'oatmeal'],                           kcal: 300, p: 10,   c: 54,  f: 6    },
  { keys: ['beef', 'steak'],                             kcal: 270, p: 26,   c: 0,   f: 18   },
  { keys: ['fish', 'salmon', 'tuna', 'tilapia'],         kcal: 230, p: 28,   c: 0,   f: 12   },
  { keys: ['bread', 'toast'],                            kcal: 160, p: 6,    c: 30,  f: 2    },
  { keys: ['banana'],                                    kcal: 105, p: 1.3,  c: 27,  f: 0.3  },
  { keys: ['apple'],                                     kcal: 95,  p: 0.5,  c: 25,  f: 0.3  },
  { keys: ['yogurt', 'greek yogurt'],                    kcal: 140, p: 14,   c: 8,   f: 5    },
  { keys: ['protein shake', 'whey', 'protein powder'],   kcal: 130, p: 25,   c: 3,   f: 2    },
  { keys: ['burger'],                                    kcal: 520, p: 26,   c: 41,  f: 28   },
  { keys: ['pizza'],                                     kcal: 285, p: 12,   c: 36,  f: 10   },
  { keys: ['shawarma'],                                  kcal: 430, p: 28,   c: 35,  f: 20   },
  { keys: ['pasta', 'spaghetti', 'macaroni'],            kcal: 310, p: 11,   c: 58,  f: 4.5  },
  { keys: ['salad'],                                     kcal: 180, p: 8,    c: 14,  f: 10   },
  { keys: ['nuts', 'almond', 'cashew', 'peanut'],        kcal: 180, p: 6,    c: 6,   f: 16   },
  { keys: ['milk'],                                      kcal: 150, p: 8,    c: 12,  f: 8    },
  { keys: ['avocado'],                                   kcal: 240, p: 3,    c: 12,  f: 22   },
  { keys: ['cheese'],                                    kcal: 110, p: 7,    c: 1,   f: 9    },
  { keys: ['hummus'],                                    kcal: 170, p: 6,    c: 14,  f: 10   },
  { keys: ['falafel'],                                   kcal: 330, p: 13,   c: 32,  f: 18   },
];

export interface MealEstimate {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  matched: boolean;
}

/** Quick macro estimation from a natural-language meal name. `qty` is servings. */
export function estimateMealMacros(name: string, qty: number = 1): MealEstimate {
  const n = (name || '').toLowerCase();
  const q = Math.max(0.25, Number.isFinite(qty) ? qty : 1);
  const hit = MEAL_TABLE.find((r) => r.keys.some((k) => n.includes(k)));
  const base = hit ?? { keys: [], kcal: 450, p: 25, c: 40, f: 15 };
  return {
    kcal:    Math.round(base.kcal * q),
    protein: +((base.p ?? 0) * q).toFixed(1),
    carbs:   +((base.c ?? 0) * q).toFixed(1),
    fat:     +((base.f ?? 0) * q).toFixed(1),
    matched: !!hit,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// WATER GOAL (dynamic from bodyweight)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Cups (250ml) of water per day, based on bodyweight × 33ml/kg.
 * Clamped between 6 and 16 cups. Falls back to 8 if no data.
 */
export function computeWaterGoalCups(weightKg?: number | null): number {
  if (!weightKg || !Number.isFinite(weightKg) || weightKg <= 0) return 8;
  const waterL = weightKg * 0.033;
  const cups = Math.round(waterL * 4); // 1L = 4 cups
  return Math.min(16, Math.max(6, cups));
}

// ═════════════════════════════════════════════════════════════════════════════
// PLATEAU DETECTION
// ═════════════════════════════════════════════════════════════════════════════

export interface PlateauEntry {
  exerciseName: string;
  weeksStuck: number;
  lastWeight: number;
  lastReps: number;
  sessions: number;
}

/**
 * Detects exercises whose top-weight & total-reps haven't moved upward in the
 * last 21 days across 2+ sessions. Typical use: coach insights / "try this".
 */
export function detectPlateaus(workouts: Workout[]): PlateauEntry[] {
  const since = Date.now() - 21 * 86400000;
  const byEx = new Map<string, { date: string; topW: number; reps: number }[]>();

  for (const w of workouts) {
    const ts = new Date(w.date).getTime();
    if (!Number.isFinite(ts) || ts < since) continue;
    for (const ex of w.exercises) {
      const name = (ex.name || '').trim();
      if (!name) continue;
      const topW = Math.max(0, ...ex.sets.map((s) => s.weight ?? 0));
      const reps = ex.sets.reduce((a, s) => a + (s.reps ?? 0), 0);
      if (!byEx.has(name)) byEx.set(name, []);
      byEx.get(name)!.push({ date: w.date, topW, reps });
    }
  }

  const results: PlateauEntry[] = [];
  for (const [name, hist] of byEx) {
    if (hist.length < 2) continue;
    hist.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const first = hist[0]!;
    const last = hist[hist.length - 1]!;
    const stuck = last.topW <= first.topW && last.reps <= first.reps;
    if (!stuck) continue;
    const days = Math.round((new Date(last.date).getTime() - new Date(first.date).getTime()) / 86400000);
    results.push({
      exerciseName: name,
      weeksStuck: Math.max(1, Math.round(days / 7)),
      lastWeight: last.topW,
      lastReps: last.reps,
      sessions: hist.length,
    });
  }
  return results.sort((a, b) => b.weeksStuck - a.weeksStuck);
}

// ═════════════════════════════════════════════════════════════════════════════
// TRAINING SCORE
// ═════════════════════════════════════════════════════════════════════════════

/**
 * 0-100 score combining recent volume trend + consistency.
 * Higher = healthier training pattern.
 */
export function calcTrainingScore(workouts: Workout[]): {
  score: number;
  volumeTrend: number;      // 0-100 — up-trend score
  consistency: number;      // 0-100 — how regular the schedule is
  sessionsLast30Days: number;
} {
  // Session totals
  const totals = workouts
    .map((w) => ({
      date: w.date,
      totalVolume: w.exercises.reduce(
        (a, ex) => a + ex.sets.reduce((b, s) => b + (s.reps ?? 0) * (s.weight ?? 0), 0),
        0,
      ),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Volume trend — last 5 avg vs prior 5 avg
  const last5 = totals.slice(-5).map((t) => t.totalVolume);
  const prev5 = totals.slice(-10, -5).map((t) => t.totalVolume);
  let volumeTrend = 60;
  if (last5.length && prev5.length) {
    const a = last5.reduce((s, v) => s + v, 0) / last5.length;
    const b = prev5.reduce((s, v) => s + v, 0) / prev5.length;
    if (b > 0) volumeTrend = Math.max(0, Math.min(100, Math.round((a / b) * 60)));
  }

  // Consistency — sessions in last 30 days, 4+/wk = 100
  const since = Date.now() - 30 * 86400000;
  const recent = totals.filter((t) => new Date(t.date).getTime() >= since).length;
  const consistency = Math.max(0, Math.min(100, Math.round((recent / 17) * 100)));

  const score = Math.round(volumeTrend * 0.5 + consistency * 0.5);
  return { score, volumeTrend, consistency, sessionsLast30Days: recent };
}

// ═════════════════════════════════════════════════════════════════════════════
// PROGRESSIVE OVERLOAD INDICATOR
// ═════════════════════════════════════════════════════════════════════════════

/**
 * For an exercise, returns the suggested next-set weight based on the last
 * session's performance. Follows a simple double-progression rule:
 *   • If all sets hit the top of the rep range → +2.5 kg (compound) or +1 kg (isolation)
 *   • Else → keep same weight, add 1 rep
 */
export function suggestNextWeight(
  exerciseName: string,
  lastSets: { reps: number; weight: number }[],
  targetRepRange: [number, number] = [8, 12],
): { weight: number; reps: number; hint: string } {
  const name = (exerciseName || '').toLowerCase();
  const isCompound = COMPOUND_KEYWORDS.some((k) => name.includes(k));
  const step = isCompound ? 2.5 : 1;

  if (lastSets.length === 0) {
    return { weight: 0, reps: targetRepRange[0], hint: 'First session — start light' };
  }
  const last = lastSets[lastSets.length - 1]!;
  const minTop = lastSets.every((s) => s.reps >= targetRepRange[1]);
  if (minTop) {
    return {
      weight: last.weight + step,
      reps: targetRepRange[0],
      hint: `+${step}kg — all sets hit ${targetRepRange[1]} reps`,
    };
  }
  return {
    weight: last.weight,
    reps: Math.min(last.reps + 1, targetRepRange[1]),
    hint: 'Same weight, add 1 rep',
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// PERSONAL-RECORD (PR) DETECTION
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Flag sets in a just-finished workout that beat the all-time best weight for
 * their exercise (across `history`). Returns immutable copies of the exercises
 * with `isPR` set on each record-breaking set, plus a summary for celebration.
 *
 * A set is a PR if its weight (> 0) exceeds the best weight ever logged for that
 * exercise; within the new workout the bar rises as you beat it, so only genuine
 * new maxes are flagged (not every set).
 */
export function flagPRs(
  exercises: WorkoutExercise[],
  history: Workout[],
): { exercises: WorkoutExercise[]; prCount: number; prExercises: string[] } {
  const bestByEx = new Map<string, number>();
  for (const w of history) {
    for (const ex of w.exercises) {
      const key = (ex.name || '').trim().toLowerCase();
      if (!key) continue;
      const top = Math.max(0, ...ex.sets.map((s) => s.weight ?? 0));
      if (top > (bestByEx.get(key) ?? 0)) bestByEx.set(key, top);
    }
  }

  const prExercises: string[] = [];
  const flagged = exercises.map((ex) => {
    const key = (ex.name || '').trim().toLowerCase();
    let running = bestByEx.get(key) ?? 0;
    let exHasPR = false;
    const sets = ex.sets.map((s) => {
      const w = s.weight ?? 0;
      if (w > 0 && w > running) {
        running = w;
        exHasPR = true;
        return { ...s, isPR: true };
      }
      return { ...s, isPR: false };
    });
    if (exHasPR) prExercises.push(ex.name);
    return { ...ex, sets };
  });

  return { exercises: flagged, prCount: prExercises.length, prExercises };
}

// ═════════════════════════════════════════════════════════════════════════════
// BODYWEIGHT PROGRESSION
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Given BW workouts, returns per-exercise best-rep progression for the
 * Cali dashboard.
 */
export function calcBwProgression(bwWorkouts: BwWorkout[]): {
  exerciseName: string;
  bestReps: number;
  trend: 'up' | 'flat' | 'down';
  sessions: number;
}[] {
  const by = new Map<string, { date: string; best: number }[]>();
  for (const w of bwWorkouts) {
    for (const ex of w.exercises) {
      const best = Math.max(0, ...ex.sets.map((s) => s.reps ?? 0));
      if (!by.has(ex.name)) by.set(ex.name, []);
      by.get(ex.name)!.push({ date: w.date, best });
    }
  }
  return [...by.entries()]
    .map(([name, hist]) => {
      hist.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const first = hist[0]!.best;
      const last = hist[hist.length - 1]!.best;
      const trend = last > first ? 'up' : last < first ? 'down' : 'flat';
      return {
        exerciseName: name,
        bestReps: Math.max(...hist.map((h) => h.best)),
        trend: trend as 'up' | 'flat' | 'down',
        sessions: hist.length,
      };
    })
    .sort((a, b) => b.bestReps - a.bestReps);
}
