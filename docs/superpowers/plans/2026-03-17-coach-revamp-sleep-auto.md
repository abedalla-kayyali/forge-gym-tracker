# Coach Tab Revamp + Sleep Auto-Detection Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auto-detect the "7h+ sleep" daily non-negotiable from the readiness tracker, and revamp the Coach Today tab to use readiness data + LLM coach instead of the old star check-in and static rules.

**Architecture:** Three focused changes — (1) wire `forge_readiness.totalSleep` into the DNN sleep habit so it auto-checks when ≥7h is logged, (2) replace the old Energy/Sleep/Mood star card in `renderCoachToday()` with a compact readiness summary card, and (3) add a `FORGE_COACH.checkDailyReadiness()` LLM trigger that fires on Today tab open and streams a morning brief.

**Tech Stack:** Vanilla JS, localStorage (`forge_readiness`, `forge_dnn`), forge-search SSE streaming, existing `coach-triggers.js` pattern.

---

## File Map

| File | Change |
|------|--------|
| `js/dashboard-history.js` | Task 1 — sleep auto-detect in `renderDailyNonNegotiables()` + re-render hook in `_rdSave` |
| `index.html` | Task 2 — replace wellness star card in `renderCoachToday()`, fix recovery card threshold, remove dead code |
| `js/coach-triggers.js` | Task 3 — add `checkDailyReadiness()` LLM trigger |

---

## Task 1: Sleep Auto-Detection in DNN

**Files:**
- Modify: `js/dashboard-history.js` ~line 3940 (`renderDailyNonNegotiables`) and ~line 4488 (`_rdSave`)

### Step 1 — Read totalSleep from forge_readiness instead of manual toggle

In `renderDailyNonNegotiables()`, find the `sleepDone` line (~line 3962):

```js
const sleepDone   = !!todayDNN.sleep;
```

Replace with:

```js
const _rdyToday   = (() => { try { return JSON.parse(localStorage.getItem('forge_readiness') || '{}')[todayKey] || {}; } catch { return {}; } })();
const sleepHours  = parseFloat(_rdyToday.totalSleep) || 0;
const sleepDone   = sleepHours >= 7;
```

- [ ] Make that edit in `js/dashboard-history.js`

### Step 2 — Mark sleep habit as auto-tracked

Find the habits array entry for sleep (~line 3965):

```js
{ id: 'sleep',  icon: '😴', label: '7h+ sleep',   done: sleepDone,    auto: false, required: true   },
```

Change `auto: false` → `auto: true`:

```js
{ id: 'sleep',  icon: '😴', label: '7h+ sleep',   done: sleepDone,    auto: true,  required: true   },
```

- [ ] Make that edit

### Step 3 — Re-render DNN when readiness is saved

Find `window._rdSave` (~line 4473). At the end, after the `renderReadinessPanel()` call, add:

```js
  if (typeof renderDailyNonNegotiables === 'function') renderDailyNonNegotiables();
```

- [ ] Make that edit

### Step 4 — Manual verify in browser

1. Open app → Coach tab → Daily Readiness panel
2. Enter Total Sleep = 7h 30min → blur the field
3. Go to Overview tab → Daily Non-Negotiables
4. "7h+ sleep" card should show ✓ automatically (no tap needed)
5. Set Total Sleep = 5h → DNN sleep card should be unchecked

- [ ] Verify passes

### Step 5 — Commit

```bash
git add js/dashboard-history.js
git commit -m "feat: 7h+ sleep DNN auto-detects from readiness totalSleep input"
```

- [ ] Commit

---

## Task 2: Coach Today Tab — Replace Star Check-in + Fix Recovery Card

**Files:**
- Modify: `index.html` — `renderCoachToday()` function (~line 5659)

### Step 1 — Replace the wellness star check-in card

Find the entire `checkinCard` block in `renderCoachToday()`. It has three branches: `ciDone`, `ci.skipped`, and the fallback with Energy/Sleep/Mood stars + "Log Today" button (~lines 5680–5710).

