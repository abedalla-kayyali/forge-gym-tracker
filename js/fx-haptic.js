// FORGE Haptic Feedback Engine (Vibration API)
// Mirrors fx-sound.js structure — each function maps to a matching snd* call.
// hapticOn is the master gate; falls back silently if vibration not supported.

let hapticOn = (localStorage.getItem('forge_haptic') !== 'off');

function _vib(pattern) {
  if (!hapticOn) return;
  if (!('vibrate' in navigator)) return;
  try { navigator.vibrate(pattern); } catch (e) {}
}

/* 1. Light tap — button press, nav, toggles */
function hapTap() { _vib(10); }

/* 2. Set logged — satisfying double-pulse */
function hapSetLog() { _vib([15, 10, 30]); }

/* 3. Workout saved — solid double thump */
function hapSave() { _vib([30, 20, 60]); }

/* 4. PR — building celebration burst */
function hapPR() { _vib([50, 30, 100, 40, 200]); }

/* 5. Level up — epic rumble sequence */
function hapLevelUp() { _vib([80, 40, 80, 40, 160, 40, 80]); }

/* 6. Timer done — triple alert pulse */
function hapTimerDone() { _vib([100, 80, 100, 80, 100]); }

/* 7. Error — short sharp buzz */
function hapError() { _vib([20, 10, 20]); }

/* 8. Water logged — single liquid drop */
function hapWater() { _vib(20); }

/* 9. Water goal reached — celebration burst */
function hapWaterGoal() { _vib([100, 50, 100, 50, 200]); }

/* 10. Step logged — light bouncy double */
function hapStep() { _vib([80, 40, 80]); }

/* 11. Step goal reached — triumphant burst */
function hapStepGoal() { _vib([150, 50, 150, 50, 300]); }

/* 12. Milestone — ambient deep pulse */
function hapMilestone() { _vib([60, 30, 60]); }

/* Haptic toggle — called from settings checkbox */
function toggleHaptic(on) {
  hapticOn = on;
  localStorage.setItem('forge_haptic', on ? 'on' : 'off');
  if (on) hapTap(); // confirm it's working
}
