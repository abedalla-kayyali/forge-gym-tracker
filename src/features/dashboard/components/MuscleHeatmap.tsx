import { useMemo } from 'react';
import { useNow } from '../../../hooks/useNow';
import { useTranslation } from 'react-i18next';
import { useWorkoutStore } from '../../../stores/useWorkoutStore';
import { BodyMap, MUSCLE_ORDER } from '../../../components/body/BodyMap';
import { toMuscleGroup } from '../../../lib/muscles';
import type { MuscleGroup } from '../../../types/workout';

import { FRESHNESS_COLORS, freshnessOf } from '../../../lib/freshness';

function useMuscleFreshness() {
  const workouts = useWorkoutStore((s) => s.workouts);
  const { t } = useTranslation();

  const now = useNow();
  return useMemo(() => {
    const daysMap: Partial<Record<MuscleGroup, number | null>> = {};
    const tints: Partial<Record<MuscleGroup, string>> = {};
    const values: Partial<Record<MuscleGroup, string>> = {};

    for (const m of MUSCLE_ORDER) {
      const lastSession = workouts
        .filter((w) => w.exercises.some((e) => toMuscleGroup(e.muscle) === m))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      const days = lastSession
        ? Math.floor((now - new Date(lastSession.date).getTime()) / 86400000)
        : null;
      daysMap[m] = days;
      const fresh = freshnessOf(days);
      // Only tint muscles that have been trained — overdue uses the base gray
      if (fresh !== 'overdue') {
        tints[m] = FRESHNESS_COLORS[fresh];
      }
      // Only show badge for muscles with actual training data
      if (days !== null) {
        values[m] = days === 0 ? t('heatmap.today') : days > 9 ? '9+d' : `${days}d`;
      }
    }
    return { daysMap, tints, values };
  }, [workouts, t, now]);
}

export function MuscleHeatmap() {
  const { t } = useTranslation();
  const { tints, values, daysMap } = useMuscleFreshness();

  const topFresh = MUSCLE_ORDER
    .filter((m) => daysMap[m] !== null && daysMap[m]! <= 2)
    .slice(0, 3);

  return (
    <div className="flex flex-col items-center gap-3 py-1">
      <BodyMap tints={tints} values={values} maxWidth={360} />

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10px] font-condensed text-forge-muted">
        <LegendChip color={FRESHNESS_COLORS.sore}       label={t('heatmap.sore')} />
        <LegendChip color={FRESHNESS_COLORS.worked}     label={t('heatmap.worked')} />
        <LegendChip color={FRESHNESS_COLORS.recovering} label={t('heatmap.recovering')} />
        <LegendChip color={FRESHNESS_COLORS.ready}      label={t('heatmap.ready')} />
        <LegendChip color={FRESHNESS_COLORS.overdue}    label={t('heatmap.overdue')} />
      </div>

      {topFresh.length > 0 && (
        <div className="w-full mt-1 card-elevated rounded-xl px-3 py-2">
          <div className="label-cap text-forge-muted mb-1">{t('heatmap.workedRecently')}</div>
          <div className="flex flex-wrap gap-1.5">
            {topFresh.map((m) => (
              <span
                key={m}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-condensed"
                style={{
                  background: 'rgba(46,204,113,0.12)',
                  color: '#58d68d',
                  border: '1px solid rgba(46,204,113,0.25)',
                }}
              >
                {t('muscles.' + String(m).toLowerCase())}
                <span className="text-forge-muted text-[10px]">· {values[m]}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LegendChip({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block w-2 h-2 rounded-full"
        style={{ background: color, boxShadow: `0 0 6px ${color}99` }}
      />
      {label}
    </span>
  );
}
