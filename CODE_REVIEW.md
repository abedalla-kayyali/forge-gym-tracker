# FORGE Codebase Review

**Review date:** 2026-06-04

FORGE is a React 19 + TypeScript + Vite + Zustand + Supabase fitness app, reviewed across 14 areas (app shell, UI primitives, body map, body/InBody, workout loggers, coach, stats, pages, stores, core lib, hooks, misc features, security, and architecture). The React rewrite is well-structured overall — clean feature boundaries, consistent store patterns, immutable updates, and accessibility-conscious shells — but it sits on a cloud-sync and persistence layer with real data-loss and data-divergence defects. The most urgent problems are: a backup-import path that can be silently overwritten by stale cloud data, a sign-in flow that pushes guest data before pulling (clobbering newer cloud data), large swaths of user data excluded from sync (measurements, templates, programs, goals, photos), silent data loss in the weighted-bodyweight logger, and serious RLS gaps in the auxiliary social/community Supabase tables (PII exposure, impersonation, content poisoning). These are compounded by near-zero test coverage on exactly the riskiest sync/persistence/domain-math modules, and a 1.8MB abandoned legacy vanilla-JS app still tracked alongside the live React code.

---

## Severity summary

| Severity | Count |
|----------|------:|
| Critical | 1 |
| High | 9 |
| Medium | 17 |
| Low | 60 |
| Info | 13 |
| **Total** | **100** |

**Per-area health:**

- **App shell & routing** — Clean, well-structured, accessibility-conscious. Issues: likely-dead Header scroll listener, document dir/lang never updated on language change, unstable XP badge formula, whole-store Header subscription. No data-loss or security defects.
- **UI primitives** — Well-structured, consistent, mostly type-safe. Most serious: Confetti cumulative canvas-scale bug and Modal body-scroll-lock restoration on stacked modals; plus a11y gaps (no focus trap, invalid ARIA on TabPills, no Button loading announcement) and Input id-collision risk.
- **Body map system** — Well-structured; auto-generated SVG cleanly separated from render. Highest impact in MuscleHeatmap: double-"d" label, silent muscle-matching filter failures, unguarded date parsing; SVG data correct but has a redundant ternary and a likely legs/calves centroid mismatch.
- **Body / InBody / measurements** — Clean components on a store/sync layer with real integrity gaps: store never rehydrates after cloud pull, measurements and photos never sync, no same-day de-dup. Component issues mostly medium/low.
- **Workout loggers** — Generally well-structured with thoughtful UX. Consequential: silent data loss (weighted variation discards load; PR detection treats hold-seconds as reps). Several subscription/dependency re-render issues and NaN edge cases. No security issues.
- **Coach feature** — Functional and polished, but `useCoachState` has real correctness bugs (status threshold gap, in-place mutation of memoized arrays, dropped `calves`/`forearms`), `useCoachTriggers` doubles computation, and `CoachPage` recomputes heavy paths in render. Fragile timestamp/timezone assumptions. No data-loss or security issues.
- **Stats page & dashboard charts** — Well-structured with memoized derivations, but several Progress-tab charts ignore the period filter their titles advertise. Real bugs around timezone streak math, divide-by-zero in ProgressiveOverload, and a misleading "live" badge. No security/data-loss issues (read-only here).
- **Log / History / More / Social pages** — Four well-structured presentation pages. LogPage has a hot-path re-render/stale-effect issue; SocialPage shows the WRONG (oldest) workout as "latest"; MorePage drops the quantity field on manual meal add and risks NaN/divide-by-zero in macro bars.
- **Zustand stores & type defs** — Consistent read/write-through pattern, immutable updates, clean types. Risks are silent integrity issues: date-based deletes that can delete wrong records, no migration/versioning, unguarded numeric parsing (NaN poisoning), and a few loose types. No security holes.
- **Core lib** — Mostly clean and pure, but cloud sync has a data-loss/divergence cluster: push timestamp scheme can clobber freshly-pulled data, `pushKey` is never wired in, and many user keys are excluded from sync. `trainingScience` has minor math bugs. Constants/exercises-db/fx/i18n are low-risk.
- **Shared hooks** — Mostly well-structured. Two real defects now: leaked sync-state subscription in `useCloudSync` (no-op cleanup) and duplicate `useAuth` instances each opening their own Supabase subscription. `useProgressInsights` has timezone/date-math issues; `useTimer` over-subscribes.
- **Poster / gamification / steps / settings** — Mostly clean. Highest impact in cross-device sync: JSON import and AccountCard sign-in both bypass the last-writer-wins protocol; `useCloudSync` mounted twice. SessionPoster has a hardcoded kg unit and a font-loading race.
- **Security sweep** — Core per-user isolation (user_data, forge_embeddings) is sound and React UI is XSS-safe. But auxiliary social/community tables have serious RLS gaps (profiles_public leaks emails; duels/community_* write policies unscoped), the backup-engine edge function trusts client payloads into a shared admin sheet, and the legacy index.html has unescaped innerHTML sinks.
- **Architecture / dead-code / repo hygiene** — Two parallel apps: a 1.8MB legacy vanilla-JS app and the live React rewrite. React side is well-structured, but the repo is polluted by the abandoned legacy app, ~32 tracked screenshot PNGs, scratch scripts, and a deployment ambiguity. Test coverage is near-zero on the highest-risk code.

---

## Top priorities

1. **[CRITICAL]** **Imported backup data silently overwritten by older cloud data** — `src/features/settings/components/DataTransfer.tsx:44-68` — `handleImport` uses raw `localStorage.setItem`, never stamping `forge:sync:updated:<key>`, so the local sync timestamp stays 0 and the next `pullFromCloud` overwrites every just-imported key with (possibly stale) cloud data; it also never fires `forge:mutated`, so the import is never pushed up. _Fix:_ Route imports through `writeStorage(key, value)` so the timestamp is stamped and `forge:mutated` dispatched. _(confirmed)_

2. **[HIGH]** **Sign-in pushes local data before pulling, clobbering newer cloud data** — `src/features/settings/components/AccountCard.tsx:86-114` — `mergeGuestIntoAccount()` is pure `pushToCloud()` and stamps every row with a fresh `now()`, so guest data overwrites more-recent data synced from another device. _Fix:_ Make merge do pull-then-push, push only keys with no remote row, or rely on `useCloudSync`'s mount reconciliation. _(confirmed)_

3. **[HIGH]** **Many user-data keys excluded from cloud sync** — `src/lib/cloudSync.ts:24-39` (SYNC_KEYS) — Templates, measurements, macro targets, programs, goal, checkins, readiness, step goal, and custom exercises never sync; a new-device login loses them (several are roadmap P0). _Fix:_ Audit `STORAGE_KEYS` against `SYNC_KEYS`; better, derive SYNC_KEYS from a single tagged source of truth. _(confirmed)_

