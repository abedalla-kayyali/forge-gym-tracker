import { describe, it, expect, beforeEach } from 'vitest';
import { useWorkoutStore } from '../useWorkoutStore';
import type { Workout } from '../../types/workout';

const mockWorkout: Workout = {
  id: 'w_test_1',
  date: '2026-04-16T10:00:00Z',
  name: 'Push Day',
  exercises: [
    {
      name: 'Bench Press',
      muscle: 'chest',
      sets: [{ reps: 8, weight: 100, rpe: 8 }],
    },
  ],
  duration: 45,
};

describe('useWorkoutStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useWorkoutStore.setState({ workouts: [] });
  });

  it('initializes empty when no localStorage data', () => {
    const { workouts } = useWorkoutStore.getState();
    expect(workouts).toEqual([]);
  });

  it('hydrates from existing localStorage data', () => {
    localStorage.setItem('forge_workouts', JSON.stringify([mockWorkout]));
    useWorkoutStore.getState().hydrate();
    expect(useWorkoutStore.getState().workouts).toHaveLength(1);
    expect(useWorkoutStore.getState().workouts[0]!.id).toBe('w_test_1');
  });

  it('adds a workout and persists to localStorage', () => {
    useWorkoutStore.getState().addWorkout(mockWorkout);
    const { workouts } = useWorkoutStore.getState();
    expect(workouts).toHaveLength(1);

    const raw = JSON.parse(localStorage.getItem('forge_workouts')!);
    expect(raw).toHaveLength(1);
    expect(raw[0].id).toBe('w_test_1');
  });

  it('deletes a workout by id', () => {
    useWorkoutStore.getState().addWorkout(mockWorkout);
    useWorkoutStore.getState().deleteWorkout('w_test_1');
    expect(useWorkoutStore.getState().workouts).toHaveLength(0);
  });

  it('gets workouts for a specific date', () => {
    useWorkoutStore.getState().addWorkout(mockWorkout);
    const found = useWorkoutStore.getState().getByDate('2026-04-16');
    expect(found).toHaveLength(1);
  });
});
