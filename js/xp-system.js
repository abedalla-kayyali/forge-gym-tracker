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
  // Cardio XP
  xp += (typeof cardioLog !== 'undefined' ? cardioLog : []).reduce((a, e) => a + (e.xpEarned || 0), 0);
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
  var _xpFill = document.getElementById('xp-fill');
  var _oldPct = _xpFill ? parseFloat(_xpFill.style.width) || 0 : 0;
  if (_xpFill) _xpFill.style.background =
    `linear-gradient(90deg, #1a7a3f, ${lvl.color || '#2ecc71'}, #39ff8f)`;
  // v239: animated XP bar fill
  animateXPBar(_oldPct, pct, pct >= 100 ? function() {
    if (typeof showLevelUp === 'function') showLevelUp(lvl);
  } : null);
  if (typeof _updateMascot === 'function') _updateMascot();
}

// v239: animated XP bar fill
var _xpRafHandle = null;
function animateXPBar(fromPct, toPct, onLevelUp) {
  var bar = document.getElementById('xp-fill');
  if (!bar) return;
  if (_xpRafHandle) { cancelAnimationFrame(_xpRafHandle); _xpRafHandle = null; }
  var duration = 600;
  var start = null;
  function step(ts) {
    if (!start) start = ts;
    var t = Math.min((ts - start) / duration, 1);
    var ease = 1 - Math.pow(1 - t, 3);
    var cur = fromPct + (toPct - fromPct) * ease;
    bar.style.width = cur + '%';
    if (t < 1) { _xpRafHandle = requestAnimationFrame(step); return; }
    _xpRafHandle = null;
    if (toPct >= 100 && onLevelUp) {
      bar.classList.add('xp-overflow-flash');
      setTimeout(function() {
        bar.classList.remove('xp-overflow-flash');
        bar.style.width = '0%';
        if (typeof onLevelUp === 'function') onLevelUp();
      }, 350);
    }
  }
  _xpRafHandle = requestAnimationFrame(step);
}
window.animateXPBar = animateXPBar;

// v239: streak at-risk detection
function checkStreakAtRisk() {
  var streakEl = document.querySelector('.hdr-streak-pill');
  if (!streakEl) return;
  var now = new Date();
  var isEvening = now.getHours() >= 18;
  var workoutList = [];
  try {
    workoutList = JSON.parse(localStorage.getItem('forge_workouts') || '[]')
      .concat(JSON.parse(localStorage.getItem('forge_bw_workouts') || '[]'));
  } catch(e) {}
  var today = now.toDateString();
  var workedOutToday = workoutList.some(function(w) {
    return new Date(w.date || w.timestamp || w.savedAt || 0).toDateString() === today;
  });
  streakEl.classList.toggle('streak-at-risk', isEvening && !workedOutToday);
}
window.checkStreakAtRisk = checkStreakAtRisk;
// Run on load and every 5 minutes
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() { checkStreakAtRisk(); });
} else {
  checkStreakAtRisk();
}
setInterval(checkStreakAtRisk, 5 * 60 * 1000);
