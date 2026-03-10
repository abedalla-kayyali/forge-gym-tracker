# FORGE Feature Design: Retention + Results (Beginner-first, Progressive Depth)

Date: 2026-03-09
Status: Approved design
Owner: Product + Engineering

## 1) Goals

Primary goals:
- Increase retention (daily/weekly return, lower drop-off after missed days)
- Improve training outcomes (consistent progressive overload, fewer plateaus)

Target segment:
- Both beginners and intermediates
- Beginner-first experience with progressive reveal of advanced controls

Non-goals (v1):
- Full social feed / chat
- Wearable real-time integrations
- Coach LLM dependency for core workout generation

---

## 2) Product Strategy

Recommended strategy: Core Engine First
- Build a deterministic decision engine for daily plan + plateau rescue
- Layer beginner-simple UI first, then optional intermediate detail views
- Add review/motivation loops (weekly card, next-win milestones)

Why this strategy:
- Delivers both goals together (retention + outcomes)
- Creates durable product moat through structured adaptation logic
- Reduces random/subjective recommendations

---

## 3) Feature Set (MVP to V1)

### A. Adaptive Daily Plan (Hero)

User story:
- "I open FORGE and instantly know what to do today."

Behavior:
- Generates one clear "Today Plan" based on:
  - recent training distribution
  - recovery gaps by muscle
  - goal (muscle/strength/fat loss/recomp/endurance)
  - streak state
  - session duration preference
- Beginner mode:
  - single CTA: Start Today Plan
  - no complex settings exposed by default
- Intermediate mode:
  - expandable rationale (why this muscle/day)
  - optional set/rep/load details

MVP output:
- Primary target muscle(s)
- 3-5 exercises
- set/rep targets
- suggested intensity band (easy/med/hard)


### B. Plateau Rescue Mode

Trigger definition (initial):
- Exercise plateau if all true:
  - >= 3 logged sessions for exercise in last 21 days
  - no increase in top-set weight OR total reps at same weight
  - no meaningful volume trend improvement

Rescue actions (deterministic):
- Week 1: micro deload suggestion (load -10 to -15%)
- Week 2: rep-range pivot (e.g. 6-8 -> 8-12)
- Accessory recommendation (1-2 supporting movements)
- Return path to baseline progression after rescue window

User-facing UX:
- "Plateau detected" badge at exercise level
- One-tap "Run Rescue Plan"
- Optional "skip" with consequence note


### C. Consistency Safety Net

Problem:
- Missed days create guilt loops and churn.

Solution:
- If inactivity threshold reached (e.g. 2+ days), app offers a "Minimum Session" fallback:
  - 15-20 minutes
  - low setup, high confidence completion
  - still earns progression credits and protects streak integrity category

Retention logic:
- Preserve motivation with "momentum" badge instead of hard streak shame
- convert all-or-nothing behavior into "did something" behavior


### D. Progress Milestones + Next Win

Replace abstract stats with immediate goals:
- "+1 session this week to hit target"
- "+2 reps to unlock next exercise tier"
- "Chest balance gap reduced by X%"

Rules:
- Always show one primary next win and one secondary
- Goals adapt daily from plan + history


### E. Smart Recovery Alerts (Actionable)

Instead of generic fatigue warnings:
- provide precise alternatives:
  - swap target muscle
  - reduce top sets by %
  - recovery session template

This preserves habit while reducing overtraining risk.


### F. Weekly Review Card (60 sec)

Auto-generated each week:
- Wins (what improved)
- Risks (what slipped)
- One priority for next week
- Suggested weekly structure (3-5 sessions based on behavior)

Output style:
- concise, visual, confidence-building

---

## 4) UX Principles

- Beginner-first defaults, advanced detail behind "Show Why" / "Advanced" toggles
- One obvious next action per surface
- Avoid punishment language after missed days
- Convert guidance into immediate actions (buttons, not paragraphs)

Core surfaces:
- Home: Today Plan card + Next Win
- Exercise rows: Plateau badge + Rescue CTA
- Missed-day state: Minimum Session card
- End of week: Weekly Review card

---

## 5) Data Model Additions

Storage keys / entities (local-first design):

1. `forge_adaptive_plan`
- date
- plan_type (`normal|minimum|recovery|rescue`)
- target_muscles[]
- exercise_blocks[]
- rationale (short)
- generated_at

2. `forge_plateau_state`
- exercise_name
- plateau_score
- trigger_date
- rescue_status (`none|active|completed|skipped`)
- rescue_week

3. `forge_consistency_state`
- last_active_date
- missed_days
- momentum_state (`on_track|at_risk|recovery`)

4. `forge_next_win`
- primary_goal
- secondary_goal
- target_metric
- current_metric
- ETA_hint

5. `forge_weekly_reviews`
- week_id
- wins[]
- risks[]
- next_priority
- generated_at

---

## 6) Decision Engine (Deterministic v1)

Priority order:
1. Safety/recovery constraints
2. Plateau rescue overrides
3. Consistency safety net trigger
4. Goal-specific adaptive daily plan
5. Next-win target generation

Plan generation sketch:
- Determine day state (`train-ready`, `at-risk`, `recovery-needed`)
- Select muscle block by least-recently-trained + balance weighting
- Apply user goal profile to rep ranges and volume target
- Apply plateau overrides per exercise where active
- Emit plan object + 1-line rationale

---

## 7) Rollout Plan

Phase 1 (Core Engine + basic UI)
- Adaptive Daily Plan
- Plateau detection + basic rescue suggestion
- Minimum Session fallback
- Basic Next Win card

Phase 2 (Outcome loop)
- Weekly Review card
- richer recovery actions
- advanced rationale panel for intermediates

Phase 3 (Optimization)
- A/B tune thresholds
- personalize heuristics by compliance and success rate

---

## 8) Telemetry / Success Metrics

Retention:
- D1/D7/D30 return rates
- % users completing at least 2 sessions/week
- recovery from lapse: users returning within 48h after missed-day prompt

Outcome quality:
- PR frequency per active user
- plateau duration (days from trigger to improvement)
- weekly muscle balance score trend

Behavioral quality:
- Today Plan acceptance rate
- Minimum Session completion rate
- Rescue Plan adoption and completion rates

---

## 9) Risks and Mitigations

Risk: bad recommendations reduce trust
- Mitigation: deterministic rules + "why this recommendation" transparency

Risk: too much complexity for beginners
- Mitigation: progressive disclosure; default single CTA flow

Risk: false plateau triggers
- Mitigation: conservative thresholds and cooldown window

Risk: engagement-only features without outcomes
- Mitigation: tie every motivational surface to a training action

---

## 10) Testing Strategy

Unit tests:
- plateau trigger logic
- plan generation priority order
- consistency safety-net trigger conditions

Integration tests:
- user with no history receives sensible beginner plan
- stalled exercise enters rescue path
- missed days produce minimum session card
- weekly review generation runs once per week

UX acceptance tests:
- beginner can start session in <= 2 taps from Home
- intermediate can inspect rationale without disrupting flow

Regression checks:
- existing logging, XP, and stats flows unaffected

---

## 11) Approach Options Reviewed

Option A: Quick wins first
- Faster delivery, weaker long-term adaptation moat

Option B: Core engine first (selected)
- Slightly slower start, best combined impact on retention + outcomes

Option C: Gamification-first
- Good short-term engagement, weaker results improvement

Decision: Option B selected.

---

## 12) Open Items for Planning

- Exact threshold tuning defaults for plateau and missed-day states
- Which goals need custom weekly templates in v1 vs v2
- Whether rescue plans can auto-adjust logged target weights inline or only suggest

