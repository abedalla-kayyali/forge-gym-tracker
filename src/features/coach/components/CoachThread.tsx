import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Brain, Trophy, AlertTriangle, ArrowRight, Sparkles, Flame } from 'lucide-react';
import { useWorkoutStore } from '../../../stores/useWorkoutStore';
import { useBwWorkoutStore } from '../../../stores/useBwWorkoutStore';
import { useCardioStore } from '../../../stores/useCardioStore';
import { useProfileStore } from '../../../stores/useProfileStore';
import { useBodyStore } from '../../../stores/useBodyStore';
import { useNutritionStore } from '../../../stores/useNutritionStore';
import { useSessionStore } from '../../../stores/useSessionStore';
import { useProgressInsights } from '../../../hooks/useProgressInsights';
import { useToast } from '../../../components/ui/Toast';
import { useFX } from '../../../hooks/useFX';
import { readStorage } from '../../../lib/storage';
import { STORAGE_KEYS } from '../../../lib/constants';
import { detectPlateaus, macroGuidance } from '../../../lib/trainingScience';
import { buildCoachThread, type CoachMessage, type CoachAction } from '../../../lib/coachEngine';

const TONE_ICON = {
  greeting: Sparkles,
  celebrate: Trophy,
  warn: AlertTriangle,
  suggest: ArrowRight,
  info: Flame,
} as const;
const TONE_COLOR: Record<CoachMessage['tone'], string> = {
  greeting: 'text-forge-green',
  celebrate: 'text-forge-gold',
  warn: 'text-amber-400',
  suggest: 'text-forge-green',
  info: 'text-forge-muted',
};

export function CoachThread() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { play } = useFX();

  const weeklyGoal = readStorage<number>(STORAGE_KEYS.WEEKLY_GOAL, 4);
  const insights = useProgressInsights(weeklyGoal);
  const profile = useProfileStore((s) => s.profile);
  const workouts = useWorkoutStore((s) => s.workouts);
  const bw = useBwWorkoutStore((s) => s.bwWorkouts);
  const cardio = useCardioStore((s) => s.entries);
  const bodyWeight = useBodyStore((s) => s.bodyWeight);
  const setMacroTargets = useNutritionStore((s) => s.setMacroTargets);

  const latestWeight = bodyWeight.length ? bodyWeight[bodyWeight.length - 1]!.weight_kg : profile.weight_kg;

  const messages = useMemo(() => {
    // Most-recent session date across all stores.
    const dates = [
      ...workouts.map((w) => w.date),
      ...bw.map((w) => w.date),
      ...cardio.map((c) => c.date),
    ].filter(Boolean).sort();
    const lastIso = dates[dates.length - 1];
    let daysSinceLast: number | null = null;
    if (lastIso) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const last = new Date(lastIso); last.setHours(0, 0, 0, 0);
      daysSinceLast = Math.round((today.getTime() - last.getTime()) / 86400000);
    }

    // PRs in the most recent (and recent enough) workout.
    let recentPRs = 0;
    if (daysSinceLast !== null && daysSinceLast <= 2) {
      const recent = [...workouts].sort((a, b) => (a.date < b.date ? 1 : -1))[0];
      if (recent) recentPRs = recent.exercises.reduce((a, ex) => a + ex.sets.filter((s) => s.isPR).length, 0);
    }

    const plateau = detectPlateaus(workouts)[0];

    return buildCoachThread({
      name: profile.name?.split(' ')[0] || t('coach.athlete'),
      hour: new Date().getHours(),
      hasGoal: !!profile.goal,
      streak: insights.streak.days,
      loggedToday: insights.today.anyLoggedToday,
      daysSinceLast,
      weeklyCurrent: insights.weekGoal.current,
      weeklyGoal: insights.weekGoal.target,
      recentPRs,
      recommendedMuscle: insights.recommendedMuscle?.muscle ?? null,
      plateauName: plateau?.exerciseName ?? null,
      plateauWeeks: plateau?.weeksStuck,
      hasWeight: !!latestWeight && latestWeight > 0,
      totalWorkouts: workouts.length + bw.length + cardio.length,
    });
  }, [workouts, bw, cardio, profile.name, profile.goal, insights, latestWeight, t]);

  const runAction = (a: CoachAction) => {
    switch (a.kind) {
      case 'start_workout': {
        const s = useSessionStore.getState();
        if (!s.active) s.start('weighted');
        if (a.muscle) s.setMuscle(a.muscle);
        play('tap');
        navigate('/log');
        break;
      }
      case 'view_stats':
        navigate('/stats');
        break;
      case 'set_goal':
        navigate('/log'); // StrategyCard lives on the Log start screen
        break;
      case 'apply_macros': {
        const m = macroGuidance({
          weightKg: latestWeight, heightCm: profile.height_cm, age: profile.age,
          sex: profile.sex, goal: profile.goal, daysPerWeek: weeklyGoal,
        });
        if (m) {
          setMacroTargets({ calories: m.calories, protein_g: m.protein_g, carbs_g: m.carbs_g, fat_g: m.fat_g });
          play('save');
          toast(t('strategy.macrosApplied'), 'success');
        } else {
          navigate('/log');
        }
        break;
      }
    }
  };

  const render = (msg: CoachMessage) => {
    const vars: Record<string, string | number> = { ...(msg.vars ?? {}) };
    if (typeof vars.muscle === 'string') vars.muscle = t('muscles.' + vars.muscle);
    return t(msg.textKey, vars);
  };

  return (
    <div className="card-elevated card-luxury-border rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-forge-green/25 to-forge-green/5 border border-forge-green/20 flex items-center justify-center">
          <Brain size={17} className="text-forge-green" />
        </div>
        <div>
          <div className="text-forge-text font-condensed font-semibold text-[14px] leading-tight">{t('coach.threadTitle')}</div>
          <div className="label-cap text-forge-green/80">{t('coach.threadSubtitle')}</div>
        </div>
      </div>

      <div className="space-y-2">
        {messages.map((msg) => {
          const Icon = TONE_ICON[msg.tone];
          return (
            <div key={msg.id} className="flex items-start gap-2.5 bg-black/20 rounded-xl px-3 py-2.5">
              <Icon size={15} className={`${TONE_COLOR[msg.tone]} mt-0.5 shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-forge-text-soft text-[13px] leading-relaxed">{render(msg)}</p>
                {msg.action && (
                  <button
                    onClick={() => runAction(msg.action!.act)}
                    className="mt-2 inline-flex items-center gap-1.5 bg-forge-green/15 text-forge-green border border-forge-green/25 px-3 py-1.5 rounded-lg text-[12px] font-condensed font-semibold uppercase tracking-wider cursor-pointer press-scale hover:bg-forge-green/25 transition-all duration-200 min-h-[36px]"
                  >
                    {t(msg.action.labelKey)} <ArrowRight size={13} className="rtl:rotate-180" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
