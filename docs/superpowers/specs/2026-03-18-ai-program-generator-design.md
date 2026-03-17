# AI Program Generator — Design Spec
**Date:** 2026-03-18
**Version target:** v232
**Status:** Approved for implementation

---

## Overview

Replace the static `TRAINING_PROGRAMS` template grid in the Programs panel with an AI-powered program generator. Users define a custom weekly split (muscle group combinations per day), optionally pre-filled from `forge_split`. The LLM (Claude via `forge-search` Edge Function) generates personalized exercises for each day based on user context. Users can preview, refine with a text note, and regenerate before activating.

---

## UI Flow

```
Programs Panel (no active program)
│
├─ [GENERATE MY PROGRAM] button   ← replaces static template grid
│
▼
Step 1 — Split Builder
  "How many training days?"  [3] [4] [5] [6]
  For each day slot:
    "Day N" label + muscle group chip multi-select
    Available chips: Chest · Back · Shoulders · Biceps · Triceps ·
                     Legs · Glutes · Calves · Core · Traps ·
                     Hamstrings · Quads · Forearms
  Pre-filled from forge_split if ≥1 non-Rest day exists
  [GENERATE →] button (disabled if any day has 0 muscles)
│
▼
Generating state
  Spinner + "Building your program…"
│
▼
Preview state
  Program name (AI-chosen, displayed as heading)
  Day strip: colored chips (Day 1 / Day 2 / …)
  Per-day cards: label + exercise list (name · sets × reps)
  ─────────────────────────────────────────────────────
  Refinement input placeholder: "e.g. make it 4 days, no leg press"
  [REGENERATE]   [ACTIVATE ✓]
│
▼
Active program (existing flow unchanged)
  Today's session card → startProgramWorkout() → workout logger
```

---

## Data Layer

### Context Sent to LLM

Built by `_buildProgramContext(splitDays)` where `splitDays` is an array of `{ muscles: string[] }`:

| Source | Fields used |
|---|---|
| `userProfile` / `forge_profile` | `goal`, `weight`, `age`, `gender` |
| `forge_mesocycle` | `phase` (Hypertrophy/Strength/Cut/Maintenance/Deload), `durationWeeks` |
| `FORGE_OVERLOAD.getMuscleOverloadScore(muscle)` | Per-muscle scores — identify lagging muscles (score < 50%) |
| Last InBody entry (`forge_inbody`) | `bf`, `smm` |
| Last 20 workouts (`forge_workouts` / `workouts` global) | Exercise names + muscle groups (what the user actually does) |
| User-defined split | Array of muscle combos per day |

### LLM Prompt Structure (plain text, no markdown)

```
You are a personal training coach. Generate a weekly training program.

User profile: goal=muscle_gain, weight=85kg, age=28, gender=male
Current phase: Hypertrophy (8 weeks)
Lagging muscles (overload <50%): shoulders, biceps
Recent exercises: Bench Press, Squat, Deadlift, OHP, Pull-ups

Training days requested:
Day 1: Chest, Triceps
Day 2: Back, Biceps, Core
Day 3: Legs, Glutes, Calves

Return ONLY a JSON code block. No explanation. Format:
{
  "name": "Program name (max 5 words)",
  "days": [
    {
      "label": "Push Day",
      "muscles": ["chest","triceps"],
      "exercises": [
        {"name":"Bench Press","sets":4,"reps":"8-10"},
        {"name":"Incline DB Press","sets":3,"reps":"10-12"},
        {"name":"Cable Fly","sets":3,"reps":"12-15"},
        {"name":"Tricep Pushdown","sets":3,"reps":"10-12"},
        {"name":"Overhead Tricep Extension","sets":3,"reps":"12-15"}
      ]
    }
  ]
}
Provide 4-6 exercises per day. Prioritize lagging muscles. Use exercises the user has logged before where appropriate.
```

### LLM Response Parsing

1. Collect full SSE stream into a string
2. Extract JSON from ` ```json ... ``` ` code block (regex)
3. `JSON.parse()` the extracted string
4. Validate: `result.name` (string), `result.days` (array, length matches requested days), each day has `label`, `muscles`, `exercises` array
5. On parse/validation failure: show error toast + "Try regenerating"

### Generated Program Storage

Key: `forge_ai_program`

