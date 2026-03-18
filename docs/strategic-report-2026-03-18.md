# FORGE Gym Tracker — Product Strategy Report
**Prepared by**: Alex (PM Agent)
**Date**: 2026-03-18
**Version**: 1.0
**Status**: For Review

---

## 1. Core Value Proposition

FORGE's differentiator is the combination of three things that no mainstream gym app (Strong, Hevy, FitBod) does simultaneously:

1. **An AI coach that knows your actual history** — The RAG pipeline (forge-ingest + forge-search) embeds every workout, meal, body composition entry, and cardio session into a vector store, then retrieves semantically relevant context before generating coaching output. This is not generic advice. When FORGE says "your chest volume is approaching MRV," it computed that from your logged sets this week.

2. **Science-backed autoregulation built into the logging flow** — Adaptive rest timer (`computeAdaptiveRest()`) varies rest by compound vs. isolation and by RIR. The MRV-aware recovery heatmap (`recovery-plate.js`, `DEFAULT_MRV` per muscle) renders readiness visually on the body map with a readiness multiplier that extends recovery windows when sleep is under 50% score. Ghost Mode shows live delta vs. previous session per set row. These are not dashboard features — they are woven into the active workout flow.

3. **Cross-domain data synthesis** — `goal-dashboard.js` pulls workouts, meals, body weight, cardio, steps, InBody, measurements, and check-ins into a single goal-aligned KPI view. Harris-Benedict TDEE auto-upgrades to InBody BMR when a recent scan exists. No consumer app connects all these data streams to a single "Am I on track?" answer.

**Hero feature**: Ask FORGE AI Coach (`rag-search.js`, `FORGE_ASK.openWithQuery()`). It is the only feature that makes all other data feel purposeful. It is the answer to "what do I do with all this tracking?"

**The honest risk**: Everything above runs on localStorage. If a user clears storage or switches devices, their entire training history — and the AI's ability to personalize — disappears. This is the single biggest structural threat to the value proposition.

---

## 2. User Personas

Based on the feature set, three personas are clearly being served. Only one is being served well today.

### Persona A — "The Committed Self-Optimizer" (primary, best served)
Mid-20s to mid-30s. Trains 4-5x/week. Tracks macros. Has done InBody scans. Knows what RPE means. Uses ghost mode to chase PRs. Will engage with the LLM coach. Will read the deload recommendation. **This is the persona FORGE is built for.** The MRV heatmap, adaptive rest, macro steering, and RAG coach are all calibrated for this user.

### Persona B — "The Motivated Beginner" (partially served, high churn risk)
Has the Quick Start button (`sh-quick-start`, "Full Body Beginner — Push-up, Squat, Plank") and the FORGE BUDDY mascot. But once the beginner completes a few sessions, there is no scaffolded progression path — no "you've done this 5 times, here's the next level." The AI Program Generator (v232) helps if the user knows to use it, but there is no proactive nudge from beginner to structured program. **Risk: graduates out of quick-start, hits blank-slate complexity, churns.**

### Persona C — "The Body Recomposition Tracker" (data-rich, engagement-thin)
Uses macro steering (`_detectWeightStall()`, `renderMacroSteeringCard()`), body weight log, InBody, progress photo comparison (v234), and measurements. Has the richest data in the app. But the feedback loop is too slow — body recomp moves over weeks, not days. **Retention risk: goes days without a meaningful insight, loses habit.** Needs a weekly narrative that connects all the data streams.

---

## 3. Engagement Mechanics

### What Is Working

| Mechanic | Location | Assessment |
|----------|----------|------------|
| XP bar + level badge | `index.html` header | Always-visible, progress is tangible. "ROOKIE" level name with medal icon creates clear status hierarchy. |
| Streak pill | `hdr-streak-pill` | Persistent and visible. Classic retention hook. |
| PR Celebration Overlay | `showPRCelebration()`, `workout-save.js` | Trophy animation + auto-dismiss 4s is a strong dopamine moment. Tied to a real performance event, not a fake achievement. |
| Mission Banner | `mission-banner`, Today's Mission | Daily task list with a progress bar creates a reason to open the app before the gym. |
| Ghost Mode delta | `ghost-autocomplete.js`, `ghost-beaten` badge | Real-time competitive feedback against yourself. Highly motivating mid-set. |
| FORGE BUDDY mascot | `mascot-strip`, `mascot-line` | "Every legend starts somewhere." — gives the app a personality. Underutilized. |
| Deload Engine | `deload-engine.js`, fatigue index 0-100 | Smart, science-backed intervention. Creates a meaningful moment when it fires. |

### What Is Broken or Weak

