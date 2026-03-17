# Ask FORGE Enhancements Implementation Plan

> **Status: COMPLETE as of v216 (2026-03-17)**

**Goal:** Add 7 enhancements to Ask FORGE: follow-up chips, auto re-index, personalized suggestions, workout-recommendation context, voice input, pin/save answers, and weekly report card.

**Architecture:** All UI/logic in `js/rag-search.js` (vanilla JS IIFE). Backend system prompt enriched via `buildUserContext()` → `user_context` field. No test framework — verified manually in browser.

**Tech Stack:** Vanilla JS IIFE, Web Speech API, Supabase Edge Functions (Deno), localStorage, CSS custom properties from FORGE design system.

---

## Completion Summary

| Task | Feature | Version | Status |
|---|---|---|---|
| 1 | Follow-up chips after answer (`renderFollowUpChips`) | v209 | ✅ Done |
| 2 | Auto silent re-index on init (>3 days stale) | v209 | ✅ Done |
| 3 | Personalized suggestion chips from real data (`buildPersonalizedChips`) | v209 | ✅ Done |
| 4 | Today's training plan + muscle recovery in `buildUserContext()` | v209 | ✅ Done |
| 5 | Voice input via Web Speech API (`setupVoiceInput`) | v209 | ✅ Done |
| 6 | Pin/save answers + saved view via ★ header button | v209 | ✅ Done |
| 7 | Weekly FORGE Report card (`checkWeeklyReport` / `showWeeklyReport`) | v209 | ✅ Done |

---

## What Was Built

### Follow-up chips
- `renderFollowUpChips(query)` called at end of `handleSearch()` after answer renders
- Keyword-matches query to pick 3 relevant follow-up questions
- Chips auto-fill input and fire new search on click

### Auto re-index
- In `init()`, checks `forge_rag_last_ingest` timestamp
- If >3 days old or never set, runs `runFullIngest()` silently after 6s delay
- No UI change — purely background

### Personalized chips
- `buildPersonalizedChips(contextKey)` replaces static `ctx.suggestions` in `renderSuggestions()`
- Reads `forge_workouts` → finds most neglected muscle, most recent PR exercise
- Reads `forge_meals` → checks if today's protein is low
- Falls back to static PAGE_CONTEXT suggestions if no data

### Workout recommendation context
- Added to end of `buildUserContext()`:
  - Today's day key (sun-sat) looked up in `forge_split` → "Today's planned training (mon): Chest + Triceps"
  - All muscles from `forge_workouts` mapped to days since last trained → "Muscle recovery status: chest: 2 days rest, back: 1 day rest, ..."

### Voice input
- `setupVoiceInput()` wired into `init()`
- Mic button added to modal input row (between input and search button)
- Pulse animation while listening (`rag-mic-active` class)
- Hidden automatically if browser doesn't support Web Speech API
- On result: fills input + calls `handleSearch()`

### Save answers
- "Save" button appended to every answer card after markdown render
- Saves `{id, question, answer, date}` to `forge_saved_answers` (max 50, newest first)
- ★ star icon in modal header calls `renderSaved()` — shows all saved with Remove button
- Remove updates localStorage and removes card from DOM

### Weekly report card
- `checkWeeklyReport()` called in `openModal()`, throttled via `forge_last_weekly_report` (once per 6 days)
- Computes: sessions this week vs last week (↑↓=), PRs, avg kcal, avg protein, weight delta
- Only shows if user has workouts in the last 7 days
- "Ask FORGE for weekly advice →" chip auto-fires contextual search

---

## Post-v209 Fixes & Additions

| Version | Change |
|---|---|
| v210 | Premium UI overhaul — deeper gradients, answer card glow, sources collapsible |
| v213 | FAB moved to bottom-left; weekly report calendar-week throttle (Mon–Sun), fixed lock-out bug |
| v214 | Mobile keyboard fix v1 (visualViewport only — incomplete) |
| v215 | Mobile keyboard fix v2 — `window.resize` + `visualViewport` + `bottom:auto` to override `inset:0` |
| v216 | Premium FX: Web Audio sounds (open/send/done/save), particle burst, FAB halo pulse, sparkle orbit, animated input border, answer flash, sheet breathing, chip stagger, badge shimmer |

## Possible Future Enhancements

- Export conversation as PDF / copy to clipboard
- Proactive push notification (Sunday summary)
- Smarter follow-up chips using Claude to generate them
- Saved answers search / filter
- Notification badge on FAB when weekly report is ready
