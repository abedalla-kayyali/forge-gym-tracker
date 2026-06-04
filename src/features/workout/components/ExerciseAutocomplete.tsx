import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Plus, Sparkles, Bookmark } from 'lucide-react';
import { searchExercises, getExercisesByMuscle, type Exercise } from '../../../lib/exercises-db';
import { useCustomExercisesStore } from '../../../stores/useCustomExercisesStore';
import { useFX } from '../../../hooks/useFX';

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
  const customStore = useCustomExercisesStore();
  const { play } = useFX();

  // Keep local query in sync when parent clears the selected exercise
  useEffect(() => { setQuery(value); }, [value]);

  // Library (curated DB) results
  const dbResults: Exercise[] = useMemo(() => {
    if (query.length > 0) return searchExercises(query, muscle ?? undefined);
    if (muscle) return getExercisesByMuscle(muscle);
    return [];
  }, [query, muscle]);

  // User's saved custom exercises for this muscle
  const customNames = useMemo(
    () => (muscle ? customStore.getFor(muscle) : []),
    [muscle, customStore],
  );
  const customResults: Exercise[] = useMemo(() => {
    const q = query.toLowerCase();
    return customNames
      .filter((name) => name.toLowerCase().includes(q))
      .map((name): Exercise => ({ name, muscle: muscle ?? '', equipment: 'custom', tip: '' } as Exercise));
  }, [customNames, query, muscle]);

  const trimmed = query.trim();
  // "Add custom" row appears when input has text, muscle selected, and no exact match exists
  const existsExact = [...dbResults, ...customResults].some(
    (r) => r.name.toLowerCase() === trimmed.toLowerCase(),
  );
  const canAddCustom = !!muscle && trimmed.length >= 2 && !existsExact;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        listRef.current && !listRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
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
    play('tap');
  };

  const handleAddCustom = () => {
    if (!muscle || !canAddCustom) return;
    customStore.addCustom(muscle, trimmed);
    onChange(trimmed);
    setQuery(trimmed);
    setOpen(false);
    play('success');
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-forge-dim" aria-hidden />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canAddCustom) {
              e.preventDefault();
              handleAddCustom();
            } else if (e.key === 'Enter' && dbResults[0]) {
              e.preventDefault();
              handleSelect(dbResults[0]);
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
          placeholder={muscle ? `Search ${muscle} exercises…` : 'Select muscle group first'}
          className={[
            'w-full bg-[#070a0d] border rounded-xl pl-10 pr-12 py-3',
            'text-forge-text text-[15px] font-body min-h-[48px]',
            'placeholder:text-forge-muted/50',
            'focus:outline-none focus:border-forge-green/40 focus:shadow-[var(--shadow-input-focus)]',
            'transition-all duration-200',
            muscle ? 'border-white/[0.06]' : 'border-white/[0.03] opacity-60',
          ].join(' ')}
          disabled={!muscle}
          aria-label="Search or create exercise"
          aria-autocomplete="list"
          aria-expanded={open}
        />
        {canAddCustom && (
          <button
            type="button"
            onClick={handleAddCustom}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 h-9 px-2.5 rounded-lg bg-forge-green/15 text-forge-green border border-forge-green/30 text-[11px] font-condensed uppercase tracking-wider cursor-pointer press-scale hover:bg-forge-green/25 transition-all duration-200"
            aria-label="Add as custom exercise"
          >
            <Plus size={12} /> Add
          </button>
        )}
      </div>

      {open && (dbResults.length > 0 || customResults.length > 0 || canAddCustom) && (
        <div
          ref={listRef}
          className="absolute top-full left-0 right-0 mt-1.5 card-elevated rounded-xl max-h-64 overflow-y-auto z-30 border border-white/[0.06] shadow-[0_18px_44px_rgba(0,0,0,0.55)]"
          role="listbox"
        >
          {canAddCustom && (
            <button
              type="button"
              onClick={handleAddCustom}
              className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 cursor-pointer transition-colors duration-150 border-b border-white/5 bg-gradient-to-r from-forge-green/12 to-transparent hover:from-forge-green/25"
              role="option"
            >
              <Sparkles size={14} className="text-forge-green shrink-0" />
              <span className="flex-1 text-forge-text text-[14px] font-condensed font-semibold truncate">
                Add <span className="text-forge-green">"{trimmed}"</span> as custom
              </span>
              <span className="text-[10px] font-condensed uppercase tracking-wider text-forge-green/80">New</span>
            </button>
          )}

          {customResults.length > 0 && (
            <div className="pt-1 pb-0.5">
              <div className="px-4 py-1 label-cap text-forge-green/80">Your custom</div>
              {customResults.map((ex) => (
                <button
                  key={`custom-${ex.name}`}
                  type="button"
                  onClick={() => handleSelect(ex)}
                  className="w-full text-left px-4 py-2 text-[14px] text-forge-text hover:bg-white/[0.05] cursor-pointer transition-colors duration-150 flex items-center gap-2 min-h-[40px]"
                  role="option"
                >
                  <Bookmark size={13} className="text-forge-gold shrink-0" />
                  <span className="font-body truncate">{ex.name}</span>
                </button>
              ))}
            </div>
          )}

          {dbResults.length > 0 && (
            <div className="pt-1 pb-0.5">
              {customResults.length > 0 && <div className="px-4 py-1 label-cap">Library</div>}
              {dbResults.map((ex) => (
                <button
                  key={ex.name}
                  type="button"
                  onClick={() => handleSelect(ex)}
                  className="w-full text-left px-4 py-2 text-[14px] text-forge-text hover:bg-white/[0.05] cursor-pointer transition-colors duration-150 flex items-center justify-between min-h-[40px]"
                  role="option"
                >
                  <span className="font-body truncate">{ex.name}</span>
                  <span className="text-forge-muted text-[11px] font-mono uppercase tracking-wider">{ex.equipment}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
