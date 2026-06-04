import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, ChevronDown } from 'lucide-react';
import { useWorkoutStore } from '../../../stores/useWorkoutStore';
import { Card } from '../../../components/ui/Card';
import { useFX } from '../../../hooks/useFX';
import { formatNumber, formatDate } from '../../../lib/format';
import { ExerciseProgressionCard } from './ExerciseProgressionCard';

export function PRBoard() {
  const { t } = useTranslation();
  const { play } = useFX();
  const workouts = useWorkoutStore((s) => s.workouts);
  const [expanded, setExpanded] = useState<string | null>(null);

  const prs = useMemo(() => {
    const prMap: Record<string, { weight: number; reps: number; date: string }> = {};
    for (const w of workouts) {
      for (const ex of w.exercises) {
        for (const set of ex.sets) {
          if (set.weight <= 0) continue;
          const key = ex.name;
          if (!prMap[key] || set.weight > prMap[key].weight) {
            prMap[key] = { weight: set.weight, reps: set.reps, date: w.date };
          }
        }
      }
    }
    return Object.entries(prMap)
      .map(([exercise, data]) => ({ exercise, ...data }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 10);
  }, [workouts]);

  if (prs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <Trophy size={32} className="text-forge-dim" />
        <p className="text-forge-dim text-sm text-center font-condensed">{t('stats.prBoard.empty')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {prs.map((pr, i) => {
        const isOpen = expanded === pr.exercise;
        return (
          <div key={pr.exercise} className="space-y-1.5">
            <Card padding={false}>
              <button
                type="button"
                onClick={() => { play('tap'); setExpanded(isOpen ? null : pr.exercise); }}
                className="w-full flex items-center gap-3 py-2.5 px-3 min-h-[52px] text-start transition-colors hover:bg-white/[0.03] cursor-pointer"
                aria-expanded={isOpen}
                aria-label={t('stats.prBoard.rowAria', {
                  name: pr.exercise,
                  weight: formatNumber(pr.weight),
                  reps: pr.reps,
                })}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-forge-green/20 to-forge-green/5 flex items-center justify-center text-forge-green text-xs font-display flex-shrink-0">
                  {i === 0 ? <Trophy size={14} /> : i + 1}
                </div>
                <div className="flex-1 min-w-0 text-start">
                  <div className="text-forge-text text-sm font-medium truncate">{pr.exercise}</div>
                  <div className="text-forge-dim text-xs">{formatDate(pr.date)}</div>
                </div>
                <div className="text-end flex-shrink-0">
                  <div
                    className="text-forge-green font-mono text-sm font-bold"
                    style={{ textShadow: '0 0 12px rgba(46,204,113,0.2)' }}
                  >
                    {formatNumber(pr.weight)}{t('log.kgUnit')}
                  </div>
                  <div className="text-forge-dim text-[10px]">{t('stats.prBoard.reps', { count: pr.reps })}</div>
                </div>
                <ChevronDown
                  size={16}
                  className="text-forge-dim shrink-0 transition-transform duration-200"
                  style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}
                  aria-hidden
                />
              </button>
            </Card>
            {isOpen && (
              <ExerciseProgressionCard exercise={pr.exercise} workouts={workouts} />
            )}
          </div>
        );
      })}
    </div>
  );
}