Replace the entire `let checkinCard = ''; if (ciDone) { ... } else if ... else { ... }` block with this single readiness-aware card:

```js
// ── Wellness card: pulls from forge_readiness (replaces old star check-in) ─
const _rdWell = (() => { try { return JSON.parse(localStorage.getItem('forge_readiness') || '{}')[new Date().toISOString().slice(0,10)] || {}; } catch { return {}; } })();
const _rdWellHas = !!((_rdWell.totalSleep) || (_rdWell.hrv) || (_rdWell.rhr) || (_rdWell.energy));
const _rdWellScore = (() => {
  if (!_rdWellHas) return null;
  try {
    const sl = (typeof _rdSleepScore === 'function') ? _rdSleepScore(_rdWell.totalSleep ?? null, _rdWell.deepSleep ?? null, _rdWell.remSleep ?? null) : null;
    const hv = (typeof _rdHrvScore === 'function') ? _rdHrvScore(_rdWell.hrv ?? null) : null;
    const rh = (typeof _rdRhrScore === 'function') ? _rdRhrScore(_rdWell.rhr ?? null) : null;
    const en = (typeof _rdEnergyScore === 'function') ? _rdEnergyScore(_rdWell.energy ?? null) : null;
    return (typeof _rdComputeScore === 'function') ? _rdComputeScore(sl, hv, rh, en, 100) : null;
  } catch { return null; }
})();
const _rdWellColor = _rdWellScore === null ? 'rgba(255,255,255,.3)' : (_rdWellScore >= 70 ? '#39ff8f' : (_rdWellScore >= 40 ? '#ffb800' : '#ff6b6b'));
const _rdWellLabel = _rdWellScore === null ? (_ctAr ? 'لم يُسجَّل' : 'Not logged') : (_rdWellScore >= 70 ? (_ctAr ? 'جاهزية عالية' : 'HIGH') : (_rdWellScore >= 40 ? (_ctAr ? 'معتدل' : 'MODERATE') : (_ctAr ? 'منخفض' : 'LOW')));

const _rdNavFnWell = `(function(){const ob=document.querySelector('.dash-tab[data-tab="overview"]');if(typeof switchDashTab==='function')switchDashTab('overview',ob||null);const ps=Array.from(document.querySelectorAll('#view-dashboard .panel[data-dash-tab="overview"]'));const ri=ps.findIndex(p=>p.id==='readiness-panel');if(ri>=0){_overviewAccordionOpenIndex=ri;if(typeof _applyOverviewAccordion==='function')_applyOverviewAccordion();}const rp=document.getElementById('readiness-panel');if(rp)setTimeout(()=>{try{rp.scrollIntoView({behavior:'smooth',block:'start'});}catch(_){}},80);if(typeof renderReadinessPanel==='function')renderReadinessPanel();})()`;

const checkinCard = `
  <div class="ctoday-card ctoday-readiness-card" onclick="${_rdNavFnWell.replace(/"/g,"'")}" style="cursor:pointer;">
    <div class="ctoday-readiness-row">
      <div class="ctoday-readiness-ring" style="--rd-color:${_rdWellColor};">
        <span class="ctoday-readiness-val" style="color:${_rdWellColor};">${_rdWellScore !== null ? _rdWellScore : '—'}</span>
      </div>
      <div class="ctoday-readiness-info">
        <div class="ctoday-card-title" style="margin-bottom:2px;">⚡ ${_ctAr ? 'الجاهزية اليومية' : 'Daily Readiness'}</div>
        <div class="ctoday-readiness-label" style="color:${_rdWellColor};">${_rdWellLabel}</div>
        <div class="ctoday-readiness-hint">${_rdWellHas
          ? [_rdWell.totalSleep ? `💤 ${_rdWell.totalSleep}h` : '', _rdWell.hrv ? `💓 HRV ${_rdWell.hrv}` : '', _rdWell.rhr ? `❤️ ${_rdWell.rhr}bpm` : ''].filter(Boolean).join('  ')
          : (_ctAr ? 'اضغط لإدخال النوم، معدل ضربات القلب، وHRV' : 'Tap to log Sleep, HRV & Resting HR')
        }</div>
      </div>
      <span class="ctoday-readiness-arrow">›</span>
    </div>
  </div>`;
```

