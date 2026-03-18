// FORGE Log FX — Premium sound + visual effects for the workout log page
// iOS fix: pre-unlock AudioContext on first touchstart, play on touchend.

(function () {
  'use strict';

  // ── AudioContext pre-unlock (iOS Safari requires this) ─────────────────
  var _lfCtx = null;

  function _ensureCtx() {
    if (_lfCtx && _lfCtx.state !== 'closed') return _lfCtx;
    // Reuse fx-sound.js context if already running
    if (typeof _audioCtx !== 'undefined' && _audioCtx && _audioCtx.state === 'running') {
      _lfCtx = _audioCtx;
      return _lfCtx;
    }
    var A = window.AudioContext || window.webkitAudioContext;
    if (!A) return null;
    _lfCtx = new A();
    return _lfCtx;
  }

  // Called on first touchstart — creates + unlocks context while inside a gesture
  function _unlockCtx() {
    var ctx = _ensureCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(function(){});
    }
    // Play silent 1-sample buffer — iOS requires this to fully unlock
    try {
      var buf = ctx.createBuffer(1, 1, ctx.sampleRate);
      var src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
    } catch(e) {}
  }
  document.addEventListener('touchstart', function _first() {
    _unlockCtx();
    document.removeEventListener('touchstart', _first);
  }, { passive: true });

  // ── Audio note helper ──────────────────────────────────────────────────
  function _n(freq, type, vol, ev, delay, dur) {
    try {
      var on = (typeof soundOn !== 'undefined')
        ? soundOn : (localStorage.getItem('forge_sound') !== 'off');
      if (!on) return;
      var ctx = _ensureCtx();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume().catch(function(){});
      if (ctx.state !== 'running') return;
      var osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(
        Math.max(ev, 0.0001), ctx.currentTime + delay + dur);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + dur + 0.02);
    } catch(e) {}
  }

  function _vib(pat) {
    try {
      var on = (typeof hapticOn !== 'undefined')
        ? hapticOn : (localStorage.getItem('forge_haptic') !== 'off');
      if (!on || !navigator.vibrate) return;
      navigator.vibrate(pat);
    } catch(e) {}
  }

  // ── Sound definitions ──────────────────────────────────────────────────
  function sndTap()         { _n(1200,'sine',0.08,0.0001,0,0.06); }
  function sndSetLog()      { _n(320,'triangle',0.18,0.0001,0,0.08); _n(480,'sine',0.10,0.0001,0.04,0.06); }
  function sndSave()        { [523.25,659.25,783.99,1046.5].forEach(function(f,i){ _n(f,'sine',0.22,0.0001,i*0.09,0.22); }); }
  function sndSwitch()      { _n(550,'sine',0.07,0.0001,0,0.06); _n(850,'sine',0.04,0.0001,0.05,0.07); }
  function sndQtyTick()     { _n(1400,'triangle',0.07,0.0001,0,0.04); }
  function sndCardioLog()   { _n(392,'triangle',0.16,0.0001,0,0.12); _n(523.25,'sine',0.18,0.0001,0.08,0.14); _n(659.25,'sine',0.14,0.0001,0.16,0.18); _n(783.99,'sine',0.10,0.0001,0.24,0.22); }
  function sndSessionStart(){ _n(261.63,'sawtooth',0.18,0.001,0,0.30); _n(329.63,'sawtooth',0.14,0.001,0.15,0.30); _n(523.25,'sine',0.20,0.001,0.30,0.50); _n(659.25,'sine',0.12,0.001,0.45,0.45); _n(783.99,'sine',0.08,0.001,0.60,0.40); }
  function sndSessionEnd()  { [[392,0],[523,0.18],[659,0.36],[784,0.54]].forEach(function(p){ _n(p[0],'sawtooth',0.22,0.001,p[1],0.32); _n(p[0]*2,'sine',0.10,0.001,p[1],0.40); }); [523.25,659.25,783.99,1046.5].forEach(function(f){ _n(f,'sine',0.12,0.001,0.9,0.35); }); }
  // Muscle select: pitch varies by muscle group location
  function sndMuscleSelect(muscle) {
    var m = (muscle || '').toLowerCase();
    var f, f2;
    if (m==='chest'||m==='back'||m==='shoulders'||m==='traps') {
      // Upper body — confident mid thud + shimmer
      f=180; f2=540;
    } else if (m==='biceps'||m==='triceps'||m==='forearms') {
      // Arms — crisp higher pop
      f=260; f2=780;
    } else if (m==='core'||m==='lower back') {
      // Core — grounded mid tone
      f=140; f2=420;
    } else {
      // Legs / Glutes / Calves — deep low thud
      f=100; f2=320;
    }
    _n(f, 'triangle', 0.18, 0.0001, 0,    0.12);
    _n(f2,'sine',     0.10, 0.0001, 0.04, 0.14);
    _n(f2*1.5,'sine', 0.05, 0.0001, 0.08, 0.10);
  }
  function sndEffort(e)     {
    if      (e==='easy')    { _n(880,'sine',0.08,0.0001,0,0.10); _n(1046,'sine',0.05,0.0001,0.05,0.10); }
    else if (e==='medium')  { _n(660,'triangle',0.11,0.0001,0,0.09); _n(880,'sine',0.06,0.0001,0.04,0.10); }
    else if (e==='hard')    { _n(330,'sawtooth',0.13,0.0001,0,0.10); _n(220,'sine',0.09,0.0001,0.05,0.12); _n(440,'sine',0.06,0.0001,0.09,0.08); }
    else if (e==='failure') { _n(220,'sine',0.14,0.0001,0,0.08); _n(165,'sine',0.11,0.0001,0.06,0.10); _n(130,'sine',0.08,0.0001,0.12,0.14); }
  }

  // ── Inject CSS ─────────────────────────────────────────────────────────
  var s = document.createElement('style');
  s.id  = 'log-fx-style';
  s.textContent = '\
.lf-ripple-host{overflow:hidden;position:relative;}\
.lf-ripple{position:absolute;border-radius:50%;pointer-events:none;background:rgba(255,255,255,.18);transform:scale(0);animation:lfRipple .55s linear forwards;}\
@keyframes lfRipple{to{transform:scale(2.8);opacity:0;}}\
.sh-start-btn{transition:background .18s,box-shadow .18s,transform .13s!important;}\
.sh-start-btn.lf-pressed{background:linear-gradient(135deg,rgba(57,255,143,.24),rgba(57,255,143,.44))!important;box-shadow:0 0 0 5px rgba(57,255,143,.22),0 0 48px rgba(57,255,143,.5)!important;transform:scale(.97)!important;}\
.sh-end-btn{transition:background .15s,box-shadow .15s,transform .12s!important;}\
.sh-end-btn.lf-pressed{background:rgba(231,76,60,.3)!important;box-shadow:0 0 28px rgba(231,76,60,.5)!important;transform:scale(.97)!important;}\
.mode-toggle-btn{transition:background .18s,color .18s,transform .12s,box-shadow .18s!important;}\
.mode-toggle-btn:active,.mode-toggle-btn.lf-pressed{transform:scale(.94)!important;}\
.mode-toggle-btn.active{background:rgba(57,255,143,.12)!important;box-shadow:inset 0 0 18px rgba(57,255,143,.08)!important;}\
.btn-add{transition:background .15s,border-color .15s,color .15s,transform .12s!important;}\
.btn-add:active,.btn-add.lf-pressed{background:rgba(57,255,143,.10)!important;border-color:var(--accent)!important;color:var(--accent)!important;transform:scale(.97)!important;}\
.ditto-btn,.bw-ditto-btn{transition:background .14s,transform .12s,box-shadow .14s!important;}\
.ditto-btn.lf-pressed,.bw-ditto-btn.lf-pressed{background:rgba(57,255,143,.22)!important;transform:scale(.87)!important;box-shadow:0 0 14px rgba(57,255,143,.35)!important;}\
.bw-reps-btn{touch-action:manipulation;user-select:none;transition:background .1s,transform .1s!important;}\
.bw-reps-btn:active,.bw-reps-btn.lf-pressed{background:rgba(57,255,143,.2)!important;transform:scale(.86)!important;}\
.bw-filter-chip{transition:background .14s,border-color .14s,transform .12s,color .14s!important;}\
.bw-filter-chip:active{transform:scale(.91)!important;}\
.bw-filter-chip.active{box-shadow:0 0 12px rgba(57,255,143,.22)!important;}\
.effort-btn,.bw-eff-btn{transition:all .18s!important;overflow:hidden;position:relative;}\
.effort-btn:active,.effort-btn.lf-pressed,.bw-eff-btn:active,.bw-eff-btn.lf-pressed{transform:scale(.93)!important;}\
.effort-btn.active[data-effort="easy"]{box-shadow:0 0 14px rgba(58,158,106,.4)!important;}\
.effort-btn.active[data-effort="medium"]{box-shadow:0 0 14px rgba(243,156,18,.4)!important;}\
.effort-btn.active[data-effort="hard"]{box-shadow:0 0 16px rgba(230,126,34,.45)!important;}\
.effort-btn.active[data-effort="failure"]{box-shadow:0 0 16px rgba(231,76,60,.45)!important;}\
.bw-eff-btn.active.bw-eff-easy{box-shadow:0 0 12px rgba(58,158,106,.35)!important;}\
.bw-eff-btn.active.bw-eff-med{box-shadow:0 0 12px rgba(243,156,18,.35)!important;}\
.bw-eff-btn.active.bw-eff-hard{box-shadow:0 0 14px rgba(230,126,34,.4)!important;}\
.bw-eff-btn.active.bw-eff-fail{box-shadow:0 0 14px rgba(231,76,60,.4)!important;}\
.bw-log-btn{transition:background .18s,transform .15s,box-shadow .18s!important;}\
.bw-log-btn:active,.bw-log-btn.lf-pressed{transform:scale(.97)!important;box-shadow:0 0 0 4px rgba(57,255,143,.28),0 0 44px rgba(57,255,143,.55)!important;}\
@keyframes lfLogSetGlow{0%{box-shadow:0 0 0 0 rgba(57,255,143,.6);}60%{box-shadow:0 0 0 20px rgba(57,255,143,0);}100%{box-shadow:0 0 0 0 rgba(57,255,143,0);}}\
.bw-log-btn.lf-set-pop{animation:lfLogSetGlow .52s ease-out;}\
.btn.btn-primary,.bw-log-workout-btn{transition:background .18s,transform .15s,box-shadow .18s!important;}\
@keyframes lfSaveBurst{0%{box-shadow:0 0 0 0 rgba(57,255,143,.75),0 0 20px var(--green-glow);}45%{box-shadow:0 0 0 24px rgba(57,255,143,0),0 0 48px rgba(57,255,143,.55);}100%{box-shadow:0 0 0 0 rgba(57,255,143,0),0 0 20px var(--green-glow);}}\
.btn.btn-primary.lf-save-pop,.bw-log-workout-btn.lf-save-pop{animation:lfSaveBurst .65s ease-out;}\
.cardio-act-btn{transition:background .14s,border-color .14s,transform .12s,color .14s!important;}\
.cardio-act-btn:active{transform:scale(.93)!important;}\
.cardio-act-btn.active{box-shadow:0 0 12px rgba(57,255,143,.22)!important;}\
.cardio-hz-btn{transition:all .14s!important;}\
.cardio-hz-btn:active,.cardio-hz-btn.lf-pressed{transform:scale(.88)!important;}\
.cardio-log-btn{transition:background .18s,transform .15s,opacity .14s!important;}\
.cardio-log-btn:active{transform:scale(.97)!important;opacity:.86!important;}\
.timer-preset-btn{transition:background .14s,border-color .14s,transform .11s!important;}\
.timer-preset-btn:active{transform:scale(.89)!important;}\
.plate-open-btn{transition:background .14s,border-color .14s,transform .11s!important;}\
.plate-open-btn:active{transform:scale(.92)!important;}\
@keyframes lfSetIn{from{opacity:0;transform:translateY(-10px) scale(.98);}to{opacity:1;transform:translateY(0) scale(1);}}\
.set-row.lf-new{animation:lfSetIn .3s cubic-bezier(.22,1,.36,1) both;}\
.bw-set-dot.lf-new{animation:lfSetIn .28s cubic-bezier(.22,1,.36,1) both;}\
@keyframes lfScorePop{0%{opacity:1;transform:translateY(0) scale(1);}65%{opacity:.9;transform:translateY(-30px) scale(1.08);}100%{opacity:0;transform:translateY(-50px) scale(.9);}}\
.lf-score-pop{position:fixed;pointer-events:none;z-index:9999;font-family:\'Bebas Neue\',sans-serif;font-size:21px;letter-spacing:1.5px;text-shadow:0 0 14px rgba(57,255,143,.55);animation:lfScorePop .75s cubic-bezier(.22,1,.36,1) forwards;}\
\
.muscle-chip{transition:background .15s,border-color .15s,color .15s,transform .12s,box-shadow .15s!important;}\
.muscle-chip:active,.muscle-chip.lf-pressed{transform:scale(.88)!important;}\
.muscle-chip.active{box-shadow:0 0 16px rgba(57,255,143,.35)!important;}\
@keyframes lfMuscleFlash{0%{opacity:1;filter:brightness(1);}40%{opacity:.85;filter:brightness(1.8);}100%{opacity:1;filter:brightness(1);}}\
.body-zone{transition:opacity .15s,filter .15s;cursor:pointer;}\
.body-zone:active,.body-zone.lf-zone-flash{animation:lfMuscleFlash .35s ease-out;}\
@keyframes lfBodyZonePop{0%{filter:brightness(1) drop-shadow(0 0 0px rgba(57,255,143,0));}50%{filter:brightness(1.6) drop-shadow(0 0 8px rgba(57,255,143,.7));}100%{filter:brightness(1) drop-shadow(0 0 0px rgba(57,255,143,0));}}\
.body-zone.lf-zone-pop{animation:lfBodyZonePop .4s ease-out;}\
@media(prefers-reduced-motion:reduce){.lf-ripple,.lf-score-pop,.bw-log-btn.lf-set-pop,.btn.btn-primary.lf-save-pop,.bw-log-workout-btn.lf-save-pop,.set-row.lf-new,.bw-set-dot.lf-new{animation:none!important;}}\
#wgt-muscle-history-grid .bw-ex-btn.ep-pressed{transform:scale(.93)!important;border-color:var(--accent)!important;}';
  document.head.appendChild(s);

  // ── Visual helpers ──────────────────────────────────────────────────────
  function ripple(btn, x, y) {
    if (!btn) return;
    btn.classList.add('lf-ripple-host');
    var r    = btn.getBoundingClientRect();
    var size = Math.max(r.width, r.height) * 1.9;
    var el   = document.createElement('span');
    el.className = 'lf-ripple';
    el.style.cssText = 'width:'+size+'px;height:'+size+'px;left:'+(x-r.left-size/2)+'px;top:'+(y-r.top-size/2)+'px;';
    btn.appendChild(el);
    el.addEventListener('animationend', function(){ el.remove(); });
  }

  function scorePop(btn, text, color) {
    if (!btn) return;
    var r  = btn.getBoundingClientRect();
    var el = document.createElement('div');
    el.className   = 'lf-score-pop';
    el.style.color = color || 'var(--accent)';
    el.textContent = text;
    el.style.left  = Math.max(0, r.left + r.width/2 - 40) + 'px';
    el.style.top   = Math.max(0, r.top  - 4) + 'px';
    document.body.appendChild(el);
    el.addEventListener('animationend', function(){ el.remove(); });
  }

  function popClass(el, cls, ms) {
    if (!el) return;
    el.classList.remove(cls); void el.offsetWidth;
    el.classList.add(cls);
    setTimeout(function(){ el.classList.remove(cls); }, ms || 700);
  }

  // ── Button dispatch ─────────────────────────────────────────────────────
  var SEL =
    '.sh-start-btn,.sh-end-btn,.sh-quick-start,' +
    '.mode-toggle-btn,' +
    '.btn-add,.ditto-btn,.plate-open-btn,' +
    '.bw-reps-btn,.bw-filter-chip,.bw-eff-btn,.bw-log-btn,.bw-log-workout-btn,.bw-ditto-btn,' +
    '.effort-btn,' +
    '.cardio-act-btn,.cardio-hz-btn,.cardio-log-btn,' +
    '.timer-preset-btn,.btn-ghost,' +
    '#save-btn,.btn.btn-primary,' +
    '.muscle-chip,.body-zone,' +
    '#wgt-muscle-history-grid .bw-ex-btn,' +
    '.btn-ex-browse,.btn-ex-form,.btn-ex-swap,' +
    '.wp-key,.wp-preset-btn,.wp-btn-done,.wp-btn-cancel,' +
    '.bw-reps-btn,.bw-add-custom-btn,' +
    '.ex-add-btn,' +
    '.step-quick-btn,.steps-log-btn,.sp-log-btn,.sp-custom-btn';

  function dispatch(btn, cx, cy) {
    if (!btn || btn.disabled) return;
    ripple(btn, cx, cy);
    var c = (btn.getAttribute('class') || '');
    var id = btn.id || '';
    var has = function(x){ return c.indexOf(x) !== -1; };

    if      (has('sh-start-btn'))                              { sndSessionStart(); _vib([30,20,60]); popClass(btn,'lf-pressed',300); scorePop(btn,'SESSION ON!','#39ff8f'); }
    else if (has('sh-end-btn'))                                { sndSessionEnd();   _vib([30,20,60]); popClass(btn,'lf-pressed',300); }
    else if (has('sh-quick-start'))                            { sndTap();          _vib(10); }
    else if (has('mode-toggle-btn'))                           { sndSwitch();       _vib(10); popClass(btn,'lf-pressed',200); }
    else if (has('btn-add'))                                   { sndSetLog();       _vib([15,10,30]); popClass(btn,'lf-pressed',200); scorePop(btn,'+1 SET','#39ff8f');
      // v237: flash the last logged set row
      (function() {
        var _rows = document.querySelectorAll('#sets-container .set-row');
        var _lastRow = _rows.length ? _rows[_rows.length - 1] : null;
        if (_lastRow) { _lastRow.classList.remove('set-flash'); void _lastRow.offsetWidth; _lastRow.classList.add('set-flash'); }
      })();
    }
    else if (has('ditto-btn') || has('bw-ditto-btn'))          { sndTap();          _vib(10); popClass(btn,'lf-pressed',180); scorePop(btn,'DITTO','#c084fc'); }
    else if (has('plate-open-btn'))                            { sndTap();          _vib(10); }
    else if (has('bw-reps-btn'))                               { sndQtyTick();      _vib(10); popClass(btn,'lf-pressed',120); }
    else if (has('bw-filter-chip'))                            { sndTap();          _vib(10); }
    else if (has('bw-eff-btn'))                                { sndEffort(btn.dataset.effort||'medium'); _vib(10); }
    else if (has('effort-btn'))                                { sndEffort(btn.dataset.effort||'medium'); _vib(10); }
    else if (has('bw-log-btn') && !has('bw-log-workout-btn')) { sndSetLog();       _vib([15,10,30]); popClass(btn,'lf-set-pop',600); scorePop(btn,'SET LOGGED!','#39ff8f'); }
    else if (has('bw-log-workout-btn') || id==='save-btn' || (has('btn') && has('btn-primary'))) { sndSave(); _vib([30,20,60]); popClass(btn,'lf-save-pop',700); scorePop(btn,'WORKOUT SAVED!','#39ff8f'); }
    else if (has('cardio-act-btn'))                            { sndTap();          _vib(10); }
    else if (has('cardio-hz-btn'))                             { sndTap();          _vib(10); popClass(btn,'lf-pressed',160); }
    else if (has('cardio-log-btn'))                            { sndCardioLog();    _vib([30,20,60]); scorePop(btn,'LOGGED!','#39ff8f'); }
    else if (has('timer-preset-btn') || has('btn-ghost'))      { sndTap();          _vib(10); }
    else if (has('muscle-chip')) {
      var muscle = btn.getAttribute('data-muscle') || '';
      sndMuscleSelect(muscle); _vib(10);
      popClass(btn, 'lf-pressed', 200);
    }
    else if (has('body-zone')) {
      var muscle = btn.getAttribute('data-muscle') || '';
      sndMuscleSelect(muscle); _vib(10);
      popClass(btn, 'lf-zone-pop', 450);
    }
    else if (has('bw-ex-btn')) {
      // Exercise history card tap — crisp selection chime
      _n(880, 'sine', 0.07, 0.0001, 0,    0.07);
      _n(1320,'sine', 0.04, 0.0001, 0.05, 0.09);
      _vib(10);
      popClass(btn, 'ep-pressed', 200);
      scorePop(btn, 'SELECT', 'var(--accent)');
    }
    else if (has('btn-ex-browse') || has('btn-ex-form') || has('btn-ex-swap')) {
      // Form / Browse / Swap buttons
      _n(1050,'sine', 0.06, 0.0001, 0,    0.06);
      _n(1400,'sine', 0.03, 0.0001, 0.04, 0.07);
      _vib(10);
    }
    else if (has('wp-key')) {
      // Numpad keys — crisp click, delete is lower
      var key = btn.getAttribute('data-key') || '';
      if (key === 'del') {
        _n(220,'sine',0.08,0.0001,0,0.06); _vib(8);
      } else if (key === '.') {
        _n(1000,'triangle',0.05,0.0001,0,0.05); _vib(6);
      } else {
        _n(1200,'triangle',0.07,0.0001,0,0.04); _vib(6);
      }
    }
    else if (has('wp-preset-btn')) {
      _n(880,'sine',0.07,0.0001,0,0.07); _n(1320,'sine',0.04,0.0001,0.04,0.08);
      _vib(10);
    }
    else if (has('wp-btn-done')) {
      _n(523,'sine',0.12,0.0001,0,0.12); _n(659,'sine',0.08,0.0001,0.07,0.12); _n(784,'sine',0.06,0.0001,0.14,0.14);
      _vib([10,5,20]);
    }
    else if (has('wp-btn-cancel')) {
      _n(330,'sine',0.06,0.0001,0,0.08); _vib(8);
    }
    else if (has('bw-add-custom-btn')) {
      sndTap(); _vib(10);
    }
    else if (has('step-quick-btn') || has('steps-log-btn') || has('sp-log-btn')) {
      var amt = parseInt(btn.getAttribute('data-amt') || '0');
      // Low thud + bright tick footstep sound
      _n(160, 'triangle', 0.14, 0.001, 0,    0.07);
      _n(900, 'sine',     0.05, 0.0001, 0.04, 0.06);
      if (amt >= 5000) {
        _n(523, 'sine', 0.06, 0.0001, 0.09, 0.10);
      }
      if (amt >= 10000) {
        _n(659, 'sine', 0.05, 0.0001, 0.16, 0.12);
        _n(784, 'sine', 0.04, 0.0001, 0.23, 0.14);
      }
      var vibPat = amt >= 5000 ? [20, 8, 30] : 12;
      _vib(vibPat);
      popClass(btn, 'lf-pressed', 200);
      var label = amt >= 1000 ? '+' + (amt / 1000).toFixed(0) + 'K STEPS' : '+' + amt + ' STEPS';
      if (amt > 0) scorePop(btn, label, '#39ff8f');
    }
    else if (has('sp-custom-btn')) {
      sndTap(); _vib(10);
    }
    else if (has('ex-add-btn')) {
      // Exercise saved — ascending success chime
      _n(523,'sine',0.10,0.0001,0,    0.10);
      _n(659,'sine',0.08,0.0001,0.07, 0.12);
      _n(784,'sine',0.07,0.0001,0.14, 0.14);
      _n(1047,'sine',0.05,0.0001,0.22,0.18);
      _vib([20,10,40]);
      popClass(btn,'lf-save-pop',700);
      scorePop(btn,'SAVED!','#39ff8f');
    }
  }

  // ── Event listeners ─────────────────────────────────────────────────────
  var logView = document.getElementById('view-log');
  if (!logView) return;

  // touchend fires INSIDE the user gesture on iOS — sounds work here reliably
  var _lastTouchBtn = null;
  logView.addEventListener('touchend', function(e) {
    var t   = e.changedTouches && e.changedTouches[0];
    if (!t) return;
    var btn = document.elementFromPoint(t.clientX, t.clientY);
    btn = btn && typeof btn.closest === 'function' ? btn.closest(SEL) : null;
    if (!btn || btn.disabled) return;
    _lastTouchBtn = btn;
    dispatch(btn, t.clientX, t.clientY);
  }, { passive: true });

  // click handles desktop (and any touch not caught above)
  logView.addEventListener('click', function(e) {
    var btn = e.target && typeof e.target.closest === 'function'
      ? e.target.closest(SEL) : null;
    if (!btn || btn.disabled) return;
    if (btn === _lastTouchBtn) { _lastTouchBtn = null; return; } // already handled
    dispatch(btn, e.clientX, e.clientY);
  });

  // ── Numpad overlay (outside #view-log) — add separate listeners ────────
  var numpadSheet = document.getElementById('wheel-picker-sheet');
  if (numpadSheet) {
    var _numLastTouchBtn = null;
    numpadSheet.addEventListener('touchend', function(e) {
      var t = e.changedTouches && e.changedTouches[0]; if (!t) return;
      var btn = document.elementFromPoint(t.clientX, t.clientY);
      btn = btn && typeof btn.closest === 'function' ? btn.closest(SEL) : null;
      if (!btn || btn.disabled) return;
      _numLastTouchBtn = btn;
      dispatch(btn, t.clientX, t.clientY);
    }, { passive: true });
    numpadSheet.addEventListener('click', function(e) {
      var btn = e.target && typeof e.target.closest === 'function' ? e.target.closest(SEL) : null;
      if (!btn || btn.disabled) return;
      if (btn === _numLastTouchBtn) { _numLastTouchBtn = null; return; }
      dispatch(btn, e.clientX, e.clientY);
    });
  }

  // ── Global step FX — called directly from logSteps() onclick chain ──────
  // This runs inside the user gesture so iOS AudioContext unlock is guaranteed.
  window._lfStepFX = function(amount, btnEl) {
    try {
      var amt = parseInt(amount) || 0;
      // Footstep: low thud + bright tick
      _n(160, 'triangle', 0.14, 0.001, 0,    0.07);
      _n(900, 'sine',     0.05, 0.0001, 0.04, 0.06);
      if (amt >= 5000)  { _n(523, 'sine', 0.06, 0.0001, 0.09, 0.10); }
      if (amt >= 10000) { _n(659, 'sine', 0.05, 0.0001, 0.16, 0.12); _n(784, 'sine', 0.04, 0.0001, 0.23, 0.14); }
      _vib(amt >= 5000 ? [20, 8, 30] : 12);
      if (btnEl) {
        popClass(btnEl, 'lf-pressed', 200);
        var label = amt >= 1000 ? '+' + (amt / 1000).toFixed(0) + 'K' : '+' + amt;
        scorePop(btnEl, label + ' STEPS', '#39ff8f');
      }
    } catch(e) {}
  };

  // ── Animate new set rows ───────────────────────────────────────────────
  var obs = new MutationObserver(function(muts) {
    muts.forEach(function(m) {
      m.addedNodes.forEach(function(node) {
        if (node.nodeType !== 1) return;
        if (node.classList.contains('set-row') || node.classList.contains('bw-set-dot')) {
          node.classList.add('lf-new');
          node.addEventListener('animationend', function(){ node.classList.remove('lf-new'); }, { once: true });
        }
      });
    });
  });
  var sc = document.getElementById('sets-container');
  var bw = document.getElementById('bw-sets-container');
  if (sc) obs.observe(sc, { childList: true });
  if (bw) obs.observe(bw, { childList: true });

  // ── Set count badge: glow when > 0 ─────────────────────────────
  var badge = document.getElementById('set-count-badge');
  if (badge) {
    var _updateBadge = function() {
      var n = parseInt(badge.textContent);
      if (n > 0) { badge.classList.add('ep-active'); }
      else        { badge.classList.remove('ep-active'); }
    };
    new MutationObserver(_updateBadge).observe(badge, {
      childList: true, characterData: true, subtree: true
    });
    _updateBadge();
  }

})();
