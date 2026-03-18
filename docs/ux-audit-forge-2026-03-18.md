# FORGE Gym Tracker — Comprehensive UX Audit
**Date**: 2026-03-18
**Auditor**: UX Researcher Agent
**Codebase**: index.html (10,440 lines), css/main.css (23,692 lines), js/coach-triggers.js (453 lines), js/dashboard-history.js (5,310 lines)

---

## 1. User Journey Map — First Open to Logged Workout

### Current Flow (Reconstructed from Code)

```
App Opens
    │
    ▼
Header (slim strip: FORGE logo + session timer pill + expand chevron)
    │
    ▼
view-log (active by default) — "mode-unselected" class on wrapper
    │
    ▼
Session Hero Card (sh-idle state)
  — Shows date, last workout summary, START SESSION button
  — sh-quick-start banner (display:none — shown conditionally for first-timers)
    │
    ▼
Mode Toggle Row: [Weighted] [Bodyweight] [Cardio Rec]
  — Until mode is chosen, log-mode-prompt overlay shows "Select Workout Type"
    │
    ▼
Muscle Chip Grid (12 chips + "Map" button) — always visible
    │
    ▼
Exercise Entry Panel — exercise name input, Last Session Hint, PR Path Banner
    │
    ▼
Sets Container (weighted: TYPE/REPS/WEIGHT/UNIT table | BW: arcade zone)
    │
    ▼
"+ Add Set" → Ditto → Save Workout
```

### Friction Points Identified

| Step | Friction | Severity |
|------|----------|----------|
| First open | No onboarding flow. Comment in HTML literally says "Startup onboarding removed; setup is handled progressively inside Profile and Coach." New user lands on a blank session hero with no context. | HIGH |
| Mode selection | `log-mode-prompt` div says "Select Workout Type" but it sits below the mode toggle row — users may not see it before scrolling | MEDIUM |
| sh-quick-start | First-time Quick Start banner has `display:none` and is shown conditionally — logic depends on workout count. If that JS check fails silently, new users see nothing | HIGH |
| Muscle → Exercise flow | After selecting a muscle chip, user must also manually type an exercise name. The connection between "chip selected" and "exercise autocomplete populated" is not visually confirmed | MEDIUM |
| Workout Mode Toggle → Bodyweight | BW mode launches a 3-step stepper (MUSCLE > EXERCISE > LOG SETS via `bw-step-strip`), but the Weighted mode has no equivalent step indicator — inconsistent mental model | MEDIUM |
| Header collapse zone | XP bar, mascot, water tracker, steps, mission banner, and coach ticker are ALL in the collapsible zone. New users collapse it accidentally and lose orientation | HIGH |

---

## 2. Information Architecture

### Bottom Navigation (7 tabs)
```
[Log] [Stats] [History] [Social] [Coach] [Nutrition] [More]
```

**Issues:**

- **7 tabs is too many** for a mobile bottom nav. iOS HIG and Android Material both recommend 3–5 items. The 7th tab ("More") signals the app already knows this — but burying features in "More" reduces discoverability.
- **"Social"** is a full nav tab but contains no meaningful social feature for a solo user — it shows "SOCIAL ARENA / Friends, rivalries, compare cards, and live duels" which is aspirational/incomplete. A solo tracker user taps this and finds nothing actionable.
- **"Stats" vs "Dashboard"**: The button label says "Stats" but the view ID is `view-dashboard` and the JS calls `switchView('dashboard',this)`. Label/ID mismatch creates confusion if JS references are ever inconsistent.
- **Coach** has internal tabs (Today / Insights / Train / Cardio / Plan / Cali) — 6 sub-tabs inside one nav tab. This is a second-level navigation inside a nav item, creating a 2-level tab hierarchy that disorients users.
- **Log view is the default** (correct) but has no visible "home" indicator or breadcrumb. Users who navigate away have no persistent "you are here" signal.

### Header Information Density

The collapsible header packs:
- XP bar + level badge
- Mascot strip (emoji + bubble + name)
- Streak pill + Water tracker (with +/- buttons)
- Steps pill (with +1K / +5K quick-add buttons)
- Coach ticker (clickable, routes to Coach tab)
- Mission banner (expandable)

