# Guest Mode Design

Date: 2026-03-10
Status: Approved

---

## Goal

Let users skip login and use the app immediately, with a clear path to create an account later. All guest data auto-migrates on sign-up — no data loss.

---

## Section 1: Auth Overlay Changes (js/auth-ui.js)

Add a "Continue as Guest" button below the login/signup form.

On click:
1. Call `_authGuestMode()` — sets `localStorage.setItem('forge_guest', '1')`
2. Hide the overlay (`_authHideOverlay()`)
3. App boots normally (already local-first, no auth needed)

On return visits: if `forge_guest === '1'` already set, skip the overlay entirely (same logic as existing session check).

---

## Section 2: In-App Upgrade Path (js/auth-ui.js + index.html)

**More tab banner** — shown when `forge_guest === '1'`:
> "☁️ Sync your data across devices — Create a free account to back up your workouts. [Sign Up] [Maybe later]"

- "Maybe later" hides it for 7 days via `forge_guest_banner_dismissed` timestamp in localStorage
- "Sign Up" opens the existing auth overlay directly to the sign-up tab

**Profile header** — small "Guest Mode • Create Account" indicator replaces the sync status when guest.

---

## Section 3: Auto-Migration on Sign-Up (js/auth-ui.js + js/sync.js)

In `_authSuccess(session, isNewUser)`:
- If `isNewUser === true` AND `localStorage.getItem('forge_guest') === '1'`:
  1. Call existing `_syncPush(userId)` — pushes all 11 localStorage tables to Supabase
  2. Remove `forge_guest` flag
  3. Show toast: "Your guest data has been saved to your account ✓"

No new migration logic — `_syncPush` already handles everything.

---

## Constraints

- Vanilla JS only — no new dependencies
- Files touched: `js/auth-ui.js`, `index.html` (More tab + profile header)
- Do not change existing login/signup flow
- Guest mode is purely additive — all existing auth paths work unchanged
