// Premium Web Audio FX engine (iOS-safe) + haptics + motion helpers.
//
// Each sound is a short layered synth tone with a proper attack/decay envelope
// and (optionally) a low-pass filter for warmth — a step up from raw beeps.
// iOS requires the AudioContext to be created/resumed from a user gesture, so
// call unlockAudio() on the first pointerdown/keydown (see App.tsx).

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!audioCtx) {
      const Ctor: typeof AudioContext | undefined =
        window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      audioCtx = new Ctor();
    }
    if (audioCtx.state === 'suspended') void audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

/** Unlock/resume audio on the first user gesture (required on iOS Safari). */
export function unlockAudio(): void {
  const ctx = getCtx();
  if (ctx && ctx.state === 'suspended') void ctx.resume();
}

/** Honour the OS "reduce motion" setting for visual effects (confetti, ripple). */
export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

interface ToneOpts {
  freq: number;
  duration?: number;   // seconds (release time)
  type?: OscillatorType;
  volume?: number;     // 0..1 peak
  attack?: number;     // seconds
  filter?: number;     // low-pass cutoff Hz
  delay?: number;      // seconds before start
}

function tone(o: ToneOpts): void {
  const ctx = getCtx();
  if (!ctx) return;
  const { freq, duration = 0.15, type = 'sine', volume = 0.2, attack = 0.006, filter, delay = 0 } = o;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);

  let head: AudioNode = osc;
  if (filter) {
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(filter, t0);
    osc.connect(lp);
    head = lp;
  }
  head.connect(gain);
  gain.connect(ctx.destination);

  const peak = Math.max(0.0001, volume);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(peak, t0 + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + duration);
  osc.start(t0);
  osc.stop(t0 + attack + duration + 0.03);
}

/** Back-compat helper (legacy callers). */
export function playBeep(frequency = 800, duration = 100, volume = 0.3): void {
  tone({ freq: frequency, duration: duration / 1000, volume, type: 'triangle' });
}

// Predefined, cohesive sound palette.
export const sounds = {
  tap: () => tone({ freq: 430, duration: 0.05, volume: 0.07, type: 'sine', filter: 1400 }),
  tick: () => tone({ freq: 680, duration: 0.04, volume: 0.09, type: 'sine' }),
  save: () => {
    tone({ freq: 587, duration: 0.12, volume: 0.16, type: 'triangle', filter: 2600 });
    tone({ freq: 880, duration: 0.18, volume: 0.12, type: 'sine', delay: 0.08 });
  },
  success: () => {
    [523, 659, 784].forEach((f, i) =>
      tone({ freq: f, duration: 0.18, volume: 0.15, type: 'triangle', filter: 3200, delay: i * 0.085 }),
    );
  },
  pr: () => {
    // Triumphant rising chord + sparkle.
    [523, 784, 1047].forEach((f, i) =>
      tone({ freq: f, duration: 0.24, volume: 0.18, type: 'sawtooth', filter: 2600, delay: i * 0.08 }),
    );
    tone({ freq: 1568, duration: 0.45, volume: 0.16, type: 'sine', delay: 0.26 });
  },
  levelUp: () => {
    // Fanfare: ascending run resolving to a held chord.
    [392, 523, 659, 784].forEach((f, i) =>
      tone({ freq: f, duration: 0.2, volume: 0.17, type: 'triangle', filter: 3200, delay: i * 0.1 }),
    );
    [784, 988, 1175].forEach((f) =>
      tone({ freq: f, duration: 0.6, volume: 0.14, type: 'sine', delay: 0.46 }),
    );
  },
  error: () => tone({ freq: 196, duration: 0.2, volume: 0.16, type: 'sawtooth', filter: 700 }),
  timer: () => {
    tone({ freq: 880, duration: 0.12, volume: 0.18, type: 'sine' });
    tone({ freq: 1320, duration: 0.32, volume: 0.16, type: 'sine', delay: 0.12 });
  },
};

// Haptic feedback using the Vibration API (no-op on iOS / unsupported devices).
export const haptics = {
  tap: () => navigator.vibrate?.(8),
  tick: () => navigator.vibrate?.(5),
  save: () => navigator.vibrate?.(28),
  success: () => navigator.vibrate?.([18, 40, 18]),
  pr: () => navigator.vibrate?.([28, 45, 28, 45, 55]),
  levelUp: () => navigator.vibrate?.([18, 28, 18, 28, 38, 28, 60]),
  error: () => navigator.vibrate?.([45, 28, 45]),
  timer: () => navigator.vibrate?.([90, 45, 90]),
};

// Visual ripple effect.
export function createRipple(element: HTMLElement, color: string = '#2ecc71'): void {
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
