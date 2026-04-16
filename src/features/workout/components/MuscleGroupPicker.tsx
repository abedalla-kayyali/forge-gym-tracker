import type { MuscleGroup } from '../../../types/workout';

interface Props {
  selected: MuscleGroup | null;
  onSelect: (muscle: MuscleGroup) => void;
}

const MUSCLE_GROUPS: { key: MuscleGroup; label: string; icon: string }[] = [
  { key: 'chest', label: 'Chest', icon: '🫁' },
  { key: 'back', label: 'Back', icon: '🔙' },
  { key: 'shoulders', label: 'Shoulders', icon: '🪨' },
  { key: 'biceps', label: 'Biceps', icon: '💪' },
  { key: 'triceps', label: 'Triceps', icon: '🦾' },
  { key: 'forearms', label: 'Forearms', icon: '✊' },
  { key: 'core', label: 'Core', icon: '🎯' },
  { key: 'legs', label: 'Legs', icon: '🦵' },
  { key: 'glutes', label: 'Glutes', icon: '🍑' },
  { key: 'calves', label: 'Calves', icon: '🦿' },
];

export function MuscleGroupPicker({ selected, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {MUSCLE_GROUPS.map((m) => (
        <button
          key={m.key}
          onClick={() => onSelect(m.key)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-condensed transition-all ${
            selected === m.key
              ? 'bg-forge-green text-forge-bg font-semibold'
              : 'bg-forge-surface text-forge-muted border border-forge-border hover:text-forge-text hover:border-forge-green/50'
          }`}
        >
          <span className="text-xs">{m.icon}</span>
          <span>{m.label}</span>
        </button>
      ))}
    </div>
  );
}
