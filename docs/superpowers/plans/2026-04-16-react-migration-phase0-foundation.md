# FORGE React Migration — Phase 0 & 1: Foundation + Data Layer

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up Vite + React + TypeScript project with all tooling, create the typed localStorage bridge, build all Zustand stores, and wire up Supabase auth — so that the React app can read/write the exact same data as the old vanilla JS app.

**Architecture:** Parallel build strategy. The React app lives in `src/` alongside the existing `index.html`. Both apps share localStorage via a typed bridge (`lib/storage.ts`). Zustand stores hydrate from localStorage on mount and persist every mutation. The old app is never modified.

**Tech Stack:** React 19, Vite 6, TypeScript 5.7, Zustand 5, React Router 7, Tailwind CSS 4, react-i18next 15, Recharts 2, vite-plugin-pwa, Vitest, Playwright, @use-gesture/react

---

## File Structure (Phase 0 + 1)

```
forge/                          (existing repo root)
|-- index.html                  EXISTING — untouched
|-- js/                         EXISTING — untouched
|-- css/                        EXISTING — untouched
|
|-- package.json                CREATE
|-- vite.config.ts              CREATE
|-- tailwind.config.ts          CREATE
|-- tsconfig.json               CREATE
|-- tsconfig.node.json          CREATE
|-- .eslintrc.cjs               CREATE
|-- .prettierrc                 CREATE
|-- postcss.config.js           CREATE
|
|-- public/                     MOVE icons + manifest here
|   |-- icons/                  MOVE from ./icons/
|   |-- manifest.json           COPY from ./manifest.json (adapt paths)
|   +-- sounds/                 CREATE (empty for now)
|
+-- src/
    |-- main.tsx                CREATE — React entry
    |-- App.tsx                 CREATE — Root with Router placeholder
    |-- index.css               CREATE — Tailwind directives
    |-- vite-env.d.ts           CREATE — Vite type declarations
    |
    |-- types/
    |   |-- workout.ts          CREATE
    |   |-- profile.ts          CREATE
    |   |-- nutrition.ts        CREATE
    |   |-- body.ts             CREATE
    |   |-- social.ts           CREATE
    |   |-- gamification.ts     CREATE
    |   +-- coach.ts            CREATE
    |
    |-- lib/
    |   |-- constants.ts        CREATE — STORAGE_KEYS registry
    |   |-- storage.ts          CREATE — typed localStorage bridge
    |   |-- supabase.ts         CREATE — client init
    |   +-- i18n.ts             CREATE — react-i18next config
    |
    |-- stores/
    |   |-- useWorkoutStore.ts  CREATE
    |   |-- useBwWorkoutStore.ts CREATE
    |   |-- useCardioStore.ts   CREATE
    |   |-- useProfileStore.ts  CREATE
    |   |-- useSettingsStore.ts CREATE
    |   |-- useNutritionStore.ts CREATE
    |   |-- useBodyStore.ts     CREATE
    |   |-- useStepsStore.ts    CREATE
    |   |-- useSessionStore.ts  CREATE
    |   +-- useGamificationStore.ts CREATE
    |
    |-- hooks/
    |   +-- useAuth.ts          CREATE
    |
    |-- i18n/
    |   |-- en.json             CREATE (starter — full extraction in Phase 9)
    |   +-- ar.json             CREATE (starter)
    |
    +-- test/
        +-- setup.ts            CREATE — Vitest global setup
```

---

## Task 1: Initialize Vite + React + TypeScript project

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/vite-env.d.ts`
- Create: `src/index.css`
- Create: `.eslintrc.cjs`
- Create: `.prettierrc`
- Create: `postcss.config.js`
- Create: `tailwind.config.ts`

- [ ] **Step 1: Scaffold the Vite project**

Run from repo root:
```bash
npm create vite@latest . -- --template react-ts
```

If it prompts about existing files, choose to proceed (it won't touch index.html or js/).

- [ ] **Step 2: Install core dependencies**

```bash
npm install react@19 react-dom@19 react-router@7 zustand@5 react-i18next@15 i18next@24 recharts@2 @use-gesture/react@latest
```

- [ ] **Step 3: Install dev dependencies**

```bash
npm install -D @types/react@19 @types/react-dom@19 typescript@5.7 vite@6 @vitejs/plugin-react tailwindcss@4 postcss autoprefixer eslint prettier eslint-config-prettier @eslint/js typescript-eslint vitest @testing-library/react @testing-library/jest-dom jsdom vite-plugin-pwa
```

- [ ] **Step 4: Configure Vite**

Create `vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'FORGE — Gym Tracker',
        short_name: 'FORGE',
        description: 'Your personal gym operating system',
        theme_color: '#2ecc71',
        background_color: '#080c09',
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

- [ ] **Step 5: Configure TypeScript**

Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "paths": {
      "@/*": ["./src/*"]
    },
    "baseUrl": "."
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 6: Configure Tailwind CSS 4**

Create `postcss.config.js`:
```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

Create `tailwind.config.ts`:
```typescript
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forge: {
          green: '#2ecc71',
          bg: '#080c09',
          surface: '#0f1a12',
          border: '#1a2e1f',
          text: '#e0e0e0',
          muted: '#8a8a8a',
        },
      },
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
        condensed: ['Barlow Condensed', 'sans-serif'],
        body: ['Barlow', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
```

Create `src/index.css`:
```css
@import 'tailwindcss';

@layer base {
  body {
    @apply bg-forge-bg text-forge-text font-body antialiased;
    -webkit-tap-highlight-color: transparent;
  }
}
```

- [ ] **Step 7: Configure ESLint + Prettier**

Create `.eslintrc.cjs`:
```javascript
module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'js/', 'css/', 'sw.js'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
};
```

Create `.prettierrc`:
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100
}
```

- [ ] **Step 8: Create React entry point**

Create `src/vite-env.d.ts`:
```typescript
/// <reference types="vite/client" />
```

Create `src/App.tsx`:
```tsx
export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-forge-green text-4xl font-display">FORGE</h1>
      <p className="text-forge-muted mt-2">React migration in progress</p>
    </div>
  );
}
```

Create `src/main.tsx`:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 9: Configure Vitest**

