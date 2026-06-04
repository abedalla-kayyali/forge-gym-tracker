import { describe, it, expect } from 'vitest';
import { flagPRs } from '../trainingScience';
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
