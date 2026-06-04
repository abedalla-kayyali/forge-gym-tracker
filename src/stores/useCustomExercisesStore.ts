import { create } from 'zustand';
import { readStorage, writeStorage } from '../lib/storage';
import type { MuscleGroup } from '../types/workout';

const KEY = 'forge-custom-exercises-v1';

type CustomMap = Partial<Record<MuscleGroup | 'unknown', string[]>>;

interface CustomState {
  customExercises: CustomMap;
  addCustom: (muscle: string, name: string) => void;
  removeCustom: (muscle: string, name: string) => void;
  getFor: (muscle: string) => string[];
  hydrate: () => void;
}

export const useCustomExercisesStore = create<CustomState>((set, get) => ({
  customExercises: readStorage<CustomMap>(KEY, {}),

  hydrate: () => {
    set({ customExercises: readStorage<CustomMap>(KEY, {}) });
  },

  addCustom: (muscle, name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const key = (muscle || 'unknown').toLowerCase() as MuscleGroup | 'unknown';
    const current = get().customExercises[key] ?? [];
    const normalized = trimmed.toLowerCase();
    if (current.some((n) => n.toLowerCase() === normalized)) return; // already saved
    const next = { ...get().customExercises, [key]: [...current, trimmed] };
    writeStorage(KEY, next);
    set({ customExercises: next });
  },

  removeCustom: (muscle, name) => {
    const key = (muscle || 'unknown').toLowerCase() as MuscleGroup | 'unknown';
    const current = get().customExercises[key] ?? [];
    const next = { ...get().customExercises, [key]: current.filter((n) => n !== name) };
    writeStorage(KEY, next);
    set({ customExercises: next });
  },

  getFor: (muscle) => {
    const key = (muscle || 'unknown').toLowerCase() as MuscleGroup | 'unknown';
    return get().customExercises[key] ?? [];
  },
}));
