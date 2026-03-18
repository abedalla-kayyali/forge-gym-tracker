# Code Review: Task 2 Canvas Draw Function
**File:** `js/progress-proof-card.js` (Lines 88–256)
**Commit:** `1a69567`
**Reviewer:** Senior Code Reviewer
**Date:** 2026-03-17

---

## Executive Summary
**Status:** ✅ **APPROVED** with Minor recommendations

The Canvas draw implementation is well-structured, visually consistent, and follows established patterns from the codebase. The `_resolveHeroes` logic is robust with proper fallback chains. No critical issues found.

---

## Strengths

### 1. **Hero Stat Resolver Logic (Lines 88–119)**
- **Goal-aware selection** (fat_loss/muscle_gain/default) matches product intent
- **Fallback chain** (lines 110–113) correctly handles missing data:
  - Tries goal-specific picks first
  - Falls back to statPool in priority order
  - Graceful defaults (SESSIONS, STREAK) ensure card never breaks
- **Deduplication** (line 113) prevents same stat appearing twice
- Clean, readable logic flow

### 2. **Canvas Zone Architecture (Lines 155–241)**
- **Clear zone separation** with comments and consistent y-coordinates
- **5 distinct zones** properly dimensioned:
  - Header: 0–180 (title + athlete + phase + divider)
  - Heroes: 190–420 (two stat boxes)
  - Pills: 440–570 (inline stats)
  - Body Comp: 590–740 (deltas with progress bars)
  - Top Lifts: 760–1000 (ranked gains)
  - Watermark: 1335
- **Total height** 1350px fits card proportion without overflow

### 3. **Type Guards & Defensive Programming**
- Consistent `typeof` checks before calling external functions:
  - Line 171: `typeof _roundRect === 'function'`
  - Line 183: `typeof _drawPill === 'function'`
  - Line 129: `typeof calcStreak === 'function'`
- **Null/undefined handling** in data extraction (lines 25, 35, 38–39)
- **Safe number coercion** (e.g., `Number(bw[...].weight)`)

### 4. **Coordinate Consistency**
- X-coordinates: Left margin 70px, right edge 1010px (940px usable width) ✓
- Hero boxes: 450px width + 40px gap = perfectly fits 940px
- Pill layout: Dynamically sized based on count (line 191) ✓
- Bar tracks: 600px usable width (220–820) leaves room for labels ✓

### 5. **IIFE Export Pattern**
- Properly exports 7 functions to `window` namespace (lines 247–253)
- `_drawProgressProofCard` correctly aliased as `_pcDrawCard` ✓
- No global state pollution

---

## Issues Found

### Critical Issues
**None** ✅

### Important Issues

#### 1. **Accent Logic Inversion in Pill Display (Line 189)**
**Severity:** Important
**Location:** Line 189
**Issue:**
```javascript
pills.push({ label: 'WEIGHT', value: (weightD.delta > 0 ? '+' : '') + weightD.delta + weightD.unit, accent: weightD.delta < 0 });
```

**Problem:**
- For fat_loss goals, weight LOSS (negative delta) should be highlighted as good
- Setting `accent: weightD.delta < 0` means accent=true when delta is negative
- **But this is the only place accent is set this way** — heroes (line 90) always use `accent: true` for weight
- **Inconsistency:** Hero weight card will be highlighted green for any delta, but pill will only highlight if negative

**Recommendation:**
Consider whether accent should reflect "goal alignment" (good=green, bad=red) or "importance" (always highlight in hero). Currently mixed:
```javascript
// Consider: accent: goal === 'fat_loss' ? weightD.delta < 0 : weightD.delta > 0
pills.push({ label: 'WEIGHT', value: ..., accent: weightD.delta < 0 });
```

**Status:** Not blocking but should clarify UX intent.

---

#### 2. **Missing Null Check on prGains Array (Line 93)**
**Severity:** Important
**Location:** Line 93
**Issue:**
```javascript
if (prGains.length) statPool.push({ label: 'TOP PR', value: '+' + prGains[0].gain + 'kg', accent: true });
```

**Problem:**
- Line 188 also accesses `prGains[0]` without re-checking:
  ```javascript
  if (prGains.length) pills.push({ label: 'TOP PR', value: '+' + prGains[0].gain + 'kg', accent: true });
  ```
- If `prGains` is mutated between heroA/heroB selection and pill drawing, could be undefined
- **Low risk** (prGains is local var), but defensive coding suggests capture early

**Recommendation:**
```javascript
const topPR = prGains.length ? prGains[0] : null;
// Then: value: '+' + topPR.gain + 'kg'
```

---

### Minor Issues / Suggestions

