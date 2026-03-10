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

/* Sound toggle */
function toggleSound() {
  soundOn = !soundOn;
  localStorage.setItem('forge_sound', soundOn ? 'on' : 'off');
  document.getElementById('sound-icon-on').style.display = soundOn ? '' : 'none';
  document.getElementById('sound-icon-off').style.display = soundOn ? 'none' : '';
  document.getElementById('sound-toggle').classList.toggle('muted', !soundOn);
  if (soundOn) sndTap();
}

/* Init sound button state */
(function initSoundBtn() {
  const btn = document.getElementById('sound-toggle');
  if (!btn) return;
  document.getElementById('sound-icon-on').style.display = soundOn ? '' : 'none';
  document.getElementById('sound-icon-off').style.display = soundOn ? 'none' : '';
  btn.classList.toggle('muted', !soundOn);
})();
