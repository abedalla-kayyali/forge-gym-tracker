'use strict';
// FORGE InBody Test Log
// Stores full InBody test results as timestamped history.
// Renders a panel in the Body tab with trend chart (BF% vs SMM) and history list.

(function () {
  const LS_KEY = 'forge_inbody_tests';
  let _tests = [];
  let _chart = null;
  let _formOpen = false;

  // ── Helpers ────────────────────────────────────────────────────────────────
  function _load() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      _tests = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(_tests)) _tests = [];
    } catch (_e) { _tests = []; }
  }

  function _save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(_tests)); } catch (_e) {}
    // Expose globally so sync.js can pick it up
    window._inbodyTests = _tests;
    window.dispatchEvent(new CustomEvent('forge:inbody-updated'));
  }

  function _uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function _esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function _fmt(v, suffix) {
    if (v == null || v === '' || isNaN(+v)) return '—';
    return (+v).toFixed(1) + (suffix || '');
  }

  function _fmtInt(v) {
    if (v == null || v === '' || isNaN(+v)) return '—';
    return String(Math.round(+v));
  }

  function _sorted() {
    return [..._tests].sort((a, b) => (a.date < b.date ? -1 : 1));
  }

  function _latestTest() {
    const s = _sorted();
    return s.length ? s[s.length - 1] : null;
  }

  function _prevTest() {
    const s = _sorted();
    return s.length >= 2 ? s[s.length - 2] : null;
  }

  function _delta(now, prev, field) {
    if (!prev || prev[field] == null || now[field] == null) return null;
    return (+now[field] - +prev[field]);
  }

  function _deltaHtml(delta, invert) {
    if (delta == null) return '';
    const positive = invert ? delta < 0 : delta > 0;
    const cls = positive ? 'ib-delta-pos' : (delta === 0 ? 'ib-delta-neutral' : 'ib-delta-neg');
    const sign = delta > 0 ? '+' : '';
    return `<span class="${cls}">${sign}${delta.toFixed(1)}</span>`;
  }

  // ── TDEE/BMR sync ──────────────────────────────────────────────────────────
  function _syncBmrToProfile(test) {
    if (!test || !test.bmr || +test.bmr < 800) return;
    // userProfile is a let in index.html — use direct global, not window property
    const _up = (typeof userProfile !== 'undefined' ? userProfile : null);
    if (!_up) return;
    const pref = _up.bmrSourcePref || _up.bmr_source_pref || 'auto';
    if (pref === 'formula') return;
    _up.inbodyBmr = +test.bmr;
    _up.inbodyBmrDate = test.date;
    // Persist to localStorage profile key
    try {
      const raw = localStorage.getItem('forge_profile');
      const p = raw ? JSON.parse(raw) : {};
      p.inbodyBmr = _up.inbodyBmr;
      p.inbodyBmrDate = _up.inbodyBmrDate;
      localStorage.setItem('forge_profile', JSON.stringify(p));
    } catch (_e) {}
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  function openInBodyForm() {
    const modal = document.getElementById('inbody-modal');
    if (!modal) return;
    // Pre-fill date with today
    const dateInput = document.getElementById('ib-date');
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().slice(0, 10);
    }
    modal.classList.add('open');
    _formOpen = true;
  }

  function closeInBodyForm() {
    const modal = document.getElementById('inbody-modal');
    if (modal) modal.classList.remove('open');
    _formOpen = false;
    _clearForm();
  }

  function _clearForm() {
    const ids = ['ib-date','ib-weight','ib-bf','ib-smm','ib-bfm','ib-tbw',
                 'ib-bmr','ib-visceral','ib-score','ib-phase',
                 'ib-lean-la','ib-lean-ra','ib-lean-trunk','ib-lean-ll','ib-lean-rl','ib-notes'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  }

  function _showFirstEntryReward(type) {
    const container = document.getElementById('inbody-summary-cards');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'first-entry-reward';
    el.innerHTML = `
      <div class="fer-icon">🏅</div>
      <div class="fer-content">
        <div class="fer-title">First InBody Test Logged!</div>
        <div class="fer-msg">Baseline set — your AI Coach can now track real body composition progress. <strong>+250 XP</strong></div>
      </div>`;
    container.prepend(el);
    setTimeout(() => { if (el.parentNode) el.remove(); }, 7000);
  }

  function saveInBodyEntry() {
    const date = (document.getElementById('ib-date')?.value || '').trim();
    if (!date) { if (window.showToast) showToast('Enter a test date', 'error'); return; }

    function _val(id) {
      const v = document.getElementById(id)?.value;
      return (v !== '' && v != null && !isNaN(+v)) ? +v : null;
    }

    const entry = {
      id: _uid(),
      date,
      weight:     _val('ib-weight'),
      bf:         _val('ib-bf'),
      smm:        _val('ib-smm'),
      bfm:        _val('ib-bfm'),
      tbw:        _val('ib-tbw'),
      bmr:        _val('ib-bmr'),
      visceralFat:_val('ib-visceral'),
      inbodyScore:_val('ib-score'),
      phaseAngle: _val('ib-phase'),
      leanLeftArm:  _val('ib-lean-la'),
      leanRightArm: _val('ib-lean-ra'),
      leanTrunk:    _val('ib-lean-trunk'),
      leanLeftLeg:  _val('ib-lean-ll'),
      leanRightLeg: _val('ib-lean-rl'),
      notes: (document.getElementById('ib-notes')?.value || '').trim()
    };

    // Remove null fields to keep storage lean
    Object.keys(entry).forEach(k => { if (entry[k] === null) delete entry[k]; });

    // Update existing test for same date or push new
    const idx = _tests.findIndex(t => t.date === date);
    const isFirst = _tests.length === 0 && idx < 0;
    if (idx >= 0) _tests[idx] = { ..._tests[idx], ...entry };
    else _tests.push(entry);

    _save();
    _syncBmrToProfile(entry);
    closeInBodyForm();
    renderInBodyPanel();
    if (window.showToast) showToast('InBody test saved', 'success');
    if (isFirst) _showFirstEntryReward('inbody');
  }

  function deleteInBodyEntry(id) {
    _tests = _tests.filter(t => t.id !== id);
    _save();
    renderInBodyPanel();
    if (window.showToast) showToast('Entry deleted', 'info');
  }

  // ── Summary cards ──────────────────────────────────────────────────────────
  function _renderSummaryCards() {
    const el = document.getElementById('inbody-summary-cards');
    if (!el) return;
    const latest = _latestTest();
    const prev   = _prevTest();
    if (!latest) {
      el.innerHTML = '<div class="ib-empty-note">No InBody tests yet. Add your first test to see your body composition trends.</div>';
      return;
    }

    const dfBf  = _delta(latest, prev, 'bf');
    const dfSmm = _delta(latest, prev, 'smm');
    const dfBfm = _delta(latest, prev, 'bfm');
    const dfW   = _delta(latest, prev, 'weight');

    const dateLabel = new Date(latest.date + 'T00:00:00').toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });

    el.innerHTML = `
      <div class="ib-test-date">Latest test — ${_esc(dateLabel)}</div>
      <div class="ib-summary-grid">
        ${latest.weight != null ? `
        <div class="ib-sum-card">
          <div class="ib-sum-val">${_fmt(latest.weight, ' kg')}</div>
          <div class="ib-sum-lbl">Weight</div>
          ${dfW != null ? `<div class="ib-sum-delta">${_deltaHtml(dfW, false)}</div>` : ''}
        </div>` : ''}
        ${latest.bf != null ? `
        <div class="ib-sum-card ib-card-accent">
          <div class="ib-sum-val">${_fmt(latest.bf, '%')}</div>
          <div class="ib-sum-lbl">Body Fat</div>
          ${dfBf != null ? `<div class="ib-sum-delta">${_deltaHtml(dfBf, true)}</div>` : ''}
        </div>` : ''}
        ${latest.smm != null ? `
        <div class="ib-sum-card ib-card-green">
          <div class="ib-sum-val">${_fmt(latest.smm, ' kg')}</div>
          <div class="ib-sum-lbl">Muscle (SMM)</div>
          ${dfSmm != null ? `<div class="ib-sum-delta">${_deltaHtml(dfSmm, false)}</div>` : ''}
        </div>` : ''}
        ${latest.bfm != null ? `
        <div class="ib-sum-card">
          <div class="ib-sum-val">${_fmt(latest.bfm, ' kg')}</div>
          <div class="ib-sum-lbl">Fat Mass</div>
          ${dfBfm != null ? `<div class="ib-sum-delta">${_deltaHtml(dfBfm, true)}</div>` : ''}
        </div>` : ''}
        ${latest.bmr != null ? `
        <div class="ib-sum-card">
          <div class="ib-sum-val">${_fmtInt(latest.bmr)}</div>
          <div class="ib-sum-lbl">BMR kcal</div>
        </div>` : ''}
        ${latest.visceralFat != null ? `
        <div class="ib-sum-card ${+latest.visceralFat > 13 ? 'ib-card-warn' : ''}">
          <div class="ib-sum-val">${_fmtInt(latest.visceralFat)}</div>
          <div class="ib-sum-lbl">Visceral Fat</div>
        </div>` : ''}
        ${latest.inbodyScore != null ? `
        <div class="ib-sum-card ib-card-score">
          <div class="ib-sum-val">${_fmtInt(latest.inbodyScore)}</div>
          <div class="ib-sum-lbl">InBody Score</div>
        </div>` : ''}
        ${latest.phaseAngle != null ? `
        <div class="ib-sum-card">
          <div class="ib-sum-val">${_fmt(latest.phaseAngle, '°')}</div>
          <div class="ib-sum-lbl">Phase Angle</div>
        </div>` : ''}
      </div>
      ${_renderSegmental(latest)}
    `;
  }

  function _renderSegmental(t) {
    if (!t || (t.leanLeftArm == null && t.leanRightArm == null && t.leanTrunk == null)) return '';
    return `
      <div class="ib-segmental-wrap">
        <div class="ib-segmental-title">Segmental Lean Mass (kg)</div>
        <div class="ib-segmental-grid">
          <div class="ib-seg-cell">
            <div class="ib-seg-val">${_fmt(t.leanLeftArm)}</div>
            <div class="ib-seg-lbl">L. Arm</div>
          </div>
          <div class="ib-seg-cell">
            <div class="ib-seg-val">${_fmt(t.leanRightArm)}</div>
            <div class="ib-seg-lbl">R. Arm</div>
          </div>
          <div class="ib-seg-cell ib-seg-trunk">
            <div class="ib-seg-val">${_fmt(t.leanTrunk)}</div>
            <div class="ib-seg-lbl">Trunk</div>
          </div>
          <div class="ib-seg-cell">
            <div class="ib-seg-val">${_fmt(t.leanLeftLeg)}</div>
            <div class="ib-seg-lbl">L. Leg</div>
          </div>
          <div class="ib-seg-cell">
            <div class="ib-seg-val">${_fmt(t.leanRightLeg)}</div>
            <div class="ib-seg-lbl">R. Leg</div>
          </div>
        </div>
      </div>
    `;
  }

  // ── Dual-axis chart: BF% vs SMM ────────────────────────────────────────────
  function _renderChart() {
    const canvas = document.getElementById('inbody-trend-chart');
    if (!canvas) return;

    const sorted = _sorted().filter(t => t.bf != null || t.smm != null);
    if (sorted.length < 2) {
      canvas.style.display = 'none';
      const msg = document.getElementById('inbody-chart-empty');
      if (msg) msg.style.display = 'block';
      return;
    }
    canvas.style.display = 'block';
    const msg = document.getElementById('inbody-chart-empty');
    if (msg) msg.style.display = 'none';

    const labels = sorted.map(t => {
      const d = new Date(t.date + 'T00:00:00');
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    });
    const bfData  = sorted.map(t => t.bf  != null ? +t.bf  : null);
    const smmData = sorted.map(t => t.smm != null ? +t.smm : null);

    const style = getComputedStyle(document.body);
    const gridColor = 'rgba(90,255,170,0.12)';
    const tooltipStyle = {
      backgroundColor: '#081713',
      titleColor: '#c7ffe6',
      bodyColor: '#d8fff1',
      borderColor: 'rgba(57,255,143,.35)',
      borderWidth: 1,
      padding: 10,
      displayColors: true
    };

    if (_chart) { try { _chart.destroy(); } catch (_e) {} _chart = null; }

    _chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Body Fat %',
            data: bfData,
            borderColor: '#ff6b6b',
            backgroundColor: 'rgba(255,107,107,0.10)',
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: '#ff6b6b',
            tension: 0.35,
            yAxisID: 'yBf',
            spanGaps: true
          },
          {
            label: 'Muscle Mass (kg)',
            data: smmData,
            borderColor: '#39ff8f',
            backgroundColor: 'rgba(57,255,143,0.08)',
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: '#39ff8f',
            tension: 0.35,
            yAxisID: 'ySmm',
            spanGaps: true
          }
        ]
      },
      options: {
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: true,
            labels: { color: '#8ac7ad', boxWidth: 12, font: { size: 11 } }
          },
          tooltip: { ...tooltipStyle }
        },
        scales: {
          x: {
            ticks: { color: '#8ac7ad', font: { size: 10 }, maxRotation: 0 },
            grid: { color: gridColor }
          },
          yBf: {
            position: 'left',
            title: { display: true, text: 'BF %', color: '#ff6b6b', font: { size: 10 } },
            ticks: { color: '#ff6b6b', font: { size: 10 } },
            grid: { color: gridColor }
          },
          ySmm: {
            position: 'right',
            title: { display: true, text: 'Muscle kg', color: '#39ff8f', font: { size: 10 } },
            ticks: { color: '#39ff8f', font: { size: 10 } },
            grid: { display: false }
          }
        }
      }
    });
  }

  // ── History list ───────────────────────────────────────────────────────────
  function _renderHistory() {
    const el = document.getElementById('inbody-history-list');
    if (!el) return;
    const sorted = _sorted().reverse();
    if (!sorted.length) {
      el.innerHTML = '<div class="ib-empty-note">No tests logged yet.</div>';
      return;
    }
    el.innerHTML = sorted.map(t => {
      const dateLabel = new Date(t.date + 'T00:00:00').toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
      const chips = [];
      if (t.weight != null)     chips.push(`<span class="ib-chip">⚖️ ${_fmt(t.weight, ' kg')}</span>`);
      if (t.bf != null)         chips.push(`<span class="ib-chip ib-chip-fat">🔴 ${_fmt(t.bf, '%')} BF</span>`);
      if (t.smm != null)        chips.push(`<span class="ib-chip ib-chip-muscle">💪 ${_fmt(t.smm, ' kg')} SMM</span>`);
      if (t.bmr != null)        chips.push(`<span class="ib-chip">🔥 ${_fmtInt(t.bmr)} BMR</span>`);
      if (t.visceralFat != null) chips.push(`<span class="ib-chip ${+t.visceralFat > 13 ? 'ib-chip-warn' : ''}">🫀 VF ${_fmtInt(t.visceralFat)}</span>`);
      if (t.inbodyScore != null) chips.push(`<span class="ib-chip ib-chip-score">⭐ ${_fmtInt(t.inbodyScore)}</span>`);
      return `
        <div class="ib-history-item">
          <div class="ib-hist-header">
            <span class="ib-hist-date">${_esc(dateLabel)}</span>
            <button class="ib-delete-btn" onclick="window._inbodyDeleteEntry('${_esc(t.id)}')" title="Delete">×</button>
          </div>
          <div class="ib-chips-row">${chips.join('')}</div>
          ${t.notes ? `<div class="ib-hist-notes">${_esc(t.notes)}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  // ── Main render ────────────────────────────────────────────────────────────
  function renderInBodyPanel() {
    _load();
    _renderSummaryCards();
    _renderChart();
    _renderHistory();
  }

  // ── Global API ─────────────────────────────────────────────────────────────
  window._inbodyTests        = _tests;
  window.openInBodyForm      = openInBodyForm;
  window.closeInBodyForm     = closeInBodyForm;
  window.saveInBodyEntry     = saveInBodyEntry;
  window.renderInBodyPanel   = renderInBodyPanel;
  window._inbodyDeleteEntry  = deleteInBodyEntry;
  window._inbodyGetTests     = () => { _load(); return _tests; };

  // Auto-render when body tab opens
  window.addEventListener('forge:inbody-updated', renderInBodyPanel);

  // Init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { _load(); window._inbodyTests = _tests; });
  } else {
    _load();
    window._inbodyTests = _tests;
  }
})();
