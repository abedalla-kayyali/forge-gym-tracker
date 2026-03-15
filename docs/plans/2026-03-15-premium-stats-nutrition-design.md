# Premium Stats Nutrition Redesign

## Goal
Turn `Stats -> Nutrition` into a premium food-control console with stronger hierarchy, better macro visibility, and a clearer distinction between today's fueling status and longer-term habit performance.

## Context
The current nutrition stats surface already exposes meaningful data: today's macro adherence, macro focus ring, habit tracker, custom targets, and deeper insights. The weakness is presentation. Too many surfaces feel equivalent, and the page reads like stacked utility cards instead of a single command center.

## Recommended Direction
Use a `premium food-control console` visual system:
- Hero-led layout with a dominant nutrition score and verdict
- Strong macro command row for protein, calories, carbs, fats
- Secondary habit/adherence boards below the hero
- Deep analysis and consistency insights framed as strategic panels

This keeps existing interactions and calculations intact while making the page more premium and easier to scan.

## Information Architecture

### 1. Hero Control Card
Top card should answer:
- How good is today's fueling?
- What is the main issue right now?
- What is the next corrective action?

It should include:
- nutrition score / adherence hero
- one verdict line
- one supporting action line
- compact live badge

### 2. Macro Command Row
The macro layer should become the first detailed scan surface.
Each metric block should show:
- current value
- target
- progress status
- tone/state

Metrics:
- protein
- calories
- carbs
- fats

### 3. Habit And Adherence Layer
The habit tracker and 7d/30d performance should sit below the macro layer.
This zone should emphasize:
- streak
- perfect days
- logged days
- adherence direction

### 4. Deep Insight Layer
This zone remains data-rich but becomes cleaner and more strategic:
- strongest behavior
- biggest gap
- next action
- logging consistency
- meal timing / repeated meals / recovery fueling

## Visual Direction
- dark forged-glass chassis
- premium cyan/green nutrition accents
- large-number typography with sharper contrast
- fewer repetitive borders
- stronger vertical rhythm
- mobile-first spacing

Tone should feel like an athlete nutrition desk, not a generic dashboard.

## Data And Logic
No backend changes are required.
Keep current data and behavior intact:
- current nutrition score and macro adherence math
- target calculations
- habit tracker day map
- quick insights and deep insight cards
- target save flow

The redesign is presentation-first.

## Risks
- The nutrition screen already contains a lot of content; visual upgrades must not make it denser.
- Mobile spacing is the main risk because the page includes hero, tiles, tracker, target editing, and insights.
- Existing interactions such as target saving and day tapping must remain untouched.

## Verification
- `Stats -> Nutrition` renders without losing current controls
- hero card is present and readable on mobile
- macro row still reflects live values
- habit tracker still responds to day tap
- custom target controls still save correctly
- smoke and static verification still pass