Add to `vite.config.ts` — replace the existing export with:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'FORGE — Gym Tracker',
        short_name: 'FORGE',
        description: 'Your personal gym operating system',
        theme_color: '#2ecc71',
        background_color: '#080c09',
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
});
```

Create `src/test/setup.ts`:
```typescript
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 10: Copy static assets to public/**

```bash
mkdir -p public/icons public/sounds
cp icons/icon-192.png icons/icon-512.png icons/icon.svg public/icons/ 2>/dev/null || true
```

- [ ] **Step 11: Verify the dev server starts**

```bash
npm run dev
```

Expected: Browser opens at `http://localhost:5173` showing "FORGE" in green text.

- [ ] **Step 12: Verify the build succeeds**

```bash
npm run build
```

Expected: `dist/` directory created with `index.html`, JS bundle, CSS bundle.

- [ ] **Step 13: Commit**

```bash
git add package.json package-lock.json vite.config.ts tsconfig.json tsconfig.node.json .eslintrc.cjs .prettierrc postcss.config.js tailwind.config.ts src/ public/
git commit -m "feat: initialize Vite + React + TypeScript project

Parallel build alongside existing vanilla JS app.
React app at localhost:5173, old app at index.html.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Create TypeScript type definitions

**Files:**
- Create: `src/types/workout.ts`
- Create: `src/types/profile.ts`
- Create: `src/types/nutrition.ts`
- Create: `src/types/body.ts`
- Create: `src/types/social.ts`
- Create: `src/types/gamification.ts`
- Create: `src/types/coach.ts`

These types are derived directly from the actual localStorage data shapes found in the existing codebase.

- [ ] **Step 1: Create workout types**

Create `src/types/workout.ts`:
```typescript
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
  type: string; // 'run' | 'bike' | 'swim' | 'walk' | 'hike' | 'row' | 'other'
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
```

- [ ] **Step 2: Create profile types**

Create `src/types/profile.ts`:
```typescript
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
  accent: string; // hex color
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

export type ReadinessLog = Record<string, Readiness>; // keyed by ISO date
```

- [ ] **Step 3: Create nutrition types**

Create `src/types/nutrition.ts`:
```typescript
export interface Meal {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servings?: number;
}

export interface DayMeals {
  meals: Meal[];
}

export type MealsLog = Record<string, DayMeals>; // keyed by ISO date "2026-04-16"

export type MealLibrary = Record<string, Meal>; // keyed by meal name

export interface MacroTargets {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  target_date?: string;
}

export interface WaterLog {
  cups_drunk: number;
  goal_cups: number;
}

export type WaterHistory = Record<string, WaterLog>; // keyed by ISO date
```

- [ ] **Step 4: Create body types**

Create `src/types/body.ts`:
```typescript
export interface BodyWeightEntry {
  date: string;
  weight_kg: number;
  notes?: string;
}

export interface Measurement {
  date: string;
  chest?: number;
  waist?: number;
  hips?: number;
  left_arm?: number;
  right_arm?: number;
  left_thigh?: number;
  right_thigh?: number;
  left_calf?: number;
  right_calf?: number;
  shoulders?: number;
  neck?: number;
  notes?: string;
}

export interface InBodyEntry {
  date: string;
  muscle_mass?: number;
  body_fat?: number;
  body_fat_pct?: number;
  water?: number;
  bmi?: number;
  notes?: string;
}

export interface BodyPhoto {
  id: string;
  date: string;
  dataUrl: string; // base64
  type: 'front' | 'side' | 'back';
  notes?: string;
}
```

- [ ] **Step 5: Create social types**

Create `src/types/social.ts`:
```typescript
export interface DuelState {
  opponent: string;
  score: number;
  opponentScore?: number;
  end_date: string;
  type?: string;
  status?: 'active' | 'completed' | 'expired';
}

export interface CommunityItem {
  id: string;
  type: 'exercise' | 'meal';
  name: string;
  data: Record<string, unknown>;
  author?: string;
  created_at?: string;
}
```

- [ ] **Step 6: Create gamification types**

Create `src/types/gamification.ts`:
```typescript
export interface Achievement {
  id: string;
  name: string;
  unlocked_date?: string;
  description?: string;
}

export interface XPLevel {
  level: number;
  name: string;
  icon: string;
  minXP: number;
  maxXP: number;
}

export type Rank = 'rookie' | 'iron' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'legend';
```

- [ ] **Step 7: Create coach types**

Create `src/types/coach.ts`:
```typescript
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
```

- [ ] **Step 8: Commit**

```bash
git add src/types/
git commit -m "feat: add TypeScript type definitions for all data models

Types derived from actual localStorage data shapes.
Covers: workouts, profile, nutrition, body, social, gamification, coach.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Create storage bridge and constants registry

**Files:**
- Create: `src/lib/constants.ts`
- Create: `src/lib/storage.ts`
- Test: `src/lib/__tests__/storage.test.ts`

This is the most critical file in the migration. It must read/write the exact same localStorage keys with the exact same JSON format as the old app.

- [ ] **Step 1: Write failing tests for storage bridge**

Create `src/lib/__tests__/storage.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { readStorage, writeStorage, removeStorage } from '../storage';

describe('storage bridge', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns fallback when key does not exist', () => {
    const result = readStorage<string[]>('nonexistent', []);
    expect(result).toEqual([]);
  });

  it('reads JSON data written by old app format', () => {
    // Simulate old app writing data
    localStorage.setItem(
      'forge_workouts',
      JSON.stringify([{ id: 'w1', date: '2026-04-16', name: 'Push', exercises: [] }]),
    );
    const result = readStorage<Array<{ id: string }>>('forge_workouts', []);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('w1');
  });

  it('writes JSON data readable by old app', () => {
    writeStorage('forge_workouts', [{ id: 'w2', date: '2026-04-16' }]);
    const raw = localStorage.getItem('forge_workouts');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed[0].id).toBe('w2');
  });

  it('reads plain string values (theme, lang)', () => {
    localStorage.setItem('forge_lang', 'ar');
    const result = readStorage<string>('forge_lang', 'en');
    expect(result).toBe('ar');
  });

  it('handles corrupt JSON gracefully', () => {
    localStorage.setItem('forge_workouts', '{invalid json');
    const result = readStorage<string[]>('forge_workouts', []);
    expect(result).toEqual([]);
  });

  it('removes a key', () => {
    localStorage.setItem('forge_test', '"value"');
    removeStorage('forge_test');
    expect(localStorage.getItem('forge_test')).toBeNull();
  });

  it('reads string flags without JSON wrapping', () => {
    // Old app stores some values as plain strings, not JSON
    localStorage.setItem('forge_sound', 'off');
    const result = readStorage<string>('forge_sound', 'on');
    expect(result).toBe('off');
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx vitest run src/lib/__tests__/storage.test.ts
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Create constants registry**

Create `src/lib/constants.ts`:
```typescript
export const STORAGE_KEYS = {
  // Workout data
  WORKOUTS: 'forge_workouts',
  BW_WORKOUTS: 'forge_bw_workouts',
  CARDIO: 'forge_cardio',
  TEMPLATES: 'forge_templates',

  // Profile & settings
  PROFILE: 'forge_profile',
  SETTINGS: 'forge_settings',
  THEME: 'forge_theme',
  ACCENT: 'forge_accent',
  LANG: 'forge_lang',
  SOUND: 'forge_sound',
  HAPTIC: 'forge_haptic',
  LAYOUT: 'forge_layout',
  CUSTOM_BG: 'forge_custom_bg',
  DNN: 'forge_dnn',

  // Body & measurements
  BODY_WEIGHT: 'forge_bodyweight',
  MEASUREMENTS: 'forge_measurements',
  INBODY: 'forge_inbody_tests',

  // Nutrition
  MEALS: 'forge_meals',
  MEAL_LIBRARY: 'forge_meal_library',
  MACRO_TARGETS: 'forge_macro_targets',
  WATER: 'forge_water',

  // Steps & health
  STEPS: 'forge_steps',
  STEP_GOAL: 'forge_step_goal',
  READINESS: 'forge_readiness',
  READINESS_TODAY: 'forge_readiness_today',
  CHECKINS: 'forge_checkins',

  // Coach & programs
  ACTIVE_PROGRAM: 'forge_active_program',
  AI_PROGRAM: 'forge_ai_program',
  SPLIT: 'forge_split',
  MESOCYCLE: 'forge_mesocycle',
  MRV_CONFIG: 'forge_mrv_config',
  DELOAD_DATA: 'forge_deload_data',
  LAST_DEBRIEF: 'forge_last_debrief',

  // Social
  DUEL_STATE: 'forge_duel_state_v2',

  // Gamification
  ACHIEVEMENTS: 'forge_achievements',
  EXPERIENCE: 'forge_experience',
  GOAL: 'forge_goal',

  // Custom user content
  BW_CUSTOM_EXERCISES: 'forge_bw_custom_exercises',
  CARDIO_CUSTOM_TYPES: 'forge_cardio_custom_types',
  SAVED_ANSWERS: 'forge_saved_answers',

  // Flags & meta
  GUEST: 'forge_guest',
  ONBOARDING_DONE: 'forge_onboarding_v238_done',
  SCHEMA_VERSION: 'forge_schema_version',
  PROGRESS_CARD_LAST: 'forge_progress_card_last_sunday',
  DITTO_TIP_SHOWN: 'forge_ditto_tip_shown',
  FEATURE_TIPS_SHOWN: 'forge_feature_tips_shown',
  REENGAGEMENT_SHOWN: 'forge_reengagement_shown',

  // Profile name variants (legacy)
  NAME: 'forge_name',
  USERNAME: 'forge_username',
  PROFILE_NAME: 'forge_profile_name',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
```

- [ ] **Step 4: Create storage bridge**

Create `src/lib/storage.ts`:
```typescript
/**
 * Typed localStorage bridge.
 *
 * Reads and writes the exact same keys and JSON format as the legacy
 * vanilla JS app. This is THE critical compatibility layer — if this
 * breaks, data flows between old and new app stop working.
 *
 * Rules:
 * 1. Keys must match STORAGE_KEYS in constants.ts
 * 2. JSON format must match what the old app writes
 * 3. Plain string values (theme, lang, sound) are stored WITHOUT JSON.stringify wrapping
 */

