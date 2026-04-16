import { useState, useCallback } from 'react';
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
      if (ghost) {
        onAddSet({ reps: ghost.reps, weight: ghost.weight, rpe: ghost.rpe });
      }
    }
  }, [sets, ghostSets, onAddSet]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  return (
    <div className="space-y-3">
      {/* Ghost sets hint */}
      {sets.length === 0 && ghostSets.length > 0 && (
        <div className="bg-forge-green/5 border border-forge-green/20 rounded-lg px-3 py-2">
          <div className="text-forge-muted text-xs font-condensed mb-1">Last time:</div>
          <div className="flex flex-wrap gap-2">
            {ghostSets.map((g, i) => (
              <span key={i} className="text-forge-green/70 text-xs font-mono">
                {g.reps}x{g.weight}kg
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Logged sets */}
      {sets.length > 0 && (
        <div className="space-y-1">
          <div className="grid grid-cols-[2rem_1fr_1fr_2rem] gap-2 text-forge-muted text-xs font-condensed px-1">
            <span>#</span>
            <span>Reps</span>
            <span>Weight (kg)</span>
            <span></span>
          </div>
          {sets.map((s, i) => (
            <div
              key={i}
              className="grid grid-cols-[2rem_1fr_1fr_2rem] gap-2 items-center bg-forge-surface rounded-lg px-2 py-2 text-sm"
            >
              <span className="text-forge-muted font-mono text-xs">{i + 1}</span>
              <span className="text-forge-text font-mono">{s.reps}</span>
              <span className="text-forge-text font-mono">{s.weight}</span>
              <button
                onClick={() => onRemoveSet(i)}
                className="text-forge-muted hover:text-red-400 text-xs"
                aria-label="Remove set"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex gap-2">
        <input
          type="number"
          inputMode="numeric"
          placeholder="Reps"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-forge-bg border border-forge-border rounded-lg px-3 py-2.5 text-forge-text text-sm font-mono placeholder:text-forge-muted/50 focus:outline-none focus:border-forge-green"
        />
        <input
          type="number"
          inputMode="decimal"
          placeholder="Weight"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-forge-bg border border-forge-border rounded-lg px-3 py-2.5 text-forge-text text-sm font-mono placeholder:text-forge-muted/50 focus:outline-none focus:border-forge-green"
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleAdd}
          disabled={!reps || !weight}
          className="flex-1 bg-forge-green text-forge-bg py-2.5 rounded-lg font-condensed font-semibold text-sm disabled:opacity-40 disabled:pointer-events-none"
        >
          + Add Set
        </button>
        <button
          onClick={handleDitto}
          disabled={sets.length === 0 && ghostSets.length === 0}
          className="bg-forge-surface text-forge-muted border border-forge-border px-4 py-2.5 rounded-lg font-condensed text-sm hover:text-forge-text disabled:opacity-40 disabled:pointer-events-none"
        >
          Ditto
        </button>
      </div>
    </div>
  );
}
