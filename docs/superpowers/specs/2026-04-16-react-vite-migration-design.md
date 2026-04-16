# FORGE React + Vite Migration Design

**Date**: 2026-04-16
**Status**: Approved
**Strategy**: Parallel Build + Shared Data Layer (Strangler Fig)

## Problem Statement

FORGE is an 80K+ line vanilla JS PWA with:
- 10,782-line monolithic `index.html` (7,670 lines of inline JS)
- 69 external JS files with no module system
- 25,826 lines of CSS across 3 files (mostly one monolith)
- 30+ hardcoded `forge_*` localStorage keys with no central registry
- Duplicated code patterns (save celebrations, bilingual helpers, streak FX)
- No TypeScript, no tests, no build tooling
- Global state via `let` variables (not on `window`)

The app works and has 465 commits of battle-tested features. The goal is to modernize without losing any functionality.

## Strategy: Parallel Build

Build a complete React app alongside the existing codebase. Both apps share the same localStorage data format. The old app is never modified and serves as the permanent fallback until full migration is verified.

**Key safety properties:**
- Old app stays functional at all times (never touched)
- Same `forge_*` localStorage keys = zero data migration
- Each phase produces a working (partial) React app
- Rollback = serve old `index.html`
- Feature parity verified via Playwright E2E tests

## Tech Stack

| Layer | Tool | Version | Replaces |
|-------|------|---------|----------|
| Framework | React | 19 | Vanilla JS DOM manipulation |
| Bundler | Vite | 6 | No build tools |
| Language | TypeScript | 5.7+ | Plain JS (no types) |
| State | Zustand | 5 | Global `let` vars + raw localStorage |
| Routing | React Router | 7 | Manual tab switching via CSS classes |
| Styling | Tailwind CSS | 4 | 25K-line monolithic `main.css` |
| i18n | react-i18next | 15 | `_ws(en, ar)` / `_cx(en, ar)` pattern |
| Charts | Recharts | 2 | Chart.js 4.4.0 + chartjs-plugin-zoom |
| PWA | vite-plugin-pwa | 0.21 | Manual `sw.js` (v251) |
| Testing | Vitest + React Testing Library | latest | No tests |
| E2E | Playwright | latest | No E2E tests |
| Linting | ESLint + Prettier | latest | None |
| Gestures | @use-gesture/react | latest | Hammer.js 2.0.8 |
| Auth | Supabase Auth + Google OAuth | existing | Same Supabase project |

## Directory Structure

