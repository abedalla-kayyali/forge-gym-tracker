import { describe, it, expect } from 'vitest';
import { flagPRs, recommendProgram, macroGuidance } from '../trainingScience';
import type { Workout, WorkoutExercise } from '../../types/workout';

const wk = (name: string, weights: number[]): Workout => ({
  id: name,
  date: '2026-01-01',
  name,
  exercises: [{ name, muscle: 'chest', sets: weights.map((w) => ({ reps: 5, weight: w })) }],
});

const ex = (name: string, weights: number[]): WorkoutExercise => ({
  name,
  muscle: 'chest',
  sets: weights.map((w) => ({ reps: 5, weight: w })),
});

describe('flagPRs', () => {
  it('flags the heaviest set as a PR when there is no history', () => {
    const { exercises, prCount } = flagPRs([ex('Bench', [60, 80, 70])], []);
    expect(prCount).toBe(1);
    const sets = exercises[0]!.sets;
    expect(sets.map((s) => s.isPR)).toEqual([true, true, false]); // 60>0, 80>60, 70<80
  });

  it('flags a set that beats the all-time best from history', () => {
    const history = [wk('Bench', [60, 70])];
    const { exercises, prCount } = flagPRs([ex('Bench', [72])], history);
    expect(prCount).toBe(1);
    expect(exercises[0]!.sets[0]!.isPR).toBe(true);
  });

  it('does not flag a set that is below the prior best', () => {
    const history = [wk('Bench', [100])];
    const { exercises, prCount } = flagPRs([ex('Bench', [90, 95])], history);
    expect(prCount).toBe(0);
    expect(exercises[0]!.sets.every((s) => !s.isPR)).toBe(true);
  });

  it('matches exercise names case-insensitively and ignores zero-weight sets', () => {
    const history = [wk('bench', [100])];
    const { prCount } = flagPRs([ex('BENCH', [0, 50])], history);
    expect(prCount).toBe(0);
  });

  it('counts PRs across multiple exercises', () => {
    const { prCount, prExercises } = flagPRs([ex('Bench', [80]), ex('Squat', [120])], []);
    expect(prCount).toBe(2);
    expect(prExercises).toEqual(['Bench', 'Squat']);
  });
});

describe('recommendProgram', () => {
  it('gives beginners / low frequency a full-body split', () => {
    const p = recommendProgram({ experience: 'beginner', daysPerWeek: 3 });
    expect(p.split).toBe('full_body');
    expect(p.schedule).toHaveLength(3);
    expect(p.daysPerWeek).toBe(3);
  });

  it('4 days (non-beginner) → upper/lower; 6 days → push/pull/legs', () => {
    expect(recommendProgram({ experience: 'intermediate', daysPerWeek: 4 }).split).toBe('upper_lower');
    expect(recommendProgram({ experience: 'advanced', daysPerWeek: 6 }).split).toBe('ppl');
  });

  it('scales rep range / RIR / progression by goal', () => {
    const strength = recommendProgram({ goal: 'strength', experience: 'intermediate', daysPerWeek: 4 });
    expect(strength.repRange).toEqual([3, 6]);
    expect(strength.rir).toBe(1);
    expect(strength.progressionKey).toBe('add_weight');
    expect(recommendProgram({ goal: 'build_muscle', daysPerWeek: 4, experience: 'intermediate' }).repRange).toEqual([6, 12]);
  });

  it('emphasis is sex-aware (overridable suggestion)', () => {
    expect(recommendProgram({ sex: 'female', goal: 'general' }).emphasis).toContain('glutes');
    expect(recommendProgram({ sex: 'male', goal: 'general' }).emphasis).toContain('chest');
  });

  it('clamps days/week to 2..6', () => {
    expect(recommendProgram({ daysPerWeek: 99, experience: 'advanced' }).daysPerWeek).toBe(6);
    expect(recommendProgram({ daysPerWeek: 0 }).daysPerWeek).toBe(2);
  });
});

describe('macroGuidance', () => {
  it('returns null without a bodyweight', () => {
    expect(macroGuidance({ goal: 'build_muscle' })).toBeNull();
  });

  it('lose_fat → deficit below TDEE; build_muscle → surplus above', () => {
    const cut = macroGuidance({ weightKg: 80, sex: 'male', goal: 'lose_fat', daysPerWeek: 4 })!;
    expect(cut.deltaKey).toBe('deficit');
    expect(cut.calories).toBeLessThan(cut.tdee);
    const bulk = macroGuidance({ weightKg: 80, sex: 'male', goal: 'build_muscle', daysPerWeek: 4 })!;
    expect(bulk.deltaKey).toBe('surplus');
    expect(bulk.calories).toBeGreaterThan(bulk.tdee);
  });

  it('protein scales with bodyweight; macros are positive', () => {
    const m = macroGuidance({ weightKg: 70, heightCm: 175, age: 28, sex: 'female', goal: 'recomp', daysPerWeek: 4 })!;
    expect(m.protein_g).toBe(140); // 2.0 g/kg
    expect(m.carbs_g).toBeGreaterThan(0);
    expect(m.fat_g).toBeGreaterThan(0);
    expect(macroGuidance({ weightKg: 70, goal: 'lose_fat' })!.protein_g).toBe(154); // 2.2 g/kg cutting
  });
});
