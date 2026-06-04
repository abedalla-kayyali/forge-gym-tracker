import { PATHS_BY_MUSCLE, DECORATIVE_PATHS, BODY_MAP_VIEWBOX } from './body-map-data';
import type { MuscleGroup } from '../../types/workout';

const MUSCLE_ORDER: MuscleGroup[] = [
  'chest', 'shoulders', 'biceps', 'forearms', 'core',
  'back', 'triceps', 'glutes', 'legs', 'calves',
];

interface BuildOpts {
  highlights?: MuscleGroup[];
  baseFill?: string;
  accent?: string;           // selected fill
  accentStroke?: string;     // selected stroke
  decorativeStroke?: string;
  /** If true, wraps in a card-like rounded-rect background. */
  background?: string;       // color or 'none'
}

/**
 * Build a self-contained SVG string for the body map — safe to encode as
 * `data:image/svg+xml;base64,…` and drawn to a canvas.
 *
 * Mirrors the React <BodyMap> component's render, minus interactivity.
 */
export function buildBodyMapSvgString({
  highlights = [],
  baseFill = '#8a9098',
  accent = '#58d68d',
  accentStroke = '#1e9e55',
  decorativeStroke = 'rgba(255,255,255,0.85)',
  background = 'none',
}: BuildOpts = {}): string {
  const { w, h } = BODY_MAP_VIEWBOX;
  const selected = new Set(highlights);

  const bg =
    background !== 'none'
      ? `<rect width="100%" height="100%" fill="${background}" rx="24"/>`
      : '';

  // Decorative (head, neck, knees, hands) — rendered first so muscles overlay them
  const decor = DECORATIVE_PATHS.map(
    (d) =>
      `<path d="${d}" fill="${baseFill}" stroke="${decorativeStroke}" stroke-width="0.5" stroke-linejoin="round" fill-opacity="0.85"/>`,
  ).join('');

  // Muscles — grouped, highlights replace fill with luxury green gradient
  const muscles = MUSCLE_ORDER.map((m) => {
    const paths = PATHS_BY_MUSCLE[m];
    if (!paths || paths.length === 0) return '';
    const active = selected.has(m);
    const fill = active ? 'url(#bm-green-gradient)' : baseFill;
    const stroke = active ? accentStroke : decorativeStroke;
    const sw = active ? 0.9 : 0.5;
    const filter = active ? ' filter="url(#bm-glow-filter)"' : '';
    const fillOp = active ? 1 : 1;
    return paths
      .map(
        (d) =>
          `<path d="${d}" fill="${fill}" fill-opacity="${fillOp}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"${filter}/>`,
      )
      .join('');
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
    <defs>
      <linearGradient id="bm-green-gradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${accent}" />
        <stop offset="100%" stop-color="${accentStroke}" />
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