```
forge/                        (existing repo root)
|-- index.html                OLD app (untouched until Phase 10)
|-- js/                       OLD scripts (untouched)
|-- css/                      OLD styles (untouched)
|-- sw.js                     OLD service worker
|
|-- package.json              NEW
|-- vite.config.ts            NEW
|-- tailwind.config.ts        NEW
|-- tsconfig.json             NEW
|-- .eslintrc.cjs             NEW
|-- .prettierrc               NEW
|
|-- public/                   Shared static assets
|   |-- icons/
|   |-- manifest.json
|   +-- sounds/
|
+-- src/                      NEW React app
    |-- main.tsx              Entry point
    |-- App.tsx               Root component + Router
    |
    |-- types/                TypeScript interfaces
    |   |-- workout.ts        Workout, Exercise, WorkoutSet, MuscleGroup
    |   |-- profile.ts        UserProfile, Settings, Preferences
    |   |-- nutrition.ts      Meal, Macro, WaterLog
    |   |-- body.ts           Measurement, InBodyEntry, BodyPhoto
    |   |-- social.ts         Duel, CommunityItem
    |   |-- gamification.ts   Achievement, XPLevel, Rank
    |   +-- coach.ts          CoachState, CoachTrigger, Program
    |
    |-- stores/               Zustand stores (replace global lets)
    |   |-- useWorkoutStore.ts      reads/writes forge_workouts
    |   |-- useBwWorkoutStore.ts    reads/writes forge_bw_workouts
    |   |-- useCardioStore.ts       reads/writes forge_cardio
    |   |-- useProfileStore.ts      reads/writes forge_profile
    |   |-- useSettingsStore.ts     reads/writes forge_settings
    |   |-- useNutritionStore.ts    reads/writes forge_meals, forge_water_*
    |   |-- useBodyStore.ts         reads/writes forge_measurements, forge_inbody_entries
    |   |-- useStepsStore.ts        reads/writes forge_steps_*
    |   |-- useSessionStore.ts      in-memory only (current workout session)
    |   +-- useGamificationStore.ts reads/writes forge_achievements, forge_xp
    |
    |-- lib/                  Shared utilities
    |   |-- storage.ts        Typed localStorage bridge (THE critical file)
    |   |-- constants.ts      STORAGE_KEYS central registry
    |   |-- supabase.ts       Supabase client init
    |   |-- i18n.ts           react-i18next configuration
    |   |-- exercises-db.ts   Exercise library with muscle mappings
    |   |-- fx.ts             Sound + haptic + visual effects
    |   +-- date-utils.ts     Date formatting helpers
    |
    |-- hooks/                Cross-cutting React hooks
    |   |-- useAuth.ts        Google Sign-In + Supabase auth
    |   |-- useFX.ts          Sound/haptic/visual effects
    |   |-- useTimer.ts       Session timer + rest timer
    |   |-- useI18n.ts        Language switching
    |   +-- useSync.ts        Supabase sync push/pull
    |
    |-- components/           Shared UI components
    |   |-- ui/               Primitives: Button, Modal, Toast, Card,
    |   |                     Input, Badge, Toggle, Slider, Skeleton
    |   |-- layout/           AppShell, Header, BottomNav, PageContainer
    |   +-- charts/           Recharts wrappers: AreaChart, BarChart,
    |                         HeatmapCalendar, RadarChart, PieChart
    |
    |-- features/             Feature modules (1 folder per domain)
    |   |-- workout/
    |   |   |-- components/   WorkoutTypeSelector, MuscleGroupPicker,
    |   |   |                 ExerciseAutocomplete, SetLogger, SaveModal
    |   |   |-- hooks/        useGhostSets, useWorkoutSession
    |   |   +-- index.ts      Public exports
    |   |
    |   |-- dashboard/
    |   |   |-- components/   HistoryHeatmap, VolumeChart, FreqChart,
    |   |   |                 BalanceCard, BodyHeatmap, WeightChart,
    |   |   |                 ExerciseDetailModal, SectionReorder
    |   |   +-- index.ts
    |   |
    |   |-- body/
    |   |   |-- components/   MeasurementsForm, InBodyLog, PhotoGallery,
    |   |   |                 PhotoCompare, WeightLogger, AvatarCard
    |   |   +-- index.ts
    |   |
    |   |-- coach/
    |   |   |-- components/   CoachPanel, PlanDayView, ProgramCard,
    |   |   |                 MascotBubble, RecoveryAlerts
    |   |   |-- hooks/        useCoachState, useCoachTriggers
    |   |   +-- index.ts
    |   |
    |   |-- nutrition/
    |   |   |-- components/   MealLogger, MacroRings, GoalDashboard,
    |   |   |                 WaterTracker, MealTemplates
    |   |   +-- index.ts
    |   |
    |   |-- social/
    |   |   |-- components/   DuelArena, CommunityLibrary, ShareModal,
    |   |   |                 LeaderboardCard
    |   |   +-- index.ts
    |   |
    |   |-- steps/
    |   |   |-- components/   StepsPanel, QuickAddButtons, StepsGoal
    |   |   +-- index.ts
    |   |
    |   |-- gamification/
    |   |   |-- components/   XPBar, AchievementToast, StreakBadge,
    |   |   |                 LevelUpAnimation, RankSkin
    |   |   +-- index.ts
    |   |
    |   |-- settings/
    |   |   |-- components/   SettingsPage, ProfileEditor, DataTransfer,
    |   |   |                 ThemePicker, LanguageToggle
    |   |   +-- index.ts
    |   |
    |   +-- poster/
    |       |-- components/   SessionPoster, ProgressProofCard,
    |       |                 PosterCanvas, ShareButtons
    |       +-- index.ts
    |
    |-- i18n/
    |   |-- en.json           All English strings
    |   +-- ar.json           All Arabic strings
    |
    +-- test/
        |-- setup.ts          Vitest global setup
        +-- e2e/              Playwright specs (1 per feature area)
```

## Storage Bridge (Critical Component)

The `lib/storage.ts` file is the single most important piece of the migration. It provides typed read/write access to the exact same localStorage keys the old app uses.

