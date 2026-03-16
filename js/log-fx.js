// FORGE Log FX — Premium sound + visual effects for the workout log page
// Self-contained audio (no dependency on fx-sound.js globals at call time).
// Loads after fx-sound.js so it can reuse _audioCtx if available.

(function () {
  'use strict';

  // ── Self-contained audio note helper ───────────────────────────────────
  // Mirrors auth-ui.js _authNote pattern — works standalone on mobile Safari.
  function _lfNote(freq, type, vol, endVol, delay, dur) {
    try {
      // Honour the global soundOn pref if available, else check localStorage
      var on = (typeof soundOn !== 'undefined') ? soundOn
        : (localStorage.getItem('forge_sound') !== 'off');
      if (!on) return;
      var AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return;
      // Reuse existing AudioContext from fx-sound.js if alive, else create one
      var ctx = (typeof _audioCtx !== 'undefined' && _audioCtx && _audioCtx.state !== 'closed')
        ? _audioCtx
        : new AudioCtor();
      if (ctx.state === 'suspended') ctx.resume();
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(
        Math.max(endVol, 0.0001),
        ctx.currentTime + delay + dur
      );
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + dur + 0.02);
    } catch (e) {}
  }

  // ── Haptic helper ───────────────────────────────────────────────────────
  function _vib(pat) {
    try {
      var on = (typeof hapticOn !== 'undefined') ? hapticOn
        : (localStorage.getItem('forge_haptic') !== 'off');
      if (!on || !('vibrate' in navigator)) return;
      navigator.vibrate(pat);
    } catch (e) {}
  }

  // ── Sound definitions (all inline) ─────────────────────────────────────
  function _sndTap()     { _lfNote(1200,'sine',0.08,0.0001,0,0.06); }
  function _sndSetLog()  {
    _lfNote(320,'triangle',0.18,0.0001,0,0.08);
    _lfNote(480,'sine',0.10,0.0001,0.04,0.06);
  }
  function _sndSave()    {
    [523.25,659.25,783.99,1046.5].forEach(function(f,i){
      _lfNote(f,'sine',0.22,0.0001,i*0.09,0.22);
    });
  }
  function _sndSessionStart() {
    _lfNote(261.63,'sawtooth',0.18,0.001,0,   0.30);
    _lfNote(329.63,'sawtooth',0.14,0.001,0.15,0.30);
    _lfNote(523.25,'sine',    0.20,0.001,0.30,0.50);
    _lfNote(659.25,'sine',    0.12,0.001,0.45,0.45);
    _lfNote(783.99,'sine',    0.08,0.001,0.60,0.40);
  }
  function _sndSessionEnd() {
    [[392,0],[523,0.18],[659,0.36],[784,0.54]].forEach(function(p){
      _lfNote(p[0],'sawtooth',0.22,0.001,p[1],0.32);
      _lfNote(p[0]*2,'sine',  0.10,0.001,p[1],0.40);
    });
    [523.25,659.25,783.99,1046.5].forEach(function(f){
      _lfNote(f,'sine',0.12,0.001,0.9,0.35);
    });
  }
  function _sndSwitch()  {
    _lfNote(550,'sine',0.07,0.0001,0,   0.06);
    _lfNote(850,'sine',0.04,0.0001,0.05,0.07);
  }
  function _sndQtyTick() { _lfNote(1400,'triangle',0.07,0.0001,0,0.04); }
  function _sndCardioLog() {
    _lfNote(392,   'triangle',0.16,0.0001,0,   0.12);
    _lfNote(523.25,'sine',    0.18,0.0001,0.08,0.14);
    _lfNote(659.25,'sine',    0.14,0.0001,0.16,0.18);
    _lfNote(783.99,'sine',    0.10,0.0001,0.24,0.22);
  }
  function _sndEffort(effort) {
    if      (effort === 'easy')
      { _lfNote(880,'sine',0.08,0.0001,0,0.10); _lfNote(1046,'sine',0.05,0.0001,0.05,0.10); }
    else if (effort === 'medium')
      { _lfNote(660,'triangle',0.11,0.0001,0,0.09); _lfNote(880,'sine',0.06,0.0001,0.04,0.10); }
    else if (effort === 'hard')
      { _lfNote(330,'sawtooth',0.13,0.0001,0,0.10); _lfNote(220,'sine',0.09,0.0001,0.05,0.12); _lfNote(440,'sine',0.06,0.0001,0.09,0.08); }
    else if (effort === 'failure')
      { _lfNote(220,'sine',0.14,0.0001,0,0.08); _lfNote(165,'sine',0.11,0.0001,0.06,0.10); _lfNote(130,'sine',0.08,0.0001,0.12,0.14); }
  }

  // ── Inject CSS ─────────────────────────────────────────────────────────
  var style = document.createElement('style');
  style.id = 'log-fx-style';
  style.textContent = [
    /* Touch ripple */
    '.lf-ripple-host{overflow:hidden;position:relative;}',
    '.lf-ripple{position:absolute;border-radius:50%;pointer-events:none;',
    'background:rgba(255,255,255,.18);transform:scale(0);',
    'animation:lfRipple .55s linear forwards;}',
    '@keyframes lfRipple{to{transform:scale(2.8);opacity:0;}}',

    /* START SESSION */
    '.sh-start-btn{transition:background .18s,box-shadow .18s,transform .13s!important;}',
    '.sh-start-btn.lf-pressed{background:linear-gradient(135deg,rgba(57,255,143,.24),rgba(57,255,143,.44))!important;',
    'box-shadow:0 0 0 5px rgba(57,255,143,.22),0 0 48px rgba(57,255,143,.5)!important;transform:scale(.97)!important;}',

    /* END SESSION */
    '.sh-end-btn{transition:background .15s,box-shadow .15s,transform .12s!important;}',
    '.sh-end-btn.lf-pressed{background:rgba(231,76,60,.3)!important;',
    'box-shadow:0 0 28px rgba(231,76,60,.5)!important;transform:scale(.97)!important;}',

    /* Mode toggle */
    '.mode-toggle-btn{transition:background .18s,color .18s,transform .12s,box-shadow .18s!important;}',
    '.mode-toggle-btn:active,.mode-toggle-btn.lf-pressed{transform:scale(.94)!important;}',
    '.mode-toggle-btn.active{background:rgba(57,255,143,.12)!important;',
    'box-shadow:inset 0 0 18px rgba(57,255,143,.08)!important;}',

    /* Add Set */
    '.btn-add{transition:background .15s,border-color .15s,color .15s,transform .12s!important;}',
    '.btn-add:active,.btn-add.lf-pressed{background:rgba(57,255,143,.10)!important;',
    'border-color:var(--accent)!important;color:var(--accent)!important;transform:scale(.97)!important;}',

    /* Ditto */
    '.ditto-btn,.bw-ditto-btn{transition:background .14s,transform .12s,box-shadow .14s!important;}',
    '.ditto-btn.lf-pressed,.bw-ditto-btn.lf-pressed{background:rgba(57,255,143,.22)!important;',
    'transform:scale(.87)!important;box-shadow:0 0 14px rgba(57,255,143,.35)!important;}',

    /* Reps stepper */
    '.bw-reps-btn{touch-action:manipulation;user-select:none;',
    'transition:background .1s,transform .1s!important;}',
    '.bw-reps-btn:active,.bw-reps-btn.lf-pressed{background:rgba(57,255,143,.2)!important;transform:scale(.86)!important;}',

    /* BW filter chips */
    '.bw-filter-chip{transition:background .14s,border-color .14s,transform .12s,color .14s!important;}',
    '.bw-filter-chip:active{transform:scale(.91)!important;}',
    '.bw-filter-chip.active{box-shadow:0 0 12px rgba(57,255,143,.22)!important;}',

    /* Effort buttons */
    '.effort-btn,.bw-eff-btn{transition:all .18s!important;overflow:hidden;position:relative;}',
    '.effort-btn:active,.effort-btn.lf-pressed,.bw-eff-btn:active,.bw-eff-btn.lf-pressed{transform:scale(.93)!important;}',
    '.effort-btn.active[data-effort="easy"]   {box-shadow:0 0 14px rgba(58,158,106,.4)!important;}',
    '.effort-btn.active[data-effort="medium"] {box-shadow:0 0 14px rgba(243,156,18,.4)!important;}',
    '.effort-btn.active[data-effort="hard"]   {box-shadow:0 0 16px rgba(230,126,34,.45)!important;}',
    '.effort-btn.active[data-effort="failure"]{box-shadow:0 0 16px rgba(231,76,60,.45)!important;}',
    '.bw-eff-btn.active.bw-eff-easy {box-shadow:0 0 12px rgba(58,158,106,.35)!important;}',
    '.bw-eff-btn.active.bw-eff-med  {box-shadow:0 0 12px rgba(243,156,18,.35)!important;}',
    '.bw-eff-btn.active.bw-eff-hard {box-shadow:0 0 14px rgba(230,126,34,.4)!important;}',
    '.bw-eff-btn.active.bw-eff-fail {box-shadow:0 0 14px rgba(231,76,60,.4)!important;}',

    /* LOG SET glow burst */
    '.bw-log-btn{transition:background .18s,transform .15s,box-shadow .18s!important;}',
    '.bw-log-btn:active,.bw-log-btn.lf-pressed{transform:scale(.97)!important;',
    'box-shadow:0 0 0 4px rgba(57,255,143,.28),0 0 44px rgba(57,255,143,.55)!important;}',
    '@keyframes lfLogSetGlow{0%{box-shadow:0 0 0 0 rgba(57,255,143,.6);}',
    '60%{box-shadow:0 0 0 20px rgba(57,255,143,0);}100%{box-shadow:0 0 0 0 rgba(57,255,143,0);}}',
    '.bw-log-btn.lf-set-pop{animation:lfLogSetGlow .52s ease-out;}',

    /* Save / LOG WORKOUT burst */
    '.btn.btn-primary,.bw-log-workout-btn{transition:background .18s,transform .15s,box-shadow .18s!important;}',
    '@keyframes lfSaveBurst{',
    '0%{box-shadow:0 0 0 0 rgba(57,255,143,.75),0 0 20px var(--green-glow);}',
    '45%{box-shadow:0 0 0 24px rgba(57,255,143,0),0 0 48px rgba(57,255,143,.55);}',
    '100%{box-shadow:0 0 0 0 rgba(57,255,143,0),0 0 20px var(--green-glow);}}',
    '.btn.btn-primary.lf-save-pop,.bw-log-workout-btn.lf-save-pop{animation:lfSaveBurst .65s ease-out;}',

    /* Cardio */
    '.cardio-act-btn{transition:background .14s,border-color .14s,transform .12s,color .14s!important;}',
    '.cardio-act-btn:active{transform:scale(.93)!important;}',
    '.cardio-act-btn.active{box-shadow:0 0 12px rgba(57,255,143,.22)!important;}',
    '.cardio-hz-btn{transition:all .14s!important;}',
    '.cardio-hz-btn:active,.cardio-hz-btn.lf-pressed{transform:scale(.88)!important;}',
    '.cardio-log-btn{transition:background .18s,transform .15s,opacity .14s!important;}',
    '.cardio-log-btn:active{transform:scale(.97)!important;opacity:.86!important;}',

    /* Timer preset */
    '.timer-preset-btn{transition:background .14s,border-color .14s,transform .11s!important;}',
    '.timer-preset-btn:active{transform:scale(.89)!important;}',
    '.plate-open-btn{transition:background .14s,border-color .14s,transform .11s!important;}',
    '.plate-open-btn:active{transform:scale(.92)!important;}',

    /* Set row slide-in */
    '@keyframes lfSetIn{from{opacity:0;transform:translateY(-10px) scale(.98);}',
    'to{opacity:1;transform:translateY(0) scale(1);}}',
    '.set-row.lf-new{animation:lfSetIn .3s cubic-bezier(.22,1,.36,1) both;}',
    '.bw-set-dot.lf-new{animation:lfSetIn .28s cubic-bezier(.22,1,.36,1) both;}',

    /* Floating score pop */
    '@keyframes lfScorePop{',
    '0%{opacity:1;transform:translateY(0) scale(1);}',
    '65%{opacity:.9;transform:translateY(-30px) scale(1.08);}',
    '100%{opacity:0;transform:translateY(-50px) scale(.9);}}',
    '.lf-score-pop{position:fixed;pointer-events:none;z-index:9999;',
    'font-family:\'Bebas Neue\',sans-serif;font-size:21px;letter-spacing:1.5px;',
    'text-shadow:0 0 14px rgba(57,255,143,.55);',
    'animation:lfScorePop .75s cubic-bezier(.22,1,.36,1) forwards;}',

    /* Reduced motion */
    '@media(prefers-reduced-motion:reduce){',
    '.lf-ripple,.lf-score-pop,.bw-log-btn.lf-set-pop,',
    '.btn.btn-primary.lf-save-pop,.bw-log-workout-btn.lf-save-pop,',
    '.set-row.lf-new,.bw-set-dot.lf-new{animation:none!important;}}'
  ].join('');
  document.head.appendChild(style);

  // ── Visual helpers ──────────────────────────────────────────────────────
  function _ripple(btn, e) {
    if (!btn) return;
    btn.classList.add('lf-ripple-host');
    var r    = btn.getBoundingClientRect();
    var src  = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0] : e;
    var cx   = src.clientX - r.left;
    var cy   = src.clientY - r.top;
    var size = Math.max(r.width, r.height) * 1.9;
    var rip  = document.createElement('span');
    rip.className  = 'lf-ripple';
    rip.style.cssText = 'width:'+size+'px;height:'+size+'px;left:'+(cx-size/2)+'px;top:'+(cy-size/2)+'px;';
    btn.appendChild(rip);
    rip.addEventListener('animationend', function(){ rip.remove(); });
  }

  function _scorePop(btn, text, color) {
    if (!btn) return;
    var r  = btn.getBoundingClientRect();
    var el = document.createElement('div');
    el.className   = 'lf-score-pop';
    el.style.color = color || 'var(--accent)';
    el.textContent = text;
    el.style.left  = (r.left + r.width / 2 - 40) + 'px';
    el.style.top   = (r.top - 4) + 'px';
    document.body.appendChild(el);
    el.addEventListener('animationend', function(){ el.remove(); });
  }

  function _popClass(el, cls, ms) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    setTimeout(function(){ el.classList.remove(cls); }, ms || 700);
  }

  // ── Event delegation on #view-log ──────────────────────────────────────
  var logView = document.getElementById('view-log');
  if (!logView) return;

  var SELECTOR =
    '.sh-start-btn,.sh-end-btn,.sh-quick-start,' +
    '.mode-toggle-btn,' +
    '.btn-add,.ditto-btn,.plate-open-btn,' +
    '.bw-reps-btn,.bw-filter-chip,.bw-eff-btn,.bw-log-btn,.bw-log-workout-btn,.bw-ditto-btn,' +
    '.effort-btn,' +
    '.cardio-act-btn,.cardio-hz-btn,.cardio-log-btn,' +
    '.timer-preset-btn,.btn-ghost,' +
    '#save-btn,.btn.btn-primary';

  logView.addEventListener('click', function(e) {
    var btn = (e.target && typeof e.target.closest === 'function')
      ? e.target.closest(SELECTOR) : null;
    if (!btn || btn.disabled) return;

    _ripple(btn, e);

    var cls = btn.className || '';
    var id  = btn.id || '';

    if (cls.indexOf('sh-start-btn') !== -1) {
      _sndSessionStart(); _vib([30,20,60]);
      _popClass(btn, 'lf-pressed', 300);
      _scorePop(btn, 'SESSION ON!', '#39ff8f');
    }
    else if (cls.indexOf('sh-end-btn') !== -1) {
      _sndSessionEnd(); _vib([30,20,60]);
      _popClass(btn, 'lf-pressed', 300);
    }
    else if (cls.indexOf('sh-quick-start') !== -1) {
      _sndTap(); _vib(10);
    }
    else if (cls.indexOf('mode-toggle-btn') !== -1) {
      _sndSwitch(); _vib(10);
      _popClass(btn, 'lf-pressed', 200);
    }
    else if (cls.indexOf('btn-add') !== -1) {
      _sndSetLog(); _vib([15,10,30]);
      _popClass(btn, 'lf-pressed', 200);
      _scorePop(btn, '+1 SET', '#39ff8f');
    }
    else if (cls.indexOf('ditto-btn') !== -1 || cls.indexOf('bw-ditto-btn') !== -1) {
      _sndTap(); _vib(10);
      _popClass(btn, 'lf-pressed', 180);
      _scorePop(btn, 'DITTO', '#c084fc');
    }
    else if (cls.indexOf('plate-open-btn') !== -1) {
      _sndTap(); _vib(10);
    }
    else if (cls.indexOf('bw-reps-btn') !== -1) {
      _sndQtyTick(); _vib(10);
      _popClass(btn, 'lf-pressed', 120);
    }
    else if (cls.indexOf('bw-filter-chip') !== -1) {
      _sndTap(); _vib(10);
    }
    else if (cls.indexOf('bw-eff-btn') !== -1) {
      _sndEffort(btn.dataset.effort || 'medium'); _vib(10);
    }
    else if (cls.indexOf('effort-btn') !== -1) {
      _sndEffort(btn.dataset.effort || 'medium'); _vib(10);
    }
    else if (cls.indexOf('bw-log-btn') !== -1 && cls.indexOf('bw-log-workout-btn') === -1) {
      _sndSetLog(); _vib([15,10,30]);
      _popClass(btn, 'lf-set-pop', 600);
      _scorePop(btn, 'SET LOGGED!', '#39ff8f');
    }
    else if (
      cls.indexOf('bw-log-workout-btn') !== -1 ||
      id === 'save-btn' ||
      (cls.indexOf('btn-primary') !== -1)
    ) {
      _sndSave(); _vib([30,20,60]);
      _popClass(btn, 'lf-save-pop', 700);
      _scorePop(btn, 'WORKOUT SAVED!', '#39ff8f');
    }
    else if (cls.indexOf('cardio-act-btn') !== -1) {
      _sndTap(); _vib(10);
    }
    else if (cls.indexOf('cardio-hz-btn') !== -1) {
      _sndTap(); _vib(10);
      _popClass(btn, 'lf-pressed', 160);
    }
    else if (cls.indexOf('cardio-log-btn') !== -1) {
      _sndCardioLog(); _vib([30,20,60]);
      _scorePop(btn, 'LOGGED!', '#39ff8f');
    }
    else if (cls.indexOf('timer-preset-btn') !== -1 || cls.indexOf('btn-ghost') !== -1) {
      _sndTap(); _vib(10);
    }
  });

  // ── Animate new set rows + BW dots as they're added ────────────────────
  var _obs = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
      m.addedNodes.forEach(function(node) {
        if (node.nodeType !== 1) return;
        if (node.classList.contains('set-row') || node.classList.contains('bw-set-dot')) {
          node.classList.add('lf-new');
          node.addEventListener('animationend', function(){
            node.classList.remove('lf-new');
          }, { once: true });
        }
      });
    });
  });
  var setsCont   = document.getElementById('sets-container');
  var bwSetsCont = document.getElementById('bw-sets-container');
  if (setsCont)   _obs.observe(setsCont,   { childList: true });
  if (bwSetsCont) _obs.observe(bwSetsCont, { childList: true });

})();