**Total: 6 distinct UI systems in a single collapsible zone.** When collapsed, all of this disappears behind a single chevron. When expanded, the header can consume 40–50% of screen height on a small device.

---

## 3. Visual Hierarchy

### What Is Working

- **Color system is coherent**: `--accent: #39ff8f` (electric green) for primary actions, `--warn: #f39c12` (amber) for caution, `--danger: #e74c3c` (red) for destructive. These are semantically consistent throughout.
- **Font pairing**: Bebas Neue (display/hero numbers), DM Mono (data/labels), Barlow (body text), Barlow Condensed (UI chrome). This is a strong typographic system.
- **Dark theme**: `--bg: #080c09` with grid overlay (`body::before` gridlines at 48px, 30% opacity) creates a professional dark-terminal aesthetic.
- **Ambient glow animation**: `ambientDrift` keyframe on `body::before` radial gradient is subtle and effective.

### What Is Confusing

- **Competing CTAs on session hero**: The idle state has "START SESSION" (primary) and `sh-quick-start` (secondary Quick Start). When both are visible, neither has visual priority — both use similar button weight.
- **Sets table header labels**: `TYPE | REPS | WEIGHT | UNIT | RPE (hidden) | (empty)` — the RPE column is `display:none` by default but the column exists, creating spacing gaps. The last column has no label.
- **"Ditto" button** (`=` symbol on `ditto-btn`) has no label. An `=` sign for "copy last set" is a non-standard icon. Tooltip says "Ditto — copy last set" but tooltips don't appear on mobile.
- **Bodyweight arcade zone vs weighted table**: Two completely different UI paradigms for the same task (logging sets). BW uses a progress ring + effort buttons + "LOG SET" big button. Weighted uses a data table + "+ Add Set". Users who use both modes face a completely different mental model each time.
- **Empty state icons** are inconsistent: some use emoji (`📊`, `📈`, `🧠`), some use SVG icons. The mix feels unpolished.

---

## 4. Interaction Patterns

### Button Inconsistencies

| Context | Pattern Used |
|---------|-------------|
| Add Set (weighted) | `.btn.btn-add` text button: "+ Add Set" |
| Log Set (bodyweight) | `.bw-log-btn` large full-width button: "LOG SET" |
| Save Workout (BW) | `.bw-log-workout-btn` separate button: "LOG WORKOUT" |
| Save Workout (weighted) | Not visible in scanned section — different flow |
| Form technique | `.btn-ex-browse.btn-ex-form` small pill button: "Form" |
| Voice input | `.btn-ex-browse.btn-ex-voice` emoji button: 🎤 |
| Exercise browse | `.btn-ex-browse` pill: "Browse" |
| Exercise swap | `.btn-ex-browse.btn-ex-swap` pill: "⇄ Swap" |

The exercise entry row has 4 separate small action buttons (Form, Voice, Swap, Browse) crammed next to a label. On small screens (320px width) these will wrap or overlap.

### Inline Onclick Handlers (Scalability Issue)

Extensive use of inline `onclick` attributes on HTML elements throughout, including multi-line JavaScript directly in `onclick`:

```html
onclick="
  const sec=document.getElementById('section-steps');
  if(sec){sec.style.display='block';if(typeof renderStepsPanel==='function')renderStepsPanel();}
  const logBtn=document.querySelector('.bnav-btn[onclick*=\'log\']');
  switchView('log',logBtn);
  setTimeout(...)
"
```

This is a maintenance and testability problem, not directly a UX issue — but it increases the likelihood of inconsistent behavior across similar interactions.

### Confirm Modal

The `.confirm-modal` has a hardcoded "Delete" label on the confirm button (`id="confirm-btn-ok"`). Any non-delete confirm action (e.g. "End Session") will show "Delete" as the action label unless JS overrides it every time.

### Coach Intercept Cards

`coach-intercept-card` elements are dynamically injected before `#muscle-btn-grid` or `#sets-container`. These cards:
- Have a "Log anyway" dismiss button (good)
- Auto-dismiss after 60 seconds for the debrief card
- No animation or transition on appear/dismiss — jarring pop-in

---

## 5. Empty States

Empty states exist and are consistent in structure (`empty-state > empty-icon + empty-title`), but vary in quality:

