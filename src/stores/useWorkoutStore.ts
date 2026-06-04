import { create } from 'zustand';
import { readStorage, writeStorage, normalizeWorkoutList } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/constants';
import type { Workout } from '../types/workout';

const loadWorkouts = (): Workout[] =>
  normalizeWorkoutList<Workout>(readStorage<Workout[]>(STORAGE_KEYS.WORKOUTS, []));

interface WorkoutState {
  workouts: Workout[];
  hydrate: () => void;
  addWorkout: (w: Workout) => void;
  updateWorkout: (id: string, updates: Partial<Workout>) => void;
  deleteWorkout: (id: string) => void;
  getByDate: (isoDate: string) => Workout[];
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  workouts: loadWorkouts(),

  hydrate: () => {
    set({ workouts: loadWorkouts() });
  },

  addWorkout: (w) => {
    const updated = [...get().workouts, w];
    writeStorage(STORAGE_KEYS.WORKOUTS, updated);
    set({ workouts: updated });
  },

  updateWorkout: (id, updates) => {
    const updated = get().workouts.map((w) => (w.id === id ? { ...w, ...updates } : w));
    writeStorage(STORAGE_KEYS.WORKOUTS, updated);
    set({ workouts: updated });
  },

  deleteWorkout: (id) => {
    const updated = get().workouts.filter((w) => w.id !== id);
    writeStorage(STORAGE_KEYS.WORKOUTS, updated);
    set({ workouts: updated });
  },

  getByDate: (isoDate) => {
    return get().workouts.filter((w) => w.date.startsWith(isoDate));
  },
}));
