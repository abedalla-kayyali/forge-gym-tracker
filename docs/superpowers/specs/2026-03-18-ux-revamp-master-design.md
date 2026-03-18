# FORGE UX Revamp — Master Design Spec v235+

**Date:** 2026-03-18
**Status:** Approved for planning
**Scope:** Full-app UX overhaul — visual design, user journey, FX wiring, engagement loops

---

## Executive Summary

FORGE already ships a complete FX infrastructure (Web Audio 20+ sounds, haptics, canvas particles, ripple system, level-up overlays). The revamp focuses on **three pillars**:

1. **Premium Visual Design** — upgrade CSS design tokens, glassmorphism panels, motion system
2. **User Journey Clarity** — reduce friction at every step, better empty states, guided flows
3. **Consistent Delight** — wire existing FX to all missing touchpoints; add missing micro-interactions

---

## Current State Assessment

### What's Already Built (DO NOT Rebuild)
| System | File | Status |
|--------|------|--------|
| Web Audio sound engine | `js/fx-sound.js` | ✅ 20+ sounds |
| Haptic engine | `js/fx-haptic.js` | ✅ Full vibration patterns |
| Canvas particles + ripple | `js/fx-visuals.js` | ✅ burstPR, burstSave, flashPR |
| iOS-safe log FX | `js/log-fx.js` | ✅ AudioContext unlock |
| XP / leveling system | `js/xp-system.js` | ✅ Exists |
| Ambient spotlight glow | `css/main.css` | ✅ ambientDrift animation |
| Grid background | `css/main.css` | ✅ body::before |

### Current Design Tokens
```css
--bg: #080c09       /* Near-black green */
--accent: #39ff8f   /* Neon green */
--text: #c8dcc9
--panel: #131c14
--border: #1e2e1f
```
Fonts: **Bebas Neue** (display) + **DM Mono** (data) + **Barlow** (body)

### Critical Pain Points
1. **Header information overload** — XP bar + mascot + streak + water + steps + coach ticker + mission banner all compete at once
2. **No tab transition animation** — views snap instantly, feels cheap
3. **Panel cards lack elevation hierarchy** — everything looks flat/same weight
4. **Empty states are bare text** — no illustrations, no CTAs, no delight
5. **Onboarding is a card, not a journey** — `profile-setup-card` is too subtle for first-time users
6. **FX wiring gaps** — sound/haptic/particle calls missing from nutrition log, photo add, template apply, program start
7. **Bottom nav has no active state animation** — icon just changes color
8. **Typography scale inconsistent** — mix of px sizes without a systematic scale
9. **No loading skeletons** — content pops in abruptly
10. **Dark mode only** — no theme variation beyond accent color swatches

---

## Sub-Project Breakdown

Each sub-project is independent, shippable, and testable. Implement in order.

---

## SUB-PROJECT 1: Design System Upgrade
**Version:** v235
**Files:** `css/main.css`, `js/ui-layout-theme.js`
**Est. impact:** Affects every screen — highest leverage

### 1.1 Expanded Design Tokens
```css
:root {
  /* Elevation system */
  --shadow-sm: 0 1px 3px rgba(0,0,0,.4);
  --shadow-md: 0 4px 12px rgba(0,0,0,.5);
  --shadow-lg: 0 8px 32px rgba(0,0,0,.6);
  --shadow-glow: 0 0 20px rgba(57,255,143,.15);
  --shadow-glow-strong: 0 0 40px rgba(57,255,143,.3);

  /* Glassmorphism */
  --glass-bg: rgba(19,28,20,.72);
  --glass-border: rgba(57,255,143,.12);
  --glass-blur: blur(16px);

  /* Spacing scale (8px base) */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px;
  --space-4: 16px; --space-5: 24px; --space-6: 32px;
  --space-7: 48px; --space-8: 64px;

  /* Border radius scale */
  --radius-sm: 8px;  --radius-md: 12px;
  --radius-lg: 16px; --radius-xl: 24px; --radius-full: 9999px;

  /* Typography scale */
  --text-xs: 10px;  --text-sm: 12px; --text-base: 14px;
  --text-lg: 16px;  --text-xl: 18px; --text-2xl: 22px;
  --text-3xl: 28px; --text-4xl: 36px;

  /* Motion */
  --ease-spring: cubic-bezier(0.34,1.56,0.64,1);
  --ease-smooth: cubic-bezier(0.4,0,0.2,1);
  --dur-fast: 150ms;  --dur-base: 250ms;  --dur-slow: 400ms;

  /* Semantic colors */
  --success: #2ecc71;  --success-dim: rgba(46,204,113,.15);
  --warn: #f39c12;     --warn-dim: rgba(243,156,18,.15);
  --danger: #e74c3c;   --danger-dim: rgba(231,76,60,.15);
  --info: #3498db;     --info-dim: rgba(52,152,219,.15);
}
```

