# Exercise Duration Timer — Design Spec

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Track how long the user spends logging each exercise — from first set added to LOG WORKOUT pressed — and save that duration for history and analytics.

**Architecture:** Two module-level globals mirror the existing session timer pattern. Timer starts on first set, stops and saves on log, resets on form clear. Duration stored in both `workouts[]` and `_sessionWkLogs[]`.

**Tech Stack:** Vanilla JS (index.html), CSS (main.css), workout-save.js

---

## 1. Data Model

### `workouts[]` entry (existing shape + new field)
```js
{
  id, date, muscle, exercise, sets, notes, angle,
  totalVolume, isPR, effort,
  durationSecs: Number   // NEW — seconds from first set to LOG WORKOUT; 0 if not measured
}
```

### `_sessionWkLogs[]` entry (existing shape + new field)
```js
{
  mode, muscle, exercise, sets, volume, isPR,
  durationSecs: Number   // NEW — same value as above
}
```

---

## 2. New Globals

Placed in `index.html` alongside `_sessionWkStart` and `_sessionActive`:

```js
let _exTimerStart    = null;   // Date.now() timestamp when first set is added
let _exTimerInterval = null;   // setInterval handle for live display updates
```

---

## 3. Timer Lifecycle

| Trigger | Action |
|---|---|
| First set added to a blank form | `_exTimerStart = Date.now()`, `_exTimerInterval = setInterval(updateExTimer, 1000)`, show `#ex-timer-display` |
| Second+ set added | No-op — timer already running |
| LOG WORKOUT pressed (save success) | Stop interval, compute `durationSecs`, reset both globals to `null`, hide display |
| Form explicitly cleared (new exercise, cancel) | Stop interval, reset both globals, hide display, show `0:00` |
| App/page unload | Interval naturally dies; no cleanup required |

**Computing duration:**
```js
const durationSecs = _exTimerStart
  ? Math.round((Date.now() - _exTimerStart) / 1000)
  : 0;
```

---

## 4. UI — `#ex-timer-display`

**Placement:** Injected into the existing exercise logging form HTML, directly above the `#save-btn` (LOG WORKOUT button).

**HTML:**
```html
<div id="ex-timer-display" class="ex-timer" style="display:none">
  <span class="ex-timer__label">EXERCISE TIME</span>
  <span id="ex-timer-value" class="ex-timer__value">0:00</span>
</div>
```

**Live update function:**
```js
function _updateExTimerDisplay() {
  if (!_exTimerStart) return;
  const elapsed = Math.floor((Date.now() - _exTimerStart) / 1000);
  const mm = Math.floor(elapsed / 60);
  const ss = String(elapsed % 60).padStart(2, '0');
  const el = document.getElementById('ex-timer-value');
  if (el) el.textContent = mm + ':' + ss;
}
```

**Reset helper:**
```js
function _resetExTimer() {
  clearInterval(_exTimerInterval);
  _exTimerStart = null;
  _exTimerInterval = null;
  const disp = document.getElementById('ex-timer-display');
  if (disp) disp.style.display = 'none';
  const val = document.getElementById('ex-timer-value');
  if (val) val.textContent = '0:00';
}
```

---

## 5. CSS — `.ex-timer` (append to `css/main.css`)

```css
.ex-timer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  margin-bottom: 10px;
  background: rgba(84,255,171,0.06);
  border: 1px solid rgba(84,255,171,0.25);
  border-radius: 10px;
}
.ex-timer__label {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  font-weight: 600;
  color: rgba(84,255,171,0.65);
  letter-spacing: 0.08em;
}
.ex-timer__value {
  font-family: 'DM Mono', monospace;
  font-size: 22px;
  font-weight: 700;
  color: #54ffab;
  letter-spacing: 0.04em;
}
```

---

## 6. Integration Points

### `index.html` — add-set handler
Find where a set row is appended to `#sets-container`. After the DOM append, add:
```js
// Start exercise timer on first set
if (!_exTimerStart) {
  _exTimerStart = Date.now();
  _exTimerInterval = setInterval(_updateExTimerDisplay, 1000);
  const disp = document.getElementById('ex-timer-display');
  if (disp) disp.style.display = 'flex';
}
```

### `js/workout-save.js` — `_saveWeightedWorkout()`
`_saveWeightedWorkout` wraps its save logic inside a `setTimeout` callback. All changes must go **inside that callback**:

```js
// Inside the existing setTimeout callback, before pushing to workouts / _sessionWkLogs:
const durationSecs = _exTimerStart
  ? Math.round((Date.now() - _exTimerStart) / 1000)
  : 0;
```

Add `durationSecs` to `_wkEntry` and to the `_sessionWkLogs` push object.
Call `_resetExTimer()` at the end of the `setTimeout` callback, after the successful save.

> **Note:** `_sessionWkLogs.push` is gated on the `_sessionActive` flag. `durationSecs` is only written to `_sessionWkLogs` when a session is active — this is correct and expected behaviour.

### `js/workout-save.js` — `saveBwWorkout()`
`saveBwWorkout` also wraps its save logic inside a `setTimeout` callback (same pattern as `_saveWeightedWorkout`). Compute `durationSecs` and call `_resetExTimer()` **inside that callback** — not after it.

### `index.html` — form clear / exercise change
Wherever the set form is reset, call `_resetExTimer()`. The three call sites are:

1. Inside the `setTimeout` callback in `_saveWeightedWorkout` (after save — handled above).
2. Inside `saveBwWorkout` (after save — handled above).
3. Inside `selectMuscle` in `index.html` — when the user picks a new muscle group, clearing any in-progress exercise.

---

## 7. Error Handling

- If `_exTimerStart` is `null` at save time (user somehow saved without adding sets), `durationSecs` defaults to `0`. No crash.
- `_resetExTimer` is safe to call multiple times (idempotent).
- `setInterval` handle is always cleared before reassignment.

---

## 8. Out of Scope

- Displaying `durationSecs` in the session poster (future enhancement)
- Per-set rest timer
- Pausing the exercise timer
- Analytics dashboard for exercise duration trends
