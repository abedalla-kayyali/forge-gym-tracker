# Collapsible Header & Mission Banner Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collapse the full header + mission banner behind a slim 40px strip by default, revealing full header on chevron tap — freeing screen space for gym users.

**Architecture:** The existing first row of `<header>` (logo + session pill) becomes the always-visible slim strip, with a chevron added. Everything below it (XP bar, mascot, status bar, coach ticker) plus `#mission-banner` wraps in a `.header-collapse-zone` div. CSS `max-height` transition toggled by `.header-expanded` class on `<header>`. No new JS files — one `toggleHeader()` function added inline.

**Tech Stack:** Vanilla JS, CSS custom properties, no build step. Verify with `node smoke_check.js` and `node serve.js` (browser at localhost).

---

## Chunk 1: CSS — Slim strip + collapse zone styles

**Files:**
- Modify: `css/main.css`

- [ ] **Step 1: Open `css/main.css` and find the `header` block (line ~59)**

Locate:
```css
header{
  display:flex; align-items:center; justify-content:space-between;
  padding:20px 0 14px; border-bottom:1px solid var(--border2); margin-bottom:20px;
  position:relative; top:0; z-index:50;
  background:var(--bg);
  padding-top:calc(20px + var(--safe-top));
}
```

- [ ] **Step 2: Replace the `header` block and add new slim strip + collapse zone styles**

Replace the existing `header{...}` block with:
```css
header{
  position:relative; top:0; z-index:50;
  background:var(--bg);
  border-bottom:1px solid var(--border2);
  margin-bottom:0;
}
.header-slim-strip{
  display:flex; align-items:center; justify-content:space-between;
  padding:10px 16px;
  padding-top:calc(10px + var(--safe-top));
  min-height:44px;
}
.header-collapse-zone{
  max-height:0;
  overflow:hidden;
  transition:max-height .3s ease;
}
header.header-expanded .header-collapse-zone{
  max-height:700px;
}
.header-expand-btn{
  background:none;border:none;cursor:pointer;
  padding:8px;margin:-8px -8px -8px 4px;
  display:flex;align-items:center;justify-content:center;
  color:var(--text3);
  touch-action:manipulation;-webkit-tap-highlight-color:transparent;
}
.header-expand-btn svg{
  transition:transform .3s ease;
}
header.header-expanded .header-expand-btn svg{
  transform:rotate(180deg);
}
.slim-strip-right{
  display:flex;align-items:center;gap:8px;
}
```

Also find and update `.header-right` — it will no longer be used in the slim strip, but keep it for the collapse zone (lang toggle + edit button move there). No change needed to `.header-right` itself.

- [ ] **Step 3: Add bottom border to collapse zone when expanded**

Append after the `.header-expand-btn svg` block:
```css
header.header-expanded .header-collapse-zone{
  border-bottom:1px solid var(--border2);
  padding-bottom:4px;
}
.collapse-zone-inner{
  padding:0 16px 8px;
  display:flex;flex-direction:column;gap:10px;
}
```

- [ ] **Step 4: Fix `.logo` margin — it no longer needs the old header padding**

Find `.logo{display:flex;align-items:baseline;gap:8px;}` and confirm it has no top margin. No change needed — it inherits from `.header-slim-strip` padding.

- [ ] **Step 5: Run smoke check**

```bash
node smoke_check.js
```
Expected: all checks pass, no CSS syntax errors flagged.

- [ ] **Step 6: Commit CSS**

```bash
git add css/main.css
git commit -m "style: add slim strip and collapse zone styles for header"
```

---

## Chunk 2: HTML — Restructure header + move mission banner

**Files:**
- Modify: `index.html` (header section, lines ~381–471 and mission banner ~479–494)

- [ ] **Step 1: Locate the header opening tag (line ~381)**

