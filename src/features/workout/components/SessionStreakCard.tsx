import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flame, Trophy, Clock } from 'lucide-react';
import { useWorkoutStore } from '../../../stores/useWorkoutStore';
import { useBwWorkoutStore } from '../../../stores/useBwWorkoutStore';
import { useCardioStore } from '../../../stores/useCardioStore';

/**
 * YYYY-MM-DD key from a Date's LOCAL components (not UTC).
 * toISOString() would bucket a late-night session at e.g. UTC+3 onto the
 * previous UTC day and silently break the streak. Always bucket days locally.
 */
function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

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

/** Count consecutive days with ≥1 session ending today or yesterday. */
function useStreak(): { days: number; last: string | null } {
  const sessions = useAllSessions();
  return useMemo(() => {
    const first = sessions[0];
    if (!first) return { days: 0, last: null };

    // Collect unique local YYYY-MM-DD date keys
    const days = new Set<string>();
    for (const s of sessions) days.add(localDateKey(new Date(s.date)));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = localDateKey(today);
    const yesterdayDate = new Date(today);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayKey = localDateKey(yesterdayDate);

    // Streak must end today OR yesterday (grace period)
    if (!days.has(todayKey) && !days.has(yesterdayKey)) {
      return { days: 0, last: first.date };
    }

    let streak = 0;
    const cursor = new Date(today);
    // If today has no session but yesterday does, start from yesterday
    if (!days.has(todayKey)) cursor.setDate(cursor.getDate() - 1);
    while (days.has(localDateKey(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return { days: streak, last: first.date };
  }, [sessions]);
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

export function SessionStreakCard() {
  const { t } = useTranslation();
  const { days, last } = useStreak();
  const sessions = useAllSessions();
  const lastSession = sessions[0];

  if (sessions.length === 0) return null;

  return (
    <div className="w-full max-w-md mx-auto card-elevated card-luxury-border rounded-2xl p-3.5 space-y-2.5 animate-fade-in">
      <div className="flex items-center gap-3">
        <div
          className={[
            'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 relative',
            days > 0
              ? 'bg-gradient-to-br from-forge-ember/25 to-forge-ember/5 border border-forge-ember/30'
              : 'bg-white/[0.05] border border-white/[0.06]',
          ].join(' ')}
        >
          <Flame
            size={20}
            className={days > 0 ? 'text-forge-ember drop-shadow-[0_0_8px_rgba(255,122,69,0.6)]' : 'text-forge-muted'}
            strokeWidth={days > 0 ? 2.5 : 1.8}
          />
          {days > 0 && (
            <span className="absolute inset-0 rounded-xl animate-pulse-glow" aria-hidden />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="kpi-lg text-forge-text leading-none">{days}</span>
            <span className="label-cap text-forge-ember">
              {t('sessionStreak.dayStreak', { count: days })}
            </span>
          </div>
          <div className="text-[11px] text-forge-muted font-condensed mt-0.5">
            {days === 0
              ? t('sessionStreak.motivation.start')
              : days < 3
                ? t('sessionStreak.motivation.keepAlive')
                : days < 7
                  ? t('sessionStreak.motivation.onARoll', { count: 7 - days })
                  : t('sessionStreak.motivation.legendary')}
          </div>
        </div>

        {sessions.length > 0 && (
          <div className="text-right shrink-0">
            <div className="kpi-md text-forge-green leading-none">{sessions.length}</div>
            <div className="label-cap text-[9px] mt-0.5">{t('sessionStreak.total')}</div>
          </div>
        )}
      </div>

      {lastSession && last && (
        <div className="flex items-center gap-2 bg-black/25 rounded-xl px-3 py-2">
          <Trophy size={12} className="text-forge-green shrink-0" />
          <span className="text-forge-text text-[12px] font-condensed truncate flex-1">
            {t('sessionStreak.last')} <span className="text-forge-green capitalize">{lastSession.name}</span>
          </span>
          <span className="text-forge-muted text-[10px] font-mono inline-flex items-center gap-1 shrink-0">
            <Clock size={10} /> {humanAgo(last, t)}
          </span>
        </div>
      )}
    </div>
  );
}
