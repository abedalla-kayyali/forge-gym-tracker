# Dynamic RPG Visual Avatars Design

**Date:** 2026-03-14

**Goal:** Add a profile avatar system that visually evolves from the user's actual training balance, while preserving the existing XP/rank progression as a separate signal.

## Context

The app already has:
- A profile area with a small avatar slot in `index.html`
- An XP and rank system in `js/xp-system.js`
- A muscle balance system rendered from `js/dashboard-balance.js`

The feature should build on those systems instead of replacing them.

## Product Direction

The avatar should feel like a character sheet, not a random mascot. It must reward balanced training in a way users can understand quickly.

The chosen direction is:
- Rank determines the base avatar tier and visual theme
- Muscle balance determines which armor pieces appear and how strong they look

This keeps progression legible:
- XP answers: "How advanced am I overall?"
- Balance answers: "How well-rounded is my training?"

## Rejected Alternatives

### Balance-only avatar

This is simpler, but it wastes the existing rank system and removes a strong layer of identity from the profile.

### Full stat fusion

This would mix rank, readiness, streak, cardio, and other metrics into one output. It is too noisy for the first version and would be harder for users to understand.

## Core Experience

The profile gets a new `Forge Avatar` card near the top of the profile section.

The card contains:
- A layered SVG avatar
- The current rank theme
- A short insight line explaining what changed or what is missing
- Optional tap target for more detail in a later phase

The avatar should look complete even for new users. Missing armor should feel aspirational, not broken.

## Visual Model

The avatar is composed from layered SVG pieces.

### Base layer

Controlled by rank:
- Rookie / early ranks: simple silhouette and iron-like theme
- Mid ranks: refined silhouette and stronger accents
- High ranks: premium theme, richer trim, stronger contrast

### Equipment slots

Controlled by muscle balance:
- `head`: rank-only crest or helm
- `shoulders`: upper back and shoulder balance
- `torso`: chest and core balance
- `arms`: biceps, triceps, forearm balance
- `legs`: quads, hamstrings, glutes, calves balance
- `back`: cape or mantle based on posterior chain quality

### Slot tiers

Each balance-driven slot supports:
- `none`
- `basic`
- `elite`
- `mythic`

The avatar should never become grotesque or distorted. Imbalance is communicated through weaker or absent gear, not malformed anatomy.

## Balance Logic

The system should use relative balance quality, not raw volume.

This prevents high-volume but lopsided users from unlocking everything. It also keeps the feature aligned with the purpose of the balance score.

The balance module should expose a summarized region score object, not require the avatar renderer to inspect the DOM.

Example shape:

```js
{
  chest: 0.72,
  back: 0.81,
  shoulders: 0.68,
  arms: 0.59,
  core: 0.64,
  legs: 0.87,
  posterior: 0.79
}
```

Those scores are then mapped into slot states.

## Avatar State Contract

The avatar system should render from a pure derived object so it is easy to debug and test.

Example:

```js
{
  rankTier: 'rookie',
  theme: 'iron',
  slots: {
    head: 'basic',
    shoulders: 'elite',
    torso: 'basic',
    arms: 'none',
    legs: 'mythic',
    back: 'elite'
  },
  insight: 'Balanced lower body: Titan Greaves equipped'
}
```

## UX Rules

- New users with little data still get a clean base avatar
- Visual rewards must feel earned, not random
- Missing armor should guide behavior without shaming the user
- The insight line should explain the most important unlock or gap
- Arabic support must exist from the first release
- The feature must work on mobile without overflow or unreadable detail

## Phase 1 Scope

- Add one `Forge Avatar` card in profile
- Add a layered SVG avatar renderer
- Support rank-based base theme
- Support five balance-driven gear areas
- Show one short insight line
- Make text translatable

## Phase 2 Candidates

- Tap to open a gear breakdown modal
- Unlock animations
- Shareable avatar card
- Cosmetic variants from streak, readiness, or duels

## Phase 2B Direction

The next approved slice extends the avatar into an interactive and shareable system.

### Interaction layer

The profile avatar card remains the entry point. The gear modal becomes the control center for interaction.