Find:
```html
  <header id="app-header" style="flex-direction:column;align-items:stretch;gap:10px;">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <div class="logo">
        <span class="logo-word">FORGE</span>
        <span class="logo-tag" id="header-greeting">// Gym OS</span>
      </div>
      <div class="header-right">
        <button class="lang-toggle-btn" id="lang-toggle-btn" onclick="toggleLanguage()" title="Switch Language / ����� �����">EN</button>
        <button class="edit-layout-btn" id="edit-layout-btn" onclick="toggleEditMode()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:4px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Edit</button>
        <div class="status-pill" id="session-pill"><div class="status-dot" id="session-dot"></div><span id="session-time">00:00</span></div>
      </div>
    </div>
```

- [ ] **Step 2: Replace the header opening and first row with slim strip**

Replace the entire block above with:
```html
  <header id="app-header">
    <!-- SLIM STRIP (always visible) -->
    <div class="header-slim-strip">
      <div class="logo">
        <span class="logo-word">FORGE</span>
        <span class="logo-tag" id="header-greeting">// Gym OS</span>
      </div>
      <div class="slim-strip-right">
        <div class="status-pill" id="session-pill"><div class="status-dot" id="session-dot"></div><span id="session-time">00:00</span></div>
        <button class="header-expand-btn" id="header-expand-btn" onclick="toggleHeader()" title="Expand header" aria-label="Toggle header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
      </div>
    </div>
    <!-- COLLAPSIBLE ZONE -->
    <div class="header-collapse-zone" id="header-collapse-zone">
      <div class="collapse-zone-inner">
        <!-- Lang toggle + Edit (moved from slim strip) -->
        <div class="header-right" style="justify-content:flex-end;">
          <button class="lang-toggle-btn" id="lang-toggle-btn" onclick="toggleLanguage()" title="Switch Language / ����� �����">EN</button>
          <button class="edit-layout-btn" id="edit-layout-btn" onclick="toggleEditMode()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:4px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Edit</button>
        </div>
```

- [ ] **Step 3: Wrap remaining header content and close the collapse zone inside `</header>`**

Find the closing `</header>` tag (line ~471). Just before it, all existing content (XP bar, mascot strip, status bar, coach ticker) should now be inside the collapse zone. Add the closing divs:

The content between the old first row and `</header>` — i.e., `.xp-bar-wrap`, `.mascot-strip`, `.hdr-status-bar`, `.hdr-coach-ticker` — should now be wrapped. They are already inside the `<div class="collapse-zone-inner">` you opened in step 2.

Close the collapse zone and header properly:
```html
      </div><!-- /.collapse-zone-inner -->
    </div><!-- /#header-collapse-zone -->
  </header>
```

Replace the old bare `</header>` with these three lines.

- [ ] **Step 4: Move `#mission-banner` inside the collapse zone**

Find the mission banner block (after `</header>`, lines ~479–494):
```html
  <div class="mission-banner" id="mission-banner" onclick="toggleMissionBanner()">
    ...
  </div>
```

Cut the entire `#mission-banner` div and paste it inside `.collapse-zone-inner`, after the `.hdr-coach-ticker` block and before the closing `</div><!-- /.collapse-zone-inner -->`.

Also remove the `position:relative; z-index:10;` from `.mission-banner` in `css/main.css` since it no longer needs to be sticky — it just flows inside the collapse zone.

- [ ] **Step 5: Add bottom margin to `#session-energy-bar` separation**

The `#session-energy-bar` sits right after `</header>`. Now that `margin-bottom` is removed from `header{}`, add:
```css
#session-energy-bar{ margin-top:0; }
```
This is likely already fine — just verify visually that there's no gap.

- [ ] **Step 6: Add `margin-bottom` to the collapse zone**

In `css/main.css`, in the `header{}` block add:
```css
header{ margin-bottom:20px; }
```
Wait — the old `header{}` had `margin-bottom:20px`. The new version removed it. But the content below (`.app-shell` views) still needs that spacing. Actually the views have their own padding. Check by opening in browser. If the content feels too tight, add `margin-bottom:20px` back to `header{}`.

- [ ] **Step 7: Run smoke check**

```bash
node smoke_check.js
```
Expected: all checks pass.