### 1.2 Glassmorphism Panel System
Replace flat `.panel` with layered glass cards:
```css
.panel {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md), inset 0 1px 0 rgba(255,255,255,.04);
}
.panel:hover { box-shadow: var(--shadow-lg), var(--shadow-glow); }
```

### 1.3 Button System Upgrade
```css
/* Primary CTA */
.btn-primary {
  background: linear-gradient(135deg, var(--accent), #00e676);
  color: #000;
  box-shadow: 0 0 20px rgba(57,255,143,.35);
  transition: all var(--dur-base) var(--ease-spring);
}
.btn-primary:active { transform: scale(0.96); }

/* Ghost button */
.btn-ghost {
  background: transparent;
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(8px);
}
```

### 1.4 Tab Transition Animation
```css
/* View enter animation */
@keyframes viewSlideIn {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
[data-view].active { animation: viewSlideIn var(--dur-base) var(--ease-smooth); }
```

### 1.5 Loading Skeleton System
```css
.skeleton {
  background: linear-gradient(90deg, var(--panel) 25%, var(--bg3) 50%, var(--panel) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### 1.6 Bottom Nav Active State
```css
.bnav-btn.active .bnav-icon {
  transform: translateY(-4px) scale(1.15);
  filter: drop-shadow(0 0 8px var(--accent));
  transition: all var(--dur-base) var(--ease-spring);
}
.bnav-btn.active .bnav-label { color: var(--accent); }
```

---

## SUB-PROJECT 2: Header & Navigation Revamp
**Version:** v236
**Files:** `index.html` (header section), `css/main.css`, `js/dashboard-history.js`

### 2.1 Header Information Hierarchy
**Problem:** Too much competing information at once.
**Solution:** Progressive disclosure — show only what matters now.

**Collapsed state (default):**
- Slim strip: FORGE logo | current time | sound toggle
- XP bar (thin, 2px)
- Active session ticker OR coach one-liner

**Expanded state (tap to reveal):**
- Avatar + name + rank badge
- Full XP bar with progress label
- Streak + water + steps pills
- Mission banner

### 2.2 Contextual Header
Header content changes based on active tab:
- **Log tab:** Show timer + current session duration
- **Coach tab:** Show readiness score ring
- **Nutrition tab:** Show today's macro rings (compact)
- **Stats tab:** Show current streak + weekly volume
- **Body tab:** Show last weight entry

### 2.3 Bottom Nav Enhancement
- Active tab: icon lifts + glows + label highlights
- Tap: ripple + `hapTap()` + `sndTap()` (already wired via `initRipples`)
- Unread indicator: pulse dot on Coach/Social tabs when new content
- Transition between tabs: slide-in from direction of tab

---

## SUB-PROJECT 3: Log Tab — Premium Workout Experience
**Version:** v237
**Files:** `index.html` (log section), `js/log-fx.js`, `js/workout-save.js`, `js/ghost-autocomplete.js`

### 3.1 Session Hero Card Upgrade
**Empty state (no workout started):**
```
┌─────────────────────────────┐
│  🔥 READY TO FORGE?         │
│  Last session: 3 days ago   │
│  [Quick Start] [Browse]     │
│                             │
│  💪 Muscle Group Chips      │
│  Chest · Back · Legs · Arms │
└─────────────────────────────┘
```
- Muscle chip row visible immediately (no scroll)
- Last session summary shown as motivation

**Active state:**
- Animated session timer (glow pulse on accent color)
- Set counter badge with combo multiplier
- Live volume tracking chip

### 3.2 Set Logging Micro-interactions
Each set logged:
1. Row flashes accent color briefly (CSS keyframe)
2. `sndSetLog()` + `hapSetLog()` (already exists)
3. Ghost delta badge animates in if beating previous
4. Volume counter increments with count-up animation

PR Beat sequence (enhanced):
1. `flashPR()` + `burstPR()` + `sndPR()` + `hapPR()` (already wired)
2. **NEW:** Trophy emoji flies from button to header XP bar
3. **NEW:** Glow ring pulse expands from button origin
4. "PERSONAL RECORD" text streaks across screen (typewriter)

### 3.3 Rest Timer Premium Feel
- Full-screen countdown mode (tap to expand)
- Circular progress ring (SVG, CSS stroke-dashoffset animation)
- Color transitions: green → yellow (75%) → orange (90%) → red (100%)
- At 0: hapTimerDone + sndTimerDone + screen flash

### 3.4 Workout Save Celebration
Enhanced sequence:
1. `burstSave()` particles from bottom center
2. `flashSave()` screen flash
3. `sndSave()` rising chime
4. Summary card slides up with stats:
   - Duration | Sets | Volume | PRs hit
   - Share button → `progress-proof-card.js`

### 3.5 Empty State — No Workouts Ever
```
┌─────────────────────────────┐
│         💪                  │
│   YOUR FIRST FORGE          │
│   AWAITS                    │
│                             │
│  Pick a muscle group to     │
│  start your journey.        │
│                             │
│  [START FIRST WORKOUT]      │
└─────────────────────────────┘
```

---

## SUB-PROJECT 4: Onboarding & First Run
**Version:** v238
**Files:** `js/onboarding-controls.js`, `index.html`, `css/main.css`

### 4.1 First-Run Wizard (New Users)
Triggered when: no profile name AND no workouts logged.

**Step 1 — Welcome Screen:**
```
[FORGE logo animation — neon green pulse]
FORGE. YOUR GYM. YOUR RULES.
[GET STARTED →]
```

**Step 2 — Name:**
"What do we call you, champion?"
[Name input] → Continue

**Step 3 — Goal:**
4 cards with icons:
- 💪 Build Muscle
- 🔥 Lose Fat
- ⚡ Get Stronger
- 🏃 Get Fit

**Step 4 — Experience:**
- Beginner (0-1 year)
- Intermediate (1-3 years)
- Advanced (3+ years)

**Step 5 — First Workout Nudge:**
"Let's log your first set."
[Body map shown → tap a muscle to start]

Each step: slide-in transition, `sndPrimaryAction()`, `hapTap()`

### 4.2 Progressive Feature Discovery
After each 5th workout, tooltip overlays reveal a new feature:
- Workout 5: "Try Voice-to-Log 🎤"
- Workout 10: "Check your Recovery Heatmap"
- Workout 15: "Ask your AI Coach"
- Workout 20: "Generate an AI Program"

Storage key: `forge_feature_tips_shown` (array of shown tip IDs)

### 4.3 Return User Streak Re-engagement
After 3+ days absence, on open:
```
🔥 FORGE MISSES YOU
3 days since your last session.
Your muscles are rested and ready.
[LOG A WORKOUT NOW]
```

---

## SUB-PROJECT 5: Gamification Visual Upgrade
**Version:** v239
**Files:** `js/xp-system.js`, `js/achievements-ui.js`, `css/main.css`

### 5.1 XP Bar Premium Animation
- XP fills with animated bar (CSS width transition + count-up number)
- Overflow XP: bar fills to 100% → flash → resets to 0% (level up)
- Level up: `showLevelUp()` already exists — add entrance animation for rank badge

### 5.2 Achievement Wall
New dedicated section in Stats tab:
- Grid of achievement cards (locked = dim + blur, unlocked = glow)
- Unlock animation: shimmer reveal + `sndPR()` + `burstSave()`
- Categories: Consistency | Strength | Nutrition | Social

### 5.3 Streak System Enhancement
- Streak fire icon animates (CSS flame flicker)
- Streak at risk warning (< 18:00 on no-workout day):
  - Badge turns orange + pulse animation
  - `sndTimerDone()` pattern
- Streak milestone celebrations (7d, 30d, 100d):
  - Full-screen overlay + confetti + rank reveal

### 5.4 Daily Mission Upgrade
Current: static list. Upgrade to:
- Mission cards with animated completion checkbox (checkmark draws in SVG)
- Progress ring shows % of daily missions done
- All missions complete: confetti burst + `sndStepGoal()`

---

## SUB-PROJECT 6: Coach Tab — Premium AI Experience
**Version:** v240
**Files:** `js/coach-triggers.js`, `js/rag-search.js`, `index.html` (coach section)

### 6.1 Readiness Ring Card
- Circular SVG ring with animated stroke-dashoffset fill
- Score counter animates from 0 to value on tab open
- Color: green (80+) → yellow (60-79) → orange (40-59) → red (<40)
- Tap: expands to show breakdown (sleep, recovery, volume)

### 6.2 Morning Brief Card
- Typing animation for AI brief text (character by character)
- Card has subtle gradient background per readiness score
- "Ask follow-up" button → opens Ask FORGE pre-filled

### 6.3 Ask FORGE Chat Upgrade
- Message bubbles with avatar icons
- User message: right-aligned, accent border
- AI response: left-aligned, glass card, typewriter text reveal
- Thinking indicator: animated dots while streaming
- Source citations appear as chips below response
- `sndSetLog()` plays when AI starts responding

### 6.4 Recovery Heatmap Enhancement
- Smooth color transitions between recovery states
- Tap a muscle → shows recovery timeline chart
- "Train anyway" vs "Rest recommended" with confidence %

---

## SUB-PROJECT 7: Nutrition Tab Revamp
**Version:** v241
**Files:** `js/goal-dashboard.js`, `js/meal-templates.js`, `index.html` (nutrition section)

### 7.1 Macro Ring Dashboard
Replace text macro targets with animated rings:
```
    [P ring] [C ring] [F ring]
      78g      220g     65g
    Protein   Carbs    Fats
