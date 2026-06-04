# FORGE Optimization Plan

**Status**: Approved for build · **Author**: Alex (Product + Eng Lead) · **Last Updated**: 2026-06-04 · **Version**: 1.0
**Stack**: React 19 + TypeScript + Vite + Zustand + Supabase · PWA on GitHub Pages (`/forge-gym-tracker/`, builds from `app.html`)
**Audience**: Mobile-first gym-goers in MENA, frequently offline, Arabic-first market.

---

## Executive summary

FORGE has an unusually strong **foundation** — a real local-first architecture (every write goes through `writeStorage` → debounced cloud push via `useCloudSync`, with a persistent write-behind `syncQueue` and graceful Supabase degradation), a thoughtful motion vocabulary in `index.css`, and a broad KPI surface. But four high-leverage systems are **built and then left dead or broken**, and that is where almost all the value is:

1. **The Arabic/RTL market promise is unmet.** i18next is initialized in `src/lib/i18n.ts`, but **zero components call `useTranslation`**, `i18n.changeLanguage` is invoked **nowhere**, and `useSettingsStore.setLanguage` (lines 58-62, verified) only writes localStorage + Zustand. Toggling Arabic today just right-aligns English text. ~350-450 user-facing strings across ~30 files are hardcoded English, dates are frozen to `'en-US'`, and only **one** RTL CSS rule exists against **121** physical-direction utilities. This is a P0 because it touches every screen and is the core reason the app cannot ship to its target market.

2. **Logging does not get easier the more you use it.** `SetLogger.tsx` (verified) shows ghost "Last time" sets read-only and then initializes the reps/weight inputs to **empty strings** (lines 15-16) — the single most-repeated action in the app gets zero benefit from history. There are no +/- steppers on the primary logger (unlike `BwLogger`/`CardioLogger`), no "repeat last workout" (the `WorkoutTemplate` type is dead code), and the active session is **never persisted** (`rehydrate.ts` explicitly excludes `useSessionStore`) — a pull-to-refresh mid-workout wipes everything.

3. **The dopamine moments don't fire.** `sounds.levelUp` is defined but called nowhere; the per-set `isPR` flag is **read in 6 places but written in 0**, so the "PRs" KPI is permanently 0 and the PR celebration never triggers. The audio engine (`fx.ts`, verified) is raw sine beeps with no envelope and **never resumes the AudioContext** after a user gesture, so the first sounds silently drop on iOS.

4. **Offline-first has one hole that defeats the rest.** VitePWA (verified) has **no `navigateFallback`**, so an offline refresh on `/forge-gym-tracker/log` shows the browser error page — the exact gym scenario the whole architecture exists to serve. `app.html` (the real build entry) is also missing every PWA/mobile meta tag.

**The biggest levers, in order:** (1) make i18n live + externalize strings (unblocks the whole market and is the keystone for every other string-touching change); (2) prefill-from-history + steppers + session persistence (logging speed + trust); (3) revive PR detection + level-up + a real audio engine (motivation + premium feel); (4) `navigateFallback` + meta tags (offline reliability). These four account for the overwhelming majority of perceived quality and addressable market.

---

## Pillar findings

### Pillar 1 — Internationalization & RTL (Arabic/MENA)
**Current state:** i18next is wired in `src/lib/i18n.ts` and `main.tsx`/`App.tsx` sync `document.dir`/`lang`, but the system is functionally dead.

- **i18n is initialized but inert.** `useTranslation`/`<Trans>`/`i18n.t` appear only inside `i18n.ts`. `i18n.changeLanguage` is called 0 times; `lng` is read once at init and never updated. **Verified**: `setLanguage` (useSettingsStore.ts:58-62) writes storage + flips dir but never changes i18next's active language.
- **Catalogs cover <5% of strings.** `en.json`/`ar.json` hold ~25 keys; the live app has ~219 distinct capitalized literals, ~125 JSX text nodes (30 files), 36 `toast()` calls, 27 aria-labels, 19 placeholders.
- **Structural blocker:** module-scope arrays can't use hooks. **Verified**: `NAV_ITEMS` in `BottomNav.tsx` (lines 5-12) holds English labels outside the component; same pattern for `MorePage` TABS and `SaveWorkoutModal` VALID_MUSCLES. Must refactor to stable keys mapped through `t()` inside the component body.
- **Dates/numbers frozen to `en-US`:** 14+ `toLocaleDateString('en-US', …)` calls plus many bare `toLocaleString()`; no central formatter.
- **RTL CSS nearly absent:** one `[dir="rtl"]` rule vs 121 physical utilities across 19 files; scroll-hint mask hardcoded `to right`; `Input` uses physical `leftIcon`/`rightSlot` props (16 instances).
- **Charts have zero RTL/locale awareness** (4 Recharts components); domain enums (muscle/cardio names) render raw; no pluralization/interpolation (Arabic needs 6 plural forms).

