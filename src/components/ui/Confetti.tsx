import { useEffect, useRef } from 'react';

interface Props {
  active: boolean;
  /** ms to run before fading out. Default 2200. */
  duration?: number;
  /** How many particles. Default 60. */
  count?: number;
  onDone?: () => void;
}

/**
 * Lightweight canvas-based confetti burst for session-save celebrations.
 * No dependencies, respects prefers-reduced-motion, auto-fades, overlays full viewport.
 */
export function Confetti({ active, duration = 2200, count = 60, onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;

    // Respect reduced-motion — fire a short confirmation instead
    const reduce = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      const t = window.setTimeout(() => onDone?.(), 400);
      return () => window.clearTimeout(t);
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const colors = ['#2ecc71', '#58d68d', '#d4af37', '#f0cc55', '#3b82f6', '#ffffff'];
    const W = window.innerWidth;
    const H = window.innerHeight;

    type Particle = {
      x: number; y: number; vx: number; vy: number;
      r: number; rot: number; vr: number; color: string; shape: 'rect' | 'circle';
    };

    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: W / 2 + (Math.random() - 0.5) * 80,
      y: H * 0.42,
      vx: (Math.random() - 0.5) * 10,
      vy: -(8 + Math.random() * 6),
      r: 4 + Math.random() * 6,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.4,
      color: colors[Math.floor(Math.random() * colors.length)] ?? '#2ecc71',
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    }));

    const start = performance.now();
    const gravity = 0.32;

    const tick = (t: number) => {
      const elapsed = t - start;
      const progress = elapsed / duration;
      ctx.clearRect(0, 0, W, H);
      for (const p of particles) {
        p.vy += gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        const alpha = progress < 0.75 ? 1 : Math.max(0, 1 - (progress - 0.75) * 4);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.shape === 'rect') {
          ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      if (elapsed < duration) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, W, H);
        onDone?.();
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, duration, count, onDone]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[70]"
      aria-hidden
    />
  );
}