| Mechanic | Problem |
|----------|---------|
| XP system — level progression | No evidence of level-up ceremony, tiered rewards, or level-gated features. XP fills a bar but the consequence of leveling up is unclear. Gamification without consequence is decoration. |
| Streaks — no streak protection | A user who misses one day loses their streak entirely. No streak freeze, no "rest day counts," no grace period. This turns a motivator into a punisher and drives churn on missed days. |
| Achievements | No achievement system visible in the codebase. The XP framework implies one should exist, but there are no badges for milestones like "First PR," "10 sessions," "30-day streak," "100kg bench." |
| Social | No social features whatsoever. No friend feed, no challenge system, no leaderboard, no share-to-Instagram. The Weekly Review Card (v231) and Progress Proof Card (v224) exist but have no native share path. |
| FORGE BUDDY | Fires a static line ("Every legend starts somewhere") that does not change based on context. A mascot that says the same thing every day is ignored within a week. |
| Water tracking | Exists (hdr-water-pill, +/- buttons) but has no goal-completion celebration, no streak, no connection to performance metrics. It is tracking for tracking's sake. |

---

## 4. Retention Drivers

### What Would Drive Daily Opens Today
1. **Streak + Mission Banner** — if missions are well-designed (not trivially completable), the streak + mission combo is the strongest daily habit anchor.
2. **LLM Morning Brief** — `FORGE_COACH.checkDailyReadiness()` fires on Today tab open and streams a 1-line brief. This is the highest-potential daily re-engagement feature in the app. It is date-scoped and cached in sessionStorage. Problem: users have to navigate to the Coach tab to trigger it. It should push, not wait.
3. **Active Program** — `forge_ai_program` in localStorage + `program-panel.js`. A user with an active AI-generated program has a reason to open FORGE every day: "What am I training today?" This is the strongest structural retention driver.

### What Is Missing for Daily Retention
- **Push notifications** — explicitly listed as backlog. This is not a nice-to-have. Without push, the app relies entirely on the user's own habit. The morning brief has zero value if the user never opens the app to see it.
- **A reason to open on rest days** — currently, rest days have no engagement hook. No recovery summary, no "today's nutrition goal," no mobility suggestion. A user who trains 4x/week has 3 days with no pull.
- **Personalized weekly narrative** — the Weekly Review Card (v231) is a step in the right direction, but it's passive. The user has to navigate to it. A proactive "Your Week in Review" that surfaces on Sunday with wins, volume trends, and next-week recommendation would create a reliable weekly re-engagement moment.

---

## 5. Viral / Word-of-Mouth Potential

### Current Shareable Assets
- **Progress Proof Card (v224)** — exists but requires the user to navigate to it and manually share. No native share sheet integration, no social caption generation.
- **Progress Photo Comparison (v234)** — side-by-side slider with body composition delta. This is genuinely shareable if the share flow takes 2 taps.
- **Weekly Review Card (v231)** — KPI grid with wins and top lift. Shareable format.

### What Is Missing
- **"Generate share card" button** on the PR Celebration Overlay. When a user hits a PR, give them a share card at peak emotional high. This is the single highest-conversion share moment in the entire app. It is currently a 4-second animation that disappears. That is a missed word-of-mouth opportunity on every PR.
- **AI Program share** — "I just generated a custom push/pull/legs program with FORGE AI" is inherently shareable. An "Export Program" or "Share Split" feature on the AI Program Generator would generate organic curiosity.
- **Challenge system** — "Beat my bench press" or "30-day streak challenge" links that friends can join. Nothing in the codebase suggests this exists.

### Viral Coefficient Assessment
Currently near zero. The app has no in-built sharing mechanics that reach non-users. Every share requires the user to manually screenshot and caption. Fixing the PR share card alone would meaningfully move this metric.

---

## 6. Feature Gaps — Premium Tier Candidates

These are features users would pay for (or that justify a subscription) that are currently absent:

| Gap | User Pain | Effort | Revenue Signal |
|-----|-----------|--------|---------------|
| Cloud sync / multi-device | localStorage means data loss on device switch or browser clear. For a committed self-optimizer who trains 200+ sessions, this is catastrophic. | High (Supabase already exists — schema + sync layer needed) | High — this is a table-stakes paywall feature |
| Push notifications | No re-engagement without app open. Morning brief, streak reminders, recovery alerts all require push. | Medium (service worker + Web Push API) | High — directly drives DAU |
| AI Coach chat export | Listed in backlog. A user who has had a meaningful coaching conversation wants to save it. | Low | Medium |
| Periodization planning | AI Program Generator creates a single training block, but no progressive overload schedule across weeks/months. "Where should my weights be in 8 weeks?" is unanswered. | High | High |
| Nutrition database / barcode scan | Meals are logged manually with free-text macros. No food search, no barcode. Meal logging friction is the top reason nutrition tracking fails. | High (third-party API integration) | High — nutrition tracking is a major paid tier differentiator |
| Coach conversation history | Ask FORGE chat has no persistent history beyond the session. Every conversation starts cold. | Medium (Supabase table) | Medium |
| Wearable integration | No Apple Watch, Garmin, Whoop, or Apple Health sync. Steps are manual (+1K/+5K buttons). Sleep is auto-detected only from manual log, not wearable. | High | High |
| Streak freeze / rest day logic | Streak punishes rest days. Users who follow evidence-based programming (4x/week) are penalized. | Low | High retention impact |