### Pillar 2 — Workout logging journey (adaptive ease)
**Current state:** A linear scroll flow with some real adaptive features (ghost-set hint, `TopExercisesCard` frequency ranking, auto-saved custom exercises, `ProgressGuide` one-tap start) but ~5 taps + 2 keyboard entries per fresh set.

- **Ghost sets shown but never prefilled** (`SetLogger.tsx:15-16` empty strings — **verified**). The #1 "doesn't get easier" failure.
- **No +/- steppers on weighted entry** — forces the numeric keyboard every set; `BwLogger`/`CardioLogger` already have 44px steppers.
- **Active session never persisted** (`rehydrate.ts:18-20` — **verified**); refresh/crash/background eviction wipes the in-progress workout. Worst offline-reliability violation at the moment of highest user investment.
- **No "repeat last workout"/templates** — `WorkoutTemplate` (types/workout.ts:63) is dead code.
- **Rest timer manual, global, fixed** `[60,90,120,180]`; default 90s; never auto-starts; never learns per-exercise.
- **Units hardcoded kg**; `BwLogger` variation resets to `'regular'` each exercise.
- **Zero i18n** across all 11 workout components.

### Pillar 3 — Premium feel (sound, haptics, motion)
**Current state:** A thin but real premium layer; strong CSS motion vocabulary, `createRipple`, reduced-motion-aware `Confetti`.

- **Level-up is dead code** — `sounds.levelUp`/`haptics.levelUp` defined (`fx.ts:42,58`) but `play('levelUp')` is called nowhere; `addXP` changes level silently. The canonical dopamine moment does not exist.
- **Raw sine beeps, no envelope** (`fx.ts:11-26` — **verified**): full-volume oscillator with only a gain ramp → onset click, one timbre for every cue. Reads arcade-ish, not luxurious.
- **AudioContext never resumed** (`fx.ts:4-9` — **verified**): no gesture-bound unlock, bare `new AudioContext()` with no `webkit` fallback → first sounds drop on iOS.
- **PR has no real-time moment** — `SetLogger` has no PR awareness; `LogPage` always plays `'tap'`; PR sound only fires aggregated at save.
- **Reduced-motion honored for CSS/Confetti but not sound/haptics**; rest timer is a flat bar with one terminal beep; XP/streak never animate the gain moment; Confetti is untiered (same burst for a plain save and a multi-PR session); toast has no exit animation or per-type FX.

### Pillar 4 — KPIs & progressive overload
**Current state:** Broad KPI breadth but a fragmented, partly-broken overload story.

- **`isPR` written nowhere** (read in 6 places) — "PRs" KPI permanently 0, Latest-PR pill rarely shows, PR sound never fires for a real lift.
- **The only overload coaching (`suggestNextWeight`, trainingScience.ts:218) is hidden on CoachPage** and absent from the live `SetLogger`. The user is never told, at the moment of decision, how to progress.
- **Streak computed 3 times** with divergence and **UTC date-slicing** (`toISOString().slice(0,10)`) that mis-buckets a 1am MENA (UTC+3) workout — erodes trust in the headline motivator.
- **Plateau/deload signals computed but never surfaced** in the Progress tab; **ProgressiveOverload card is period-bucketed** and prints misleading zeros; weekly volume bars have no trend/number/comparison and sub-10px labels.
- **No per-exercise progression trajectory** view; weekly goal target hardcoded to 4; all copy hardcoded English.

### Pillar 5 — Offline-first robustness & mobile ergonomics
**Current state:** Genuinely strong local-first core; one critical SW gap plus meta/ergonomic polish.

