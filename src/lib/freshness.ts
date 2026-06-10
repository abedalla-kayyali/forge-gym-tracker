// Single source of truth for the muscle-freshness palette and classifier.
// Consumed by BodyMap (legend), MuscleHeatmap (tints + legend) and any future
// recovery surface — keep the ramp here so the colors can't drift apart.

export type Freshness = 'sore' | 'worked' | 'recovering' | 'ready' | 'overdue';

export const FRESHNESS_COLORS: Record<Freshness, string> = {
  sore:       '#EF4444', // red    — <24h, muscle still recovering
  worked:     '#2ecc71', // green  — 1-2 days ago
  recovering: '#8BC34A', // lime   — 3-4 days ago
  ready:      '#F59E0B', // amber  — 5-6 days ago
  overdue:    '#4B5563', // slate  — not trained recently
};

export function freshnessOf(daysSince: number | null): Freshness {
  if (daysSince === null) return 'overdue';
  if (daysSince < 1) return 'sore';
  if (daysSince <= 2) return 'worked';
  if (daysSince <= 4) return 'recovering';
  if (daysSince <= 6) return 'ready';
  return 'overdue';
}
