# Social Body Map Revamp Design

## Goal

Revamp the Social `Compare > Body` experience so the body map feels premium, competitive, and modern instead of flat and outdated.

The new direction is:
- forged sci-fi anatomy board
- dual rivalry presentation
- clearer information hierarchy
- stronger inspect experience

This is a presentation-layer redesign. The compare data model already exists and should be reused.

## Product Direction

The compare body map should no longer read like a generic SVG chart.

It should feel like:
- a forged anatomy board
- a rivalry instrument
- a premium social comparison surface

The compare screen already has the right data:
- per-muscle max load
- session count
- recency

The problem is visual language.

## New Compare > Body Structure

### 1. Rivalry Header

At the top of the body compare view:
- short rivalry title
- strongest contested muscle
- one action-focused coaching line

Example:
- `Rivalry Heat`
- `Most contested: Chest`
- `Rival leads load. You lead consistency.`

### 2. Dual Anatomy Boards

Replace the old mini flat maps with larger anatomy cards:
- `You`
- `Rival`

Each board uses:
- metallic frame
- dark forged panel
- stylized muscle plates
- glow and edge highlights

### 3. Muscle Spotlight Rail

Below the boards:
- strongest lead
- weakest lane
- heaviest plate
- most recent plate

This gives users something useful immediately without making them inspect every muscle.

### 4. Better Inspect Sheet

Keep tap-to-inspect, but improve the sheet visual hierarchy:
- rivalry badge
- bigger numbers
- cleaner stat blocks
- short coaching line

## Visual Language

### Base Style

- forged steel chassis
- sci-fi panel framing
- neon green / blue rivalry energy
- soft ambient glow
- crisp typography and chips

### Muscle Rendering

Replace primitive rectangles with stylized anatomy plates:
- chest plates
- shoulder pods
- arm lanes
- core panel
- glute / leg columns
- calf plates

Still use SVG so zones remain clickable and lightweight.

### Muscle State Model

Each muscle can appear in one of these states:
- `cold`
- `active`
- `heavy`
- `dominant`
- `selected`

Suggested meaning:
- `cold`: low recent training
- `active`: normal training presence
- `heavy`: strong max-load profile
- `dominant`: strongest lane on that board
- `selected`: current inspected muscle

## Metric Encoding

The body map should compare three signals per muscle:
- load
- frequency
- recency

Recommended encoding:
- fill intensity = frequency
- edge glow = max load
- recency chip = last-trained timing

This avoids overloading one color system.

## Interaction

### Tap Muscle

Open the existing compare detail modal, but restyle content to show:
- muscle name
- `You` block
- `Rival` block
- lead badge
- catch-up or defense tip

### Spotlight Chips

Tapping a spotlight chip can jump focus to that muscle and open its detail sheet.

## Scope

Included in this pass:
- body compare visual redesign
- new SVG anatomy board
- rivalry header
- spotlight chips
- inspect sheet styling upgrade

Not included:
- backend changes
- new compare metrics
- avatar integration
- audio additions

## Verification

Required proof:
- compare body view still renders for a selected friend
- muscle zones remain clickable
- inspect modal still opens
- no regressions in cardio/bodyweight compare
- mobile layout remains readable
