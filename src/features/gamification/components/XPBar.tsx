import { useGamificationStore } from '../../../stores/useGamificationStore';

export function XPBar() {
  const { experience, getLevel } = useGamificationStore();
  const level = getLevel();

  const icons = ['🏅', '⚙️', '🥉', '🥈', '🥇', '💎', '💠', '🏆'];
  const icon = icons[level.level - 1] ?? '🏅';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span className="text-forge-green font-condensed font-semibold text-sm">{level.name}</span>
        </div>
        <span className="text-forge-muted text-xs font-mono">{experience} XP</span>
      </div>
      <div className="h-2 bg-forge-border rounded-full overflow-hidden">
        <div className="h-full bg-forge-green rounded-full transition-all duration-500" style={{ width: `${level.progress}%` }} />
      </div>
    </div>
  );
}
