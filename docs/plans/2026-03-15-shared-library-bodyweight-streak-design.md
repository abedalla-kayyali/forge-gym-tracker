# Shared Exercise Library And Bodyweight Streak Design

**Date:** 2026-03-15

## Goal

Fix three related product problems:
- weighted workout browsing feels incomplete because the built-in exercise library is missing common gym movements
- when a workout or meal is not found, users should be able to add it once and have it become available to all users immediately
- bodyweight logging needs a more motivating in-session streak loop similar to the weighted session energy feel

## Problem Summary

The current weighted exercise picker is driven primarily by the static `EXERCISE_DB` in `js/exercises.js`. That makes coverage dependent on the shipped array and causes gaps in real gym usage. The app also has separate local custom-item patterns in some places, which saves time for one user but does not help the rest of the community.

Bodyweight already exposes a basic per-exercise day streak in `js/bodyweight-mode.js`, but it is not the same motivational loop as the weighted workout experience. It does not escalate excitement during a live session and does not reward adding more sets in a way that is immediately felt.

## Product Direction

### 1. Shared Community Library For Missing Items

When a weighted exercise or meal is missing, the user should be able to add it directly from the miss state. The item should be written to a shared Supabase-backed library and become available to all users immediately.

This is intentionally immediate. There is no moderation queue in phase 1. The tradeoff is a higher risk of low-quality naming, which will be handled by duplicate normalization on create.

### 2. Better Weighted Exercise Coverage Out Of The Box

Before leaning on user-generated additions, the shipped exercise library should be expanded so common body parts and machine/cable variants are better covered. This reduces friction for new users and lowers pressure on the community-add path.

### 3. Bodyweight In-Session Set Streak Loop

Bodyweight logging should gain a live streak mechanic based on consecutive set entries for the current bodyweight exercise. This should be session-scoped first, with escalating sound and visible milestone feedback. The goal is to make bodyweight logging feel active and rewarding without inflating long-term analytics yet.

## Recommended Architecture

### Weighted Exercises

Use a merged catalog model:
- built-in `EXERCISE_DB` remains the base library
- shared community exercises are fetched from Supabase on boot or when the picker opens
- UI search and browse operate on the merged list

If the search misses:
- show `Workout not found? Add it`
- capture exercise name, target muscle, equipment, optional tip
- normalize and upsert into the shared catalog
- refresh the picker immediately

### Meals

Use the same shared-catalog pattern for meals:
- built-in/local meal library remains valid
- shared community meals are fetched and merged
- if not found, show `Add meal`
- store normalized meal name plus optional calories/macros/category

### Bodyweight

Keep the existing bodyweight tree structure and picker logic. Add a separate session-level streak state:
- current set streak for selected exercise
- best session streak for selected exercise
- milestone feedback on 3, 5, 8+ sets
- sound escalation that respects existing sound settings

## Data Model

### Shared Exercises

Recommended Supabase table:
- `community_exercises`

Suggested columns:
- `id uuid primary key`
- `name text not null`
- `name_key text not null unique`
- `muscle text not null`
- `equipment text not null default 'other'`
- `tip text not null default ''`
- `created_by uuid`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

`name_key` should be generated from a normalized version of the name. The first version only needs trimmed lowercase normalization and punctuation collapse.

### Shared Meals

Recommended Supabase table:
- `community_meals`

Suggested columns:
- `id uuid primary key`
- `name text not null`
- `name_key text not null unique`
- `category text not null default ''`
- `calories numeric not null default 0`
- `protein numeric not null default 0`
- `carbs numeric not null default 0`
- `fat numeric not null default 0`
- `created_by uuid`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

## UX

### Weighted Miss State

When no exercise matches:
- keep the search result area visible
- show a clear add CTA
- after creation, auto-select the new exercise

### Meal Miss State

When no meal matches:
- show add CTA inline with search flow
- after creation, auto-populate the meal selection and keep logging momentum

### Bodyweight Streak UI

Add a compact live strip in the bodyweight logging area:
- `Set Streak`
- `Best Run`
- milestone chip when threshold hit

Behavior:
- streak increments when a set is added for the same active exercise in the current bodyweight session
- streak resets when exercise changes or the bodyweight set list is cleared
- sound escalates lightly at milestone points only

## Risks

### Duplicate Global Content

Immediate global publishing can create naming duplicates. Mitigation:
- normalize `name_key`
- upsert on normalized key
- reuse existing row if duplicate key already exists

### Backend Availability

If shared tables do not exist or RLS blocks them, the UI must fail gracefully:
- show local add unavailable message
- do not break existing search

### Bodyweight Noise

Too many sounds can become annoying. Mitigation:
- milestone-only escalation
- respect sound/haptic settings

## Verification Strategy

1. Weighted exercise browse shows expanded coverage
2. Missing weighted exercise can be added and becomes immediately selectable
3. Missing meal can be added and becomes immediately selectable
4. Shared items are visible from another account after refresh
5. Bodyweight streak increments with consecutive set adds
6. Bodyweight streak resets correctly on exercise change
7. Sound feedback triggers only at intended milestones