#### 3. **Font Loading Not Guaranteed (Lines 156–178 and throughout)**
**Severity:** Minor
**Location:** Multiple lines (font declarations)
**Issue:**
- Fonts like `"Bebas Neue"`, `"Barlow Condensed"`, `"DM Mono"` are used but no `@font-face` loading check
- Canvas will fall back to `sans-serif` if fonts not loaded by draw time
- Current code assumes fonts are in `index.html` head

**Recommendation:**
- Document that fonts must be loaded before calling `_drawProgressProofCard()`
- Or add a small delay/font-load check:
```javascript
async function _drawProgressProofCard() {
  if (document.fonts) await document.fonts.ready; // Web Fonts API
  // ... rest of draw
}
```
(Already marked as `async`, just needs implementation)

**Status:** Minor — codebase already assumes fonts, but worth documenting.

---

#### 4. **Duplicate Stat in Pill Row (Line 188)**
**Severity:** Minor
**Location:** Lines 184–188
**Issue:**
- If TOP PR stat is in heroes, it reappears in pills
- Example: Goal=muscle_gain → heroA=TOP PR in hero section → also added to pills (line 188)
- Creates redundancy in card layout

**Recommendation:**
```javascript
const pills = [
  { label: 'SESSIONS', value: sessions, accent: false },
  { label: 'STREAK', value: streak + 'D', accent: false }
];
const heroLabels = new Set(heroes.map(h => h.label));
if (prGains.length && !heroLabels.has('TOP PR')) {
  pills.push({ label: 'TOP PR', value: '+' + prGains[0].gain + 'kg', accent: true });
}
if (weightD && !heroLabels.has('WEIGHT')) {
  pills.push({ label: 'WEIGHT', value: ..., accent: ... });
}
```

**Status:** Design choice, not a bug — but worth reviewing with product.

---

#### 5. **Coordinate Calculation in Pill Layout (Line 191)**
**Severity:** Minor
**Location:** Line 191
**Issue:**
```javascript
const pillW = Math.floor((940 - gap * (pills.length - 1)) / pills.length);
```

**Problem:**
- If 1 pill: `pillW = Math.floor(940 / 1) = 940` ✓
- If 4 pills (max): `pillW = Math.floor((940 - 48) / 4) = Math.floor(223) = 223px` ✓
- Layout correct, but `Math.floor` might leave 1–2px gaps due to rounding
- Minor visual artifact (unnoticeable), but could be improved with flex layout

**Recommendation:**
Consider using actual pill widths or dynamic gap adjustment. Current approach is acceptable.

---

## Plan Alignment Check

| Requirement | Status | Notes |
|---|---|---|
| `_resolveHeroes` hero selector | ✅ | Goal-aware with fallback chain, lines 88–119 |
| Canvas 1080×1350 card draw | ✅ | Lines 138–140, correct dimensions |
| 5 zones: header, heroes, pills, body comp, top lifts | ✅ | Lines 155–235, all present |
| Watermark | ✅ | Lines 237–241 |
| Export `window._pcDrawCard` | ✅ | Line 253 |
| Async function | ✅ | Line 123 (async declared, no await needed yet) |
| Type guards for external functions | ✅ | Lines 171, 183, 129 |
| Fallback to localStorage | ✅ | Lines 44, 77 with `_lsGet` |

**Plan adherence:** 100% ✓

---

## Testing Recommendations

1. **Test `_resolveHeroes` with different goals:**
   - fat_loss: Expect heroA=WEIGHT, heroB=BODY FAT
   - muscle_gain: Expect heroA=TOP PR, heroB=MUSCLE
   - default: Expect heroA=WEIGHT, heroB=TOP PR

2. **Test fallback chain:**
   - Call with no data (all nulls) → should return SESSIONS + STREAK
   - Call with partial data → verify correct priority order

3. **Visual regression:**
   - Generate cards with different data states (full, partial, empty)
   - Verify no overlapping text or off-canvas elements
   - Check font rendering on target devices

4. **Font loading timing:**
   - Add pre-load check or document assumption in README

---

## Conclusion

**APPROVED** ✅

The implementation is production-ready with strong fundamentals:
- Robust hero resolution logic with proper error handling
- Clean zone architecture with consistent coordinates
- Proper type guards and defensive programming
- Follows IIFE pattern and codebase conventions

**Recommended actions:**
1. Clarify accent/highlight intent for weight stat (Important #1)
2. Add optional font-loading check given async function (Minor #3)
3. Review pill duplicate logic with product design (Minor #4)

No blocking issues. Code quality is high.

---

**Reviewer Sign-off:** Ready for merge after addressing Important #1 intent clarification.
