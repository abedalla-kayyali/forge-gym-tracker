# Guest Mode Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to skip login and use the app as a guest (data saved locally), with a one-tap upgrade path that auto-migrates all local data to their account on sign-up.

**Architecture:** Guest state is a single localStorage key (`forge_guest = '1'`). The auth overlay gains a "Continue as Guest" button. `_authBoot()` skips the overlay for guests. `_authSuccess()` detects a guest upgrading and calls the existing `_syncPush()` to migrate data. A banner in the More tab nudges guests to create an account.

**Tech Stack:** Vanilla JS, localStorage. Files: `js/auth-ui.js`, `index.html`.

---

## Chunk 1: Guest Button + Skip Logic

### Task 1: Add "Continue as Guest" button and CSS to js/auth-ui.js

**Files:**
- Modify: `js/auth-ui.js`

The auth overlay HTML ends at line 191 with `</div>` closing `.auth-card`, before `</div>` closing the style+card wrapper. The `.auth-guest-btn` CSS class and `.auth-divider` are already defined in the `<style>` block (lines 124–159). The HTML just needs the divider + button injected, and the `_authGuestMode` function added.

- [ ] **Step 1: Add guest divider + button HTML inside the auth card**

In `js/auth-ui.js`, find this line (line 190):
```html
      <div class="auth-error" id="auth-error"></div>
    </div>
```

Replace with:
```html
      <div class="auth-error" id="auth-error"></div>
      <div class="auth-divider">or</div>
      <button class="auth-guest-btn" onclick="window._authGuestMode()">Continue as Guest</button>
    </div>
```

- [ ] **Step 2: Add `_authGuestMode` function after the `_authSignup` function**

In `js/auth-ui.js`, find:
```js
  // ── Enter key support ────────────────────────────────────────────────────
  overlay.addEventListener('keydown', function (e) {
```

Insert before it:
```js
  // ── Guest mode ───────────────────────────────────────────────────────────
  window._authGuestMode = function () {
    localStorage.setItem('forge_guest', '1');
    _authHideOverlay();
    if (typeof _onboardingCheck === 'function') _onboardingCheck();
  };

```

- [ ] **Step 3: Verify syntax is valid**

Run: `node check_v3.js`
Expected: `Inline OK: 1  External OK: 45  Failed: 0`

---

### Task 2: Skip auth overlay for returning guests in _authBoot

**Files:**
- Modify: `index.html` (function `_authBoot`, around line 7786)

- [ ] **Step 1: Add guest check at the top of the `else` branch**

Find in `index.html`:
```js
  } else {
    // No session — show auth overlay (blocks app usage)
    if (typeof _authShowOverlay === 'function') _authShowOverlay();
  }
```

Replace with:
```js
  } else {
    // No session — check if user chose guest mode previously
    if (localStorage.getItem('forge_guest') === '1') {
      _onboardingCheck();
    } else {
      // Show auth overlay (blocks app usage)
      if (typeof _authShowOverlay === 'function') _authShowOverlay();
    }
  }
```

- [ ] **Step 2: Verify syntax is valid**

Run: `node check_v3.js`
Expected: `Inline OK: 1  External OK: 45  Failed: 0`

---

## Chunk 2: Data Migration on Sign-Up

### Task 3: Auto-migrate guest data when a guest creates an account

**Files:**
- Modify: `index.html` (function `window._authSuccess`, around line 7753)

- [ ] **Step 1: Find _authSuccess and understand its structure**

Search for `window._authSuccess` in index.html. The function signature is:
```js
window._authSuccess = async function (session, isNewUser) {
```

It calls `_syncPull(userId)` for returning users. For new users (`isNewUser === true`) it skips the pull.

- [ ] **Step 2: Add guest data migration after the sign-up branch**

Find the block that handles `isNewUser`:
```js
    if (isNewUser) {
```

Read the full `_authSuccess` function to locate exactly where `isNewUser` is handled, then add migration logic. The migration should happen right after `_authHideOverlay()` / overlay close, when `isNewUser === true` AND `forge_guest === '1'`:

After the line `const userId = session?.user?.id;` and before any early return, add:

```js
  // Migrate guest data to account on sign-up
  const _wasGuest = localStorage.getItem('forge_guest') === '1';
```

Then find where `isNewUser` is true and a session exists (where `_syncPull` is NOT called), and add after the pull/skip block:

```js
  if (_wasGuest && isNewUser && typeof window._syncPush === 'function') {
    await window._syncPush(userId);
    localStorage.removeItem('forge_guest');
    localStorage.removeItem('forge_guest_banner_dismissed');
    if (typeof showToast === 'function') showToast('Your guest data has been saved to your account!', 'success');
  } else if (_wasGuest && !isNewUser) {
    // Guest signed in to existing account — remove guest flag, pull their cloud data
    localStorage.removeItem('forge_guest');
    localStorage.removeItem('forge_guest_banner_dismissed');
  }
```

