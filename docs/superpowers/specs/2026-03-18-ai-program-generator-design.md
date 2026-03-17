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

Built by `_buildProgramContext(splitDays, refinementNote)` where `splitDays` is an array of `{ muscles: string[] }`:

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

If `refinementNote` is non-empty, append as the final line of the prompt:
```
User refinement note: <refinementNote>
```

### forge-search Fetch Call

`_callProgramLLM` uses the exact same pattern as `coach-triggers.js` (`_fireCoachMessage`):

```js
const session = await window._sb?.auth?.getSession?.();
const token = session?.data?.session?.access_token;
// if no token → return null (auth gate)

const resp = await fetch(SEARCH_FN, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    query: prompt,          // full prompt string
    type_filter: null,
    coach_mode: true,
    coach_system: 'You are a personal training program generator. Return only valid JSON.',
    max_tokens: 800
  })
});
```

`SEARCH_FN = window.FORGE_CONFIG?.SUPABASE_URL + '/functions/v1/forge-search'`

### SSE Stream Collection

Follow the exact buffered decode pattern from `coach-triggers.js`:

```js
const reader = resp.body?.getReader();
let text = '', buf = '';
const decoder = new TextDecoder();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buf += decoder.decode(value, { stream: true });
  const lines = buf.split('\n'); buf = lines.pop();
  for (const ln of lines) {
    if (!ln.startsWith('data: ')) continue;
    const raw = ln.slice(6).trim();
    if (raw === '[DONE]') break;
    try { text += JSON.parse(raw)?.token || ''; } catch {}
  }
}
// text now contains full LLM response string
```

### LLM Response Parsing

1. Collect full SSE stream into `text` string (see above)
2. Extract JSON: `const m = text.match(/```json\s*([\s\S]*?)```/); const jsonStr = m?.[1]?.trim();`
3. `JSON.parse(jsonStr)`
4. Validate: `result.name` (string), `result.days` (array, length === requested day count), each day has `label` (string), `muscles` (array), `exercises` (array with ≥1 item each having `name`, `sets`, `reps`)
5. On parse/validation failure: return `null` → caller shows error toast + Regenerate button

### Generated Program Storage

Key: `forge_ai_program`

```json
{
  "name": "Hypertrophy Split",
  "startDate": "2026-03-18",
  "generatedAt": "2026-03-18",
  "splitDays": 3,
  "days": [
    {
      "label": "Push Day",
      "muscles": ["chest", "triceps"],
      "exercises": [
        {"name": "Bench Press", "sets": 4, "reps": "8-10"},
        {"name": "Incline DB Press", "sets": 3, "reps": "10-12"}
      ]
    }
  ]
}
```

`_aiProgramActivate(program)` writes `startDate` as today's ISO date (`new Date().toISOString().slice(0,10)`) into the stored object before saving. This is required by `_getProgramDayIndex()` which uses date arithmetic on `startDate`.

No new Supabase columns. No new localStorage keys beyond `forge_ai_program`.

---

## Active Program Integration

### Storage Precedence

`_activeProg` in `program-panel.js` is initialized by reading `forge_ai_program` first. The old static active-program key is `forge_active_program`. Precedence:

1. `forge_ai_program` — wins if present (AI-generated program)
2. `forge_active_program` — legacy static template activation (kept for backwards compatibility, but no new writes)

If `forge_ai_program` exists, `_activeProg` is set to the AI program object. `forge_active_program` is ignored.

### Shape Adapter

`program-panel.js` renders `_activeProg` using `day.exs[]` and `day.muscle`. AI program days use `day.exercises[]` and `day.muscles[]`. The adapter runs once at init and when rendering:

```js
// Convert AI program day → panel-compatible shape
function _adaptDay(day) {
  return {
    ...day,
    exs:   day.exs   || day.exercises.map(e => e.name),
    muscle: day.muscle || day.muscles[0]  // primary muscle for selectMuscle()
  };
}
```

`day.muscles[0]` as the primary muscle for `selectMuscle()` is intentional — the workout logger filters by one muscle at a time. All muscles in the combo are shown as labels in the session card UI but only the primary is passed to `selectMuscle()`.

### Activation / Deactivation

`_aiProgramActivate(program)`:
1. Sets `program.startDate = new Date().toISOString().slice(0,10)`
2. `localStorage.setItem('forge_ai_program', JSON.stringify(program))`
3. Calls `renderProgramPanel()`

