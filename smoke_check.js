const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const requiredFiles = [
  'index.html',
  'manifest.json',
  'sw.js',
  'css/main.css',
  'js/storage.js',
  'js/ghost-autocomplete.js',
  'js/feedback-ui.js',
  'js/recovery-plate.js',
  'js/program-panel.js',
  'js/rpe-swap.js',
  'js/template-manager.js',
  'js/dashboard-vol.js',
  'js/dashboard-balance.js',
  'js/dashboard-heatmap.js',
  'js/dashboard-freq.js',
  'js/dashboard-exercise-select.js',
  'js/settings-ui.js',
  'js/dashboard-weight-chart.js',
  'js/data-actions.js',
  'js/xp-system.js',
  'js/profile-avatar.js',
  'js/data-transfer.js',
  'js/achievements-ui.js',
  'js/coach-plan-controls.js',
  'js/share-helpers.js',
  'js/timer-controls.js',
  'js/bio-log.js',
  'js/custom-bg.js',
  'js/onboarding-controls.js',
  'js/checkin-actions.js',
  'js/icon-repair.js',
  'js/dashboard-history.js',
  'js/workout-save.js',
  'js/bodycomp-photos.js',
  'js/guide-compcards.js',
  'js/muscle-overlay.js',
  'js/fx-sound.js',
  'js/fx-visuals.js',
  'js/bodyweight-mode.js',
  'js/steps-health.js',
  'js/cali-dashboard.js',
  'js/ui-layout-theme.js',
  'js/muscle-detail-modal.js',
  'js/bootstrap.js',
  'js/exercises.js',
  'js/i18n.js',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

let failures = 0;

function fail(msg) {
  failures++;
  console.error('[smoke] ' + msg);
}

requiredFiles.forEach((rel) => {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) fail('Missing file: ' + rel);
});

const indexPath = path.join(ROOT, 'index.html');
const fxSoundPath = path.join(ROOT, 'js', 'fx-sound.js');
const authUiPath = path.join(ROOT, 'js', 'auth-ui.js');
if (fs.existsSync(indexPath)) {
  const html = fs.readFileSync(indexPath, 'utf8');

  const requiredSnippets = [
    '<script src="js/storage.js"></script>',
    '<script src="js/ghost-autocomplete.js"></script>',
    '<script src="js/feedback-ui.js"></script>',
    '<script src="js/recovery-plate.js"></script>',
    '<script src="js/program-panel.js"></script>',
    '<script src="js/rpe-swap.js"></script>',
    '<script src="js/template-manager.js"></script>',
    '<script src="js/dashboard-vol.js"></script>',
    '<script src="js/dashboard-balance.js"></script>',
    '<script src="js/dashboard-heatmap.js"></script>',
    '<script src="js/dashboard-freq.js"></script>',
    '<script src="js/dashboard-exercise-select.js"></script>',
    '<script src="js/settings-ui.js"></script>',
    '<script src="js/dashboard-weight-chart.js"></script>',
    '<script src="js/data-actions.js"></script>',
    '<script src="js/xp-system.js"></script>',
    '<script src="js/profile-avatar.js"></script>',
    '<script src="js/data-transfer.js"></script>',
    '<script src="js/achievements-ui.js"></script>',
    '<script src="js/coach-plan-controls.js"></script>',
    '<script src="js/share-helpers.js"></script>',
    '<script src="js/timer-controls.js"></script>',
    '<script src="js/bio-log.js"></script>',
    '<script src="js/custom-bg.js"></script>',
    '<script src="js/onboarding-controls.js"></script>',
    '<script src="js/checkin-actions.js"></script>',
    '<script src="js/icon-repair.js"></script>',
    '<script src="js/dashboard-history.js"></script>',
    '<script src="js/exercises.js"></script>',
    '<script src="js/bodycomp-photos.js"></script>',
    '<script src="js/guide-compcards.js"></script>',
    '<script src="js/muscle-overlay.js"></script>',
    '<script src="js/workout-save.js"></script>',
    '<script src="js/fx-sound.js"></script>',
    '<script src="js/fx-visuals.js"></script>',
    '<script src="js/bodyweight-mode.js"></script>',
    '<script src="js/steps-health.js"></script>',
    '<script src="js/cali-dashboard.js"></script>',
    '<script src="js/ui-layout-theme.js"></script>',
    '<script src="js/muscle-detail-modal.js"></script>',
    '<script src="js/bootstrap.js"></script>',
    '<script src="js/i18n.js"></script>',
    'function postSaveHooks()',
    'id="profile-avatar-modal"'
  ];

  requiredSnippets.forEach((snippet) => {
    if (!html.includes(snippet)) fail('Missing snippet in index.html: ' + snippet);
  });
}

if (fs.existsSync(fxSoundPath)) {
  const fx = fs.readFileSync(fxSoundPath, 'utf8');
  if (!fx.includes('window.playPrimaryActionFx')) fail('Missing shared primary action FX hook in js/fx-sound.js');
}

if (fs.existsSync(authUiPath)) {
  const auth = fs.readFileSync(authUiPath, 'utf8');
  if (!auth.includes('auth-submit-glow')) fail('Missing auth submit glow treatment in js/auth-ui.js');
}

if (failures > 0) {
  console.error('[smoke] Failed checks:', failures);
  process.exit(1);
}

console.log('[smoke] All checks passed.');
