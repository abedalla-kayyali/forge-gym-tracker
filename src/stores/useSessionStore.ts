import { create } from 'zustand';
import type { WorkoutExercise, MuscleGroup } from '../types/workout';

interface SessionState {
  active: boolean;
  startTime: number | null;
  exercises: WorkoutExercise[];
  selectedMuscle: MuscleGroup | null;
  selectedExercise: string | null;
  restTimerTarget: number;
  restTimerStart: number | null;
  start: () => void;
  end: () => void;
  setMuscle: (m: MuscleGroup | null) => void;
  setExercise: (name: string | null) => void;
  addExercise: (e: WorkoutExercise) => void;
  setRestTimer: (seconds: number) => void;
  startRestTimer: () => void;
  clearRestTimer: () => void;
  reset: () => void;
}

const DEFAULT_STATE = {
  active: false,
  startTime: null,
  exercises: [] as WorkoutExercise[],
  selectedMuscle: null,
  selectedExercise: null,
  restTimerTarget: 90,
  restTimerStart: null,
};

export const useSessionStore = create<SessionState>((set) => ({
  ...DEFAULT_STATE,

  start: () => {
    set({ active: true, startTime: Date.now(), exercises: [] });
  },

  end: () => {
    set({ active: false });
  },

  setMuscle: (m) => {
    set({ selectedMuscle: m });
  },

  setExercise: (name) => {
    set({ selectedExercise: name });
  },

  addExercise: (e) => {
    set((state) => ({ exercises: [...state.exercises, e] }));
  },

  setRestTimer: (seconds) => {
    set({ restTimerTarget: seconds });
  },

  startRestTimer: () => {
    set({ restTimerStart: Date.now() });
  },

  clearRestTimer: () => {
    set({ restTimerStart: null });
  },

  reset: () => {
    set({ ...DEFAULT_STATE });
  },
}));
