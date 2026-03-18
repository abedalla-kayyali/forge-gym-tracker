# Plan: Smart Deload Detection Engine

## Goal
Multi-signal fatigue index (0–100) that detects when user needs a deload week, surfaces an LLM-generated suggestion via the coach, and shows an intercept card before the next session.

## Fatigue Index Formula
- Volume spike this week vs last (25pts if >30% increase)
- Sleep deficit (20pts if avg < 6h past 3 days)
- Energy/mood downtrend (20pts if avg < 5/10 past 3 sessions)
- Readiness score (20pts if readinessScore < 40)
- Session RPE trend (15pts if avg RPE > 8.5 past 3 sessions)
- Total: 0–100. Threshold = 75 → trigger deload suggestion

## LLM Integration
- Reuses `forge-search` edge fn in coach_mode
- Generates 3-bullet deload plan (volume cuts, intensity drops, recovery tips)
- Cached in `sessionStorage` with date key (re-fires next day)

## Files to Create / Modify
1. **`js/deload-engine.js`** — new IIFE (fatigue index + LLM call + intercept card render)
2. **`js/dashboard-history.js`** — hook into post-workout save flow (after workout save ~line 2169)
3. **`js/coach-triggers.js`** — guard `checkDeloadNeeded()` after line ~450 on Coach tab open
4. **`css/main.css`** — deload card styles
5. **`index.html`** — add `<script src="js/deload-engine.js">` + deload intercept overlay div

## Implementation Checklist
- [x] Write `js/deload-engine.js`
- [x] Add post-workout hook in `dashboard-history.js`
- [x] Add coach tab hook in `coach-triggers.js`
- [x] Add CSS to `css/main.css`
- [x] Add script tag + overlay to `index.html`

## Status: COMPLETE ✅