const PLAIN_STRING_KEYS = new Set([
  'forge_theme',
  'forge_accent',
  'forge_lang',
  'forge_sound',
  'forge_haptic',
  'forge_dnn',
  'forge_custom_bg',
  'forge_guest',
  'forge_onboarding_v238_done',
  'forge_schema_version',
  'forge_last_debrief',
  'forge_progress_card_last_sunday',
  'forge_ditto_tip_shown',
  'forge_reengagement_shown',
  'forge_step_goal',
  'forge_name',
  'forge_username',
  'forge_profile_name',
]);

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;

    // Plain string keys are not JSON-wrapped
    if (PLAIN_STRING_KEYS.has(key)) {
      return raw as unknown as T;
    }

    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T): void {
  if (PLAIN_STRING_KEYS.has(key)) {
    localStorage.setItem(key, String(value));
  } else {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

export function removeStorage(key: string): void {
  localStorage.removeItem(key);
}
```

- [ ] **Step 5: Run tests — verify they pass**

```bash
npx vitest run src/lib/__tests__/storage.test.ts
```

Expected: All 7 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/constants.ts src/lib/storage.ts src/lib/__tests__/storage.test.ts
git commit -m "feat: add typed localStorage bridge and constants registry

44 storage keys mapped. Handles both JSON and plain string values.
Compatible with existing vanilla JS app data format.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Create Zustand stores (workout, bw-workout, cardio)

**Files:**
- Create: `src/stores/useWorkoutStore.ts`
- Create: `src/stores/useBwWorkoutStore.ts`
- Create: `src/stores/useCardioStore.ts`
- Test: `src/stores/__tests__/useWorkoutStore.test.ts`

- [ ] **Step 1: Write failing tests for workout store**

Create `src/stores/__tests__/useWorkoutStore.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useWorkoutStore } from '../useWorkoutStore';
import type { Workout } from '../../types/workout';

const mockWorkout: Workout = {
  id: 'w_test_1',
  date: '2026-04-16T10:00:00Z',
  name: 'Push Day',
  exercises: [
    {
      name: 'Bench Press',
      muscle: 'chest',
      sets: [{ reps: 8, weight: 100, rpe: 8 }],
    },
  ],
  duration: 45,
};

describe('useWorkoutStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useWorkoutStore.setState({ workouts: [] });
  });

  it('initializes empty when no localStorage data', () => {
    const { workouts } = useWorkoutStore.getState();
    expect(workouts).toEqual([]);
  });

  it('hydrates from existing localStorage data', () => {
    localStorage.setItem('forge_workouts', JSON.stringify([mockWorkout]));
    // Re-create store to trigger hydration
    const store = useWorkoutStore.getState();
    store.hydrate();
    expect(useWorkoutStore.getState().workouts).toHaveLength(1);
    expect(useWorkoutStore.getState().workouts[0].id).toBe('w_test_1');
  });

  it('adds a workout and persists to localStorage', () => {
    useWorkoutStore.getState().addWorkout(mockWorkout);
    const { workouts } = useWorkoutStore.getState();
    expect(workouts).toHaveLength(1);

    // Verify localStorage was written in old-app-compatible format
    const raw = JSON.parse(localStorage.getItem('forge_workouts')!);
    expect(raw).toHaveLength(1);
    expect(raw[0].id).toBe('w_test_1');
  });

  it('deletes a workout by id', () => {
    useWorkoutStore.getState().addWorkout(mockWorkout);
    useWorkoutStore.getState().deleteWorkout('w_test_1');
    expect(useWorkoutStore.getState().workouts).toHaveLength(0);
  });

  it('gets workouts for a specific date', () => {
    useWorkoutStore.getState().addWorkout(mockWorkout);
    const found = useWorkoutStore.getState().getByDate('2026-04-16');
    expect(found).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npx vitest run src/stores/__tests__/useWorkoutStore.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement workout store**

Create `src/stores/useWorkoutStore.ts`:
```typescript
import { create } from 'zustand';
import { readStorage, writeStorage } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/constants';
import type { Workout } from '../types/workout';

interface WorkoutState {
  workouts: Workout[];
  hydrate: () => void;
  addWorkout: (w: Workout) => void;
  updateWorkout: (id: string, updates: Partial<Workout>) => void;
  deleteWorkout: (id: string) => void;
  getByDate: (isoDate: string) => Workout[];
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  workouts: readStorage<Workout[]>(STORAGE_KEYS.WORKOUTS, []),

  hydrate: () => {
    set({ workouts: readStorage<Workout[]>(STORAGE_KEYS.WORKOUTS, []) });
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
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx vitest run src/stores/__tests__/useWorkoutStore.test.ts
```

Expected: All 5 tests PASS.

- [ ] **Step 5: Create bodyweight workout store**

Create `src/stores/useBwWorkoutStore.ts`:
```typescript
import { create } from 'zustand';
import { readStorage, writeStorage } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/constants';
import type { BwWorkout } from '../types/workout';

interface BwWorkoutState {
  bwWorkouts: BwWorkout[];
  hydrate: () => void;
  addWorkout: (w: BwWorkout) => void;
  updateWorkout: (id: string, updates: Partial<BwWorkout>) => void;
  deleteWorkout: (id: string) => void;
  getByDate: (isoDate: string) => BwWorkout[];
}

export const useBwWorkoutStore = create<BwWorkoutState>((set, get) => ({
  bwWorkouts: readStorage<BwWorkout[]>(STORAGE_KEYS.BW_WORKOUTS, []),

  hydrate: () => {
    set({ bwWorkouts: readStorage<BwWorkout[]>(STORAGE_KEYS.BW_WORKOUTS, []) });
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
```

- [ ] **Step 6: Create cardio store**

Create `src/stores/useCardioStore.ts`:
```typescript
import { create } from 'zustand';
import { readStorage, writeStorage } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/constants';
import type { CardioEntry } from '../types/workout';

interface CardioState {
  entries: CardioEntry[];
  hydrate: () => void;
  addEntry: (e: CardioEntry) => void;
  deleteEntry: (id: string) => void;
  getByDate: (isoDate: string) => CardioEntry[];
  getByType: (type: string) => CardioEntry[];
}

export const useCardioStore = create<CardioState>((set, get) => ({
  entries: readStorage<CardioEntry[]>(STORAGE_KEYS.CARDIO, []),

  hydrate: () => {
    set({ entries: readStorage<CardioEntry[]>(STORAGE_KEYS.CARDIO, []) });
  },

  addEntry: (e) => {
    const updated = [...get().entries, e];
    writeStorage(STORAGE_KEYS.CARDIO, updated);
    set({ entries: updated });
  },

  deleteEntry: (id) => {
    const updated = get().entries.filter((e) => e.id !== id);
    writeStorage(STORAGE_KEYS.CARDIO, updated);
    set({ entries: updated });
  },

  getByDate: (isoDate) => {
    return get().entries.filter((e) => e.date.startsWith(isoDate));
  },

  getByType: (type) => {
    return get().entries.filter((e) => e.type === type);
  },
}));
```

- [ ] **Step 7: Commit**

```bash
git add src/stores/useWorkoutStore.ts src/stores/useBwWorkoutStore.ts src/stores/useCardioStore.ts src/stores/__tests__/
git commit -m "feat: add workout, bodyweight, and cardio Zustand stores

All stores hydrate from localStorage and persist on mutation.
Same forge_* keys as the old app — full data compatibility.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Create remaining Zustand stores (profile, settings, nutrition, body, steps, gamification, session)

**Files:**
- Create: `src/stores/useProfileStore.ts`
- Create: `src/stores/useSettingsStore.ts`
- Create: `src/stores/useNutritionStore.ts`
- Create: `src/stores/useBodyStore.ts`
- Create: `src/stores/useStepsStore.ts`
- Create: `src/stores/useGamificationStore.ts`
- Create: `src/stores/useSessionStore.ts`

- [ ] **Step 1: Create profile store**

Create `src/stores/useProfileStore.ts`:
```typescript
import { create } from 'zustand';
import { readStorage, writeStorage } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/constants';
import type { UserProfile, Readiness, ReadinessLog } from '../types/profile';

interface ProfileState {
  profile: UserProfile;
  readiness: ReadinessLog;
  readinessToday: Readiness | null;
  hydrate: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setReadinessToday: (r: Readiness) => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: readStorage<UserProfile>(STORAGE_KEYS.PROFILE, { name: '' }),
  readiness: readStorage<ReadinessLog>(STORAGE_KEYS.READINESS, {}),
  readinessToday: readStorage<Readiness | null>(STORAGE_KEYS.READINESS_TODAY, null),

  hydrate: () => {
    set({
      profile: readStorage<UserProfile>(STORAGE_KEYS.PROFILE, { name: '' }),
      readiness: readStorage<ReadinessLog>(STORAGE_KEYS.READINESS, {}),
      readinessToday: readStorage<Readiness | null>(STORAGE_KEYS.READINESS_TODAY, null),
    });
  },

  updateProfile: (updates) => {
    const updated = { ...get().profile, ...updates };
    writeStorage(STORAGE_KEYS.PROFILE, updated);
    set({ profile: updated });
  },

  setReadinessToday: (r) => {
    writeStorage(STORAGE_KEYS.READINESS_TODAY, r);
    const today = new Date().toISOString().slice(0, 10);
    const readiness = { ...get().readiness, [today]: r };
    writeStorage(STORAGE_KEYS.READINESS, readiness);
    set({ readinessToday: r, readiness });
  },
}));
```

- [ ] **Step 2: Create settings store**

Create `src/stores/useSettingsStore.ts`:
```typescript
import { create } from 'zustand';
import { readStorage, writeStorage } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/constants';
import type { AppSettings, DashboardLayout } from '../types/profile';

