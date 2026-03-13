function submitCheckin() {
  localStorage.setItem(_ciKey(), JSON.stringify({ ..._ciVals, ts: Date.now() }));
  if (typeof save === 'function') save();
  const o = document.getElementById('checkin-overlay');
  if (o) o.style.display = 'none';
  // Award +5 XP stored in profile
  try {
    const prof = JSON.parse(localStorage.getItem('forge_profile') || '{}');
    prof.checkinXP = (prof.checkinXP || 0) + 5;
    localStorage.setItem('forge_profile', JSON.stringify(prof));
  } catch (e) {}
  if (typeof updateXPBar === 'function') updateXPBar();
  if (typeof showToast === 'function') showToast('+5 XP - Check-in complete!', 'success');
}

function skipCheckin() {
  // Mark skipped so it doesn't re-prompt today
  localStorage.setItem(_ciKey(), JSON.stringify({ skipped: true, ts: Date.now() }));
  if (typeof save === 'function') save();
  const o = document.getElementById('checkin-overlay');
  if (o) o.style.display = 'none';
}

function getTodayCheckin() {
  try {
    return JSON.parse(localStorage.getItem(_ciKey()) || 'null');
  } catch (e) {
    return null;
  }
}

