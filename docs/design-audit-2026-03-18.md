# FORGE Gym Tracker — Visual Design System Audit
**Date:** 2026-03-18
**Auditor:** UI Designer Agent
**Files analysed:** css/main.css (23,692 lines), css/entry-premium.css, css/form-inspector.css (via index.html), index.html lines 1-100

---

## 1. Current Design Tokens — What Exists vs What Is Missing

### Defined in `:root` (lines 9-28)

```css
/* Backgrounds — 5 levels */
--bg:      #080c09
--bg2:     #0d1410
--bg3:     #111a12
--panel:   #131c14
--panel2:  #182019

/* Borders — 2 levels */
--border:  #1e2e1f
--border2: #253527

/* Green palette — 6 values */
--green:      #2ecc71
--green2:     #27ae60
--green3:     #1a7a3f
--green-dim:  #1d4a2a
--green-glow: #2ecc7133

/* Accent / text */
--accent:  #39ff8f
--text:    #c8dcc9
--text2:   #7a9e7e
--text3:   #6a9a6e
--white:   #eaf4eb

/* Semantic */
--danger:  #e74c3c
--warn:    #f39c12

/* Safe area */
--safe-top: env(safe-area-inset-top, 0px)
--safe-bot: env(safe-area-inset-bottom, 0px)
```

### Rank Skin Overrides (toggled by body class)

| Class | `--accent` |
|---|---|
| `.skin-iron` | `#78909c` |
| `.skin-bronze` | `#cd7f32` |
| `.skin-silver` | `#a8a9ad` |
| `.skin-gold` | `#f39c12` |
| `.skin-platinum` | `#1abc9c` |
| `.skin-diamond` | `#3498db` |
| `.skin-legend` | `#ffd700` |

### Arcade Skin Full Token Override (`body.skin-arcade`)
Replaces `--bg`, `--bg2`, `--bg3`, `--panel`, `--panel2`, `--border`, `--border2`, `--green*`, `--text*` with purple/violet palette. Adds `--gold: #fbbf24`.

### Critical Missing Tokens

| Missing Token | Impact |
|---|---|
| `--radius-sm / --radius-md / --radius-lg` | Border radii are hardcoded everywhere (8px, 10px, 12px, 14px, 16px, 20px, 22px, 24px — 8 different values with no system) |
| `--shadow-sm / --shadow-md / --shadow-lg / --shadow-glow` | All box-shadows are inline magic numbers |
| `--transition-fast / --transition-normal / --transition-slow` | Timings scattered: `.15s`, `.2s`, `.25s`, `.28s`, `.3s`, `.35s`, `.4s`, `.6s`, `.8s` — no standard |
| `--font-body / --font-display / --font-mono / --font-ui` | Font families repeated as strings throughout |
| `--font-size-xs` through `--font-size-4xl` | Font sizes range from 6px to 72px with no token scale |
| `--space-1` through `--space-16` | All padding/margin values are raw pixels |
| `--success` | No semantic success token — `--green` / `--accent` are overloaded |
| `--info` | Blue `#60a5fa` is hardcoded for water, never tokenised |
| `--text1` | Used frequently (`.hdr-stat-val`, `.mdc-muscle-name`) but never defined in `:root` — falls back to browser default |
| `--card` | Used in `.mdc-card` (`background: var(--card)`) but never defined — likely a bug |
| `--hsc` | Used in `.hdr-stat-card` but dynamically injected via JS, not in `:root` |
| `--gold` | Only defined inside `skin-arcade`, referenced by combo/boss components that appear in default skin too |
| `--z-header / --z-modal / --z-toast` | z-index values hardcoded: 50, 100, 2000, 3000, 9000, 9999 — no layer system |

---

## 2. Typography System

### Fonts Loaded (Google Fonts, index.html line 19)
```
Bebas Neue            — Display / logo / stats
DM Mono 300/400/500   — Mono labels, values, timestamps
Barlow Condensed 300/400/600/700 — UI buttons, section headers
Barlow 300/400/500    — Body text (body font-family)
Cairo 300/400/600/700/800 — Loaded but NO usages found in audited CSS
```