**Important:** Read the full `_authSuccess` function first before editing to get the exact location right.

- [ ] **Step 3: Verify syntax**

Run: `node check_v3.js`
Expected: `Inline OK: 1  External OK: 45  Failed: 0`

---

## Chunk 3: In-App Upgrade Banner

### Task 4: Add guest banner to the More/Profile tab

**Files:**
- Modify: `index.html` (profile section HTML around line 1503, and renderProfile function around line 7573)

- [ ] **Step 1: Add banner HTML placeholder in the profile section**

Find in index.html (around line 1502):
```html
      <!-- Avatar row -->
      <div class="profile-avatar-row">
```

Insert before it:
```html
      <!-- Guest upgrade banner (shown only in guest mode) -->
      <div id="forge-guest-banner" style="display:none;margin-bottom:14px;padding:12px 14px;background:rgba(57,255,143,0.07);border:1px solid rgba(57,255,143,0.2);border-radius:10px;">
        <div style="font-size:0.85rem;font-weight:600;color:var(--accent,#39ff8f);margin-bottom:6px;">☁️ Sync across devices</div>
        <div style="font-size:0.8rem;color:var(--text2,#7a9e7e);margin-bottom:10px;">Create a free account to back up your workouts and access them anywhere.</div>
        <div style="display:flex;gap:8px;">
          <button onclick="window._authSwitchTab('signup');window._authShowOverlay();" style="flex:1;padding:8px;background:var(--accent,#39ff8f);color:var(--bg,#080c09);border:none;border-radius:8px;font-family:'Barlow',sans-serif;font-weight:700;font-size:0.8rem;letter-spacing:1px;text-transform:uppercase;cursor:pointer;">Sign Up Free</button>
          <button onclick="window._dismissGuestBanner()" style="padding:8px 12px;background:transparent;border:1px solid var(--border2,#253527);border-radius:8px;color:var(--text2,#7a9e7e);font-family:'Barlow',sans-serif;font-size:0.8rem;cursor:pointer;">Later</button>
        </div>
      </div>
```

- [ ] **Step 2: Add guest banner logic in renderProfile**

Find the `renderProfile` function (around line 7573). At the very top of the function body (after the opening `{`), add:

```js
  // Show/hide guest upgrade banner
  const _guestBanner = document.getElementById('forge-guest-banner');
  if (_guestBanner) {
    const _isGuest = localStorage.getItem('forge_guest') === '1';
    const _dismissed = parseInt(localStorage.getItem('forge_guest_banner_dismissed') || '0', 10);
    const _dismissedRecently = _dismissed && (Date.now() - _dismissed < 7 * 24 * 60 * 60 * 1000);
    _guestBanner.style.display = (_isGuest && !_dismissedRecently) ? '' : 'none';
  }
```

- [ ] **Step 3: Add `_dismissGuestBanner` function near renderProfile**

Find the end of `renderProfile` (closing `}`) and add after it:

```js
window._dismissGuestBanner = function () {
  localStorage.setItem('forge_guest_banner_dismissed', String(Date.now()));
  const el = document.getElementById('forge-guest-banner');
  if (el) el.style.display = 'none';
};
```

- [ ] **Step 4: Verify syntax**

Run: `node check_v3.js`
Expected: `Inline OK: 1  External OK: 45  Failed: 0`

---

## Chunk 4: Final Verification

### Task 5: Bump SW cache and verify full flow

**Files:**
- Modify: `sw.js`

- [ ] **Step 1: Bump cache version**

In `sw.js`, change:
```js
const CACHE_NAME = 'forge-v24';
```
to:
```js
const CACHE_NAME = 'forge-v25';
```

- [ ] **Step 2: Run full verification suite**

```
cd "C:/Users/USER/Desktop/Claude/Forg-Cali-os-18-main - codex 2 - Claude 2 - Nutrion"
node check_v3.js
node smoke_check.js
cmd /c run_check.bat
```

Expected: all green, 0 errors.

- [ ] **Step 3: Manual flow check (describe what to verify)**

In browser at http://localhost:8765 after clearing site data:

1. Auth overlay appears → "Continue as Guest" button is visible below the divider
2. Click "Continue as Guest" → overlay hides, app loads
3. Log a workout as guest
4. Click More tab → guest upgrade banner appears with "Sign Up Free" and "Later"
5. Click "Later" → banner hides
6. Click "Sign Up Free" → auth overlay opens on Sign Up tab
7. Create account → toast: "Your guest data has been saved to your account!"
8. Reload page → stays logged in, workout data present
9. Sign out → auth overlay shows (no guest bypass, since `forge_guest` was cleared)
10. Reload page as new fresh session → auth overlay shows → "Continue as Guest" available