4. **[HIGH]** **Weighted bodyweight variation silently discards the added load** — `src/features/workout/components/BwLogger.tsx:39-52,65-69` — `BwExerciseSet` has no weight field; selecting "weighted" records plain reps with only a string tag, so calisthenics volume/PR analytics are wrong. _Fix:_ Add `addedWeight?: number` to `BwExerciseSet` and a weight input, and surface it in `SaveWorkoutModal` mapping (don't hardcode `weight: 0`), or remove the option until supported. _(confirmed)_

5. **[HIGH]** **Cloud pull does not rehydrate `useBodyStore`** — `src/lib/cloudSync.ts:64-99` + `src/stores/useBodyStore.ts:30-46` — `pullFromCloud()` writes to localStorage but never calls `hydrate()` or dispatches an event, so on a fresh device body data looks empty/stale until a full reload. _Fix:_ Have `pullFromCloud()` trigger rehydration (dispatch `forge:pulled` or call `getState().hydrate()`); verify the same for workout/profile stores. _(unverified)_

6. **[HIGH]** **profiles_public exposes every user's email to any authenticated user** — `docs/supabase/2026-03-14_duels_cardio_setup.sql:133-135` — SELECT policy `using (true)` over a table holding email/name lets any logged-in user harvest the entire user base's email and real name (account enumeration / phishing). _Fix:_ Drop the email column; expose matchmaking via a SECURITY DEFINER RPC returning only non-PII fields, never `using (true)` over PII. _(confirmed)_

7. **[HIGH]** **Any authenticated user can overwrite any community catalog row** — `docs/supabase/2026-03-15_shared_catalog_setup.sql:54-55,75-76` — `community_exercises`/`community_meals` UPDATE policies check only `auth.uid() is not null`, not ownership, enabling shared-content poisoning of in-app pickers. _Fix:_ Scope UPDATE to the owner (`auth.uid() = created_by`) and sanitize/bound name/tip/numeric fields. _(confirmed)_

8. **[HIGH]** **document dir/lang set once at boot, never updated on language change** — `src/main.tsx:11-13` — `dir`/`lang` are computed once at module load; switching to Arabic in-app translates text but leaves the document LTR, breaking RTL layout and `[dir="rtl"]` CSS until reload. _Fix:_ Drive `documentElement.dir`/`lang` reactively from `useSettingsStore((s) => s.settings.language)`. _(confirmed)_

9. **[HIGH]** **Near-zero test coverage on highest-risk persistence/sync/domain modules** — `src/lib/cloudSync.ts`, `src/lib/storage.ts`, `src/lib/trainingScience.ts`, `src/stores/*.ts` — Only 2 test files for ~80 modules, and the untested code is exactly the merge/sync logic that can silently lose data. _Fix:_ Prioritize tests for cloudSync merge logic, then trainingScience pure functions, then storage timestamp stamping, then a canonical store test. _(confirmed)_

10. **[MEDIUM]** **"Latest" workout is actually the OLDEST one** — `src/pages/SocialPage.tsx:23` — `addWorkout` appends, so `workouts[0]` is the first-ever workout; the share/poster card always uses the oldest session. _Fix:_ Select the most-recent entry by date (memoized sort) or prepend in the store. _(confirmed)_

11. **[MEDIUM]** **Progress-tab charts ignore the selected period despite the title claiming it** — `src/pages/StatsPage.tsx:1045-1053` vs `VolumeChart.tsx:9`, `FreqChart.tsx:9`, `PRBoard.tsx:9-26` — Section titles show `(6M)` etc. while VolumeChart/FreqChart hardcode 30 days and PRBoard shows all-time — a direct label/data contradiction. _Fix:_ Pass a `period` prop and compute the cutoff from it; for PRBoard, window it or relabel "all-time". _(confirmed)_

12. **[MEDIUM]** **Measurements never sync to the cloud** — `src/lib/cloudSync.ts:24-39` — `STORAGE_KEYS.MEASUREMENTS` is omitted from `SYNC_KEYS`, so measurements are dropped from push and pull even though export/import includes them (hiding the bug in testing). _Fix:_ Add `STORAGE_KEYS.MEASUREMENTS` to `SYNC_KEYS`. _(confirmed)_ *(Subsumed by #3; kept as a top priority because it is independently confirmed and user-facing.)*

---

## Findings by severity

### Critical

**Poster / gamification / steps / settings**

- **Imported data can be silently overwritten by older cloud data on next login** — `src/features/settings/components/DataTransfer.tsx:44-68` (handleImport) — Writes restored keys with raw `localStorage.setItem`, never stamping `forge:sync:updated:<key>`, so the local sync timestamp stays 0; the next `pullFromCloud` (`cloudSync.ts:84-87`) sees `remoteTs > localTs(=0)` and overwrites every just-imported key with cloud data. It also bypasses `writeStorage` so no `forge:mutated` fires and the import is never pushed up. _Fix:_ Route imports through `writeStorage(key, value)`. _(confirmed)_

### High

**Architecture**

- **Near-zero test coverage on highest-risk persistence, sync, and domain-logic modules** — `src/lib/cloudSync.ts` (158L), `src/lib/storage.ts` (53L), `src/lib/trainingScience.ts` (282L), `src/stores/*.ts` (~660L) — Only 2 test files exist for ~80 modules; the untested code is the last-writer-wins merge, guest→account merge, offline fallback, pure domain math, and the sync-timestamp/`forge:mutated` engine. 28 src files import a store or cloudSync, so a regression is wide. _Fix:_ Test cloudSync merge logic first, then trainingScience, then storage, then a canonical store test. _(confirmed)_

**Body / InBody / measurements**

- **Cloud pull does not rehydrate `useBodyStore` — stale/empty body data after new-device login** — `src/stores/useBodyStore.ts:30-46` + `src/lib/cloudSync.ts:64-99` — `pullFromCloud()` writes to localStorage but never calls `hydrate()` or dispatches `forge:mutated`; the store is seeded once at module load, so body data renders empty/stale until a reload. _Fix:_ Trigger rehydration after pull (dispatch `forge:pulled`, or call `getState().hydrate()`); verify workout/profile stores too. _(unverified)_
- **Measurements never sync to the cloud** — `src/lib/cloudSync.ts:24-39` — `STORAGE_KEYS.MEASUREMENTS` absent from `SYNC_KEYS`; dropped from push/pull while `DataTransfer.tsx:14` includes it, hiding the bug during testing. _Fix:_ Add `STORAGE_KEYS.MEASUREMENTS` to `SYNC_KEYS`. _(confirmed)_

**Core lib**

- **Many user-data keys silently excluded from cloud sync** — `src/lib/cloudSync.ts:24-39` vs `src/lib/constants.ts:1-73` — `SYNC_KEYS` mirrors only ~13 keys; TEMPLATES, MEASUREMENTS, MACRO_TARGETS, MEAL_LIBRARY, STEP_GOAL, READINESS, CHECKINS, ACTIVE/AI_PROGRAM, SPLIT, MESOCYCLE, MRV_CONFIG, DELOAD_DATA, GOAL, SAVED_ANSWERS, and BW_CUSTOM_EXERCISES never roam. Several are roadmap P0. _Fix:_ Audit STORAGE_KEYS vs SYNC_KEYS; derive SYNC_KEYS from a single tagged source. _(confirmed)_

**App shell & routing**

- **document dir/lang set once at boot, never updated on language change** — `src/main.tsx:11-13` — Computed once at module load; runtime switch to Arabic leaves the document LTR, breaking RTL layout and `[dir="rtl"]` CSS (`index.css:150`) until reload. _Fix:_ Reactively set `documentElement.dir`/`lang` from `useSettingsStore((s) => s.settings.language)` in an effect/hook. _(confirmed)_

**Workout loggers**

- **Weighted bodyweight variation silently discards the added load** — `src/features/workout/components/BwLogger.tsx:39-52,65-69` — The "weighted" toggle exists but `BwExerciseSet` (`src/types/workout.ts:28-32`) has no weight field; the load is lost so calisthenics volume/PR is wrong. _Fix:_ Add `addedWeight?: number` and a weight input, and map it in `SaveWorkoutModal` (line 107) instead of `weight: 0`; or remove the option. _(confirmed)_

**Poster / gamification / steps / settings**

- **Sign-in pushes local data before pulling, clobbering newer cloud data** — `src/features/settings/components/AccountCard.tsx:86-114` — `mergeGuestIntoAccount()` is pure `pushToCloud()` stamping fresh `now()` timestamps, so guest data wins over more-recent cloud data from another device; runs without a preceding pull. _Fix:_ Make merge pull-then-push, push only keys lacking a remote row, or rely on `useCloudSync`'s mount reconciliation. _(confirmed)_

**Security**

- **profiles_public exposes every user's email/name to any authenticated user** — `docs/supabase/2026-03-14_duels_cardio_setup.sql:133-135` — SELECT policy `using (true)` over email/name/display_name enables PII disclosure and account enumeration. _Fix:_ Drop the email column; expose only non-PII via a SECURITY DEFINER RPC matching an exact username; never `using (true)` over PII. _(confirmed)_
- **Any authenticated user can overwrite any community catalog row** — `docs/supabase/2026-03-15_shared_catalog_setup.sql:54-55,75-76` — UPDATE policies check only `auth.uid() is not null`, not `created_by`; shared catalog feeds in-app pickers, so this is content-poisoning. _Fix:_ Scope UPDATE to `auth.uid() = created_by`; sanitize/length-limit name/tip and numeric ranges. _(confirmed)_

### Medium

**App shell & routing**

- **Level badge number is a fabricated XP/100 value, not the real level** — `src/components/layout/Header.tsx:72` — Badge shows `Math.floor(experience/100)` while the title uses non-linear `getLevel()`, so the two indicators contradict (e.g. 600 XP → SILVER/level 4 but badge "6"; 0 XP → "0" not level 1). _Fix:_ Render `{level.level}` (already destructured at line 15). _(confirmed)_

**UI primitives**

- **Body scroll-lock released when ANY stacked modal closes** — `src/components/ui/Modal.tsx:31-40` (cleanup line 38) — Cleanup unconditionally resets `body.style.overflow=''`; closing an inner modal unlocks background scroll while the outer is still open. _Fix:_ Use a module-level lock count, or save/restore the previous overflow value. _(confirmed)_
- **Modal has no focus trap, initial focus, or focus restoration** — `src/components/ui/Modal.tsx:44-91` — Declares `role="dialog" aria-modal="true"` but never moves focus in, doesn't trap Tab, and doesn't restore focus on close. _Fix:_ Move focus to the surface on open, trap Tab/Shift+Tab, restore focus on close (a `useFocusTrap` hook or focus-trap-react). _(confirmed)_
- **Invalid ARIA: role="tab" combined with aria-pressed** — `src/components/ui/TabPills.tsx:50-51` — `aria-pressed` is not valid on `role="tab"`; also no arrow-key roving tabindex or `aria-controls` to panels. _Fix:_ Remove `aria-pressed` (keep `aria-selected`), or drop tab semantics for plain toggle buttons; add roving tabindex + arrow handling if keeping tabs. _(confirmed)_

**Body / InBody / measurements**

- **Progress photos never sync, export, or back up — and can blow the localStorage quota** — `src/features/body/components/PhotoGallery.tsx:7` (`PHOTOS_KEY`) — Base64 data URLs stored under `forge_body_photos`, absent from SYNC_KEYS and DataTransfer; `writeStorage` (`storage.ts:36-46`) has no try/catch around `setItem`, so a QuotaExceededError throws out of `handleUpload` with no feedback. _Fix:_ Move photos to Supabase Storage (or at least add to backup), wrap the write in try/catch with a "storage full" toast, and downscale/compress before storing. _(confirmed)_
- **Validation silently drops any value ≤ 0 with no feedback and no upper bound** — `src/features/body/components/InBodyLog.tsx:33-39`; `MeasurementsForm.tsx:34-40`; `WeightLogger.tsx:20` — `!isNaN(v) && v > 0` drops a legitimate 0 silently; no upper bound (weight 7000, BMI 999) and no 0-100 clamp on body fat. _Fix:_ Accept 0 where meaningful or show per-field errors; add range checks and toast which field failed. _(confirmed)_

**Workout loggers**

- **Hold exercises store seconds in the `reps` field, corrupting PR/volume math** — `src/features/workout/components/BwLogger.tsx:50,71-74` — `handleAddSet` pushes `{ reps: holdSeconds }`; downstream consumers (`SaveWorkoutModal:337-338`, `TopExercisesCard:77`) sum hold-seconds into rep totals (a 60s plank = 60 "reps"). _Fix:_ Add a distinct `holdSeconds?: number` to `BwExerciseSet`; exclude hold sets from rep aggregations. _(confirmed)_

**Stats page & dashboard charts**

- **Progress-tab charts ignore the selected period despite the section title claiming it** — `src/pages/StatsPage.tsx:1045-1053` vs `VolumeChart.tsx:9`, `FreqChart.tsx:9`, `PRBoard.tsx:9-26` — Titles show the period while VolumeChart/FreqChart hardcode 30 days and PRBoard shows all-time. _Fix:_ Accept a `period`/`fromTs` prop and compute the cutoff (mirror `PeriodSummary`/`WeeklyVolumeBars`); window or relabel PRBoard. _(confirmed)_
- **"Latest PR" relies on string date sort and the isPR flag, which may disagree with TopPRs/PRBoard** — `src/pages/StatsPage.tsx:122-134,287-294` — `ActivityRingsHero.latestPR` uses `localeCompare` on raw ISO strings and the persisted `isPR` flag, while PRBoard/TopPRs recompute from max weight, producing contradictory PRs; mixed date formats sort inconsistently. _Fix:_ Pick one PR source of truth in a shared helper; order by `new Date(date).getTime()`. _(confirmed)_

**Log / History / More / Social pages**

- **"Latest" workout is actually the OLDEST one** — `src/pages/SocialPage.tsx:23` (used at 33,42) — `addWorkout` appends (`useWorkoutStore.ts:23`), so `workouts[0]` is the first-ever workout powering the share/poster card. _Fix:_ Select most-recent by date (memoized) or prepend in the store; confirm ordering against HistoryPage. _(confirmed)_
- **Quantity/servings silently dropped when adding a meal manually** — `src/pages/MorePage.tsx:52,70-82` — The "Estimate" button multiplies by `mealQty`, but `handleAddMeal` ignores `mealQty` and never sets `servings`, so Qty=3 logs 1 serving. _Fix:_ Multiply entered macros by `q` and/or persist `servings: q`; apply one consistent semantics. _(confirmed)_
- **No way to delete or correct a logged meal from the UI** — `src/pages/MorePage.tsx:156-169` — The store exposes `deleteMeal(date, index)` but the list is read-only, so a wrong meal permanently skews totals. _Fix:_ Add a delete control calling `deleteMeal(today, i)` with confirm/undo, mirroring the water Undo pattern. _(confirmed)_

**Zustand stores & type defs**

- **Hardcoded 'forge-custom-exercises-v1' key bypasses STORAGE_KEYS and is duplicated** — `src/stores/useCustomExercisesStore.ts:5` + `src/lib/cloudSync.ts:38` — The same literal is defined in two places (and uses dash naming, unlike the `forge_*` constants); a typo in either silently breaks custom-exercise sync. _Fix:_ Add the key to STORAGE_KEYS and reference it from both. _(confirmed)_

**Core lib**

- **`pushKey` is dead code; every local edit triggers a full all-keys upsert** — `src/lib/cloudSync.ts:135-153` (unused) + `src/hooks/useCloudSync.ts:41-48` — The hook only calls `pushToCloud()` on `forge:mutated`, re-serializing and upserting all ~13 keys every 1.5s window and re-stamping every key's timestamp on any unrelated mutation (amplifying clobber risk). _Fix:_ Wire `pushKey(detail.key, value)` into the mutation flow, or delete `pushKey`. _(confirmed)_

**Poster / gamification / steps / settings**

- **Import accepts any forge_* key with no schema/version validation** — `src/features/settings/components/DataTransfer.tsx:53-58` — Writes every `forge_*` key including control/meta (`forge_guest`, `forge_schema_version`, onboarding flags); an older/malicious file can corrupt auth/guest state or skip migrations. _Fix:_ Allowlist (reuse `EXPORT_KEYS`), gate on schema version, exclude meta keys. _(confirmed)_
- **Canvas drawn before custom fonts are guaranteed loaded (font race)** — `src/features/poster/components/SessionPoster.tsx:245-251` — A fixed `setTimeout(drawPoster, 40)` can render with fallback fonts on a cold cache, producing an off-brand poster the user downloads. _Fix:_ `await document.fonts.ready` (and/or `document.fonts.load`) before drawing, with a fallback timeout. _(confirmed)_

**Security**

- **duels UPDATE/INSERT policies allow impersonation and score tampering** — `docs/supabase/2026-03-14_duels_cardio_setup.sql:93-94,100-108` — INSERT `with check (true)` lets a user name arbitrary challenger/opponent; UPDATE `with check (true)` lets a participant rewrite scores and reassign the duel. _Fix:_ Constrain INSERT/UPDATE checks to the caller's identity, forbid changing challenger/opponent (trigger on OLD/NEW), and move score mutation to a SECURITY DEFINER RPC. _(confirmed)_
- **Client-supplied backup payload written verbatim into shared admin spreadsheet** — `supabase/functions/backup-engine/index.ts:287-320,322-361` — The authenticated path serializes attacker-controlled, unbounded row content into both the per-user and the shared ADMIN_SHEET_ID with no size cap or rate limit (DoS / integrity attack on the operator's central sheet). _Fix:_ Source the admin sheet only from server-side tables; cap payload/row counts and validate types for the per-user sheet; add per-user rate limiting. _(confirmed)_
- **HTML-attribute injection via exercise name in inline onclick** — `index.html:3844` (renderRecentExercises) — The name is interpolated into an inline `onclick` after escaping only backslash/single-quote, not HTML-attribute-encoded, so a `"` or `>` yields stored XSS; names sync across devices. _Fix:_ Attach the handler via `addEventListener` and store the name in a `data-*` attribute (no interpolation), or HTML-attribute-encode. _(confirmed)_
- **Unvalidated JSON import writes arbitrary forge_* localStorage keys** — `src/features/settings/components/DataTransfer.tsx:44-68` — Accepts any uploaded JSON, writing every `forge_`-prefixed key with no schema/value validation; can set control flags or overwrite profile/settings that then auto-sync to cloud. _Fix:_ Validate against an explicit allowlist (`STORAGE_KEYS`/`EXPORT_KEYS`), reject unknown keys, validate shape per key, and warn about overwrite. _(confirmed)_ *(Same file/path as the critical import finding and the medium "no schema validation" finding — these three describe one import path with three facets: missing timestamp/push, missing allowlist/version gate, and the security exposure; fix them together.)*
- **No rate limiting on authenticated AI endpoints; client controls system prompt** — `supabase/functions/forge-search/index.ts:55-58,155-170` — No rate limit/quota on paid Anthropic calls (cost abuse), and the client supplies `coach_system` used verbatim as the system prompt (prompt override). _Fix:_ Add per-user rate limits/quotas; keep the authoritative system prompt server-side and append client context as user-role content. _(confirmed)_

**Architecture**

- **Entire legacy vanilla-JS app is dead weight relative to the React rewrite** — `js/*.js` (69 modules) + `index.html` (729KB, script tags lines 23, 2412-2446+) — The React app (`app.html` → `src/main.tsx`) is the live target and never imports from `js/`; the two apps duplicate every domain feature, roughly doubling maintenance surface. _Fix:_ If React is the future, archive and delete `js/`, `css/`, `index.html`, `sw.js`, serve scripts; otherwise document a cutover plan and add a deprecation banner. _(confirmed)_
- **Deployment ambiguity: static host serves the LEGACY app at '/', React only under sub-routes** — `vite.config.ts:6-21,47-58` / `index.html` / `app.html` — spaFallback rewrites only `/log /stats /history /coach /more` to `app.html`; `/` resolves to legacy `index.html`, and there is no CI workflow, so which app a user sees depends on the entry URL. _Fix:_ Pick one entry (rename `app.html`→`index.html` after retiring legacy, or redirect `/`→`/log`); add an explicit deploy workflow. _(uncertain)_

### Low

**App shell & routing**

- **Header subscribes to the entire session store, re-rendering on every session mutation** — `src/components/layout/Header.tsx:12` — `useSessionStore()` with no selector re-renders the Header on every set during active logging though it reads only `active`/`startTime`. _Fix:_ Use granular selectors; same pattern for `useGamificationStore()` at line 13. _(confirmed)_
- **Expand toggle lacks aria-controls; expanded region not associated** — `src/components/layout/Header.tsx:49-60,64-109` — The chevron sets `aria-expanded` but doesn't point at the region it controls. _Fix:_ Add `id="header-expanded-panel"` to the region and `aria-controls` to the toggle. _(unverified)_
- **All six pages lazy with no prefetch; first tab tap shows skeleton** — `src/App.tsx:1,313-325` — A UX/perf opportunity for a 6-tab nav on slower connections, not a bug. _Fix:_ Optionally prefetch likely-next chunks after first paint. _(unverified)_

**UI primitives**

- **Label-derived input id collides for repeated labels** — `src/components/ui/Input.tsx:13` — Two inputs with the same label produce identical DOM ids, breaking `htmlFor`. _Fix:_ Use `useId()` combined with the slug. _(uncertain)_
- **Unstable `onDone` in deps restarts the whole Confetti animation** — `src/components/ui/Confetti.tsx:108` — Inline `onDone` changes identity each parent render, tearing down and restarting the animation while active. _Fix:_ Store `onDone` in a ref and drop it from deps. _(confirmed)_
- **Loading state not announced to assistive tech** — `src/components/ui/Button.tsx:77-86` — No `aria-busy` and the label is unchanged during loading. _Fix:_ Add `aria-busy={loading}` and optional sr-only status. _(unverified)_
- **Backdrop click bypasses handleClose (no tap sound)** — `src/components/ui/Modal.tsx:47` vs 23 & 79 — Backdrop calls `onClose()` directly, skipping `play('tap')`. _Fix:_ Call `handleClose()` from the backdrop handler. _(unverified)_
- **Double live-region announcement for toasts** — `src/components/ui/Toast.tsx:39-43,85` — Container `aria-live`/`aria-atomic` nested with per-toast `role="status"` causes double announcements. _Fix:_ Pick one live-region owner; drop `aria-atomic`. _(unverified)_
- **Module-level nextId grows unbounded; no max-visible cap** — `src/components/ui/Toast.tsx:22,28` — Persists across remounts/HMR and a burst renders an unbounded stack. _Fix:_ Move the id generator into a `useRef` and cap visible toasts. _(unverified)_

**Body map system**

- **Double "d" / "todayd" in 'Worked recently' chip** — `src/features/dashboard/components/MuscleHeatmap.tsx:93` (and 51) — `values[m]` is already suffixed; line 93 appends a second "d" ("2dd", "todayd"). _Fix:_ Render `· {values[m]}` without the trailing "d". _(confirmed)_
- **Unguarded Date parsing can NaN-poison the last-session sort and days math** — `src/features/dashboard/components/MuscleHeatmap.tsx:38,41` — A malformed/empty `workout.date` yields NaN, making the sort order undefined and producing "NaNd"/incorrect freshness; future dates produce negative days. _Fix:_ Parse once, filter non-finite timestamps, clamp days with `Math.max(0, ...)`. _(confirmed)_
- **O(muscles × workouts × exercises) recompute with per-iteration sort allocation** — `src/features/dashboard/components/MuscleHeatmap.tsx:35-43` — Filters and sorts the full array per muscle though only the max is needed. _Fix:_ Single reduce keeping max timestamp per muscle. _(unverified)_
- **Redundant ternary `const fillOp = active ? 1 : 1`** — `src/components/body/buildBodyMapSvg.ts:56` — Always 1; dead branching suggesting a lost intended dim. _Fix:_ Hardcode `fill-opacity="1"` or restore the intended inactive opacity. _(unverified)_
- **Likely swapped/mislabeled centroids for legs and calves** — `src/components/body/body-map-data.ts:225-226` — Mixed coordinates hint the auto-classifier put some leg/calf paths in the wrong bucket, so a region may highlight under the wrong muscle. _Fix:_ Re-run `scripts/classify-bodymap.mjs` and visually verify front/back highlighting. _(unverified)_
- **Heatmap conveys freshness by color only with no text equivalent on the map** — `src/features/dashboard/components/MuscleHeatmap.tsx:67-76` — Color-blind users can't distinguish the sore/worked/recovering/ready ramp. _Fix:_ Expose a visually-hidden per-muscle status summary. _(unverified)_
- **Array index used as React key for path lists** — `src/components/body/BodyMap.tsx:110,158` — Safe today (static data); latent if data becomes dynamic. _Fix:_ Key by `${muscle}-${i}` defensively. _(unverified)_

**Body / InBody / measurements**

- **Same-day entries appended as duplicates with full ISO timestamps; no overwrite/de-dup** — `src/features/body/components/WeightLogger.tsx:24`; `InBodyLog.tsx:31`; `MeasurementsForm.tsx:32` — Logging twice a day creates duplicate rows that double-count and that date-based delete can't target cleanly. _Fix:_ Normalize to a day key and upsert by day, or explicitly support intraday entries keyed by timestamp. _(confirmed)_
- **List items keyed by array index** — `src/features/body/components/WeightLogger.tsx:56`; `InBodyLog.tsx:82` — Index keys on re-sorted slices mis-associate rows once delete/upsert lands. _Fix:_ Key by `e.date` or a composite. _(confirmed)_
- **InBodyLog bypasses the InBodyEntry type with `string` keys and `as any`** — `src/features/body/components/InBodyLog.tsx:6,44` — Defeats type checking so a typo'd field compiles and persists garbage. _Fix:_ Type keys as `keyof Omit<InBodyEntry,'date'|'notes'>` and build a `Partial<InBodyEntry>`. _(confirmed)_
- **No edit or delete for InBody/measurement entries; measurements have no history view** — `src/features/body/components/InBodyLog.tsx` (and MeasurementsForm) — Mistaken entries are permanent and pollute trends. _Fix:_ Add delete/edit affordances and a recent-measurements list; add `deleteMeasurement`/`deleteInBody`. _(unverified)_
- **All progress photos share generic alt text** — `src/features/body/components/PhotoGallery.tsx:70` — `alt="Progress"` is non-distinguishing. _Fix:_ Build alt from type + date. _(unverified)_
- **'Latest' measurement assumes array is chronologically ordered** — `src/features/body/components/MeasurementsForm.tsx:52` — `measurements[length-1]` may not be newest after a merge/import. _Fix:_ Compute latest by max date. _(unverified)_
- **Photo handlers close over `photos` and rebuild on every change** — `src/features/body/components/PhotoGallery.tsx:43,54` — Memoization buys nothing and risks a stale snapshot on rapid uploads. _Fix:_ Use the functional updater and drop `photos` from deps. _(unverified)_

**Workout loggers**

- **Whole-store subscription + `session` in deps risks double timer-finish** — `src/hooks/useTimer.ts:17,45-50` — No-selector subscription re-renders RestTimer on any session mutation; the finish effect depends on the whole `session`, risking a double 'timer' sound. _Fix:_ Granular selectors, narrow effect deps, guard with a `firedRef`. _(uncertain)_
- **Empty numeric inputs coerce to 0 and block logging without clear feedback** — `src/features/workout/components/CardioLogger.tsx:31,104,38-41` — The minus stepper allows duration to reach 0, only rejected on submit. _Fix:_ Clamp the stepper to a minimum and/or disable Log when duration≤0. _(confirmed)_
- **`useAllSessions` computed twice per render** — `src/features/workout/components/SessionStreakCard.tsx:70-72` — Called inside `useStreak()` and again directly, doubling the merged-array build/sort on a hot path. _Fix:_ Compute once or have `useStreak` return `{ days, last, sessions }`. _(confirmed)_
- **Streak day boundaries use UTC (toISOString) not local time** — `src/features/workout/components/SessionStreakCard.tsx:35-37,48` — Late-night local workouts land on the wrong UTC day, breaking today/yesterday detection. _Fix:_ Use a local-date key helper consistently. _(unverified)_
- **Ghost sets assume insertion order equals chronological order** — `src/features/workout/hooks/useGhostSets.ts:13-30` — After updates/imports/merges the last array entry may not be most recent. _Fix:_ Pick the max by `new Date(workout.date).getTime()`. _(unverified)_
- **Listbox lacks keyboard arrow navigation and active-descendant wiring** — `src/features/workout/components/ExerciseAutocomplete.tsx:50-61,126-131` — No ArrowUp/Down or `aria-activedescendant`; outside-click close is mousedown-only. _Fix:_ Add arrow navigation, `aria-activedescendant`, and blur/focusout close. _(unverified)_
- **Set lists keyed by array index cause wrong row state on removal** — `src/features/workout/components/SetLogger.tsx:44-48,59-68` (also `BwLogger:215`, `CardioLogger:186`, `SaveWorkoutModal:247,272`) — Removing a middle set reuses DOM by position. _Fix:_ Add a stable per-set uid or a content+position key. _(unverified)_
- **Add Set disabled when weight is empty blocks legitimate 0-weight entries** — `src/features/workout/components/SetLogger.tsx:18-25,82` — `disabled={!reps || !weight}` forbids a 0kg/assisted set though logic accepts `w>=0`. _Fix:_ Base disabled on parsed validity (`reps>0`) and treat empty weight as 0. _(unverified)_
- **Cardio entries saved inside forEach share one Date.now() base** — `src/features/workout/components/SaveWorkoutModal.tsx:116-122` — All loop entries get identical timestamps; uniqueness relies only on `Math.random()`. _Fix:_ Add an index into the id/timestamp. _(unverified)_

**Coach feature**

- **Recovery status threshold gap — days 3-6 fall through to 'ready'; labels non-monotonic** — `src/features/coach/hooks/useCoachState.ts:52-56` — `fresh` means only exactly day 2 and `recovering` only day 0-1, producing a non-monotonic color sequence vs CoachPage's RECOVERY_TIER. _Fix:_ Make the ladder explicit and monotonic covering every day bucket, aligned to RECOVERY_TIER. _(uncertain)_
- **`useCoachTriggers` re-runs the entire `useCoachState` computation a second time** — `src/features/coach/hooks/useCoachTriggers.ts:6` — On Insights both hooks run, doubling all filtering/streak/volume work on the page's hot path. _Fix:_ Pass CoachState in, or share a single memoized state via context/selector. _(confirmed)_
- **TRACKED muscle list omits 'calves' and 'forearms'** — `src/features/coach/hooks/useCoachState.ts:22,82` — They never appear in the recovery grid or neglected list. _Fix:_ Derive TRACKED from the MuscleGroup union or add the two muscles. _(confirmed)_
- **Mixed UTC/local date math in streak and recency filters can drop or double-count a day** — `src/features/coach/hooks/useCoachState.ts:33-34,39,44,62-67` — `toISOString().slice(0,10)` (UTC) compared against local-iterated days misses late-night workouts; `startsWith` assumes date-first ISO. `todayKey()` in CoachPage:74 shares the hazard. _Fix:_ Use one shared local-day-key helper across `useCoachState`, `todayKey`, and PlanTab. _(confirmed)_
- **Check-in sleep value lossy round-tripped; notes-JSON fallback inconsistent** — `src/pages/CoachPage.tsx:117-134,193-198` — Stores `sleep*1.4` and a raw JSON blob in notes; the fallback uses a magic `/1.4` and maps three columns to one score. _Fix:_ Persist typed CheckInValues as the single source of truth; remove/name the magic factor. _(confirmed)_
- **useMemo depends on `profile` but never reads it; missing dependency on Date.now()** — `src/features/coach/hooks/useCoachState.ts:92` — Profile edits force a recompute that can't change the result; `Date.now()` is non-reactive so values are stale across midnight. _Fix:_ Drop `profile` from deps; key on a date string if midnight staleness matters. _(confirmed)_
- **Index used as React key for trigger lists** — `src/features/coach/components/CoachPanel.tsx:76`; `src/pages/CoachPage.tsx:402` — Trigger count/order changes, so index keys mis-apply transitions. _Fix:_ Key by a stable composite (`type-muscle-message`). _(unverified)_
- **Quick-add water buttons lack type=button and focus-visible** — `src/pages/CoachPage.tsx:851-859` — Could submit if ever in a form; hard to see keyboard focus. _Fix:_ Add `type="button"` and a focus-visible outline. _(unverified)_
- **Calorie deficit/surplus and protein tip can render NaN/misleading text** — `src/pages/CoachPage.tsx:712,749,871-874` — `calDeficit`/protein tip lack the `|| 1` guard the macro grid uses; protein short can show a negative number. _Fix:_ Clamp targets once at the top and `Math.max(0, ...)` the protein gap. _(unverified)_
- **targetMuscle cast `as MuscleGroup` can produce an invalid muscle and confusing 'Neglected' badge** — `src/pages/CoachPage.tsx:458-462,510` — Casts an unvalidated string; the badge always shows on the recommended muscle. _Fix:_ Validate against the MuscleGroup set before casting; reword/relocate the badge. _(unverified)_

**Stats page & dashboard charts**

- **ProgressiveOverload pct can divide by an effectively-zero denominator; 0kg deltas misleading** — `src/pages/StatsPage.tsx:948-953` — A first-time exercise (no prior data) and a stagnant lift both render identically as a gray current weight, and the bar fills 100% with no baseline. _Fix:_ Distinguish "no prior data" (show NEW) from "no change"; don't fill the bar without a baseline. _(confirmed)_
- **'live' badge is purely decorative and misleading** — `src/pages/StatsPage.tsx:1006` — Nothing streams; data is synchronously hydrated. _Fix:_ Remove it or bind to the cloudSync `SyncState`. _(confirmed)_
- **WeightChart single-entry/equal-weight and yearless X labels** — `src/features/dashboard/components/WeightChart.tsx:8-16,26-28` — A single entry renders no visible line, and 'MMM d' labels can't disambiguate years. _Fix:_ Add a single-entry guard and include the year when the range spans years. _(confirmed)_
- **Collapsible section button lacks aria-expanded / aria-controls** — `src/features/dashboard/components/DashboardSection.tsx:14-29` — The toggle gives no expand state to screen readers. _Fix:_ Add `aria-expanded` and `aria-controls` to the content region. _(confirmed)_
- **mkDelta dead null-check; 'ALL' deltas unlabeled; 'Overdue' vs 'Never' share gray** — `src/pages/StatsPage.tsx:817-833,43-49` — Minor smells: dead `p != null` branch and color collision between two semantically different freshness states. _Fix:_ Drop the dead check; give 'Overdue' a distinct color. _(unverified)_
- **Recharts `<Cell>` keyed by array index** — `src/features/dashboard/components/VolumeChart.tsx:57-59` (also `WeeklyVolumeBars`, StatsPage:879-898) — Re-ordered data can flash the highlight on the wrong bar. _Fix:_ Key by `data[i].muscle` / week key. _(unverified)_
- **Measurement/InBody delta compares latest vs second-latest regardless of populated fields** — `src/pages/StatsPage.tsx:533-544,594-602` — Partial entries make deltas blink in/out. _Fix:_ Per-field, find the most recent prior entry that defines that field. _(unverified)_
- **Repeated `as number` casts on optional body fields bypass null safety** — `src/pages/StatsPage.tsx:543-544,596-597,632` — An unguarded `previous[key]` cast yields NaN on a bad import. _Fix:_ Use `typeof` guards instead of casts. _(unverified)_

**Log / History / More / Social pages**

- **Array-index keys on mutable lists** — `src/pages/MorePage.tsx:159-167` (also `LogPage:297,314`, `HistoryPage:359/405`) — The meals list is the concrete hazard since `deleteMeal(date, index)` splices. _Fix:_ Add real ids when created and key on them. _(confirmed)_
- **Race-prone setTimeout to pre-pick muscle after starting session** — `src/pages/LogPage.tsx:210-216` — A 50ms guess orders `setMuscle` after start though `setMuscle` has no async gate; timeout never cleared on unmount. _Fix:_ Call `start()` then `setMuscle()` synchronously. _(unverified)_
- **Date parsing/sorting assumes well-formed ISO strings with no fallback** — `src/pages/HistoryPage.tsx:131-133,247` — A malformed date yields Invalid Date → NaN, making sort non-deterministic and rendering 'Invalid Date'. _Fix:_ Use `Date.parse` with a NaN→Infinity fallback in the comparator and a fallback label. _(unverified)_
- **Expandable history cards are non-keyboard-accessible divs** — `src/pages/HistoryPage.tsx:255-263` — `<div onClick>` with no role/tabIndex/keyboard handler/aria-expanded. _Fix:_ Use a `<button>` (reuse LogPage's LoggedExerciseCard pattern). _(unverified)_
- **Cardio intensity conveyed by color; unknown defaults to 'low' green** — `src/pages/HistoryPage.tsx:314-325,439-446` — Unknown intensities fall back to the green low color, mislabeling severity. _Fix:_ Use a neutral color for unrecognized values. _(unverified)_
- **Profile cast to Record<string, unknown> defeats type safety** — `src/pages/MorePage.tsx:20,26-27` — `as unknown as Record<string, unknown>` hides the real Profile shape; a key typo silently falls back forever. _Fix:_ Use the typed profile directly or typed key constants. _(unverified)_
- **Weak meal-input validation accepts negatives / non-numbers** — `src/pages/MorePage.tsx:70-82` — Negative calories pass through; non-numeric becomes 0 while still logging. _Fix:_ Validate finite ≥0 before logging and add `min="0"`. _(unverified)_

**Zustand stores & type defs**

- **deleteWeightEntry deletes ALL entries sharing a date; entries never deduped** — `src/stores/useBodyStore.ts:30-34,48-52` — No id field, so date-equality delete removes every same-date entry, and there is no upsert. _Fix:_ Add a stable `id` and delete/update by id, or upsert by day key. _(uncertain)_
- **goal can become NaN, poisoning getTodayProgress** — `src/stores/useStepsStore.ts:21,26,47-52` — A non-numeric `forge_step_goal` → `parseInt` NaN, and `goal <= 0` doesn't catch NaN, producing NaN percentages. _Fix:_ `Number.isFinite(g) && g > 0 ? g : 10000` and guard `getTodayProgress`. _(confirmed)_
- **Unsafe `as MuscleGroup | 'unknown'` cast accepts arbitrary muscle strings** — `src/stores/useCustomExercisesStore.ts:27,37,45` — Untrimmed/typo'd strings become keys, so `getFor` may miss entries. _Fix:_ Trim + lowercase + validate against the union, fall back to 'unknown'. _(uncertain)_
- **Default water goal of 8 hardcoded in three places** — `src/stores/useNutritionStore.ts:75-101` — A custom goal can be silently reset; literal duplicated 3×. _Fix:_ Extract `DEFAULT_WATER_GOAL` and a `getDay(date)` helper. _(uncertain)_
- **readinessToday never invalidated when the day rolls over** — `src/stores/useProfileStore.ts:36-42` — After midnight, yesterday's readiness shows as "today". _Fix:_ Store the date alongside it or derive from `readiness[todayKey]`. _(unverified)_
- **updateSettings cannot clear customBg/layout** — `src/stores/useSettingsStore.ts:29-37,46-50` — `writeSettings` skips `undefined`, so optional fields can never be reset. _Fix:_ Allow a `null` sentinel that calls `removeStorage`, or detect `key in updates`. _(unverified)_
- **end() leaves stale session arrays/timers; only reset() clears them** — `src/stores/useSessionStore.ts:69-71,85` — A leftover rest timer/selection can bleed into the next session. _Fix:_ Have `start()` clear `restTimerStart`/`selectedMuscle`/`selectedExercise`, or have `end()` clear the timer. _(unverified)_
- **No schema versioning/migration despite SCHEMA_VERSION key existing** — `src/lib/storage.ts:22-33` — Persisted blobs are cast to T with no transform/validation across shape changes — a latent upgrade crash/integrity risk. _Fix:_ Add a migration step keyed off SCHEMA_VERSION and runtime validation at the readStorage boundary. _(unverified)_
- **addInBody called with `as any`, defeating the InBodyEntry guard** — `src/features/body/components/InBodyLog.tsx:44` (store `useBodyStore.ts:42`) — Also `body_fat?` vs `body_fat_pct?` are ambiguous. _Fix:_ Remove the cast, construct a typed entry, and rename to `body_fat_kg`/`body_fat_pct`. _(unverified)_
- **Object-destructuring the whole store subscribes components to every field** — `src/stores/useBodyStore.ts` consumers (`MeasurementsForm.tsx:22`, `InBodyLog.tsx:15`) — Any body-data change re-renders these forms. _Fix:_ Use granular selectors or `useShallow`. _(unverified)_

**Core lib**

- **Full-table push uses one 'now' timestamp and can clobber data that was just pulled** — `src/lib/cloudSync.ts:109-128` + `src/hooks/useCloudSync.ts:31-35` — `pushToCloud` stamps every key with `now` and never compares timestamps, so a stale device pushing on boot can overwrite newer cloud data, defeating last-writer-wins. _Fix:_ Push the per-key local `forge:sync:updated:<key>` timestamp (or skip keys not newer than remote); track a per-key dirty flag. _(uncertain)_
- **Custom-exercises sync key may not match the store; BW custom exercises key missing** — `src/lib/cloudSync.ts:38` — `STORAGE_KEYS.BW_CUSTOM_EXERCISES` ('forge_bw_custom_exercises') isn't in SYNC_KEYS, so bodyweight custom exercises never sync. _Fix:_ Add `BW_CUSTOM_EXERCISES` to SYNC_KEYS; promote the hyphenated literal into STORAGE_KEYS. _(uncertain)_
- **Double-progression check mislabeled and ignores whether the weight was completed** — `src/lib/trainingScience.ts:230-238` — `minTop` actually means "hit top of range"; the rule ignores RIR/RPE and per-set weight variation (P0 progressive-overload feature). _Fix:_ Rename to `hitTopRange`, optionally gate on target RIR, use the modal/max working weight. _(confirmed)_
- **AudioContext created eagerly without resume() and never closed; beeps may be silent** — `src/lib/fx.ts:4-9,11-26` — A suspended context started off a timer (not a gesture) produces no sound with no error. _Fix:_ `resume()` if suspended; create/resume inside the first user gesture. _(uncertain)_
- **Consistency uses an unexplained magic divisor (17)** — `src/lib/trainingScience.ts:199-202` — The '4+/wk = 100' intent doesn't cleanly align with `/17`. _Fix:_ Extract a named constant or compute `Math.round(4*30/7)`. _(unverified)_
- **PLAIN_STRING_KEYS stores numeric-ish values as raw strings; readStorage<number> returns a string** — `src/lib/storage.ts:1-20,22-33` — `readStorage<number>(STEP_GOAL)` is a string at runtime, causing `'8000'+1` bugs. _Fix:_ Store numeric keys as JSON or add typed `readNumber`/`readString` accessors. _(unverified)_
- **i18n init sets Arabic language but never sets document dir=rtl** — `src/lib/i18n.ts:8-18` — First render from saved 'ar' is LTR until a toggle. _Fix:_ Set `dir`/`lang` after init and on `languageChanged`. _(unverified)_ *(Same root cause as the high-severity main.tsx finding — fix dir/lang in one reactive place.)*
- **Untyped Supabase rows cast with 'as'; malformed remote rows can crash or write garbage** — `src/lib/cloudSync.ts:82-86` — A NaN `updated_at` silently drops a newer row; null key/value written verbatim. _Fix:_ Type the query result, skip rows with missing key, guard `Number.isFinite(remoteTs)`. _(unverified)_
- **Ripple effect mutates element style and never restores it** — `src/lib/fx.ts:64-87` — Sets `position`/`overflow:hidden` permanently, clipping overflowing badges. _Fix:_ Capture/restore the prior values, or require callers to pre-style in CSS; confirm the `ripple-expand` keyframe exists. _(unverified)_

**Shared hooks**

- **Sync-state listener never unsubscribes (no-op cleanup)** — `src/hooks/useCloudSync.ts:23-26` — Cleanup is `return () => { unsub; };` — a bare expression that never calls `unsub`, leaking the listener (worse under StrictMode and the double-mount). _Fix:_ `return () => unsub();` (or `return unsub;`). _(confirmed)_
- **useAuth instantiated twice, creating duplicate auth subscriptions and divergent state** — `src/hooks/useCloudSync.ts:18` + `src/App.tsx:307-311` — Two `onAuthStateChange` subscriptions, two `getSession()` round-trips, two `user` copies that can disagree, and doubled `updateProfile` writes. _Fix:_ Lift auth into a context/provider or pass `user` into `useCloudSync(user)`. _(confirmed)_
- **Mixed UTC/local date math skews 'today' and week-boundary calculations** — `src/hooks/useProgressInsights.ts:70-89,103-107` — UTC `todayKey` vs local week edges flips streak/'logged today' near midnight. _Fix:_ Use one local-day-key helper everywhere day-bucketing happens. _(confirmed)_
- **Whole-store subscription + unstable `session` in deps causes excess re-renders** — `src/hooks/useTimer.ts:17,50,54,58,62` — No-selector subscription re-renders every consumer on any session mutation; the 1s interval makes it a hot path. _Fix:_ Select only used fields and grab stable actions individually. _(confirmed)_
- **Redundant sort of overdueList immediately discarded** — `src/hooks/useProgressInsights.ts:180-189` — The first sort's result is never used. _Fix:_ Delete the `overdueList.sort` block. _(unverified)_
- **hoursUntilMidnight can be negative / off by timezone** — `src/hooks/useProgressInsights.ts:123` — UTC `todayKey` + local 'T23:59:59' can compute a past target. _Fix:_ Build end-of-day from local components and clamp with `Math.max(0, ...)`. _(unverified)_
- **Division by zero / NaN if weeklyGoal is 0** — `src/hooks/useProgressInsights.ts:90` — `current/0` → Infinity/NaN renders as NaN%. _Fix:_ `const goal = Math.max(1, weeklyGoal)` used consistently. _(unverified)_
- **signOut/exitGuest leave loading and isGuest in inconsistent states** — `src/hooks/useAuth.ts:89-92,100-103` — `signOut` doesn't reset `isGuest`; `exitGuest` doesn't reset `loading`. _Fix:_ Reset `isGuest`/GUEST flag on signOut and handle `loading` symmetrically. _(unverified)_
- **Repeated full-history scans rebuilt on every workout mutation** — `src/hooks/useProgressInsights.ts:99-101,115,162-171` — Per-muscle filter+sort over full history; cost grows with history size. _Fix:_ Build the per-muscle last-trained map in a single pass. _(unverified)_

**Poster / gamification / steps / settings**

- **useCloudSync mounted twice → duplicate listeners and double cloud pushes** — `src/hooks/useCloudSync.ts` via `AccountCard.tsx:21` + `App.tsx:311` — While More is open, every mutation triggers two debounced pushes and visibility/pagehide fires two immediate pushes. _Fix:_ Have AccountCard subscribe to `onSyncStateChange`/`getSyncState` instead of the full hook. _(confirmed)_
- **today date captured at render; steps added to wrong day across midnight** — `src/features/steps/components/StepsPanel.tsx:10,14-17` — `today` is closed over from render, so quick-add writes to yesterday's bucket until a re-render. _Fix:_ Compute the date inside `handleAdd` or in a store action. _(confirmed)_
- **Corrupt step_goal yields NaN goal → NaN width/percentage** — `src/stores/useStepsStore.ts:21,26` (consumed by `StepsPanel.tsx:28,41-47`) — NaN flows into `width:'NaN%'`. _Fix:_ Guard the parse: `Number.isFinite(g) && g > 0 ? g : 10000`. _(confirmed)_
- **XPBar subscribes to entire gamification store** — `src/features/gamification/components/XPBar.tsx:5` — Re-renders on achievement changes; `getLevel()` re-scans LEVEL_TABLE each render. _Fix:_ Select `experience` narrowly and `useMemo` the level. _(unverified)_
- **PR gold color keyed on hardcoded grid index 3** — `src/features/poster/components/SessionPoster.tsx:199` — Fragile coupling to stats array order. _Fix:_ Tag the stat with `highlight` and color on it. _(unverified)_
- **Profile name persisted to localStorage on every keystroke** — `src/features/settings/components/SettingsForm.tsx:26-32` — `updateProfile({name})` writes and fires `forge:mutated` per character (memory note prefers onBlur). _Fix:_ Hold local state and commit on blur/Enter, or debounce. _(unverified)_
- **No way to undo or correct an over-added step count** — `src/features/steps/components/StepsPanel.tsx:50-58` — Quick-add only increments; a mis-tap is unrecoverable. _Fix:_ Add a 'set today's steps' input or an undo backed by `setSteps(date, value)`. _(unverified)_

**Security**

- **Service-role cron path gated only by a shared secret with permissive CORS** — `supabase/functions/backup-engine/index.ts:431-435,443` — The RLS-bypassing path is authorized solely by `x-cron-secret` with CORS `*` allowing that header from any origin; a leaked secret enables a full-DB export, and `===` is non-constant-time. _Fix:_ Invoke server-to-server only, drop browser CORS for this function, rotate the secret, use constant-time compare. _(confirmed)_
- **Duel ownership matched by fragile UUID prefix LIKE instead of equality** — `docs/supabase/2026-03-14_duels_cardio_setup.sql:82-87,102-107` — `like`/`ilike` prefix matching can over-match. _Fix:_ Use uuid columns compared with `= auth.uid()`. _(unverified)_
- **Local fitness/PII data not cleared on sign-out; shared-device leakage** — `src/hooks/useAuth.ts:29-54,89-92` — `signOut` never clears `forge_*` keys, so the next user inherits prior data, which last-writer-wins can also push into the new account. _Fix:_ Clear/namespace per-user `forge_*` keys on sign-out and reset before pulling on a different user. _(unverified)_
- **food-search edge function is unauthenticated and unthrottled** — `supabase/functions/food-search/index.ts:67-101` — Open key-bearing proxy to USDA/Open Food Facts; anyone can drain the operator's USDA quota. _Fix:_ Require a valid Supabase JWT (mirror forge-search), add origin checks/rate limiting. _(unverified)_

**Architecture**

- **1106-line body-map-traced.ts is unreferenced dead code; three overlapping body-map data sources** — `src/components/body/body-map-traced.ts` — Zero imports; largest dead file in the React tree, plus an orphaned `public/body-map-traced.svg` and a duplicate `body-map.png`. _Fix:_ Delete the file and the orphaned SVG; consolidate to `body-map-data.ts` + `buildBodyMapSvg.ts`. _(confirmed)_
- **Build/QA scratch artifacts committed and missing from .gitignore** — repo root — 32 tracked PNGs (4.4MB) plus `check_*.js`, `smoke_check.js`, `find_func.ps1`, `run_check.bat`, `serve.bat/js` bloat clones. _Fix:_ Add patterns to .gitignore and `git rm --cached` the tracked ones; move genuine references into `docs/`. _(confirmed)_
- **Vendored agent/skill library (.agents/, 78 files) tracked despite being gitignored** — `.gitignore:17` vs 78 tracked files — gitignore doesn't untrack committed paths, so `.agents/` keeps appearing in diffs. _Fix:_ `git rm -r --cached .agents/` if local-only, or remove the ignore rule if shared. _(confirmed)_
- **useSessionStore deviates from the store contract (no hydrate/persist)** — `src/stores/useSessionStore.ts:1-86` — The sole ephemeral store, undocumented; active session is lost on refresh/crash. _Fix:_ Document the intent; consider a lightweight draft autosave. _(unverified)_
- **Lint scope and config hygiene reinforce the two-app split** — `eslint.config.js:10` — `js/`,`css/`,`sw.js` ignored, so the legacy app is unlinted; tsconfig strictness is exemplary. _Fix:_ Drop the ignores once legacy is deleted; keep tsconfig as-is. _(unverified)_
- **Stale task/review markdown and dual service-worker clutter root** — root scratch md/scripts — One-off docs and a legacy `sw.js` alongside vite-pwa's generated worker risk double SW registration. _Fix:_ Move durable docs into `docs/`, delete one-off files, remove root `sw.js` once legacy is retired. _(unverified)_

### Info

**App shell & routing**

- **Large auth/splash UI co-located in App.tsx bloats the always-loaded entry module** — `src/App.tsx:65-275` — AuthScreen (~210L) plus SplashScreen/AmbientWash/MiniFeature ship in the initial bundle for already-authenticated users. _Fix:_ Extract AuthScreen into `src/features/auth/AuthScreen.tsx` and lazy-load behind the `!user && !isGuest` gate. _(unverified)_

**UI primitives**

- **Hoverable card looks/acts clickable but has no role or keyboard handler** — `src/components/ui/Card.tsx:36` — A hoverable card with an onClick is mouse-only. _Fix:_ Accept an explicit onClick and add `role="button"`, `tabIndex`, and Enter/Space handling, or document wrapping content in a real button. _(unverified)_

**Workout loggers**

- **Synthesized cardio fallback workout uses a non-unique id** — `src/features/workout/components/SaveWorkoutModal.tsx:116-132` — The poster fallback uses bare `c_${Date.now()}` with no random suffix. _Fix:_ Reuse the `Date.now()_random` pattern. _(uncertain)_
- **Unsafe cast of arbitrary muscle string to MuscleGroup** — `src/features/workout/components/SaveWorkoutModal.tsx:344` — The cast precedes the `VALID_MUSCLES.includes` check. _Fix:_ Validate first via a `Set`, then narrow with a type guard. _(unverified)_
- **Cardio form fields persist between logs except notes** — `src/features/workout/components/CardioLogger.tsx:31-35,53` — Last values carry over, risking accidental wrong data. _Fix:_ Reset distance/HR/notes after each log (keep type/intensity) or document the behavior. _(unverified)_

**Coach feature**

- **detectPlateaus and calcTrainingScore run on every InsightsTab render without memoization** — `src/pages/CoachPage.tsx:287-289` — Both scan/sort full history in the render body. _Fix:_ Wrap both in `useMemo` keyed on `workouts`. _(confirmed)_
- **Magic sentinel 999 for 'never trained' is duplicated across files** — `src/features/coach/hooks/useCoachState.ts:45` (vs CoachPanel:110, CoachPage:264/436/504) — Compared inconsistently (`< 999` vs `=== 999`). _Fix:_ Use `daysSince: number | null` or export a `NEVER_TRAINED` constant + `isTrained(m)` helper. _(unverified)_

**Stats page & dashboard charts**

- **Multiple sibling components each independently re-derive over the full workouts array** — `src/pages/StatsPage.tsx:75-149,259-294,343-369,395-415,663-695,785-954` — Each is memoized but all recompute on any workout mutation, several duplicating intermediate aggregates. _Fix:_ Hoist shared aggregates into one memoized selector and pass slices down. _(unverified)_
- **FreqChart height grows with data length; long names truncated by fixed YAxis width** — `src/features/dashboard/components/FreqChart.tsx:34` — Magic 28px/row and 120px YAxis assume short names. _Fix:_ Make YAxis width responsive or show the full name in the Tooltip. _(unverified)_

**Zustand stores & type defs**

- **Goal.target as `number | string` permits invalid/ambiguous state** — `src/types/coach.ts:45` — Loose typing invites NaN math; progress has no 0-100 constraint. _Fix:_ Use discriminated variants or normalize at the boundary. _(unverified)_
- **Level progress divides by range with no guard if two levels share minXP** — `src/stores/useGamificationStore.ts:55-77` — Safe with the current monotonic table; an edit to equal minXP → Infinity/NaN. _Fix:_ Guard `range > 0 ? ... : 100`. _(unverified)_
- **getByDate uses startsWith on raw ISO date — timezone/format fragile and duplicated** — `src/stores/useWorkoutStore.ts:40-42` (also `useBwWorkoutStore.ts:40-42`, `useCardioStore.ts:34-36`) — UTC-vs-local prefix match misclassifies late-evening workouts; copy-pasted across three stores. _Fix:_ Normalize to one timezone via a shared `dayKey`/`getByDate` utility. _(unverified)_

**Core lib**

- **Linear filters over EXERCISE_DB on every call; unmemoized at call sites** — `src/lib/exercises-db.ts:136-150` — Negligible at 133 rows but re-scans per render if called in an autocomplete render. _Fix:_ `useMemo` the result at the call site or precompute a lowercased index. _(unverified)_
- **Meal macro matching is first-substring-wins and order-sensitive** — `src/lib/trainingScience.ts:82-94` — 'chicken rice bowl' resolves to chicken only, systematically mis-estimating combined meals. _Fix:_ Document the single-ingredient heuristic or sum matches; surface the `matched:false` fallback. _(unverified)_

**Shared hooks**

- **Unsafe `as string` cast on user_metadata.full_name** — `src/hooks/useAuth.ts:33,48` — `user_metadata` is an arbitrary bag; a non-string could be written into profile.name. _Fix:_ `typeof fn === 'string' && fn.trim()` before use. _(unverified)_
- **xpToNext is hardcoded to 0 (dead/misleading field)** — `src/hooks/useProgressInsights.ts:51-52,211` — Always 0 though documented as XP to next level. _Fix:_ Compute from LEVEL_TABLE or remove the field. _(unverified)_

**Poster / gamification / steps / settings**

- **unlocked_date rendered without validity guard** — `src/features/gamification/components/AchievementsList.tsx:25-27` — A malformed imported date renders 'Invalid Date'. _Fix:_ Guard with a parse check and omit the date row when invalid. _(unverified)_
- **onSyncStateChange cleanup is a no-op (unsubscribe never called)** — `src/hooks/useCloudSync.ts:23-26` — Same bug as the High/Low cleanup finding; worsened by the AccountCard double-mount. _Fix:_ `return () => unsub();`. _(unverified)_ *(Duplicate of the confirmed Low "Sync-state listener never unsubscribes" finding.)*

**Security**

- **Hardcoded Supabase URL/anon key (by design) but project ref/pooler URL in committed temp files** — `src/lib/supabase.ts:5-7` (also `js/config.js:7-8`) — The anon key is fine (RLS-gated), but `supabase/.temp/project-ref` and `.../pooler-url` are git-tracked, disclosing DB host/username. No private secrets found committed. _Fix:_ Add `supabase/.temp/` to .gitignore and remove the tracked temp files. _(unverified)_
- **RLS-bearing social/community/profiles tables live only in docs, not migrations** — `supabase/migrations` — Only user_data, forge_embeddings, backup_state are versioned; cardio/duels/profiles_public/community_*/profiles tables are doc-only or absent, so the deployed posture is unverifiable from source. _Fix:_ Promote all table/RLS definitions into versioned migrations and audit each for `auth.uid() = user_id`. _(unverified)_

---

## Cross-cutting themes

- **Cloud-sync correctness / last-writer-wins integrity** — The most repeated and most damaging theme: import bypasses the timestamp protocol (`DataTransfer`), sign-in pushes before pulling (`AccountCard`), the full-table push re-stamps `now()` and can clobber freshly-pulled data, `pushKey` is dead so every edit upserts all keys, and many user keys (measurements, templates, programs, goal, photos, BW custom exercises) never sync at all. Several confirmed data-loss paths converge here.
- **Persistence safety / no migration or numeric guarding** — No schema versioning despite a `SCHEMA_VERSION` key; persisted blobs are cast to T unchecked; `PLAIN_STRING_KEYS` return strings typed as numbers; corrupt `step_goal`/`weeklyGoal`/macro targets produce NaN that poisons progress bars and charts. Append-only stores with date-based deletes can delete the wrong (or all same-day) records.
- **Timezone / date-math (UTC vs local)** — Recurs across `useCoachState`, `useProgressInsights`, `SessionStreakCard`, `MuscleHeatmap`, HistoryPage, and the stores' `getByDate`: UTC `toISOString` day keys compared against local-derived boundaries flip streaks and "today" detection near midnight, and unguarded `new Date()` parsing NaN-poisons sorts.
- **Zustand selector misuse / missing memoization** — Whole-store subscriptions (Header, useTimer, XPBar, body form components) and duplicated derivations (useCoachTriggers re-running useCoachState, SessionStreakCard's double useAllSessions, unmemoized detectPlateaus/calcTrainingScore) cause avoidable re-renders on hot paths.
- **Missing effect cleanup / duplicate subscriptions** — `useCloudSync`'s no-op unsubscribe leaks the sync-state listener, the hook is mounted twice, and `useAuth` runs in two places, each opening its own Supabase auth subscription with divergent state.
- **RLS gaps and edge-function trust on auxiliary Supabase tables** — Core tables are isolated, but profiles_public leaks PII, duels/community_* write policies aren't owner-scoped, the backup-engine writes client payloads into a shared admin sheet and is cron-gated by a CORS-exposed secret, and AI/food-search endpoints lack rate limiting (and food-search lacks auth entirely). The security-bearing tables also live only in docs, not versioned migrations.
- **List keys by array index** — Pervasive (`SetLogger`, `BwLogger`, `CardioLogger`, `SaveWorkoutModal`, body recent lists, MorePage meals, VolumeChart/WeeklyVolumeBars Cells, coach trigger lists). Mostly latent today but a concrete hazard wherever delete/reorder/sort is wired (notably MorePage meals, which already has index-based delete).
- **Accessibility gaps in interactive primitives** — No Modal focus trap, invalid TabPills ARIA, no Button loading announcement, missing `aria-expanded`/`aria-controls` on collapsibles, clickable `<div>`s in HistoryPage, color-only signals in the heatmap and intensity badges.
- **Dead / legacy code and repo hygiene** — Two parallel apps (1.8MB legacy vanilla JS vs React), an unreferenced 1106-line `body-map-traced.ts`, ~32 tracked screenshot PNGs, scratch scripts, a contradictory `.agents/` ignore, dual service workers, and a deployment ambiguity where `/` serves the legacy app.
- **Near-zero test coverage on the riskiest code** — Only 2 test files for ~80 modules, with the merge/sync/persistence/domain-math hot zone (cloudSync, storage, trainingScience, stores) effectively untested.

---

## Suggested remediation order

**Stage 1 — Stop active data loss and security exposure (do first):**
1. Fix the import path (`DataTransfer.tsx`): route through `writeStorage`, add an allowlist + schema-version gate (resolves the Critical + the two Medium import findings together).
2. Fix sign-in merge (`AccountCard.tsx`) to pull-then-push, and make `pushToCloud` respect per-key timestamps instead of `now()`.
3. Expand `SYNC_KEYS` to cover all user-owned keys (measurements, templates, programs, goal, macro targets, readiness/checkins, step goal, BW/custom exercises) — ideally derive from a single tagged source — and rehydrate stores after `pullFromCloud`.
4. Patch the Supabase RLS gaps: remove email from `profiles_public`, scope community/duels write policies to the owner, lock down the backup-engine cron path and stop writing client payloads to the shared sheet, add auth/rate limiting to AI and food-search functions, and promote security-bearing tables into versioned migrations.

**Stage 2 — Confirmed user-facing correctness bugs:**
5. Capture weighted-bodyweight load and stop overloading `reps` for holds (`BwLogger`).
6. Fix SocialPage "latest" (oldest) workout, MorePage meal quantity + delete, and the period-ignoring Progress-tab charts.
7. Fix the Header XP badge, MuscleHeatmap double-"d"/NaN parsing, Modal scroll-lock, Confetti `onDone`, steps-goal NaN, and the `useCloudSync` no-op cleanup + double mount + duplicate `useAuth`.

**Stage 3 — Robustness and consistency:**
8. Introduce shared helpers: a local `dayKey` used across all stores/hooks for date math, a numeric-parse guard at the `readStorage` boundary, and schema versioning/migration.
9. Wire `pushKey` (or delete it), de-dup body entries by day, add ids to deletable lists, and convert index keys to stable keys where delete/reorder exists.

**Stage 4 — Performance, a11y, and hygiene:**
10. Apply granular Zustand selectors and memoization on hot paths (Header, useTimer, XPBar, CoachPage, useCoachTriggers, StatsPage aggregates).
11. Close the accessibility gaps (Modal focus trap, TabPills ARIA, Button `aria-busy`, collapsible `aria-expanded`/`aria-controls`, keyboard-accessible HistoryPage cards).
12. Resolve the legacy/dead-code and deployment ambiguity: pick one entry, archive/delete the legacy app, remove `body-map-traced.ts`, gitignore screenshots/scratch/`.temp`/`.agents`.

**Stage 5 — Tests:**
13. Backfill tests for the sync/persistence/domain code (cloudSync merge first, then trainingScience, storage, and a canonical store) so the Stage 1-3 fixes are locked in.