- **No `navigateFallback`** in VitePWA (`vite.config.ts:47-49` — **verified**) → offline deep-link/refresh under the Pages base breaks the SPA. Highest-leverage offline fix.
- **`app.html` (the real build entry) is missing all PWA/mobile meta tags** — no `viewport-fit=cover` (so `env()` safe-area insets resolve to 0), no `theme-color`, no apple-touch / standalone tags. Degrades iOS standalone + notch handling.
- **No runtime caching** for Supabase (NetworkFirst+timeout) or fonts (CacheFirst) → cold offline launch hangs/FOUT.
- **`pushToCloud` re-uploads all ~13 keys on any mutation** (dead `pushKey` exists) → cross-device clobber risk + wasted metered bandwidth.
- **LWW relies on device-local timestamps** (clock-skew fragile); `writeStorage` has no QuotaExceeded guard; `OfflineBanner` is `pointerEvents:none` with dead code; 6-item BottomNav is dense on 360px phones.

---

## Prioritized recommendations

Sorted P0 → P2. Effort: S (≤1d), M (2-4d), L (1-2wk), XL (2wk+).

| # | Priority | Pillar | Recommendation | Effort | Target files |
|---|----------|--------|----------------|--------|--------------|
| 1 | **P0** | i18n | Make the language toggle actually work — export `applyLanguage(lng)` that calls `i18n.changeLanguage` + sets `dir`/`lang`; call it from `setLanguage` | **S** | `src/lib/i18n.ts`, `src/stores/useSettingsStore.ts`, `src/App.tsx`, `src/features/settings/components/SettingsForm.tsx` |
| 2 | **P0** | i18n | Define namespaced key taxonomy & expand `en.json`/`ar.json` (common/auth/nav/log/stats/workout/nutrition/toast/a11y/muscles/cardio/…) | **M** | `src/i18n/en.json`, `src/i18n/ar.json` |
| 3 | **P0** | i18n | Centralize date/number formatting on active locale — `src/lib/format.ts` (`formatDate`/`formatNumber`/`formatWeight`); replace 14+ `en-US` calls | **M** | `src/lib/format.ts` (new), `src/pages/StatsPage.tsx`, `src/pages/LogPage.tsx`, `src/features/dashboard/components/WeightChart.tsx`, `src/features/body/components/WeightLogger.tsx`, `src/features/body/components/InBodyLog.tsx`, `src/features/dashboard/components/PRBoard.tsx` |
| 4 | **P0** | Offline | Add `navigateFallback: 'app.html'` + allowlist to VitePWA workbox | **S** | `vite.config.ts` |
| 5 | **P0** | Offline | Move all PWA/mobile meta tags into `app.html` (`viewport-fit=cover`, theme-color, apple-touch, standalone) | **S** | `app.html` |
| 6 | **P0** | Logging | Prefill reps/weight from ghost sets + one-tap `+2.5kg`/`+1 rep` overload chip; make Ditto the primary action | **M** | `src/features/workout/components/SetLogger.tsx`, `src/features/workout/hooks/useGhostSets.ts` |
| 7 | **P0** | Logging | Add 44px +/- steppers to weighted reps & weight (match `BwLogger`) | **M** | `src/features/workout/components/SetLogger.tsx` |
| 8 | **P0** | Logging | Persist the active session to localStorage + "Resume workout?" banner | **M** | `src/stores/useSessionStore.ts`, `src/pages/LogPage.tsx`, `src/stores/rehydrate.ts` |
| 9 | **P0** | KPIs | Compute & persist `isPR` at save (`flagPRs` helper) → revives PR pill, "PRs" KPI, PR sound; per-PR toast | **M** | `src/lib/trainingScience.ts`, `src/stores/useSessionStore.ts`, `src/features/workout/components/SaveWorkoutModal.tsx`, `src/types/workout.ts` |
| 10 | **P0** | Premium | Rebuild `fx.ts` into a synth engine (envelopes, lowpass, layered tones) + one-time `unlockAudio()` on first pointer + `webkit` fallback | **M** | `src/lib/fx.ts`, `src/App.tsx` |
| 11 | **P0** | Premium | Wire a real level-up moment: detect threshold crossing, fire `levelUp` FX + tiered confetti + `LevelUpToast` | **M** | `src/stores/useGamificationStore.ts`, `src/features/workout/components/SaveWorkoutModal.tsx`, `src/components/ui/Confetti.tsx` |
| 12 | **P0** | Premium | Real-time PR moment at set log: `pr-pop` gold flash + `play('pr')` + inline PR badge | **M** | `src/features/workout/components/SetLogger.tsx`, `src/pages/LogPage.tsx`, `src/index.css` |
| 13 | **P0** | i18n | Migrate components to `useTranslation`, namespace by namespace (nav/header/auth → core loop → settings/nutrition → stats/history/coach); add eslint no-literal-string | **XL** | `src/components/layout/BottomNav.tsx`, `src/components/layout/Header.tsx`, `src/App.tsx`, `src/pages/LogPage.tsx`, `src/features/workout/components/SaveWorkoutModal.tsx`, `src/pages/MorePage.tsx`, `src/features/settings/components/SettingsForm.tsx`, `src/pages/StatsPage.tsx`, `src/pages/HistoryPage.tsx`, `src/pages/CoachPage.tsx`, `src/components/OfflineBanner.tsx` |
| 14 | **P1** | i18n | Convert physical CSS to logical properties (`ml-`→`ms-`, `left-`→`start-`, `text-left`→`text-start`); fix scroll-hint mask + marquee; rename `Input` props `startIcon`/`endSlot` | **L** | `src/index.css`, `src/components/ui/Input.tsx`, `src/components/ui/Toast.tsx`, `src/components/ui/Modal.tsx`, `src/App.tsx`, `src/components/layout/Header.tsx` |
| 15 | **P1** | KPIs | Bring overload coaching into the logger — `suggestNextWeight` target line + "Use target" prefill + "PR pace" badge | **M** | `src/features/workout/components/SetLogger.tsx`, `src/lib/trainingScience.ts`, `src/features/workout/hooks/useGhostSets.ts` |
| 16 | **P1** | Logging | "Repeat last workout" + saveable templates (`useTemplatesStore`, wire dead `WorkoutTemplate`) | **L** | `src/stores/useSessionStore.ts`, `src/pages/LogPage.tsx`, `src/features/workout/components/SaveWorkoutModal.tsx`, `src/types/workout.ts` |
| 17 | **P1** | Logging | Smart per-exercise rest timer that auto-starts after a set; learned duration by exercise/movement type | **M** | `src/features/workout/components/RestTimer.tsx`, `src/features/workout/components/SetLogger.tsx`, `src/stores/useSessionStore.ts`, `src/hooks/useTimer.ts` |
| 18 | **P1** | i18n | Wire `useTranslation` across all 11 workout components + verify RTL (chip row, stepper order, autocomplete icon, End-Session FAB) | **L** | `src/pages/LogPage.tsx`, `src/features/workout/components/*`, `src/i18n/ar.json` |
| 19 | **P1** | Premium | FX policy: respect reduced-motion for sound/haptics + iOS capability fallback; single `fx(event, {intensity})` | **S** | `src/hooks/useFX.ts`, `src/lib/fx.ts` |
| 20 | **P1** | Premium | Rest timer → draining SVG ring + 3-2-1 tick + completion chime; XP count-up + floating `+XP` chip + streak ignite | **M** | `src/features/workout/components/RestTimer.tsx`, `src/hooks/useTimer.ts`, `src/features/gamification/components/XPBar.tsx`, `src/features/workout/components/SessionStreakCard.tsx`, `src/index.css` |
| 21 | **P1** | KPIs | Surface plateau + deload signals in Progress tab + amber trend arrows; rewrite weekly volume into readable trend with headline delta | **M** | `src/pages/StatsPage.tsx`, `src/lib/trainingScience.ts`, `src/hooks/useProgressInsights.ts`, `src/features/dashboard/components/VolumeChart.tsx` |
| 22 | **P1** | Offline | Per-key `pushKey` instead of full-key re-upload; coalesce multi-key mutations | **M** | `src/hooks/useCloudSync.ts`, `src/lib/cloudSync.ts`, `src/lib/storage.ts` |
| 23 | **P1** | Offline | Runtime caching: Supabase NetworkFirst (4s timeout) + self-hosted fonts in precache | **M** | `vite.config.ts`, `src/index.css` |
| 24 | **P1** | Offline | Clock-skew-tolerant LWW (anchor `forge:sync:updated:<key>` to server `updated_at` via `.select()`) | **M** | `src/lib/cloudSync.ts`, `src/lib/storage.ts` |
| 25 | **P1** | Offline | Guard `writeStorage` against QuotaExceeded → `forge:storage-full` toast | **M** | `src/lib/storage.ts`, `src/components/ui/Toast.tsx` |
| 26 | **P1** | i18n | Domain-enum label layer (`muscles.*`/`cardio.*`, `labelForMuscle`); build joined titles from translated labels at render | **M** | `src/i18n/en.json`, `src/i18n/ar.json`, `src/features/workout/components/SaveWorkoutModal.tsx`, `src/pages/MorePage.tsx` |
| 27 | **P1** | i18n | i18next pluralization + interpolation for dynamic copy (`t('nutrition.logged',{name})`, count-bearing keys with Arabic plural set) | **M** | `src/i18n/en.json`, `src/i18n/ar.json`, `src/pages/MorePage.tsx`, `src/features/workout/components/SaveWorkoutModal.tsx` |
| 28 | **P2** | KPIs | Per-exercise progression detail view (session-over-session top-set/e1RM sparkline) | **L** | `src/features/dashboard/components/ExerciseProgressionCard.tsx` (new), `src/features/workout/components/TopExercisesCard.tsx`, `src/features/dashboard/components/PRBoard.tsx`, `src/pages/StatsPage.tsx` |
| 29 | **P2** | KPIs | Consolidate streak into one timezone-correct hook (local-date key, not UTC slice) | **M** | `src/hooks/useProgressInsights.ts`, `src/pages/StatsPage.tsx`, `src/features/workout/components/SessionStreakCard.tsx` |
| 30 | **P2** | KPIs | Configurable weekly goal target + at-a-glance "momentum" headline | **S** | `src/hooks/useProgressInsights.ts`, `src/pages/StatsPage.tsx`, `src/features/settings/index.ts` |
| 31 | **P2** | Logging | Global "Recent" quick-pick row + recency-weighted `TopExercisesCard` | **M** | `src/features/workout/components/TopExercisesCard.tsx`, `src/pages/LogPage.tsx`, `src/stores/useWorkoutStore.ts` |
| 32 | **P2** | Logging | Remember units (kg/lb) + last-used variation as learned prefs | **M** | `src/features/workout/components/SetLogger.tsx`, `src/features/workout/components/BwLogger.tsx`, `src/features/workout/components/SaveWorkoutModal.tsx` |
| 33 | **P2** | Logging | Tighten flow: inline "add next exercise", remove mandatory pre-save modal tap | **L** | `src/pages/LogPage.tsx`, `src/features/workout/components/SaveWorkoutModal.tsx` |
| 34 | **P2** | Logging | Harden `ExerciseAutocomplete` for touch + synonym matching + fix MuscleGroup/DB casing | **M** | `src/features/workout/components/ExerciseAutocomplete.tsx`, `src/lib/exercises-db.ts`, `src/types/workout.ts` |
| 35 | **P2** | i18n | RTL/locale-aware charts (`reversed={dir==='rtl'}`, localized tick labels) | **M** | `src/features/dashboard/components/{WeightChart,VolumeChart,FreqChart,BalanceChart}.tsx` |
| 36 | **P2** | i18n | Self-hosted Arabic display font (`:lang(ar)` IBM Plex Sans Arabic/Cairo) + SW precache | **M** | `src/index.css`, `app.html`, `src/lib/i18n.ts` |
| 37 | **P2** | Premium | Route-coordinated page transitions + real data-page skeletons | **L** | `src/App.tsx`, `src/pages/{StatsPage,HistoryPage,CoachPage}.tsx`, `src/index.css` |
| 38 | **P2** | Premium | Toast exit animation + typed per-toast FX + dedupe manual `play('error')` | **S** | `src/components/ui/Toast.tsx`, `src/index.css`, `src/App.tsx` |
| 39 | **P2** | Offline | Make `OfflineBanner` actionable (tap-to-retry) + remove dead/misleading code | **S** | `src/components/OfflineBanner.tsx`, `src/lib/syncQueue.ts` |
| 40 | **P2** | Offline | Reduce Header scroll re-renders + pause `SessionPill` timer when hidden | **S** | `src/components/layout/Header.tsx` |
| 41 | **P2** | Offline | Tighten BottomNav (≤5 items or labeled active, ≥48px on 360px), promote Log centrally | **S** | `src/components/layout/BottomNav.tsx` |
| 42 | **P2** | Offline | Custom install prompt (`beforeinstallprompt`) + "New version available" update toast | **M** | `src/App.tsx`, `src/main.tsx`, `src/pages/MorePage.tsx` |