**Cairo is dead weight** — loaded but unused, costing ~18KB network.

### Usage Patterns

| Role | Font | Size | Weight |
|---|---|---|---|
| App logo "FORGE" | Bebas Neue | 36px | n/a |
| Logo tag "// Gym OS" | DM Mono | 10px | — |
| Stat values (large) | Bebas Neue | 20–28px | — |
| Countdown number | system / weight 900 | 72px | 900 |
| Section labels | Barlow Condensed | 10–11px | 700 |
| Body / pill text | DM Mono | 8–13px | 400–700 |
| Exercise names | Barlow Condensed | 13–16px | 600–700 |
| Mascot quote | Barlow Condensed | 12px | 600 |
| Form inspector title | Bebas Neue | 28px | — |

### Hierarchy Issues

1. **No `--text1` defined.** Many components reference it (`.hdr-stat-val`, `.mdc-ex-name`, `.mdc-train-btn`) but the variable is missing from `:root`. This is a silent bug — those elements show inherited body color.
2. **Font sizes below 9px are inaccessible.** Labels at 6px (`.hdr-bio-date`), 6.5px (`.mev-next-label`), 7px (`.hdr-stat-label`, `.mascot-name`), 7.5px, 8px appear throughout. These fail WCAG SC 1.4.4 at 200% zoom.
3. **DM Mono is overused for body text** in modals and panels. At 10–11px it creates cognitive friction — monospace is appropriate for data values but not prose/instructions.
4. **No heading scale defined.** There is no H1/H2/H3 rhythm — section titles and panel titles compete visually because they use different fonts (Bebas Neue vs Barlow Condensed) at inconsistent sizes.
5. **Letter-spacing inconsistency.** Values found: 0.3px, 0.4px, 0.5px, 0.6px, 0.8px, 1px, 1.2px, 1.5px, 1.8px, 2px, 3px, 5px — no standard.

---

## 3. Color Palette

### Cohesion Assessment

The palette has a clear **dark green terminal aesthetic** which is strong and intentional. However there are serious consistency problems:

**Hardcoded colours not in `:root`** (found in audited sections):
- `#60a5fa` — water blue (used 6+ times, never tokenised)
- `#fbbf24` — gold/combo (used 15+ times outside arcade skin)
- `#a855f7` — energy/session purple (used in energy bar states)
- `#7c3aed` — deeper purple (energy bar)
- `#ef4444` / `#e74c3c` — two different reds used for danger
- `#22c55e` / `#2ecc71` / `#27ae60` — three different success greens
- `#9ec7e8`, `#9dc7e6`, `#9cd4ee`, `#dff8ff`, `#e8fff5`, `#eafff4`, `#f2fbff` — social section uses 7+ off-white/ice colours, all hardcoded, none tokenised

**Dark mode status:** No dark/light mode toggle exists. The app is dark-only by design, which is appropriate for a gym OS aesthetic.

**Semantic colour gaps:**
- Success: `--green` / `--accent` are overloaded (used for both brand accent AND success states)
- Error: Two different reds (`#e74c3c` in `:root` as `--danger`, `#ef4444` hardcoded elsewhere)
- Info: No token — `#60a5fa` is hardcoded
- Warning: `--warn: #f39c12` exists but `#fbbf24` (Tailwind amber-400) is used in parallel for combo/gold effects

**Contrast issues:**
- `--text3: #6a9a6e` on `--bg: #080c09` = approximately 3.8:1 — FAILS WCAG AA (requires 4.5:1 for normal text)
- `--text2: #7a9e7e` on `--bg: #080c09` = approximately 4.2:1 — BORDERLINE (barely fails)
- Labels at 7-8px with `--text3` are completely inaccessible regardless of contrast ratio

---

## 4. Spacing and Layout

### Spacing System

There is **no spacing token system**. All values are raw pixels. Values found across the file:

`2px, 3px, 4px, 5px, 6px, 7px, 8px, 9px, 10px, 12px, 13px, 14px, 16px, 18px, 20px, 24px, 28px, 32px, 36px`

