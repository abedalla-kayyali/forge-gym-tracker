import { useState, useMemo, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
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
    if (query.length > 0) return searchExercises(query, muscle ?? undefined);
    if (muscle) return getExercisesByMuscle(muscle);
    return [];
  }, [query, muscle]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
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
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-forge-dim" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={muscle ? `Search ${muscle} exercises...` : 'Select muscle group first'}
          className="w-full bg-[#0a0d0b] border border-[rgba(255,255,255,0.06)] rounded-xl pl-10 pr-3.5 py-3 text-forge-text text-sm font-body min-h-[44px] placeholder:text-forge-muted/40 focus:outline-none focus:border-forge-green/40 focus:shadow-[0_0_0_3px_rgba(46,204,113,0.12)] transition-all duration-200"
          disabled={!muscle}
        />
      </div>
      {open && results.length > 0 && (
        <div
          ref={listRef}
          className="absolute top-full left-0 right-0 mt-1.5 card-elevated rounded-xl max-h-52 overflow-y-auto z-30"
        >
          {results.map((ex) => (
            <button
              key={ex.name}
              onClick={() => handleSelect(ex)}
              className="w-full text-left px-4 py-2.5 text-sm text-forge-text hover:bg-forge-surface-hover cursor-pointer transition-colors duration-150 flex items-center justify-between first:rounded-t-xl last:rounded-b-xl"
            >
              <span className="font-body">{ex.name}</span>
              <span className="text-forge-dim text-xs font-mono">{ex.equipment}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
