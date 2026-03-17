// FORGE Coach Triggers — proactive LLM-powered coaching engine
// Replaces static rule-based notifications in coach-state.js
// All LLM calls go through existing forge-search edge function

'use strict';
(function () {

  const SEARCH_FN = window.FORGE_CONFIG?.SUPABASE_URL + '/functions/v1/forge-search';

  // ── Cooldown: prevent same trigger firing twice within 10 minutes ──────────
  // Persisted to sessionStorage so it survives navigation but not full reload.
  function _onCooldown(key) {
    try { const last = +(sessionStorage.getItem('fct_' + key) || 0); return Date.now() - last < 10 * 60 * 1000; } catch { return false; }
  }
  function _setCooldown(key) { try { sessionStorage.setItem('fct_' + key, String(Date.now())); } catch {} }

  // ── Fire a short proactive coach message (max 80 tokens) ──────────────────
  async function _fireCoachMessage(triggerKey, systemNote, userPrompt, onResult) {
    if (_onCooldown(triggerKey)) return;

    if (!window.FORGE_CONFIG?.SUPABASE_URL) {
      console.warn('[coach-triggers] FORGE_CONFIG not ready');
      return;
    }

    const session = await window._sb?.auth?.getSession?.();
    const token = session?.data?.session?.access_token;
    if (!token) return;

    try {
      const resp = await fetch(SEARCH_FN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: userPrompt,
          type_filter: null,
          coach_mode: true,
          coach_system: systemNote,
          max_tokens: 80
        })
      });
      if (!resp.ok) return;
      _setCooldown(triggerKey); // set cooldown only on successful response
      const reader = resp.body?.getReader();
      if (!reader) return;
      let text = '';
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        // forge-search emits: event: token\ndata: {"token":"..."}\n\n
        chunk.split('\n').forEach(line => {
          if (line.startsWith('data: ')) {
            const d = line.slice(6).trim();
            if (d && d !== '[DONE]') {
              try { text += JSON.parse(d)?.token || ''; } catch {}
            }
          }
        });
      }
      if (text.trim() && typeof onResult === 'function') onResult(text.trim());
    } catch (e) {
      console.warn('[coach-triggers] LLM call failed:', e);
    }
  }

  // ── Show an inline intercept card above the muscle selector ───────────────
  function _showInterceptCard(message, cta1Label, cta1Fn) {
    const existing = document.getElementById('coach-intercept-card');
    if (existing) existing.remove();

    const card = document.createElement('div');
    card.id = 'coach-intercept-card';
    card.className = 'coach-intercept-card';
    card.innerHTML = `
      <div class="cic-top"><span class="cic-icon">🤖</span><span class="cic-label">FORGE COACH</span></div>
      <div class="cic-body"><div class="cic-message"></div></div>
      <div class="cic-actions">
        ${cta1Label ? `<button class="cic-btn cic-btn-primary" id="cic-cta1">${cta1Label}</button>` : ''}
        <button class="cic-btn cic-btn-dismiss" id="cic-dismiss">Log anyway</button>
      </div>
    `;
    // Set message via textContent to prevent XSS from LLM output
    card.querySelector('.cic-message').textContent = message;
    const anchor = document.getElementById('muscle-btn-grid') || document.getElementById('sets-container');
    if (anchor) anchor.parentNode.insertBefore(card, anchor);

    if (cta1Label) {
      document.getElementById('cic-cta1')?.addEventListener('click', () => {
        card.remove();
        cta1Fn?.();
      });
    }
    document.getElementById('cic-dismiss')?.addEventListener('click', () => card.remove());
  }

  // ── Trigger: muscle recovery intercept (fires on muscle selection) ─────────
  window.FORGE_COACH = window.FORGE_COACH || {};
  window.FORGE_COACH.checkMuscleRecovery = function (muscleName) {
    if (!muscleName) return;
    const triggerKey = `muscle_recovery_${muscleName}_${new Date().toDateString()}`;
    if (_onCooldown(triggerKey)) return;

    const status = window._getMuscleRecoveryStatus?.(muscleName);
    const recoveryWindow = (window._COACH_RECOVERY_WINDOW?.[muscleName.toLowerCase()] || 48);
    if (!status || status.hoursAgo >= recoveryWindow) return;

    const alternatives = window._getRecoveredMuscles?.() || [];
    const altStr = alternatives.slice(0, 2).join(' or ') || 'another muscle group';

    _fireCoachMessage(
      triggerKey,
      'You are FORGE Coach. Reply in 1 sentence, max 15 words. Be direct, not preachy. Plain text only, no markdown.',
      `User wants to train ${muscleName} but only rested ${Math.round(status.hoursAgo)}h. Suggest ${altStr}.`,
      (msg) => {
        _showInterceptCard(
          `⚠️ ${msg}`,
          altStr ? `Switch to ${alternatives[0]}` : null,
          () => {
            if (typeof selectMuscle === 'function' && alternatives[0]) selectMuscle(alternatives[0]);
          }
        );
      }
    );
  };

  // ── Trigger: post-workout plateau coach tip ───────────────────────────────
  window.FORGE_COACH.checkPlateau = function (exerciseName) {
    if (!exerciseName) return;
    const plateau = window.FORGE_OVERLOAD?.getPlateauLength?.(exerciseName) || 0;
    if (plateau < 3) return;

    const triggerKey = `plateau_${exerciseName}_${new Date().toDateString()}`;
    _fireCoachMessage(
      triggerKey,
      'You are FORGE Coach. Reply in 1 sentence, max 20 words. Be actionable. Plain text only, no markdown.',
      `User has a ${plateau}-session plateau on ${exerciseName}. Give one concrete tip.`,
      (msg) => {
        if (typeof showToast === 'function') showToast(`🧠 ${msg}`, 'info', 5000);
      }
    );
  };

  // ── Trigger: plateau → proactive form cue fetch ───────────────────────────
  window.FORGE_COACH.fetchFormCue = async function (exerciseName) {
    if (!exerciseName) return;
    const plateau = window.FORGE_OVERLOAD?.getPlateauLength?.(exerciseName) || 0;
    if (plateau < 2) return;

    const triggerKey = `form_cue_${exerciseName}_${new Date().toDateString()}`;
    if (_onCooldown(triggerKey)) return;
    _setCooldown(triggerKey);

    const session = await window._sb?.auth?.getSession?.();
    const token = session?.data?.session?.access_token;
    if (!token) return;

    const SEARCH_FN_FC = window.FORGE_CONFIG?.SUPABASE_URL + '/functions/v1/forge-search';
    if (!SEARCH_FN_FC || SEARCH_FN_FC === 'undefined/functions/v1/forge-search') return;
    try {
      const resp = await fetch(SEARCH_FN_FC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ query: `${exerciseName} form tip technique cue`, typeFilter: 'form_cue', max_tokens: 150 })
      });
      if (!resp.ok) return;
      const reader = resp.body?.getReader();
      if (!reader) return;
      let text = '';
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        chunk.split('\n').forEach(line => {
          if (line.startsWith('data: ')) {
            const d = line.slice(6).trim();
            if (d && d !== '[DONE]') {
              try { text += JSON.parse(d)?.token || ''; } catch {}
            }
          }
        });
      }
      if (text.trim()) {
        const existing = document.getElementById('coach-form-cue-card');
        if (existing) existing.remove();
        const card = document.createElement('div');
        card.id = 'coach-form-cue-card';
        card.className = 'coach-intercept-card';

        const iconDiv = document.createElement('div');
        iconDiv.className = 'cic-icon';
        iconDiv.textContent = '📐';

        const msgDiv = document.createElement('div');
        msgDiv.className = 'cic-message';
        const strong = document.createElement('strong');
        strong.textContent = 'Form Cue: ';
        msgDiv.appendChild(strong);
        msgDiv.appendChild(document.createTextNode(text.trim()));

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'cic-actions';

        const moreBtn = document.createElement('button');
        moreBtn.className = 'cic-btn cic-btn-primary';
        moreBtn.textContent = 'See More';
        moreBtn.addEventListener('click', () => document.getElementById('ask-forge-fab')?.click());

        const dismissBtn = document.createElement('button');
        dismissBtn.className = 'cic-btn cic-btn-dismiss';
        dismissBtn.textContent = 'Got it';
        dismissBtn.addEventListener('click', () => card.remove());

        actionsDiv.append(moreBtn, dismissBtn);
        card.append(iconDiv, msgDiv, actionsDiv);

        const anchor = document.getElementById('last-session-hint') || document.getElementById('sets-container');
        if (anchor) anchor.parentNode.insertBefore(card, anchor.nextSibling);
      }
    } catch {}
  };

  // ── Daily readiness morning brief ────────────────────────────────────────────
  async function _checkDailyReadiness() {
    // Render cached brief immediately (survives tab re-navigation within cooldown)
    const _cached = sessionStorage.getItem('fct_dr_text');
    if (_cached) {
      const _elNow = document.getElementById('coach-tab-today');
      if (_elNow && !document.getElementById('coach-daily-brief')) {
        const _wrapNow = _elNow.querySelector('.ctoday-wrap') || _elNow;
        const _c = document.createElement('div');
        _c.id = 'coach-daily-brief'; _c.className = 'coach-intercept-card';
        const _i = document.createElement('div'); _i.className = 'cic-icon'; _i.textContent = '🤖';
        const _m = document.createElement('div'); _m.className = 'cic-message'; _m.textContent = _cached;
        _c.appendChild(_i); _c.appendChild(_m);
        _wrapNow.insertBefore(_c, _wrapNow.firstChild);
      }
    }
    const todayKey = new Date().toISOString().slice(0, 10);
    const rdy = (() => { try { return JSON.parse(localStorage.getItem('forge_readiness') || '{}')[todayKey] || {}; } catch { return {}; } })();
    const profile = window.userProfile || {};
    const goal = profile.goal || 'muscle';
    const sleep = rdy.totalSleep ? `${rdy.totalSleep}h sleep` : 'sleep not logged';
    const hrv = rdy.hrv ? `HRV ${rdy.hrv}` : '';
    const rhr = rdy.rhr ? `RHR ${rdy.rhr}bpm` : '';
    const metrics = [sleep, hrv, rhr].filter(Boolean).join(', ');

    // Use last item as most-recent (array is push-appended)
    const lastWorkout = (() => {
      try {
        const ws = JSON.parse(localStorage.getItem('forge_workouts') || '[]');
        return ws.length ? ws[ws.length - 1] : null;
      } catch { return null; }
    })();
    const lastStr = lastWorkout ? `Last session: ${lastWorkout.muscle || 'unknown'} on ${lastWorkout.date}` : 'No recent sessions';

    await _fireCoachMessage(
      'daily_readiness_' + new Date().toDateString(),
      `You are FORGE, a concise elite coach. Give a 1-sentence morning brief based on the athlete's readiness data. Be direct and motivating. Max 80 tokens. Plain text only, no markdown.`,
      `Athlete readiness today: ${metrics}. ${lastStr}. Goal: ${goal}. What's your one-line coaching brief for today?`,
      (text) => {
        const el = document.getElementById('coach-tab-today');
        if (!el) return;
        // Update existing card if present (avoids duplicate after re-render)
        const existing = document.getElementById('coach-daily-brief');
        if (existing) {
          existing.querySelector('.cic-message').textContent = text;
          return;
        }
        // Build card using textContent to prevent XSS from LLM output
        const card = document.createElement('div');
        card.id = 'coach-daily-brief';
        card.className = 'coach-intercept-card';
        const icon = document.createElement('div');
        icon.className = 'cic-icon';
        icon.textContent = '🤖';
        const msg = document.createElement('div');
        msg.className = 'cic-message';
        msg.textContent = text;
        sessionStorage.setItem('fct_dr_text', text);
        card.appendChild(icon);
        card.appendChild(msg);
        // Insert inside .ctoday-wrap so it gets correct padding/background
        const wrap = el.querySelector('.ctoday-wrap') || el;
        wrap.insertBefore(card, wrap.firstChild);
      }
    );
  }

  window.FORGE_COACH.checkDailyReadiness = _checkDailyReadiness;

  // ── Helper: parse debrief text into structured sections ──────────────────
  function _parseDebriefSections(text) {
    // Try to split on (1), (2), (3) markers
    const parts = text.split(/\(\d\)/).map(s => s.replace(/^\s*[^:]*:\s*/, '').trim()).filter(Boolean);
    if (parts.length >= 2) return parts.slice(0, 3);
    // Fallback: split on double newline or just return as single block
    const lines = text.split(/\n{2,}/).filter(Boolean);
    if (lines.length >= 2) return lines.slice(0, 3);
    return [text.trim()];
  }
  window._parseDebriefSections = _parseDebriefSections;

  // ── Trigger: session debrief card (fires after workout save) ─────────────
  async function generateSessionDebrief(summary) {
    // Auth: get live session token
    const session = await window._sb?.auth?.getSession?.();
    const token = session?.data?.session?.access_token;
    if (!token) return; // guests skip debrief

    // Calendar-day check (survives browser restart)
    const todayStr = new Date().toDateString();
    const lsKey = 'forge_debrief_date';
    if (localStorage.getItem(lsKey) === todayStr) return;
    const cdKey = 'session_debrief_' + todayStr;
    if (_onCooldown(cdKey)) return;

    const musclesStr = (summary?.muscles || []).join(', ') || 'unknown muscles';
    const setsStr = summary?.totalSets ?? '?';
    const volPart = summary?.volumeDelta != null
      ? `, ${summary.volumeDelta >= 0 ? '+' : ''}${summary.volumeDelta}% volume vs last session`
      : '';
    const goal = (typeof userProfile !== 'undefined' ? userProfile : window.userProfile)?.goal || 'muscle';

    const query = `Workout complete: ${setsStr} sets on ${musclesStr}${volPart}. Goal: ${goal}. Give a 3-line debrief: (1) what was accomplished, (2) overload verdict, (3) recovery recommendation. Max 120 words.`;

    if (!window.FORGE_CONFIG?.SUPABASE_URL) return;

    // Build debrief card using DOM methods (premium design)
    const existing = document.getElementById('coach-debrief-card');
    if (existing) existing.remove();

    const card = document.createElement('div');
    card.id = 'coach-debrief-card';
    card.className = 'cdb-card';

    // Header
    const header = document.createElement('div');
    header.className = 'cdb-header';
    header.innerHTML = '<span class="cdb-icon">✦</span><span class="cdb-title">SESSION DEBRIEF</span><span class="cdb-date">' + new Date().toLocaleDateString('en-US', {month:'short', day:'numeric'}) + '</span>';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'cdb-close';
    closeBtn.innerHTML = '×';
    closeBtn.addEventListener('click', (e) => { e.stopPropagation(); card.remove(); });
    header.appendChild(closeBtn);

    // Scrollable content area
    const msgDiv = document.createElement('div');
    msgDiv.className = 'cdb-body';
    const loadingSpan = document.createElement('span');
    loadingSpan.className = 'cdb-loading';
    loadingSpan.textContent = 'Generating debrief…';
    msgDiv.appendChild(loadingSpan);

    card.append(header, msgDiv);

    const viewLog = document.getElementById('view-log');
    if (viewLog) {
      viewLog.insertBefore(card, viewLog.firstChild);
    } else {
      document.body.appendChild(card);
    }

    try {
      const resp = await fetch(`${window.FORGE_CONFIG.SUPABASE_URL}/functions/v1/forge-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query,
          coach_mode: true,
          coach_system: 'You are FORGE. Give a 3-line post-workout debrief. Line 1: accomplished. Line 2: overload verdict. Line 3: recovery. Max 120 words. Plain text only, no markdown.',
          max_tokens: 150
        })
      });
      if (!resp.ok) { card.remove(); return; }
      _setCooldown(cdKey);
      localStorage.setItem(lsKey, todayStr);

      // Stream tokens into card (exact pattern from _fireCoachMessage)
      const reader = resp.body?.getReader();
      if (!reader) { card.remove(); return; }
      const decoder = new TextDecoder();
      let text = '';
      let firstToken = true;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        chunk.split('\n').forEach(line => {
          if (line.startsWith('data: ')) {
            const d = line.slice(6).trim();
            if (d && d !== '[DONE]') {
              try { text += JSON.parse(d)?.token || ''; } catch {}
            }
          }
        });
        if (firstToken && text.length > 0) { msgDiv.innerHTML = ''; firstToken = false; }
        msgDiv.textContent = text;
      }
      if (text.trim()) {
        try {
          localStorage.setItem('forge_last_debrief', JSON.stringify({
            text: text.trim(),
            date: new Date().toISOString(),
            muscles: summary?.muscles || []
          }));
        } catch (_) {}
      }
      if (!text.trim()) {
        card.remove();
      } else {
        // Render structured sections
        msgDiv.innerHTML = '';
        const sections = _parseDebriefSections(text);
        sections.forEach((s, i) => {
          const row = document.createElement('div');
          row.className = 'cdb-section';
          const lbl = document.createElement('div');
          lbl.className = 'cdb-section-label';
          lbl.textContent = ['01 · ACCOMPLISHED', '02 · OVERLOAD', '03 · RECOVERY'][i] || ('0' + (i+1));
          const txt = document.createElement('div');
          txt.className = 'cdb-section-text';
          txt.textContent = s;
          row.append(lbl, txt);
          msgDiv.appendChild(row);
        });
        setTimeout(() => card?.remove(), 60000); // auto-dismiss after 60s
      }
    } catch (e) {
      card.remove();
    }
  }

  window.FORGE_COACH.generateSessionDebrief = generateSessionDebrief;

  console.log('[FORGE] Coach triggers loaded');
})();
