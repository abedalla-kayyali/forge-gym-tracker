import { Trophy } from 'lucide-react';
import { useGamificationStore } from '../../../stores/useGamificationStore';

export function XPBar() {
  const { experience, getLevel } = useGamificationStore();
  const level = getLevel();

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-forge-green to-forge-green-dark flex items-center justify-center shadow-[0_2px_8px_rgba(46,204,113,0.3)]">
            <Trophy size={14} className="text-forge-bg" />
          </div>
          <span className="text-forge-green font-condensed font-semibold text-sm">{level.name}</span>
        </div>
        <span className="text-forge-dim text-xs font-mono">{experience} XP</span>
      </div>
      <div className="h-2 bg-forge-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${level.progress}%`,
            background: 'linear-gradient(90deg, #2ecc71, #27ae60)',
            boxShadow: level.progress > 0 ? '0 0 8px rgba(46,204,113,0.6)' : 'none',
          }}
        />
      </div>
    </div>
  );
}