| View | Empty State Quality |
|------|-------------------|
| Stats / Volume chart | "No data yet" — generic, no CTA |
| History calendar | Blank calendar — no explanation |
| Overload score | "Log 2+ sessions per muscle to see your overload score" — specific, actionable (GOOD) |
| Weekly review | "Log data for a full week to unlock your weekly review" — specific, actionable (GOOD) |
| Calisthenics | "Log BW workouts to track progress" — adequate |
| Meals/Nutrition | "Insights will appear after meal logs" — adequate |
| Nutrition weekly report | "Log meals to see your weekly report" — adequate |
| Body balance | "No data yet" + empty icon — generic |
| FFMI | Has a dedicated `ffmi-no-data` card with button — (GOOD) |

**Finding**: Empty states in the Stats tab are mostly passive ("No data yet") without CTAs that navigate users to the action needed. Best-in-class empty states include a direct action button.

The History tab empty state (line 939) has a strong CTA: `"Log your first workout →"` button that calls `switchView('log', ...)` — this is the gold standard pattern that should be replicated everywhere.

---

## 6. Onboarding

**Current state**: Startup onboarding was explicitly removed (per HTML comment on line 32). The replacement — "progressive setup inside Profile and Coach" — exists as:

- `coach-goal-setup-card` in view-coach: a card prompting goal setup, dismissable
- `sh-quick-start` on session hero: Quick Start for first-timers (conditional display)
- No welcome message, no feature introduction, no value proposition on first launch

**Impact**: A new user lands on:
1. A blank session hero with a "START SESSION" button and a timer
2. A collapsed header they may accidentally expand
3. No indication of what FORGE does, what the XP system means, or why there's a mascot

**Benchmark gap**: Apps like Nike Training Club and Whoop show a 3–5 screen onboarding on first launch: goal selection, key feature intro, permission requests (notifications, health data). FORGE skips all of this.

---

## 7. Engagement Loops

FORGE has a sophisticated engagement architecture:

| Loop | Implementation |
|------|---------------|
| XP / Leveling | XP bar in header, level badge, `ROOKIE` → higher tiers |
| Streak tracking | Fire icon streak counter, streak pill in header |
| Daily Mission | Mission banner with progress bar and checklist items |
| PR system | PR Path Banner on exercise entry, PR count in stats |
| Combo streaks | `combo-strip` div shown during set logging (COMBO STREAK x2) |
| Mascot | FORGE BUDDY with evolving messages |
| Coach debrief | Auto-generated AI debrief after each workout |
| Water tracker | Tap +/- with mini cup dots |
| Steps tracker | +1K / +5K quick-add buttons with progress bar |

**Issues with engagement loops**:
- The mascot (`mascot-bubble`) gives a static motivational line ("Every legend starts somewhere") on first load — this is fine for Day 1 but becomes noise by Day 30.
- The XP system has no visible XP reward feedback at the moment of earning XP (no "+50 XP" animation appears in the log flow based on the scanned code).
- The combo streak strip (`combo-strip`) is `display:none` — unclear when it triggers or what constitutes a "combo".
- Daily missions are generated/shown in the collapsed header zone. If users keep the header collapsed (the default slim strip), they never see today's missions.

---

## 8. Top 10 UX Pain Points

### Pain Point 1 — No Onboarding for New Users
**Element**: `<!-- Startup onboarding removed -->` (line 32)
**Impact**: High churn on Day 1. Users don't understand XP, mascot, missions, or how to log their first workout.
**Fix**: Re-introduce a 3-screen modal onboarding: (1) goal selection, (2) what FORGE tracks, (3) log your first workout CTA.

### Pain Point 2 — 7-Tab Bottom Nav Overload
**Element**: `<nav class="bottom-nav">` (line 2095) with 7 `.bnav-btn` items
**Impact**: Cognitively overwhelming; thumb reach issues on the 7th tab (More); Social tab is near-empty.
**Fix**: Consolidate to 5 tabs: Log | Stats | History | Coach | More. Move Nutrition and Social into "More."

