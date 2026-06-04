import { create } from 'zustand';
import type {
  WorkoutExercise,
  BwWorkoutExercise,
  CardioEntry,
  MuscleGroup,
} from '../types/workout';

export type SessionType = 'weighted' | 'bodyweight' | 'cardio';

interface SessionState {
  active: boolean;
  startTime: number | null;
  type: SessionType;

  // Shared pick state (used by weighted + bodyweight)
  selectedMuscle: MuscleGroup | null;
  selectedExercise: string | null;

  // Per-type working arrays
  exercises: WorkoutExercise[];        // weighted
  bwExercises: BwWorkoutExercise[];    // bodyweight / calisthenics
  cardioEntries: Omit<CardioEntry, 'id' | 'date'>[]; // cardio (ids assigned on save)

  restTimerTarget: number;
  restTimerStart: number | null;

  start: (type?: SessionType) => void;
  end: () => void;
  setType: (t: SessionType) => void;
  setMuscle: (m: MuscleGroup | null) => void;
  setExercise: (name: string | null) => void;
  addExercise: (e: WorkoutExercise) => void;
  addBwExercise: (e: BwWorkoutExercise) => void;
  addCardioEntry: (e: Omit<CardioEntry, 'id' | 'date'>) => void;
  setRestTimer: (seconds: number) => void;
  startRestTimer: () => void;
  clearRestTimer: () => void;
  reset: () => void;
}

const DEFAULT_STATE = {
  active: false,
  startTime: null,
  type: 'weighted' as SessionType,
  exercises: [] as WorkoutExercise[],
  bwExercises: [] as BwWorkoutExercise[],
  cardioEntries: [] as Omit<CardioEntry, 'id' | 'date'>[],
  selectedMuscle: null,
  selectedExercise: null,
  restTimerTarget: 90,
  restTimerStart: null,
};

export const useSessionStore = create<SessionState>((set) => ({
  ...DEFAULT_STATE,

  start: (type = 'weighted') => {
    set({
      active: true,
      startTime: Date.now(),
      type,
      exercises: [],
      bwExercises: [],
      cardioEntries: [],
    });
  },

  end: () => {
    set({ active: false });
  },

  setType: (t) => set({ type: t, selectedMuscle: null, selectedExercise: null }),
  setMuscle: (m) => set({ selectedMuscle: m }),
  setExercise: (name) => set({ selectedExercise: name }),

  addExercise: (e) => set((s) => ({ exercises: [...s.exercises, e] })),
  addBwExercise: (e) => set((s) => ({ bwExercises: [...s.bwExercises, e] })),
  addCardioEntry: (e) => set((s) => ({ cardioEntries: [...s.cardioEntries, e] })),

  setRestTimer: (seconds) => set({ restTimerTarget: seconds }),
  startRestTimer: () => set({ restTimerStart: Date.now() }),
  clearRestTimer: () => set({ restTimerStart: null }),

  reset: () => set({ ...DEFAULT_STATE }),
}));
