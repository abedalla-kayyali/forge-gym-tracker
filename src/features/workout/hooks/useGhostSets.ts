import { useMemo } from 'react';
import { useWorkoutStore } from '../../../stores/useWorkoutStore';

interface GhostSet {
  reps: number;
  weight: number;
  rpe?: number;
}

export function useGhostSets(exerciseName: string): GhostSet[] {
  const workouts = useWorkoutStore((s) => s.workouts);

  return useMemo(() => {
    // Find the most recent workout containing this exercise
    for (let i = workouts.length - 1; i >= 0; i--) {
      const workout = workouts[i];
      if (!workout) continue;
      const exercise = workout.exercises.find(
        (e) => e.name.toLowerCase() === exerciseName.toLowerCase(),
      );
      if (exercise && exercise.sets.length > 0) {
        return exercise.sets.map((s) => ({
          reps: s.reps,
          weight: s.weight,
          rpe: s.rpe,
        }));
      }
    }
    return [];
  }, [workouts, exerciseName]);
}
