let _bioLogType = 'weight';

function openBioLog(type) {
  _bioLogType = type;
  const modal = document.getElementById('bio-log-modal');
  const input = document.getElementById('bio-modal-input');
  const titleEl = document.getElementById('bio-modal-title');
  const iconEl = document.getElementById('bio-modal-icon');
  const unitEl = document.getElementById('bio-modal-unit');
  const lastEl = document.getElementById('bio-modal-last');
  const bwArr = typeof bodyWeight !== 'undefined' ? bodyWeight : [];

  const _locale = (typeof currentLang !== 'undefined' && currentLang === 'ar') ? 'ar-EG' : 'en-GB';
  const _noEntries = t('bcomp.noEntries');
  const _last = t('bio.last');
  if (type === 'weight') {
    titleEl.textContent = t('bio.logWeight');
    iconEl.textContent = '⚖️';
    unitEl.textContent = (typeof settings !== 'undefined' && settings.defaultUnit) || 'kg';
    input.placeholder = '80.5';
    input.min = '20';
    input.max = '500';
    const last = [...bwArr].reverse().find(e => e.weight);
    lastEl.textContent = last ? _last + ': ' + last.weight + ' ' + (last.unit || 'kg') + ' - ' + new Date(last.date).toLocaleDateString(_locale, { day: 'numeric', month: 'short' }) : _noEntries;
  } else if (type === 'bf') {
    titleEl.textContent = t('bio.logBodyFat');
    iconEl.textContent = '📊';
    unitEl.textContent = '%';
    input.placeholder = '18.5';
    input.min = '2';
    input.max = '60';
    const last = [...bwArr].reverse().find(e => e.bodyFat);
    lastEl.textContent = last ? _last + ': ' + last.bodyFat + '% - ' + new Date(last.date).toLocaleDateString(_locale, { day: 'numeric', month: 'short' }) : _noEntries;
  } else {
    titleEl.textContent = t('bio.logMuscle');
    iconEl.textContent = '💪';
    unitEl.textContent = 'kg';
    input.placeholder = '38.0';
    input.min = '10';
    input.max = '200';
    const last = [...bwArr].reverse().find(e => e.muscleMass);
    lastEl.textContent = last ? _last + ': ' + last.muscleMass + ' kg - ' + new Date(last.date).toLocaleDateString(_locale, { day: 'numeric', month: 'short' }) : _noEntries;
  }

  input.value = '';
  const saveBtn = document.querySelector('.bio-modal-save');
  if (saveBtn) saveBtn.textContent = t('bio.save');
  modal.classList.add('open');
  setTimeout(() => input.focus(), 300);
}

function closeBioLog() {
  document.getElementById('bio-log-modal').classList.remove('open');
}

function saveBioLog() {
  const val = parseFloat(document.getElementById('bio-modal-input').value);
  if (!val || isNaN(val)) {
    if (typeof showToast === 'function') showToast('Enter a value!');
    return;
  }

  const entry = { date: new Date().toISOString() };
  if (_bioLogType === 'weight') {
    const unit = (typeof settings !== 'undefined' && settings.defaultUnit) || 'kg';
    // Keep latest weight on same entry - create new entry with weight only
    entry.weight = val;
    entry.unit = unit;
    // Preserve bf/mm from most recent entry if available
    const bwArr = typeof bodyWeight !== 'undefined' ? bodyWeight : [];
    const prev = [...bwArr].reverse().find(e => e.bodyFat || e.muscleMass);
    if (prev && prev.bodyFat) entry.bodyFat = prev.bodyFat;
    if (prev && prev.muscleMass) entry.muscleMass = prev.muscleMass;
    bodyWeight.push(entry);
  } else if (_bioLogType === 'bf') {
    const bwArr = typeof bodyWeight !== 'undefined' ? bodyWeight : [];
    const prev = [...bwArr].reverse().find(e => e.weight);
    if (prev) {
      entry.weight = prev.weight;
      entry.unit = prev.unit || 'kg';
    }
    const prevMM = [...bwArr].reverse().find(e => e.muscleMass);
    if (prevMM) entry.muscleMass = prevMM.muscleMass;
    entry.bodyFat = val;
    bodyWeight.push(entry);
  } else {
    const bwArr = typeof bodyWeight !== 'undefined' ? bodyWeight : [];
    const prev = [...bwArr].reverse().find(e => e.weight);
    if (prev) {
      entry.weight = prev.weight;
      entry.unit = prev.unit || 'kg';
    }
    const prevBF = [...bwArr].reverse().find(e => e.bodyFat);
    if (prevBF) entry.bodyFat = prevBF.bodyFat;
    entry.muscleMass = val;
    bodyWeight.push(entry);
  }

  if (typeof save === 'function') save();
  _updateHdrStats();
  if (typeof renderFFMICards === 'function') renderFFMICards();
  if (typeof renderCoachToday === 'function') renderCoachToday();
  closeBioLog();
  if (typeof showToast === 'function') showToast(t('bio.save'));
}
