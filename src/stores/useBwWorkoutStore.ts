import { create } from 'zustand';
import { readStorage, writeStorage, normalizeWorkoutList } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/constants';
import type { BwWorkout } from '../types/workout';

const loadBwWorkouts = (): BwWorkout[] =>
  normalizeWorkoutList<BwWorkout>(readStorage<BwWorkout[]>(STORAGE_KEYS.BW_WORKOUTS, []));

interface BwWorkoutState {
  bwWorkouts: BwWorkout[];
  hydrate: () => void;
  addWorkout: (w: BwWorkout) => void;
  updateWorkout: (id: string, updates: Partial<BwWorkout>) => void;
  deleteWorkout: (id: string) => void;
  getByDate: (isoDate: string) => BwWorkout[];
}

export const useBwWorkoutStore = create<BwWorkoutState>((set, get) => ({
  bwWorkouts: loadBwWorkouts(),

  hydrate: () => {
    set({ bwWorkouts: loadBwWorkouts() });
  },

  addWorkout: (w) => {
    const updated = [...get().bwWorkouts, w];
    writeStorage(STORAGE_KEYS.BW_WORKOUTS, updated);
    set({ bwWorkouts: updated });
  },

  updateWorkout: (id, updates) => {
    const updated = get().bwWorkouts.map((w) => (w.id === id ? { ...w, ...updates } : w));
    writeStorage(STORAGE_KEYS.BW_WORKOUTS, updated);
    set({ bwWorkouts: updated });
  },

  deleteWorkout: (id) => {
    const updated = get().bwWorkouts.filter((w) => w.id !== id);
    writeStorage(STORAGE_KEYS.BW_WORKOUTS, updated);
    set({ bwWorkouts: updated });
  },

  getByDate: (isoDate) => {
    return get().bwWorkouts.filter((w) => w.date.startsWith(isoDate));
  },
}));