The modal should support:
- Animated slot cards
- Visual emphasis for `elite` and `mythic` gear
- Tap feedback per slot
- Lightweight sound feedback on modal open and slot interaction

The effects must reuse the existing sound and FX systems and respect the user's sound setting.

### Share layer

The gear modal gets a `Share Avatar` action that opens a dedicated share sheet.

The share sheet supports two poster modes:
- `Showcase`: visual-first character card
- `Proof`: avatar plus training-balance evidence

The preview shown in-app must match the generated image exactly.

### Poster rules

- Use the user's real name by default
- Keep the poster legible on mobile
- Use the same avatar renderer/state rather than rebuilding a separate visual system
- Prefer canvas export if that matches the existing share flow best

### Updated Hero Direction

The approved direction is now a hybrid poster:
- Primary hero: forged muscle-map silhouette
- Secondary identity chip: smaller RPG avatar / rank badge

This is stronger than a pure RPG poster because the muscle-map communicates training progress instantly, while the RPG avatar still provides identity and rank flavor.

### Forge Progression Visual System

The forged muscle-map should use material progression per muscle region:
- Level 1: Cold Iron
- Level 2: Heated Bronze
- Level 3: Molten Core
- Level 4: Forge Energy
- Level 5: Radiant Plasma

This should be driven from actual muscle volume or mastery values and not from arbitrary cosmetics.

### Share Poster Composition

The poster should prioritize:
- large forged body silhouette
- real name
- rank
- strongest/weakest callouts
- small RPG identity chip

The forged silhouette is the emotional centerpiece. The RPG chip is supporting context.

### Motion / FX for the forged silhouette

- Tier 3+: glow enabled
- Tier 5: subtle pulse animation in-app
- Neglected regions: dim or flicker after inactivity threshold
- Tier-up events: localized FX burst from the muscle region if possible

### Technical Direction

The forged share visual should not replace the RPG profile avatar.

Instead:
- profile keeps the RPG avatar system
- share system gets a dedicated forged-muscle visual renderer
- both systems can share the same underlying muscle summary data

### New Success Criteria

- Share poster reads instantly as training progress
- Material progression is visually addictive and thematically aligned with FORGE
- The forged silhouette and exported poster match
- RPG avatar remains part of the ecosystem without competing for attention

### Showcase mode

This is the social card:
- Large avatar
- User name
- Rank
- Theme label
- 2-3 highlighted gear pieces
- One strong status line

### Proof mode

This is the credibility card:
- Avatar
- Balance percent
- Strongest region
- Weakest region
- Compact slot tier list
- Date stamp

### Audio / Motion rules

- Modal open: short forge-rise sound
- Slot tap: subtle pulse and highlight
- Newly upgraded gear after a rerender: stronger unlock animation and a milestone-style sound
- Do not loop sound
- Do not add noisy constant animation that fatigues the UI

### Risks

- If share rendering diverges from the on-screen preview, trust will drop immediately
- Too many effects could make the profile feel noisy
- Unlock detection must distinguish between existing state and newly achieved state

### Phase 2B Success Criteria

- Avatar interactions feel alive but controlled
- Users can understand slot status by tapping
- Share poster preview and exported result match
- Both poster modes feel intentional and worth sharing
- Real-name output works cleanly on mobile

## Technical Notes

- Prefer a dedicated module such as `js/profile-avatar.js`
- Keep rendering separate from score calculation
- Pull rank from existing XP logic instead of duplicating thresholds
- Pull balance from a new exported summary helper in `js/dashboard-balance.js`
- Re-render avatar when profile or dashboard data updates

## Risks

- If the balance system only exposes DOM-rendered output, the avatar logic will be brittle
- Overly detailed SVG art could become hard to maintain
- If thresholds are too strict, users may feel unrewarded
- If thresholds are too loose, the system loses meaning

## Success Criteria

- Users can understand why the avatar changed
- Balanced training visibly improves the avatar
- Rank and balance remain distinct and non-conflicting
- The card renders cleanly in English and Arabic
- The feature feels like a native extension of the current profile experience
