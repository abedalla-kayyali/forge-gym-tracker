# FORGE Coach Enhancement Master Spec

**Date:** 2026-03-17
**Status:** Approved
**Versions:** v222 → v226

---

## Problem Statement

The Coach section has two tiers that users cannot distinguish:

- **Fake AI** (Coach tabs — Insights chips, Train, Plan, Nutrition cards): 100% rule-based math and if/else branches
- **Real AI** (Ask FORGE FAB, Today LLM brief, muscle recovery intercept): actual Claude Haiku streaming via `forge-search` edge function

Users believe the coach tabs give AI advice. They get `_askCoach(idx)` rule branches. Every enhancement in this spec either closes that gap or adds net-new intelligence.

---

## Current Architecture (v221)

### Real AI (exists)
- `FORGE_COACH.checkDailyReadiness()` — LLM 1-sentence morning brief on Today tab open (80 tokens)
- `FORGE_COACH.checkMuscleRecovery(muscle)` — LLM recovery warning on muscle select (80 tokens)
- `FORGE_COACH.checkPlateau(exercise)` — LLM plateau tip on post-workout save (80 tokens)
- `FORGE_COACH.fetchFormCue(exercise)` — LLM form tip on plateau >= 2 sessions (150 tokens)
- Ask FORGE FAB (`rag-search.js`) — Full RAG, Claude Haiku, 900 tokens, 3-turn memory, voice, saved answers

### Fake AI (to upgrade)
- `_askCoach(idx)` in `index.html:5301-5391` — 5 pre-wired chips with rule-based answers
- `_enhanceInsightsTab()` in `coach-state.js:473-510` — pure arithmetic KPIs, no plateau context
- `renderCoachTrain()` — global +2.5% overload, auto-reg not wired to split sessions
- `renderCoachPlan()` — template-only, no fatigue index
- `renderCoachNutrition()` — rule macros, no adherence AI
- `renderCoachCardio()` — rule-based zone suggestions only

### Key Infrastructure
- `forge-search` Supabase edge function: `{ query, user_context, coach_mode, coach_system, max_tokens, type_filter, history }`
- `buildUserContext()` in `rag-search.js` — 2000-char profile + stats summary (not yet exported to window)
- `coach-triggers.js` — cooldown system (10-min per trigger key), SSE streaming display
- `overload-engine.js` — `getPlateauLength(exercise)`, `getOverloadContext(exercise)` available
- `workout-save.js` — fires after every workout save, good hook point for debrief trigger

---

## 5 Enhancement Pillars

### Pillar 1 — Proactive Triggers (v223)
*Coach watches and speaks without being asked*

| ID | Feature | File | Priority |
|----|---------|------|----------|
| 1A | Muscle recovery intercept — LLM warns + suggests alternatives when selecting recently-trained muscle | `coach-triggers.js` | P0 |
| 1B | MRV-aware recovery heatmap — per-muscle MRV limits replace flat 48h timer | `coach-triggers.js`, `coach-state.js` | P0 |
| 1C | Macro auto-steering — 10-day weight stall on fat_loss goal → 1-tap carb reduction card | `coach-triggers.js`, `renderCoachToday()` | P1 |

### Pillar 2 — Live Session Feedback (v224)
*Coach is in the room while you train*

| ID | Feature | File | Priority |
|----|---------|------|----------|
| 2A | Ghost Mode — live +delta vs last session as user types weight/reps | `index.html` workout log | P0 |
| 2B | PR Celebration — confetti + chime when PR detected on save | `fx-visuals.js`, `workout-save.js` | P1 |
| 2C | Adaptive rest timer — compounds 3-5min, isolations 2-3min, based on RIR | rest timer logic | P1 |
| 2D | Auto-reg for split sessions — wire `applyProgramAutoRegulation` to manual split | `coach-plan-controls.js`, `renderCoachTrain()` | P1 |

### Pillar 3 — Voice & Form (v225)
*Hands-free gym floor experience*

| ID | Feature | File | Priority |
|----|---------|------|----------|
| 3A | Voice-to-Log — mic → forge-parse → auto-fill set/weight/reps | `js/voice-log.js` (new) | P1 |
| 3B | Plateau form cue — proactive form tip when plateau >= 2 sessions | `coach-triggers.js` | P1 |
| 3C | Pre-session form cue — fetch tips before session starts | `coach-triggers.js` | P2 |

### Pillar 4 — Tab Intelligence (v222 partial, v226 full)
*Every tab gives real insight, not just numbers*

| ID | Feature | File | Priority |
|----|---------|------|----------|
| 4A | Insights — wire `overload-engine` plateau detection → per-muscle AI hint card | `coach-state.js` | **P0 — v222** |
| 4B | Insights — replace 5 static chips with LLM-generated dynamic insight cards | `coach-state.js`, `index.html` | P1 — v226 |
| 4C | Nutrition — `checkNutritionAdherence()` LLM trigger when adherence < 80% | `coach-triggers.js` | P1 — v226 |
| 4D | Cardio — zone-based AI suggestion using readiness + last intensity | `coach-state.js` | P2 — v226 |
| 4E | Plan — fatigue index + weekly volume vs MRV target | `index.html` | P2 — v226 |
| 4F | Cali — detraining risk alert if tree dormant > 14 days | `index.html` | P2 — v226 |

