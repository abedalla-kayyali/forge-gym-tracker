import { useState, useCallback } from 'react';
import { Plus, Copy, X } from 'lucide-react';
import { useGhostSets } from '../hooks/useGhostSets';
import type { WorkoutSet } from '../../../types/workout';

interface Props {
  exerciseName: string;
  sets: WorkoutSet[];
  onAddSet: (set: WorkoutSet) => void;
  onRemoveSet: (index: number) => void;
}

export function SetLogger({ exerciseName, sets, onAddSet, onRemoveSet }: Props) {
  const ghostSets = useGhostSets(exerciseName);
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');

  const handleAdd = useCallback(() => {
    const r = parseInt(reps, 10);
    const w = parseFloat(weight);
    if (isNaN(r) || r <= 0 || isNaN(w) || w < 0) return;
    onAddSet({ reps: r, weight: w });
    setReps('');
    setWeight('');
  }, [reps, weight, onAddSet]);

  const handleDitto = useCallback(() => {
    const lastSet = sets[sets.length - 1];
    if (lastSet) {
      onAddSet({ reps: lastSet.reps, weight: lastSet.weight, rpe: lastSet.rpe });
    } else if (ghostSets.length > 0) {
      const ghost = ghostSets[0];
      if (ghost) onAddSet({ reps: ghost.reps, weight: ghost.weight, rpe: ghost.rpe });
    }
  }, [sets, ghostSets, onAddSet]);

  return (
    <div className="space-y-3">
      {/* Ghost sets hint */}
      {sets.length === 0 && ghostSets.length > 0 && (
        <div className="card-elevated rounded-xl px-3.5 py-2.5 border border-forge-green/10">
          <div className="text-forge-dim text-xs font-condensed uppercase tracking-wider mb-1">Last time</div>
          <div className="flex flex-wrap gap-2">
            {ghostSets.map((g, i) => (
              <span key={i} className="text-forge-green/70 text-xs font-mono bg-forge-green/5 px-2 py-0.5 rounded-lg">
                {g.reps} x {g.weight}kg
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Logged sets */}
      {sets.length > 0 && (
        <div className="space-y-1.5">
          <div className="grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 text-forge-dim text-[10px] font-condensed uppercase tracking-wider px-1">
            <span>#</span><span>Reps</span><span>Weight</span><span></span>
          </div>
          {sets.map((s, i) => (
            <div key={i} className="grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 items-center card-elevated rounded-xl px-3 py-2.5 text-sm">
              <span className="text-forge-dim font-mono text-xs">{i + 1}</span>
              <span className="text-forge-text font-mono">{s.reps}</span>
              <span className="text-forge-text font-mono">{s.weight}</span>
              <button onClick={() => onRemoveSet(i)} className="text-forge-dim hover:text-red-400 cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors duration-150" aria-label="Remove set">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex gap-2">
        <input type="number" inputMode="numeric" placeholder="Reps" value={reps} onChange={(e) => setReps(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="flex-1 bg-[#0a0d0b] border border-[rgba(255,255,255,0.06)] rounded-xl px-3.5 py-3 text-forge-text text-sm font-mono min-h-[44px] placeholder:text-forge-muted/40 focus:outline-none focus:border-forge-green/40 focus:shadow-[0_0_0_3px_rgba(46,204,113,0.12)] transition-all duration-200" />
        <input type="number" inputMode="decimal" placeholder="Weight" value={weight} onChange={(e) => setWeight(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="flex-1 bg-[#0a0d0b] border border-[rgba(255,255,255,0.06)] rounded-xl px-3.5 py-3 text-forge-text text-sm font-mono min-h-[44px] placeholder:text-forge-muted/40 focus:outline-none focus:border-forge-green/40 focus:shadow-[0_0_0_3px_rgba(46,204,113,0.12)] transition-all duration-200" />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button onClick={handleAdd} disabled={!reps || !weight}
          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-br from-forge-green to-forge-green-dark text-forge-bg py-3 rounded-xl font-condensed font-semibold text-sm cursor-pointer press-scale min-h-[44px] shadow-[0_4px_16px_rgba(46,204,113,0.25)] disabled:opacity-40 disabled:pointer-events-none transition-all duration-200">
          <Plus size={16} /><span>Add Set</span>
        </button>
        <button onClick={handleDitto} disabled={sets.length === 0 && ghostSets.length === 0}
          className="flex items-center justify-center gap-2 card-elevated text-forge-muted px-5 py-3 rounded-xl font-condensed text-sm cursor-pointer press-scale min-h-[44px] hover:text-forge-text disabled:opacity-40 disabled:pointer-events-none transition-all duration-200">
          <Copy size={14} /><span>Ditto</span>
        </button>
      </div>
    </div>
  );
}
