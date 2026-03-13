// FORGE Gym Tracker - muscle detail modal and share/download poster
// UTF-safe rebuild to avoid mojibake and ensure downloadable muscle poster.

(function () {
  'use strict';

  let _mdcCurrentMuscle = null;

  const MUSCLE_THEME = {
    Chest: { colorA: '#35d081', colorB: '#1ea95e', icon: 'chest' },
    Back: { colorA: '#48b0ff', colorB: '#1c7fd9', icon: 'back' },
    Shoulders: { colorA: '#b07cff', colorB: '#7b45dd', icon: 'shoulders' },
    Biceps: { colorA: '#ffb65c', colorB: '#e37a18', icon: 'arm' },
    Triceps: { colorA: '#ff7f7f', colorB: '#d54c4c', icon: 'arm' },
    Core: { colorA: '#ffd66a', colorB: '#e6ad1e', icon: 'core' },
    Legs: { colorA: '#45d3c7', colorB: '#1ea79c', icon: 'legs' },
    Glutes: { colorA: '#ff77aa', colorB: '#cc4177', icon: 'glutes' },
    Calves: { colorA: '#5ac9ff', colorB: '#2b8fcb', icon: 'legs' },
    Forearms: { colorA: '#ffad4f', colorB: '#dc7a16', icon: 'arm' },
    Traps: { colorA: '#8ca2b5', colorB: '#586f83', icon: 'back' },
    'Lower Back': { colorA: '#8e73ff', colorB: '#5c45d0', icon: 'back' }
  };

  function _tt(key, fallback) {
    try {
      if (typeof t === 'function') {
        const raw = t(key) || '';
        const txt = String(raw);
        // Guard against mojibake text leaking into modal/image labels.
        if (txt && !/(?:â|Ã|�|ًں)/.test(txt)) return txt;
      }
    } catch (_) {}
    return fallback;
  }

  function _esc(v) {
    if (window.FORGE_STORAGE && typeof window.FORGE_STORAGE.esc === 'function') {
      return window.FORGE_STORAGE.esc(v);
    }
    return String(v || '').replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch] || ch;
    });
  }

  function _allWorkouts() {
    if (Array.isArray(window.workouts)) return window.workouts;
    try {
      if (typeof workouts !== 'undefined' && Array.isArray(workouts)) return workouts;
    } catch (_) {}
    return [];
  }

  function _todayIso() {
    return new Date().toISOString().slice(0, 10);
  }

  function _toIsoDay(v) {
    if (!v) return '';
    const s = String(v);
    if (s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  }

  function _byDateDesc(a, b) {
    return (new Date(b.date || 0)).getTime() - (new Date(a.date || 0)).getTime();
  }

  function _getMuscleSessions(muscle) {
    const target = String(muscle || '').toLowerCase().trim();
    const rows = _allWorkouts().filter(function (w) {
      return String(w && w.muscle || '').toLowerCase().trim() === target;
    }).sort(_byDateDesc);

    const byDay = new Map();
    rows.forEach(function (w) {
      const day = _toIsoDay(w.date);
      if (!day) return;
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day).push(w);
    });

    const days = Array.from(byDay.keys()).sort(function (a, b) {
      return new Date(b).getTime() - new Date(a).getTime();
    });

    return {
      rows: rows,
      days: days,
      byDay: byDay
    };
  }

  function _calcSetVolume(set) {
    const reps = Number(set && set.reps) || 0;
    const weight = Number(set && set.weight) || 0;
    if (reps <= 0 || weight <= 0) return 0;
    return reps * weight;
  }

  function _exerciseVolume(row) {
    const direct = Number(row && row.totalVolume) || 0;
    if (direct > 0) return direct;
    const sets = Array.isArray(row && row.sets) ? row.sets : [];
    return sets.reduce(function (acc, s) { return acc + _calcSetVolume(s); }, 0);
  }

  function _summarizeDay(rows) {
    const list = Array.isArray(rows) ? rows : [];
    const volume = list.reduce(function (acc, r) { return acc + _exerciseVolume(r); }, 0);
    const sets = list.reduce(function (acc, r) { return acc + (Array.isArray(r.sets) ? r.sets.length : 0); }, 0);
    const uniqueExercises = new Set(list.map(function (r) { return String(r.exercise || '').trim(); }).filter(Boolean));
    const prs = list.filter(function (r) { return !!r.isPR; }).length;
    return {
      volume: Math.round(volume),
      sets: sets,
      exerciseCount: uniqueExercises.size,
      prCount: prs
    };
  }

  function _fmtVolume(v) {
    const n = Number(v) || 0;
    if (!n) return '-';
    if (n >= 1000) return (n / 1000).toFixed(1) + ' t';
    return n.toLocaleString() + ' kg';
  }

  function _fmtDateLabel(dayIso) {
    if (!dayIso) return '-';
    const d = new Date(dayIso + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return dayIso;
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  function _calcMuscleStreak(days) {
    if (!Array.isArray(days) || !days.length) return 0;

    const today = _todayIso();
    const first = days[0];
    const firstTs = new Date(first + 'T00:00:00').getTime();
    const todayTs = new Date(today + 'T00:00:00').getTime();
    const diffDays = Math.floor((todayTs - firstTs) / 86400000);
    if (diffDays > 1) return 0;

    let streak = 1;
    let cursor = firstTs;
    for (let i = 1; i < days.length; i++) {
      const ts = new Date(days[i] + 'T00:00:00').getTime();
      const d = Math.floor((cursor - ts) / 86400000);
      if (d === 1) {
        streak += 1;
        cursor = ts;
      } else if (d > 1) {
        break;
      }
    }
    return streak;
  }

  function _statusFromLast(dayIso) {
    if (!dayIso) {
      return {
        label: _tt('recovery.never', 'No sessions yet'),
        style: 'background:rgba(255,255,255,.08);color:var(--text3)'
      };
    }

    const d = Math.floor((Date.now() - new Date(dayIso + 'T00:00:00').getTime()) / 86400000);
    if (d <= 1) return { label: _tt('recovery.tier1', 'Hot / recent'), style: 'background:#e74c3c33;color:#e74c3c' };
    if (d <= 3) return { label: _tt('recovery.tier2', 'Recovering'), style: 'background:#e67e2233;color:#e67e22' };
    if (d <= 6) return { label: _tt('recovery.tier3', 'Ready soon'), style: 'background:#f1c40f33;color:#f1c40f' };
    if (d <= 13) return { label: _tt('recovery.tier4', 'Ready'), style: 'background:#2ecc7133;color:#2ecc71' };
    return { label: _tt('recovery.tier5', 'Detrained'), style: 'background:rgba(255,255,255,.08);color:var(--text3)' };
  }

  function _iconSvg(type, colorA, colorB) {
    const c1 = colorA || '#54ffab';
    const c2 = colorB || '#2dbf77';
    const body = {
      chest: '<path d="M12 4l4 2 1 5-5 9-5-9 1-5 4-2z"/><path d="M12 6v12"/>',
      back: '<path d="M7 5h10l2 5-2 9H7L5 10l2-5z"/><path d="M12 6v12"/>',
      shoulders: '<path d="M4 11l3-5h10l3 5-2 8H6l-2-8z"/><path d="M8 8l4 4 4-4"/>',
      arm: '<path d="M7 8l3-3h4l3 3-1 4-5 7-5-7-1-4z"/><path d="M9 10h6"/>',
      core: '<rect x="7" y="4" width="10" height="16" rx="4"/><path d="M12 6v12"/><path d="M8 10h8"/><path d="M8 14h8"/>',
      legs: '<path d="M9 4h6l1 6-2 10h-4L8 10l1-6z"/><path d="M10 14h4"/>',
      glutes: '<path d="M8 7h8l2 6-6 7-6-7 2-6z"/><path d="M12 8v11"/>'
    };
    const g = body[type] || body.core;
    return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="url(#mGrad)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><defs><linearGradient id="mGrad" x1="0" y1="0" x2="24" y2="24"><stop stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient></defs>' + g + '</svg>';
  }

  function _setButtonBusy(button, busyText) {
    if (!button) return function () {};
    const prev = button.textContent;
    button.disabled = true;
    button.textContent = busyText;
    return function () {
      button.disabled = false;
      button.textContent = prev;
    };
  }

  function _setHeaderIcon(muscle) {
    const iconEl = document.getElementById('mdc-icon');
    if (!iconEl) return;
    const theme = MUSCLE_THEME[muscle] || { colorA: '#54ffab', colorB: '#2dbf77', icon: 'core' };
    iconEl.innerHTML = _iconSvg(theme.icon, theme.colorA, theme.colorB);
    iconEl.style.background = 'linear-gradient(135deg,' + theme.colorA + ',' + theme.colorB + ')';
  }

  function _exerciseRowsHtml(dayRows, theme) {
    const rows = Array.isArray(dayRows) ? dayRows : [];
    if (!rows.length) {
      return '<div style="color:var(--text3);font-family:Barlow Condensed,sans-serif;font-size:14px;padding:12px 0;">No workout data yet</div>';
    }

    return rows.map(function (w) {
      const sets = Array.isArray(w.sets) ? w.sets : [];
      const best = sets.reduce(function (bestSet, s) {
        const curVol = _calcSetVolume(s);
        const bestVol = _calcSetVolume(bestSet);
        return curVol > bestVol ? s : bestSet;
      }, sets[0] || {});

      const reps = Number(best.reps) || 0;
      const wt = Number(best.weight) || 0;
      const unit = best.unit || 'kg';
      const setLabel = sets.length + ' sets';
      const topLabel = (wt > 0 && reps > 0) ? (reps + ' x ' + wt + unit) : (reps > 0 ? reps + ' reps' : 'No top set');
      const detail = setLabel + ' | ' + topLabel;

      return '' +
        '<div class="mdc-ex-row">' +
        '  <div class="mdc-ex-icon">' + _iconSvg('core', theme.colorA, theme.colorB) + '</div>' +
        '  <div class="mdc-ex-name">' + _esc(w.exercise || 'Exercise') + '</div>' +
        '  <div class="mdc-ex-detail">' + _esc(detail) + '</div>' +
        (w.isPR ? '<div class="mdc-pr-badge">PR</div>' : '') +
        '</div>';
    }).join('');
  }

  function _buildMuscleShareText(muscle, data) {
    const day = data.days[0] || '';
    if (!day) {
      return [
        'FORGE GYM',
        '',
        muscle.toUpperCase() + ' has no logged sessions yet.',
        'Start now and build your streak.'
      ].join('\n');
    }

    const rows = data.byDay.get(day) || [];
    const sum = _summarizeDay(rows);
    const streak = _calcMuscleStreak(data.days);
    const lines = rows.slice(0, 4).map(function (r) {
      const sets = Array.isArray(r.sets) ? r.sets.length : 0;
      return '- ' + (r.exercise || 'Exercise') + ' | ' + sets + ' sets | ' + _fmtVolume(_exerciseVolume(r));
    });

    return [
      'FORGE GYM | ' + muscle.toUpperCase(),
      _fmtDateLabel(day),
      'Volume: ' + _fmtVolume(sum.volume),
      'Sets: ' + sum.sets,
      'Exercises: ' + sum.exerciseCount,
      'Streak: ' + streak + ' day(s)',
      '',
      lines.join('\n')
    ].join('\n');
  }

  function _canvasToBlobSafe(canvas) {
    return new Promise(function (resolve) {
      if (!canvas || !canvas.toBlob) return resolve(null);
      canvas.toBlob(function (blob) { resolve(blob || null); }, 'image/png');
    });
  }

  function _downloadBlobSafe(blob, filename) {
    if (typeof window._downloadBlob === 'function') {
      window._downloadBlob(blob, filename);
      return;
    }
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function _getAthleteName() {
    try {
      if (typeof userProfile !== 'undefined' && userProfile && userProfile.name) {
        return String(userProfile.name).trim() || 'FORGE ATHLETE';
      }
    } catch (_) {}
    try {
      const p = JSON.parse(localStorage.getItem('forge_profile') || '{}');
      if (p && p.name) return String(p.name).trim();
    } catch (_) {}
    return 'FORGE ATHLETE';
  }

  function _drawRoundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  function _wrapLines(ctx, text, maxWidth) {
    const words = String(text || '').split(/\s+/);
    const lines = [];
    let line = '';
    for (let i = 0; i < words.length; i++) {
      const test = line ? (line + ' ' + words[i]) : words[i];
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = words[i];
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function _drawMetricCard(ctx, x, y, w, h, label, value) {
    _drawRoundRect(ctx, x, y, w, h, 16);
    ctx.fillStyle = 'rgba(12,24,18,.88)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(84,255,171,.24)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = 'rgba(172,206,184,.88)';
    ctx.font = '600 17px "DM Mono", monospace';
    ctx.fillText(label, x + 14, y + 32);

    ctx.fillStyle = '#eafbf0';
    ctx.font = '700 42px "Barlow Condensed", sans-serif';
    ctx.fillText(String(value), x + 14, y + 86);
  }

  function _drawTrendBars(ctx, x, y, w, h, volumes, colorA, colorB) {
    _drawRoundRect(ctx, x, y, w, h, 16);
    ctx.fillStyle = 'rgba(12,24,18,.88)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(84,255,171,.24)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#9cf4c5';
    ctx.font = '600 20px "DM Mono", monospace';
    ctx.fillText('RECENT VOLUME TREND', x + 18, y + 34);

    const vals = volumes.slice(0, 7).reverse();
    const max = Math.max(1, ...vals);
    const chartX = x + 20;
    const chartY = y + 52;
    const chartW = w - 40;
    const chartH = h - 78;

    const grad = ctx.createLinearGradient(chartX, chartY, chartX, chartY + chartH);
    grad.addColorStop(0, colorA);
    grad.addColorStop(1, colorB);

    const barGap = 10;
    const barW = Math.floor((chartW - (vals.length - 1) * barGap) / Math.max(1, vals.length));
    vals.forEach(function (v, idx) {
      const bh = Math.max(4, Math.round((v / max) * (chartH - 18)));
      const bx = chartX + idx * (barW + barGap);
      const by = chartY + chartH - bh;
      _drawRoundRect(ctx, bx, by, barW, bh, 8);
      ctx.fillStyle = grad;
      ctx.fill();
    });

    ctx.fillStyle = 'rgba(166,196,175,.9)';
    ctx.font = '500 14px "DM Mono", monospace';
    ctx.fillText('Latest: ' + _fmtVolume(volumes[0] || 0), x + 18, y + h - 16);
  }

  async function _buildMuscleCardCanvas(muscle, data) {
    const theme = MUSCLE_THEME[muscle] || { colorA: '#54ffab', colorB: '#2dbf77', icon: 'core' };

    const canvas = document.createElement('canvas');
    const W = 1080;
    const H = 1350;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#04110a');
    bg.addColorStop(0.55, '#081a12');
    bg.addColorStop(1, '#05110b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const glowA = ctx.createRadialGradient(180, 180, 30, 180, 180, 420);
    glowA.addColorStop(0, 'rgba(84,255,171,.26)');
    glowA.addColorStop(1, 'rgba(84,255,171,0)');
    ctx.fillStyle = glowA;
    ctx.fillRect(0, 0, W, H);

    const glowB = ctx.createRadialGradient(W - 180, 380, 30, W - 180, 380, 460);
    glowB.addColorStop(0, 'rgba(96,174,255,.18)');
    glowB.addColorStop(1, 'rgba(96,174,255,0)');
    ctx.fillStyle = glowB;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#54ffab';
    ctx.font = '700 62px "Bebas Neue", sans-serif';
    ctx.fillText('FORGE MUSCLE REPORT', 72, 94);

    ctx.fillStyle = '#e7f7ed';
    ctx.font = '700 58px "Barlow Condensed", sans-serif';
    ctx.fillText(String(muscle || 'MUSCLE').toUpperCase(), 72, 152);

    const name = _getAthleteName().toUpperCase();
    ctx.fillStyle = 'rgba(198,225,206,.92)';
    ctx.font = '600 24px "DM Mono", monospace';
    ctx.fillText('ATHLETE: ' + name, 72, 188);

    const day0 = data.days[0] || '';
    ctx.fillStyle = 'rgba(176,204,184,.85)';
    ctx.font = '500 20px "DM Mono", monospace';
    ctx.fillText(day0 ? _fmtDateLabel(day0) : 'No sessions logged yet', 72, 220);

    const dayRows = day0 ? (data.byDay.get(day0) || []) : [];
    const summary = _summarizeDay(dayRows);
    const streak = _calcMuscleStreak(data.days);

    const cardY = 250;
    const cardGap = 16;
    const cw = Math.floor((W - 144 - cardGap * 3) / 4);
    const ch = 126;
    _drawMetricCard(ctx, 72, cardY, cw, ch, 'SESSIONS', data.days.length || 0);
    _drawMetricCard(ctx, 72 + (cw + cardGap), cardY, cw, ch, 'STREAK', streak + 'D');
    _drawMetricCard(ctx, 72 + 2 * (cw + cardGap), cardY, cw, ch, 'SETS', summary.sets || 0);
    _drawMetricCard(ctx, 72 + 3 * (cw + cardGap), cardY, cw, ch, 'VOLUME', _fmtVolume(summary.volume));

    const trendVols = data.days.slice(0, 7).map(function (d) {
      return _summarizeDay(data.byDay.get(d) || []).volume;
    });
    _drawTrendBars(ctx, 72, 402, W - 144, 252, trendVols, theme.colorA, theme.colorB);

    _drawRoundRect(ctx, 72, 678, W - 144, 560, 18);
    ctx.fillStyle = 'rgba(12,24,18,.9)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(84,255,171,.24)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#9cf4c5';
    ctx.font = '600 22px "DM Mono", monospace';
    ctx.fillText('LAST SESSION EXERCISES', 94, 716);

    if (!dayRows.length) {
      ctx.fillStyle = '#e9f7ee';
      ctx.font = '700 30px "Barlow Condensed", sans-serif';
      ctx.fillText('No data yet. Train this muscle to generate report.', 94, 780);
    } else {
      let y = 760;
      dayRows.slice(0, 8).forEach(function (row, idx) {
        const exVol = _exerciseVolume(row);
        const sets = Array.isArray(row.sets) ? row.sets.length : 0;
        const line = (idx + 1) + '. ' + (row.exercise || 'Exercise');
        const meta = sets + ' sets | ' + _fmtVolume(exVol) + (row.isPR ? ' | PR' : '');

        _drawRoundRect(ctx, 92, y - 34, W - 184, 62, 10);
        ctx.fillStyle = idx % 2 ? 'rgba(16,31,24,.82)' : 'rgba(13,26,20,.82)';
        ctx.fill();

        ctx.fillStyle = '#f0faf2';
        ctx.font = '700 27px "Barlow Condensed", sans-serif';
        const lineText = _wrapLines(ctx, line, W - 240)[0] || line;
        ctx.fillText(lineText, 108, y - 8);

        ctx.fillStyle = 'rgba(177,206,186,.92)';
        ctx.font = '500 17px "Barlow", sans-serif';
        ctx.fillText(meta, 108, y + 14);

        y += 68;
      });
    }

    ctx.fillStyle = 'rgba(207,227,214,.66)';
    ctx.font = '500 17px "DM Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('Built with FORGE | ' + new Date().toISOString().slice(0, 10), W - 72, H - 24);
    ctx.textAlign = 'left';

    return canvas;
  }

  async function _ensureMuscleCanvas(muscle, data) {
    return await _buildMuscleCardCanvas(muscle, data);
  }

  function _setToast(msg, tone) {
    if (typeof showToast === 'function') {
      showToast(msg, tone || 'var(--accent)');
    }
  }

  window._openMuscleDetail = function (muscle) {
    _mdcCurrentMuscle = muscle;
    const modal = document.getElementById('muscle-detail-modal');
    if (!modal) return;

    const data = _getMuscleSessions(muscle);
    const theme = MUSCLE_THEME[muscle] || { colorA: '#54ffab', colorB: '#2dbf77', icon: 'core' };

    const nameEl = document.getElementById('mdc-name');
    if (nameEl) nameEl.textContent = String(muscle || 'Muscle').toUpperCase();
    _setHeaderIcon(muscle);

    const lastDay = data.days[0] || '';
    const status = _statusFromLast(lastDay);
    const badge = document.getElementById('mdc-badge');
    if (badge) {
      badge.textContent = status.label;
      badge.style.cssText = status.style;
    }

    const dateEl = document.getElementById('mdc-date');
    if (dateEl) {
      dateEl.textContent = lastDay
        ? (_fmtDateLabel(lastDay) + ' | ' + data.days.length + ' session day(s) logged')
        : 'No sessions logged yet';
    }

    const dayRows = lastDay ? (data.byDay.get(lastDay) || []) : [];
    const exEl = document.getElementById('mdc-exercises');
    if (exEl) exEl.innerHTML = _exerciseRowsHtml(dayRows, theme);

    const sum = _summarizeDay(dayRows);
    const volEl = document.getElementById('mdc-vol');
    const setsEl = document.getElementById('mdc-sets');
    const exCountEl = document.getElementById('mdc-excount');
    if (volEl) volEl.textContent = _fmtVolume(sum.volume);
    if (setsEl) setsEl.textContent = String(sum.sets || 0);
    if (exCountEl) exCountEl.textContent = String(sum.exerciseCount || 0);

    const deltaEl = document.getElementById('mdc-delta');
    if (deltaEl) {
      if (data.days.length >= 2) {
        const prevRows = data.byDay.get(data.days[1]) || [];
        const prev = _summarizeDay(prevRows).volume;
        if (prev > 0 && sum.volume > 0) {
          const pct = Math.round(((sum.volume - prev) / prev) * 100);
          const sign = pct >= 0 ? '+' : '';
          deltaEl.className = 'mdc-delta ' + (pct > 0 ? 'up' : (pct < 0 ? 'down' : 'same'));
          deltaEl.textContent = sign + pct + '% vs previous session (' + _fmtVolume(prev) + ')';
        } else {
          deltaEl.className = 'mdc-delta same';
          deltaEl.textContent = 'No comparable volume yet';
        }
      } else {
        deltaEl.className = 'mdc-delta same';
        deltaEl.textContent = 'Need one more session for trend';
      }
    }

    const trainBtn = document.getElementById('mdc-train-btn');
    if (trainBtn) trainBtn.textContent = 'TRAIN ' + String(muscle || 'MUSCLE').toUpperCase() + ' NOW';

    modal.classList.add('open');
    document.body.classList.add('scroll-locked');
  };

  window._closeMuscleDetail = function () {
    const modal = document.getElementById('muscle-detail-modal');
    if (modal) modal.classList.remove('open');
    document.body.classList.remove('scroll-locked');
    _mdcCurrentMuscle = null;
  };

  window._mdcTrainNow = function () {
    const muscle = _mdcCurrentMuscle || ((document.getElementById('mdc-name') || {}).textContent || '');
    window._closeMuscleDetail();

    const muscleTitle = String(muscle).charAt(0).toUpperCase() + String(muscle).slice(1).toLowerCase();
    if (typeof selectMuscle === 'function') selectMuscle(muscleTitle);
    if (typeof showView === 'function') showView('log');
    else if (typeof switchView === 'function') switchView('log');
  };

  window._shareMuscleCard = async function () {
    const muscle = _mdcCurrentMuscle;
    if (!muscle) return;

    const btn = document.querySelector('.mdc-share-btn');
    const release = _setButtonBusy(btn, 'PREPARING');

    try {
      const data = _getMuscleSessions(muscle);
      const text = _buildMuscleShareText(muscle, data);
      const canvas = await _ensureMuscleCanvas(muscle, data);
      const blob = await _canvasToBlobSafe(canvas);

      if (blob) {
        const filename = 'forge-muscle-' + String(muscle || 'report').toLowerCase().replace(/\s+/g, '-') + '-' + _todayIso() + '.png';
        const file = new File([blob], filename, { type: 'image/png' });
        const canShareFile = !!(navigator.canShare && navigator.canShare({ files: [file] }));

        if (navigator.share && canShareFile) {
          try {
            await navigator.share({ title: 'FORGE Muscle Report', text: text, files: [file] });
            return;
          } catch (e) {
            if (e && e.name === 'AbortError') return;
          }
        }

        _downloadBlobSafe(blob, filename);
        _setToast('Share image downloaded', 'var(--accent)');
      } else if (navigator.share) {
        await navigator.share({ title: 'FORGE Muscle Report', text: text });
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        _setToast('Session text copied', 'var(--accent)');
      }
    } catch (_) {
      _setToast('Unable to share muscle report', 'var(--warn)');
    } finally {
      release();
    }
  };

  window._downloadMuscleCard = async function () {
    const muscle = _mdcCurrentMuscle;
    if (!muscle) return;

    const btn = document.querySelector('.mdc-download-btn');
    const release = _setButtonBusy(btn, 'EXPORTING');

    try {
      const data = _getMuscleSessions(muscle);
      const canvas = await _ensureMuscleCanvas(muscle, data);
      const blob = await _canvasToBlobSafe(canvas);
      if (!blob) {
        _setToast('No data to export yet', 'var(--warn)');
        return;
      }

      const filename = 'forge-muscle-' + String(muscle || 'report').toLowerCase().replace(/\s+/g, '-') + '-' + _todayIso() + '.png';
      _downloadBlobSafe(blob, filename);
      _setToast('Muscle image downloaded', 'var(--accent)');
    } catch (_) {
      _setToast('Could not export muscle image', 'var(--warn)');
    } finally {
      release();
    }
  };

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') window._closeMuscleDetail();
  });
})();
