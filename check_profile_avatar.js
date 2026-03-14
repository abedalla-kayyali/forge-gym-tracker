const path = require('path');

global.window = global;
global.currentLang = 'en';

const modPath = path.join(__dirname, 'js', 'profile-avatar.js');

try {
  require(modPath);
} catch (err) {
  console.error('[avatar-check] Unable to load module:', err.message);
  process.exit(1);
}

function assert(condition, message) {
  if (!condition) {
    console.error('[avatar-check] ' + message);
    process.exit(1);
  }
}

assert(typeof window.buildProfileAvatarState === 'function', 'buildProfileAvatarState should exist');
assert(typeof window._forgeAvatarSlotTier === 'function', '_forgeAvatarSlotTier should exist');
assert(typeof window.openProfileAvatarDetails === 'function', 'openProfileAvatarDetails should exist');
assert(typeof window.closeProfileAvatarDetails === 'function', 'closeProfileAvatarDetails should exist');
assert(typeof window.buildProfileAvatarPosterSvg === 'function', 'buildProfileAvatarPosterSvg should exist');
assert(typeof window.openProfileAvatarShare === 'function', 'openProfileAvatarShare should exist');
assert(typeof window.downloadProfileAvatarPoster === 'function', 'downloadProfileAvatarPoster should exist');
assert(typeof window.openProfileAvatarMuscleInspect === 'function', 'openProfileAvatarMuscleInspect should exist');
assert(typeof window.buildProfileAvatarMuscleInspectData === 'function', 'buildProfileAvatarMuscleInspectData should exist');
assert(typeof window.buildProfileAvatarToolState === 'function', 'buildProfileAvatarToolState should exist');
assert(typeof window.buildProfileAvatarCardBadges === 'function', 'buildProfileAvatarCardBadges should exist');
assert(typeof window.buildProfileAvatarSlotInspectData === 'function', 'buildProfileAvatarSlotInspectData should exist');
assert(typeof window.openProfileAvatarSlotInspect === 'function', 'openProfileAvatarSlotInspect should exist');
assert(typeof window.closeProfileAvatarSlotInspect === 'function', 'closeProfileAvatarSlotInspect should exist');

assert(window._forgeAvatarSlotTier(0.2) === 'none', 'score 0.2 should map to none');
assert(window._forgeAvatarSlotTier(0.5) === 'basic', 'score 0.5 should map to basic');
assert(window._forgeAvatarSlotTier(0.7) === 'elite', 'score 0.7 should map to elite');
assert(window._forgeAvatarSlotTier(0.9) === 'mythic', 'score 0.9 should map to mythic');

const beginner = window.buildProfileAvatarState(
  { name: 'Rookie', color: '#9acd32', icon: '*' },
  { chest: 0, back: 0, shoulders: 0, arms: 0, core: 0, legs: 0, posterior: 0, overall: 0 }
);
assert(beginner.rankTier === 'rookie', 'rookie rank tier expected');
assert(beginner.slots.legs === 'none', 'beginner legs should be none');
assert(typeof beginner.insight === 'string' && beginner.insight.length > 0, 'beginner insight should be present');

const balanced = window.buildProfileAvatarState(
  { name: 'Legend', color: '#f5b041', icon: '#' },
  { chest: 0.76, back: 0.84, shoulders: 0.73, arms: 0.68, core: 0.71, legs: 0.9, posterior: 0.82, overall: 0.78 }
);
assert(balanced.rankTier === 'legend', 'legend rank tier expected');
assert(balanced.slots.legs === 'mythic', 'balanced legs should be mythic');
assert(balanced.slots.back === 'elite', 'balanced back should be elite');

const topHeavy = window.buildProfileAvatarState(
  { name: 'Warrior', color: '#4fc3f7', icon: '@' },
  { chest: 0.82, back: 0.8, shoulders: 0.79, arms: 0.74, core: 0.61, legs: 0.18, posterior: 0.31, overall: 0.49 }
);
assert(topHeavy.slots.legs === 'none', 'top-heavy legs should be none');
assert(/Leg|Greaves/.test(topHeavy.insight), 'top-heavy insight should mention leg gap');

const tools = window.buildProfileAvatarToolState({
  weightedVolume: 180000,
  streakDays: 9,
  readiness: 81,
  cardioSessions: 7,
  recentPRs: 3
});
assert(Array.isArray(tools.list) && tools.list.length >= 4, 'tool state should expose a tool list');
assert(tools.map.hammer && tools.map.hammer.tier !== 'none', 'hammer should unlock from performance');
assert(tools.map.chain && tools.map.chain.tier !== 'none', 'chain should unlock from consistency');

const cardBadges = window.buildProfileAvatarCardBadges(balanced);
assert(Array.isArray(cardBadges), 'card badges should be an array');
assert(cardBadges.length > 0, 'card badges should include visible items');
assert(cardBadges.length <= 4, 'card badges should stay compact for the profile card');
assert(cardBadges.some((item) => item.kind === 'slot'), 'card badges should include slot summaries');

const poster = window.buildProfileAvatarPosterSvg(balanced, {
  mode: 'showcase',
  name: 'ABED',
  strongest: 'Legs',
  weakest: 'Arms'
});
assert(typeof poster === 'string' && poster.includes('<svg'), 'poster svg should be returned');
assert(poster.includes('ABED'), 'poster should include the name');
assert(poster.includes('data-forge-muscle="Chest"'), 'poster should expose clickable muscle targets');
assert(poster.includes('FORGE HAMMER') || poster.includes('STREAK CHAIN') || poster.includes('CORE REACTOR'), 'poster should include tool callouts');

const inspect = window.buildProfileAvatarMuscleInspectData('Chest', balanced);
assert(inspect && inspect.muscle === 'Chest', 'inspect data should resolve requested muscle');
assert(typeof inspect.currentLabel === 'string' && inspect.currentLabel.length > 0, 'inspect data should include current label');
assert(typeof inspect.nextTargetText === 'string' && inspect.nextTargetText.length > 0, 'inspect data should include next target text');

const slotInspect = window.buildProfileAvatarSlotInspectData('back', topHeavy);
assert(slotInspect && slotInspect.id === 'back', 'slot inspect should resolve requested armor slot');
assert(typeof slotInspect.whatCounts === 'string' && slotInspect.whatCounts.length > 0, 'slot inspect should include what counts guidance');
assert(typeof slotInspect.bestExercises === 'string' && slotInspect.bestExercises.length > 0, 'slot inspect should include best exercises');
assert(typeof slotInspect.quickWin === 'string' && slotInspect.quickWin.length > 0, 'slot inspect should include quick win guidance');
assert(typeof slotInspect.commonMistake === 'string' && slotInspect.commonMistake.length > 0, 'slot inspect should include common mistake guidance');
assert(typeof slotInspect.needText === 'string' && /\+/.test(slotInspect.needText), 'slot inspect should include missing progress text');

console.log('[avatar-check] All checks passed.');
