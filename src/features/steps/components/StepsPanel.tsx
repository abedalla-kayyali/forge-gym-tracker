import { useStepsStore } from '../../../stores/useStepsStore';
import { useToast } from '../../../components/ui/Toast';
import { Card } from '../../../components/ui/Card';

const QUICK_ADD = [1000, 2500, 5000, 10000];

export function StepsPanel() {
  const { addSteps, getTodaySteps, getTodayProgress, goal } = useStepsStore();
  const { toast } = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const steps = getTodaySteps();
  const progress = getTodayProgress();

  const handleAdd = (count: number) => {
    addSteps(today, count);
    toast(`+${count.toLocaleString()} steps`, 'success');
  };

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-forge-muted text-xs font-condensed uppercase">Today's Steps</span>
        <span className="text-forge-muted text-xs font-mono">{goal.toLocaleString()} goal</span>
      </div>
      <div className="text-center">
        <div className="text-forge-green text-3xl font-display">{steps.toLocaleString()}</div>
        <div className="h-2 bg-forge-border rounded-full overflow-hidden mt-2">
          <div className="h-full bg-forge-green rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-forge-muted text-xs font-mono mt-1 inline-block">{progress}%</span>
      </div>
      <div className="flex gap-2">
        {QUICK_ADD.map((n) => (
          <button
            key={n}
            onClick={() => handleAdd(n)}
            className="flex-1 bg-forge-bg border border-forge-border rounded-lg py-2 text-forge-text text-xs font-mono hover:border-forge-green/50"
          >
            +{n >= 1000 ? `${n / 1000}k` : n}
          </button>
        ))}
      </div>
    </Card>
  );
}
