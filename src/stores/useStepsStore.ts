import { create } from 'zustand';
import { readStorage, writeStorage } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/constants';

interface StepsState {
  steps: Record<string, number>;
  goal: number;
  hydrate: () => void;
  addSteps: (date: string, count: number) => void;
  setGoal: (goal: number) => void;
  getTodaySteps: () => number;
  getTodayProgress: () => number;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export const useStepsStore = create<StepsState>((set, get) => ({
  steps: readStorage<Record<string, number>>(STORAGE_KEYS.STEPS, {}),
  goal: parseInt(readStorage(STORAGE_KEYS.STEP_GOAL, '10000'), 10),

  hydrate: () => {
    set({
      steps: readStorage<Record<string, number>>(STORAGE_KEYS.STEPS, {}),
      goal: parseInt(readStorage(STORAGE_KEYS.STEP_GOAL, '10000'), 10),
    });
  },

  addSteps: (date, count) => {
    const current = get().steps;
    const existing = current[date] ?? 0;
    const updated = { ...current, [date]: existing + count };
    writeStorage(STORAGE_KEYS.STEPS, updated);
    set({ steps: updated });
  },

  setGoal: (goal) => {
    writeStorage(STORAGE_KEYS.STEP_GOAL, String(goal));
    set({ goal });
  },

  getTodaySteps: () => {
    return get().steps[todayKey()] ?? 0;
  },

  getTodayProgress: () => {
    const { goal } = get();
    if (goal <= 0) return 0;
    const today = get().steps[todayKey()] ?? 0;
    return Math.min(100, Math.round((today / goal) * 100));
  },
}));
