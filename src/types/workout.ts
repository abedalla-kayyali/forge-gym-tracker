export interface WorkoutSet {
  reps: number;
  weight: number;
  rpe?: number;
  isWarmup?: boolean;
  isPR?: boolean;
}

export interface WorkoutExercise {
  name: string;
  muscle: string;
  sets: WorkoutSet[];
  durationSecs?: number;
  notes?: string;
}

export interface Workout {
  id: string;
  date: string; // ISO 8601
  name: string;
  exercises: WorkoutExercise[];
  duration?: number; // minutes
  effort?: number; // 1-5 scale
  quality?: number; // 1-5 scale
  notes?: string;
}

export interface BwExerciseSet {
  reps: number;
  variation?: string;
  assisted?: boolean;
  /** Extra load (kg) for the "weighted" variation (e.g. weighted pull-ups/dips). */
  addedWeight?: number;
}

export interface BwWorkoutExercise {
  name: string;
  muscle: string;
  sets: BwExerciseSet[];
  durationSecs?: number;
}

export interface BwWorkout {
  id: string;
  date: string;
  name: string;
  exercises: BwWorkoutExercise[];
  duration?: number;
  effort?: number;
}

export interface CardioEntry {
  id: string;
  type: string;
  date: string;
  duration: number; // minutes
  distance?: number; // km
  intensity?: string;
  heartRate?: number;
  notes?: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: Array<{
    name: string;
    muscle: string;
    sets: number;
    reps: number;
    weight?: number;
  }>;
}

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'core'
  | 'legs'
  | 'glutes'
  | 'calves';
