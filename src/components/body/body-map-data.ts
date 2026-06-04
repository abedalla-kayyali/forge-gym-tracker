// Hand-authored anatomical body map — front + back figures with clean,
// deliberately-placed, NON-OVERLAPPING muscle regions so tapping a muscle
// always selects that muscle (the previous auto-traced data was mis-classified,
// e.g. only one bicep was captured, so taps hit the wrong region).
//
// Coordinates are in a 240x360 viewBox: FRONT figure centred on x~70,
// BACK figure centred on x~170. Decorative paths (head/torso/limbs) form the
// grey silhouette and are not interactive; each muscle is a set of rounded
// "pills" laid over the silhouette.

import type { MuscleGroup } from '../../types/workout';

export const BODY_MAP_VIEWBOX = { w: 240, h: 360 };

/** Rounded-rectangle path. */
function rr(x: number, y: number, w: number, h: number, r: number): string {
  const k = Math.min(r, w / 2, h / 2);
  return `M ${x + k} ${y} h ${w - 2 * k} a ${k} ${k} 0 0 1 ${k} ${k} v ${h - 2 * k} a ${k} ${k} 0 0 1 ${-k} ${k} h ${-(w - 2 * k)} a ${k} ${k} 0 0 1 ${-k} ${-k} v ${-(h - 2 * k)} a ${k} ${k} 0 0 1 ${k} ${-k} z`;
}
/** Circle as a path (for heads). */
function circle(cx: number, cy: number, r: number): string {
  return `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 z`;
}

// -- Silhouette (decorative, non-interactive) --------------------------------
const FRONT_CX = 70;
const BACK_CX = 170;

function silhouette(cx: number): string[] {
  const o = cx - 70; // x-offset from the front figure
  return [
    circle(cx, 34, 15),                 // head
    rr(64 + o, 50, 12, 16, 4),          // neck
    rr(48 + o, 64, 44, 94, 13),         // torso
    rr(33 + o, 86, 15, 82, 7),          // left arm
    rr(92 + o, 86, 15, 82, 7),          // right arm
    rr(50 + o, 156, 18, 128, 9),        // left leg
    rr(72 + o, 156, 18, 128, 9),        // right leg
  ];
}

export const DECORATIVE_PATHS: string[] = [
  ...silhouette(FRONT_CX),
  ...silhouette(BACK_CX),
];

// -- Muscle regions ----------------------------------------------------------
// Each entry is one or more rounded pills. Front figure first, then back.
const B = BACK_CX - FRONT_CX; // 100 - shift to the back figure

export const PATHS_BY_MUSCLE: Record<MuscleGroup, string[]> = {
  // Front torso - pecs
  chest: [rr(52, 76, 17, 17, 6), rr(71, 76, 17, 17, 6)],
  // Front + back delts
  shoulders: [
    rr(40, 70, 16, 13, 6), rr(84, 70, 16, 13, 6),
    rr(40 + B, 70, 16, 13, 6), rr(84 + B, 70, 16, 13, 6),
  ],
  // Front upper arms
  biceps: [rr(34, 90, 14, 30, 7), rr(92, 90, 14, 30, 7)],
  // Back upper arms
  triceps: [rr(34 + B, 90, 14, 30, 7), rr(92 + B, 90, 14, 30, 7)],
  // Lower arms, front + back
  forearms: [
    rr(34, 124, 14, 34, 7), rr(92, 124, 14, 34, 7),
    rr(34 + B, 124, 14, 34, 7), rr(92 + B, 124, 14, 34, 7),
  ],
  // Front abdomen
  core: [rr(56, 98, 28, 52, 10)],
  // Back torso (lats / traps)
  back: [rr(151, 78, 38, 66, 13)],
  // Back hips
  glutes: [rr(151, 148, 38, 24, 11)],
  // Quads (front) + hamstrings (back)
  legs: [
    rr(50, 160, 18, 58, 9), rr(72, 160, 18, 58, 9),
    rr(150, 160, 18, 56, 9), rr(172, 160, 18, 56, 9),
  ],
  // Calves (back lower legs)
  calves: [rr(150, 228, 17, 46, 9), rr(172, 228, 17, 46, 9)],
};

// Centroid of each muscle's primary region - used for heatmap value badges.
export const BODY_MAP_CENTROIDS: Record<MuscleGroup, { cx: number; cy: number }[]> = {
  chest: [{ cx: 70, cy: 85 }],
  shoulders: [{ cx: 48, cy: 77 }],
  biceps: [{ cx: 41, cy: 105 }],
  triceps: [{ cx: 141, cy: 105 }],
  forearms: [{ cx: 41, cy: 141 }],
  core: [{ cx: 70, cy: 124 }],
  back: [{ cx: 170, cy: 111 }],
  glutes: [{ cx: 170, cy: 160 }],
  legs: [{ cx: 59, cy: 189 }],
  calves: [{ cx: 158, cy: 251 }],
};