---

## 7. Notification Strategy

The app has no push notification system. This is the highest-impact missing infrastructure item. The following notification types, in priority order:

| Notification | Trigger | Timing | Expected Impact |
|-------------|---------|--------|-----------------|
| Morning brief | Daily, user has active program | 7:00 AM local | Primary DAU driver — "Your readiness score: 82. Back day. Coach says: prioritize pull-ups first." |
| Streak at risk | User has not logged today, streak > 3 | 6:00 PM local | Classic retention hook. "Your 12-day streak ends at midnight." |
| PR alert follow-up | 24h after a PR is logged | Next morning | Reinforces achievement. "Yesterday you hit a bench PR. Share your progress." |
| Recovery window open | 72h after a compound muscle was worked | Morning | "Your chest is recovered and ready. Last session: 3,200kg volume." |
| Weekly review ready | Every Sunday | 9:00 AM | "Your week in review is ready. 4 sessions, +2.1kg total volume vs. last week." |
| Deload recommendation | Fatigue index > 75 (currently fires in-app post-workout) | Evening of trigger day | Fires even if user does not open app that day. |
| Macro steering alert | Weight stall detected (`_detectWeightStall()`) | Morning, 3 days after stall confirmed | "Your weight has been flat for 10 days. Your coach has a suggestion." |

Implementation note: The app is already a PWA (`manifest.json`, mobile-web-app-capable). Web Push is the correct path. Service worker exists or can be added without framework changes.

---

## 8. Sound and Haptics Opportunity

The memory file references premium FX (sounds, particles, animations) as already live in v216. The following are the moments where audio and haptics would add the most delight, and where gaps likely exist:

| Moment | Current State | Recommendation |
|--------|--------------|----------------|
| PR Celebration | Trophy animation, 4s auto-dismiss | Add a distinct "achievement unlocked" sound + long haptic burst. This is the highest-emotion moment in the app. It deserves the fullest sensory response. |
| Set completion | Silent | Short haptic tick (like tapping a checkbox) on every set save. Builds rhythm during a workout. |
| Rest timer end | Unknown — likely silent or basic | Alert tone + haptic at rest timer expiry is functionally critical. Users put their phone down during rest. |
| Level up / XP milestone | Unknown | Ascending chime + confetti particle burst. |
| Streak milestone (7, 30, 100 days) | Unknown | Distinct sound from normal streak increment. |
| Deload overlay appearance | Unknown | Subtle "warning" tone — different from celebration, signals attention needed. |
| Voice-to-Log successful parse | Likely silent | Confirmation chime when forge-parse returns successfully parsed sets. Closes the voice UX loop. |
| Morning brief load | Silent (text streams in) | Soft "incoming message" sound as the LLM brief streams in. Reinforces coach presence. |

---

## 9. Suggested Priority Roadmap

Ranked by (user impact x retention leverage) divided by estimated effort.

### Tier 1 — Highest Impact, Must Ship Next

| # | Initiative | Why Now | Effort |
|---|-----------|---------|--------|
| 1 | Push Notifications (morning brief + streak at risk) | The LLM morning brief and active program exist but require app open. Notifications are the distribution layer for all existing coaching value. Without push, DAU will plateau. | M |
| 2 | Streak Freeze / Rest Day Grace | Committed lifters train 4x/week by design. The current streak mechanic punishes correct behavior. Fix it before streaks become associated with guilt rather than motivation. | S |
| 3 | PR Share Card | Fires at peak emotional moment. One share reaches ~150 non-users. Zero implementation exists today. Add "Share PR" to the `showPRCelebration()` overlay. | S |
| 4 | Cloud Sync (Supabase) | localStorage is a ticking clock for every power user. Supabase is already in the stack. This is the paywall anchor for a premium tier. | L |

### Tier 2 — High Impact, Ship This Quarter

