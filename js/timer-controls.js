function setTimer(s) {
  timerTarget = s;
  timerSeconds = s;
  timerRunning = false;
  clearInterval(timerInterval);
  document.querySelectorAll('.timer-preset-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  renderTimer();
}

function startTimer() {
  if (timerRunning) return;
  timerSeconds = timerTarget;
  timerRunning = true;
  renderTimer();
  timerInterval = setInterval(() => {
    timerSeconds--;
    renderTimer();
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      timerDone();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerSeconds = timerTarget;
  renderTimer();
}

function renderTimer() {
  const m = Math.floor(timerSeconds / 60);
  const s = timerSeconds % 60;
  const el = document.getElementById('timer-display');
  el.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  el.className = 'timer-display' + (timerRunning ? ' rest' : '');
}

function timerDone() {
  const el = document.getElementById('timer-display');
  el.textContent = 'GO!';
  el.className = 'timer-display done';
  if (typeof hapTimerDone === 'function') hapTimerDone();
  // FX sound engine (falls back to legacy if not loaded)
  if (typeof sndTimerDone === 'function') {
    sndTimerDone();
  } else if (settings.sound) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [880, 1100, 1320].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        gain.gain.value = 0.3;
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.12);
      });
    } catch (e) {}
  }
  if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
  // Brief screen accent pulse
  const flash = document.getElementById('save-flash');
  if (flash) {
    flash.style.background = 'var(--accent)';
    flash.classList.remove('flash');
    void flash.offsetWidth;
    flash.classList.add('flash');
    flash.addEventListener('animationend', () => flash.classList.remove('flash'), { once: true });
  }
  setTimeout(() => {
    timerSeconds = timerTarget;
    renderTimer();
  }, 1500);
}