This is 19 different spacing values with no mathematical relationship. A 4pt base grid (4, 8, 12, 16, 20, 24, 32, 40, 48, 64) would reduce this to ~10 values.

### Layout

- `.app-shell`: `max-width: 640px`, centered, `padding: 0 16px` — solid mobile-first constraint
- `.view-pad`: `padding: 14px 14px calc(80px + var(--safe-bot))` — the 14px is not a standard multiple
- `.hdr-stats-row`: `grid-template-columns: repeat(3, 1fr)` — good
- `.social-hero-strip`: `grid-template-columns: repeat(3, minmax(0, 1fr))` — good
- `.mb-grid`: `grid-template-columns: 1fr 1fr` — good
- No CSS Grid at the page level — all layout is flex-based which limits two-dimensional control

### Padding Inconsistency Examples

| Component | Padding |
|---|---|
| `.header-slim-strip` | `10px 16px` |
| `.collapse-zone-inner` | `0 16px 8px` |
| `.hdr-streak-pill` | `4px 10px` |
| `.hdr-steps-pill` | `4px 10px` |
| `.hdr-status-bar` | `6px 0 2px` |
| `.bio-modal-sheet` | `12px 20px 36px` |
| `.form-inspector-body` | `18px 20px 8px` |
| `.mdc-card` | `20px 18px 32px` |

Inconsistent: 16px is the standard gutters but 20px, 18px creep in on modals.

---

## 5. Component Library

### Components Identified

| Component | Class(es) | State Handling |
|---|---|---|
| Status pill (session timer) | `.status-pill`, `.status-dot` | Pulse animation |
| Streak pill | `.hdr-streak-pill` | Orange border |
| Water pill | `.hdr-water-pill` | Blue accent |
| Steps pill | `.hdr-steps-pill` | Goal-hit animation |
| Stat cards (header) | `.hdr-stat-card` | Color via `--hsc` |
| Bio tap cards | `.hdr-bio-card` | Hover glow, active scale |
| Mascot strip | `.mascot-strip` | Bounce animation, rank aura |
| XP bar | `.xp-bar-wrap`, `.xp-fill` | Width transition |
| Mission banner | `.mission-banner` | Collapse/expand, progress bar |
| Bottom nav | `.bottom-nav`, `.bnav-btn` | Active glow |
| Exercise library modal | `.ex-lib-item`, `.ex-lib-filter-pill` | Active state pill |
| Form Inspector sheet | `.form-inspector-sheet` | Slide-up, carousel |
| Bio modal | `.bio-modal-sheet` | Slide-up |
| Muscle detail modal | `.mdc-card` | Slide-up |
| Muscle heatmap | `.heatmap-wrap`, `.heatmap-svg` | Hover brightness |
| Muscle balance cards | `.mb-card` | Expand/collapse, bottom bar |
| Combo strip | `.combo-strip` | 3 intensity states |
| Energy bar | `#session-energy-bar` | 4 color states |
| Boss fight card | `.boss-fight-card` | Flash animation |
| Progress card | `.social-kpi-card` | Static |
| Social cards/feed | `.social-card`, `.social-feed-card` | Static |
| Toast (step milestone) | `.step-milestone-toast` | Slide-in/out |
| Session start overlay | `#session-start-overlay` | Countdown pop |
| Entry panel (premium) | `#section-exercise .panel` | Glow, gradient header |
| Lightbox | `#form-image-lightbox` | Blur backdrop |

### Consistency Problems

1. **Three different close button implementations:**
   - `.bio-modal-close` (34x34, border-radius 10px, no border)
   - `.form-close-btn` (32x32, border-radius 50%, with border)
   - `.lightbox-close` (40x40, border-radius 50%, with border)

2. **Three different modal sheet implementations:**
   - `.bio-modal-sheet` — `border-radius: 20px 20px 0 0`, `var(--panel)` background
   - `.form-inspector-sheet` — `border-radius: 24px 24px 0 0`, gradient background, `border-bottom: none`
   - `.mdc-card` — `border-radius: 22px 22px 0 0`, `var(--card)` background (undefined token)

