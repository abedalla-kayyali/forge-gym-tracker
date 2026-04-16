import type { MuscleGroup } from '../../../types/workout';

interface Props {
  selected: MuscleGroup | null;
  onSelect: (muscle: MuscleGroup) => void;
}

const MUSCLE_GROUPS: { key: MuscleGroup; label: string }[] = [
  { key: 'chest', label: 'Chest' },
  { key: 'back', label: 'Back' },
  { key: 'shoulders', label: 'Shoulders' },
  { key: 'biceps', label: 'Biceps' },
  { key: 'triceps', label: 'Triceps' },
  { key: 'forearms', label: 'Forearms' },
  { key: 'core', label: 'Core' },
  { key: 'legs', label: 'Legs' },
  { key: 'glutes', label: 'Glutes' },
  { key: 'calves', label: 'Calves' },
];

export function MuscleGroupPicker({ selected, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {MUSCLE_GROUPS.map((m) => (
        <button
          key={m.key}
          onClick={() => onSelect(m.key)}
          className={`px-3.5 py-2 rounded-xl text-sm font-condensed cursor-pointer press-scale transition-all duration-200 min-h-[40px] ${
            selected === m.key
              ? 'bg-gradient-to-br from-forge-green to-forge-green-dark text-forge-bg font-semibold shadow-[0_2px_12px_rgba(46,204,113,0.25)]'
              : 'card-elevated text-forge-muted hover:text-forge-text'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
