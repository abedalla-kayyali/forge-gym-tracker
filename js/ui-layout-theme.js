// FORGE Gym Tracker - layout edit mode, theme wipe, ambient glow, and level-up detection
// Extracted from index.html as part of modularization.

// Always clear saved layout so bodymap+exercise are always first (no user-saved override)
localStorage.removeItem('forge_layout');
let layoutConfig = null;
const DEFAULT_SECTION_ORDER = [
  'section-bodymap', 'section-exercise', 'section-steps',
  'section-templates'
];

function saveLayout() {
  // Query ALL log-sections anywhere in the document (some may have escaped view-log)
  const order = [];
  document.querySelectorAll('.log-section').forEach(el => {
    if (el.id) order.push({ id: el.id, hidden: el.dataset.hidden === 'true' });
  });
  layoutConfig = order;
  localStorage.setItem('forge_layout', JSON.stringify(layoutConfig));
}

function applyLayout() {
  const logView = document.getElementById('view-log');
  if (!logView) return;

  // Re-parent any orphaned log-sections back into view-log first
  document.querySelectorAll('.log-section').forEach(el => {
    if (el.parentElement !== logView) logView.appendChild(el);
  });

  // Use saved layout if available, otherwise enforce DEFAULT_SECTION_ORDER
  const order = (layoutConfig && layoutConfig.length)
    ? layoutConfig
    : DEFAULT_SECTION_ORDER.map(id => ({ id, hidden: false }));

  // Re-order sections according to layout
  order.forEach(cfg => {
    const el = document.getElementById(cfg.id);
    if (!el) return;
    el.dataset.hidden = cfg.hidden ? 'true' : 'false';
    el.style.display = cfg.hidden ? 'none' : '';
    logView.appendChild(el);
  });
}

let editModeActive = false;

function toggleEditMode() {
  editModeActive ? exitEditMode() : enterEditMode();
}

function enterEditMode() {
  editModeActive = true;
  document.body.classList.add('edit-mode');
  document.getElementById('edit-mode-bar').classList.add('visible');
  document.getElementById('edit-layout-btn').classList.add('active');
  document.getElementById('edit-layout-btn').innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:4px;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' + (typeof t === 'function' ? t('header.exit') || 'Exit' : 'Exit');
  // Make hidden sections visible during edit
  document.querySelectorAll('#view-log .log-section[data-hidden="true"]').forEach(el => {
    el.style.display = '';
  });
  showToast(typeof t === 'function' && currentLang === 'ar' ? 'وضع التعديل — رتّب وأخفِ الأقسام' : 'Edit mode — reorder & toggle sections', '#f39c12');
}

function exitEditMode() {
  editModeActive = false;
  document.body.classList.remove('edit-mode');
  document.getElementById('edit-mode-bar').classList.remove('visible');
  document.getElementById('edit-layout-btn').classList.remove('active');
  document.getElementById('edit-layout-btn').innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:4px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' + (typeof t === 'function' ? t('header.edit') || 'Edit' : 'Edit');
  // Re-hide hidden sections
  document.querySelectorAll('#view-log .log-section[data-hidden="true"]').forEach(el => {
    el.style.display = 'none';
  });
  saveLayout();
  showToast(typeof t === 'function' && currentLang === 'ar' ? 'تم حفظ التخطيط!' : 'Layout saved!');
}

function toggleSectionHidden(sectionId) {
  const el = document.getElementById(sectionId);
  if (!el) return;
  const hidden = el.dataset.hidden === 'true';
  el.dataset.hidden = hidden ? 'false' : 'true';
  // Visual feedback in edit mode - do not actually hide during edit
  el.style.opacity = hidden ? '1' : '0.35';
  showToast(typeof t === 'function' && currentLang === 'ar' ? (hidden ? 'القسم مرئي' : 'القسم مخفي') : (hidden ? 'Section visible' : 'Section hidden'));
}

function moveSectionUp(sectionId) {
  const el = document.getElementById(sectionId);
  if (!el) return;
  const logView = document.getElementById('view-log');
  if (el.parentElement !== logView) logView.appendChild(el);
  let prev = el.previousElementSibling;
  while (prev && !prev.classList.contains('log-section')) prev = prev.previousElementSibling;
  if (prev) {
    logView.insertBefore(el, prev);
    showToast(typeof t === 'function' && currentLang === 'ar' ? '↑ تم رفع القسم' : '↑ Section moved up');
  }
}

