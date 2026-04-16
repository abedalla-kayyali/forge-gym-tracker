import { useGamificationStore } from '../../../stores/useGamificationStore';
import { Card } from '../../../components/ui/Card';

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
        <Card key={a.id} className="flex items-center gap-3 py-2 px-3">
          <span className="text-xl">🏆</span>
          <div>
            <div className="text-forge-text text-sm font-body">{a.name}</div>
            {a.description && <div className="text-forge-muted text-xs">{a.description}</div>}
            {a.unlocked_date && (
              <div className="text-forge-muted/50 text-[10px] font-mono mt-0.5">
                {new Date(a.unlocked_date).toLocaleDateString()}
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