3. **Button system is fragmented:** `.btn-ex-browse`, `.bio-modal-save`, `.mdc-train-btn`, `.mdc-share-btn`, `.social-action-btn`, `.form-select-btn`, `.hdr-rest-btn` — all styled individually with no shared `.btn` base class

4. **Active states inconsistent:** Some use `transform: scale(.94)`, others `scale(.95)`, `scale(.96)`, `scale(.97)` — no standard press-depth

---

## 6. Animation and Motion

### What Exists

| Animation | Name | Duration | Easing |
|---|---|---|---|
| Status dot | `pulse` | 2s infinite | ease |
| Mascot bounce | `mascot-bounce` | 2.5s infinite | ease-in-out |
| Mascot (female) | `mascot-girl-pulse` | 2.2s infinite | ease-in-out |
| Legend aura | `legendAura` | 2.4s infinite | ease-in-out |
| Ambient glow drift | `ambientDrift` | 8s infinite | ease-in-out |
| Steps pill goal-hit | `stepsPillPulse` | 1.5s | ease-out |
| Step badge bounce | `smtBounce` | 0.5s | cubic-bezier(.34,1.56,.64,1) |
| Step button pump | `stepBtnPump` | 0.35s | cubic-bezier(.34,1.56,.64,1) |
| Bio/form slide-up | `bioSlideUp` | 0.25–0.28s | cubic-bezier(.4,0,.2,1) |
| Modal slide-up | `slideUpModal` | 0.32s | cubic-bezier(.22,1,.36,1) |
| View fade-in | `fadeUp` | 180ms | ease |
| Star pop | `starPop` | 0.4s | cubic-bezier(.36,.07,.19,.97) |
| Countdown pop | `countdownPop` | 0.28s | cubic-bezier(.36,.07,.19,.97) |
| Combo pulse | `comboPulse` | 0.6–0.8s infinite | ease-in-out |
| Boss flash | `bossFlash` | 0.5s infinite | ease-in-out alternate |
| Deload filter | (transition) | 1s | ease |
| Rank skin entry badge | `epBadgePop` | 0.35s | cubic-bezier(.34,1.4,.64,1) |
| Hint slide-in | `epHintIn` | 0.25s | cubic-bezier(.22,1,.36,1) |

### Missing Micro-animations (Opportunities for Premium Feel)

1. **Set logged confirmation** — no visual feedback when a set is saved; a brief green flash or scale-pop on the row would reinforce the action
2. **XP fill transition** — bar width transitions exist but no XP gain particle burst or number increment animation
3. **Level-up ceremony** — no dedicated level-up animation beyond what exists; a full-screen shimmer + Bebas Neue "LEVEL UP" pop would be high-impact
4. **Nav tab switch** — `fadeUp` is opacity-only; adding a subtle `translateY(4px)` slide would feel more physical
5. **Card entrance stagger** — dashboard cards appear simultaneously; staggered `animation-delay` on `.hdr-stat-card` nth-child would feel polished
6. **Input focus ring** — only `entry-premium.css` adds a glow focus ring; all other inputs lack this premium treatment
7. **PR beat visual** — the existing `stepsPillPulse` pattern could be extended to a PR moment with a gold border sweep animation
8. **Muscle heatmap zone paint** — zone fill transitions exist (`.28s`) but no entrance animation when the view first loads (a sequential paint-in would be cinematic)
9. **Mission item completion** — items just get `.done` class; a checkmark scale-pop + strike-through fade would improve reward feel
10. **Bottom nav active indicator** — currently only color change; a sliding pill underline (like iOS tab bars) would feel premium

---

## 7. Visual Hierarchy Issues

1. **Header collapse zone density.** When expanded, the header contains: logo + session pill + expand button / lang toggle + edit button / XP bar + level badge / mascot strip / streak + water + rest pills / steps pill / coach ticker / stat cards row / mission banner. This is 9 distinct information zones stacked — users cannot identify the primary action.

