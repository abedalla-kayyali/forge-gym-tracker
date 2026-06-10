import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCoachState } from './useCoachState';
import { useWorkoutStore } from '../../../stores/useWorkoutStore';
import type { CoachTrigger } from '../../../types/coach';

export function useCoachTriggers(): CoachTrigger[] {
  // Translating here (instead of storing English text) means messages re-render
  // in the active language — the hook re-runs whenever i18n language changes.
  const { t } = useTranslation();
  const state = useCoachState();
  const hasWorkouts = useWorkoutStore((s) => s.workouts.length > 0);

  return useMemo(() => {
    const triggers: CoachTrigger[] = [];
    const now = new Date().toISOString();
    const muscleName = (m: string) => t('muscles.' + m.toLowerCase());

    // Overdue muscles
    for (const m of state.muscleRecovery) {
      if (m.status === 'overdue') {
        if (m.daysSince >= 999) {
          // Never-trained sentinel: stay quiet for brand-new users (zero
          // workouts) instead of flooding them with "999 days" warnings.
          if (!hasWorkouts) continue;
          triggers.push({
            type: 'recovery',
            muscle: m.muscle,
            message: t('coachTriggers.neverTrained', { muscle: muscleName(m.muscle) }),
            severity: 'info',
            timestamp: now,
          });
          continue;
        }
        triggers.push({
          type: 'recovery',
          muscle: m.muscle,
          message: t('coachTriggers.overdue', { muscle: muscleName(m.muscle), count: m.daysSince }),
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
          message: t('coachTriggers.highVolume', { muscle: muscleName(m.muscle), count: m.totalSets7d }),
          severity: 'warning',
          timestamp: now,
        });
      }
    }

    // Streak celebration
    if (state.streak >= 7) {
      triggers.push({
        type: 'pr',
        message: t('coachTriggers.streak', { count: state.streak }),
        severity: 'success',
        timestamp: now,
      });
    }

    // Rest day suggestion
    if (state.totalWorkouts7d >= 6) {
      triggers.push({
        type: 'deload',
        message: t('coachTriggers.restDay', { count: state.totalWorkouts7d }),
        severity: 'info',
        timestamp: now,
      });
    }

    // Neglected muscles
    if (state.neglectedMuscles.length > 0 && state.totalWorkouts30d > 5) {
      triggers.push({
        type: 'recovery',
        message: t('coachTriggers.neglected', {
          muscles: state.neglectedMuscles.map(muscleName).join(t('coachTriggers.listSeparator')),
        }),
        severity: 'info',
        timestamp: now,
      });
    }

    return triggers;
  }, [state, t, hasWorkouts]);
}
