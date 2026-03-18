let _achTimeout = null;

function checkAchievements() {
  const unlocked = _lsGet('forge_achievements', []);
  const newUnlocks = [];
  ACHIEVEMENTS.forEach(a => {
    if (!unlocked.includes(a.id) && a.check()) {
      unlocked.push(a.id);
      newUnlocks.push(a);
    }
  });
  if (newUnlocks.length) {
    localStorage.setItem('forge_achievements', JSON.stringify(unlocked));
    // Show sequentially
    newUnlocks.forEach((a, i) => setTimeout(() => showAchievement(a), i * 3400));
  }
}

function showAchievement(a) {
  const popup = document.getElementById('achievement-popup');
  document.getElementById('ach-emoji').textContent = a.emoji;
  document.getElementById('ach-name').textContent = a.name;
  document.getElementById('ach-desc').textContent = a.desc;
  popup.classList.add('show');
  // Vibrate pattern
  if ('vibrate' in navigator) navigator.vibrate([100, 50, 100, 50, 200]);
  clearTimeout(_achTimeout);
  _achTimeout = setTimeout(() => popup.classList.remove('show'), 3200);
  // v239: achievement unlock FX
  var achievementEl = popup;
  if (window.fx) {
    fx.sound('sndPR');
    fx.haptic('hapPR');
    fx.burst('Save');
  } else {
    if (typeof sndPR === 'function') sndPR();
    if (typeof hapPR === 'function') hapPR();
    if (typeof burstSave === 'function') burstSave();
  }
  if (achievementEl) {
    achievementEl.classList.add('achievement-unlock-anim');
    setTimeout(function() { achievementEl.classList.remove('achievement-unlock-anim'); }, 700);
  }
}

function dismissAchievement() {
  clearTimeout(_achTimeout);
  const popup = document.getElementById('achievement-popup');
  if (popup) popup.classList.remove('show');
}
