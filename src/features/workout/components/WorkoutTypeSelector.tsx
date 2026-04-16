export type WorkoutType = 'weighted' | 'bodyweight' | 'cardio';

interface Props {
  value: WorkoutType;
  onChange: (type: WorkoutType) => void;
}

const TYPES: { key: WorkoutType; label: string; icon: string }[] = [
  { key: 'weighted', label: 'Weighted', icon: '🏋️' },
  { key: 'bodyweight', label: 'Bodyweight', icon: '💪' },
  { key: 'cardio', label: 'Cardio', icon: '🏃' },
];

export function WorkoutTypeSelector({ value, onChange }: Props) {
  return (
    <div className="flex gap-2">
      {TYPES.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-condensed font-semibold text-sm transition-all ${
            value === t.key
              ? 'bg-forge-green text-forge-bg'
              : 'bg-forge-surface text-forge-muted border border-forge-border hover:text-forge-text'
          }`}
        >
          <span>{t.icon}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  );
}
