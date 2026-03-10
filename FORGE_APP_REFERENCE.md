# FORGE GYM TRACKER — APP REFERENCE
> **Last updated:** 2026-03-10
> **Purpose:** Complete module map for fast navigation, debugging, and future feature development.  
> **Rule:** Update this file after every session that adds, removes, or significantly changes a feature.

---

## TABLE OF CONTENTS
1. [File Structure](#1-file-structure)
2. [index.html Architecture](#2-indexhtml-architecture)
3. [Views / Tabs](#3-views--tabs)
4. [localStorage Keys](#4-localstorage-keys)
5. [Global State Variables](#5-global-state-variables)
6. [Module Map — Functions by Domain](#6-module-map--functions-by-domain)
7. [CSS Architecture](#7-css-architecture)
8. [Data Schemas](#8-data-schemas)
9. [Key UI Components](#9-key-ui-components)
10. [External Dependencies](#10-external-dependencies)
11. [Known Patterns & Conventions](#11-known-patterns--conventions)
12. [Change Log](#12-change-log)

---

## 1. FILE STRUCTURE

```
Forg OS Gym V3 - Working version/
│
├── index.html          ← CORE APP (11,809+ lines) — HTML + inline JS only (CSS/data extracted)
├── sw.js               ← Service Worker (cache-first, offline, cache: "forge-v20"; CDN assets cached on install)
├── serve.js            ← Node.js dev server port 8765 + POST /save-icons endpoint (localhost-only, path traversal guard)
├── manifest.json       ← PWA manifest (name, icons, theme_color, display: standalone)
├── check.js            ← Syntax validator — parses all <script> blocks, exits with count
├── patch.js            ← One-off patching util (HARDCODED OLD PATH — do not use as-is)
├── serve.bat           ← Double-click shortcut to run serve.js
├── INSTALL_GUIDE.html  ← 5-step onboarding guide for new users
├── FORGE_APP_REFERENCE.md  ← THIS FILE
│
├── css/
│   └── main.css        ← ALL app CSS (4,004 lines, extracted 2026-03-07)
│
├── js/
│   ├── exercises.js           ← EXERCISE_DB + TRAINING_PROGRAMS (695 lines, extracted 2026-03-07)
│   ├── i18n.js                ← LANGS object + all translation functions (1,416 lines, extracted 2026-03-07)
│   ├── storage.js             ← FORGE_STORAGE global: KEYS, lsGet, createIdbBackup, esc(), runMigrations()
│   ├── ghost-autocomplete.js  ← Ghost set autocomplete logic
│   ├── dashboard-history.js   ← Dashboard history sub-renders
│   ├── feedback-ui.js         ← Feedback/rating UI
│   ├── recovery-plate.js      ← Recovery plate calculator UI
│   ├── xp-system.js           ← XP / level / achievement logic
│   └── *.js                   ← Additional extracted modules (see index.html <script src> tags)
│
├── icons/
│   ├── icon.svg
│   ├── icon-192.png
│   ├── icon-512.png
│   └── generate_icons.html
│
└── memory/
    └── MEMORY.md       ← Claude's persistent cross-session memory
```

### Dev workflow
```bash
node serve.js           # Start dev server → http://localhost:8765
node check.js           # Validate all JS — expect "Scripts OK: 5  Failed: 0"
```

---

## 2. INDEX.HTML ARCHITECTURE

Total lines: **11,809** (modularised 2026-03-07 — CSS + data extracted to separate files)

> **Modular structure since 2026-03-07:**  
> CSS → `css/main.css` | Exercise data → `js/exercises.js` | i18n → `js/i18n.js`

### Structural blocks

| Block | Line range | Content |
|---|---|---|
| `<head>` | 1–22 | Meta, PWA tags, Chart.js CDN, `<link>` to css/main.css |
| HTML body / views | 23–1607 | All view HTML, bottom nav |
| `<script src="js/exercises.js">` | 1608 | External: EXERCISE_DB + TRAINING_PROGRAMS |
| **Script Block 1** | 1609–9816 | Main app logic (8,206 lines) |
| **Script Block 2** | 9865–11598 | FX engine: sounds, ripple, particles (1,732 lines) |
| `<script src="js/i18n.js">` | 11604 | External: LANGS + all i18n functions |
| **Script Block 3** | 11618–11626 | SW registration + tiny misc init (7 lines) |

### Script Block 1 — domain breakdown (approximate, post-modularisation)
> Line numbers shifted down ~4,000 from pre-modularisation (CSS block removed before Block 1)

| Lines | Domain |
|---|---|
| 1609–1690 | IndexedDB write-through cache (`_idb` IIFE) |
| 1690–1850 | Global state initialisation from localStorage |
| 1850–2010 | Water goal, water daily reset, angle picker |
| 2010–2220 | Session card, session hero, session summary, share |
| 2220–2400 | Rest timer (header + FAB) |

### External JS modules (loaded before Script Block 1)

| File | Lines | Contents |
|---|---|---|
| `js/storage.js` | ~143 | `FORGE_STORAGE` global: `KEYS`, `lsGet`, `createIdbBackup`, `esc()`, `runMigrations()` |
| `js/exercises.js` | 695 | `EXERCISE_DB` (~100 exercises) + `TRAINING_PROGRAMS` (PPL/5×5/5-3-1) |
| `js/i18n.js` | 1,416 | `LANGS` dictionary (EN + AR) + `t()`, `setLang()`, `_ar` flag, all i18n logic |
| `js/ghost-autocomplete.js` | — | Ghost set autocomplete dropdown |
| `js/dashboard-history.js` | — | Dashboard history sub-renders |
| `js/feedback-ui.js` | — | User feedback/rating UI |
| `js/recovery-plate.js` | — | Recovery plate calculator |
| `js/xp-system.js` | — | XP/level/achievement logic |
| `css/main.css` | 4,004 | All app CSS — `:root` variables, layout, components, animations, dark/solar themes |

> **Note:** `storage.js` loads **first** (before other modules) and exposes `window.FORGE_STORAGE`. The main script block aliases `_esc = window.FORGE_STORAGE.esc` and calls `window.FORGE_STORAGE.runMigrations()` at startup.
| 6239–6517 | Header stats: streak, water, steps |
| 6518–6619 | Bio log modal |
| 6620–6687 | Countdown timer |
| 6688–6840 | View switching, muscle chips, body map toggle |
| 6841–7100 | Muscle history (weighted + bodyweight) |
| 7101–7292 | Tips, last session hint, PR path |
| 7293–7710 | Share modal + canvas card drawing |
| 7711–7852 | Recovery heatmap (separate panel), plate calculator |
| 7854–8085 | Ghost sets, stagnation detection, last session sets |
| 8086–8238 | Exercise library (search, filter, pick) |
| 8239–8432 | Set management: add, remove, type cycle, step input |
| 8314–8432 | Wheel picker (touch weight/reps selector) |
| 8433–8550 | Repeat last workout, streak calc, body weight log |
| 8550–8680 | Water tracker, templates |
| 8681–8827 | Training programs (PPL / 5/3/1 / 5×5) |
| 8828–8924 | Period filter, Overview snapshot |
| 8925–9060 | `renderDashboard()` — Stats main render |
| 9061–9193 | MVP zone, weak muscle, rescue mission, neglected zones |
| 9194–9334 | Week comparison, recovery map, PB board |
| 9335–9524 | Strength standards, Epley 1RM, velocity chart, PR roadmap |
| 9525–9584 | Weekly volume scoring, deload detection |
| 9585–9942 | Charts: volume, muscle vol, muscle balance |
| 9943–10031 | Body heatmap SVG (`renderBodyHeatmap`) |
| 10032–10083 | Frequency chart |
| 10084–10219 | Progress highlights, weight chart |
| 10220–10564 | Calendar (workout, steps, water, weight map builders) |
| 10565–10697 | History view render + filters |
| 10698–10750 | PR board render |
| 10751–11165 | Settings: save, load, theme, export CSV/JSON |
| 10998–11165 | Import: Strong/Hevy CSV, Apple Health XML |
| 11165–11295 | Download helper, confirm clear, toast, confirm dialog |
| 11295–11616 | XP / levelling / achievements / missions |
| 11616–11930 | Coach header, mascot AI, ask chips |
| 11930–12053 | `_askCoach()` — AI response logic (local rules engine) |
| 12053–12380 | Coach sub-tabs: Today, Score, Recomp |
| 12380–12858 | `renderCoach()` + `renderCoachScore()` + coach plan |
| 12858–13137 | Coach programs HTML, Coach nutrition |
| 13138–13400 | Coach train, Coach PRs |
| 13401–13525 | Check-in system (daily wellness rating) |
| 13526–13653 | Theme picker, custom BG |
| 13654–13814 | Profile: save, render |
| 13815–13932 | Body composition: log, chart switch, render chart |
| 13933–14251 | Fitness guide (tab system) |
| 14252–14420 | Muscle overlay (click muscle → modal) |
| 14421–14515 | Bodyweight workout mode |
| 15005–15178 | Workout mode switch, BW exercise picker |
| 15179–15629 | Steps tracker: log, goal, history, pedometer |
| 15630–15864 | Save workout (weighted + BW) |
| 15865–15975 | Layout editor: drag sections, show/hide |
| 16017–16082 | Level-up check + animation |
| 16083–16297 | **Muscle detail modal** (`_openMuscleDetail`, `_shareMuscleCard`) |

---

## 3. VIEWS / TABS

| ID | HTML start | Nav label | Render function |
|---|---|---|---|
| `view-log` | line 4147 | Workout | *(rendered on load + muscle select)* |
| `view-dashboard` | line 4614 | Stats | `renderDashboard()` |
| `view-history` | line 4959 | History | `renderHistory()` |
| `view-coach` | line 5416 | Coach | `renderCoach()` |
| `view-more` | line 5032 | More | *(static + sub-panels)* |

### Stats inner tabs (inside `view-dashboard`)
| Tab | `data-dash-tab` | Panels shown |
|---|---|---|
| Overview | `overview` | Snapshot bar, Heatmap, Week compare, PB Board, Streak |
| Progress | `progress` | Volume chart, Weight progress, Velocity, PR Roadmap |
| Muscles | `muscles` | Muscle balance, Frequency, Volume by muscle, Recovery, Freshness |
| Body | `body` | Body composition, Strength standards |

Active tab stored in `let _dashActiveTab = 'overview'`  
Period stored in `let _dashPeriod = '1M'` — options: `7D | 1M | 3M | 6M | ALL`

### Coach inner tabs
`coachSwitchTab(tab)` — tabs: `today | score | plan | nutrition | train | prs`

### Log view sections (draggable, show/hide)
| Section ID | Default visible |
|---|---|
| `section-steps` | ✅ |
| `section-timer` | hidden |
| `section-indicators` | hidden |
| `section-mission` | hidden |
| `section-bodymap` | ✅ |
| `section-exercise` | ✅ |

---

## 4. LOCALSTORAGE KEYS

| Key | Type | Content |
|---|---|---|
| `forge_workouts` | `Workout[]` | All workout sessions |
| `forge_bodyweight` | `BWEntry[]` | Body weight log entries |
| `forge_templates` | `Template[]` | Saved workout templates |
| `forge_settings` | `Settings` | User settings object |
| `forge_water_<toDateString()>` | `boolean[]` | Daily water cups (8-element array) |
| `forge_steps_<toDateString()>` | `number` | Daily step count |
| `forge_profile` | `Profile` | User profile: name, age, weight, checkinXP |
| `forge_active_program` | `{id, startDate}` | Currently active training program |
| `forge_deload_data` | `{weeklyScores[], active, startDate}` | Deload tracking |
| `forge_achievements` | `string[]` | Unlocked achievement IDs |
| `forge_checkin_<toDateString()>` | `{rating, notes, skipped}` | Daily wellness check-in |
| `forge_theme` | `string` | Theme ID: `forge / solar / obsidian / ...` |
| `forge_accent` | `string` | Hex accent color override |
| `forge_custom_bg` | `string` | Custom background hex |
| `forge_sound` | `string` | `'on'` or `'off'` |
| `forge_schema_version` | `number` | Schema migration version (written by `runMigrations()`); current value: `1` |

### IndexedDB (write-through cache)
DB name: `forge-v3` (in `js/storage.js`, `createIdbBackup()`) — backs up `forge_workouts`, `forge_bodyweight`, `forge_templates`, `forge_settings`, `forge_meals`, `forge_meal_library`
Restores automatically on localStorage quota overflow.

---

## 5. GLOBAL STATE VARIABLES

Declared at top of Script Block 1 (lines ~5676–5690):

```js
let workouts   = JSON.parse(localStorage.getItem('forge_workouts')   || '[]');
let bodyWeight = JSON.parse(localStorage.getItem('forge_bodyweight') || '[]');
let templates  = JSON.parse(localStorage.getItem('forge_templates')  || '[]');
let settings   = JSON.parse(localStorage.getItem('forge_settings')   || '{...}');
let waterToday = JSON.parse(localStorage.getItem('forge_water_' + _waterDateKey) || '[]');
```

Other important state:
```js
let _dashPeriod      = '1M'          // Stats period selector
let _dashActiveTab   = 'overview'    // Stats active tab
let _mdcCurrentMuscle = null         // Muscle detail modal current muscle
let currentBcompChart = 'weight'     // Body comp chart type
let _activeProg      = null          // Active training program
let _ar              = false         // Arabic mode flag
let _cplanView       = 'week'        // Coach plan view
let _cplanExpandDay  = -1            // Coach plan expanded day
```

---

## 6. MODULE MAP — FUNCTIONS BY DOMAIN

### 🏋️ Workout Logging
| Function | Line | Description |
|---|---|---|
| `selectMuscle(muscleOrBtn)` | 6792 | Select muscle group, update chips + body map |
| `addSet()` | 8245 | Add set row (copies last set values) |
| `removeSet(id)` | 8281 | Delete a set row |
| `cycleSetType(el)` | 8291 | Cycle: normal → warmup → dropset → AMRAP |
| `stepInput(btn, delta, type)` | 8314 | +/- buttons on rep/weight inputs |
| `openWheelPicker(input)` | 8314 | Touch wheel picker for weight/reps |
| `loadLastSessionSets(name)` | 7896 | Auto-fill ghost sets from last session |
| `_loadGhostSets(name)` | 7854 | Load ghost overlay on set inputs |
| `pickExercise(name)` | 7934 | Select exercise, load history |
| `showAutocomplete(query)` | 7952 | Exercise autocomplete dropdown |
| `saveWorkout()` | 15664 | Main save dispatcher (weighted vs BW) |
| `_saveWeightedWorkout()` | 15672 | Save weighted workout, detect PR, post-hooks |
| `saveBwWorkout()` | 15775 | Save bodyweight workout |
| `repeatLastWorkout()` | 8440 | Pre-fill last workout's exercise + sets |
| `updateLastSessionHint()` | 7116 | Show "Last time: X" hint below exercise |
| `_checkStagnation(sets)` | 7863 | Detect if same weight/reps 3+ sessions |
| `postSaveHooks()` | ~7352 | Runs after every save: XP, missions, notifications. Re-entrancy guard via `_postSaveRunning` flag |

### 📊 Stats / Dashboard
| Function | Line | Description |
|---|---|---|
| `renderDashboard()` | 8925 | Main stats renderer — calls all sub-renders |
| `switchDashTab(name, btn)` | 8915 | Toggle overview/progress/muscles/body panels |
| `_setPeriod(period, btn)` | 8837 | Change time period, re-render |
| `_filterWorkoutsByPeriod(arr, period)` | 8828 | Filter workouts[] to period window |
| `_renderOverviewSnapshot()` | 8845 | Streak, last session, trend %, PRs bar |
| `renderBodyHeatmap(arr)` | 9943 | SVG front+back muscle colour map |
| `renderVolumeChart(d)` | 9585 | Weekly volume bar chart |
| `renderMuscleVol(arr)` | 9605 | Volume by muscle bar chart |
| `renderMuscleBalance(arr)` | 9622 | Radar chart muscle balance |
| `renderFreqChart(arr)` | 10032 | Session frequency by muscle |
| `renderVelocityChart()` | 9348 | Weight-over-time velocity for an exercise |
| `renderPRRoadmap()` | 9420 | Table of PRs + projected next milestone |
| `renderMuscleFreshness()` | 9475 | Colour-coded freshness per muscle |
| `renderPBBoard()` | 9260 | Personal best records board |
| `renderStrengthStandards()` | 9295 | Beginner/Intermediate/Advanced benchmarks |
| `renderWeekComparison()` | 9194 | This week vs last week stats |
| `renderNeglectedZones()` | 9184 | Muscles not trained recently |
| `buildWeeklyVolume(arr)` | 9524 | Build weekly vol data for chart |
| `checkDeloadNeeded()` | 9557 | Detect overtraining, suggest deload |
| `renderProgressHighlights()` | 10084 | Progress milestones highlight cards |
| `updateWeightChart()` | 10179 | Weight progress line chart |

### 🔥 Muscle Detail Modal (new — 2026-03-06)
| Function | Line | Description |
|---|---|---|
| `_openMuscleDetail(muscle)` | 16083 | Open bottom-sheet modal for clicked muscle zone |
| `_closeMuscleDetail()` | 16211 | Close modal, restore body scroll |
| `_mdcTrainNow()` | 16218 | Navigate to Log view with muscle pre-selected |
| `_buildShareText(muscle)` | 16227 | Build formatted share text (viral card) |
| `_shareMuscleCard()` | 16264 | Web Share API → clipboard fallback |

### 📅 History
| Function | Line | Description |
|---|---|---|
| `renderHistory()` | 10565 | Render history list with session grouping |
| `_setHistMuscle(muscle, btn)` | 10678 | Filter history by muscle chip |
| `_cycleHistSort(btn)` | 10686 | Cycle sort: newest → oldest → volume |
| `renderPRs()` | 10698 | PR tab in history view |

### 🤖 Coach
| Function | Line | Description |
|---|---|---|
| `renderCoach()` | 12380 | Main coach renderer |
| `renderCoachToday()` | 12053 | Today tab: checkin + daily advice |
| `renderCoachScore(score)` | 12634 | Score gauge + breakdown |
| `renderCoachPlan()` | 12694 | Weekly plan view |
| `renderCoachNutrition()` | 12899 | Nutrition advice panel |
| `renderCoachTrain()` | 13138 | Training recommendations |
| `renderCoachPRs()` | 13278 | PR analysis in coach |
| `_askCoach(idx)` | 11936 | Handle "ask chips" quick questions |
| `_updateHdrCoach()` | 11616 | Update coach summary in header |
| `_updateMascot()` | 11736 | Update mascot message + state |
| `setMascotSay(text, ms)` | 11909 | Temporarily override mascot text |
| `calcTrainingScore()` | 12324 | Score 0–100 based on recent training |
| `calcRecompScore()` | 12359 | Body recomposition score |
| `coachSwitchTab(tab, btn)` | 12038 | Switch between coach sub-tabs |

### ⏱ Rest Timer
| Function | Line | Description |
|---|---|---|
| `restFabTap()` | 6203 | FAB circle: idle tap = open presets, running = stop |
| `restFabPreset(s)` | 6214 | Start timer with preset seconds |
| `_restFabUpdate()` | 6179 | Update FAB display (ring, countdown) |
| `hdrRestToggle()` | 6086 | Toggle rest timer start/stop |
| `hdrSetRest(s)` | 6080 | Set rest timer duration |
| `_hdrRestRender()` | 6061 | Render rest countdown in FAB |
| `_restToastShow/Hide/Update()` | 6124 | Toast notification when minimised |
| `_restDoneNotif()` | 6169 | Vibration + sound on timer done |

### 🎮 XP / Gamification
| Function | Line | Description |
|---|---|---|
| `calcXP()` | 11295 | Recompute total XP from all sources |
| `getCurrentLevel(xp)` | 11312 | Return level object for XP value |
| `updateXPBar()` | 11332 | Update XP bar + rank display in UI |
| `checkAchievements()` | 11370 | Scan for newly unlocked achievements |
| `showAchievement(a)` | 11386 | Pop achievement notification |
| `renderMissions()` | 11400 | Render current missions panel |
| `_updateMissionBanner(missions)` | 11580 | Update mission progress banner |
| `_checkLevelUp()` | 16017 | Post-save: check if new level reached |
| `showLevelUp(rankName, icon)` | 14957 | Full-screen level-up celebration |
| `calcStreak()` | 8473 | Count consecutive training days |

### 💧 Water / Steps / Hydration
| Function | Line | Description |
|---|---|---|
| `hdrAddWater(e)` | 6322 | Tap a water cup to fill it |
| `hdrUndoWater(e)` | 6379 | Undo last water entry |
| `_updateHdrWater()` | 6249 | Refresh water display in header |
| `initWater()` | 8550 | Initialise water state for today |
| `toggleWater(i)` | 8568 | Toggle specific cup |
| `logSteps(amount, btn)` | 15256 | Add steps, trigger XP/milestone |
| `_updateHdrSteps()` | 6271 | Refresh steps display in header |
| `renderStepsPanel()` | 15317 | Full steps panel render |
| `_renderStepsHistory(lang)` | 15392 | Steps history chart |
| `saveSteps()` | 15186 | Save steps to localStorage |
| `_showStepMilestone(ms, ar)` | 15205 | Celebration when step goal hit |
| `togglePedometer()` | 15573 | Enable/disable device pedometer |

### 🎵 Sound Engine (Script Block 2)
| Function | Line | Description |
|---|---|---|
| `sndTap()` | 14594 | UI tap sound |
| `sndSetLog()` | 14600 | Set logged confirmation beep |
| `sndSave()` | 14607 | Workout saved fanfare |
| `sndPR()` | 14614 | PR celebration sound |
| `sndLevelUp()` | 14626 | Level-up jingle |
| `sndThemeSwitch()` | 14638 | Theme change whoosh |
| `sndTimerDone()` | 14655 | Rest timer alarm |
| `sndTick(urgent)` | 14664 | Timer tick (urgent = red zone) |
| `sndWaterDrop()` | 14691 | Water cup fill drip |
| `sndStep()` | 14723 | Step tap |
| `sndStepGoal()` | 14743 | Step goal reached fanfare |
| `sndMilestone()` | 14756 | General milestone sound |
| `toggleSound()` | 14771 | Toggle all sounds on/off |
| `addRipple(el, e)` | 14793 | Material ripple effect on tap |
| `spawnParticles(x,y,n,colors)` | 14851 | Particle burst FX |
| `burstSave()` / `burstPR(btn)` | 14916 | Particle burst on save / PR |
| `flashSave()` / `flashPR()` | 14935 | Screen flash animation |

### 🌐 i18n / Language (Script Block 3)
| Function | Line | Description |
|---|---|---|
| `t(key)` | 17069 | Translate key → current language string |
| `toggleLanguage()` | 17073 | EN ↔ AR switch |
| `applyLanguage()` | 17079 | Apply all translations to DOM |
| `translateDynamicElements()` | 17200 | Translate dynamically generated HTML |
| `updateNavLabels()` | 17332 | Translate bottom nav labels |

### ⚙️ Settings / Import / Export
| Function | Line | Description |
|---|---|---|
| `loadSettings()` | 10754 | Load settings from localStorage to UI |
| `saveSetting(key, val)` | 10751 | Save one setting key |
| `toggleLightMode(on)` | 10767 | Toggle solar (light) theme |
| `exportCSV()` | 10783 | Export workouts as CSV |
| `exportJSON()` | 10963 | Export all data as JSON |
| `importJSON(input)` | 10981 | Import from FORGE JSON backup |
| `importStrongHevy(input)` | 10998 | Import from Strong / Hevy CSV |
| `importAppleHealth(input)` | 11110 | Import from Apple Health XML export |
| `applyTheme(id, accent)` | 13526 | Apply theme + accent colour |
| `renderThemePicker()` | 13560 | Render theme picker grid |
| `applyCustomBg(hex)` | 13616 | Set custom background colour |
| `saveProfile()` | 13654 | Save user profile (name, age, weight) |
| `renderProfile()` | 13679 | Render profile form |

### 📐 Layout Editor
| Function | Line | Description |
|---|---|---|
| `toggleEditMode()` | 15903 | Enter/exit section drag-reorder mode |
| `enterEditMode()` | 15907 | Show drag handles, enable reorder |
| `exitEditMode()` | 15920 | Save layout, hide handles |
| `toggleSectionHidden(id)` | 15934 | Show/hide a log section |
| `moveSectionUp/Down(id)` | 15944 | Reorder log sections |
| `saveLayout()` | 15865 | Persist section order to localStorage |
| `applyLayout()` | 15875 | Apply saved section order on load |

### 🏃 Body Composition / Body Weight
| Function | Line | Description |
|---|---|---|
| `logBodyWeight()` | 8487 | Quick BW log (from log view) |
| `logBodyWeightAndRefresh()` | 13845 | BW log + refresh comp chart |
| `renderBcompChart(type)` | 13876 | Render weight/fat/muscle chart |
| `renderCompCards()` | 14207 | BMI / FFMI stat cards |
| `switchBcompChart(type, btn)` | 13869 | Switch chart between weight/fat/muscle |

### 🏆 Training Programs
| Function | Line | Description |
|---|---|---|
| `renderProgramPanel()` | 8696 | Render program cards (PPL / 5/3/1 / 5×5) |
| `activateProgram(id)` | 8737 | Set active program in localStorage |
| `deactivateProgram()` | 8750 | Clear active program |
| `startProgramWorkout()` | 8759 | Pre-fill log for today's program day |
| `_getProgramDayIndex()` | 8685 | Calculate current day in program cycle |

### 💬 Session Summary
| Function | Line | Description |
|---|---|---|
| `startWorkoutSession()` | 5919 | Begin timed session |
| `endWorkoutSession()` | 5946 | End session, show summary overlay |
| `_showSessionSummary(duration)` | 6000 | Build + show post-workout summary card |
| `shareSession()` | 6044 | Share session card via Web Share API |
| `closeSessionSummary()` | 6054 | Close summary overlay |
| `_initSessionCard()` | 5852 | Init session pill in header |
| `_updateSessionCard()` | 5881 | Update session duration display |

### 🧮 Utilities
| Function | Source | Description |
|---|---|---|
| `showToast(msg, type)` | index.html ~11187 | Bottom toast notification |
| `showConfirm(title, msg, fn)` | index.html ~11240 | Confirmation dialog |
| `download(filename, content, mime)` | index.html ~11165 | Trigger file download |
| `_roundRect(ctx,x,y,w,h,r)` | index.html ~7660 | Canvas rounded rect helper |
| `hexToRgba(hex, alpha)` | index.html ~13920 | Hex colour → rgba string |
| `_isoKey(d)` | index.html ~10308 | Date → YYYY-MM-DD string |
| `_getWeekKey(d)` | index.html ~9538 | Date → week key string |
| `today()` | index.html ~5790 | Returns `new Date().toDateString()` |
| `save()` | index.html ~5792 | Persist all global arrays to localStorage + IDB |
| `calcXP()` | index.html ~11295 | Total XP from workouts + checkins + steps |
| `_calcEpley1RM(weight, reps)` | index.html ~9335 | Epley formula: estimated 1RM |
| `calcQualityScore(workout)` | index.html ~15643 | Rate workout quality 0–100 |
| `_esc(str)` | js/storage.js → aliased in index.html | HTML entity encoder for `innerHTML` — use for ALL user-controlled strings in templates |
| `runMigrations()` | js/storage.js → called at index.html startup | localStorage schema migration runner; writes `forge_schema_version` |

---

## 7. CSS ARCHITECTURE

CSS is inline in `<style>` block, lines **23–4146** (~3,300 lines).

### Major CSS sections
| Lines (approx) | Section |
|---|---|
| 23–80 | CSS variables (`:root`): `--accent`, `--bg`, `--card`, `--text1/2/3`, `--border`, `--surface` |
| 80–140 | Reset + base typography |
| 141–220 | Bottom nav `.bnav` |
| 221–350 | Views `.view`, transitions |
| 351–450 | Log sections, set rows |
| 451–520 | Muscle chips `.muscle-chip` |
| 516–530 | **Muscle heatmap** `.heatmap-svg`, `.hz` (no fill in class — uses inline style) |
| 526–620 | **Muscle detail modal** `.mdc-*` classes |
| 621–750 | Stats dashboard tabs `.dash-tab-strip` |
| 751–900 | Charts containers |
| 901–1050 | History view `.hist-*`, session cards `.session-card` |
| 1051–1200 | Coach panel `.coach-panel`, coach tabs |
| 1201–1350 | XP bar, achievement notification |
| 1351–1500 | Rest timer FAB `.rest-fab`, popover `.rest-fab-panel` |
| 1501–1650 | Floating buttons (sound toggle, lang toggle, rest FAB) |
| 1651–1800 | Modals: exercise library, wheel picker |
| 1801–2000 | Calendar `.cal-*` |
| 2001–2200 | Themes: `.solar`, `.obsidian`, accent overrides |
| 2201–2400 | Share card, session summary |
| 2401–2600 | Profile, body comp |
| 2601–2800 | Settings, More view |
| 2801–3000 | Overview snapshot `.overview-snapshot`, `.snap-*` |
| 3001–3300 | Media queries, mobile fixes, safe area |
| 3300–4146 | PWA install banner, misc components |

### Theming system
- Default dark: `forge` theme — variables in `:root`
- Solar (light): `.solar` class on `<html>` overrides variables
- Custom accent: `--accent` CSS var set by `applyTheme()`
- Custom BG: `--bg` and `--card` set by `applyCustomBg()`

### Critical specificity rules
- `.heatmap-svg .hz` — **no `fill` property** — inline `style="fill:${c}"` on each `<path>` controls colour
- Do NOT add `fill:` back to `.hz` CSS rule or heatmap colours will break

---

## 8. DATA SCHEMAS

### Workout object
```js
{
  id:           string,       // unique ID (Date.now().toString())
  date:         string,       // ISO 8601: "2026-03-06T14:32:00.000Z"
  muscle:       string,       // "Chest" | "Back" | "Shoulders" | "Biceps" | "Triceps"
                              // "Core" | "Legs" | "Glutes" | "Calves" | "Forearms"
                              // "Traps" | "Lower Back"
  exercise:     string,       // Exercise name, e.g. "Bench Press"
  sets:         SetRow[],     // Array of set objects
  totalVolume:  number,       // Sum of (reps × weight) across all sets
  isPR:         boolean,      // True if new personal record
  effort:       number,       // 1–5 effort rating
  angle:        string|null,  // "Incline" | "Decline" | "Flat" | null
  mode:         string,       // "weighted" | "bodyweight"
}
```

### SetRow object
```js
{
  id:     string,   // unique set ID
  reps:   number,
  weight: number,
  unit:   string,   // "kg" | "lbs"
  type:   string,   // "normal" | "warmup" | "dropset" | "amrap"
}
```

### BodyWeight entry
```js
{
  date:   string,   // ISO date string
  weight: number,   // in kg
  unit:   string,   // "kg" | "lbs"
  fat:    number|null,    // body fat %
  muscle: number|null,    // muscle mass %
}
```

### Template
```js
{
  id:       string,
  name:     string,
  muscle:   string,
  exercise: string,
  sets:     SetRow[],
}
```

### Settings
```js
{
  defaultUnit: "kg" | "lbs",
  sound:       boolean,
  showHint:    boolean,
  // ...other UI prefs
}
```

---

## 9. KEY UI COMPONENTS

### Bottom Navigation
- 5 tabs: Workout | Stats | History | More | Coach
- Selector: `.bnav-btn[data-view]`
- Switch function: `switchView(name, btn)` — line 6688

### Muscle Chips (Log view)
- 12 chips in 2 rows above the body map
- Call `_chipSelect(muscleName)` on tap
- Active chip: `.muscle-chip.active`
- Body map toggle: `_toggleBodyMap(btn)` — SVG collapses by default

### Floating Buttons (bottom-right stack)
```
z-index: 200, right: 14px
└── .sound-toggle      bottom: calc(72px + --safe-bot)   34×34px
└── .lang-toggle-float bottom: calc(112px + --safe-bot)  34×34px  [EN/AR]
└── .rest-fab          bottom: calc(152px + --safe-bot)  34×34px  [rest timer]
    └── .rest-fab-panel  bottom: calc(192px + --safe-bot) [preset popover]
```

### Muscle Heatmap SVG
- Element: `#muscle-heatmap-body`
- Two SVGs side by side: FRONT + BACK, each 130px wide, viewBox 0 0 200 390
- Each `<path class="hz">` has `style="fill:${c}"` (inline) + `data-muscle` + `onclick`
- Colors: `#e74c3c` (0–2d) → `#e67e22` (3–5d) → `#f1c40f` (6–10d) → `#2ecc71` (11–20d) → `#1a2e1a` (21+/never)
- Always uses `workouts` (all-time) — NOT period-filtered (recovery is always all-time)

### Muscle Detail Modal
- Element: `#muscle-detail-modal` — fixed overlay, bottom sheet slide-up
- Open: `_openMuscleDetail(muscle)` 
- Close: `_closeMuscleDetail()` or tap overlay or press Escape
- Contains: recovery badge, last session exercises, stats row, volume delta, Train Now + Share buttons

### Rest Timer FAB
- Idle: tap to open preset panel (60s / 90s / 120s / 180s / 3m / 5m)
- Running: shows countdown ring, tap to stop
- `_hdrRestRunning` — boolean state
- `_hdrRestSecs` — current seconds remaining
- `_hdrRestInterval` — setInterval handle

---

## 10. EXTERNAL DEPENDENCIES

| Dependency | Version | Load | Used for |
|---|---|---|---|
| Chart.js | 4.4.0 | CDN (line 20) | All charts (bar, line, radar, doughnut) |
| *(everything else)* | — | None | Vanilla JS, CSS3, Web Audio API |

**Offline note:** Chart.js is now **pre-cached on SW install** (not just opportunistically). The service worker fetches it with `cache: 'reload'` during install so charts work offline after the first online load. Runtime CDN fetch is network-first with cache fallback → 503 if both fail.
SW cache name: `forge-v20`. Bumping `CACHE_NAME` in `sw.js` forces a full cache refresh on next load.

---

## 11. KNOWN PATTERNS & CONVENTIONS

### How to add a new feature
1. **HTML:** Add inside the relevant `<div id="view-*">` section
2. **CSS:** Add styles in the `<style>` block, grouped near related rules
3. **JS:** Add function to Script Block 1 (lines 5613–14515)
4. **Verify:** Run `node check.js` → must show `Scripts OK: 5  Failed: 0`

### Patch script pattern (for large changes)
```js
// patch.js pattern:
const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace('OLD_STRING', 'NEW_STRING');
fs.writeFileSync('index.html', html);
// Always run via: C:\Windows\System32\cmd.exe /c "\"C:\Program Files\nodejs\node.exe\" patch.js"
```

### Running Node on this machine
```
Node path: C:\Program Files\nodejs\node.exe
Run via:   & "C:\Program Files\nodejs\node.exe" "script.js"   (PowerShell — output to result file)
Output:    Write to file inside script: fs.writeFileSync(OUT, log.join('\n'))
           Then: Get-Content "_result.txt"
```

### Modular file editing pattern (post-2026-03-07)
```
CSS changes    → edit css/main.css directly
Exercise data  → edit js/exercises.js directly (EXERCISE_DB array + TRAINING_PROGRAMS)
Translations   → edit js/i18n.js directly (LANGS object)
App logic      → edit index.html Script Block 1 (lines 1609–9816)
Sound engine   → edit index.html Script Block 2 (lines 9865–11598)
New features   → add to appropriate file; update sw.js CORE_ASSETS if new file added
```

### save() function — always call after data mutations
`save()` at line 5792 persists `workouts`, `bodyWeight`, `templates`, `settings`, `waterToday`.
After saving, call `postSaveHooks()` for XP/mission/achievement updates.
`postSaveHooks()` has a re-entrancy guard (`_postSaveRunning` flag) — safe to call from multiple paths.

### XSS protection — always use `_esc()` in innerHTML templates
```js
// BAD — injects raw user input:
el.innerHTML = `<span>${workout.exercise}</span>`;

// GOOD — safe:
el.innerHTML = `<span>${_esc(workout.exercise)}</span>`;
```
`_esc` is aliased from `window.FORGE_STORAGE.esc` at the top of the main script block.
**Rule:** any user-controlled string (exercise name, muscle name, custom template name, etc.) inserted into `innerHTML` must be wrapped in `_esc()`.
Numbers, controlled enums (`s.unit`, `s.type`), and locale-formatted strings (`.toLocaleString()`) are safe without escaping.

### Schema migration pattern
```js
// Bump SCHEMA_VERSION in js/storage.js when localStorage payload shapes change.
// Add a migration block inside runMigrations() for each version step:
if (stored < 2) {
  // migrate data from v1 → v2
}
// runMigrations() is called once at app startup from the main script block.
```

### Period filtering pattern
```js
// Always filter with helper:
const _pw = _filterWorkoutsByPeriod(workouts, _dashPeriod);
// Heatmap always uses workouts (all-time), not _pw
renderBodyHeatmap(workouts);
```

### i18n pattern
```js
// Static HTML: use data-i18n="key" attribute
// Dynamic JS: use t('key') function
// Arabic RTL: check _ar boolean
```

### CSS variable usage
```css
var(--accent)     /* primary highlight colour */
var(--bg)         /* page background */
var(--card)       /* card/panel background */
var(--surface)    /* slightly lighter than --card */
var(--text1)      /* primary text */
var(--text2)      /* secondary text */
var(--text3)      /* muted/label text */
var(--border)     /* divider/stroke colour */
```

---

## 12. CHANGE LOG

| Date | Session | Changes |
|---|---|---|
| 2026-02-28 | Initial analysis | First audit of codebase |
| 2026-03-02 | Rest timer sprint | Moved rest timer from header to floating FAB circle |
| 2026-03-06 | Feature sprint | 10 features: inputmode, set types, exercise DB, custom theme, Strong/Hevy import, IndexedDB, heatmap, wheel picker, training programs, Apple Health import |
| 2026-03-06 | UX revamp plan | Plan file created: 9 changes (Coach tab, muscle chips, copy last set, sticky save, bigger rows, stats tabs, period selector, session grouping, compact filter) |
| 2026-03-06 | Stats overview fix | Fixed stat cards to use period-filtered `_pw`; heatmap always uses `workouts` (all-time); Quick Snapshot bar added; Overview snapshot CSS + JS |
| 2026-03-06 | Heatmap interactive | **Fixed CSS override bug** (removed `fill:` from `.hz` class, now uses inline `style="fill:${c}"`); Added `data-muscle` + `onclick` to all SVG paths; Built `_openMuscleDetail()` bottom-sheet modal (recovery badge, last session exercises, stats, volume delta); Built `_shareMuscleCard()` + `_buildShareText()` (Web Share API + clipboard fallback); Added modal HTML `#muscle-detail-modal` + all `.mdc-*` CSS |
| 2026-03-07 | Modularisation | **Extracted CSS → `css/main.css`** (4,004 lines); **Extracted `EXERCISE_DB` + `TRAINING_PROGRAMS` → `js/exercises.js`** (695 lines); **Extracted `LANGS` + i18n functions → `js/i18n.js`** (1,416 lines); index.html reduced from 17,925 → **11,809 lines** (−6,116); sw.js bumped to `forge-v3` with new assets cached; `check.js` passes: Scripts OK: 5  Failed: 0 |
| 2026-03-10 | Security & stability fixes | **serve.js:** localhost-only guard for POST /save-icons; path traversal guard `_safePath()`; bind to 127.0.0.1 only; removed filesystem path from 404 response. **js/storage.js:** added `esc(str)` HTML entity encoder + `SCHEMA_VERSION` + `runMigrations()`; both exported on `FORGE_STORAGE`. **index.html:** aliased `_esc = FORGE_STORAGE.esc`; called `runMigrations()` at startup; applied `_esc()` to 3 innerHTML XSS risks (exercise name, exName in history, muscle name); added `_postSaveRunning` re-entrancy guard to `postSaveHooks()`. **sw.js:** Chart.js CDN pre-cached on install; cache fallback for offline CDN fetch (was network-only); bumped to `forge-v20`. Plan doc: `docs/plans/2026-03-10-issues-fix-plan.md`. |

---

> **Next time you open this project:** Read this file first, then check `MEMORY.md` for session-specific notes.  
> **After every session:** Add a row to the Change Log above and update any function line numbers that shifted.
