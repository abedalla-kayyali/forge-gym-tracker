import { useRef, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Workout, MuscleGroup } from '../../../types/workout';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Download, Share2, Copy, Check } from 'lucide-react';
import { bodyMapSvgDataUrl } from '../../../components/body/buildBodyMapSvg';
import { BODY_MAP_VIEWBOX } from '../../../components/body/body-map-data';
import { useProfileStore } from '../../../stores/useProfileStore';
import { useFX } from '../../../hooks/useFX';
import { formatNumber, formatDate } from '../../../lib/format';

interface Props {
  workout: Workout | null;
  open: boolean;
  onClose: () => void;
}

// Instagram/TikTok story format (9:16).
const POSTER_W = 1080;
const POSTER_H = 1920;
const VALID_MUSCLES: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'forearms', 'core', 'legs', 'glutes', 'calves',
];
const QUOTE_COUNT = 5;

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
  const { t, i18n } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const sex = useProfileStore((s) => s.profile.sex);
  const { play } = useFX();

  const drawPoster = useCallback(async () => {
    if (!workout || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = POSTER_W;
    canvas.height = POSTER_H;
    const rtl = i18n.language?.startsWith('ar') ?? false;
    // System font fallback so Arabic glyphs render (display fonts are Latin-only).
    const SANS = "'Barlow Condensed', system-ui, 'Segoe UI', sans-serif";
    const BODY = "'Barlow', system-ui, sans-serif";

    // ── Background ─────────────────────────────────────────────────────────
    const bgGrad = ctx.createLinearGradient(0, 0, 0, POSTER_H);
    bgGrad.addColorStop(0, '#0a1015');
    bgGrad.addColorStop(0.55, '#050709');
    bgGrad.addColorStop(1, '#020305');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, POSTER_W, POSTER_H);

    const wash = ctx.createRadialGradient(POSTER_W * 0.5, 0, 0, POSTER_W * 0.5, 0, POSTER_H * 0.55);
    wash.addColorStop(0, 'rgba(46,204,113,0.20)');
    wash.addColorStop(1, 'rgba(46,204,113,0)');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, POSTER_W, POSTER_H);

    const wash2 = ctx.createRadialGradient(POSTER_W * 0.7, POSTER_H, 0, POSTER_W * 0.7, POSTER_H, POSTER_H * 0.45);
    wash2.addColorStop(0, 'rgba(59,130,246,0.10)');
    wash2.addColorStop(1, 'rgba(59,130,246,0)');
    ctx.fillStyle = wash2;
    ctx.fillRect(0, 0, POSTER_W, POSTER_H);

    // Borders
    ctx.strokeStyle = 'rgba(46,204,113,0.45)';
    ctx.lineWidth = 4;
    roundRect(ctx, 36, 36, POSTER_W - 72, POSTER_H - 72, 44);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    roundRect(ctx, 56, 56, POSTER_W - 112, POSTER_H - 112, 36);
    ctx.stroke();

    ctx.textAlign = 'center';

    // ── Brand header ───────────────────────────────────────────────────────
    ctx.save();
    ctx.shadowColor = 'rgba(46,204,113,0.5)';
    ctx.shadowBlur = 36;
    ctx.fillStyle = '#58d68d';
    ctx.font = "bold 150px 'Bebas Neue', Impact, sans-serif";
    ctx.fillText('FORGE', POSTER_W / 2, 230);
    ctx.restore();

    ctx.fillStyle = 'rgba(255,255,255,0.62)';
    ctx.font = `600 26px ${SANS}`;
    ctx.fillText(`—  ${t('poster.sessionComplete').toUpperCase()}  —`, POSTER_W / 2, 282);

    // Workout name
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 66px ${SANS}`;
    wrapText(ctx, (workout.name || t('saveWorkout.defaultWorkoutName')).toUpperCase(), POSTER_W / 2, 372, POSTER_W - 240, 74);

    // Date pill
    const dateStr = formatDate(workout.date, { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
    const pillW = 360, pillX = POSTER_W / 2 - pillW / 2, pillY = 414;
    ctx.fillStyle = 'rgba(46,204,113,0.13)';
    roundRect(ctx, pillX, pillY, pillW, 60, 30); ctx.fill();
    ctx.strokeStyle = 'rgba(46,204,113,0.4)'; ctx.lineWidth = 1.5;
    roundRect(ctx, pillX, pillY, pillW, 60, 30); ctx.stroke();
    ctx.fillStyle = '#58d68d';
    ctx.font = `600 26px ${SANS}`;
    ctx.fillText(dateStr, POSTER_W / 2, pillY + 40);

    // ── Body map ─────────────────────────────────────────────────────────────
    const muscles = new Set<MuscleGroup>(
      workout.exercises
        .map((e) => e.muscle.toLowerCase() as MuscleGroup)
        .filter((m): m is MuscleGroup => VALID_MUSCLES.includes(m as MuscleGroup)),
    );

    const bmTop = 520, bmRegionW = 760, bmRegionH = 820, bmX = (POSTER_W - bmRegionW) / 2;
    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    roundRect(ctx, bmX, bmTop, bmRegionW, bmRegionH, 32); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
    roundRect(ctx, bmX, bmTop, bmRegionW, bmRegionH, 32); ctx.stroke();

    try {
      const svgUrl = bodyMapSvgDataUrl({ highlights: Array.from(muscles), sex });
      const img = await loadImage(svgUrl);
      const { w: vbW, h: vbH } = BODY_MAP_VIEWBOX; // 240 × 360
      const scale = Math.min(bmRegionW / vbW, bmRegionH / vbH) * 0.92;
      const drawW = vbW * scale, drawH = vbH * scale;
      ctx.drawImage(img, bmX + (bmRegionW - drawW) / 2, bmTop + (bmRegionH - drawH) / 2, drawW, drawH);
    } catch {
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = `20px ${BODY}`;
      ctx.fillText('—', POSTER_W / 2, bmTop + bmRegionH / 2);
    }

    // ── Stats ──────────────────────────────────────────────────────────────
    const totalSets = workout.exercises.reduce((a, ex) => a + ex.sets.length, 0);
    const totalVolume = workout.exercises.reduce((a, ex) => a + ex.sets.reduce((s, set) => s + set.reps * set.weight, 0), 0);
    const totalReps = workout.exercises.reduce((a, ex) => a + ex.sets.reduce((s, set) => s + set.reps, 0), 0);
    const prs = workout.exercises.reduce((a, ex) => a + ex.sets.filter((s) => s.isPR).length, 0);
    const hasVolume = totalVolume > 0;

    // Gold PR / milestone callout
    let statsTop = bmTop + bmRegionH + 96;
    if (prs > 0) {
      const cy = bmTop + bmRegionH + 70;
      const label = `🏆  ${t('poster.newPRs', { count: prs })}`;
      ctx.font = `bold 40px ${SANS}`;
      const cw = ctx.measureText(label).width + 80;
      const cx = POSTER_W / 2 - cw / 2;
      ctx.fillStyle = 'rgba(212,175,55,0.16)';
      roundRect(ctx, cx, cy - 44, cw, 72, 36); ctx.fill();
      ctx.strokeStyle = 'rgba(212,175,55,0.5)'; ctx.lineWidth = 2;
      roundRect(ctx, cx, cy - 44, cw, 72, 36); ctx.stroke();
      ctx.fillStyle = '#e8c252';
      ctx.fillText(label, POSTER_W / 2, cy + 2);
      statsTop = cy + 110;
    }

    const stats = [
      { value: String(workout.duration ?? 0), unit: t('poster.minUnit'), label: t('poster.duration') },
      hasVolume
        ? { value: formatNumber(Math.round(totalVolume)), unit: t('log.kgUnit'), label: t('poster.volume') }
        : { value: formatNumber(totalReps), unit: '', label: t('poster.reps') },
      { value: String(totalSets), unit: '', label: t('poster.sets') },
    ];
    const colW = (POSTER_W - 160) / 3;
    stats.forEach((s, i) => {
      const cx = 80 + colW / 2 + i * colW;
      ctx.fillStyle = '#58d68d';
      ctx.font = "bold 110px 'Bebas Neue', Impact, sans-serif";
      ctx.fillText(s.value, cx, statsTop + 20);
      ctx.fillStyle = 'rgba(255,255,255,0.72)';
      ctx.font = `600 26px ${SANS}`;
      ctx.fillText((s.label + (s.unit ? ` · ${s.unit}` : '')).toUpperCase(), cx, statsTop + 66);
    });

    // ── Muscles worked ───────────────────────────────────────────────────────
    let y = statsTop + 150;
    if (muscles.size > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = `600 24px ${SANS}`;
      ctx.fillText(t('poster.musclesWorked').toUpperCase(), POSTER_W / 2, y);
      const names = Array.from(muscles).map((m) => t('muscles.' + m));
      ctx.fillStyle = '#58d68d';
      ctx.font = `32px ${BODY}`;
      ctx.fillText(names.join('   ·   '), POSTER_W / 2, y + 44);
      y += 110;
    }

    // ── Motivational tagline ─────────────────────────────────────────────────
    const qi = ((workout.name?.length ?? 0) + (workout.duration ?? 0) + totalSets) % QUOTE_COUNT;
    ctx.fillStyle = 'rgba(255,255,255,0.82)';
    ctx.font = `italic 600 38px ${BODY}`;
    wrapText(ctx, `“${t('poster.quote' + (qi + 1))}”`, POSTER_W / 2, y + 20, POSTER_W - 220, 50);

    // ── Footer ───────────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(255,255,255,0.32)';
    ctx.font = `600 24px ${SANS}`;
    ctx.fillText(t('poster.footer').toUpperCase(), POSTER_W / 2, POSTER_H - 96);

    ctx.direction = rtl ? 'rtl' : 'ltr';
    setDataUrl(canvas.toDataURL('image/png'));
  }, [workout, t, i18n.language, sex]);

  useEffect(() => {
    if (open && workout) {
      setDataUrl(null);
      const id = window.setTimeout(drawPoster, 40);
      return () => window.clearTimeout(id);
    }
  }, [open, workout, drawPoster]);

  const fileName = () => `forge-session-${new Date().toISOString().slice(0, 10)}.png`;

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = fileName();
    a.click();
    play('save');
  };

  const handleShare = async () => {
    if (!dataUrl) { handleDownload(); return; }
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], fileName(), { type: 'image/png' });
      const canShareFiles =
        typeof navigator !== 'undefined' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] });
      if (canShareFiles && navigator.share) {
        await navigator.share({
          title: 'FORGE',
          text: workout ? t('poster.shareText', { name: workout.name }) : t('poster.shareTextGeneric'),
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
    <Modal open={open} onClose={onClose} title={t('poster.title')} subtitle={t('poster.subtitle')} size="md">
      <div className="space-y-4">
        <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] shadow-[0_18px_50px_rgba(0,0,0,0.5)] bg-forge-bg-deep mx-auto" style={{ maxWidth: 300 }}>
          <canvas ref={canvasRef} className="w-full block" style={{ aspectRatio: `${POSTER_W} / ${POSTER_H}` }} />
          {!dataUrl && (
            <div className="absolute inset-0 flex items-center justify-center bg-forge-bg-deep/80 backdrop-blur-sm">
              <span className="label-cap text-forge-green animate-pulse">{t('poster.rendering')}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={handleShare} variant="primary" size="md" fullWidth disabled={!dataUrl}>
            <Share2 size={16} /> {t('poster.share')}
          </Button>
          <Button onClick={handleDownload} variant="secondary" size="md" disabled={!dataUrl} aria-label={t('poster.download')}>
            <Download size={16} />
          </Button>
          <Button onClick={handleCopy} variant="secondary" size="md" disabled={!dataUrl} aria-label={copied ? t('poster.copied') : t('poster.copy')}>
            {copied ? <Check size={16} className="text-forge-green" /> : <Copy size={16} />}
          </Button>
        </div>

        <p className="text-center text-[11px] text-forge-muted font-condensed tracking-wider">
          {t('poster.shareHint')}
        </p>
      </div>
    </Modal>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ');
  let line = '';
  let curY = y;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    if (ctx.measureText(testLine).width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, curY);
      line = words[n] + ' ';
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, curY);
}
