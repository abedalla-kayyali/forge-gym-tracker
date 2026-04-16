import { Dumbbell, Scaling, HeartPulse } from 'lucide-react';

export type WorkoutType = 'weighted' | 'bodyweight' | 'cardio';

interface Props {
  value: WorkoutType;
  onChange: (type: WorkoutType) => void;
}

const TYPES: { key: WorkoutType; label: string; Icon: typeof Dumbbell }[] = [
  { key: 'weighted', label: 'Weighted', Icon: Dumbbell },
  { key: 'bodyweight', label: 'Bodyweight', Icon: Scaling },
  { key: 'cardio', label: 'Cardio', Icon: HeartPulse },
];

export function WorkoutTypeSelector({ value, onChange }: Props) {
  return (
    <div className="flex gap-2">
      {TYPES.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-condensed font-semibold text-sm cursor-pointer press-scale transition-all duration-200 min-h-[44px] ${
            value === t.key
              ? 'bg-gradient-to-br from-forge-green to-forge-green-dark text-forge-bg shadow-[0_4px_16px_rgba(46,204,113,0.25)]'
              : 'card-elevated text-forge-muted hover:text-forge-text'
          }`}
        >
          <t.Icon size={16} />
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  );
}
