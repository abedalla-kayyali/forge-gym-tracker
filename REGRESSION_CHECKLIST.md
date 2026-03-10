# FORGE Regression Checklist

Use this checklist after each refactor phase.

## 1. Boot and Navigation
- App opens from `index.html` with no blank screen or blocking error.
- Main tabs switch correctly: Log, Stats, History, Coach, More.
- Language toggle (EN/AR) still updates visible labels.

## 2. Core Logging Flows
- Weighted workout save works end-to-end from form fill to success toast.
- Bodyweight workout save works end-to-end.
- Saved workouts appear in History immediately.
- PR detection still triggers when expected.

## 3. Dashboard and Stats
- Dashboard renders without chart crashes.
- Volume chart and body composition chart load with existing data.
- Header summary cards (streak/water/steps/stats) update after save.

## 4. Data and Persistence
- Refresh page: previously logged workouts still exist.
- Export CSV creates a file.
- Export JSON creates a backup file.
- Import JSON restores data correctly.
- Strong/Hevy CSV import accepts valid file and adds sessions.

## 5. PWA and Offline
- Service worker registers (when served via `http://localhost:8765`).
- App still opens after going offline once cache is warmed.
- `manifest.json` loads and icons are visible in install metadata.

## 6. Quick Sanity Commands
- `node check_v3.js`
- `node smoke_check.js`
- `node --check js/storage.js`
- `node --check serve.js`