- [ ] Make that edit in `index.html`

### Step 2 — Fix recovery card: use totalSleep < 6 instead of old star rating

Find the `recoveryCard` block (~line 5844). Just above it, add:

```js
const sleepHours = (() => { try { return parseFloat(JSON.parse(localStorage.getItem('forge_readiness') || '{}')[new Date().toISOString().slice(0,10)]?.totalSleep) || 0; } catch { return 0; } })();
```

Then find:

```js
const lowSleep = !!(ciDone && (ci.sleep || 0) <= 2);
const lowEnergy = !!(ciDone && (ci.energy || 0) <= 2);
```

Replace the `lowSleep` line only:

```js
const lowSleep  = sleepHours > 0 && sleepHours < 6;
const lowEnergy = !!(ciDone && (ci.energy || 0) <= 2);
```

- [ ] Make that edit

### Step 3 — Remove readinessShortcutCard from output and clean up dead variables

**3a.** Find the `el.innerHTML = \`...\`` template string at the bottom of `renderCoachToday()`. Remove `${readinessShortcutCard}` from it (the variable now duplicates `checkinCard`).

**3b.** Delete the entire `readinessShortcutCard` variable declaration block (~lines 5712–5756) which includes `_rdToday`, `_rdHasData`, `_rdScore`, `_rdColor2`, `_rdLabel2`, `_rdNavFn`, and `readinessShortcutCard`. These are now all dead code.

**3c.** Find the `_ctodayInitStars()` guard (~line 6027):

```js
if (!ciDone && !(ci && ci.skipped)) _ctodayInitStars();
```

Remove this line entirely — the star elements it targets (`#ctoday-energy`, `#ctoday-sleep`, `#ctoday-mood`) no longer exist in the DOM.

- [ ] Make all three edits

### Step 4 — Manual verify

1. Open Coach → Today tab
2. Without readiness logged: should show "⚡ Daily Readiness — Not logged / Tap to log Sleep…" card
3. Log readiness with 8h sleep, HRV 55 → return to coach → card should show score + green color
4. Log 5h sleep → recovery card should appear below game plan
5. Old "How are you feeling today?" stars form should be gone
6. No JS errors in browser console

- [ ] Verify passes

### Step 5 — Commit

```bash
git add index.html
git commit -m "feat: coach today tab — readiness card replaces star check-in, recovery uses real sleep hours"
```

- [ ] Commit

---

## Task 3: LLM Morning Brief Trigger

**Files:**
- Modify: `js/coach-triggers.js` — add `_checkDailyReadiness` function + single export line
- Modify: `index.html` — call trigger when Today tab opens

### Step 1 — Add _checkDailyReadiness() function to coach-triggers.js

Find the closing `})();` of the IIFE at the very end of `coach-triggers.js`. Just before it, insert the new function:

