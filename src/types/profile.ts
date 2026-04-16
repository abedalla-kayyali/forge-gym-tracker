export interface UserProfile {
  name: string;
  age?: number;
  weight_kg?: number;
  height_cm?: number;
  experience_level?: 'beginner' | 'intermediate' | 'advanced';
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