interface SettingsState {
  settings: AppSettings;
  hydrate: () => void;
  updateSettings: (updates: Partial<AppSettings>) => void;
  setTheme: (theme: 'dark' | 'light' | 'auto') => void;
  setLanguage: (lang: 'en' | 'ar') => void;
  toggleSound: () => void;
  toggleHaptic: () => void;
  setLayout: (layout: DashboardLayout) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: {
    theme: readStorage<'dark' | 'light' | 'auto'>(STORAGE_KEYS.THEME, 'dark'),
    accent: readStorage<string>(STORAGE_KEYS.ACCENT, '#2ecc71'),
    sound: readStorage<string>(STORAGE_KEYS.SOUND, 'on') !== 'off',
    haptic: readStorage<string>(STORAGE_KEYS.HAPTIC, 'on') !== 'off',
    language: readStorage<'en' | 'ar'>(STORAGE_KEYS.LANG, 'en'),
    customBg: readStorage<string>(STORAGE_KEYS.CUSTOM_BG, ''),
    layout: readStorage<DashboardLayout>(STORAGE_KEYS.LAYOUT, { sections: [], order: [] }),
  },

  hydrate: () => {
    set({
      settings: {
        theme: readStorage<'dark' | 'light' | 'auto'>(STORAGE_KEYS.THEME, 'dark'),
        accent: readStorage<string>(STORAGE_KEYS.ACCENT, '#2ecc71'),
        sound: readStorage<string>(STORAGE_KEYS.SOUND, 'on') !== 'off',
        haptic: readStorage<string>(STORAGE_KEYS.HAPTIC, 'on') !== 'off',
        language: readStorage<'en' | 'ar'>(STORAGE_KEYS.LANG, 'en'),
        customBg: readStorage<string>(STORAGE_KEYS.CUSTOM_BG, ''),
        layout: readStorage<DashboardLayout>(STORAGE_KEYS.LAYOUT, { sections: [], order: [] }),
      },
    });
  },

