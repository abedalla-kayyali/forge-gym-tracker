// FORGE Dashboard FX — sounds + visuals for DNN habits, Readiness, and Overview.
// Hooks into the existing fx-sound / fx-visuals / fx-haptic stack.
// Scoped wrappers avoid touching workout-log FX handled by log-fx.js.
(function () {
  'use strict';

  // ── Safe proxy helpers ───────────────────────────────────────────────────
  function _snd(fn) {
    try { if (typeof fn === 'function' && (typeof soundOn === 'undefined' || soundOn)) fn(); } catch (_e) {}
  }
  function _vib(pat) {
    try {
      var on = (typeof hapticOn !== 'undefined') ? hapticOn : (localStorage.getItem('forge_haptic') !== 'off');
      if (!on || !navigator.vibrate) return;
      navigator.vibrate(pat);
    } catch (_e) {}
  }
  function _ripple(btn, e) {
    try { if (typeof addRipple === 'function') addRipple(btn, e); } catch (_e) {}
  }
  function _burst(x, y, n, colors) {
    try { if (typeof spawnParticles === 'function') spawnParticles(x, y, n, colors); } catch (_e) {}
  }
  function _pop(el, cls, ms) {
    if (!el) return;
    el.classList.remove(cls); void el.offsetWidth;
    el.classList.add(cls);
    setTimeout(function () { el.classList.remove(cls); }, ms || 300);
  }
  function _floatPop(el, text, color) {
    if (!el || typeof scorePop !== 'function') return;
    try { scorePop(el, text, color || 'var(--accent)'); } catch (_e) {}
  }

  // ── DNN habit toggle hook ────────────────────────────────────────────────
  function _hookDNN() {
    var orig = window._dnnToggle;
    if (typeof orig !== 'function') { setTimeout(_hookDNN, 300); return; }
    window._dnnToggle = function (habitId) {
      orig(habitId);
      // Immediate tick + haptic
      _snd(function () { if (typeof sndTap === 'function') sndTap(); });
      _vib(10);
      // Check for perfect day after DOM re-render
      setTimeout(function () {
        try {
          var today = new Date();
          var key = today.getFullYear() + '-' +
            String(today.getMonth() + 1).padStart(2, '0') + '-' +
            String(today.getDate()).padStart(2, '0');
          var data = JSON.parse(localStorage.getItem('forge_dnn') || '{}');
          if (data[key] && data[key].perfectDay === true) {
            if (window._dfxPerfectFired !== key) {
              window._dfxPerfectFired = key;
              // Full celebration
              if (typeof sndSave === 'function') _snd(sndSave);
              _vib([30, 20, 60]);
              var cx = window.innerWidth / 2, cy = window.innerHeight * 0.45;
              _burst(cx, cy, 70, ['#39ff8f', '#ffb800', '#ffffff', '#ff6b6b', '#c084fc']);
              var bar = document.querySelector('.dnn-bar');
              if (bar) _floatPop(bar, '🏆 PERFECT DAY!', '#ffb800');
            }
          }
        } catch (_e) {}
      }, 200);
    };
  }

  // ── Readiness energy tap hook ────────────────────────────────────────────
  function _hookEnergy() {
    var orig = window._setReadinessEnergy;
    if (typeof orig !== 'function') { setTimeout(_hookEnergy, 300); return; }
    window._setReadinessEnergy = function (level) {
      orig(level);
      if (typeof sndTap === 'function') _snd(sndTap);
      _vib(10);
      setTimeout(function () {
        var btn = document.querySelector('.rd-energy-btn.rd-energy-active');
        if (btn) { _ripple(btn, null); _pop(btn, 'dfx-pop', 300); }
      }, 60);
    };
  }

  // ── Readiness panel render hook — ring glow on score change ─────────────
  function _hookReadiness() {
    var orig = window.renderReadinessPanel;
    if (typeof orig !== 'function') { setTimeout(_hookReadiness, 300); return; }
    window.renderReadinessPanel = function () {
      orig();
      setTimeout(function () {
        var scoreEl = document.querySelector('.rd-ring-score');
        var newScore = scoreEl ? parseInt(scoreEl.textContent) : NaN;
        if (!isNaN(newScore) && newScore !== window._dfxLastScore) {
          window._dfxLastScore = newScore;
          if (typeof sndThemeSwitch === 'function') _snd(sndThemeSwitch);
          _vib(12);
          var arc = document.querySelector('.rd-ring-arc');
          if (arc) {
            var stroke = arc.getAttribute('stroke') || '#39ff8f';
            arc.style.transition = 'filter .4s ease';
            arc.style.filter = 'drop-shadow(0 0 10px ' + stroke + ')';
            setTimeout(function () { arc.style.filter = ''; }, 900);
          }
        }
      }, 60);
    };
  }

  // ── Readiness h+min save hook — subtle ring shimmer ─────────────────────
  function _hookRdSaveHM() {
    var orig = window._rdSaveHM;
    if (typeof orig !== 'function') { setTimeout(_hookRdSaveHM, 300); return; }
    window._rdSaveHM = function (field, hVal, mVal) {
      orig(field, hVal, mVal);
      if (typeof sndQtyTick === 'function') _snd(sndQtyTick);
    };
  }

  // ── CSS injection ────────────────────────────────────────────────────────
  function _injectCSS() {
    var s = document.createElement('style');
    s.id = 'dashboard-fx-style';
    s.textContent =
      '@keyframes dfxPop{0%{transform:scale(1)}40%{transform:scale(1.18)}70%{transform:scale(.95)}100%{transform:scale(1)}}' +
      '.dfx-pop{animation:dfxPop .3s cubic-bezier(.36,.07,.19,.97);}' +
      '.dnn-pill{overflow:hidden;position:relative;}' +
      '.rd-energy-btn{overflow:hidden;position:relative;}';
    document.head.appendChild(s);
  }

  // ── Auto-ripple for dashboard non-button interactives ────────────────────
  function _initRipples() {
    var SEL =
      '.dnn-pill,.rd-energy-btn,.ol-plateau-btn,.dnn-challenge-btn,' +
      '.snap-readiness-card,.ctoday-readiness-card,.rd-sleep-row,' +
      '.rd-rec-action';
    var _lastTouch = null;

    document.addEventListener('touchend', function (e) {
      var t = e.changedTouches && e.changedTouches[0];
      if (!t) return;
      var el = document.elementFromPoint(t.clientX, t.clientY);
      var btn = el && typeof el.closest === 'function' ? el.closest(SEL) : null;
      if (!btn) return;
      _lastTouch = btn;
      _ripple(btn, { clientX: t.clientX, clientY: t.clientY });
      if (btn.classList.contains('ol-plateau-btn') || btn.classList.contains('rd-rec-action')) {
        if (typeof sndTap === 'function') _snd(sndTap); _vib(10);
      }
    }, { passive: true });

    document.addEventListener('click', function (e) {
      var btn = e.target && typeof e.target.closest === 'function' ? e.target.closest(SEL) : null;
      if (!btn) return;
      if (btn === _lastTouch) { _lastTouch = null; return; }
      _ripple(btn, e);
      if (btn.classList.contains('ol-plateau-btn') || btn.classList.contains('rd-rec-action')) {
        if (typeof sndTap === 'function') _snd(sndTap); _vib(10);
      }
    });
  }

  // ── Init ─────────────────────────────────────────────────────────────────
  function _init() {
    _injectCSS();
    _hookDNN();
    _hookEnergy();
    _hookReadiness();
    _hookRdSaveHM();
    _initRipples();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    setTimeout(_init, 0);
  }
})();