```
- SVG stroke-dashoffset animation as macros are logged
- Ring fills: protein=blue, carbs=orange, fat=yellow
- 100% hit: ring glows + `sndMacroGoal()` + `hapSave()`

### 7.2 Meal Logging Flow
1. Tap "+" → slide-up sheet (not full page)
2. Food search with instant results
3. `sndFoodSearch()` on keypress (already exists)
4. `sndFoodPick()` on food select (already exists)
5. Quantity stepper: `sndQtyTick()` per tap (already exists)
6. Confirm: `sndMealLogged()` + `hapSave()` (already exists)

### 7.3 Calorie Progress Bar
- Remaining calories shown as animated progress bar
- Changes color as you approach limit:
  - Green: plenty remaining
  - Yellow: within 200 kcal
  - Red: over limit
- Macro steering card (already exists) shows alert when stalled

### 7.4 Template Chips UX
- Chips animate in with stagger (each chip slides up 50ms apart)
- Template apply: pulse animation on chip + quick preview of macros
- Save template: brief "SAVED ✓" checkmark animation on button

---

## SUB-PROJECT 8: Stats & Progress Tab
**Version:** v242
**Files:** `js/weekly-review.js`, `js/dashboard-weight-chart.js`, `js/recovery-plate.js`

### 8.1 Weekly Review Card Premium
- Stats animate in with count-up on tab open
- Win/fix insights shown as swipeable cards
- Share button → generates branded `progress-proof-card`

### 8.2 Weight/Body Chart
- Chart loads with draw animation (line draws left to right)
- Tap a data point: tooltip slides up with date/value
- Trend line: positive = green glow, negative = warning amber

### 8.3 Body Tab — Progress Photos Panel
- Photo thumbnails load with fade-in stagger
- Photo count badge on panel header
- Compare button (already built v234) — add glow pulse when 2+ photos

### 8.4 Volume / Frequency Charts
- Bar chart: bars grow upward with spring animation on load
- Hover/tap: bars glow accent color

---

## SUB-PROJECT 9: Social & Virality
**Version:** v243
**Files:** `js/social-ui.js`, `js/share-helpers.js`, `js/progress-proof-card.js`

### 9.1 Progress Proof Card (Already Built)
- Ensure share flow has: `sndSave()` + `hapSave()` + `burstSave()` on share tap
- Add "Share to Stories" format option (9:16 vertical)

### 9.2 Challenge System Improvements
- Challenge accept: `sndSocialAccept()` + `hapSocialAccept()` (already exists)
- Leaderboard rank up: `sndSocialLead()` animation
- Challenge win: `sndSocialWin()` + full confetti burst

### 9.3 Referral / Share Mechanics
- Post-workout share prompt: "You hit a PR! Share your progress 💪"
- One-tap share: generates branded card with workout stats
- Social proof: "Join 1,234 FORGE athletes" (if social count available)

---

## FX Wiring Gap Analysis

### Sounds missing from touchpoints:
| Event | Sound Needed | File to Update |
|-------|-------------|----------------|
| Photo added | `sndSave()` | `js/bodycomp-photos.js` |
| Template applied | `sndFoodPick()` | `js/meal-templates.js` |
| Program activated | `sndSessionStart()` | `js/ai-program-generator.js` |
| Streak incremented | `sndMilestone()` | `js/workout-save.js` |
| Achievement unlocked | `sndPR()` | `js/achievements-ui.js` |
| Water goal hit | `sndStepGoal()` | `index.html` water handler |
| Body weight logged | `sndSetLog()` | `js/bodycomp-photos.js` |
| InBody test saved | `sndSave()` | `js/inbody-log.js` |
| Onboarding step | `sndTap()` | `js/onboarding-controls.js` |
| Tab switch | `sndTap()` (subtle) | `js/dashboard-history.js` |

---

## Critical Bugs & Findings (Fix in v235)

These were discovered by multi-agent code review and must be addressed in the first sub-project.

### CSS Bugs (Broken References)
| Bug | Location | Fix |
|-----|----------|-----|
| `--text1` used but never defined | `css/main.css` | Add `--text1: #e8f5e9;` to `:root` |
| `--card` used but never defined | `css/main.css` | Add `--card: #131c14;` to `:root` |
| Cairo font loaded, never used | `index.html` `<link>` | Remove Google Fonts Cairo import (saves ~60KB network) |