  updateSettings: (updates) => {
    const current = get().settings;
    const updated = { ...current, ...updates };
    if (updates.theme !== undefined) writeStorage(STORAGE_KEYS.THEME, updated.theme);
    if (updates.accent !== undefined) writeStorage(STORAGE_KEYS.ACCENT, updated.accent);
    if (updates.sound !== undefined) writeStorage(STORAGE_KEYS.SOUND, updated.sound ? 'on' : 'off');
    if (updates.haptic !== undefined) writeStorage(STORAGE_KEYS.HAPTIC, updated.haptic ? 'on' : 'off');
    if (updates.language !== undefined) writeStorage(STORAGE_KEYS.LANG, updated.language);
    if (updates.customBg !== undefined) writeStorage(STORAGE_KEYS.CUSTOM_BG, updated.customBg ?? '');
    if (updates.layout !== undefined) writeStorage(STORAGE_KEYS.LAYOUT, updated.layout);
    set({ settings: updated });
  },

  setTheme: (theme) => get().updateSettings({ theme }),
  setLanguage: (lang) => get().updateSettings({ language: lang }),
  toggleSound: () => get().updateSettings({ sound: !get().settings.sound }),
  toggleHaptic: () => get().updateSettings({ haptic: !get().settings.haptic }),
  setLayout: (layout) => get().updateSettings({ layout }),
}));
```

- [ ] **Step 3: Create nutrition store**

Create `src/stores/useNutritionStore.ts`:
```typescript
import { create } from 'zustand';
import { readStorage, writeStorage } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/constants';
import type { Meal, MealsLog, MealLibrary, MacroTargets, WaterHistory, WaterLog } from '../types/nutrition';

interface NutritionState {
  meals: MealsLog;
  mealLibrary: MealLibrary;
  macroTargets: MacroTargets;
  water: WaterHistory;
  hydrate: () => void;
  addMeal: (date: string, meal: Meal) => void;
  deleteMeal: (date: string, index: number) => void;
  saveMealToLibrary: (name: string, meal: Meal) => void;
  setMacroTargets: (targets: MacroTargets) => void;
  addWater: (date: string) => void;
  undoWater: (date: string) => void;
  setWaterGoal: (date: string, goal: number) => void;
}

export const useNutritionStore = create<NutritionState>((set, get) => ({
  meals: readStorage<MealsLog>(STORAGE_KEYS.MEALS, {}),
  mealLibrary: readStorage<MealLibrary>(STORAGE_KEYS.MEAL_LIBRARY, {}),
  macroTargets: readStorage<MacroTargets>(STORAGE_KEYS.MACRO_TARGETS, {
    calories: 2000,
    protein_g: 150,
    carbs_g: 250,
    fat_g: 65,
  }),
  water: readStorage<WaterHistory>(STORAGE_KEYS.WATER, {}),

  hydrate: () => {
    set({
      meals: readStorage<MealsLog>(STORAGE_KEYS.MEALS, {}),
      mealLibrary: readStorage<MealLibrary>(STORAGE_KEYS.MEAL_LIBRARY, {}),
      macroTargets: readStorage<MacroTargets>(STORAGE_KEYS.MACRO_TARGETS, {
        calories: 2000, protein_g: 150, carbs_g: 250, fat_g: 65,
      }),
      water: readStorage<WaterHistory>(STORAGE_KEYS.WATER, {}),
    });
  },

  addMeal: (date, meal) => {
    const meals = { ...get().meals };
    if (!meals[date]) meals[date] = { meals: [] };
    meals[date] = { meals: [...meals[date].meals, meal] };
    writeStorage(STORAGE_KEYS.MEALS, meals);
    set({ meals });
  },

  deleteMeal: (date, index) => {
    const meals = { ...get().meals };
    if (!meals[date]) return;
    const dayMeals = [...meals[date].meals];
    dayMeals.splice(index, 1);
    meals[date] = { meals: dayMeals };
    writeStorage(STORAGE_KEYS.MEALS, meals);
    set({ meals });
  },

  saveMealToLibrary: (name, meal) => {
    const lib = { ...get().mealLibrary, [name]: meal };
    writeStorage(STORAGE_KEYS.MEAL_LIBRARY, lib);
    set({ mealLibrary: lib });
  },

  setMacroTargets: (targets) => {
    writeStorage(STORAGE_KEYS.MACRO_TARGETS, targets);
    set({ macroTargets: targets });
  },

  addWater: (date) => {
    const water = { ...get().water };
    if (!water[date]) water[date] = { cups_drunk: 0, goal_cups: 8 };
    water[date] = { ...water[date], cups_drunk: water[date].cups_drunk + 1 };
    writeStorage(STORAGE_KEYS.WATER, water);
    set({ water });
  },

  undoWater: (date) => {
    const water = { ...get().water };
    if (!water[date] || water[date].cups_drunk <= 0) return;
    water[date] = { ...water[date], cups_drunk: water[date].cups_drunk - 1 };
    writeStorage(STORAGE_KEYS.WATER, water);
    set({ water });
  },

  setWaterGoal: (date, goal) => {
    const water = { ...get().water };
    if (!water[date]) water[date] = { cups_drunk: 0, goal_cups: goal };
    else water[date] = { ...water[date], goal_cups: goal };
    writeStorage(STORAGE_KEYS.WATER, water);
    set({ water });
  },
}));
```

- [ ] **Step 4: Create body store**

Create `src/stores/useBodyStore.ts`:
```typescript
import { create } from 'zustand';
import { readStorage, writeStorage } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/constants';
import type { BodyWeightEntry, Measurement, InBodyEntry } from '../types/body';

interface BodyState {
  bodyWeight: BodyWeightEntry[];
  measurements: Measurement[];
  inbody: InBodyEntry[];
  hydrate: () => void;
  addWeightEntry: (entry: BodyWeightEntry) => void;
  addMeasurement: (m: Measurement) => void;
  addInBody: (entry: InBodyEntry) => void;
  deleteWeightEntry: (date: string) => void;
}

