# First-Run Journey Simplification Design

## Summary
Remove the first-run onboarding and legacy guide/tour from the startup journey. After login/signup, users should enter the app directly. Missing profile setup such as name and goal should be handled through lightweight, non-blocking prompts inside normal app surfaces.

## Goals
- Eliminate outdated onboarding friction now that the UI has been redesigned.
- Remove startup overlays that no longer match the product structure.
- Preserve personalization by collecting missing data progressively instead of blocking entry.
- Keep existing users unaffected.

## Non-Goals
- No new onboarding system.
- No new walkthrough or tutorial redesign.
- No forced setup gate after login.

## Current State
The app currently includes:
- A lightweight onboarding overlay that collects name and goal.
- A legacy hidden tour/guide block and spotlight structures still present in the codebase.
- Supporting translation/icon code that still references tour-related UI.

This creates unnecessary startup complexity and outdated UI baggage.

## Approved Direction
### User Journey
- After login/signup, users enter the app immediately.
- No onboarding modal.
- No guide/tour modal.
- No spotlight intro.

### Setup Strategy
- If profile name or goal is missing, show a compact setup prompt in Profile.
- If Coach needs goal-specific context and goal is missing, show a small inline goal prompt there too.
- These prompts must be non-blocking and dismissible.

## UX Design
### Profile
Add a compact "Complete your setup" card that appears only when required profile fields are missing.

The card should:
- Explain what is missing.
- Let the user add/update name and goal quickly.
- Save directly to the existing profile/settings flow.
- Disappear once data is complete.

### Coach
If goal-dependent recommendations are rendered and no goal exists, show a lightweight inline prompt to set a goal. This should link the user toward the relevant setup action instead of blocking Coach entirely.

## Technical Design
### Remove Startup Entry Points
Disable/remove:
- onboarding auto-open logic
- guide/tour auto-open logic
- spotlight startup behavior tied to first visit

Exact hooks confirmed in the current code:
- `index.html` calls `_onboardingCheck()` in the new-user auth path.
- `index.html` calls `_onboardingCheck()` in the returning-user auth path when `userProfile.setupDone` is false.
- `index.html` calls `_onboardingCheck()` in offline mode startup.
- `index.html` calls `_onboardingCheck()` for guest-mode startup.
- `index.html` function `_onbComplete()` launches `_splShow()` when legacy first-run keys are absent.
- `js/onboarding-controls.js` is still loaded globally even though first-run setup should no longer block entry.

### Keep App Safe Without Setup Data
Anywhere code reads name/goal for display or coaching, ensure safe fallbacks exist so a missing value does not break rendering.

### Legacy Compatibility
If any old helpers still reference removed guide/onboarding functions, leave safe guards or no-op wrappers until cleanup is fully complete. Do not leave broken references.

## Risks
- Startup code may still assume profile fields are populated.
- Translation/icon repair logic may still touch removed guide markup.
- Existing users should not see any behavior regression.

## Verification
Verify these journeys manually and with existing smoke checks where possible:
1. New user with empty profile enters app with no startup modal.
2. Existing user still enters app normally.
3. Profile shows setup prompt only when needed.
4. Coach handles missing goal gracefully.
5. Saving setup data removes the prompt.
6. No console/runtime errors from removed guide/onboarding hooks.
