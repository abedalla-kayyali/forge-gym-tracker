function saveSetting(key, val) {
  settings[key] = val;
  save();
}

function loadSettings() {
  const du = document.getElementById('default-unit-setting');
  const ss = document.getElementById('sound-setting');
  const hs = document.getElementById('hint-setting');
  if (du) du.value = settings.defaultUnit || 'kg';
  if (ss) ss.checked = settings.sound !== false;
  if (hs) hs.checked = settings.showHint !== false;
  const ars = document.getElementById('autorest-setting');
  if (ars) ars.checked = !!settings.autoRest;
  const rpes = document.getElementById('rpe-setting');
  if (rpes) rpes.checked = !!settings.showRPE;
  _toggleRPECols();
  // Sync light mode toggle
  const lmt = document.getElementById('light-mode-toggle');
  if (lmt) lmt.checked = currentTheme === 'solar';
  renderThemePicker();
}

function toggleLightMode(on) {
  applyTheme(on ? 'solar' : 'forge', '');
  // Keep toggle in sync after theme picker may re-render
  setTimeout(() => {
    const lmt = document.getElementById('light-mode-toggle');
    if (lmt) lmt.checked = currentTheme === 'solar';
  }, 100);
  const _ar = typeof currentLang !== 'undefined' && currentLang === 'ar';
  showToast(on
    ? (_ar ? '��� ������ �����' : 'Light mode on � SOLAR theme applied')
    : (_ar ? '��� ����� �����' : 'Dark mode restored'));
}
