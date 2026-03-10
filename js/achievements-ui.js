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
}

function dismissAchievement() {
  clearTimeout(_achTimeout);
  const popup = document.getElementById('achievement-popup');
  if (popup) popup.classList.remove('show');
}