`_aiProgramDeactivate()`:
1. `localStorage.removeItem('forge_ai_program')`
2. Calls `renderProgramPanel()` → shows split builder again

`_getProgramDayIndex()` works unchanged — date arithmetic on `startDate`.

---

## File Structure

### New file: `js/ai-program-generator.js`
IIFE, ~280 lines. Responsibilities:
- `renderAIProgramGenerator()` — main entry point, renders split builder into `#programs-panel-body`
- `_buildSplitBuilder(prefill)` — renders day count picker + muscle chip rows; `prefill` is array of `{muscles:[]}` from `forge_split` if available
- `_buildProgramContext(splitDays, refinementNote)` — assembles full LLM prompt string
- `_callProgramLLM(prompt)` — calls `forge-search` with SSE buffered decode, returns full text string or null on error
- `_parseProgramResponse(raw, expectedDays)` — extracts JSON from code block, validates structure, returns program object or null
- `_renderProgramPreview(program, splitDays)` — renders preview cards + refinement input + Regenerate/Activate buttons into `#programs-panel-body`
- `_aiProgramActivate(program)` — writes `startDate`, saves to `forge_ai_program`, calls `renderProgramPanel()`
- `_aiProgramDeactivate()` — removes `forge_ai_program`, calls `renderProgramPanel()`
- Exports to `window`: `window.renderAIProgramGenerator`, `window._aiProgramActivate`, `window._aiProgramDeactivate`

### Modify: `js/program-panel.js`
- `_activeProg` init (top of file): read `forge_ai_program` first; fall back to `forge_active_program`
- `renderProgramPanel()`: when `!_activeProg`, call `window.renderAIProgramGenerator?.()` instead of rendering static `TRAINING_PROGRAMS` grid
- When rendering active program day cards: run `_adaptDay(day)` (defined in `ai-program-generator.js`, exported to `window._adaptDay`) to normalize `exs`/`muscle` fields

### `index.html` changes
1. `<script src="js/ai-program-generator.js">` immediately after `<script src="js/program-panel.js">`

### `css/main.css`
Append all `apg-*` CSS classes to the end of `css/main.css` (same pattern as weekly-review `.wr-*` classes).

### `js/config.js`
`v231` → `v232`

---

## Auth Gate

- Get session token via `window._sb?.auth?.getSession?.()`
- If token is null/undefined: render `<div class="apg-auth-gate">Sign in to generate your AI program.</div>` in `#programs-panel-body`
- Auth check happens inside `_callProgramLLM` — if no token, return null immediately

---

## Error Handling

| Scenario | Behavior |
|---|---|
| JSON parse fails | `_parseProgramResponse` returns null → show error message + Regenerate button (no toast) |
| Network / fetch error | Catch block → show "Connection error — try again" inline + Regenerate button |
| LLM returns wrong day count | Validation in `_parseProgramResponse` returns null → same as parse failure |
| No muscles selected for a day | GENERATE button stays disabled; inline hint: "Select muscles for each day" |
| Guest user (no token) | `apg-auth-gate` message shown instead of split builder |
| LLM returns no JSON code block | regex match returns null → same as parse failure |

---

## CSS Classes (new, prefixed `apg-`, appended to `css/main.css`)

```
apg-wrap, apg-section-title
apg-day-count-row, apg-day-count-btn (+ .active state)
apg-day-slot, apg-day-slot-label
apg-muscle-chips, apg-chip (+ .selected state)
apg-generate-btn (+ :disabled state)
apg-generating (spinner + text)
apg-preview-name, apg-day-strip, apg-day-card
apg-day-card-label, apg-exercise-list, apg-exercise-row
apg-refine-row, apg-refine-input, apg-regen-btn, apg-activate-btn
apg-auth-gate, apg-error-msg
```

---

## Constraints

- Vanilla JS IIFE only — no new dependencies
- `forge-search` Edge Function reused (no backend changes)
- `let` globals accessed directly (`workouts`, `userProfile`) — never `window.X`
- XSS: all LLM-returned strings (program name, exercise names, day labels) escaped via `_esc()` before innerHTML
- `max_tokens: 800` for the LLM call (sufficient for 3–6 day programs)
- Auth-gated — guests see auth gate message, cannot generate
