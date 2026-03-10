# FORGE: Bug Fixes + XSS Audit Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix three concrete bugs (corrupted SVG, dead code, credential comment) and patch five XSS vulnerabilities where user-controlled strings are inserted into innerHTML without `_esc()`.

**Architecture:** All changes are surgical edits to existing files. No new files, no new dependencies. The `_esc()` helper already exists at `window.FORGE_STORAGE.esc` and is aliased in index.html as `const _esc = window.FORGE_STORAGE.esc`. For JS modules that don't have that alias, call `window.FORGE_STORAGE.esc(str)` directly.

**Tech Stack:** Vanilla JS, plain HTML/CSS, Node.js (serve.js only).

---

## Chunk 1: Quick Fixes

### Task 1: Fix corrupted icons/icon.svg

**Files:**
- Modify: `icons/icon.svg`

- [ ] **Step 1: Replace the corrupted file with a valid FORGE SVG icon**

Write this content to `icons/icon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#1a1a2e"/>
  <polygon points="256,80 180,200 220,200 160,420 340,220 290,220 360,80" fill="#e94560"/>
  <text x="256" y="470" text-anchor="middle" font-family="Arial Black,sans-serif" font-size="72" font-weight="900" fill="#e94560">FORGE</text>
</svg>
```

- [ ] **Step 2: Verify the file is valid XML**

Run: `node -e "const fs=require('fs'); const d=fs.readFileSync('icons/icon.svg','utf8'); console.log(d.startsWith('<svg') ? 'OK' : 'FAIL', d.length + ' bytes')"`

Expected: `OK 3xx bytes`

---

### Task 2: Remove duplicate PORT declaration in serve.js

**Files:**
- Modify: `serve.js:64`

- [ ] **Step 1: Remove the dead duplicate line**

In `serve.js`, line 64 contains:
```js
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8765;
```
This is inside the `fs.readFile` callback, duplicating the declaration on line 3. Remove line 64 entirely.

The file should go from:
```js
    res.end(data);
  });
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8765;
}).listen(PORT, '127.0.0.1', () => ...
```
To:
```js
    res.end(data);
  });
}).listen(PORT, '127.0.0.1', () => ...
```

- [ ] **Step 2: Verify the server still starts**

Run: `node serve.js &` then `curl -s http://localhost:8765/ | head -5` then kill the background node process.

Expected: HTML output from index.html

---

### Task 3: Add safety comment to js/config.js

**Files:**
- Modify: `js/config.js`

- [ ] **Step 1: Add a comment clarifying the anon key is safe to ship**

Replace the file content with:

```js
// FORGE Supabase Configuration
// The SUPABASE_ANON key is a public-safe anon key — it is designed to be
// shipped in client-side code. Row Level Security (RLS) on the Supabase
// project enforces access control server-side. This is correct per Supabase
// architecture: https://supabase.com/docs/guides/api/api-keys
window.FORGE_CONFIG = {
  SUPABASE_URL:  'https://mnqetnzdgtbeysqnmbkx.supabase.co',
  SUPABASE_ANON: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ucWV0bnpkZ3RiZXlzcW5tYmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMzMzMzgsImV4cCI6MjA4ODcwOTMzOH0.yqgdzeFUyqU3Lkg6cyCt0Kl3l525kD60oTi_p93AuXw'
};
```

---

## Chunk 2: XSS Fixes

### Task 4: Fix XSS in js/muscle-detail-modal.js

**Files:**
- Modify: `js/muscle-detail-modal.js`

The `_esc` alias is not imported in this file. Use `window.FORGE_STORAGE.esc(str)` directly.

- [ ] **Step 1: Find all innerHTML assignments using `w.exercise`**

Search the file for `w.exercise` inside innerHTML templates.

- [ ] **Step 2: Wrap each `w.exercise` with `window.FORGE_STORAGE.esc()`**

For every occurrence of `${w.exercise}` or `${w.exercise || 'Unknown'}` inside an innerHTML assignment, change to:
- `${window.FORGE_STORAGE.esc(w.exercise || 'Unknown')}` (if fallback present)
- `${window.FORGE_STORAGE.esc(w.exercise)}` (if no fallback)

Also fix any `${lvl.n}` inside innerHTML (skill/exercise name from level data).

- [ ] **Step 3: Verify no syntax errors**

Run: `node check_v3.js`

Expected: no errors reported for muscle-detail-modal.js

---

### Task 5: Fix XSS in js/cali-dashboard.js

**Files:**
- Modify: `js/cali-dashboard.js`

- [ ] **Step 1: Find innerHTML assignments using `tree.tree` or other user-controlled tree/skill names**

Search for `tree.tree`, `tree.name`, or similar inside innerHTML templates.

- [ ] **Step 2: Wrap each with `window.FORGE_STORAGE.esc()`**

Change `${tree.tree}` → `${window.FORGE_STORAGE.esc(tree.tree)}` (and any similar user-controlled fields).

- [ ] **Step 3: Verify no syntax errors**

Run: `node check_v3.js`

---

### Task 6: Fix XSS in js/fx-visuals.js

**Files:**
- Modify: `js/fx-visuals.js`

- [ ] **Step 1: Find innerHTML assignments using `nextSkill.n` or similar skill name fields**

Search for `nextSkill.n`, `skill.n`, or similar inside innerHTML templates.

- [ ] **Step 2: Wrap each with `window.FORGE_STORAGE.esc()`**

Change `${nextSkill.n}` → `${window.FORGE_STORAGE.esc(nextSkill.n)}` etc.

- [ ] **Step 3: Verify no syntax errors**

Run: `node check_v3.js`

---

### Task 7: Fix XSS in js/bodycomp-photos.js

**Files:**
- Modify: `js/bodycomp-photos.js`

- [ ] **Step 1: Find innerHTML assignments using `p.date` or other user-entered fields**

Search for `p.date`, `p.label`, or similar inside innerHTML templates.

- [ ] **Step 2: Wrap user-controlled string fields with `window.FORGE_STORAGE.esc()`**

Change `${p.date}` → `${window.FORGE_STORAGE.esc(p.date)}` where `p.date` is a user-entered string (not a Date object).

Note: `p.data` is a base64 string used as an `src` attribute — this is safe as-is (browsers don't execute base64 src as scripts). Only fix `p.date` and any other text fields rendered as HTML content.

- [ ] **Step 3: Verify no syntax errors**

Run: `node check_v3.js`

---

## Chunk 3: Final Verification

### Task 8: Run full verification suite

- [ ] **Step 1: Run JS syntax checker**

Run: `node check_v3.js`

Expected: 0 errors

- [ ] **Step 2: Run smoke check**

Run: `node smoke_check.js`

Expected: pass / no failures

- [ ] **Step 3: Run regression check**

Run: `cmd /c run_check.bat`

Expected: all checks green

- [ ] **Step 4: Manual spot check**

Open `http://localhost:8765` in browser (start server with `node serve.js`).
- Verify PWA icon loads in address bar (no broken icon)
- Navigate to Coach tab → Today — confirm cards render
- Navigate to Muscle History — confirm exercise names display correctly (not escaped as HTML entities)
