# Social Tab Design

**Date:** 2026-03-14

## Goal
Turn the current friend/duel modal flow into a first-class social feature that is easier to discover, more fun to use, and more rewarding to return to.

## Product Direction
The feature moves out of `Coach` and becomes its own bottom-navigation destination: `Social`.

`Social` is designed around one competitive loop:
1. Add friends
2. Compare progress
3. Start or accept duels
4. Receive in-app notifications and feedback
5. Return to defend progress or win

The experience should feel game-like and mobile-first, but not noisy or confusing.

## Information Architecture
Create a dedicated `Social` tab with four sub-surfaces:
- `Hub`
  - active duel summary
  - invite rail
  - friend count / quick stats
  - quick actions
- `Friends`
  - search by name/email
  - QR/code add flow
  - remove friend
  - friend cards with identity and activity hints
- `Compare`
  - side-by-side stats against a selected friend
  - workouts, cardio, streak, readiness, balance, volume, PR-related indicators where available
- `Duels`
  - create duel
  - active duel detail
  - duel history

`Coach` should no longer host the full social experience. At most it can keep a lightweight awareness card or social insight.

## UX Model
The current large modal is not the primary UX anymore. The primary entry is the `Social` tab screen.

Use cards and segmented controls/tabs inside the `Social` screen. Use sheets/modals only for focused tasks:
- add friend
- QR share/scan
- create duel
- inspect comparison details

Main visual hierarchy:
- top hero strip showing social momentum
- invites section
- active duel section
- friends/compare content below
- persistent epic CTA row for add/share/scan/start

The design should be competitive and energetic, but it must remain readable on mobile.

## Gamification
The feature should add energy through feedback, comparison, and progression.

Planned game elements:
- active duel split bars
- momentum messaging: ahead / behind / tied
- countdown / days left
- friend cards with rank, streak, last active, strongest area
- compare cards highlighting who leads each metric
- duel type selection:
  - workouts
  - cardio
  - muscle-specific
  - weekly volume later if current data supports it cleanly

Framing matters:
- stronger user gets “you lead” feedback
- trailing user gets “catch up” guidance instead of punitive messaging

## Sound, Haptics, Notifications
Phase 1 uses in-app notifications only. No OS push in this phase.

Feedback plan:
- tab open: subtle pulse/tap
- invite received: distinct ping + optional haptic
- duel accepted: success cue
- score update: small toast + subtle pulse
- duel won: bigger celebration cue

All sound/haptic behavior must respect existing sound/haptic settings.

## Data Model
Use current Supabase-backed social data instead of rewriting backend shape.

Primary sources:
- `profiles_public`
  - friend search
  - comparison snapshot data
  - identity metadata
- `forge_duels` / `duels`
  - invites
  - active duel
  - duel history
- local duel state cache
  - optimistic UI
  - local friend list cache

Recommended public profile fields for comparison rendering:
- `rank`
- `xp`
- `streak`
- `readiness`
- `balanceScore`
- `lastActiveAt`
- `strongestArea`

These should be published as lightweight public snapshot data, not deep per-workout history.

## Behavior Rules
When user opens `Social`:
- refresh public profile directory
- refresh duel state/inbox
- render active duel and invites
- load compare cards for current friends

When user logs a workout/cardio/bodyweight session:
- republish public social snapshot
- resync active duel score
- trigger social toasts if duel state changed

When backend social tables are missing or unavailable:
- degrade to friend code / QR where possible
- never block the rest of the app

## Recommended Implementation Strategy
Use an incremental rebuild on top of the current duel system.

Why:
- backend risk is lower
- we already verified the repaired friend flow end to end
- current tables and publish logic are sufficient for phase 1
- it avoids a large migration before UX value is delivered

## Out of Scope for Phase 1
- OS push notifications
- chat / messaging
- reactions/comments
- global leaderboards
- deep avatar social feed
- large backend schema redesign

## Success Criteria
The feature is successful if:
1. users can find and add friends quickly
2. compare view is understandable on first use
3. duels feel visible and rewarding
4. in-app notifications and FX make the feature feel alive without becoming annoying
5. mobile UX is clearly better than the current modal-based flow
