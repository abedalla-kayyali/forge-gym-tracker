'use strict';
// FORGE Body Measurements Tracker
// Tracks tape-measure body measurements over time.
// Calculates waist-to-hip ratio, shows trends per measurement.

(function () {
  const LS_KEY = 'forge_measurements';
  let _entries = [];
  let _chart = null;
  let _activeMeasure = 'waist';

  const MEASURES = [
    { key: 'waist',       label: 'Waist',        icon: '📏', group: 'core' },
    { key: 'hips',        label: 'Hips',         icon: '📏', group: 'core' },
    { key: 'chest',       label: 'Chest',        icon: '💪', group: 'upper' },
    { key: 'shoulders',   label: 'Shoulders',    icon: '💪', group: 'upper' },
    { key: 'leftArm',     label: 'Left Arm',     icon: '💪', group: 'upper' },
    { key: 'rightArm',    label: 'Right Arm',    icon: '💪', group: 'upper' },
    { key: 'neck',        label: 'Neck',         icon: '📏', group: 'upper' },
    { key: 'leftThigh',   label: 'Left Thigh',   icon: '🦵', group: 'lower' },
    { key: 'rightThigh',  label: 'Right Thigh',  icon: '🦵', group: 'lower' },
    { key: 'calves',      label: 'Calves',       icon: '🦵', group: 'lower' }
  ];

  // ── Storage ────────────────────────────────────────────────────────────────
  function _load() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      _entries = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(_entries)) _entries = [];
    } catch (_e) { _entries = []; }
  }

  function _save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(_entries)); } catch (_e) {}
    window._measurementEntries = _entries;
    window.dispatchEvent(new CustomEvent('forge:measurements-updated'));
  }

  function _uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function _esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function _sorted() {
    return [..._entries].sort((a, b) => (a.date < b.date ? -1 : 1));
  }

  function _latest() {
    const s = _sorted();
    return s.length ? s[s.length - 1] : null;
  }

  function _fmt(v, unit) {
    if (v == null || v === '' || isNaN(+v)) return '—';
    return (+v).toFixed(1) + ' ' + (unit || 'cm');
  }

  // ── Save new entry ─────────────────────────────────────────────────────────
  function _showFirstEntryReward() {
    const container = document.getElementById('meas-summary-cards');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'first-entry-reward';
    el.innerHTML = `
      <div class="fer-icon">📐</div>
      <div class="fer-content">
        <div class="fer-title">First Measurements Logged!</div>
        <div class="fer-msg">Your body measurement baseline is set — trends will appear after your next check-in. <strong>+150 XP</strong></div>
      </div>`;
    container.prepend(el);
    setTimeout(() => { if (el.parentNode) el.remove(); }, 7000);
  }

  function saveMeasurementEntry() {
    const date = (document.getElementById('meas-date')?.value || '').trim();
    if (!date) { if (window.showToast) showToast('Enter a date', 'error'); return; }

    function _val(id) {
      const v = document.getElementById(id)?.value;
      return (v !== '' && v != null && !isNaN(+v) && +v > 0) ? +v : null;
    }

    const unit = document.getElementById('meas-unit')?.value || 'cm';
    const entry = { id: _uid(), date, unit };
    MEASURES.forEach(m => {
      const v = _val('meas-' + m.key);
      if (v != null) entry[m.key] = v;
    });

    // Must have at least one measurement
    const hasAny = MEASURES.some(m => entry[m.key] != null);
    if (!hasAny) { if (window.showToast) showToast('Enter at least one measurement', 'error'); return; }

    const idx = _entries.findIndex(e => e.date === date);
    const isFirst = _entries.length === 0 && idx < 0;
    if (idx >= 0) _entries[idx] = { ..._entries[idx], ...entry };
    else _entries.push(entry);

    _save();
    closeMeasurementsForm();
    renderMeasurementsPanel();
    if (window.showToast) showToast('Measurements saved', 'success');
    if (isFirst) _showFirstEntryReward();
  }

  function deleteMeasurementEntry(id) {
    _entries = _entries.filter(e => e.id !== id);
    _save();
    renderMeasurementsPanel();
    if (window.showToast) showToast('Entry deleted', 'info');
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  function openMeasurementsForm() {
    const modal = document.getElementById('measurements-modal');
    if (!modal) return;
    const dateInput = document.getElementById('meas-date');
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().slice(0, 10);
    }
    modal.classList.add('open');
  }

  function closeMeasurementsForm() {
    const modal = document.getElementById('measurements-modal');
    if (modal) modal.classList.remove('open');
    _clearMeasForm();
  }

  function _clearMeasForm() {
    const el = document.getElementById('meas-date');
    if (el) el.value = '';
    MEASURES.forEach(m => {
      const input = document.getElementById('meas-' + m.key);
      if (input) input.value = '';
    });
  }

  // ── Summary cards ──────────────────────────────────────────────────────────
  function _renderSummaryCards() {
    const el = document.getElementById('meas-summary-cards');
    if (!el) return;
    const latest = _latest();
    if (!latest) {
      el.innerHTML = '<div class="meas-empty-note">No measurements yet. Add your first entry to track your progress.</div>';
      return;
    }

    const sorted = _sorted();
    const prev = sorted.length >= 2 ? sorted[sorted.length - 2] : null;
    const unit = latest.unit || 'cm';
    const dateLabel = new Date(latest.date + 'T00:00:00').toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });

    // Waist-to-Hip ratio
    let whrHtml = '';
    if (latest.waist && latest.hips) {
      const whr = (+latest.waist / +latest.hips).toFixed(2);
      const risk = whr < 0.80 ? 'Low' : whr < 0.85 ? 'Moderate' : 'High';
      const riskCls = whr < 0.80 ? 'meas-risk-low' : whr < 0.85 ? 'meas-risk-mod' : 'meas-risk-high';
      whrHtml = `
        <div class="meas-whr-card">
          <span class="meas-whr-val">${whr}</span>
          <span class="meas-whr-lbl">Waist-to-Hip Ratio</span>
          <span class="meas-whr-risk ${riskCls}">${risk} Risk</span>
        </div>`;
    }

    const cards = MEASURES
      .filter(m => latest[m.key] != null)
      .map(m => {
        const delta = prev && prev[m.key] != null
          ? (+latest[m.key] - +prev[m.key]) : null;
        const sign = delta > 0 ? '+' : '';
        const deltaHtml = delta != null
          ? `<span class="${delta < 0 ? 'meas-delta-pos' : delta > 0 ? 'meas-delta-neg' : ''}">${sign}${delta.toFixed(1)}</span>`
          : '';
        return `
          <div class="meas-card">
            <div class="meas-card-val">${(+latest[m.key]).toFixed(1)}</div>
            <div class="meas-card-unit">${unit}</div>
            <div class="meas-card-lbl">${_esc(m.label)}</div>
            ${deltaHtml ? `<div class="meas-card-delta">${deltaHtml}</div>` : ''}
          </div>`;
      }).join('');

    el.innerHTML = `
      <div class="meas-test-date">Latest — ${_esc(dateLabel)}</div>
      ${whrHtml}
      <div class="meas-cards-grid">${cards}</div>
    `;
  }

  // ── Trend chart ────────────────────────────────────────────────────────────
  function _renderChart(measureKey) {
    _activeMeasure = measureKey || _activeMeasure;
    const canvas = document.getElementById('meas-trend-chart');
    if (!canvas) return;

    const sorted = _sorted().filter(e => e[_activeMeasure] != null);
    const emptyMsg = document.getElementById('meas-chart-empty');

    if (sorted.length < 2) {
      canvas.style.display = 'none';
      if (emptyMsg) emptyMsg.style.display = 'block';
      return;
    }
    canvas.style.display = 'block';
    if (emptyMsg) emptyMsg.style.display = 'none';

    const labels = sorted.map(e => {
      const d = new Date(e.date + 'T00:00:00');
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    });
    const data  = sorted.map(e => +e[_activeMeasure]);
    const unit  = sorted[sorted.length - 1]?.unit || 'cm';
    const mDef  = MEASURES.find(m => m.key === _activeMeasure) || MEASURES[0];

    if (_chart) { try { _chart.destroy(); } catch (_e) {} _chart = null; }

    _chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: mDef.label + ' (' + unit + ')',
          data,
          borderColor: '#39ff8f',
          backgroundColor: 'rgba(57,255,143,0.08)',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#39ff8f',
          tension: 0.35,
          fill: true
        }]
      },
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#081713',
            titleColor: '#c7ffe6',
            bodyColor: '#d8fff1',
            borderColor: 'rgba(57,255,143,.35)',
            borderWidth: 1,
            padding: 10,
            displayColors: false
          }
        },
        scales: {
          x: {
            ticks: { color: '#8ac7ad', font: { size: 10 }, maxRotation: 0 },
            grid: { color: 'rgba(90,255,170,0.12)' }
          },
          y: {
            ticks: { color: '#8ac7ad', font: { size: 10 } },
            grid: { color: 'rgba(90,255,170,0.12)' }
          }
        }
      }
    });

    // Update active tab button
    document.querySelectorAll('.meas-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.key === _activeMeasure);
    });
  }

  // ── Measurement tab buttons ────────────────────────────────────────────────
  function _renderChartTabs() {
    const el = document.getElementById('meas-chart-tabs');
    if (!el) return;
    const sorted = _sorted();
    // Only show tabs for measures that have data
    const available = MEASURES.filter(m => sorted.some(e => e[m.key] != null));
    if (!available.length) { el.innerHTML = ''; return; }
    el.innerHTML = available.map(m =>
      `<button class="meas-tab-btn${m.key === _activeMeasure ? ' active' : ''}"
        data-key="${_esc(m.key)}"
        onclick="window._measSwitchChart('${_esc(m.key)}')">${_esc(m.label)}</button>`
    ).join('');
  }

  // ── History list ───────────────────────────────────────────────────────────
  function _renderHistory() {
    const el = document.getElementById('meas-history-list');
    if (!el) return;
    const sorted = _sorted().reverse();
    if (!sorted.length) {
      el.innerHTML = '<div class="meas-empty-note">No entries yet.</div>';
      return;
    }
    el.innerHTML = sorted.map(e => {
      const dateLabel = new Date(e.date + 'T00:00:00').toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
      const unit = e.unit || 'cm';
      const chips = MEASURES
        .filter(m => e[m.key] != null)
        .map(m => `<span class="meas-hist-chip">${_esc(m.label)}: ${(+e[m.key]).toFixed(1)} ${unit}</span>`)
        .join('');
      return `
        <div class="meas-history-item">
          <div class="meas-hist-header">
            <span class="meas-hist-date">${_esc(dateLabel)}</span>
            <button class="ib-delete-btn" onclick="window._measDeleteEntry('${_esc(e.id)}')" title="Delete">×</button>
          </div>
          <div class="meas-hist-chips">${chips}</div>
        </div>`;
    }).join('');
  }

  // ── Main render ────────────────────────────────────────────────────────────
  function renderMeasurementsPanel() {
    _load();
    _renderSummaryCards();
    _renderChartTabs();
    _renderChart(_activeMeasure);
    _renderHistory();
  }

  // ── Global API ─────────────────────────────────────────────────────────────
  window._measurementEntries      = _entries;
  window.openMeasurementsForm     = openMeasurementsForm;
  window.closeMeasurementsForm    = closeMeasurementsForm;
  window.saveMeasurementEntry     = saveMeasurementEntry;
  window.renderMeasurementsPanel  = renderMeasurementsPanel;
  window._measDeleteEntry         = deleteMeasurementEntry;
  window._measSwitchChart         = (key) => { _renderChart(key); };
  window._measGetEntries          = () => { _load(); return _entries; };
  window.FORGE_MEASURES           = MEASURES;

  window.addEventListener('forge:measurements-updated', renderMeasurementsPanel);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { _load(); window._measurementEntries = _entries; });
  } else {
    _load();
    window._measurementEntries = _entries;
  }
})();