| # | Initiative | Why |
|---|-----------|-----|
| 5 | FORGE BUDDY context-aware messaging | Replace static mascot lines with context-driven messages based on streak, recent PR, upcoming rest day, goal progress. 1-2 day effort, high perceived intelligence. |
| 6 | Streak milestone celebrations | 7, 30, 100-day streak moments with distinct FX. Reinforces the streak system's emotional value. |
| 7 | Achievement system | "First PR," "10 sessions," "100kg club" badges. Feeds into the XP system and gives long-term users a trophy case. |
| 8 | AI Coach chat persistence | Save Ask FORGE conversations to Supabase. Users who have meaningful coaching conversations should be able to reference them. Directly requested in backlog. |
| 9 | Weekly Review push notification | Sunday morning notification drives a reliable weekly re-engagement moment with zero new feature build — just a push trigger on existing Weekly Review Card. |

### Tier 3 — Strategic Bets, Next Half

| # | Initiative | Signal Needed to Advance |
|---|-----------|--------------------------|
| 10 | Nutrition database / barcode scan | Validate that meal logging friction is the top nutrition drop-off cause via user interviews or support signal. |
| 11 | Wearable / Apple Health sync | Confirm what % of target users own a wearable. If >40%, this is Tier 1 immediately. |
| 12 | Periodization / multi-week programming | Validate with power users whether single-block AI programs satisfy them or they want 8/12/16-week periodized plans. |
| 13 | Social / challenge system | Requires cloud sync first. Do not build social on top of localStorage. |

---

## 10. Success Metrics

These are the KPIs that would confirm a product revamp is working. Baselines are currently unknown — establishing them is the first measurement task.

### Primary Health Metrics

| Metric | Definition | Target (90 days post-launch) |
|--------|-----------|------------------------------|
| D7 Retention | % of new users who log at least one workout in days 2-7 | Baseline + 15pp |
| D30 Retention | % of new users with at least 4 sessions in first 30 days | Baseline + 10pp |
| Weekly Active Users (WAU) | Users who open the app at least 3x in a 7-day period | Baseline + 25% |
| Streak > 7 days | % of active users with a current streak >= 7 days | > 30% of WAU |

### Feature Adoption Metrics

| Metric | Target |
|--------|--------|
| AI Program Generator activation rate | > 25% of users who visit Coach tab activate a program |
| Ask FORGE queries per active user per week | > 2 queries/week for users with > 10 sessions |
| Morning brief open rate (post-push notification) | > 40% notification tap rate |
| PR share rate | > 15% of PR events result in a share action |

### Business / Revenue Indicators

| Metric | Target |
|--------|--------|
| Premium conversion rate (post cloud sync paywall) | > 8% of active users convert within 30 days of prompt |
| Referral-driven new installs | > 20% of new installs attributable to a share event |
| Support tickets about data loss | 0 post cloud sync launch |

### Leading Indicators (Weekly)

| Indicator | Why It Matters |
|-----------|---------------|
| Sessions logged per WAU | Core engagement signal. If this drops, the workout flow has friction. |
| Ask FORGE queries per WAU | AI coach adoption. If flat, the coach is not being discovered or is not valuable enough to return to. |
| Macro log days per WAU | Nutrition tracking stickiness. Typically the first feature users abandon. |
| Streak break rate | % of users who had a streak > 3 and lost it this week. A spike here signals a bad week or a streak mechanic problem. |

---

## Appendix — Feature Inventory Reference

| Feature | File | Status |
|---------|------|--------|
| XP / Level system | `index.html` (header) | Live |
| Streak pill | `index.html` (header) | Live |
| Mission Banner | `index.html` | Live |
| FORGE BUDDY mascot | `index.html` | Live (static) |
| Ghost Mode | `js/ghost-autocomplete.js` | Live |
| Adaptive Rest Timer | `js/workout-save.js` | Live |
| PR Celebration Overlay | `js/workout-save.js` | Live |
| MRV Recovery Heatmap | `js/recovery-plate.js` | Live |
| Macro Auto-Steering | `js/goal-dashboard.js` | Live |
| Voice-to-Log | `index.html` + `forge-parse` edge fn | Live |
| Ask FORGE AI Coach | `js/rag-search.js` | Live |
| LLM Morning Brief | `js/coach-triggers.js` | Live |
| AI Program Generator | `js/ai-program-generator.js` | Live |
| Smart Deload Engine | `js/deload-engine.js` | Live |
| Progress Photo Comparison | `js/photo-compare.js` | Live |
| Weekly Review Card | `index.html` (Progress tab) | Live |
| Meal Plan Templates | `js/meal-templates.js` | Live |
| Push Notifications | — | Not built |
| Cloud Sync | — | Not built (Supabase auth exists) |
| Achievement / Badge System | — | Not built |
| PR Share Card | — | Not built |
| Streak Freeze | — | Not built |
| Nutrition Database / Barcode | — | Not built |