---

## Waved rollout

Each wave is independently shippable and verifiable. Sequencing is dependency-driven: i18n plumbing (Wave 1) must land before bulk string migration; the synth engine + PR detection (Wave 2/3) must land before the celebration moments that depend on them.

### Wave 1 — Foundation + highest-impact quick wins
**Goal:** Make the Arabic/RTL framework actually live (the P0 market keystone that touches everything), land the offline SPA shell, and ship the two fastest "premium + faster logging" wins so the app feels measurably better day one — without breaking the working offline core.

**Items:**
- **Make the language toggle work** (#1) — in `src/lib/i18n.ts` add and export `applyLanguage(lng)` that calls `i18n.changeLanguage(lng)` and sets `document.documentElement.dir`/`lang`; call it from `useSettingsStore.setLanguage` after persisting; subscribe in `App.tsx`. This is the keystone — without it, every externalized string still won't switch.
- **Namespaced key taxonomy + catalog expansion** (#2) — build `src/i18n/en.json` as source of truth with feature namespaces, mirror to `src/i18n/ar.json`.
- **Central locale formatter** (#3) — add `src/lib/format.ts`; begin replacing `toLocaleDateString('en-US', …)` (latn digits, localized month/weekday names).
- **First-seen string migration** (#13, slice 1) — migrate `BottomNav.tsx` (refactor `NAV_ITEMS` to stable keys mapped through `t()` inside the component), `Header.tsx`, `App.tsx` AuthScreen, and `OfflineBanner.tsx` to `useTranslation`.
- **`navigateFallback`** (#4) — add `navigateFallback: 'app.html'` + `navigateFallbackAllowlist` to VitePWA workbox.
- **PWA/mobile meta tags in `app.html`** (#5) — `viewport-fit=cover`, `theme-color`, apple-touch + standalone tags (relative icon paths for the Pages base).
- **Prefill reps/weight from ghost sets** (#6) — initialize `SetLogger` inputs from `ghostSets[setIndex] ?? ghostSets.at(-1)`, keep editable, add `+2.5kg`/`+1 rep` chip, promote Ditto.
- **+/- steppers on weighted logger** (#7) — port the 44px stepper pattern from `BwLogger`.

**Verify:**
- Toggle Settings → Arabic: nav/header/auth/offline-banner text flips to Arabic AND layout mirrors; toggle back restores English. No reload needed.
- `npm run build` + serve `dist` under `/forge-gym-tracker/`, DevTools offline, hard-refresh `/forge-gym-tracker/log` → app shell loads (today it errors).
- iOS Safari Add-to-Home-Screen launches standalone with correct status bar; safe-area insets are non-zero.
- Open a previously-logged exercise → reps/weight are pre-filled with last session's values; `+2.5kg` chip bumps weight; steppers adjust without summoning the keyboard.
- `npm run build` and typecheck pass; no console errors; existing localStorage data still loads.

### Wave 2 — Logging reliability + the rest of the string migration
**Goal:** Guarantee no in-progress workout is ever lost, make repeat logging dramatically faster, and finish externalizing the core loop so Arabic users get a usable end-to-end logging experience.

**Items:**
- **Persist the active session** (#8) — mirror `useSessionStore` to a `forge-active-session` key on mutation (or zustand `persist`); lift in-progress `currentSets` from `LogPage` local state into the store; "Resume workout?" banner on boot if a recent `startTime` exists; clear on save/reset.
- **Core-loop string migration** (#13, slice 2 + #18) — `useTranslation` across `LogPage` and all 11 workout components (`SetLogger`, `MuscleGroupPicker`, `ExerciseAutocomplete`, `RestTimer`, `BwLogger`, `CardioLogger`, `SaveWorkoutModal`, `TopExercisesCard`, `ProgressGuide`), including interpolated toasts; add the Arabic strings.
- **Settings/Nutrition migration** (#13, slice 3) — `MorePage`, `SettingsForm`, nutrition section.
- **Domain-enum label layer** (#26) — `muscles.*`/`cardio.*` + `labelForMuscle`; build joined workout titles from translated labels at render, keep stored data language-neutral; pass user-entered exercise/meal names verbatim.
- **Pluralization + interpolation** (#27) — convert concatenated strings to `t('key', {count})` with the Arabic plural set.
- **"Repeat last workout" + templates** (#16) — `useTemplatesStore`, wire the dead `WorkoutTemplate`, "Repeat last session" + "Save as template", ghost-prefilled on load.

**Verify:**
- Start a session, log 2 exercises, pull-to-refresh / kill the tab → "Resume workout?" restores muscle, exercise, all sets, and rest timer.
- Switch to Arabic and run a full log → finish session: zero English leaks in the core loop; muscle/cardio names show Arabic; user-typed exercise names stay verbatim; plural set/rep counts are grammatically correct.
- "Repeat last session" reloads all exercises with last weights pre-filled; saving a template and re-running it works offline.
- Build + typecheck pass; eslint no-literal-string surfaces a shrinking checklist.

### Wave 3 — Motivation engine: PRs, level-up, and a premium audio core
**Goal:** Make the app emotionally rewarding — fix the broken PR pipeline, light up the dead level-up moment, and replace arcade beeps with a reliable, premium synth that works on iOS.

**Items:**
- **Premium synth engine + audio unlock** (#10) — rebuild `fx.ts` with `playTone({freq,dur,type,attack,decay,filter})`, layered detuned tones for celebratory cues, `unlockAudio()` bound to first `pointerdown` in `App.tsx`, `ctx.resume()` at top of every `play`, `webkitAudioContext` fallback. Zero assets (offline-safe).
- **Fix PR detection** (#9) — `flagPRs(sets, exerciseName, history)` in `trainingScience.ts`, called on finalize in `useSessionStore`; persist real `isPR`; revives Latest-PR pill, "PRs" KPI, PR sound; per-PR toast.
- **Real-time PR moment** (#12) — pass previous best into `SetLogger`; on a beating set set `isPR`, `play('pr')`, `pr-pop` gold flash, inline PR badge.
- **Level-up moment** (#11) — compute `getLevel()` before/after in `addXP`, return `leveledUp`; branch celebration in `SaveWorkoutModal` (level-up → full confetti + `levelUp` fanfare + `LevelUpToast`; PR → gold burst; plain → subtle).
- **FX policy + accessibility** (#19) — reduced-motion dampening for celebratory sound/haptics; iOS vibrate capability detection; single `fx(event, {intensity})`.
- **Overload coaching in the logger** (#15) — `suggestNextWeight` target line + "Use target" prefill + "PR pace" badge.
- **Rest timer ring + XP/streak animation** (#20) — draining SVG ring, 3-2-1 tick, completion chime; XP count-up + floating `+XP` chip; streak ignite.

**Verify:**
- First tap of a session produces immediate, click-free audio on iOS Safari (today the first cues drop).
- Log a set heavier than all-time best → gold `pr-pop` + distinct PR sound at that instant; "PRs" KPI and Latest-PR pill now populate; SessionPoster shows the PR.
- Earn enough XP to cross a level threshold on save → full-screen confetti + level-up fanfare + `LevelUpToast` (previously silent).
- Enable reduced-motion → celebratory sounds/long vibrations dampen; functional taps remain.
- Build + typecheck pass; reduced-motion still kills CSS animation.

### Wave 4 — KPI clarity + sync hardening
**Goal:** Turn the broad-but-buried KPI surface into a trustworthy, motivating progression story, and harden the sync/storage layer for metered MENA connections and cheap devices.

**Items:**
- **Plateau/deload + weekly volume trend** (#21) — "Stuck lifts" card + amber trend arrows in Progress tab; Recharts weekly volume with Y axis + headline "this week +8%" delta; ≥11px labels.
- **Per-exercise progression view** (#28) — `ExerciseProgressionCard` (session-over-session top-set / Epley e1RM sparkline), tap-through from `TopExercisesCard`/`PRBoard`.
- **Timezone-correct streak consolidation** (#29) — single hook, local-date key (fixes 1am UTC+3 mis-bucketing).
- **Configurable weekly goal + momentum headline** (#30).
- **Per-key `pushKey`** (#22) — read mutated key from `forge:mutated`, push only that key; coalesce multi-key windows.
- **Runtime caching** (#23) — Supabase NetworkFirst (4s timeout) + self-hosted fonts in precache.
- **Clock-skew-tolerant LWW** (#24) — anchor timestamps to server `updated_at`.
- **QuotaExceeded guard** (#25) — `forge:storage-full` toast.

**Verify:**
- Progress tab shows real per-lift trend arrows and a "X weeks stuck" callout; weekly volume shows a readable number + delta.
- Streak count is identical across Stats and SessionStreakCard; a 1am local workout counts on the correct day.
- DevTools throttled/offline: only the mutated key uploads (Network tab); cold offline launch renders correct fonts (no FOUT) and fails Supabase calls fast.
- Build + typecheck pass; existing synced data reconciles without loss across two devices.

### Wave 5 — Final polish + RTL completeness
**Goal:** Close the remaining RTL gaps, complete the premium motion polish, and finish ergonomic + install refinements.

**Items:**
- **Logical CSS properties** (#14) — `ml-`→`ms-`, `left-`→`start-`, `text-left`→`text-start`, `rounded-l/r`→`rounded-s/e`; fix scroll-hint mask + marquee; rename `Input` props `startIcon`/`endSlot`.
- **RTL/locale-aware charts** (#35) and **Arabic display font** (#36, self-hosted + precached).
- **Route transitions + skeletons** (#37); **Toast exit + typed FX** (#38).
- **Stats/History/Coach + remaining string migration** (#13, final slice).
- **Recent quick-pick + recency-weighted top list** (#31); **units/variation prefs** (#32); **flow tightening** (#33); **autocomplete hardening** (#34).
- **OfflineBanner actionable** (#39); **Header/SessionPill perf** (#40); **BottomNav tightening** (#41); **install prompt + update toast** (#42).

**Verify:**
- Full app sweep in Arabic on a 360px viewport: every screen mirrors correctly (icons, steppers, FAB, charts), Arabic font renders, zero English leaks (eslint checklist empty).
- Reduced-motion still collapses route transitions; charts read right-to-left in RTL.
- Install prompt appears and installs; update toast surfaces on new deploy.
- Lighthouse PWA + a11y pass; build + typecheck green.

---

## Risks & guardrails

**Keep the app working & offline at all times:**
- **Never regress the local-first core.** All writes must stay routed through `writeStorage` (which stamps `forge:sync:updated:<key>` and fires `forge:mutated`). When persisting the active session (#8), use the same `readStorage`/`writeStorage` pattern as `useCustomExercisesStore` — do not bypass it.
- **`app.html` is the only build entry** (`rollupOptions.input.app`, verified). All meta-tag and font changes go in `app.html`, never the legacy `index.html`. Icon/font paths must be **relative** (no leading slash) to resolve under `/forge-gym-tracker/`.
- **i18n catalogs must remain statically imported** in `i18n.ts` so they ship in the bundle and work offline. Do not lazy-load namespaces over the network without an offline fallback.
- **Don't break the in-flight migration commits.** Status shows ~25 modified files already in progress (BodyMap, UI primitives, stores). Coordinate the logical-CSS and prop-rename changes (#14) with those edits to avoid conflicts; do the `Input` `leftIcon`→`startIcon` rename in one atomic pass across all 16 usages.

**Don't regress data integrity:**
- Switching to per-key `pushKey` (#22) and server-anchored timestamps (#24) changes sync semantics — gate behind a build, test two-device reconcile before merge, and keep `pushToCloud` for the explicit import/reconcile path.
- `isPR` persistence (#9) must be **additive** and idempotent — recomputing on existing history must not corrupt already-saved workouts; treat missing history as "no PR," never crash.
- Storing the active session must `clear()` on save/reset to avoid a stale "Resume?" prompt after a completed session.

**Premium changes must stay accessible:**
- All new sound/haptic/motion must honor `prefers-reduced-motion` (centralize in FX policy #19). Audio must degrade silently if Web Audio is unavailable (keep the existing `try/catch`).
- Never assume `navigator.vibrate` exists (iOS) — capability-detect and lean on audio/visual.

**Test/build gates (every wave):**
- `npm run build` + TypeScript typecheck must pass (build is the type gate; `sourcemap: true` is on).
- Manual smoke: offline hard-refresh on a deep route loads the shell; Arabic toggle flips text + direction live; a full log → save round-trips and persists to localStorage; cloud sync reconciles across two sessions.
- Add the eslint `no-literal-string` rule (#13) scoped to `src/` as a **living regression checklist** for untranslated strings — target zero by end of Wave 5.
- Keep each wave behind a clean commit so any wave can ship or roll back independently.

**Rollback posture:** Each P0 in Wave 1 is small and independently revertable (i18n toggle, `navigateFallback`, meta tags, prefill, steppers). If the synth rebuild (#10) or PR pipeline (#9) misbehaves, the prior `fx.ts`/save path can be restored without touching the rest of the wave.
