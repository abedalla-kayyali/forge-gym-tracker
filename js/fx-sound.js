// FORGE FX - sound engine helpers (Web Audio API)
// Extracted from index.html as part of modularization.

let _audioCtx = null;
let soundOn = (localStorage.getItem('forge_sound') !== 'off');

function _ctx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}

/* Master volume envelope helper */
function _note(freq, type, startVol, endVol, startT, duration) {
  const ctx = _ctx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + startT);
  gain.gain.setValueAtTime(startVol, ctx.currentTime + startT);
  gain.gain.exponentialRampToValueAtTime(Math.max(endVol, 0.0001), ctx.currentTime + startT + duration);
  osc.start(ctx.currentTime + startT);
  osc.stop(ctx.currentTime + startT + duration + 0.02);
}

/* 1. Tap click - soft tick */
function sndTap() {
  if (!soundOn) return;
  _note(1200, 'sine', 0.08, 0.0001, 0, 0.06);
}

/* 2. Set logged - punchy click */
function sndSetLog() {
  if (!soundOn) return;
  _note(320, 'triangle', 0.18, 0.0001, 0, 0.08);
  _note(480, 'sine', 0.10, 0.0001, 0.04, 0.06);
}

/* 3. Workout saved - rising chime */
function sndSave() {
  if (!soundOn) return;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => _note(f, 'sine', 0.22, 0.0001, i * 0.09, 0.22));
}

/* 4. PR fanfare - triumphant burst */
function sndPR() {
  if (!soundOn) return;
  [[392, 0], [523, 0.05], [659, 0.1], [784, 0.15], [1047, 0.22]].forEach(([f, t]) => {
    _note(f, 'sawtooth', 0.25, 0.01, t, 0.18);
    _note(f, 'sine', 0.12, 0.01, t, 0.25);
  });
  [1318, 1568, 2093].forEach((f, i) => _note(f, 'sine', 0.07, 0.0001, 0.3 + i * 0.07, 0.3));
}

/* 5. Level-up - epic ascending */
function sndLevelUp() {
  if (!soundOn) return;
  const melody = [261.63, 329.63, 392, 523.25, 659.25, 783.99, 1046.5, 1318.51];
  melody.forEach((f, i) => {
    _note(f, 'sine', 0.25, 0.0001, i * 0.07, 0.25);
    _note(f * 2, 'sine', 0.08, 0.0001, i * 0.07, 0.20);
  });
  [523.25, 659.25, 783.99].forEach(f => _note(f, 'sine', 0.15, 0.0001, 0.6, 0.6));
}

/* 6. Theme switch - swoosh */
function sndThemeSwitch() {
  if (!soundOn) return;
  const ctx = _ctx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.3);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.32);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.35);
}

/* 7. Timer done - alert triple beep */
function sndTimerDone() {
  if (!soundOn) return;
  [0, 0.18, 0.36].forEach(t => {
    _note(880, 'sine', 0.3, 0.0001, t, 0.12);
    _note(1100, 'sine', 0.2, 0.0001, t + 0.06, 0.08);
  });
}

/* 9. Clock tick - mechanical metronome click */
function sndTick(urgent) {
  if (!soundOn) return;
  const ctx = _ctx();
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (urgent ? 80 : 150));
  }
  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = urgent ? 2800 : 1800;
  filter.Q.value = 1.5;
  src.buffer = buf;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.value = urgent ? 0.45 : 0.25;
  src.start(ctx.currentTime);
  _note(urgent ? 1400 : 900, 'sine', urgent ? 0.08 : 0.04, 0.0001, 0.003, 0.04);
}

/* 10. Water drop - liquid plop */
function sndWaterDrop() {
  if (!soundOn) return;
  const ctx = _ctx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1200;
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(900, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(260, ctx.currentTime + 0.18);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.32, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.25);
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(1800, ctx.currentTime + 0.02);
  osc2.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.14);
  gain2.gain.setValueAtTime(0.10, ctx.currentTime + 0.02);
  gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
  osc2.start(ctx.currentTime + 0.02);
  osc2.stop(ctx.currentTime + 0.22);
}

