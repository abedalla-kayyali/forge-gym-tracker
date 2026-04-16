import { useCoachState } from '../hooks/useCoachState';
import { useCoachTriggers } from '../hooks/useCoachTriggers';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';

export function CoachPanel() {
  const state = useCoachState();
  const triggers = useCoachTriggers();

  const severityStyles = {
    success: 'border-forge-green/30 bg-forge-green/5',
    warning: 'border-yellow-500/30 bg-yellow-500/5',
    info: 'border-forge-border bg-forge-surface',
  };

  const severityBadge = {
    success: 'success' as const,
    warning: 'warning' as const,
    info: 'default' as const,
  };

  return (
    <div className="space-y-4">
      {/* Mascot message */}
      <div className="flex items-start gap-3">
        <span className="text-3xl">💪</span>
        <Card className="flex-1">
          <div className="text-forge-green font-condensed font-semibold text-xs">FORGE BUDDY</div>
          <div className="text-forge-text text-sm mt-1">
            {state.totalWorkouts7d === 0
              ? "Ready to get back in the gym? Let's go!"
              : state.streak >= 3
                ? `${state.streak}-day streak! You're on fire!`
                : `${state.totalWorkouts7d} workouts this week. Keep pushing!`}
          </div>
        </Card>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="text-center py-3">
          <div className="text-forge-green text-xl font-display">{state.totalWorkouts7d}</div>
          <div className="text-forge-muted text-[10px] font-condensed">This Week</div>
        </Card>
        <Card className="text-center py-3">
          <div className="text-forge-green text-xl font-display">{state.totalWorkouts30d}</div>
          <div className="text-forge-muted text-[10px] font-condensed">This Month</div>
        </Card>
        <Card className="text-center py-3">
          <div className="text-forge-green text-xl font-display">{state.streak}</div>
          <div className="text-forge-muted text-[10px] font-condensed">Day Streak</div>
        </Card>
      </div>

      {/* Triggers/Alerts */}
      {triggers.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-forge-muted text-xs font-condensed uppercase">Insights</h3>
          {triggers.map((t, i) => (
            <div key={i} className={`border rounded-lg px-3 py-2 ${severityStyles[t.severity]}`}>
              <div className="flex items-center gap-2">
                <Badge variant={severityBadge[t.severity]}>
                  {t.type}
                </Badge>
                <span className="text-forge-text text-sm">{t.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Muscle Recovery Grid */}
      <div className="space-y-2">
        <h3 className="text-forge-muted text-xs font-condensed uppercase">Muscle Recovery</h3>
        <div className="grid grid-cols-2 gap-2">
          {state.muscleRecovery.map((m) => {
            const statusColor = {
              fresh: 'text-forge-green',
              recovering: 'text-yellow-400',
              ready: 'text-forge-text',
              overdue: 'text-red-400',
            }[m.status];

            return (
              <Card key={m.muscle} className="py-2 px-3">
                <div className="flex items-center justify-between">
                  <span className="text-forge-text text-sm font-body capitalize">{m.muscle}</span>
                  <span className={`text-[10px] font-condensed font-semibold uppercase ${statusColor}`}>
                    {m.status}
                  </span>
                </div>
                <div className="text-forge-muted text-[10px] mt-0.5">
                  {m.daysSince < 999 ? `${m.daysSince}d ago · ${m.totalSets7d} sets/wk` : 'Not trained yet'}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
