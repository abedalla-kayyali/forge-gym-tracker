import { Footprints } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStepsStore } from '../../../stores/useStepsStore';
import { useToast } from '../../../components/ui/Toast';

const QUICK_ADD = [1000, 2500, 5000, 10000];

export function StepsPanel() {
  const { t } = useTranslation();
  const { addSteps, getTodaySteps, getTodayProgress, goal } = useStepsStore();
  const { toast } = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const steps = getTodaySteps();
  const progress = getTodayProgress();

  const handleAdd = (count: number) => {
    addSteps(today, count);
    toast(t('steps.added', { count, value: count.toLocaleString() }), 'success');
  };

  return (
    <div className="card-elevated space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-forge-green to-forge-green-dark flex items-center justify-center shadow-[0_2px_8px_rgba(46,204,113,0.3)]">
            <Footprints size={14} className="text-forge-bg" />
          </div>
          <span className="text-forge-muted text-xs font-condensed uppercase">{t('steps.title')}</span>
        </div>
        <span className="text-forge-dim text-xs font-mono">{t('steps.goal', { value: goal.toLocaleString() })}</span>
      </div>
      <div className="text-center">
        <div
          className="text-forge-green text-3xl font-display"
          style={{ textShadow: '0 0 20px rgba(46,204,113,0.5)' }}
        >
          {steps.toLocaleString()}
        </div>
        <div className="h-2 bg-forge-border rounded-full overflow-hidden mt-2">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(progress, 100)}%`,
              background: 'linear-gradient(90deg, #2ecc71, #27ae60)',
              boxShadow: progress > 0 ? '0 0 8px rgba(46,204,113,0.6)' : 'none',
            }}
          />
        </div>
        <span className="text-forge-dim text-xs font-mono mt-1 inline-block">{progress}%</span>
      </div>
      <div className="flex gap-2">
        {QUICK_ADD.map((n) => (
          <button
            key={n}
            onClick={() => handleAdd(n)}
            className="card-elevated flex-1 min-h-[44px] flex items-center justify-center border border-forge-border rounded-lg text-forge-text text-xs font-mono hover:border-forge-green/50 cursor-pointer press-scale transition-colors"
          >
            +{n >= 1000 ? `${n / 1000}k` : n}
          </button>
        ))}
      </div>
    </div>
  );
}