2. **`--text3: #6a9a6e` is used for too many things** simultaneously: pill labels, secondary metadata, empty states, timestamps, legend labels, expand hints. Nothing differentiates "very secondary" from "tertiary hint" text.

3. **Accent (`#39ff8f`) is used for both interactive CTAs and data values.** `.mdc-stat-val`, `.mb-card-score`, `.hdr-coach-ticker-score` use accent for display numbers while `.bio-modal-save`, `.form-select-btn` use it for primary actions. Users cannot distinguish tappable from informational.

4. **Multiple competing animation loops** run simultaneously in idle state: `ambientDrift` (8s) + `mascot-bounce` (2.5s) + `status-dot pulse` (2s) + potentially `legendAura` (2.4s) + `comboPulse` — this creates visual noise that fights for attention with no hierarchy.

5. **Font size collapse at small scales.** 6–8px text is below the threshold of comfortable readability on 375px mobile screens. The label system (`.hdr-pill-label` at 7px, `.hdr-stat-label` at 7px, `.mascot-name` at 7px) makes the header feel cluttered rather than information-rich.

6. **Social section uses a completely different colour language** (`#9ec7e8`, `#9dc7e6`, `#f2fbff`, `#eafff4`, `#e8fff5`) that reads as a separate product rather than a view within FORGE.

---

## 8. Premium Design Recommendations

### 8.1 Glassmorphism Opportunities

The bio-modal-overlay and form-inspector already use `backdrop-filter: blur()`. Extend this treatment:

```css
/* Recommendation: Unified glass card base */
.glass-card {
  background: rgba(19, 28, 20, 0.72);
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  border: 1px solid rgba(57, 255, 143, 0.10);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.06),
    0 8px 32px rgba(0,0,0,0.4);
}
```

Apply to: `.hdr-stat-card`, `.mascot-strip`, `.status-pill`, `.hdr-steps-pill`, `.step-milestone-toast`

### 8.2 Gradient and Glow Effects

```css
/* Recommendation: Premium button gradient */
.btn-primary {
  background: linear-gradient(135deg, #39ff8f 0%, #2ecc71 60%, #1abc9c 100%);
  box-shadow:
    0 0 0 1px rgba(57,255,143,0.3),
    0 4px 20px rgba(57,255,143,0.35),
    inset 0 1px 0 rgba(255,255,255,0.2);
}

/* Recommendation: Logo word glow upgrade */
.logo-word {
  text-shadow:
    0 0 20px rgba(57,255,143,0.6),
    0 0 60px rgba(57,255,143,0.2),
    0 0 100px rgba(57,255,143,0.1);
}

/* Recommendation: Active nav item glow pill */
.bnav-btn.active::before {
  content: '';
  position: absolute;
  bottom: 0; left: 50%; transform: translateX(-50%);
  width: 24px; height: 2px;
  background: var(--accent);
  box-shadow: 0 0 8px var(--accent), 0 0 20px rgba(57,255,143,0.4);
  border-radius: 1px;
}
```

### 8.3 Card Elevation System

Currently there is no consistent elevation hierarchy. Proposed 4-level system:

```css
/* Level 0 — flush (table rows, list items) */
--elevation-0: none;

/* Level 1 — resting card */
--elevation-1:
  0 1px 2px rgba(0,0,0,0.4),
  0 0 0 1px rgba(255,255,255,0.04);

/* Level 2 — interactive card (hover state) */
--elevation-2:
  0 4px 16px rgba(0,0,0,0.5),
  0 0 0 1px rgba(57,255,143,0.08),
  inset 0 1px 0 rgba(255,255,255,0.05);

/* Level 3 — elevated panel/sheet */
--elevation-3:
  0 8px 40px rgba(0,0,0,0.6),
  0 0 0 1px rgba(255,255,255,0.07),
  inset 0 1px 0 rgba(255,255,255,0.06);

/* Level 4 — modal overlay */
--elevation-4:
  0 16px 60px rgba(0,0,0,0.7),
  0 0 80px rgba(57,255,143,0.05);
```