- [ ] **Step 8: Verify in browser**

Start server: `node serve.js` (or double-click `serve.bat`)
Open `localhost` in mobile browser or DevTools mobile viewport (375px wide).

Check:
- [ ] Slim strip visible with FORGE logo + session timer + chevron
- [ ] Lang toggle and Edit button NOT visible by default
- [ ] Mission banner NOT visible by default
- [ ] Tap chevron → header expands showing XP bar, mascot, status bar, coach ticker, mission banner
- [ ] Tap chevron again → collapses smoothly
- [ ] Session timer still counts correctly when a session is active

- [ ] **Step 9: Commit HTML changes**

```bash
git add index.html
git commit -m "feat: restructure header — slim strip + collapsible zone, move mission banner inside"
```

---

## Chunk 3: JS — toggleHeader() + session state on slim strip

**Files:**
- Modify: `index.html` (inline script section)

- [ ] **Step 1: Find the inline script area for session functions (around line 2514 — `function startWorkoutSession`)**

- [ ] **Step 2: Add `toggleHeader()` function**

Just before `function startWorkoutSession()`, add:
```javascript
function toggleHeader() {
  const hdr = document.getElementById('app-header');
  if (hdr) hdr.classList.toggle('header-expanded');
}
```

- [ ] **Step 3: Update slim strip session state in `startWorkoutSession`**

Inside `startWorkoutSession()`, after the line `if (shAct) shAct.style.display = '';`, add:
```javascript
  // Slim strip: show active state
  const greeting = document.getElementById('header-greeting');
  if (greeting) greeting.style.display = 'none';
```

This hides the `// Gym OS` tag, leaving just `FORGE` + the live timer pill in the slim strip during a session.

- [ ] **Step 4: Reset slim strip on session end in `endWorkoutSession`**

Inside `endWorkoutSession()`, after the line `if (shIdle) shIdle.style.display = '';`, add:
```javascript
  // Slim strip: restore idle state
  const greeting = document.getElementById('header-greeting');
  if (greeting) greeting.style.display = '';
```

- [ ] **Step 5: Run smoke check**

```bash
node smoke_check.js
```
Expected: all checks pass.

- [ ] **Step 6: Verify in browser**

- [ ] Tap chevron — header expands/collapses
- [ ] Tap "START SESSION" — `// Gym OS` text disappears from slim strip, live timer counts up
- [ ] Tap "END SESSION" (twice to confirm) — `// Gym OS` returns, timer resets to 00:00
- [ ] RTL mode (tap EN → AR) — slim strip layout flips correctly

- [ ] **Step 7: Commit JS changes**

```bash
git add index.html
git commit -m "feat: add toggleHeader(), sync slim strip state on session start/end"
```

---

## Chunk 4: RTL + Polish

**Files:**
- Modify: `css/main.css`

- [ ] **Step 1: Add RTL rules for slim strip**

In the `/* RTL GLOBAL FIXES */` section (~line 93 in main.css), add:
```css
[dir="rtl"] .header-slim-strip{ flex-direction:row-reverse; }
[dir="rtl"] .slim-strip-right{ flex-direction:row-reverse; }
[dir="rtl"] .collapse-zone-inner .header-right{ flex-direction:row-reverse; }
```

- [ ] **Step 2: Verify RTL in browser**

Switch to Arabic (tap EN → AR). Check:
- [ ] Slim strip logo on right, chevron on left
- [ ] Expanded zone content still readable

- [ ] **Step 3: Bump version in `js/config.js`**

Open `js/config.js`. Find the `APP_VERSION` or `version` constant. Increment to `v39`.

Also update `sw.js` cache name to match (search for `v38` and replace with `v39`).

- [ ] **Step 4: Final smoke check**

```bash
node smoke_check.js
```
Expected: all checks pass.

- [ ] **Step 5: Final commit**

```bash
git add css/main.css js/config.js sw.js
git commit -m "feat: collapsible header UX — RTL polish, bump version to v39"
```
