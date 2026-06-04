import { Dumbbell, Scaling, HeartPulse } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type WorkoutType = 'weighted' | 'bodyweight' | 'cardio';

interface Props {
  value: WorkoutType;
  onChange: (type: WorkoutType) => void;
}

const TYPES: { key: WorkoutType; labelKey: string; Icon: typeof Dumbbell }[] = [
  { key: 'weighted', labelKey: 'workoutType.weighted', Icon: Dumbbell },
  { key: 'bodyweight', labelKey: 'workoutType.bodyweight', Icon: Scaling },
  { key: 'cardio', labelKey: 'workoutType.cardio', Icon: HeartPulse },
];

export function WorkoutTypeSelector({ value, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex gap-2">
      {TYPES.map((type) => (
        <button
          key={type.key}
          onClick={() => onChange(type.key)}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-condensed font-semibold text-sm cursor-pointer press-scale transition-all duration-200 min-h-[44px] ${
            value === type.key
              ? 'bg-gradient-to-br from-forge-green to-forge-green-dark text-forge-bg shadow-[0_4px_16px_rgba(46,204,113,0.25)]'
              : 'card-elevated text-forge-muted hover:text-forge-text'
          }`}
        >
          <type.Icon size={16} />
          <span>{t(type.labelKey)}</span>
        </button>
      ))}
    </div>
  );
}
