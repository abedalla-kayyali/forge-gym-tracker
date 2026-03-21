function _tm(en, ar) {
  return (typeof currentLang !== 'undefined' && currentLang === 'ar') ? ar : en;
}

function _templateRecordId() {
  if (window.FORGE_STORAGE && typeof window.FORGE_STORAGE.makeId === 'function') {
    return window.FORGE_STORAGE.makeId('tmpl');
  }
  return 'tmpl_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
}

function openTemplateModal() {
  document.getElementById('template-modal').classList.add('open');
}

function closeTemplateModal(e) {
  if (e.target === e.currentTarget) document.getElementById('template-modal').classList.remove('open');
}

function saveTemplate() {
  const name = document.getElementById('tmpl-name').value.trim();
  const muscle = document.getElementById('tmpl-muscle').value;
  const exercises = document.getElementById('tmpl-exercises').value.trim();
  const icon = document.getElementById('tmpl-icon').value.trim() || '💪';
  if (!name || !exercises) { showToast(_tm('Fill in name and exercises!', 'أدخل الاسم والتمارين')); return; }
  templates.push({ id: _templateRecordId(), name, muscle, exercises, icon });
  save(); renderMyTemplates(); renderTemplates();
  document.getElementById('template-modal').classList.remove('open');
  showToast(_tm('Template saved!', 'تم حفظ القالب!'));
}

function renderMyTemplates() {
  const el = document.getElementById('my-templates-list');
  if (!el) return;
  if (!templates.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></div><div class="empty-title">' + _tm('No custom templates', 'لا توجد قوالب مخصصة') + '</div><div class="empty-sub">' + _tm('Create one above', 'أنشئ قالبًا من الأعلى') + '</div></div>';
    return;
  }
  el.innerHTML = templates.map(t => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:20px;">${t.icon}</span>
        <div>
          <div style="font-family:'Barlow Condensed';font-size:14px;font-weight:700;color:var(--white);">${t.name}</div>
          <div style="font-family:'DM Mono';font-size:10px;color:var(--text3);">${t.exercises}</div>
        </div>
      </div>
      <button class="btn-icon" onclick="deleteTemplate('${t.id}')">×</button>
    </div>`).join('');
}

function deleteTemplate(id) {
  templates = templates.filter(t => t.id !== id);
  save(); renderMyTemplates(); renderTemplates();
}
