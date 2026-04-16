export interface CoachTrigger {
  type: 'recovery' | 'overload' | 'deload' | 'plateau' | 'pr';
  muscle?: string;
  message: string;
  severity: 'info' | 'warning' | 'success';
  timestamp: string;
}

export interface TrainingProgram {
  id: string;
  name: string;
  generated_at?: string;
  weeks: ProgramWeek[];
  currentWeek?: number;
}

export interface ProgramWeek {
  days: ProgramDay[];
}

export interface ProgramDay {
  name: string;
  focus_muscles: string[];
  exercises: ProgramExercise[];
}

export interface ProgramExercise {
  name: string;
  sets: number;
  reps: number;
  rpe?: number;
  notes?: string;
}

export interface TrainingSplit {
  name: string;
  days: Array<{
    name: string;
    focus_muscles: string[];
  }>;
}

export interface Goal {
  type: string;
  target: number | string;
  deadline?: string;
  progress?: number;
}
