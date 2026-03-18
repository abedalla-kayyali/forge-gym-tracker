'use strict';
// FORGE Smart Deload Detection Engine
// Multi-signal fatigue index (0–100). Threshold 75 → suggest deload.
// Hooks into postSaveHooks via window.FORGE_DELOAD.check().

(function () {

  const SEARCH_FN = window.FORGE_CONFIG?.SUPABASE_URL + '/functions/v1/forge-search';
  const THRESHOLD = 75;
  const CACHE_KEY = 'forge_deload_shown';

  function _lsGet(k, fb) {
    try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : fb; } catch { return fb; }
  }
  function _isoToday() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  // ── Fatigue index computation ─────────────────────────────────────────────
  function _computeFatigueIndex() {
    let score = 0;

    // 1. Volume spike: this week vs last week (25 pts)
    const workouts = _lsGet('forge_workouts', []);
    const now = Date.now();
    const ONE_DAY = 86400000;
    const thisWeekVol = workouts
      .filter(w => now - new Date(w.date).getTime() < 7 * ONE_DAY)
      .reduce((a, w) => a + (w.totalVolume || 0), 0);
    const lastWeekVol = workouts
      .filter(w => {
        const age = now - new Date(w.date).getTime();
        return age >= 7 * ONE_DAY && age < 14 * ONE_DAY;
      })
      .reduce((a, w) => a + (w.totalVolume || 0), 0);
    if (lastWeekVol > 0 && thisWeekVol > lastWeekVol * 1.3) score += 25;

    // 2. Sleep deficit: avg < 6h past 3 days (20 pts)
    const dnn = _lsGet('forge_readiness', null);
    if (dnn) {
      const totalSleep = parseFloat(dnn.totalSleep) || 0;
      if (totalSleep > 0 && totalSleep < 6) score += 20;
    }

    // 3. Energy/mood downtrend: avg < 5/10 past 3 sessions (20 pts)
    const recentRpe = workouts
      .slice(-3)
      .map(w => {
        const sets = w.sets || [];
        const rpeVals = sets.map(s => parseFloat(s.rpe)).filter(Boolean);
        return rpeVals.length ? rpeVals.reduce((a, b) => a + b, 0) / rpeVals.length : null;
      })
      .filter(r => r !== null);
    if (recentRpe.length >= 2) {
      const avgRpe = recentRpe.reduce((a, b) => a + b, 0) / recentRpe.length;
      if (avgRpe >= 8.5) score += 15; // high RPE trend → fatigue
    }

    // 4. Readiness score low (20 pts)
    if (dnn) {
      const readiness = parseFloat(dnn.readinessScore || dnn.score) || 0;
      if (readiness > 0 && readiness < 40) score += 20;
    }

    // 5. High session count this week — 5+ sessions (20 pts)
    const sessionsThisWeek = workouts.filter(w => now - new Date(w.date).getTime() < 7 * ONE_DAY).length;
    if (sessionsThisWeek >= 5) score += 20;

    return Math.min(100, score);
  }

  // ── Show deload intercept card ────────────────────────────────────────────
  async function _showDeloadCard(score) {
    // Mark shown for today so it doesn't spam
    try { sessionStorage.setItem(CACHE_KEY, _isoToday()); } catch {}

    const overlay = document.getElementById('deload-overlay');
    if (!overlay) return;

    const scoreLabel = overlay.querySelector('#deload-score-label');
    if (scoreLabel) scoreLabel.textContent = 'Fatigue index: ' + score + '/100';

    const msgEl = overlay.querySelector('#deload-msg');
    if (msgEl) msgEl.textContent = 'Analyzing your fatigue signals…';

    overlay.style.display = 'flex';

    // LLM suggestion
    try {
      const session = await window._sb?.auth?.getSession?.();
      const token = session?.data?.session?.access_token;
      if (token && SEARCH_FN && !SEARCH_FN.startsWith('undefined')) {
        const prompt = `Fatigue index: ${score}/100. Suggest a 3-bullet deload week plan. Focus on volume cuts, intensity adjustments, and recovery. Be concise.`;
        const resp = await fetch(SEARCH_FN, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ query: prompt, coach_mode: true, max_tokens: 200 })
        });
        if (resp.ok) {
          const reader = resp.body?.getReader();
          if (reader) {
            let text = '', buf = '';
            const decoder = new TextDecoder();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buf += decoder.decode(value, { stream: true });
              const lines = buf.split('\n'); buf = lines.pop();
              for (const ln of lines) {
                if (!ln.startsWith('data: ')) continue;
                try { text += JSON.parse(ln.slice(6).trim())?.token || ''; } catch {}
              }
              if (msgEl) {
                const safe = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\n/g, '<br>');
                msgEl.innerHTML = safe;
              }
            }
          }
        }
      }
    } catch (e) {
      if (msgEl) msgEl.textContent = 'Consider reducing volume by 40–50% this week, keeping intensity moderate, and prioritising sleep and mobility.';
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────
  function check() {
    // Only fire once per day
    try {
      if (sessionStorage.getItem(CACHE_KEY) === _isoToday()) return;
    } catch {}

    const score = _computeFatigueIndex();
    if (score >= THRESHOLD) _showDeloadCard(score);
  }

  window.FORGE_DELOAD = { check };

  console.log('[FORGE] Deload engine loaded');
})();
