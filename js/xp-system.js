function calcXP() {
  let xp = 0;
  xp += workouts.length * 10; // 10 XP per workout
  xp += workouts.filter(w => w.isPR).length * 25; // 25 XP per PR
  xp += Math.floor(workouts.reduce((a, w) => a + w.totalVolume, 0) / 1000); // 1 XP per 1000kg lifted
  xp += calcStreak() * 5; // 5 XP per streak day
  xp += workouts.reduce((a, w) => a + w.sets.length, 0) * 2; // 2 XP per set
  // BW workouts XP (inlined - no override needed)
  xp += (typeof bwWorkouts !== 'undefined' ? bwWorkouts : []).length * 8;
  xp += (typeof bwWorkouts !== 'undefined' ? bwWorkouts : []).filter(w => w.isPR).length * 20;
  // Steps XP (inlined)
  if (typeof calcStepXP === 'function') xp += calcStepXP();
  // Daily check-in bonus XP (cumulative, stored in profile)
  try { xp += JSON.parse(localStorage.getItem('forge_profile') || '{}').checkinXP || 0; } catch (e) {}
  return xp;
}

function getCurrentLevel(xp) {
  return LEVELS.slice().reverse().find(l => xp >= l.min) || LEVELS[0];
}

// Rank skins
const LEVEL_SKINS = {
  NEWCOMER: '',
  ROOKIE: '',
  IRON: 'skin-iron',
  BRONZE: 'skin-bronze',
  SILVER: 'skin-silver',
  GOLD: 'skin-gold',
  PLATINUM: 'skin-platinum',
  DIAMOND: 'skin-arcade',
  OBSIDIAN: 'skin-arcade',
  TITAN: 'skin-arcade',
  WARLORD: 'skin-arcade',
  MASTER: 'skin-arcade',
  GRANDMASTER: 'skin-legend',
  IMMORTAL: 'skin-legend',
  LEGEND: 'skin-legend'
};

function _applyRankSkin(levelName) {
  document.body.classList.forEach(c => {
    if (c.startsWith('skin-')) document.body.classList.remove(c);
  });
  const skin = LEVEL_SKINS[levelName] || '';
  if (skin) document.body.classList.add(skin);
}

function updateXPBar() {
  const xp = calcXP();
  const lvl = getCurrentLevel(xp);
  const next = LEVELS.find(l => l.min > xp);
  const pct = next ? Math.min(100, ((xp - lvl.min) / (lvl.max - lvl.min)) * 100) : 100;

  const _isAr = (typeof currentLang !== 'undefined') && currentLang === 'ar';
  const _rankName = _isAr ? (lvl.nameAr || lvl.name) : lvl.name;
  const _maxLabel = _isAr ? 'MAX' : 'MAX';
  document.getElementById('level-icon').textContent = lvl.icon;
  document.getElementById('level-name').textContent = _rankName;
  document.getElementById('xp-label').textContent = next ? `${xp} / ${lvl.max} XP` : `${xp} XP - ${_maxLabel}`;
  document.getElementById('xp-fill').style.width = pct + '%';
  document.getElementById('xp-fill').style.background =
    `linear-gradient(90deg, #1a7a3f, ${lvl.color || '#2ecc71'}, #39ff8f)`;
  if (typeof _updateMascot === 'function') _updateMascot();
}

