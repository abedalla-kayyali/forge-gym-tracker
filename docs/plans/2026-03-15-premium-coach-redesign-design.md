# Premium Coach Redesign Design

## Goal

Upgrade the Coach screen into a premium performance console with clearer hierarchy, stronger daily decision support, and a more polished visual system.

## Problem

The current Coach surface has weak visual hierarchy:

1. the main score is too small
2. signal bars feel like a debug panel
3. prompt chips compete with the main action
4. weighted/bodyweight/cardio choices feel like plain buttons instead of guided commands

## Outcome

The user should be able to open Coach and immediately understand:

- what today’s training verdict is
- whether to push or recover
- what the strongest and weakest signals are
- which training path is the best next move

## Scope

In scope:

- rebuild Coach hero hierarchy
- upgrade score and signal presentation
- redesign action lanes
- improve daily brief structure
- keep current tabs and logic intact

Out of scope:

- backend changes
- replacing Coach state logic
- chat-based coach redesign

## Information Architecture

The Coach screen becomes four layers:

1. Hero command deck
- coach identity
- main score cluster
- readiness badge
- daily verdict
- short trend chip

2. Decision strip
- one primary recommendation
- two secondary paths
- clearer emphasis on today’s best move

3. Signal boards
- premium metric tiles or tracks for:
  - balance
  - consistency
  - volume
  - streak
  - readiness
  - recovery pressure

4. Deeper prompts
- move question chips lower
- style them as prompt shortcuts, not the main interaction surface

## Visual Direction

- forged-glass chassis
- stronger score cluster
- refined tabs
- premium track styling for signals
- larger and more intentional action cards
- concise performance-oriented copy

## Mobile Behavior

- hero stacks vertically
- primary action remains above the fold
- secondary actions stay readable and tappable
- prompt chips wrap cleanly