```typescript
// lib/constants.ts — central registry (no more string literals)
export const STORAGE_KEYS = {
  WORKOUTS: 'forge_workouts',
  BW_WORKOUTS: 'forge_bw_workouts',
  CARDIO: 'forge_cardio',
  PROFILE: 'forge_profile',
  SETTINGS: 'forge_settings',
  MEALS: 'forge_meals',
  MEASUREMENTS: 'forge_measurements',
  INBODY: 'forge_inbody_entries',
  ACHIEVEMENTS: 'forge_achievements',
  XP: 'forge_xp',
  STEPS_TODAY: 'forge_steps_today',
  STEPS_GOAL: 'forge_steps_goal',
  WATER_CUPS: 'forge_water_cups',
  WATER_GOAL: 'forge_water_goal',
  THEME: 'forge_theme',
  LANG: 'forge_lang',
  SOUND: 'forge_sound',
  // ... all 30+ keys mapped here
} as const;

// lib/storage.ts — typed bridge
export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

export function writeStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}
```

Each Zustand store uses `readStorage` on mount and `writeStorage` on every mutation. This guarantees data format compatibility with the old app.

## Zustand Store Pattern

Every store follows the same pattern — hydrate from localStorage, persist on change:

```typescript
// stores/useWorkoutStore.ts
import { create } from 'zustand';
import { readStorage, writeStorage } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/constants';
import type { Workout } from '../types/workout';

interface WorkoutState {
  workouts: Workout[];
  addWorkout: (w: Workout) => void;
  deleteWorkout: (id: string) => void;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  workouts: readStorage<Workout[]>(STORAGE_KEYS.WORKOUTS, []),

  addWorkout: (w) => {
    const updated = [...get().workouts, w];
    writeStorage(STORAGE_KEYS.WORKOUTS, updated);
    set({ workouts: updated });
  },

  deleteWorkout: (id) => {
    const updated = get().workouts.filter(w => w.id !== id);
    writeStorage(STORAGE_KEYS.WORKOUTS, updated);
    set({ workouts: updated });
  },
}));
```

## Phased Migration Plan

### Phase 0: Foundation Setup
**Goal**: Empty React app builds and runs alongside old app.

- Initialize Vite + React + TypeScript project
- Install all dependencies (see Tech Stack table)
- Configure Tailwind CSS 4, ESLint, Prettier
- Create `lib/storage.ts` and `lib/constants.ts`
- Create empty Zustand stores with localStorage hydration
- Configure vite-plugin-pwa with basic manifest
- Verify: `npm run dev` shows blank page, `readStorage` reads old app data

**Exit criteria**: `npm run dev` works, `npm run build` produces valid output, stores read existing localStorage data.

### Phase 1: Data Layer & Auth
**Goal**: All data accessible via typed stores, auth works.

- Build all Zustand stores with full CRUD operations
- Map every `forge_*` localStorage key to its typed store
- Set up Supabase client (`lib/supabase.ts`)
- Implement auth flow: Google Sign-In -> Supabase -> profile hydration
- Build sync hook (`useSync.ts`) — push/pull to Supabase
- Write unit tests for all stores (Vitest)

**Exit criteria**: Log in with existing account, all store data matches old app, sync works.

### Phase 2: App Shell & Navigation
**Goal**: Navigate between tabs, header works, theme works.

- Build `AppShell` layout (header + scrollable main + bottom nav)
- Build `Header` component (logo, session pill, XP bar, mascot, collapse)
- Build `BottomNav` with 5 tabs (Log, Dashboard, Coach, Body, Settings)
- Set up React Router 7 routes
- Build theme system (dark/light mode, custom accent color)
- Build Toast notification component
- Build Modal system (reusable portal-based)
- Build FX hooks (sound, haptics, visuals)

**Exit criteria**: Navigate between all tabs, header collapses/expands, theme toggles, toasts fire, modals open/close.

### Phase 3: Workout Logging
**Goal**: Full workout logging flow matches old app.

- Workout type selector (Weighted / Bodyweight / Cardio tabs)
- Weighted mode: muscle group picker -> exercise autocomplete -> set logger
- Ghost autocomplete (suggest previous sets)
- Rest timer + session timer
- RPE swap modal
- Save flow: validate -> persist -> celebration FX -> poster prompt
- Cardio quick-log (activity type, duration, distance)
- Bodyweight set logging

**Exit criteria**: Log a full weighted workout, verify it appears in old app's history. Log cardio and bodyweight sessions. Timer works.

### Phase 4: Dashboard & Analytics
**Goal**: All dashboard charts render with existing data.

