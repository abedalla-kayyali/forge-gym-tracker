import { create } from 'zustand';
import { readStorage, writeStorage } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/constants';
import type { FitnessGoal, UserProfile } from '../types/profile';

/** Direction the user wants their body-weight trend to move. */
export type WeightDirection = 'lose' | 'gain' | 'maintain';

export const WEEKLY_SESSIONS_MIN = 1;
export const WEEKLY_SESSIONS_MAX = 14;
export const WEEKLY_SESSIONS_DEFAULT = 4;

export function clampWeeklySessions(n: number): number {
  if (!Number.isFinite(n)) return WEEKLY_SESSIONS_DEFAULT;
  return Math.max(WEEKLY_SESSIONS_MIN, Math.min(WEEKLY_SESSIONS_MAX, Math.round(n)));
}

interface GoalsExtra {
  /** Target body-weight in kg; null = not set. */
  targetWeightKg: number | null;
  /** Which way the weight trend should move (colors lagging KPIs). */
  weightDirection: WeightDirection;
  /** Daily protein target in grams; null = fall back to macroTargets.protein_g. */
  proteinTargetG: number | null;
}

interface GoalsState extends GoalsExtra {
  /** Training sessions per week the user committed to (1–14). */
  weeklySessions: number;
  hydrate: () => void;
  setWeeklySessions: (n: number) => void;
  setTargetWeightKg: (kg: number | null) => void;
  setWeightDirection: (d: WeightDirection) => void;
  setProteinTargetG: (g: number | null) => void;
}

function directionFromGoal(goal: FitnessGoal | undefined): WeightDirection {
  switch (goal) {
    case 'lose_fat':     return 'lose';
    case 'build_muscle':
    case 'strength':     return 'gain';
    default:             return 'maintain';
  }
}

/** Weekly sessions live under the legacy `forge_weekly_goal` key (back compat). */
function loadWeeklySessions(): number {
  const v = Number(readStorage<number>(STORAGE_KEYS.WEEKLY_GOAL, WEEKLY_SESSIONS_DEFAULT));
  return Number.isFinite(v) && v > 0 ? clampWeeklySessions(v) : WEEKLY_SESSIONS_DEFAULT;
}

function loadExtra(): GoalsExtra {
  const raw = readStorage<Partial<GoalsExtra> | null>(STORAGE_KEYS.GOALS, null);
  if (raw && typeof raw === 'object') {
    const dir = raw.weightDirection;
    return {
      targetWeightKg:
        typeof raw.targetWeightKg === 'number' && raw.targetWeightKg > 0 ? raw.targetWeightKg : null,
      weightDirection: dir === 'lose' || dir === 'gain' || dir === 'maintain'
        ? dir
        : directionFromGoal(readStorage<UserProfile>(STORAGE_KEYS.PROFILE, { name: '' }).goal),
      proteinTargetG:
        typeof raw.proteinTargetG === 'number' && raw.proteinTargetG > 0 ? raw.proteinTargetG : null,
    };
  }
  // First run — derive the direction once from the profile goal if available.
  const profile = readStorage<UserProfile>(STORAGE_KEYS.PROFILE, { name: '' });
  return { targetWeightKg: null, weightDirection: directionFromGoal(profile.goal), proteinTargetG: null };
}

function persistExtra(s: GoalsExtra): void {
  writeStorage(STORAGE_KEYS.GOALS, {
    targetWeightKg: s.targetWeightKg,
    weightDirection: s.weightDirection,
    proteinTargetG: s.proteinTargetG,
  });
}

/**
 * Reactive goals store — the single source of truth for "what am I aiming at".
 * Weekly sessions keep the legacy `forge_weekly_goal` storage key so existing
 * data (and the legacy app) stay compatible; the extra targets persist under
 * `forge_goals`.
 */
export const useGoalsStore = create<GoalsState>((set, get) => ({
  weeklySessions: loadWeeklySessions(),
  ...loadExtra(),

  hydrate: () => {
    set({ weeklySessions: loadWeeklySessions(), ...loadExtra() });
  },

  setWeeklySessions: (n) => {
    const clamped = clampWeeklySessions(n);
    writeStorage(STORAGE_KEYS.WEEKLY_GOAL, clamped);
    set({ weeklySessions: clamped });
  },

  setTargetWeightKg: (kg) => {
    const value = kg !== null && Number.isFinite(kg) && kg > 0 ? +kg.toFixed(1) : null;
    set({ targetWeightKg: value });
    persistExtra(get());
  },

  setWeightDirection: (d) => {
    set({ weightDirection: d });
    persistExtra(get());
  },

  setProteinTargetG: (g) => {
    const value = g !== null && Number.isFinite(g) && g > 0 ? Math.round(g) : null;
    set({ proteinTargetG: value });
    persistExtra(get());
  },
}));
