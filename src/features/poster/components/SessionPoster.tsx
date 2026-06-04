import { useRef, useCallback, useEffect, useState } from 'react';
import type { Workout, MuscleGroup } from '../../../types/workout';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Download, Share2, Copy, Check } from 'lucide-react';
import { bodyMapSvgDataUrl } from '../../../components/body/buildBodyMapSvg';
import { useFX } from '../../../hooks/useFX';

interface Props {
  workout: Workout | null;
  open: boolean;
  onClose: () => void;
}

// ── Poster layout constants ──
const POSTER_W = 1080;
const POSTER_H = 1440;
const VALID_MUSCLES: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'forearms', 'core', 'legs', 'glutes', 'calves',
];

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function SessionPoster({ workout, open, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { play } = useFX();

  const drawPoster = useCallback(async () => {
    if (!workout || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = POSTER_W;
    canvas.height = POSTER_H;

    // ─ Background ────────────────────────────────────────────────────────
    const bgGrad = ctx.createLinearGradient(0, 0, 0, POSTER_H);
    bgGrad.addColorStop(0,    '#0a1015');
    bgGrad.addColorStop(0.55, '#050709');
    bgGrad.addColorStop(1,    '#020305');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, POSTER_W, POSTER_H);

    // Green radial wash (top)
    const wash = ctx.createRadialGradient(POSTER_W * 0.5, 0, 0, POSTER_W * 0.5, 0, POSTER_H * 0.7);
    wash.addColorStop(0, 'rgba(46,204,113,0.22)');
    wash.addColorStop(1, 'rgba(46,204,113,0)');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, POSTER_W, POSTER_H);

    // Sapphire bottom wash for depth
    const wash2 = ctx.createRadialGradient(POSTER_W * 0.7, POSTER_H, 0, POSTER_W * 0.7, POSTER_H, POSTER_H * 0.5);
    wash2.addColorStop(0, 'rgba(59,130,246,0.1)');
    wash2.addColorStop(1, 'rgba(59,130,246,0)');
    ctx.fillStyle = wash2;
    ctx.fillRect(0, 0, POSTER_W, POSTER_H);

    // ─ Borders ───────────────────────────────────────────────────────────
    ctx.strokeStyle = 'rgba(46,204,113,0.45)';
    ctx.lineWidth = 4;
    roundRect(ctx, 32, 32, POSTER_W - 64, POSTER_H - 64, 36);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    roundRect(ctx, 50, 50, POSTER_W - 100, POSTER_H - 100, 30);
    ctx.stroke();

    // ─ Brand header ──────────────────────────────────────────────────────
    ctx.textAlign = 'center';
    ctx.fillStyle = '#58d68d';
    ctx.font = 'bold 108px "Bebas Neue", Impact, sans-serif';
    ctx.fillText('FORGE', POSTER_W / 2, 175);

    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = 'bold 22px "Barlow Condensed", sans-serif';
    ctx.fillText('— SESSION · COMPLETE —', POSTER_W / 2, 215);

    // Workout name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 58px "Barlow Condensed", sans-serif';
    wrapText(ctx, workout.name.toUpperCase(), POSTER_W / 2, 295, POSTER_W - 200, 64);

    // Date pill
    const dateStr = new Date(workout.date).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
    }).toUpperCase();
    const pillW = 300;
    const pillX = POSTER_W / 2 - pillW / 2;
    const pillY = 362;
    ctx.fillStyle = 'rgba(46,204,113,0.13)';
    roundRect(ctx, pillX, pillY, pillW, 56, 28);
    ctx.fill();
    ctx.strokeStyle = 'rgba(46,204,113,0.4)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, pillX, pillY, pillW, 56, 28);
    ctx.stroke();
    ctx.fillStyle = '#58d68d';
    ctx.font = 'bold 22px "Barlow Condensed", sans-serif';
    ctx.fillText(dateStr, POSTER_W / 2, 398);

    // ─ Body map (SVG rendered to image) ──────────────────────────────────
    const muscles = new Set<MuscleGroup>(
      workout.exercises
        .map((e) => e.muscle.toLowerCase() as MuscleGroup)
        .filter((m): m is MuscleGroup => VALID_MUSCLES.includes(m as MuscleGroup)),
    );

    const bmTop = 450;
    const bmSize = 640;  // square card
    const bmX = (POSTER_W - bmSize) / 2;

    // Background card for body map
    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    roundRect(ctx, bmX, bmTop, bmSize, bmSize, 28);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    roundRect(ctx, bmX, bmTop, bmSize, bmSize, 28);
    ctx.stroke();

    try {
      const svgUrl = bodyMapSvgDataUrl({ highlights: Array.from(muscles) });
      const img = await loadImage(svgUrl);
      // Body-map native aspect 475:460 ≈ 1:1 → fit into bmSize square
      const scale = Math.min(bmSize / 475, bmSize / 460) * 0.92;  // 8% inset padding
      const drawW = 475 * scale;
      const drawH = 460 * scale;
      const drawX = bmX + (bmSize - drawW) / 2;
      const drawY = bmTop + (bmSize - drawH) / 2;
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    } catch {
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '20px "Barlow", sans-serif';
      ctx.fillText('Body map unavailable', POSTER_W / 2, bmTop + bmSize / 2);
    }

    // ─ Divider line ──────────────────────────────────────────────────────
    const divY = bmTop + bmSize + 40;
    const divGrad = ctx.createLinearGradient(120, divY, POSTER_W - 120, divY);
    divGrad.addColorStop(0,   'rgba(255,255,255,0)');
    divGrad.addColorStop(0.5, 'rgba(255,255,255,0.2)');
    divGrad.addColorStop(1,   'rgba(255,255,255,0)');
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(120, divY);
    ctx.lineTo(POSTER_W - 120, divY);
    ctx.stroke();

    // ─ Stats grid (2 × 2) ────────────────────────────────────────────────
    const totalSets = workout.exercises.reduce((a, ex) => a + ex.sets.length, 0);
    const totalVolume = workout.exercises.reduce(
      (a, ex) => a + ex.sets.reduce((s, set) => s + set.reps * set.weight, 0),
      0,
    );
    const totalReps = workout.exercises.reduce(
      (a, ex) => a + ex.sets.reduce((s, set) => s + set.reps, 0),
      0,
    );
    const prs = workout.exercises.reduce(
      (a, ex) => a + ex.sets.filter((s) => s.isPR).length,
      0,
    );

    const hasVolume = totalVolume > 0;
    const stats = [
      { label: 'Duration', value: String(workout.duration ?? 0), unit: 'MIN' },
      {
        label: hasVolume ? 'Volume' : 'Reps',
        value: hasVolume ? Math.round(totalVolume).toLocaleString() : String(totalReps),
        unit: hasVolume ? 'KG' : '',
      },
      { label: 'Sets',    value: String(totalSets), unit: '' },
      { label: 'PRs',     value: String(prs), unit: '' },
    ];

    const gridTop = divY + 60;
    const cellW = (POSTER_W - 200) / 2;
    stats.forEach((stat, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx = 100 + cellW / 2 + col * cellW;
      const cy = gridTop + row * 150;

      // Big value
      ctx.textAlign = 'center';
      ctx.fillStyle = i === 3 && prs > 0 ? '#d4af37' : '#58d68d';  // gold for PRs
      ctx.font = 'bold 104px "Bebas Neue", Impact, sans-serif';
      ctx.fillText(stat.value, cx, cy + 20);

      if (stat.unit) {
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.font = 'bold 22px "Barlow Condensed", sans-serif';
        ctx.textAlign = 'left';
        const valueW = ctx.measureText(stat.value).width;
        // rough estimate for display-font width
        ctx.textAlign = 'center';
        ctx.fillText(' ' + stat.unit, cx + valueW / 2 + 12, cy + 8);
      }

      // Label
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.72)';
      ctx.font = 'bold 22px "Barlow Condensed", sans-serif';
      ctx.fillText(stat.label.toUpperCase(), cx, cy + 58);
    });

    // ─ Muscles worked strip ──────────────────────────────────────────────
    if (muscles.size > 0) {
      const stripY = gridTop + 340;
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = 'bold 22px "Barlow Condensed", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MUSCLES WORKED', POSTER_W / 2, stripY);

      const muscleNames = Array.from(muscles).map(
        (m) => m.charAt(0).toUpperCase() + m.slice(1),
      );
      ctx.fillStyle = '#58d68d';
      ctx.font = '30px "Barlow", sans-serif';
      ctx.fillText(muscleNames.join('  ·  '), POSTER_W / 2, stripY + 38);
    }

    // ─ Footer ────────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = 'bold 20px "Barlow Condensed", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FORGED BY FORGE · GYM OS', POSTER_W / 2, POSTER_H - 80);

    setDataUrl(canvas.toDataURL('image/png'));
  }, [workout]);

  useEffect(() => {
    if (open && workout) {
      setDataUrl(null);
      const id = window.setTimeout(drawPoster, 40);
      return () => window.clearTimeout(id);
    }
  }, [open, workout, drawPoster]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `forge-session-${new Date().toISOString().slice(0, 10)}.png`;
    a.click();
    play('save');
  };

  const handleShare = async () => {
    if (!dataUrl) { handleDownload(); return; }
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'forge-session.png', { type: 'image/png' });
      const canShareFiles =
        typeof navigator !== 'undefined' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] });
      if (canShareFiles && navigator.share) {
        await navigator.share({
          title: 'FORGE Session',
          text: workout ? `Just crushed ${workout.name} — tracked on FORGE.` : 'Just crushed a session!',
          files: [file],
        });
        play('success');
      } else {
        handleDownload();
      }
    } catch {
      handleDownload();
    }
  };

  const handleCopy = async () => {
    if (!dataUrl) return;
    try {
      const blob = await (await fetch(dataUrl)).blob();
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopied(true);
        play('tap');
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* silent */
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Share Your Session"
      subtitle="Luxury poster · ready for socials"
      size="md"
    >
      <div className="space-y-4">
        <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] shadow-[0_18px_50px_rgba(0,0,0,0.5)] bg-forge-bg-deep">
          <canvas
            ref={canvasRef}
            className="w-full block"
            style={{ aspectRatio: `${POSTER_W} / ${POSTER_H}` }}
          />
          {!dataUrl && (
            <div className="absolute inset-0 flex items-center justify-center bg-forge-bg-deep/80 backdrop-blur-sm">
              <span className="label-cap text-forge-green animate-pulse">Rendering poster…</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={handleShare} variant="primary" size="md" fullWidth disabled={!dataUrl}>
            <Share2 size={16} /> Share
          </Button>
          <Button onClick={handleDownload} variant="secondary" size="md" disabled={!dataUrl} aria-label="Download poster">
            <Download size={16} />
          </Button>
          <Button onClick={handleCopy} variant="secondary" size="md" disabled={!dataUrl} aria-label={copied ? 'Copied' : 'Copy to clipboard'}>
            {copied ? <Check size={16} className="text-forge-green" /> : <Copy size={16} />}
          </Button>
        </div>

        <p className="text-center text-[11px] text-forge-muted font-condensed tracking-wider">
          Tap Share to post to friends, stories, or chat apps
        </p>
      </div>
    </Modal>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number, maxWidth: number, lineHeight: number,
) {
  const words = text.split(' ');
  let line = '';
  let curY = y;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const { width } = ctx.measureText(testLine);
    if (width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, curY);
      line = words[n] + ' ';
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, curY);
}