### Pain Point 3 — Header Information Overload
**Element**: `.header-collapse-zone` containing 6 distinct UI systems
**Impact**: Users either collapse everything and miss critical info, or have a massive header consuming screen space.
**Fix**: Keep slim strip always visible (FORGE + timer + streak). Move XP bar, mascot, and mission to a dismissable "Today" card on the Log view, not the header.

### Pain Point 4 — Workout Mode Selection Has No Clear Default
**Element**: `.mode-toggle-row` + `#log-mode-prompt` (lines 224–239)
**Impact**: Users arrive at the Log view in "mode-unselected" state with a prompt below the fold. The last-used mode should be remembered and pre-selected.
**Fix**: Persist last workout mode to localStorage and pre-activate it on load.

### Pain Point 5 — Bodyweight and Weighted Modes Have Incompatible UIs
**Element**: `#bw-sets-section` (arcade zone with ring, effort buttons) vs `#weighted-sets-section` (data table)
**Impact**: Users who switch between modes have to re-learn the interface each time. No shared design language for "log a set."
**Fix**: Standardize the core set-logging interaction. Both modes should use a consistent pattern with an optional RPE/effort layer.

### Pain Point 6 — Coach Sub-Tab Depth (6 tabs inside Coach)
**Element**: `.coach-tabs` in `#view-coach` with 6 buttons: Today / Insights / Train / Cardio / Plan / Cali
**Impact**: Coach feels like a separate app inside the app. Users navigating to "Coach" don't know which sub-tab to start with.
**Fix**: Default to "Today" tab (already the case) but add a visual orientation cue. Consider collapsing Cali and Cardio into the Train tab.

### Pain Point 7 — "Ditto" Button Has No Visible Label
**Element**: `<button class="ditto-btn" id="ditto-btn" ... aria-label="Ditto — copy last set">=</button>` (line 625)
**Impact**: "=" is not a universally understood icon for "copy last set." Mobile users don't see tooltips. New users skip this time-saving feature entirely.
**Fix**: Add a text label "Ditto" or use a copy/duplicate icon (two overlapping squares is standard).

### Pain Point 8 — Coach Intercept Cards Pop In Without Animation
**Element**: `_showInterceptCard()` in coach-triggers.js (line 80) — `card` appended via `insertBefore` with no CSS transition
**Impact**: Jarring content shift when AI coach message appears. The layout jumps, potentially causing mis-taps on whatever was previously under the cursor.
**Fix**: Add `opacity: 0; transform: translateY(-8px)` initial state with a 200ms ease transition on `.coach-intercept-card`.

### Pain Point 9 — Empty States Are Passive in Most of Stats Tab
**Element**: Multiple `<div class="empty-state">` with only "No data yet" text and no CTA
**Impact**: Users in Stats with no data have no path forward. They don't know how to generate the data being asked for.
**Fix**: Add a navigation CTA to every empty state: "Log a workout to unlock this chart →" that calls `switchView('log', ...)`.

### Pain Point 10 — Water Tracker "+" and "-" Buttons Are Undersized
**Element**: `.hdr-water-btn` and `.hdr-water-undo` inside `.hdr-water-pill` in the header
**Impact**: These are small tap targets inside an already-compact header pill. The +/- buttons likely fall below the 44px minimum touch target size recommended by Apple HIG and Google Material.
**Fix**: Increase tap target to minimum 44x44px. Consider moving the water tracker to a dedicated section on the Log view (already partially duplicated there).

---

## 9. Quick Wins (High Impact / Low Effort)

| # | Change | Effort | Impact |
|---|--------|--------|--------|
| QW1 | Persist last workout mode in localStorage — pre-select on load | 30 min | Removes "Select Workout Type" friction for returning users |
| QW2 | Add text label to Ditto button: replace `=` with "Ditto" text | 5 min | Immediate discoverability of a power feature |
| QW3 | Add `opacity/transform` CSS transition to `.coach-intercept-card` | 10 min | Eliminates jarring layout jump on coach messages |
| QW4 | Add navigation CTA to all passive empty states ("No data yet") | 1 hour | Converts dead ends into re-engagement points |
| QW5 | Show mission banner items by default (remove `display:none` from `#mb-items`) or move missions to Log view body instead of collapsed header | 30 min | Makes daily missions visible without header expand |
| QW6 | Add "+XP" feedback animation after workout save (e.g. float "+50 XP" from XP bar) | 2 hours | Closes the XP reward loop — makes leveling feel rewarding |
| QW7 | Increase water +/- button tap targets to min 44x44px | 15 min | Reduces missed taps on a high-frequency interaction |
| QW8 | Fix confirm modal button label — replace hardcoded "Delete" with a configurable label | 30 min | Prevents "Delete" appearing on non-delete confirms |
| QW9 | Add a 3-step first-launch modal (goal → features → first workout CTA) using existing `progressive-setup-card` pattern | 4 hours | Critical for Day 1 activation rate |
| QW10 | Consolidate bottom nav from 7 to 5 tabs — merge Nutrition into a "More" sheet or promote it as a sub-tab of Coach | 2 hours | Reduces nav cognitive load immediately |

