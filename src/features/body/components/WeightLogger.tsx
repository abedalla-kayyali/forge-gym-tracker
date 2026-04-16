import { useState, useMemo } from 'react';
import { useBodyStore } from '../../../stores/useBodyStore';
import { useToast } from '../../../components/ui/Toast';
import { useFX } from '../../../hooks/useFX';

export function WeightLogger() {
  const { bodyWeight, addWeightEntry } = useBodyStore();
  const { toast } = useToast();
  const { play } = useFX();
  const [weight, setWeight] = useState('');

  const recent = useMemo(() => {
    return [...bodyWeight]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [bodyWeight]);

  const handleSave = () => {
    const w = parseFloat(weight);
    if (isNaN(w) || w <= 0) {
      toast('Enter a valid weight', 'error');
      return;
    }
    addWeightEntry({ date: new Date().toISOString(), weight_kg: w });
    play('save');
    toast(`Weight logged: ${w} kg`, 'success');
    setWeight('');
  };

  return (
    <div className="space-y-4">
      {/* Input */}
      <div className="flex gap-2">
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          placeholder="Weight (kg)"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          className="flex-1 bg-forge-surface border border-forge-border rounded-lg px-3 py-2.5 text-forge-text text-sm font-mono placeholder:text-forge-muted/50 focus:outline-none focus:border-forge-green focus:shadow-[0_0_0_2px_rgba(46,204,113,0.15)] transition-all"
        />
        <button
          onClick={handleSave}
          disabled={!weight}
          className="bg-forge-green text-forge-bg px-5 min-h-[44px] rounded-lg font-condensed font-semibold text-sm disabled:opacity-40 cursor-pointer press-scale"
        >
          Log
        </button>
      </div>

      {/* Recent entries */}
      {recent.length > 0 && (
        <div className="space-y-1">
          {recent.map((e, i) => (
            <div key={i} className="card-elevated flex items-center justify-between py-2 px-3 rounded-xl">
              <span className="text-forge-dim text-xs">
                {new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="text-forge-green font-mono text-sm font-bold">{e.weight_kg} kg</span>
            </div>
          ))}
        </div>
      )}

      {recent.length === 0 && (
        <p className="text-forge-muted text-sm text-center py-4 font-condensed">No weight entries yet</p>
      )}
    </div>
  );
}