export const useBodyStore = create<BodyState>((set, get) => ({
  bodyWeight: readStorage<BodyWeightEntry[]>(STORAGE_KEYS.BODY_WEIGHT, []),
  measurements: readStorage<Measurement[]>(STORAGE_KEYS.MEASUREMENTS, []),
  inbody: readStorage<InBodyEntry[]>(STORAGE_KEYS.INBODY, []),

  hydrate: () => {
    set({
      bodyWeight: readStorage<BodyWeightEntry[]>(STORAGE_KEYS.BODY_WEIGHT, []),
      measurements: readStorage<Measurement[]>(STORAGE_KEYS.MEASUREMENTS, []),
      inbody: readStorage<InBodyEntry[]>(STORAGE_KEYS.INBODY, []),
    });
  },

  addWeightEntry: (entry) => {
    const updated = [...get().bodyWeight, entry];
    writeStorage(STORAGE_KEYS.BODY_WEIGHT, updated);
    set({ bodyWeight: updated });
  },

  addMeasurement: (m) => {
    const updated = [...get().measurements, m];
    writeStorage(STORAGE_KEYS.MEASUREMENTS, updated);
    set({ measurements: updated });
  },

  addInBody: (entry) => {
    const updated = [...get().inbody, entry];
    writeStorage(STORAGE_KEYS.INBODY, updated);
    set({ inbody: updated });
  },

  deleteWeightEntry: (date) => {
    const updated = get().bodyWeight.filter((e) => e.date !== date);
    writeStorage(STORAGE_KEYS.BODY_WEIGHT, updated);
    set({ bodyWeight: updated });
  },
}));
```

- [ ] **Step 5: Create steps store**

Create `src/stores/useStepsStore.ts`:
```typescript
import { create } from 'zustand';
import { readStorage, writeStorage } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/constants';

type StepsLog = Record<string, number>; // keyed by ISO date

interface StepsState {
  steps: StepsLog;
  goal: number;
  hydrate: () => void;
  addSteps: (date: string, count: number) => void;
  setGoal: (goal: number) => void;
  getTodaySteps: () => number;
  getTodayProgress: () => number; // 0-100
}

export const useStepsStore = create<StepsState>((set, get) => ({
  steps: readStorage<StepsLog>(STORAGE_KEYS.STEPS, {}),
  goal: Number(readStorage<string>(STORAGE_KEYS.STEP_GOAL, '10000')),

  hydrate: () => {
    set({
      steps: readStorage<StepsLog>(STORAGE_KEYS.STEPS, {}),
      goal: Number(readStorage<string>(STORAGE_KEYS.STEP_GOAL, '10000')),
    });
  },

  addSteps: (date, count) => {
    const steps = { ...get().steps };
    steps[date] = (steps[date] ?? 0) + count;
    writeStorage(STORAGE_KEYS.STEPS, steps);
    set({ steps });
  },

  setGoal: (goal) => {
    writeStorage(STORAGE_KEYS.STEP_GOAL, String(goal));
    set({ goal });
  },

  getTodaySteps: () => {
    const today = new Date().toISOString().slice(0, 10);
    return get().steps[today] ?? 0;
  },

  getTodayProgress: () => {
    const today = get().getTodaySteps();
    return Math.min(100, Math.round((today / get().goal) * 100));
  },
}));
```

- [ ] **Step 6: Create gamification store**

Create `src/stores/useGamificationStore.ts`:
```typescript
import { create } from 'zustand';
import { readStorage, writeStorage } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/constants';
import type { Achievement } from '../types/gamification';

interface GamificationState {
  achievements: Achievement[];
  experience: number;
  hydrate: () => void;
  addAchievement: (a: Achievement) => void;
  addXP: (amount: number) => void;
  getLevel: () => { level: number; name: string; progress: number };
}

const LEVEL_TABLE = [
  { level: 1, name: 'ROOKIE', minXP: 0 },
  { level: 2, name: 'IRON', minXP: 100 },
  { level: 3, name: 'BRONZE', minXP: 300 },
  { level: 4, name: 'SILVER', minXP: 600 },
  { level: 5, name: 'GOLD', minXP: 1000 },
  { level: 6, name: 'PLATINUM', minXP: 1500 },
  { level: 7, name: 'DIAMOND', minXP: 2200 },
  { level: 8, name: 'LEGEND', minXP: 3000 },
];

export const useGamificationStore = create<GamificationState>((set, get) => ({
  achievements: readStorage<Achievement[]>(STORAGE_KEYS.ACHIEVEMENTS, []),
  experience: readStorage<number>(STORAGE_KEYS.EXPERIENCE, 0),

  hydrate: () => {
    set({
      achievements: readStorage<Achievement[]>(STORAGE_KEYS.ACHIEVEMENTS, []),
      experience: readStorage<number>(STORAGE_KEYS.EXPERIENCE, 0),
    });
  },

  addAchievement: (a) => {
    const achievements = [...get().achievements, a];
    writeStorage(STORAGE_KEYS.ACHIEVEMENTS, achievements);
    set({ achievements });
  },

  addXP: (amount) => {
    const experience = get().experience + amount;
    writeStorage(STORAGE_KEYS.EXPERIENCE, experience);
    set({ experience });
  },

  getLevel: () => {
    const xp = get().experience;
    let current = LEVEL_TABLE[0];
    let next = LEVEL_TABLE[1];
    for (let i = LEVEL_TABLE.length - 1; i >= 0; i--) {
      if (xp >= LEVEL_TABLE[i].minXP) {
        current = LEVEL_TABLE[i];
        next = LEVEL_TABLE[i + 1] ?? LEVEL_TABLE[i];
        break;
      }
    }
    const range = next.minXP - current.minXP;
    const progress = range > 0 ? Math.round(((xp - current.minXP) / range) * 100) : 100;
    return { level: current.level, name: current.name, progress };
  },
}));
```

- [ ] **Step 7: Create session store (in-memory only, no localStorage)**

Create `src/stores/useSessionStore.ts`:
```typescript
import { create } from 'zustand';
import type { WorkoutExercise, MuscleGroup } from '../types/workout';

interface SessionState {
  active: boolean;
  startTime: number | null;
  exercises: WorkoutExercise[];
  selectedMuscle: MuscleGroup | null;
  selectedExercise: string | null;
  restTimerTarget: number; // seconds
  restTimerStart: number | null;
  start: () => void;
  end: () => void;
  setMuscle: (m: MuscleGroup) => void;
  setExercise: (name: string) => void;
  addExercise: (e: WorkoutExercise) => void;
  setRestTimer: (seconds: number) => void;
  startRestTimer: () => void;
  clearRestTimer: () => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  active: false,
  startTime: null,
  exercises: [],
  selectedMuscle: null,
  selectedExercise: null,
  restTimerTarget: 90,
  restTimerStart: null,

  start: () => set({ active: true, startTime: Date.now(), exercises: [] }),
  end: () => set({ active: false }),
  setMuscle: (m) => set({ selectedMuscle: m, selectedExercise: null }),
  setExercise: (name) => set({ selectedExercise: name }),
  addExercise: (e) => set((s) => ({ exercises: [...s.exercises, e] })),
  setRestTimer: (seconds) => set({ restTimerTarget: seconds }),
  startRestTimer: () => set({ restTimerStart: Date.now() }),
  clearRestTimer: () => set({ restTimerStart: null }),
  reset: () =>
    set({
      active: false,
      startTime: null,
      exercises: [],
      selectedMuscle: null,
      selectedExercise: null,
      restTimerStart: null,
    }),
}));
```

- [ ] **Step 8: Run all tests**

```bash
npx vitest run
```

Expected: All tests PASS (storage tests + workout store tests).

- [ ] **Step 9: Commit**

```bash
git add src/stores/
git commit -m "feat: add all Zustand stores (profile, settings, nutrition, body, steps, gamification, session)

