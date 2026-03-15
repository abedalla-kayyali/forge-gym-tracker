# Readiness Dashboard Revamp Design

## Goal

Upgrade the `Progress -> Readiness Breakdown` surface into a more premium, useful dashboard with deeper decomposition and clearer coaching guidance.

## Problem

The current readiness surface is too shallow:

1. it only exposes three factors
2. the hierarchy feels like a debug card instead of a premium performance surface
3. the detail area explains one factor at a time but does not give enough context or action
4. the mobile presentation wastes the value of readiness as a core daily decision metric

## Outcome

The user should be able to:

- understand current readiness at a glance
- see which factors are helping or hurting today
- inspect deeper factor details without leaving the page
- get short coaching guidance on what to do next

## Scope

In scope:

- redesign the readiness panel into a mini dashboard
- add real derived metrics using existing unified state
- add contribution and insight layers
- preserve current tabs and period filters
- keep the experience mobile-first

Out of scope:

- new backend schema
- true physiological or wearable metrics the app does not track
- a dedicated full-screen readiness page

## Information Architecture

The readiness module becomes four layers:

1. Hero score
- large readiness gauge
- state label
- short message
- one short trend chip versus recent baseline

2. Decomposition tiles
- compact tiles for:
  - Check-in Quality
  - Freshness
  - Load Pressure
  - Consistency
  - Cardio Support
  - Momentum

3. Contribution bars
- visual gain and drain bars showing how each factor contributes to the score

4. Coach insight rail
- two or three concise recommendations based on the weakest or strongest factors

## Metrics

Only use real app signals or safe derivations.

### Check-in Quality
- sleep, energy, mood based score

### Freshness
- recovery timing and freshness score

### Load Pressure
- recent weighted volume plus cardio load

### Consistency
- active training days across 7d and 28d

### Cardio Support
- recent cardio trend and volume support

### Momentum
- recent trend versus prior period using available weighted and cardio trends

## Interaction

- tapping a tile updates the detail panel
- the detail panel shows:
  - current value
  - status label
  - what it means
  - why it is high or low
  - what to do next

## Visual Direction

- darker frosted dashboard chassis
- larger hero gauge
- premium decomposition tiles with big values and small labels
- gain/drain contribution styling
- subtle trend and state chips
- cleaner spacing and stronger contrast on mobile

## Mobile Behavior

- hero stacks vertically when needed
- tile grid becomes two columns
- contribution bars remain readable
- detail panel stays below the tiles with no horizontal overflow
