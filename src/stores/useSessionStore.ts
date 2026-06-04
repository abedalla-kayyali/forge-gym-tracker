import { create } from 'zustand';
import type {
  WorkoutExercise,
  BwWorkoutExercise,
  CardioEntry,
  MuscleGroup,
  WorkoutSet,
} from '../types/workout';
import { STORAGE_KEYS } from '../lib/constants';

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

  // In-progress sets for the exercise currently being entered (lifted out of
  // LogPage so they survive an app close / reload mid-exercise).
  currentSets: WorkoutSet[];

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
  addCurrentSet: (s: WorkoutSet) => void;
  removeCurrentSet: (index: number) => void;
  clearCurrentSets: () => void;
  setRestTimer: (seconds: number) => void;
  startRestTimer: () => void;
  clearRestTimer: () => void;
  reset: () => void;
}

const ACTIVE_KEY = STORAGE_KEYS.ACTIVE_SESSION;
// Resume a session only if it was started within this window — avoids dropping
// the user into a stale "session" with a multi-day timer.
const MAX_RESUME_MS = 12 * 60 * 60 * 1000;

const DEFAULT_STATE = {
  active: false,
  startTime: null as number | null,
  type: 'weighted' as SessionType,
  exercises: [] as WorkoutExercise[],
  bwExercises: [] as BwWorkoutExercise[],
  cardioEntries: [] as Omit<CardioEntry, 'id' | 'date'>[],
  currentSets: [] as WorkoutSet[],
  selectedMuscle: null as MuscleGroup | null,
  selectedExercise: null as string | null,
  restTimerTarget: 90,
  restTimerStart: null as number | null,
};

type PersistedSession = typeof DEFAULT_STATE;

/** Restore a recent active session from localStorage (device-local, never synced). */
function loadInitial(): PersistedSession {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const saved = JSON.parse(raw) as Partial<PersistedSession>;
    if (
      saved.active &&
      typeof saved.startTime === 'number' &&
      Date.now() - saved.startTime < MAX_RESUME_MS
    ) {
      return {
        ...DEFAULT_STATE,
        ...saved,
        exercises: Array.isArray(saved.exercises) ? saved.exercises : [],
        bwExercises: Array.isArray(saved.bwExercises) ? saved.bwExercises : [],
        cardioEntries: Array.isArray(saved.cardioEntries) ? saved.cardioEntries : [],
        currentSets: Array.isArray(saved.currentSets) ? saved.currentSets : [],
      };
    }
    localStorage.removeItem(ACTIVE_KEY);
  } catch {
    /* corrupt / unavailable — start fresh */
  }
  return { ...DEFAULT_STATE };
}

function persist(s: PersistedSession): void {
  try {
    if (s.active) {
      localStorage.setItem(
        ACTIVE_KEY,
        JSON.stringify({
          active: s.active,
          startTime: s.startTime,
          type: s.type,
          selectedMuscle: s.selectedMuscle,
          selectedExercise: s.selectedExercise,
          exercises: s.exercises,
          bwExercises: s.bwExercises,
          cardioEntries: s.cardioEntries,
          currentSets: s.currentSets,
          restTimerTarget: s.restTimerTarget,
          restTimerStart: s.restTimerStart,
        }),
      );
    } else {
      localStorage.removeItem(ACTIVE_KEY);
    }
  } catch {
    /* storage full / unavailable — keep going in-memory */
  }
}

export const useSessionStore = create<SessionState>((set, get) => {
  const save = () => persist(get() as unknown as PersistedSession);
  return {
    ...loadInitial(),

    start: (type = 'weighted') => {
      set({
        active: true,
        startTime: Date.now(),
        type,
        exercises: [],
        bwExercises: [],
        cardioEntries: [],
        currentSets: [],
        selectedMuscle: null,
        selectedExercise: null,
      });
      save();
    },

    end: () => { set({ active: false }); save(); },

    setType: (t) => { set({ type: t, selectedMuscle: null, selectedExercise: null, currentSets: [] }); save(); },
    setMuscle: (m) => { set({ selectedMuscle: m }); save(); },
    setExercise: (name) => { set({ selectedExercise: name }); save(); },

    addExercise: (e) => { set((s) => ({ exercises: [...s.exercises, e] })); save(); },
    addBwExercise: (e) => { set((s) => ({ bwExercises: [...s.bwExercises, e] })); save(); },
    addCardioEntry: (e) => { set((s) => ({ cardioEntries: [...s.cardioEntries, e] })); save(); },

    addCurrentSet: (cs) => { set((s) => ({ currentSets: [...s.currentSets, cs] })); save(); },
    removeCurrentSet: (index) => { set((s) => ({ currentSets: s.currentSets.filter((_, i) => i !== index) })); save(); },
    clearCurrentSets: () => { set({ currentSets: [] }); save(); },

    setRestTimer: (seconds) => { set({ restTimerTarget: seconds }); save(); },
    startRestTimer: () => { set({ restTimerStart: Date.now() }); save(); },
    clearRestTimer: () => { set({ restTimerStart: null }); save(); },

    reset: () => { set({ ...DEFAULT_STATE }); persist({ ...DEFAULT_STATE }); },
  };
});