### FX Gap: bodyweight PR path
`saveBwWorkout()` in `js/workout-save.js` calls `sndPR()` but **never calls `burstPR()`** — particle burst is missing on bodyweight PRs. Fix alongside v237 Log Tab work.

### Navigation: 7 tabs exceeds usability limit
Bottom nav has 7 items (Log, Body, Stats, Coach, Nutrition, Challenges, More). Usability research caps mobile bottom nav at 5. Fix in v236: merge low-traffic tabs into a "More" sheet or collapse Challenges into Social.

### Ditto Button (`#ditto-btn`) — No Visible Label
The Ditto feature (repeat yesterday's nutrition) is among the highest-value nutrition shortcuts but is represented only by an icon with no label. New users never discover it. Fix in v241 — add tooltip on first Nutrition tab open.

### Coach Intercept Card — No CSS Transition
`coach-intercept-card` is injected into DOM with no transition — causes layout jump. Fix in v240 — add `slideDown` keyframe to `.coach-intercept-card { animation: slideDown 250ms ease; }`.

### `@property` CSS Custom Properties — Not Yet Used
The app uses zero `@property`-registered CSS variables. This is the **highest-leverage CSS animation upgrade** available — enables animating custom property values directly via `transition`. Add in v235 for the XP bar and macro rings.

```css
@property --xp-pct {
  syntax: '<percentage>';
  inherits: false;
  initial-value: 0%;
}
/* Then: transition: --xp-pct 600ms ease; works natively */
```

### FX Facade: `js/fx.js` (Add in v235)
All FX calls are scattered across files using `if (window.sndXxx)` null-checks. Create a unified facade that delegates to the three FX modules — removes ~80 null-checks and makes wiring new events one-liner:

```js
// js/fx.js — thin facade
window.fx = {
  sound: (name, ...args) => window[name]?.(...args),
  haptic: (name, ...args) => window[name]?.(...args),
  burst: (type, x, y) => window[`burst${type}`]?.(x, y),
};
// Usage: fx.sound('sndPR'); fx.burst('PR', x, y);
```

---

## Implementation Order & Dependencies

```
v235: Design System    → No deps. Unlocks premium look for all subsequent work.
v236: Header/Nav       → Depends on v235 tokens.
v237: Log Tab          → Depends on v235+v236.
v238: Onboarding       → Depends on v235.
v239: Gamification     → Depends on v235+v236.
v240: Coach Tab        → Depends on v235+v236.
v241: Nutrition        → Depends on v235.
v242: Stats/Progress   → Depends on v235.
v243: Social           → Depends on v235.
```

---

## Success Metrics

| Metric | Current Proxy | Target |
|--------|-------------|--------|
| Session start rate | Users opening Log tab | +30% |
| Workout completion | Save workout / Start workout | +20% |
| D7 retention | Return after 7 days | +25% |
| Feature discovery | Ask FORGE usage | +40% |
| Social shares | Progress cards shared | +50% |
| App store rating | (if deployed) | 4.5+ stars |

---

## Technical Constraints

- **Vanilla JS only** — no framework dependencies
- **Service worker caching** — bump `FORGE_VERSION` with each sub-project
- **Performance budget** — new CSS additions must not exceed 20KB per sub-project
- **No new edge functions** — all enhancements client-side
- **IndexedDB unchanged** — no storage schema changes
- **Backward compatible** — all changes additive, no data migration

---

## Out of Scope

- Backend/Supabase changes
- New AI features (beyond wiring existing ones)
- Push notifications (separate project)
- iOS/Android native wrappers
- Multi-language additions