- Reorderable section layout (drag handles)
- History calendar/heatmap (Recharts)
- Volume chart per muscle group
- Frequency distribution chart
- Muscle balance radar chart
- Interactive body heatmap SVG
- Weight trend line chart
- Exercise detail modal (PR history, progression trend)

**Exit criteria**: All 7 chart types render correctly with existing workout data. Reordering persists.

### Phase 5: Body & Measurements
**Goal**: All body tracking features work.

- Weight logging with trend chart
- Body measurements form (12+ body parts)
- InBody scan data entry + history
- Photo gallery with camera/upload
- Before/after photo comparison slider
- Profile avatar with stat-based progression

**Exit criteria**: Add measurement and InBody entry, verify in old app. Photos display correctly.

### Phase 6: Coach & AI
**Goal**: Coach recommendations and AI features work.

- Coach state builder (aggregates workouts + meals + profile)
- Recovery triggers (muscle readiness checks)
- Coach plan day view with RPE swap
- AI program generator (calls Supabase Edge Functions)
- RAG search integration
- Mascot messaging system

**Exit criteria**: Coach suggestions match old app output. AI program generation works. RAG search returns results.

### Phase 7: Secondary Features
**Goal**: All remaining feature modules migrated.

- Bodyweight skill tree (calisthenics progression)
- Cardio stats + trends + zone tracking
- Steps panel (quick-add, daily goal)
- Goal dashboard (macro steering)
- Weekly review summary
- Achievements system (unlock notifications)
- XP / level / rank system

**Exit criteria**: Each feature reads existing data. New entries persist and appear in old app.

### Phase 8: Social & Sharing
**Goal**: All social and sharing features work.

- Session poster generation (canvas -> image)
- Progress proof card
- Share helpers (download, social share)
- Duel system (create, accept, score)
- Community exercise/meal library

**Exit criteria**: Generate poster matching old app quality. Duel flow works end-to-end.

### Phase 9: Settings & Polish
**Goal**: All settings, data management, and i18n complete.

- Settings page (language, sound, theme, units)
- Data transfer (JSON export/import, Hevy/Strong import)
- Google Drive backup
- Onboarding flow (first-time user)
- Bio log + check-in actions
- Guide/comp cards
- Complete i18n pass (all strings in en.json / ar.json)
- Accessibility audit (ARIA labels, keyboard nav, focus management)

**Exit criteria**: Switch language, entire app responds. Export data, import in old app successfully. Lighthouse Accessibility > 90.

### Phase 10: Cutover & Cleanup
**Goal**: React app becomes the production app.

- Full Playwright E2E suite (1 spec per feature area, minimum 10 specs)
- Lighthouse audit: Performance > 90, Accessibility > 90, PWA check pass
- Vite build output replaces old entry point
- vite-plugin-pwa generates new service worker
- Old JS/CSS archived to `legacy` git branch
- Real device testing (Android + iOS Safari)
- Smoke test full user journey: signup -> workout -> dashboard -> share

**Exit criteria**: All E2E tests green. Lighthouse scores met. Old code archived. App ships.

## Safety Verification Protocol

After EVERY phase:

1. **Data integrity check**: Open old app in one tab, React app in another. Same data visible in both.
2. **Feature parity test**: For each migrated feature, perform the same action in both apps. Results must match.
3. **Regression check**: Previously migrated features still work after new phase code is added.
4. **Lighthouse delta**: No performance regression from previous phase.
5. **Store snapshot test**: Vitest snapshot of store state after standard operations.

## Migration Risk Register

| Risk | Mitigation |
|------|-----------|
| localStorage format mismatch | TypeScript types derived from actual stored data samples, not assumptions. Unit tests verify read/write roundtrip. |
| Missing edge case in feature rewrite | Playwright E2E tests run against old app first to establish baseline, then verify React app matches. |
| Performance regression on mobile | Lighthouse CI in build pipeline. Canvas operations benchmarked. |
| Service worker cache conflicts | Old and new apps use different cache names. Clean install path documented. |
| Chart visual differences | Screenshot comparison tests (Playwright) for all chart types. |
| Auth token incompatibility | Same Supabase project + same Google OAuth client ID = same tokens. |
| i18n string coverage gaps | Script to extract all `_ws(en, ar)` calls from old code and verify 100% coverage in new JSON files. |

## Non-Goals

- No new features during migration (feature freeze until Phase 10)
- No server-side rendering (stays client-only PWA)
- No database schema changes
- No Supabase Edge Function changes
- No change to the data format stored in localStorage