function moveSectionDown(sectionId) {
  const el = document.getElementById(sectionId);
  if (!el) return;
  const logView = document.getElementById('view-log');
  if (el.parentElement !== logView) logView.appendChild(el);
  let next = el.nextElementSibling;
  while (next && !next.classList.contains('log-section')) next = next.nextElementSibling;
  if (next) {
    logView.insertBefore(next, el);
    showToast(typeof t === 'function' && currentLang === 'ar' ? '↓ تم خفض القسم' : '↓ Section moved down');
  }
}

// THEME WIPE TRANSITION
function playThemeWipe() {
  const el = document.getElementById('theme-wipe');
  if (!el) return;
  el.classList.remove('wipe');
  void el.offsetWidth;
  el.classList.add('wipe');
  el.addEventListener('animationend', () => el.classList.remove('wipe'), { once: true });
}

// AMBIENT GLOW - update --glow-x/--glow-y on pointer move
document.addEventListener('pointermove', e => {
  const xPct = ((e.clientX / window.innerWidth) * 100).toFixed(1);
  const yPct = ((e.clientY / window.innerHeight) * 100).toFixed(1);
  document.documentElement.style.setProperty('--glow-x', xPct + '%');
  document.documentElement.style.setProperty('--glow-y', yPct + '%');
}, { passive: true });

// LEVEL-UP DETECTION (reads DOM after postSaveHooks updates XP bar)
const _RANK_NAMES = {
  '🌱': 'ROOKIE', '🔩': 'IRON', '🥉': 'BRONZE',
  '🥈': 'SILVER', '🥇': 'GOLD', '💎': 'PLATINUM',
  '💠': 'DIAMOND', '⚡': 'MASTER', '🔥': 'GRANDMASTER',
  '👑': 'LEGEND', '🏆': 'G.O.A.T.'
};
const _RANK_NAMES_AR = {
  '🌱': 'مبتدئ', '🔩': 'حديد', '🥉': 'برونز',
  '🥈': 'فضة', '🥇': 'ذهب', '💎': 'بلاتين',
  '💠': 'ألماس', '⚡': 'أستاذ', '🔥': 'سيد كبير',
  '👑': 'أسطورة', '🏆': 'الأعظم'
};
let _lastLevelIcon = null;

function _checkLevelUp() {
  const el = document.getElementById('level-icon');
  if (!el) return;
  const icon = el.textContent.trim();
  if (_lastLevelIcon === null) { _lastLevelIcon = icon; return; }
  if (icon !== _lastLevelIcon) {
    _lastLevelIcon = icon;
    const _isAr = (typeof currentLang !== 'undefined') && currentLang === 'ar';
    const rName = _isAr ? (_RANK_NAMES_AR[icon] || 'المستوى التالي') : (_RANK_NAMES[icon] || 'NEXT LEVEL');
    showLevelUp(rName, icon);
    // Show skin unlock toast if new rank has a visual skin
    if (typeof LEVEL_SKINS !== 'undefined' && typeof _applyRankSkin === 'function') {
      const newLvl = (typeof getCurrentLevel === 'function') ? getCurrentLevel(calcXP()) : null;
      if (newLvl) {
        const skin = LEVEL_SKINS[newLvl.name] || '';
        const oldSkin = [...document.body.classList].find(c => c.startsWith('skin-')) || '';
        if (skin && skin !== oldSkin) {
          const skinLabel = skin.replace('skin-', '').toUpperCase();
          setTimeout(() => showToast('🎨 ' + skinLabel + ' theme unlocked!', 'success'), 1800);
        }
        _applyRankSkin(newLvl.name);
      }
    }
  }
}

/* Seed on first load after XP bar renders */
setTimeout(() => {
  const el = document.getElementById('level-icon');
  if (el) _lastLevelIcon = el.textContent.trim();
}, 900);

// AMBIENT GLOW CSS VAR INIT
document.documentElement.style.setProperty('--glow-x', '50%');
document.documentElement.style.setProperty('--glow-y', '40%');
