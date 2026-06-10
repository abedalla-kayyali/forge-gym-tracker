import { PATHS_BY_MUSCLE, getDecorativePaths, BODY_MAP_VIEWBOX } from './body-map-data';
import type { MuscleGroup } from '../../types/workout';
import type { Sex } from '../../types/profile';

const MUSCLE_ORDER: MuscleGroup[] = [
  'chest', 'shoulders', 'biceps', 'forearms', 'core',
  'back', 'triceps', 'glutes', 'legs', 'calves',
];

interface BuildOpts {
  highlights?: MuscleGroup[];
  /** Flat override for the idle muscle fill; defaults to a steel gradient. */
  baseFill?: string;
  /** Flat override for the silhouette under-layer; defaults to a graphite gradient. */
  silhouetteFill?: string;
  accent?: string;           // selected fill (gradient top)
  accentStroke?: string;     // selected stroke / gradient bottom
  decorativeStroke?: string;
  /** If set, wraps in a card-like rounded-rect background. */
  background?: string;       // color or 'none'
  /** Shapes the silhouette (broader shoulders / wider hips). */
  sex?: Sex;
}

/**
 * Build a self-contained SVG string for the body map — safe to encode as
 * `data:image/svg+xml,…` and drawn to a canvas.
 *
 * Mirrors the React <BodyMap> component's render, minus interactivity.
 */
export function buildBodyMapSvgString({
  highlights = [],
  baseFill,
  silhouetteFill,
  accent = '#58d68d',
  accentStroke = '#1e9e55',
  decorativeStroke = 'rgba(255,255,255,0.08)',
  background = 'none',
  sex,
}: BuildOpts = {}): string {
  const { w, h } = BODY_MAP_VIEWBOX;
  const selected = new Set(highlights);
  const muscleFill = baseFill ?? 'url(#bm-steel-gradient)';
  const bodyFill = silhouetteFill ?? 'url(#bm-body-gradient)';

  const bg =
    background !== 'none'
      ? `<rect width="100%" height="100%" fill="${background}" rx="24"/>`
      : '';

  // Decorative silhouette — rendered first so muscles overlay it in relief
  const decor = getDecorativePaths(sex).map(
    (d) =>
      `<path d="${d}" fill="${bodyFill}" stroke="${decorativeStroke}" stroke-width="0.5" stroke-linejoin="round"/>`,
  ).join('');

  // Muscles — grouped, highlights replace fill with luxury green gradient
  const muscles = MUSCLE_ORDER.map((m) => {
    const paths = PATHS_BY_MUSCLE[m];
    if (!paths || paths.length === 0) return '';
    const active = selected.has(m);
    const fill = active ? 'url(#bm-green-gradient)' : muscleFill;
    const stroke = active ? 'rgba(212,175,55,0.55)' : 'rgba(255,255,255,0.10)';
    const sw = active ? 0.9 : 0.5;
    const filter = active ? ' filter="url(#bm-glow-filter)"' : '';
    return paths
      .map(
        (d) =>
          `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"${filter}/>`,
      )
      .join('');
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
    <defs>
      <linearGradient id="bm-green-gradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${accent}" />
        <stop offset="100%" stop-color="${accentStroke}" />
      </linearGradient>
      <linearGradient id="bm-steel-gradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#59636e" />
        <stop offset="100%" stop-color="#3d454e" />
      </linearGradient>
      <linearGradient id="bm-body-gradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#2a323a" />
        <stop offset="100%" stop-color="#1b2127" />
      </linearGradient>
      <filter id="bm-glow-filter" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="b"/>
        <feMerge>
          <feMergeNode in="b"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    ${bg}
    <g>
      ${decor}
      ${muscles}
    </g>
  </svg>`;
}

/** Helper: URL-encode the SVG for use in a data URI (UTF-8 safe). */
export function bodyMapSvgDataUrl(opts: BuildOpts = {}): string {
  const svg = buildBodyMapSvgString(opts);
  // Use URL-encoding so the DataURL works across all browsers (including Safari)
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}
