import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Clock } from 'lucide-react';
import { useWorkoutStore } from '../../../stores/useWorkoutStore';
import { useBwWorkoutStore } from '../../../stores/useBwWorkoutStore';
import { useCardioStore } from '../../../stores/useCardioStore';

/** Collect all session ISO dates across stores, sorted most-recent first. */
function useAllSessions() {
  const workouts = useWorkoutStore((s) => s.workouts);
  const bw = useBwWorkoutStore((s) => s.bwWorkouts);
  const cardio = useCardioStore((s) => s.entries);

  return useMemo(() => {
    const all = [
      ...workouts.map((w) => ({ date: w.date, kind: 'weighted' as const, name: w.name })),
      ...bw.map((w) => ({ date: w.date, kind: 'bodyweight' as const, name: w.name })),
      ...cardio.map((c) => ({ date: c.date, kind: 'cardio' as const, name: c.type })),
    ];
    all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return all;
  }, [workouts, bw, cardio]);
}

function humanAgo(iso: string, t: (key: string, options?: Record<string, unknown>) => string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 2) return t('sessionStreak.ago.justNow');
  if (diff < 60) return t('sessionStreak.ago.minutes', { count: diff });
  const hours = Math.floor(diff / 60);
  if (hours < 24) return t('sessionStreak.ago.hours', { count: hours });
  const days = Math.floor(hours / 24);
  if (days === 1) return t('sessionStreak.ago.yesterday');
  if (days < 7) return t('sessionStreak.ago.days', { count: days });
  if (days < 30) return t('sessionStreak.ago.weeks', { count: Math.floor(days / 7) });
  return t('sessionStreak.ago.months', { count: Math.floor(days / 30) });
}

/**
 * Last-session summary for the Log idle screen: most recent session + how
 * long ago, with a lifetime session counter. The streak itself renders once,
 * in ProgressGuide's StreakSaver card right below — don't duplicate it here.
 */
export function SessionStreakCard() {
  const { t } = useTranslation();
  const sessions = useAllSessions();
  const lastSession = sessions[0];

  if (!lastSession) return null;

  return (
    <div className="w-full max-w-md mx-auto card-elevated card-luxury-border rounded-2xl p-3.5 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-forge-green/20 to-forge-green/5 border border-forge-green/25 flex items-center justify-center shrink-0">
          <Trophy size={18} className="text-forge-green" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-forge-text text-[12px] font-condensed truncate">
            {t('sessionStreak.last')} <span className="text-forge-green capitalize">{lastSession.name}</span>
          </div>
          <div className="text-forge-muted text-[10px] font-mono mt-0.5 inline-flex items-center gap-1">
            <Clock size={10} /> {humanAgo(lastSession.date, t)}
          </div>
        </div>
        <div className="text-end shrink-0">
          <div className="kpi-md text-forge-green leading-none">{sessions.length}</div>
          <div className="label-cap text-[9px] mt-0.5">{t('sessionStreak.total')}</div>
        </div>
      </div>
    </div>
  );
}