Apply elevation-1 to `.mb-card`, `.ex-lib-item`, `.hdr-stat-card`.
Apply elevation-2 on hover for all interactive cards.
Apply elevation-3 to `.bio-modal-sheet`, `.form-inspector-sheet`, `.mdc-card`.

### 8.4 Premium Typography Upgrades

```css
/* Recommendation: Standardise the micro-label */
.label-micro {
  font-family: 'DM Mono', monospace;
  font-size: 9px;          /* raise floor from 6–7px to 9px minimum */
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--text3);
  font-weight: 500;
}

/* Recommendation: Gradient headline text */
.stat-headline {
  background: linear-gradient(180deg, var(--white) 0%, var(--accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Apply to: .logo-word uses this but inline. Extend to .mdc-stat-val, .mb-card-score */
```

---

## 9. Sound Design Integration Points

Based on the UI event taxonomy in the CSS:

| Trigger | CSS Class / Event | Recommended Sound |
|---|---|---|
| Set logged | `.ep-pressed` applied to `.bw-ex-btn` | Short tactile click (30ms, 800Hz sine) |
| PR achieved | `#pr-path-banner.show` appears | Ascending 3-note arpeggio (C-E-G, 120ms each) |
| Step goal hit | `.hdr-steps-pill.goal-hit` | Soft chime + subtle crowd noise (1s) |
| XP level-up | Level badge text changes | Full triumph fanfare (2s, play once) |
| Milestone toast shown | `.step-milestone-toast.show` | Bell + swoosh (0.4s) |
| Session start countdown | `#session-start-overlay.active` + `.pop` | 3 countdown beeps + "GO" sound |
| Boss fight card flash | `.boss-fight-card` active | Danger pulse drone (loops while active) |
| Mission item completed | `.mb-check.done` | Soft tick + XP chime (0.3s) |
| Combo strip fire state | `.combo-strip-fire` active | Low-frequency rumble texture (loops) |
| Workout end star reveal | `.wend-star.revealed` | Star twinkle per star, 0.4s staggered |
| Water goal reached | All dots `.filled` | Water pour sound + gentle chime |
| Legend aura active | `body.skin-legend` | Ambient power hum (very low, looping) |

**Implementation note:** All sounds should respect `prefers-reduced-motion` and a user toggle in Profile. Fire sounds from a Web Audio API oscillator bank, not audio files, for zero-latency response and no HTTP requests.

---

## 10. Proposed Design Token Upgrade

Replace the current `:root` with this expanded system. This is a **backwards-compatible additive** proposal — existing variable names are preserved, new tokens are added.

