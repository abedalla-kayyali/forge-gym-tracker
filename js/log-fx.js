// FORGE Log FX — Premium sound + visual effects for the workout log page
// Requires: fx-sound.js + fx-haptic.js (loaded before this file)
// Injects CSS and delegates events to #view-log using event delegation.

(function () {
  'use strict';

  // ── Inject CSS ─────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.id = 'log-fx-style';
  style.textContent = `
    /* ── Touch ripple ── */
    .lf-ripple-host { overflow: hidden; position: relative; }
    .lf-ripple {
      position: absolute; border-radius: 50%; pointer-events: none;
      background: rgba(255,255,255,.18); transform: scale(0);
      animation: lfRipple .55s linear forwards;
    }
    @keyframes lfRipple { to { transform: scale(2.8); opacity: 0; } }

    /* ── START SESSION: electric glow ── */
    .sh-start-btn { transition: background .18s, box-shadow .18s, transform .13s !important; }
    .sh-start-btn.lf-pressed {
      background: linear-gradient(135deg,rgba(57,255,143,.24) 0%,rgba(57,255,143,.44) 100%) !important;
      box-shadow: 0 0 0 5px rgba(57,255,143,.22), 0 0 48px rgba(57,255,143,.5) !important;
      transform: scale(.97) !important;
    }

    /* ── END SESSION: red flash ── */
    .sh-end-btn { transition: background .15s, box-shadow .15s, transform .12s !important; }
    .sh-end-btn.lf-pressed {
      background: rgba(231,76,60,.3) !important;
      box-shadow: 0 0 28px rgba(231,76,60,.5) !important;
      transform: scale(.97) !important;
    }

    /* ── Mode toggle: active glow ── */
    .mode-toggle-btn {
      transition: background .18s, color .18s, transform .12s, box-shadow .18s !important;
    }
    .mode-toggle-btn:active, .mode-toggle-btn.lf-pressed { transform: scale(.94) !important; }
    .mode-toggle-btn.active {
      background: rgba(57,255,143,.12) !important;
      box-shadow: inset 0 0 18px rgba(57,255,143,.08) !important;
    }

    /* ── Add Set ── */
    .btn-add {
      transition: background .15s, border-color .15s, color .15s, transform .12s !important;
    }
    .btn-add:active, .btn-add.lf-pressed {
      background: rgba(57,255,143,.1) !important;
      border-color: var(--accent) !important;
      color: var(--accent) !important;
      transform: scale(.97) !important;
    }

    /* ── Ditto ── */
    .ditto-btn, .bw-ditto-btn {
      transition: background .14s, transform .12s, box-shadow .14s !important;
    }
    .ditto-btn.lf-pressed, .bw-ditto-btn.lf-pressed {
      background: rgba(57,255,143,.22) !important;
      transform: scale(.87) !important;
      box-shadow: 0 0 14px rgba(57,255,143,.35) !important;
    }

    /* ── BW Reps stepper: bounce ── */
    .bw-reps-btn {
      touch-action: manipulation; user-select: none;
      transition: background .1s, transform .1s !important;
    }
    .bw-reps-btn:active, .bw-reps-btn.lf-pressed {
      background: rgba(57,255,143,.2) !important;
      transform: scale(.86) !important;
    }

    /* ── BW filter chips ── */
    .bw-filter-chip {
      transition: background .14s, border-color .14s, transform .12s, color .14s !important;
    }
    .bw-filter-chip:active { transform: scale(.91) !important; }
    .bw-filter-chip.active { box-shadow: 0 0 12px rgba(57,255,143,.22) !important; }

    /* ── Effort buttons: glow rings on active ── */
    .effort-btn   { transition: all .18s !important; overflow: hidden; position: relative; }
    .bw-eff-btn   { transition: all .18s !important; overflow: hidden; position: relative; }
    .effort-btn:active,   .effort-btn.lf-pressed   { transform: scale(.94) !important; }
    .bw-eff-btn:active,   .bw-eff-btn.lf-pressed   { transform: scale(.93) !important; }

    .effort-btn.active[data-effort="easy"]    { box-shadow: 0 0 14px rgba(58,158,106,.4) !important; }
    .effort-btn.active[data-effort="medium"]  { box-shadow: 0 0 14px rgba(243,156,18,.4) !important; }
    .effort-btn.active[data-effort="hard"]    { box-shadow: 0 0 16px rgba(230,126,34,.45) !important; }
    .effort-btn.active[data-effort="failure"] { box-shadow: 0 0 16px rgba(231,76,60,.45) !important; }

    .bw-eff-btn.active.bw-eff-easy  { box-shadow: 0 0 12px rgba(58,158,106,.35) !important; }
    .bw-eff-btn.active.bw-eff-med   { box-shadow: 0 0 12px rgba(243,156,18,.35) !important; }
    .bw-eff-btn.active.bw-eff-hard  { box-shadow: 0 0 14px rgba(230,126,34,.4) !important; }
    .bw-eff-btn.active.bw-eff-fail  { box-shadow: 0 0 14px rgba(231,76,60,.4) !important; }

    /* ── LOG SET: radial glow burst ── */
    .bw-log-btn { transition: background .18s, transform .15s, box-shadow .18s !important; }
    .bw-log-btn:active, .bw-log-btn.lf-pressed {
      transform: scale(.97) !important;
      box-shadow: 0 0 0 4px rgba(57,255,143,.28), 0 0 44px rgba(57,255,143,.55) !important;
    }
    @keyframes lfLogSetGlow {
      0%   { box-shadow: 0 0 0 0 rgba(57,255,143,.6); }
      60%  { box-shadow: 0 0 0 20px rgba(57,255,143,0); }
      100% { box-shadow: 0 0 0 0 rgba(57,255,143,0); }
    }
    .bw-log-btn.lf-set-pop { animation: lfLogSetGlow .52s ease-out; }

    /* ── LOG WORKOUT / Save: lightning burst ── */
    .btn.btn-primary, .bw-log-workout-btn {
      transition: background .18s, transform .15s, box-shadow .18s !important;
    }
    @keyframes lfSaveBurst {
      0%   { box-shadow: 0 0 0 0 rgba(57,255,143,.75), 0 0 20px var(--green-glow); }
      45%  { box-shadow: 0 0 0 24px rgba(57,255,143,0), 0 0 48px rgba(57,255,143,.55); }
      100% { box-shadow: 0 0 0 0 rgba(57,255,143,0), 0 0 20px var(--green-glow); }
    }
    .btn.btn-primary.lf-save-pop,
    .bw-log-workout-btn.lf-save-pop { animation: lfSaveBurst .65s ease-out; }

    /* ── Cardio ── */
    .cardio-act-btn {
      transition: background .14s, border-color .14s, transform .12s, color .14s !important;
    }
    .cardio-act-btn:active { transform: scale(.93) !important; }
    .cardio-act-btn.active { box-shadow: 0 0 12px rgba(57,255,143,.22) !important; }

    .cardio-hz-btn  { transition: all .14s !important; }
    .cardio-hz-btn:active, .cardio-hz-btn.lf-pressed { transform: scale(.88) !important; }

    .cardio-log-btn { transition: background .18s, transform .15s, opacity .14s !important; }
    .cardio-log-btn:active { transform: scale(.97) !important; opacity: .86 !important; }

    /* ── Timer preset ── */
    .timer-preset-btn { transition: background .14s, border-color .14s, transform .11s !important; }
    .timer-preset-btn:active { transform: scale(.89) !important; }

    /* ── Plate calc ── */
    .plate-open-btn { transition: background .14s, border-color .14s, transform .11s !important; }
    .plate-open-btn:active { transform: scale(.92) !important; }

    /* ── Set row slide-in ── */
    @keyframes lfSetIn {
      from { opacity: 0; transform: translateY(-10px) scale(.98); }
      to   { opacity: 1; transform: translateY(0)     scale(1); }
    }
    .set-row.lf-new    { animation: lfSetIn .3s cubic-bezier(.22,1,.36,1) both; }
    .bw-set-dot.lf-new { animation: lfSetIn .28s cubic-bezier(.22,1,.36,1) both; }

    /* ── Floating score pop ── */
    @keyframes lfScorePop {
      0%   { opacity: 1; transform: translateY(0) scale(1); }
      65%  { opacity: .9; transform: translateY(-30px) scale(1.08); }
      100% { opacity: 0; transform: translateY(-50px) scale(.9); }
    }
    .lf-score-pop {
      position: fixed; pointer-events: none; z-index: 9999;
      font-family: 'Bebas Neue', sans-serif; font-size: 21px; letter-spacing: 1.5px;
      text-shadow: 0 0 14px rgba(57,255,143,.55);
      animation: lfScorePop .75s cubic-bezier(.22,1,.36,1) forwards;
    }

    /* ── Reduced motion ── */
    @media (prefers-reduced-motion: reduce) {
      .lf-ripple, .lf-score-pop,
      .bw-log-btn.lf-set-pop,
      .btn.btn-primary.lf-save-pop,
      .bw-log-workout-btn.lf-save-pop,
      .set-row.lf-new, .bw-set-dot.lf-new { animation: none !important; }
    }
  `;
  document.head.appendChild(style);

  // ── Helpers ────────────────────────────────────────────────────────────
  function _snd(fn) { try { if (typeof fn === 'function') fn(); } catch(e) {} }
  function _hap(fn) { try { if (typeof fn === 'function') fn(); } catch(e) {} }

  function _ripple(btn, e) {
    if (!btn) return;
    btn.classList.add('lf-ripple-host');
    const r = btn.getBoundingClientRect();
    const cx = (e.changedTouches ? e.changedTouches[0].clientX : e.clientX) - r.left;
    const cy = (e.changedTouches ? e.changedTouches[0].clientY : e.clientY) - r.top;
    const size = Math.max(r.width, r.height) * 1.9;
    const rip = document.createElement('span');
    rip.className = 'lf-ripple';
    rip.style.cssText = `width:${size}px;height:${size}px;left:${cx-size/2}px;top:${cy-size/2}px;`;
    btn.appendChild(rip);
    rip.addEventListener('animationend', () => rip.remove());
  }

  function _scorePop(btn, text, color) {
    if (!btn || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = btn.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'lf-score-pop';
    el.style.color = color || 'var(--accent)';
    el.textContent = text;
    el.style.left = (r.left + r.width / 2 - 40) + 'px';
    el.style.top  = (r.top - 4) + 'px';
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }

  function _popClass(el, cls, ms) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), ms || 700);
  }

  // ── Effort-specific tones (inline, safe to call before fx-sound loads) ──
  function _sndEffort(effort) {
    try {
      const on = typeof soundOn !== 'undefined' ? soundOn
        : localStorage.getItem('forge_sound') !== 'off';
      if (!on) return;
      const ctx = (typeof _audioCtx !== 'undefined' && _audioCtx)
        ? _audioCtx
        : new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      const n = (f, t, v, ev, d, dur) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = t; o.frequency.setValueAtTime(f, ctx.currentTime + d);
        g.gain.setValueAtTime(v, ctx.currentTime + d);
        g.gain.exponentialRampToValueAtTime(Math.max(ev, 0.0001), ctx.currentTime + d + dur);
        o.start(ctx.currentTime + d); o.stop(ctx.currentTime + d + dur + 0.02);
      };
      if      (effort === 'easy')    { n(880,'sine',0.08,0.0001,0,0.10); n(1046,'sine',0.05,0.0001,0.05,0.10); }
      else if (effort === 'medium')  { n(660,'triangle',0.11,0.0001,0,0.09); n(880,'sine',0.06,0.0001,0.04,0.10); }
      else if (effort === 'hard')    { n(330,'sawtooth',0.13,0.0001,0,0.10); n(220,'sine',0.09,0.0001,0.05,0.12); n(440,'sine',0.06,0.0001,0.09,0.08); }
      else if (effort === 'failure') { n(220,'sine',0.14,0.0001,0,0.08); n(165,'sine',0.11,0.0001,0.06,0.10); n(130,'sine',0.08,0.0001,0.12,0.14); }
    } catch(e) {}
  }

  // ── Event delegation on #view-log ──────────────────────────────────────
  const logView = document.getElementById('view-log');
  if (!logView) return;

  const SELECTOR =
    '.sh-start-btn,.sh-end-btn,.sh-quick-start,' +
    '.mode-toggle-btn,' +
    '.btn-add,.ditto-btn,.plate-open-btn,' +
    '.bw-reps-btn,.bw-filter-chip,.bw-eff-btn,.bw-log-btn,.bw-log-workout-btn,.bw-ditto-btn,' +
    '.effort-btn,' +
    '.cardio-act-btn,.cardio-hz-btn,.cardio-log-btn,' +
    '.timer-preset-btn,.btn-ghost,' +
    '#save-btn,.btn.btn-primary';

  logView.addEventListener('click', function(e) {
    const btn = e.target && typeof e.target.closest === 'function'
      ? e.target.closest(SELECTOR) : null;
    if (!btn || btn.disabled) return;

    _ripple(btn, e);

    if (btn.classList.contains('sh-start-btn')) {
      _snd(sndSessionStart); _hap(hapSave);
      _popClass(btn, 'lf-pressed', 300);
      _scorePop(btn, 'SESSION ON!', '#39ff8f');
    }
    else if (btn.classList.contains('sh-end-btn')) {
      _snd(sndSessionEnd); _hap(hapSave);
      _popClass(btn, 'lf-pressed', 300);
    }
    else if (btn.classList.contains('sh-quick-start')) {
      _snd(sndTap); _hap(hapTap);
    }
    else if (btn.classList.contains('mode-toggle-btn')) {
      _snd(sndThemeSwitch); _hap(hapTap);
      _popClass(btn, 'lf-pressed', 200);
    }
    else if (btn.classList.contains('btn-add')) {
      _snd(sndSetLog); _hap(hapSetLog);
      _popClass(btn, 'lf-pressed', 200);
      _scorePop(btn, '+1 SET', '#39ff8f');
    }
    else if (btn.classList.contains('ditto-btn') || btn.classList.contains('bw-ditto-btn')) {
      _snd(sndTap); _hap(hapTap);
      _popClass(btn, 'lf-pressed', 180);
      _scorePop(btn, 'DITTO', '#c084fc');
    }
    else if (btn.classList.contains('plate-open-btn')) {
      _snd(sndTap); _hap(hapTap);
    }
    else if (btn.classList.contains('bw-reps-btn')) {
      _snd(sndQtyTick); _hap(hapTap);
      _popClass(btn, 'lf-pressed', 120);
    }
    else if (btn.classList.contains('bw-filter-chip')) {
      _snd(sndTap); _hap(hapTap);
    }
    else if (btn.classList.contains('bw-eff-btn')) {
      _sndEffort(btn.dataset.effort || 'medium'); _hap(hapTap);
    }
    else if (btn.classList.contains('effort-btn')) {
      _sndEffort(btn.dataset.effort || 'medium'); _hap(hapTap);
    }
    else if (btn.classList.contains('bw-log-btn')) {
      _snd(sndSetLog); _hap(hapSetLog);
      _popClass(btn, 'lf-set-pop', 600);
      _scorePop(btn, 'SET LOGGED!', '#39ff8f');
    }
    else if (
      btn.classList.contains('bw-log-workout-btn') ||
      btn.id === 'save-btn' ||
      (btn.classList.contains('btn') && btn.classList.contains('btn-primary'))
    ) {
      _snd(sndSave); _hap(hapSave);
      _popClass(btn, 'lf-save-pop', 700);
      _scorePop(btn, 'WORKOUT SAVED!', '#39ff8f');
    }
    else if (btn.classList.contains('cardio-act-btn')) {
      _snd(sndTap); _hap(hapTap);
    }
    else if (btn.classList.contains('cardio-hz-btn')) {
      _snd(sndTap); _hap(hapTap);
      _popClass(btn, 'lf-pressed', 160);
    }
    else if (btn.classList.contains('cardio-log-btn')) {
      _snd(sndMealLogged); _hap(hapSave);
      _scorePop(btn, 'LOGGED!', '#39ff8f');
    }
    else if (btn.classList.contains('timer-preset-btn') || btn.classList.contains('btn-ghost')) {
      _snd(sndTap); _hap(hapTap);
    }
  }, { passive: true });

  // ── Animate new set rows + BW dots as they're added ────────────────────
  const _obs = new MutationObserver(mutations => {
    mutations.forEach(m => m.addedNodes.forEach(node => {
      if (node.nodeType !== 1) return;
      if (node.classList.contains('set-row') || node.classList.contains('bw-set-dot')) {
        node.classList.add('lf-new');
        node.addEventListener('animationend', () => node.classList.remove('lf-new'), { once: true });
      }
    }));
  });
  const setsCont   = document.getElementById('sets-container');
  const bwSetsCont = document.getElementById('bw-sets-container');
  if (setsCont)   _obs.observe(setsCont,   { childList: true });
  if (bwSetsCont) _obs.observe(bwSetsCont, { childList: true });

})();