```json
{
  "name": "Hypertrophy Split",
  "days": [
    {
      "label": "Push Day",
      "muscles": ["chest", "triceps"],
      "exercises": [
        {"name": "Bench Press", "sets": 4, "reps": "8-10"},
        {"name": "Incline DB Press", "sets": 3, "reps": "10-12"}
      ]
    }
  ],
  "generatedAt": "2026-03-18",
  "splitDays": 3
}
```

No new Supabase columns. No new localStorage keys beyond `forge_ai_program`.

---

## Active Program Integration

`program-panel.js` `_activeProg` reads from `forge_ai_program` when present:
- `prog.days` array maps to existing day chip + session card rendering
- `startProgramWorkout()` loads `day.exercises[0].name` into the exercise input (existing behavior)
- `day.exs` array (existing field) is populated from `day.exercises.map(e => e.name)`
- `day.muscle` (existing field) is populated from `day.muscles[0]` (primary muscle for `selectMuscle()`)

The existing `activateProgram()` / `deactivateProgram()` functions are replaced by `_aiProgramActivate()` / `_aiProgramDeactivate()` which read/write `forge_ai_program`.

---

## File Structure

### New file: `js/ai-program-generator.js`
IIFE, ~250 lines. Responsibilities:
- `renderAIProgramGenerator()` — main entry point, renders split builder or preview or generating state into `#programs-panel-body`
- `_buildSplitBuilder(prefill)` — renders day count picker + muscle chip rows
- `_buildProgramContext(splitDays)` — assembles LLM prompt string
- `_callProgramLLM(prompt, refinementNote)` — calls `forge-search`, collects stream, returns raw text
- `_parseProgramResponse(raw)` — extracts + validates JSON, returns program object or null
- `_renderProgramPreview(program, splitDays)` — renders preview cards + refinement input + buttons
- `_aiProgramActivate(program)` — saves to `forge_ai_program`, calls `renderProgramPanel()`
- `_aiProgramDeactivate()` — clears `forge_ai_program`, calls `renderProgramPanel()`
- Exports to `window`: `window.renderAIProgramGenerator`, `window._aiProgramActivate`, `window._aiProgramDeactivate`

### Modify: `js/program-panel.js`
- `renderProgramPanel()`: when no active program, call `renderAIProgramGenerator()` instead of rendering static `TRAINING_PROGRAMS` grid
- `_activeProg` init: check `forge_ai_program` first
- `activateProgram()` / `deactivateProgram()`: delegate to `_aiProgramActivate` / `_aiProgramDeactivate` when AI generator is available
- `_getProgramDayIndex()`: works unchanged (date arithmetic on `startDate`)

### `index.html` changes
1. `<script src="js/ai-program-generator.js">` after `program-panel.js`

### `js/config.js`
`v231` → `v232`

---

## Auth Gate

- Check `window._forgeUser` (existing auth check pattern)
- If not signed in: render `<div class="apg-auth-gate">Sign in to generate your AI program.</div>` in place of generate button

---

## Error Handling

| Scenario | Behavior |
|---|---|
| JSON parse fails | Toast "Couldn't parse program — try regenerating" + show Regenerate button |
| Network error | Toast "Connection error — check your internet" |
| LLM returns wrong day count | Validate and show error + Regenerate |
| No muscles selected for a day | Disable GENERATE button, show inline hint |
| Guest user | Auth gate message instead of button |

---

## CSS Classes (new, prefixed `apg-`)

```
apg-wrap, apg-section-title
apg-day-count-row, apg-day-count-btn (active state)
apg-day-slot, apg-day-slot-label
apg-muscle-chips, apg-chip (selected state)
apg-generate-btn, apg-generating
apg-preview-name, apg-day-strip, apg-day-card
apg-exercise-row (name · sets × reps)
apg-refine-input, apg-regen-btn, apg-activate-btn
apg-auth-gate
```

---

## Constraints

- Vanilla JS IIFE only — no new dependencies
- `forge-search` Edge Function reused (no backend changes)
- `let` globals accessed directly (`workouts`, `userProfile`) — never `window.X`
- XSS: all LLM-returned strings via `textContent` or escaped before innerHTML
- `max_tokens: 800` for the LLM call (sufficient for 3–6 day programs)
- Auth-gated — guests cannot generate
