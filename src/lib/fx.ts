// Sound effects using Web Audio API
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

export function playBeep(frequency: number = 800, duration: number = 100, volume: number = 0.3) {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.value = frequency;
    gain.gain.value = volume;
    oscillator.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
    oscillator.stop(ctx.currentTime + duration / 1000);
  } catch {
    // Web Audio not available
  }
}

// Predefined sound effects
export const sounds = {
  tap: () => playBeep(600, 50, 0.15),
  save: () => playBeep(880, 150, 0.2),
  success: () => {
    playBeep(523, 100, 0.2);
    setTimeout(() => playBeep(659, 100, 0.2), 100);
    setTimeout(() => playBeep(784, 150, 0.25), 200);
  },
  pr: () => {
    playBeep(523, 80, 0.3);
    setTimeout(() => playBeep(784, 80, 0.3), 80);
    setTimeout(() => playBeep(1047, 200, 0.35), 160);
  },
  levelUp: () => {
    playBeep(440, 100, 0.25);
    setTimeout(() => playBeep(554, 100, 0.25), 120);
    setTimeout(() => playBeep(659, 100, 0.25), 240);
    setTimeout(() => playBeep(880, 250, 0.3), 360);
  },
  error: () => playBeep(200, 200, 0.2),
  timer: () => playBeep(1000, 300, 0.25),
};

// Haptic feedback using Vibration API
export const haptics = {
  tap: () => navigator.vibrate?.(10),
  save: () => navigator.vibrate?.(30),
  success: () => navigator.vibrate?.([20, 50, 20]),
  pr: () => navigator.vibrate?.([30, 50, 30, 50, 50]),
  levelUp: () => navigator.vibrate?.([20, 30, 20, 30, 40, 30, 60]),
  error: () => navigator.vibrate?.([50, 30, 50]),
  timer: () => navigator.vibrate?.([100, 50, 100]),
};

// Visual effects
export function createRipple(element: HTMLElement, color: string = '#2ecc71') {
  const rect = element.getBoundingClientRect();
  const ripple = document.createElement('div');
  const size = Math.max(rect.width, rect.height);

  ripple.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    left: ${rect.width / 2 - size / 2}px;
    top: ${rect.height / 2 - size / 2}px;
    background: ${color};
    border-radius: 50%;
    opacity: 0.3;
    transform: scale(0);
    pointer-events: none;
    animation: ripple-expand 0.5s ease-out forwards;
  `;

  element.style.position = element.style.position || 'relative';
  element.style.overflow = 'hidden';
  element.appendChild(ripple);
  setTimeout(() => ripple.remove(), 500);
}
