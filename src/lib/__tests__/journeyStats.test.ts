import { describe, it, expect } from 'vitest';
import { computeJourney, estimateOneRepMax } from '../journeyStats';
import type { Workout, BwWorkout, CardioEntry } from '../../types/workout';

function w(date: string, exercises: Workout['exercises']): Workout {
  return { id: date, date, name: 'W', exercises };
}
function ex(name: string, sets: { reps: number; weight: number; isWarmup?: boolean }[]): Workout['exercises'][number] {
  return { name, muscle: 'chest', sets };
}

const NOW = Date.parse('2026-06-07T12:00:00Z');

describe('estimateOneRepMax', () => {
  it('returns the weight for a single rep', () => {
    expect(estimateOneRepMax(100, 1)).toBe(100);
  });
  it('applies the Epley formula for multi-rep sets', () => {
    expect(estimateOneRepMax(100, 10)).toBeCloseTo(133.33, 1);
  });
  it('guards against zero / negative input', () => {
    expect(estimateOneRepMax(0, 5)).toBe(0);
    expect(estimateOneRepMax(80, 0)).toBe(0);
    expect(estimateOneRepMax(-5, 5)).toBe(0);
  });
});

describe('computeJourney totals', () => {
  const workouts = [
    w('2026-06-01', [ex('Bench Press', [{ reps: 10, weight: 60 }, { reps: 8, weight: 70 }])]),
    w('2026-06-03', [ex('Bench Press', [{ reps: 5, weight: 80 }])]),
  ];
  const bw: BwWorkout[] = [
    { id: 'b1', date: '2026-06-01', name: 'BW', exercises: [{ name: 'Pull-Up', muscle: 'back', sets: [{ reps: 12 }, { reps: 10, addedWeight: 10 }] }] },
  ];
  const cardio: CardioEntry[] = [{ id: 'c1', type: 'run', date: '2026-06-05', duration: 30 }];

  const j = computeJourney({ workouts, bwWorkouts: bw, cardio, now: NOW });

  it('counts sessions across all modalities', () => {
    expect(j.totals.sessions).toBe(4);
    expect(j.totals.weightedSessions).toBe(2);
    expect(j.totals.bwSessions).toBe(1);
    expect(j.totals.cardioSessions).toBe(1);
  });
  it('sums volume (weighted reps×weight + bw added load)', () => {
    // 10*60 + 8*70 + 5*80 = 600 + 560 + 400 = 1560 ; bw: 10*10 = 100
    expect(j.totals.totalVolumeKg).toBe(1660);
  });
  it('sums sets and reps including bodyweight', () => {
    expect(j.totals.totalSets).toBe(5); // 2 + 1 weighted + 2 bw
    expect(j.totals.totalReps).toBe(10 + 8 + 5 + 12 + 10);
  });
  it('counts unique training days and weeks', () => {
    // distinct days: 06-01, 06-03, 06-05  → 3 (bw shares 06-01)
    expect(j.totals.trainingDays).toBe(3);
    expect(j.totals.weeksActive).toBe(1); // all in the same Mon-anchored week
    expect(j.totals.firstDate).toBe('2026-06-01');
  });
  it('accumulates cardio minutes', () => {
    expect(j.totals.cardioMinutes).toBe(30);
  });
});

describe('computeJourney strength trends', () => {
  const workouts = [
    w('2026-05-01', [ex('Squat', [{ reps: 5, weight: 100 }])]),
    w('2026-05-15', [ex('Squat', [{ reps: 5, weight: 110 }])]),
    w('2026-06-01', [ex('Squat', [{ reps: 5, weight: 120 }])]),
    // single-point exercise should be excluded (needs ≥2 points)
    w('2026-06-01', [ex('Deadlift', [{ reps: 3, weight: 140 }])]),
  ];
  const j = computeJourney({ workouts, bwWorkouts: [], cardio: [], now: NOW });

  it('builds an ascending e1RM series for repeated lifts', () => {
    const squat = j.strength.find((s) => s.name === 'Squat');
    expect(squat).toBeTruthy();
    expect(squat!.points.length).toBe(3);
    expect(squat!.points[0]).toBeLessThan(squat!.points[2]!);
    expect(squat!.deltaPct).toBeGreaterThan(0);
  });
  it('excludes lifts with fewer than two data points', () => {
    expect(j.strength.find((s) => s.name === 'Deadlift')).toBeUndefined();
  });
  it('ignores warmup sets', () => {
    const only = computeJourney({
      workouts: [
        w('2026-05-01', [ex('Press', [{ reps: 10, weight: 20, isWarmup: true }, { reps: 5, weight: 50 }])]),
        w('2026-05-08', [ex('Press', [{ reps: 5, weight: 55 }])]),
      ],
      bwWorkouts: [], cardio: [], now: NOW,
    });
    const press = only.strength.find((s) => s.name === 'Press');
    expect(press!.points[0]).toBe(Math.round(estimateOneRepMax(50, 5)));
  });
});

describe('computeJourney calendar + streaks', () => {
  it('emits exactly weeks×7 cells with counts mapped', () => {
    const j = computeJourney({
      workouts: [w('2026-06-07', [ex('Row', [{ reps: 8, weight: 40 }])])],
      bwWorkouts: [], cardio: [], now: NOW, calendarWeeks: 4,
    });
    expect(j.calendar.length).toBe(28);
    const today = j.calendar.find((c) => c.date === '2026-06-07');
    expect(today?.count).toBe(1);
  });
  it('computes current and longest streaks', () => {
    const j = computeJourney({
      workouts: [
        w('2026-06-05', [ex('A', [{ reps: 5, weight: 50 }])]),
        w('2026-06-06', [ex('A', [{ reps: 5, weight: 50 }])]),
        w('2026-06-07', [ex('A', [{ reps: 5, weight: 50 }])]),
      ],
      bwWorkouts: [], cardio: [], now: NOW,
    });
    expect(j.currentStreak).toBe(3);
    expect(j.longestStreak).toBe(3);
  });
});

describe('computeJourney milestones', () => {
  it('marks achieved milestones and reports progress', () => {
    const workouts = Array.from({ length: 30 }, (_, i) =>
      w(`2026-0${1 + (i % 5)}-1${i % 9}`.slice(0, 10), [ex('Bench', [{ reps: 5, weight: 100 }])]));
    const j = computeJourney({ workouts, bwWorkouts: [], cardio: [], now: NOW });
    const firstStep = j.milestones.find((m) => m.key === 'firstStep')!;
    const committed = j.milestones.find((m) => m.key === 'committed')!;
    const centurion = j.milestones.find((m) => m.key === 'centurion')!;
    expect(firstStep.achieved).toBe(true);
    expect(committed.achieved).toBe(true); // 30 ≥ 25
    expect(centurion.achieved).toBe(false); // 30 < 250
    expect(centurion.progress).toBeCloseTo(30 / 250, 5);
  });
  it('returns all milestone definitions', () => {
    const j = computeJourney({ workouts: [], bwWorkouts: [], cardio: [], now: NOW });
    expect(j.milestones.length).toBe(10);
    expect(j.milestones.every((m) => !m.achieved)).toBe(true);
  });
});
