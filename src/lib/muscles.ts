// Canonical muscle taxonomy. The app models 10 MuscleGroups, but data comes
// from several sources with inconsistent casing and extra labels:
//   - the original vanilla app stored Capitalized names ("Chest", "Traps")
//   - the exercises DB uses Capitalized names, some outside the 10 groups
//     ("Lower Back", "Traps", "Neck")
//   - the React logger stores lowercase MuscleGroup values
// toMuscleGroup() folds all of these into the canonical 10 so comparison,
// grouping, the body map, and i18n ('muscles.<group>') all line up.

import type { MuscleGroup } from '../types/workout';

const MUSCLE_ALIASES: Record<string, MuscleGroup> = {
  // chest
  chest: 'chest', pecs: 'chest', pectorals: 'chest', pec: 'chest',
  // back (incl. traps / lower back / lats which have no own group)
  back: 'back', lats: 'back', lat: 'back', 'lower back': 'back', 'upper back': 'back',
  traps: 'back', trapezius: 'back', rhomboids: 'back', 'mid back': 'back',
  // shoulders (neck folds here — closest functional group)
  shoulders: 'shoulders', shoulder: 'shoulders', delts: 'shoulders', deltoids: 'shoulders',
  deltoid: 'shoulders', neck: 'shoulders', rear_delts: 'shoulders', 'rear delts': 'shoulders',
  // arms
  biceps: 'biceps', bicep: 'biceps',
  triceps: 'triceps', tricep: 'triceps',
  forearms: 'forearms', forearm: 'forearms', grip: 'forearms',
  // core
  core: 'core', abs: 'core', ab: 'core', abdominals: 'core', abdominal: 'core',
  obliques: 'core', oblique: 'core',
  // legs (quads / hams / adductors / thighs fold here)
  legs: 'legs', leg: 'legs', quads: 'legs', quad: 'legs', quadriceps: 'legs',
  hamstrings: 'legs', hamstring: 'legs', hams: 'legs', thighs: 'legs', thigh: 'legs',
  adductors: 'legs', abductors: 'legs',
  // glutes
  glutes: 'glutes', glute: 'glutes', gluteus: 'glutes', hips: 'glutes', hip: 'glutes',
  // calves
  calves: 'calves', calf: 'calves', soleus: 'calves',
};

/**
 * Map an arbitrary muscle label to its canonical MuscleGroup, or null if it
 * doesn't correspond to any of the 10 groups.
 */
export function toMuscleGroup(raw: unknown): MuscleGroup | null {
  if (typeof raw !== 'string') return null;
  return MUSCLE_ALIASES[raw.trim().toLowerCase()] ?? null;
}

/**
 * Canonical muscle string for storage/grouping: a MuscleGroup when recognized,
 * otherwise the trimmed-lowercased original (so unknown/custom muscles stay
 * consistent and never break consumers that lowercase before comparing).
 * Non-string input (null/number/etc.) yields '' — there is no muscle to keep.
 */
export function canonicalMuscle(raw: unknown): string {
  const mapped = toMuscleGroup(raw);
  if (mapped) return mapped;
  return typeof raw === 'string' ? raw.trim().toLowerCase() : '';
}