/* 8. Step logged - bouncy pop */
function sndStep() {
  if (!soundOn) return;
  const ctx = _ctx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(300, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.08);
  osc.frequency.exponentialRampToValueAtTime(480, ctx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.18, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.25);
  _note(960, 'sine', 0.06, 0.0001, 0.05, 0.14);
}

/* 9. Step goal reached - airy celebration */
function sndStepGoal() {
  if (!soundOn) return;
  const sparkle = [523.25, 659.25, 783.99, 1046.5, 1318.51];
  sparkle.forEach((f, i) => {
    _note(f, 'sine', 0.15, 0.0001, i * 0.06, 0.18);
    _note(f * 1.5, 'sine', 0.04, 0.0001, i * 0.06 + 0.03, 0.12);
  });
  [523.25, 659.25, 783.99].forEach(f => _note(f, 'sine', 0.08, 0.0001, 0.38, 0.5));
}

/* 10. Session milestone - ambient pulse */
function sndMilestone() {
  if (!soundOn) return;
  _note(220, 'sine', 0.20, 0.0001, 0, 0.9);
  _note(330, 'sine', 0.12, 0.0001, 0, 0.7);
  _note(440, 'sine', 0.08, 0.0001, 0, 0.5);
  _note(880, 'sine', 0.06, 0.0001, 0.1, 0.4);
  _note(1100, 'sine', 0.04, 0.0001, 0.15, 0.3);
  _note(220, 'sine', 0.10, 0.0001, 0.5, 0.5);
  _note(440, 'sine', 0.05, 0.0001, 0.55, 0.4);
}

function sndAvatarOpen() {
  if (!soundOn) return;
  _note(392, 'sine', 0.14, 0.0001, 0, 0.12);
  _note(587.33, 'triangle', 0.12, 0.0001, 0.06, 0.16);
  _note(783.99, 'sine', 0.08, 0.0001, 0.12, 0.18);
}

function sndAvatarSlot() {
  if (!soundOn) return;
  _note(660, 'sine', 0.10, 0.0001, 0, 0.08);
  _note(990, 'triangle', 0.06, 0.0001, 0.03, 0.08);
}

function sndAvatarUnlock() {
  if (!soundOn) return;
  sndMilestone();
  _note(1046.5, 'sine', 0.10, 0.0001, 0.12, 0.24);
  _note(1318.51, 'sine', 0.08, 0.0001, 0.2, 0.28);
}

function sndPrimaryAction() {
  if (!soundOn) return;
  _note(420, 'triangle', 0.12, 0.0001, 0, 0.08);
  _note(620, 'sine', 0.08, 0.0001, 0.04, 0.1);
  _note(880, 'sine', 0.04, 0.0001, 0.08, 0.08);
}

window.playPrimaryActionFx = function playPrimaryActionFx() {
  sndPrimaryAction();
  if (typeof hapTap === 'function') hapTap();
};

document.addEventListener('click', function (event) {
  const target = event.target && typeof event.target.closest === 'function'
    ? event.target.closest('.auth-submit, .auth-update-btn, .onb-btn-primary, .sh-start-btn, .btn.btn-primary, .bw-log-workout-btn, .bio-modal-save, .share-btn, .nutri-save-btn, .ctoday-bw-btn, .btn-wend-share, .mdc-share-btn, .mdc-download-fab')
    : null;
  if (!target || target.disabled) return;
  if (target.classList.contains('auth-back') || target.classList.contains('auth-forgot')) return;
  window.playPrimaryActionFx();
});

/* Sync header button icon to current soundOn state */
function _updateSoundBtn() {
  const iconOn  = document.getElementById('sound-icon-on');
  const iconOff = document.getElementById('sound-icon-off');
  const btn     = document.getElementById('sound-toggle');
  const chk     = document.getElementById('sound-setting');
  if (iconOn)  iconOn.style.display  = soundOn ? '' : 'none';
  if (iconOff) iconOff.style.display = soundOn ? 'none' : '';
  if (btn)     btn.classList.toggle('muted', !soundOn);
  if (chk)     chk.checked = soundOn;
}

/* Header button toggle */
function toggleSound() {
  soundOn = !soundOn;
  localStorage.setItem('forge_sound', soundOn ? 'on' : 'off');
  _updateSoundBtn();
  if (soundOn) sndTap();
}

