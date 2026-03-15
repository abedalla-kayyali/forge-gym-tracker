const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const requiredFiles = [
  'index.html',
  'manifest.json',
  'sw.js',
  'css/main.css',
  'js/storage.js',
  'js/community-library.js',
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
const dataTransferPath = path.join(ROOT, 'js', 'data-transfer.js');
const dataActionsPath = path.join(ROOT, 'js', 'data-actions.js');
const onboardingPath = path.join(ROOT, 'js', 'onboarding-controls.js');
const duelsPath = path.join(ROOT, 'js', 'duels.js');
const fxHapticPath = path.join(ROOT, 'js', 'fx-haptic.js');
const shareHelpersPath = path.join(ROOT, 'js', 'share-helpers.js');
if (fs.existsSync(indexPath)) {
  const html = fs.readFileSync(indexPath, 'utf8');

  const requiredSnippets = [
    '<script src="js/storage.js"></script>',
    '<script src="js/community-library.js"></script>',
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

  const removedStartupSnippets = [
    '_onboardingCheck();',
    'id="forge-onboarding"',
    'id="forge-tour"',
    'id="forge-spotlight"'
  ];
  removedStartupSnippets.forEach((snippet) => {
    if (html.includes(snippet)) fail('Legacy first-run startup snippet still present: ' + snippet);
  });

  const requiredSetupSnippets = [
    'id="profile-setup-card"',
    'id="coach-goal-setup-card"'
  ];
  requiredSetupSnippets.forEach((snippet) => {
    if (!html.includes(snippet)) fail('Missing setup prompt snippet in index.html: ' + snippet);
  });

  const requiredSocialSnippets = [
    'id="social-view"',
    'id="social-tab-hub"',
    'id="social-tab-friends"',
    'id="social-tab-compare"',
    'id="social-tab-duels"',
    'id="social-compare-muscle-modal"'
  ];
  requiredSocialSnippets.forEach((snippet) => {
    if (!html.includes(snippet)) fail('Missing social shell snippet in index.html: ' + snippet);
  });
}

if (fs.existsSync(fxSoundPath)) {
  const fx = fs.readFileSync(fxSoundPath, 'utf8');
  if (!fx.includes('window.playPrimaryActionFx')) fail('Missing shared primary action FX hook in js/fx-sound.js');
  if (!fx.includes('function sndSocialInvite()')) fail('Missing social invite sound in js/fx-sound.js');
  if (!fx.includes('function sndSocialAccept()')) fail('Missing social accept sound in js/fx-sound.js');
  if (!fx.includes('function sndSocialWin()')) fail('Missing social win sound in js/fx-sound.js');
}

if (fs.existsSync(fxHapticPath)) {
  const fxh = fs.readFileSync(fxHapticPath, 'utf8');
  if (!fxh.includes('function hapSocialInvite()')) fail('Missing social invite haptic in js/fx-haptic.js');
  if (!fxh.includes('function hapSocialAccept()')) fail('Missing social accept haptic in js/fx-haptic.js');
  if (!fxh.includes('function hapSocialWin()')) fail('Missing social win haptic in js/fx-haptic.js');
}

if (fs.existsSync(authUiPath)) {
  const auth = fs.readFileSync(authUiPath, 'utf8');
  if (!auth.includes('auth-submit-glow')) fail('Missing auth submit glow treatment in js/auth-ui.js');
}

if (fs.existsSync(dataTransferPath)) {
  const transfer = fs.readFileSync(dataTransferPath, 'utf8');
  if (!transfer.includes('forge_bw_custom_exercises')) fail('Missing bodyweight custom cards in backup transfer');
  if (!transfer.includes('forge_cardio_custom_types')) fail('Missing cardio custom cards in backup transfer');
}

if (fs.existsSync(dataActionsPath)) {
  const actions = fs.readFileSync(dataActionsPath, 'utf8');
  if (!actions.includes('cardioLog = []')) fail('Clear-all path does not clear cardio logs');
  if (!actions.includes('forge_bw_custom_exercises')) fail('Clear-all path does not clear bodyweight custom cards');
  if (!actions.includes('forge_cardio_custom_types')) fail('Clear-all path does not clear cardio custom cards');
}

if (fs.existsSync(onboardingPath)) {
  const onboarding = fs.readFileSync(onboardingPath, 'utf8');
  if (onboarding.includes('function _onboardingCheck')) fail('Legacy onboarding startup function still present');
}

if (fs.existsSync(duelsPath)) {
  const duels = fs.readFileSync(duelsPath, 'utf8');
  if (!duels.includes("table === 'profiles_public'")) fail('Duels profile publishing does not branch for profiles_public');
  if (!duels.includes("table === 'profiles'")) fail('Duels profile publishing does not branch for profiles table');
  if (!duels.includes('data: {')) fail('Duels profile publishing is missing profiles data payload fallback');
  if (!duels.includes('ensureReady')) fail('Duels module is missing readiness republish flow');
  if (!duels.includes('_searchUsers(q, { force: true })')) fail('Manual duel search does not force-refresh profile directory');
  if (!duels.includes("const matches = await _searchUsers(raw, { force: true });")) fail('Friend add input does not fall back to refreshed profile search');
  if (!duels.includes('muscleSummary')) fail('Duels public stats are missing muscle summary publishing');
  if (!duels.includes('muscleExerciseSummary')) fail('Duels public stats are missing muscle exercise summary publishing');
  if (!duels.includes('cardioSummary')) fail('Duels public stats are missing cardio summary publishing');
  if (!duels.includes('bodyweightSummary')) fail('Duels public stats are missing bodyweight summary publishing');
  if (!duels.includes('bodyweightExerciseSummary')) fail('Duels public stats are missing bodyweight exercise rivalry publishing');
  if (!duels.includes('cardioActivitySummary')) fail('Duels public stats are missing cardio activity rivalry publishing');
  if (!duels.includes('socialShareStats')) fail('Duels profile is missing social share-stats toggle support');
}

const socialUiPath = path.join(ROOT, 'js', 'social-ui.js');
const communityLibraryPath = path.join(ROOT, 'js', 'community-library.js');
const exercisesPath = path.join(ROOT, 'js', 'exercises.js');
const bodyweightPath = path.join(ROOT, 'js', 'bodyweight-mode.js');
const dashboardHistoryPath = path.join(ROOT, 'js', 'dashboard-history.js');
const coachStatePath = path.join(ROOT, 'js', 'coach-state.js');
if (fs.existsSync(indexPath)) {
  const html = fs.readFileSync(indexPath, 'utf8');
  if (!html.includes('<script src="js/social-ui.js"></script>')) fail('Missing social UI script include in index.html');
}

if (fs.existsSync(communityLibraryPath)) {
  const community = fs.readFileSync(communityLibraryPath, 'utf8');
  if (!community.includes('community_exercises')) fail('Missing shared exercise catalog hook');
  if (!community.includes('community_meals')) fail('Missing shared meal catalog hook');
  if (!community.includes('addCommunityExercise')) fail('Missing shared exercise create hook');
  if (!community.includes('addCommunityMeal')) fail('Missing shared meal create hook');
}

if (fs.existsSync(exercisesPath)) {
  const exercises = fs.readFileSync(exercisesPath, 'utf8');
  if (!exercises.includes('Workout not found? Add it')) fail('Missing weighted workout miss-state add CTA');
  if (!exercises.includes('communityExercises')) fail('Missing weighted shared exercise merge hook');
}

if (fs.existsSync(bodyweightPath)) {
  const bodyweight = fs.readFileSync(bodyweightPath, 'utf8');
  if (!bodyweight.includes('_bwSetStreak')) fail('Missing bodyweight live set streak state');
  if (!bodyweight.includes('_bwBestRun')) fail('Missing bodyweight best run state');
  if (!bodyweight.includes('bw-set-streak')) fail('Missing bodyweight streak UI hook');
}
if (fs.existsSync(dashboardHistoryPath)) {
  const dash = fs.readFileSync(dashboardHistoryPath, 'utf8');
  if (!dash.includes('prg-ready-dashboard')) fail('Readiness dashboard shell is missing');
  if (!dash.includes('prg-ready-tile-grid')) fail('Readiness decomposition tile grid is missing');
  if (!dash.includes('prg-ready-contribs')) fail('Readiness contribution rail is missing');
  if (!dash.includes('prg-ready-insights')) fail('Readiness insight rail is missing');
  if (!dash.includes('Cardio Support')) fail('Readiness cardio support metric is missing');
  if (!dash.includes('Momentum')) fail('Readiness momentum metric is missing');
}
if (fs.existsSync(coachStatePath)) {
  const coachState = fs.readFileSync(coachStatePath, 'utf8');
  if (!coachState.includes('coach-command-deck')) fail('Coach premium command deck is missing');
  if (!coachState.includes('coach-signal-board')) fail('Coach premium signal board is missing');
  if (!coachState.includes('coach-action-lane')) fail('Coach premium action lane is missing');
}
if (fs.existsSync(socialUiPath)) {
  const socialUi = fs.readFileSync(socialUiPath, 'utf8');
  if (!socialUi.includes('window.FORGE_SOCIAL')) fail('Missing FORGE_SOCIAL global in js/social-ui.js');
  if (socialUi.includes('onclick="window.FORGE_SOCIAL.addFoundFriend(\' + id + \')"')) fail('Social UI still renders invalid inline add-friend onclick HTML');
  if (socialUi.includes('onclick="window.FORGE_SOCIAL.startDuel(\' + id + \',\\\'workout\\\')"')) fail('Social UI still renders invalid inline duel onclick HTML');
  if (socialUi.includes('onclick="if(window.FORGE_DUELS){window.FORGE_DUELS.acceptInvite(\' + JSON.stringify(invite.id) + \');} window.FORGE_SOCIAL.refresh();"')) fail('Social UI still renders invalid inline invite onclick HTML');
  if (!socialUi.includes("compareView: 'body'")) fail('Social compare view is missing compare-depth subview state');
  if (!socialUi.includes('social-compare-subtabs')) fail('Social compare depth tabs are missing');
  if (!socialUi.includes('toggleShareStats')) fail('Social UI is missing share-stats toggle action');
  if (!socialUi.includes('openMuscleCompare')) fail('Social UI is missing muscle compare detail action');
  if (!socialUi.includes('social-muscle-exercise-list')) fail('Social muscle compare is missing exercise leaderboard hook');
  if (!socialUi.includes('social-premium-table')) fail('Social compare is missing premium table hook');
  if (!socialUi.includes('social-capsule-board')) fail('Social compare is missing capsule body board hook');
  if (!socialUi.includes('social-sortbar')) fail('Social compare is missing sort-bar hook');
  if (!socialUi.includes('_socialTx')) fail('Social compare is missing localized label helper');
  if (!socialUi.includes('closeCompareSheet')) fail('Social compare is missing unified sheet close action');
  if (!socialUi.includes('social-body-rival-header')) fail('Social body compare is missing rivalry header hook');
  if (!socialUi.includes('social-spotlight-rail')) fail('Social body compare is missing spotlight rail hook');
  if (!socialUi.includes('social-rivalry-list')) fail('Social compare is missing rivalry list hook');
  if (!socialUi.includes('social-rivalry-delta')) fail('Social compare is missing rivalry delta hook');
  if (!socialUi.includes('openCardioRivalry')) fail('Social compare is missing cardio rivalry detail action');
  if (!socialUi.includes('openBodyweightRivalry')) fail('Social compare is missing bodyweight rivalry detail action');
  if (!socialUi.includes('Capsule-only muscle control board')) fail('Social compare body board did not switch to capsule-only mode');
  if (socialUi.includes('bodyShellMode')) fail('Social compare still contains removed body shell mode state');
  if (socialUi.includes('toggleBodyShellMode')) fail('Social compare still contains removed body shell mode toggle');
} else {
  fail('Missing file: js/social-ui.js');
}

if (fs.existsSync(shareHelpersPath)) {
  const shareHelpers = fs.readFileSync(shareHelpersPath, 'utf8');
  if (shareHelpers.includes('slice(0, 6)')) fail('Session poster still truncates logs to the first six entries');
  if (!shareHelpers.includes('_groupSessionLogs')) fail('Session poster is missing grouped session log helper');
  if (!shareHelpers.includes('SESSION BREAKDOWN')) fail('Session poster is missing grouped breakdown heading');
}

if (failures > 0) {
  console.error('[smoke] Failed checks:', failures);
  process.exit(1);
}

console.log('[smoke] All checks passed.');
