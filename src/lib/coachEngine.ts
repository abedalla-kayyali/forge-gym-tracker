// Pure, offline coach rules engine. Given a snapshot of the user's real data it
// returns an ordered thread of coach messages (greeting, celebrations, warnings,
// suggestions) — each optionally carrying a quick-reply action. No network, no
// React: fully testable.

import type { MuscleGroup } from '../types/workout';

export type CoachActionKind = 'start_workout' | 'view_stats' | 'apply_macros' | 'set_goal';

export interface CoachAction {
  kind: CoachActionKind;
  muscle?: MuscleGroup;
}

export interface CoachMessage {
  id: string;
  tone: 'greeting' | 'celebrate' | 'warn' | 'suggest' | 'info';
  textKey: string;
  /** Interpolation vars. A `muscle` var holds a MuscleGroup key — the UI
   *  translates it via t('muscles.'+value) before interpolating. */
  vars?: Record<string, string | number>;
  action?: { labelKey: string; act: CoachAction };
}

export interface CoachInput {
  name?: string;
  hour: number;                  // local hour 0-23
  hasGoal: boolean;
  streak: number;
  loggedToday: boolean;
  daysSinceLast: number | null;  // null = never trained
  weeklyCurrent: number;
  weeklyGoal: number;
  recentPRs: number;             // PRs in the most recent session
  recommendedMuscle?: MuscleGroup | null;
  plateauName?: string | null;
  plateauWeeks?: number;
  hasWeight: boolean;            // bodyweight known → macros computable
  totalWorkouts: number;
}

export function buildCoachThread(i: CoachInput): CoachMessage[] {
  const msgs: CoachMessage[] = [];
  const timeKey = i.hour < 5 ? 'night' : i.hour < 12 ? 'morning' : i.hour < 18 ? 'afternoon' : 'evening';

  // 1. Greeting (always)
  msgs.push({ id: 'greet', tone: 'greeting', textKey: `coach.greet.${timeKey}`, vars: { name: i.name || '' } });

  // 2. Onboarding — no goal yet
  if (!i.hasGoal) {
    msgs.push({ id: 'goal', tone: 'suggest', textKey: 'coach.setGoal', action: { labelKey: 'coach.action.setGoal', act: { kind: 'set_goal' } } });
  }

  // 3. PR celebration (most recent session)
  if (i.recentPRs > 0) {
    msgs.push({ id: 'pr', tone: 'celebrate', textKey: 'coach.pr', vars: { count: i.recentPRs } });
  }

  // 4. Streak / comeback
  if (i.streak >= 3) {
    msgs.push({ id: 'streak', tone: 'celebrate', textKey: 'coach.streakStrong', vars: { count: i.streak } });
  } else if (i.daysSinceLast !== null && i.daysSinceLast >= 4) {
    msgs.push({
      id: 'comeback', tone: 'warn', textKey: 'coach.comeback', vars: { count: i.daysSinceLast },
      action: { labelKey: 'coach.action.start', act: { kind: 'start_workout', muscle: i.recommendedMuscle ?? undefined } },
    });
  }

  // 5. Plateau
  if (i.plateauName && i.plateauWeeks) {
    msgs.push({ id: 'plateau', tone: 'warn', textKey: 'coach.plateau', vars: { name: i.plateauName, weeks: i.plateauWeeks } });
  }

  // 6. Weekly progress
  const remaining = Math.max(0, i.weeklyGoal - i.weeklyCurrent);
  if (i.weeklyGoal > 0 && i.weeklyCurrent >= i.weeklyGoal) {
    msgs.push({ id: 'weekHit', tone: 'celebrate', textKey: 'coach.weekHit', vars: { goal: i.weeklyGoal } });
  } else if (i.totalWorkouts > 0) {
    msgs.push({ id: 'week', tone: 'info', textKey: 'coach.weekProgress', vars: { current: i.weeklyCurrent, goal: i.weeklyGoal, remaining } });
  }

  // 7. Today's call to action
  if (!i.loggedToday) {
    if (i.recommendedMuscle) {
      msgs.push({
        id: 'today', tone: 'suggest', textKey: 'coach.todayMuscle', vars: { muscle: i.recommendedMuscle },
        action: { labelKey: 'coach.action.start', act: { kind: 'start_workout', muscle: i.recommendedMuscle } },
      });
    } else {
      msgs.push({ id: 'today', tone: 'suggest', textKey: 'coach.todayGeneric', action: { labelKey: 'coach.action.start', act: { kind: 'start_workout' } } });
    }
  } else {
    msgs.push({ id: 'doneToday', tone: 'info', textKey: 'coach.doneToday' });
  }

  // 8. Macros
  if (i.hasGoal && !i.hasWeight) {
    msgs.push({ id: 'weight', tone: 'info', textKey: 'coach.needWeight' });
  } else if (i.hasGoal && i.hasWeight) {
    msgs.push({ id: 'macros', tone: 'suggest', textKey: 'coach.macros', action: { labelKey: 'coach.action.applyMacros', act: { kind: 'apply_macros' } } });
  }

  return msgs;
}
