import { Award } from 'lucide-react';
import { useGamificationStore } from '../../../stores/useGamificationStore';

export function AchievementsList() {
  const achievements = useGamificationStore((s) => s.achievements);

  if (achievements.length === 0) {
    return (
      <div className="text-center py-6 text-forge-muted text-sm font-condensed">
        No achievements unlocked yet. Keep training!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {achievements.map((a) => (
        <div key={a.id} className="card-elevated flex items-center gap-3 py-2 px-3 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-forge-green/20 to-forge-green/5 flex items-center justify-center border border-forge-green/20 flex-shrink-0">
            <Award size={16} className="text-forge-green" />
          </div>
          <div>
            <div className="text-forge-text text-sm font-body">{a.name}</div>
            {a.description && <div className="text-forge-muted text-xs">{a.description}</div>}
            {a.unlocked_date && (
              <div className="text-forge-dim text-[10px] font-mono mt-0.5">
                {new Date(a.unlocked_date).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