/* Settings checkbox — called from sound-setting onchange */
function _syncSoundSetting(on) {
  soundOn = on;
  localStorage.setItem('forge_sound', on ? 'on' : 'off');
  _updateSoundBtn();
  if (on) sndTap();
}

/* Init sound button state */
(function initSoundBtn() {
  _updateSoundBtn();
})();

/* ── Arcade Gym Sound Extensions ── */

/* sndSessionStart — rising power-up chord */
function sndSessionStart() {
  if (!soundOn) return;
  _note(261.63, 'sawtooth', 0.18, 0.001, 0,    0.3);
  _note(329.63, 'sawtooth', 0.14, 0.001, 0.15, 0.3);
  _note(523.25, 'sine',     0.20, 0.001, 0.3,  0.5);
  _note(659.25, 'sine',     0.12, 0.001, 0.45, 0.45);
  _note(783.99, 'sine',     0.08, 0.001, 0.6,  0.4);
}

/* sndSessionEnd — epic victory fanfare */
function sndSessionEnd() {
  if (!soundOn) return;
  const prog = [[392,0],[523,0.18],[659,0.36],[784,0.54]];
  prog.forEach(([f,t]) => {
    _note(f,   'sawtooth', 0.22, 0.001, t, 0.32);
    _note(f*2, 'sine',     0.10, 0.001, t, 0.40);
  });
  [523.25,659.25,783.99,1046.5].forEach(f => _note(f,'sine',0.12,0.001,0.9,0.35));
}

/* sndCombo — escalating combo sound, level 1/2/3 */
function sndCombo(level) {
  if (!soundOn) return;
  if (level === 1) {
    _note(880, 'sine', 0.18, 0.001, 0, 0.14);
  } else if (level === 2) {
    _note(880, 'sine',  0.18, 0.001, 0,    0.12);
    _note(990, 'sine',  0.16, 0.001, 0.12, 0.12);
    _note(220, 'sine',  0.20, 0.001, 0,    0.25);
  } else {
    [880,1108,1320,1568,2093].forEach((f,i) => _note(f,'sine',0.16,0.001,i*0.07,0.20));
  }
}

/* sndComboBreak — deflating break */
function sndComboBreak() {
  if (!soundOn) return;
  const ctx = _ctx();
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.3);
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.32);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.35);
}

/* sndBossMode — tension build for PR attempt */
function sndBossMode() {
  if (!soundOn) return;
  _note(80,  'sawtooth', 0.22, 0.001, 0,    0.6);
  _note(160, 'sawtooth', 0.10, 0.001, 0.1,  0.5);
  [0, 0.2, 0.4].forEach(t => _note(440, 'sine', 0.12, 0.001, t, 0.12));
}

/* sndStars — n chimes (1/2/3) */
function sndStars(n) {
  if (!soundOn) return;
  const chimes = [783.99, 1046.5, 1318.51];
  for (let i = 0; i < n; i++) {
    _note(chimes[i], 'sine', 0.22, 0.001, i * 0.22, 0.28);
    if (i === 2) {
      _note(1568, 'sine', 0.14, 0.001, i * 0.22 + 0.1, 0.4);
      _note(2093, 'sine', 0.08, 0.001, i * 0.22 + 0.18, 0.4);
    }
  }
}

function sndSocialInvite() {
  if (!soundOn) return;
  _note(740, 'triangle', 0.12, 0.0001, 0, 0.12);
  _note(988, 'sine', 0.08, 0.0001, 0.05, 0.14);
}

function sndSocialAccept() {
  if (!soundOn) return;
  _note(523.25, 'sine', 0.10, 0.0001, 0, 0.10);
  _note(659.25, 'triangle', 0.10, 0.0001, 0.05, 0.12);
  _note(783.99, 'sine', 0.08, 0.0001, 0.11, 0.16);
}

function sndSocialLead() {
  if (!soundOn) return;
  _note(330, 'sawtooth', 0.08, 0.0001, 0, 0.08);
  _note(494, 'sine', 0.06, 0.0001, 0.04, 0.1);
}

function sndSocialWin() {
  if (!soundOn) return;
  sndMilestone();
  _note(1318.51, 'sine', 0.10, 0.0001, 0.1, 0.22);
  _note(1568, 'triangle', 0.08, 0.0001, 0.18, 0.24);
}
