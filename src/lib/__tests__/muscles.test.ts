import { describe, it, expect } from 'vitest';
import { toMuscleGroup, canonicalMuscle } from '../muscles';

describe('toMuscleGroup', () => {
  it('passes through the canonical 10 (any casing)', () => {
    for (const m of ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'core', 'legs', 'glutes', 'calves']) {
      expect(toMuscleGroup(m)).toBe(m);
      expect(toMuscleGroup(m.toUpperCase())).toBe(m);
    }
  });
  it('maps capitalized legacy labels', () => {
    expect(toMuscleGroup('Chest')).toBe('chest');
    expect(toMuscleGroup('Glutes')).toBe('glutes');
  });
  it('folds extra labels into the nearest group', () => {
    expect(toMuscleGroup('Traps')).toBe('back');
    expect(toMuscleGroup('Lower Back')).toBe('back');
    expect(toMuscleGroup('Lats')).toBe('back');
    expect(toMuscleGroup('Neck')).toBe('shoulders');
    expect(toMuscleGroup('Delts')).toBe('shoulders');
    expect(toMuscleGroup('Quads')).toBe('legs');
    expect(toMuscleGroup('Hamstrings')).toBe('legs');
    expect(toMuscleGroup('Abs')).toBe('core');
    expect(toMuscleGroup('Hips')).toBe('glutes');
  });
  it('trims surrounding whitespace', () => {
    expect(toMuscleGroup('  Chest  ')).toBe('chest');
    expect(toMuscleGroup('lower back')).toBe('back');
  });
  it('returns null for unknown / non-string input', () => {
    expect(toMuscleGroup('wings')).toBeNull();
    expect(toMuscleGroup(undefined)).toBeNull();
    expect(toMuscleGroup(123)).toBeNull();
    expect(toMuscleGroup('')).toBeNull();
  });
});

describe('canonicalMuscle', () => {
  it('returns the canonical group when recognized', () => {
    expect(canonicalMuscle('Traps')).toBe('back');
    expect(canonicalMuscle('CHEST')).toBe('chest');
  });
  it('falls back to trimmed-lowercased original for unknowns', () => {
    expect(canonicalMuscle('Wings')).toBe('wings');
    expect(canonicalMuscle('  Custom Thing ')).toBe('custom thing');
  });
  it('returns empty string for non-string input', () => {
    expect(canonicalMuscle(null)).toBe('');
    expect(canonicalMuscle(42)).toBe('');
  });
});
