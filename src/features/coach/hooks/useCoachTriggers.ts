import { useMemo } from 'react';
import { useCoachState } from './useCoachState';
import type { CoachTrigger } from '../../../types/coach';

export function useCoachTriggers(): CoachTrigger[] {
  const state = useCoachState();

  return useMemo(() => {
    const triggers: CoachTrigger[] = [];
    const now = new Date().toISOString();

    // Overdue muscles
    for (const m of state.muscleRecovery) {
      if (m.status === 'overdue') {
        triggers.push({
          type: 'recovery',
          muscle: m.muscle,
          message: `${m.muscle.charAt(0).toUpperCase() + m.muscle.slice(1)} hasn't been trained in ${m.daysSince} days`,
          severity: 'warning',
          timestamp: now,
        });
      }
    }

    // High volume warning
    for (const m of state.muscleRecovery) {
      if (m.totalSets7d > 20) {
        triggers.push({
          type: 'overload',
          muscle: m.muscle,
          message: `${m.muscle.charAt(0).toUpperCase() + m.muscle.slice(1)}: ${m.totalSets7d} sets this week — consider a deload`,
          severity: 'warning',
          timestamp: now,
        });
      }
    }

    // Streak celebration
    if (state.streak >= 7) {
      triggers.push({
        type: 'pr',
        message: `${state.streak}-day training streak! Keep it up!`,
        severity: 'success',
        timestamp: now,
      });
    }

    // Rest day suggestion
    if (state.totalWorkouts7d >= 6) {
      triggers.push({
        type: 'deload',
        message: `${state.totalWorkouts7d} workouts this week — consider a rest day`,
        severity: 'info',
        timestamp: now,
      });
    }

    // Neglected muscles
    if (state.neglectedMuscles.length > 0 && state.totalWorkouts30d > 5) {
      triggers.push({
        type: 'recovery',
        message: `Neglected muscles: ${state.neglectedMuscles.join(', ')}`,
        severity: 'info',
        timestamp: now,
      });
    }

    return triggers;
  }, [state]);
}