---

## 10. Premium Benchmarks — What FORGE Is Missing

### Whoop
- **Recovery Score on first screen**: Whoop's home screen leads with a single Recovery number (0–100) with green/yellow/red. Users know their status in 1 second. FORGE's coach score (`--` by default, computed async) is in the header collapse zone and takes time to compute.
- **Strain tracking during workout**: Whoop tracks real-time heart rate strain during sessions. FORGE has session timer but no real-time intensity signal.
- **Sleep as a first-class metric**: Whoop dedicates a full tab to sleep. FORGE has sleep in the readiness check-in but it's buried in a modal.

### Strava
- **Activity feed as the home screen**: Social proof and motivation from friends' activities visible on open. FORGE's "Social Arena" exists but appears to be feature-incomplete.
- **Segment PR celebrations**: Full-screen takeover when you set a PR. FORGE has a PR Path Banner but no celebration moment on achieving a PR.
- **Rich activity maps and photos**: Media attached to workouts. FORGE is text/numbers only.

### Nike Training Club
- **Guided onboarding**: 5-screen goal/experience/equipment selector before first workout. Produces a personalized program immediately.
- **Video-guided workouts**: Exercise demonstration integrated into the workout flow. FORGE has a "Form Inspector" (`.btn-ex-form`) and a RAG-based form cue system, but video is absent.
- **Workout completion celebrations**: Full-screen confetti + share card on workout completion. FORGE generates a text debrief card (good!) but no visual celebration moment.

### Apple Fitness+
- **Consistent metric design language**: All metrics use the same ring/progress visual. FORGE mixes progress rings (BW arcade), XP bars, score rings, streak pills, and step bars — 5 different progress metaphors.
- **Burn Bar (social comparison)**: Real-time comparison to other users doing the same workout. Nothing equivalent in FORGE.

### Key Premium Features FORGE Should Add
1. **PR Celebration moment** — full-screen takeover with confetti when a PR is broken, not just a banner
2. **Consistent progress metaphor** — standardize on one visual (ring or bar) across XP, BW progress, cardio, and steps
3. **Recovery score on first screen** — promote the coach score to the always-visible slim header strip
4. **Workout completion share card** — auto-generated image with stats, shareable to social (drives organic growth)
5. **Guided first-workout flow** — not just Quick Start, but a paced, step-by-step first workout with explanations

---

## Summary Scorecard

| Dimension | Score | Notes |
|-----------|-------|-------|
| Information Architecture | 5/10 | 7 tabs, deep nesting in Coach, header overload |
| Visual Hierarchy | 7/10 | Strong design tokens; inconsistent UI paradigms between modes |
| Onboarding | 2/10 | Explicitly removed; no replacement at equivalent depth |
| Engagement Loops | 8/10 | XP, streaks, missions, PR system, AI debrief — genuinely strong |
| Empty States | 5/10 | Inconsistent; passive in most places |
| Interaction Consistency | 5/10 | BW vs weighted paradigm split; inline onclick sprawl |
| Coach / AI | 8/10 | LLM intercepts, streaming debrief, daily readiness — premium tier |
| Mobile Ergonomics | 6/10 | Safe area insets handled; touch targets need work |
| Overall | 6/10 | Strong feature depth; UX polish needed for new-user activation |

---

*Report generated by UX Researcher Agent. Evidence base: direct code audit of index.html, css/main.css, js/coach-triggers.js, js/dashboard-history.js.*