10 stores total. All persistent stores bridge localStorage via typed storage.ts.
Session store is in-memory only (runtime workout state).

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Set up Supabase client and auth hook

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `src/hooks/useAuth.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create Supabase client**

Read the existing `js/config.js` and `js/supabase-client.js` to extract the Supabase URL and anon key.

Create `src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

// These are the same public credentials used by the existing app (js/config.js).
// The anon key is safe to expose — Supabase RLS enforces access control.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? 'YOUR_SUPABASE_URL_FROM_CONFIG_JS';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'YOUR_SUPABASE_ANON_KEY_FROM_CONFIG_JS';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

**Important:** Replace the placeholder strings with the actual values from `js/config.js`. These are public anon keys, not secrets.

- [ ] **Step 2: Install Supabase client**

```bash
npm install @supabase/supabase-js
```

- [ ] **Step 3: Create auth hook**

Create `src/hooks/useAuth.ts`:
```typescript
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useProfileStore } from '../stores/useProfileStore';
import { readStorage } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/constants';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isGuest = readStorage<string>(STORAGE_KEYS.GUEST, '0') === '1';
  const updateProfile = useProfileStore((s) => s.updateProfile);

  useEffect(() => {
    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user?.user_metadata?.full_name) {
        updateProfile({ name: session.user.user_metadata.full_name });
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [updateProfile]);

  const signInWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const continueAsGuest = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.GUEST, '1');
    setLoading(false);
  }, []);

  return { user, loading, isGuest, signInWithGoogle, signOut, continueAsGuest };
}
```

- [ ] **Step 4: Update App.tsx to use auth**

Update `src/App.tsx`:
```tsx
import { useAuth } from './hooks/useAuth';

export default function App() {
  const { user, loading, isGuest, signInWithGoogle, continueAsGuest } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-forge-bg">
        <div className="text-forge-green text-2xl font-display animate-pulse">FORGE</div>
      </div>
    );
  }

  if (!user && !isGuest) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-forge-bg p-8">
        <h1 className="text-forge-green text-5xl font-display">FORGE</h1>
        <p className="text-forge-muted text-center">Your personal gym operating system</p>
        <button
          onClick={signInWithGoogle}
          className="bg-forge-green text-forge-bg px-8 py-3 rounded-lg font-condensed font-semibold text-lg"
        >
          Sign in with Google
        </button>
        <button
          onClick={continueAsGuest}
          className="text-forge-muted underline text-sm"
        >
          Continue as guest
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-forge-bg">
      <p className="text-forge-green text-center pt-10 font-display text-3xl">
        FORGE — Logged in as {user?.email ?? 'Guest'}
      </p>
      <p className="text-forge-muted text-center mt-2">Shell + navigation coming in Phase 2</p>
    </div>
  );
}
```

- [ ] **Step 5: Verify auth flow**

```bash
npm run dev
```

Expected: Browser shows login screen with Google button and guest mode. Guest mode shows the logged-in placeholder.

- [ ] **Step 6: Commit**

```bash
git add src/lib/supabase.ts src/hooks/useAuth.ts src/App.tsx
git commit -m "feat: add Supabase client and auth hook

Google OAuth + guest mode. Same Supabase project as old app.
Profile store hydrates on auth success.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: Set up i18n foundation

**Files:**
- Create: `src/lib/i18n.ts`
- Create: `src/i18n/en.json`
- Create: `src/i18n/ar.json`

- [ ] **Step 1: Create starter translation files**

Create `src/i18n/en.json`:
```json
{
  "app": {
    "name": "FORGE",
    "tagline": "Your personal gym operating system"
  },
  "auth": {
    "signIn": "Sign in with Google",
    "guest": "Continue as guest",
    "signOut": "Sign out"
  },
  "nav": {
    "log": "Log",
    "dashboard": "Dashboard",
    "coach": "Coach",
    "body": "Body",
    "settings": "Settings"
  },
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "close": "Close",
    "loading": "Loading..."
  }
}
```

Create `src/i18n/ar.json`:
```json
{
  "app": {
    "name": "FORGE",
    "tagline": "نظام التشغيل الشخصي للصالة الرياضية"
  },
  "auth": {
    "signIn": "تسجيل الدخول بحساب Google",
    "guest": "المتابعة كضيف",
    "signOut": "تسجيل الخروج"
  },
  "nav": {
    "log": "سجل",
    "dashboard": "لوحة",
    "coach": "المدرب",
    "body": "الجسم",
    "settings": "إعدادات"
  },
  "common": {
    "save": "حفظ",
    "cancel": "إلغاء",
    "delete": "حذف",
    "edit": "تعديل",
    "close": "إغلاق",
    "loading": "جاري التحميل..."
  }
}
```

- [ ] **Step 2: Configure react-i18next**

Create `src/lib/i18n.ts`:
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../i18n/en.json';
import ar from '../i18n/ar.json';
import { readStorage } from './storage';
import { STORAGE_KEYS } from './constants';

const savedLang = readStorage<string>(STORAGE_KEYS.LANG, 'en');

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
```

- [ ] **Step 3: Wire i18n into main.tsx**

Update `src/main.tsx`:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './lib/i18n'; // Initialize i18n before rendering

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 4: Verify i18n loads**

```bash
npm run dev
```

Expected: App renders. No console errors about i18n.

- [ ] **Step 5: Commit**