### Pillar 5 — Coach Intelligence Layer (v222 partial, v226 full)
*Coach remembers, learns patterns, adapts voice*

| ID | Feature | File | Priority |
|----|---------|------|----------|
| 5A | Session debrief — post-workout 3-line LLM debrief card | `coach-triggers.js`, `workout-save.js` | **P0 — v222** |
| 5B | Coach bar → real LLM — swap `_askCoach(idx)` rule branches for `forge-search` call | `index.html`, `rag-search.js` | **P0 — v222** |
| 5C | Conversation persistence — save last 3 Ask FORGE turns to localStorage | `rag-search.js` | P1 — v226 |
| 5D | Streak-aware brief tone — morning brief adapts language by streak + goal proximity | `coach-triggers.js` | P2 — v226 |

---

## Version Roadmap

| Version | Theme | Chunks |
|---------|-------|--------|
| **v222** | Real AI everywhere | 4A + 5A + 5B |
| **v223** | Proactive coach | 1A + 1B + 1C |
| **v224** | In-session coach | 2A + 2B + 2C + 2D |
| **v225** | Hands-free | 3A + 3B |
| **v226** | Deep analytics | 4B-F + 5C-D |

---

## v222 Detailed Design

### 4A — Insights Plateau Detection

**Goal:** Show per-exercise plateau hints in the Insights tab using data from `overload-engine.js`.

**How:**
- In `_enhanceInsightsTab()` (`coach-state.js:473`), after existing KPI cards, iterate all exercises in workout history
- Call `window.getPlateauLength?.(exerciseName)` or `window.overloadEngine?.getPlateauLength(exerciseName)` per exercise
- If any exercise has plateau >= 3 sessions, render a `.coach-plateau-hint` card:
  - Icon + "Plateau Alert: [exercise] — [N] sessions at same weight"
  - CTA: "Ask AI Coach" → `FORGE_ASK.openWithQuery('Plateau on [exercise], what should I change?')`
- Cap at 3 plateau cards maximum (show worst offenders only)
- Fallback gracefully if overload-engine not loaded

**Data source:** `window.getPlateauLength(exerciseName)` returns number of consecutive sessions at same weight.

---

### 5A — Session Debrief Card

**Goal:** After every workout save, coach auto-generates a 3-line debrief shown as an intercept card.

**How:**
- Add `FORGE_COACH.generateSessionDebrief(workoutSummary)` to `coach-triggers.js`
- Called from `workout-save.js` after save completes (alongside existing `FORGE_COACH.checkPlateau()`)
- Cooldown: once per session (key: `'session_debrief_' + dateString`)
- Query template:
  ```
  Workout complete: [N sets, muscle groups, volume delta vs last session, overload status].
  Goal: [goal]. Give a 3-line debrief: (1) what was accomplished, (2) overload verdict, (3) recovery recommendation.
  ```
- `coach_mode: true`, `max_tokens: 150`
- Display: inject `.coach-intercept-card` at top of `#view-log` content area
- Auto-dismiss after 30 seconds or on user tap

---

### 5B — Coach Bar Real LLM

**Goal:** Replace `_askCoach(idx)` rule branches with actual Claude streaming responses.

**How:**
- Export `buildUserContext` from `rag-search.js`: add `window._forgeUserContext = buildUserContext` at bottom of file
- In `index.html` `_askCoach(idx)`:
  1. Get question text from `questions[idx]`
  2. Show loading state in `.coach-bubble.ask-answer`
  3. Call `forge-search` via fetch with:
     - `query`: question text
     - `user_context`: `window._forgeUserContext?.() || ''`
     - `coach_mode: true`
     - `max_tokens: 150`
  4. Stream SSE tokens into the answer bubble (same pattern as `coach-triggers.js`)
  5. Keep existing chip UI — only the answer generation changes
- Fallback to existing rule-based answer if `forge-search` call fails

**Why 150 tokens:** Inline answer in the Insights tab needs to be concise. Full RAG answers (900 tokens) go through Ask FORGE FAB.

---

## Non-Goals (v222)

- No changes to Ask FORGE FAB (already real LLM, premium UX)
- No new UI tabs or tab reordering
- No wearable integrations
- No changes to readiness scoring formula
- No new localStorage keys (uses existing `forge_readiness`, `workouts`, etc.)

---

## Testing Checklist (v222)

- [ ] Insights tab shows plateau card for any exercise with 3+ same-weight sessions
- [ ] Plateau card CTA opens Ask FORGE with pre-filled query
- [ ] No plateau card shown if no plateaus exist (empty state clean)
- [ ] Session debrief card appears after saving a workout
- [ ] Session debrief only fires once per day (cooldown works)
- [ ] Coach bar chips fire real streaming response (not static text)
- [ ] Coach bar answers are concise (< 150 tokens)
- [ ] Coach bar fallback works when offline (rule-based answer shown)
- [ ] `check_v3.js` passes: Inline OK: 1  External OK: 61  Failed: 0
- [ ] Version bumped to v222 in `js/config.js` + `sw.js`