```css
:root {
  /* ── BACKGROUNDS (existing, keep) ── */
  --bg:    #080c09;
  --bg2:   #0d1410;
  --bg3:   #111a12;
  --panel: #131c14;
  --panel2:#182019;

  /* ── BORDERS (existing, keep) ── */
  --border:  #1e2e1f;
  --border2: #253527;

  /* ── GREEN SCALE (existing, keep) ── */
  --green:     #2ecc71;
  --green2:    #27ae60;
  --green3:    #1a7a3f;
  --green-dim: #1d4a2a;
  --green-glow:#2ecc7133;
  --accent:    #39ff8f;

  /* ── TEXT SCALE (fix --text1 gap) ── */
  --text1: #eaf4eb;   /* NEW — was undefined, was causing silent fallback */
  --text:  #c8dcc9;
  --text2: #7a9e7e;
  --text3: #6a9a6e;
  --white: #eaf4eb;

  /* ── SEMANTIC COLOURS (new) ── */
  --success:        #39ff8f;  /* = --accent for now; decouple if needed */
  --success-dim:    #1d4a2a;
  --success-glow:   rgba(57,255,143,0.15);
  --danger:         #e74c3c;  /* existing */
  --danger-dim:     rgba(231,76,60,0.12);
  --warn:           #f39c12;  /* existing */
  --warn-dim:       rgba(243,156,18,0.12);
  --info:           #60a5fa;  /* NEW — tokenise water/info blue */
  --info-dim:       rgba(96,165,250,0.12);
  --gold:           #fbbf24;  /* NEW — tokenise combo/milestone gold */
  --gold-dim:       rgba(251,191,36,0.12);

  /* ── BORDER RADII (new token system) ── */
  --radius-xs:  4px;
  --radius-sm:  8px;
  --radius-md:  12px;
  --radius-lg:  16px;
  --radius-xl:  20px;
  --radius-2xl: 24px;
  --radius-pill:999px;

  /* ── SPACING (new 4pt base grid) ── */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* ── TYPOGRAPHY (new font tokens) ── */
  --font-display: 'Bebas Neue', sans-serif;
  --font-ui:      'Barlow Condensed', sans-serif;
  --font-body:    'Barlow', sans-serif;
  --font-mono:    'DM Mono', monospace;

  /* ── FONT SIZE SCALE (new) ── */
  --text-2xs: 9px;    /* minimum label size — replaces 6-8px chaos */
  --text-xs:  11px;
  --text-sm:  13px;
  --text-base:15px;
  --text-md:  16px;
  --text-lg:  18px;
  --text-xl:  22px;
  --text-2xl: 28px;
  --text-3xl: 36px;
  --text-4xl: 48px;

  /* ── TRANSITIONS (new standard timings) ── */
  --ease-fast:   150ms cubic-bezier(.4,0,.2,1);
  --ease-normal: 250ms cubic-bezier(.4,0,.2,1);
  --ease-slow:   400ms cubic-bezier(.4,0,.2,1);
  --ease-spring: 350ms cubic-bezier(.34,1.56,.64,1);
  --ease-modal:  280ms cubic-bezier(.22,1,.36,1);

  /* ── SHADOWS / ELEVATION (new) ── */
  --elevation-0: none;
  --elevation-1: 0 1px 2px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04);
  --elevation-2: 0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(57,255,143,0.08), inset 0 1px 0 rgba(255,255,255,0.05);
  --elevation-3: 0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.07), inset 0 1px 0 rgba(255,255,255,0.06);
  --elevation-4: 0 16px 60px rgba(0,0,0,0.7), 0 0 80px rgba(57,255,143,0.05);

  /* ── Z-INDEX LAYER SYSTEM (new) ── */
  --z-base:    1;
  --z-sticky:  10;
  --z-header:  50;
  --z-nav:     100;
  --z-overlay: 500;
  --z-modal:   2000;
  --z-sheet:   9000;
  --z-toast:   9999;

  /* ── SAFE AREA (existing, keep) ── */
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-bot: env(safe-area-inset-bottom, 0px);
}
```

---

## Summary: Priority Fix List

| Priority | Issue | Fix |
|---|---|---|
| P0 | `--text1` and `--card` undefined — silent bugs | Add to `:root` |
| P0 | `--danger` has two values (`#e74c3c` and `#ef4444`) | Unify to single token |
| P1 | Minimum font size below 9px in 15+ places | Raise floor to `--text-2xs: 9px` |
| P1 | `--text3` fails WCAG AA on dark backgrounds | Lighten to `#8ab08e` (approx 4.6:1) |
| P1 | Cairo font loaded but unused | Remove from Google Fonts import |
| P2 | No border-radius token system — 8 values hardcoded | Add `--radius-*` tokens |
| P2 | No transition token system — 9 timings in use | Add `--ease-*` tokens |
| P2 | Three different close button implementations | Unify to `.btn-close` base class |
| P2 | Three different modal sheet implementations | Unify to `.sheet-base` with modifiers |
| P2 | `#60a5fa` and `#fbbf24` and `#a855f7` not tokenised | Add `--info`, `--gold` to `:root` |
| P3 | No spacing token system | Add `--space-*` tokens |
| P3 | Active press scale inconsistent (.94/.95/.96/.97) | Standardise to `scale(.95)` |
| P3 | Social section uses 7+ off-brand ice colours | Map to `--info` / `--text1` tokens |
| P4 | No card elevation system | Add `--elevation-*` tokens |
| P4 | Missing micro-animations (set log, level-up, mission check) | Add per section 8.6 above |
| P4 | No z-index token system | Add `--z-*` layer tokens |