```bash
git add src/lib/i18n.ts src/i18n/ src/main.tsx
git commit -m "feat: add react-i18next with EN/AR starter translations

Reads saved language from forge_lang localStorage key.
Starter strings for auth, nav, and common UI. Full extraction in Phase 9.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 8: Phase 0+1 verification — cross-app data check

**Files:**
- No new files. This is a verification-only task.

- [ ] **Step 1: Start the React dev server**

```bash
npm run dev
```

- [ ] **Step 2: Open the old app in another tab**

Open `index.html` directly in the browser (or via `npx serve .` on a different port).

- [ ] **Step 3: Verify data reads in browser console**

In the React app's browser console, run:
```javascript
// Check that stores read the same data as old app
JSON.parse(localStorage.getItem('forge_workouts'))?.length
JSON.parse(localStorage.getItem('forge_profile'))?.name
localStorage.getItem('forge_lang')
```

Both apps should show the same data.

- [ ] **Step 4: Run the full test suite**

```bash
npx vitest run
```

Expected: All tests PASS.

- [ ] **Step 5: Run the build**

```bash
npm run build
```

Expected: Clean build, no TypeScript errors.

- [ ] **Step 6: Run type check**

```bash
npx tsc --noEmit
```

Expected: No errors.

---

## Phases 2–10: Task-Level Roadmap

Each phase below will get its own detailed plan document (with full TDD steps and code) before execution. This section provides the task decomposition and file mapping to guide planning.

### Phase 2: App Shell & Navigation
**Plan file:** `docs/superpowers/plans/2026-XX-XX-react-migration-phase2-shell.md`

| Task | Files to Create | Description |
|------|----------------|-------------|
| 2.1 | `src/components/layout/AppShell.tsx` | Main layout: header + content + bottom nav |
| 2.2 | `src/components/layout/Header.tsx` | Logo, session pill, XP bar, mascot, collapse toggle |
| 2.3 | `src/components/layout/BottomNav.tsx` | 5-tab navigation bar |
| 2.4 | `src/App.tsx` (modify), `src/pages/*.tsx` | React Router routes for each tab |
| 2.5 | `src/components/ui/Toast.tsx` | Toast notification component |
| 2.6 | `src/components/ui/Modal.tsx` | Reusable modal (portal-based) |
| 2.7 | `src/components/ui/Button.tsx`, `Card.tsx`, `Input.tsx`, `Badge.tsx` | Core UI primitives |
| 2.8 | `src/lib/fx.ts`, `src/hooks/useFX.ts` | Sound + haptic + visual effects system |

### Phase 3: Workout Logging
**Plan file:** `docs/superpowers/plans/2026-XX-XX-react-migration-phase3-workout.md`

| Task | Files | Description |
|------|-------|-------------|
| 3.1 | `src/features/workout/components/WorkoutTypeSelector.tsx` | Weighted/Bodyweight/Cardio tab selector |
| 3.2 | `src/features/workout/components/MuscleGroupPicker.tsx` | 10-muscle-group chip selector |
| 3.3 | `src/features/workout/components/ExerciseAutocomplete.tsx` | Searchable exercise picker with ghost suggestions |
| 3.4 | `src/features/workout/components/SetLogger.tsx` | Reps x weight input with add/ditto |
| 3.5 | `src/features/workout/hooks/useGhostSets.ts` | Previous set suggestions from history |
| 3.6 | `src/features/workout/components/RestTimer.tsx` | Rest timer with presets (60/90/120/180s) |
| 3.7 | `src/features/workout/components/SessionTimer.tsx` | Session duration timer in header |
| 3.8 | `src/features/workout/components/SaveWorkoutModal.tsx` | Save flow + celebration FX |

### Phase 4: Dashboard & Analytics
**Plan file:** `docs/superpowers/plans/2026-XX-XX-react-migration-phase4-dashboard.md`

| Task | Files | Description |
|------|-------|-------------|
| 4.1 | `src/features/dashboard/components/DashboardLayout.tsx` | Reorderable section container |
| 4.2 | `src/features/dashboard/components/HistoryHeatmap.tsx` | Calendar heatmap (Recharts) |
| 4.3 | `src/features/dashboard/components/VolumeChart.tsx` | Per-muscle volume bar chart |
| 4.4 | `src/features/dashboard/components/FreqChart.tsx` | Exercise frequency distribution |
| 4.5 | `src/features/dashboard/components/BalanceCard.tsx` | Muscle balance radar chart |
| 4.6 | `src/features/dashboard/components/BodyHeatmap.tsx` | Interactive SVG body map |
| 4.7 | `src/features/dashboard/components/WeightChart.tsx` | Weight trend area chart |
| 4.8 | `src/features/dashboard/components/ExerciseDetailModal.tsx` | PR history + progression |

### Phase 5: Body & Measurements
| Task | Files | Description |
|------|-------|-------------|
| 5.1 | `src/features/body/components/WeightLogger.tsx` | Weight entry + trend chart |
| 5.2 | `src/features/body/components/MeasurementsForm.tsx` | 12-field body measurements |
| 5.3 | `src/features/body/components/InBodyLog.tsx` | InBody scan data entry + history |
| 5.4 | `src/features/body/components/PhotoGallery.tsx` | Body composition photo gallery |
| 5.5 | `src/features/body/components/PhotoCompare.tsx` | Before/after slider comparison |
| 5.6 | `src/features/body/components/AvatarCard.tsx` | Profile avatar with progression |

### Phase 6: Coach & AI
| Task | Files | Description |
|------|-------|-------------|
| 6.1 | `src/features/coach/hooks/useCoachState.ts` | Unified state from all data sources |
| 6.2 | `src/features/coach/hooks/useCoachTriggers.ts` | Recovery/readiness/overload alerts |
| 6.3 | `src/features/coach/components/CoachPanel.tsx` | Main coach interface with tabs |
| 6.4 | `src/features/coach/components/PlanDayView.tsx` | Day view with RPE swapping |
| 6.5 | `src/features/coach/components/ProgramCard.tsx` | AI program display + activation |
| 6.6 | `src/features/coach/components/MascotBubble.tsx` | Buddy messaging system |

### Phase 7: Secondary Features
| Task | Files | Description |
|------|-------|-------------|
| 7.1 | `src/features/workout/components/BodyweightMode.tsx` | Calisthenics skill tree |
| 7.2 | `src/features/workout/components/CardioStats.tsx` | Cardio trends + zones |
| 7.3 | `src/features/steps/components/StepsPanel.tsx` | Quick-add buttons + goal |
| 7.4 | `src/features/nutrition/components/GoalDashboard.tsx` | Macro steering dashboard |
| 7.5 | `src/features/gamification/components/WeeklyReview.tsx` | Weekly summary stats |
| 7.6 | `src/features/gamification/components/AchievementToast.tsx` | Achievement notifications |
| 7.7 | `src/features/gamification/components/XPBar.tsx` | XP bar + level display |

### Phase 8: Social & Sharing
| Task | Files | Description |
|------|-------|-------------|
| 8.1 | `src/features/poster/components/SessionPoster.tsx` | Canvas-based poster generation |
| 8.2 | `src/features/poster/components/ProgressProofCard.tsx` | Progress proof export |
| 8.3 | `src/features/poster/components/ShareButtons.tsx` | Download + social share |
| 8.4 | `src/features/social/components/DuelArena.tsx` | Duel create + accept + score |
| 8.5 | `src/features/social/components/CommunityLibrary.tsx` | Shared exercises + meals |

### Phase 9: Settings & Polish
| Task | Files | Description |
|------|-------|-------------|
| 9.1 | `src/features/settings/components/SettingsPage.tsx` | Full settings page |
| 9.2 | `src/features/settings/components/DataTransfer.tsx` | JSON export/import + Hevy |
| 9.3 | `src/features/settings/components/ProfileEditor.tsx` | Profile edit form |
| 9.4 | i18n full extraction | Complete en.json + ar.json from 630+ strings |
| 9.5 | Accessibility pass | ARIA labels, focus management, keyboard nav |

### Phase 10: Cutover
| Task | Files | Description |
|------|-------|-------------|
| 10.1 | `src/test/e2e/*.spec.ts` | Playwright E2E suite (10+ specs) |
| 10.2 | Lighthouse audit | Performance > 90, Accessibility > 90 |
| 10.3 | Vite build → production entry point | Replace old index.html |
| 10.4 | Archive old code to `legacy` branch | Clean up repo |
| 10.5 | Real device testing | Android + iOS Safari |
