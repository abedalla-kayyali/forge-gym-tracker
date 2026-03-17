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
      <div class="cic-icon">🤖</div>
      <div class="cic-message"></div>
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
      'You are FORGE Coach. Reply in 1 sentence, max 15 words. Be direct, not preachy.',
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
      'You are FORGE Coach. Reply in 1 sentence, max 20 words. Be actionable.',
      `User has a ${plateau}-session plateau on ${exerciseName}. Give one concrete tip.`,
      (msg) => {
        if (typeof showToast === 'function') showToast(`🧠 ${msg}`, 'info', 5000);
      }
    );
  };

  console.log('[FORGE] Coach triggers loaded');
})();