```js
// ── Daily readiness morning brief ────────────────────────────────────────────
async function _checkDailyReadiness() {
  const todayKey = new Date().toISOString().slice(0, 10);
  const rdy = (() => { try { return JSON.parse(localStorage.getItem('forge_readiness') || '{}')[todayKey] || {}; } catch { return {}; } })();
  const profile = window.userProfile || {};
  const goal = profile.goal || 'muscle';
  const sleep = rdy.totalSleep ? `${rdy.totalSleep}h sleep` : 'sleep not logged';
  const hrv = rdy.hrv ? `HRV ${rdy.hrv}` : '';
  const rhr = rdy.rhr ? `RHR ${rdy.rhr}bpm` : '';
  const metrics = [sleep, hrv, rhr].filter(Boolean).join(', ');

  // Use last item as most-recent (array is push-appended; usually correct)
  const lastWorkout = (() => {
    try {
      const ws = JSON.parse(localStorage.getItem('forge_workouts') || '[]');
      return ws.length ? ws[ws.length - 1] : null;
    } catch { return null; }
  })();
  const lastStr = lastWorkout ? `Last session: ${lastWorkout.muscle || 'unknown'} on ${lastWorkout.date}` : 'No recent sessions';

  await _fireCoachMessage(
    'daily_readiness',
    `You are FORGE, a concise elite coach. Give a 1-sentence morning brief based on the athlete's readiness data. Be direct and motivating. Max 80 tokens.`,
    `Athlete readiness today: ${metrics}. ${lastStr}. Goal: ${goal}. What's your one-line coaching brief for today?`,
    (text) => {
      const el = document.getElementById('coach-tab-today');
      if (!el) return;
      // Update existing card if present (avoids duplicate after re-render)
      const existing = document.getElementById('coach-daily-brief');
      if (existing) {
        existing.querySelector('.cic-message').textContent = text;
        return;
      }
      // Build card using textContent to prevent XSS from LLM output
      const card = document.createElement('div');
      card.id = 'coach-daily-brief';
      card.className = 'coach-intercept-card';
      const icon = document.createElement('div');
      icon.className = 'cic-icon';
      icon.textContent = '🤖';
      const msg = document.createElement('div');
      msg.className = 'cic-message';
      msg.textContent = text;
      card.appendChild(icon);
      card.appendChild(msg);
      // Insert inside .ctoday-wrap so it gets correct padding/background
      const wrap = el.querySelector('.ctoday-wrap') || el;
      wrap.insertBefore(card, wrap.firstChild);
    }
  );
}
```

- [ ] Make that edit in `js/coach-triggers.js`

### Step 2 — Export the new function

Find the last `window.FORGE_COACH.*` assignment line in `coach-triggers.js` (the file assigns each trigger individually, e.g. `window.FORGE_COACH.fetchFormCue = ...`). After the last such line, add:

```js
window.FORGE_COACH.checkDailyReadiness = _checkDailyReadiness;
```

Do NOT replace the existing export block — just append this one line.

- [ ] Make that edit

### Step 3 — Fire trigger when Today tab opens

In `index.html`, find `coachSwitchTab` (~line 5424):

```js
if (tab === 'today')     renderCoachToday();
```

Replace with:

```js
if (tab === 'today') {
  renderCoachToday();
  if (typeof window.FORGE_COACH?.checkDailyReadiness === 'function') {
    window.FORGE_COACH.checkDailyReadiness();
  }
}
```

- [ ] Make that edit in `index.html`

### Step 4 — Manual verify

1. Open Coach → Today tab
2. Wait 2–3 seconds — a coach intercept card should appear at the top of `.ctoday-wrap` with a 1-line brief
3. Navigate away and back — card should not double-render (10-min cooldown)
4. Check browser console — no errors, no XSS risk (card built via textContent)

- [ ] Verify passes

### Step 5 — Commit

```bash
git add js/coach-triggers.js index.html
git commit -m "feat: LLM morning brief fires on coach today tab open via checkDailyReadiness"
```

- [ ] Commit

---

## Task 4: Version Bump + Push

- [ ] In `js/config.js`: set `FORGE_VERSION = 'v219'`, build note = `feat: sleep auto-detect, coach today readiness card, LLM morning brief`
- [ ] In `sw.js`: set `CACHE_NAME = 'forge-v219'`

```bash
git add js/config.js sw.js
git commit -m "chore: bump to v219 — coach revamp + sleep auto-detect"
git push origin master
```

- [ ] Commit and push
