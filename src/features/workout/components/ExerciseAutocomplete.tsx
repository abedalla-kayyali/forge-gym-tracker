import { useState, useMemo, useRef, useEffect } from 'react';
import { searchExercises, getExercisesByMuscle, type Exercise } from '../../../lib/exercises-db';

interface Props {
  muscle: string | null;
  value: string;
  onChange: (exerciseName: string) => void;
}

export function ExerciseAutocomplete({ muscle, value, onChange }: Props) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (query.length > 0) {
      return searchExercises(query, muscle ?? undefined);
    }
    if (muscle) {
      return getExercisesByMuscle(muscle);
    }
    return [];
  }, [query, muscle]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        listRef.current &&
        !listRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (exercise: Exercise) => {
    setQuery(exercise.name);
    onChange(exercise.name);
    setOpen(false);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={muscle ? `Search ${muscle} exercises...` : 'Select muscle group first'}
        className="w-full bg-forge-bg border border-forge-border rounded-lg px-3 py-2.5 text-forge-text text-sm font-body placeholder:text-forge-muted/50 focus:outline-none focus:border-forge-green transition-colors"
        disabled={!muscle}
      />
      {open && results.length > 0 && (
        <div
          ref={listRef}
          className="absolute top-full left-0 right-0 mt-1 bg-forge-surface border border-forge-border rounded-lg max-h-48 overflow-y-auto z-30 shadow-xl"
        >
          {results.map((ex) => (
            <button
              key={ex.name}
              onClick={() => handleSelect(ex)}
              className="w-full text-left px-3 py-2 text-sm text-forge-text hover:bg-forge-border/50 transition-colors flex items-center justify-between"
            >
              <span>{ex.name}</span>
              <span className="text-forge-muted text-xs">{ex.equipment}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
