export type Sex = 'male' | 'female';
export type FitnessGoal = 'lose_fat' | 'build_muscle' | 'recomp' | 'strength' | 'general';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export interface UserProfile {
  name: string;
  age?: number;
  weight_kg?: number;
  height_cm?: number;
  experience_level?: ExperienceLevel;
  /** Biological sex — used to tailor program emphasis + calorie/macro math. */
  sex?: Sex;
  /** Primary training goal — drives the recommended program + macros. */
  goal?: FitnessGoal;
  goals?: string[];
  avatar_url?: string;
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'auto';
  accent: string;
  sound: boolean;
  haptic: boolean;
  language: 'en' | 'ar';
  customBg?: string;
  layout?: DashboardLayout;
}

export interface DashboardLayout {
  sections: string[];
  order: string[];
  hidden?: string[];
}

export interface Readiness {
  score: number;
  sleep_hours: number;
  stress: number;
  notes?: string;
  timestamp?: string;
}

export type ReadinessLog = Record<string, Readiness>;
