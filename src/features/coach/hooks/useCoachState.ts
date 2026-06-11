import { useMemo } from 'react';
import { useNow } from '../../../hooks/useNow';
import { useWorkoutStore } from '../../../stores/useWorkoutStore';

interface MuscleRecovery {
  muscle: string;
  lastTrained: string;
  daysSince: number;
  totalSets7d: number;
  status: 'fresh' | 'recovering' | 'ready' | 'overdue';
}

interface CoachState {
  totalWorkouts7d: number;
  totalWorkouts30d: number;
  muscleRecovery: MuscleRecovery[];
  streak: number;
  topMuscle: string | null;
  neglectedMuscles: string[];
}

const TRACKED = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'core', 'legs', 'glutes'];

export function useCoachState(): CoachState {
  const workouts = useWorkoutStore((s) => s.workouts);

  const now = useNow();
  return useMemo(() => {
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    const recent7 = workouts.filter((w) => now - new Date(w.date).getTime() < sevenDays);
    const recent30 = workouts.filter((w) => now - new Date(w.date).getTime() < thirtyDays);

    // Muscle recovery analysis
    const muscleRecovery: MuscleRecovery[] = TRACKED.map((muscle) => {
      const sessions = workouts
        .filter((w) => w.exercises.some((e) => e.muscle.toLowerCase() === muscle))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const lastTrained = sessions[0]?.date ?? '';
      const daysSince = lastTrained
        ? Math.floor((now - new Date(lastTrained).getTime()) / (24 * 60 * 60 * 1000))
        : 999;

      const totalSets7d = recent7.reduce((acc, w) => {
        const ex = w.exercises.filter((e) => e.muscle.toLowerCase() === muscle);
        return acc + ex.reduce((s, e) => s + e.sets.length, 0);
      }, 0);

      let status: MuscleRecovery['status'] = 'ready';
      if (daysSince <= 1) status = 'recovering';
      else if (daysSince <= 2) status = 'fresh';
      else if (daysSince >= 7) status = 'overdue';

      return { muscle, lastTrained, daysSince, totalSets7d, status };
    });

    // Streak (consecutive days with workouts)
    let streak = 0;
    const today = new Date();
    for (let d = 0; d < 365; d++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - d);
      const dateStr = checkDate.toISOString().slice(0, 10);
      const hasWorkout = workouts.some((w) => w.date.startsWith(dateStr));
      if (hasWorkout) streak++;
      else if (d > 0) break; // Allow today to be missing
    }

    // Top and neglected muscles
    const volumeMap: Record<string, number> = {};
    for (const w of recent30) {
      for (const ex of w.exercises) {
        const m = ex.muscle.toLowerCase();
        volumeMap[m] = (volumeMap[m] ?? 0) + ex.sets.reduce((a, s) => a + s.reps * s.weight, 0);
      }
    }
    const sorted = Object.entries(volumeMap).sort((a, b) => b[1] - a[1]);
    const topMuscle = sorted[0]?.[0] ?? null;
    const neglected = TRACKED.filter((m) => !volumeMap[m] || volumeMap[m]! < 100);

    return {
      totalWorkouts7d: recent7.length,
      totalWorkouts30d: recent30.length,
      muscleRecovery,
      streak,
      topMuscle,
      neglectedMuscles: neglected,
    };
  }, [workouts, now]);
}
