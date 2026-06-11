import { Dumbbell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCoachState } from '../hooks/useCoachState';
import { useCoachTriggers } from '../hooks/useCoachTriggers';
import { Badge } from '../../../components/ui/Badge';

export function CoachPanel() {
  const { t } = useTranslation();
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
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-forge-green/20 to-forge-green/5 flex items-center justify-center border border-forge-green/10 flex-shrink-0">
          <Dumbbell size={20} className="text-forge-green" />
        </div>
        <div className="card-elevated flex-1 rounded-xl px-3 py-2">
          <div className="text-forge-green font-condensed font-semibold text-xs">{t('coachPanel.buddyName')}</div>
          <div className="text-forge-text text-sm mt-1">
            {state.totalWorkouts7d === 0
              ? t('coachPanel.greetingReturn')
              : state.streak >= 3
                ? t('coachPanel.greetingStreak', { count: state.streak })
                : t('coachPanel.greetingWeek', { count: state.totalWorkouts7d })}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="card-elevated text-center py-3 rounded-xl">
          <div
            className="text-forge-green text-xl font-display"
            style={{ textShadow: '0 0 12px rgba(46,204,113,0.4)' }}
          >
            {state.totalWorkouts7d}
          </div>
          <div className="text-forge-dim text-[10px] font-condensed">{t('coachPanel.statThisWeek')}</div>
        </div>
        <div className="card-elevated text-center py-3 rounded-xl">
          <div
            className="text-forge-green text-xl font-display"
            style={{ textShadow: '0 0 12px rgba(46,204,113,0.4)' }}
          >
            {state.totalWorkouts30d}
          </div>
          <div className="text-forge-dim text-[10px] font-condensed">{t('coachPanel.statThisMonth')}</div>
        </div>
        <div className="card-elevated text-center py-3 rounded-xl">
          <div
            className="text-forge-green text-xl font-display"
            style={{ textShadow: '0 0 12px rgba(46,204,113,0.4)' }}
          >
            {state.streak}
          </div>
          <div className="text-forge-dim text-[10px] font-condensed">{t('sessionStreak.dayStreak', { count: state.streak })}</div>
        </div>
      </div>

      {/* Triggers/Alerts */}
      {triggers.length > 0 && (
        <div className="stagger-grid space-y-2">
          <h3 className="text-forge-muted text-xs font-condensed uppercase">{t('coachPanel.insights')}</h3>
          {triggers.map((trigger, i) => (
            <div key={i} className={`border rounded-lg px-3 py-2 ${severityStyles[trigger.severity]}`}>
              <div className="flex items-center gap-2">
                <Badge variant={severityBadge[trigger.severity]}>
                  {t('coachPanel.triggerType.' + trigger.type)}
                </Badge>
                <span className="text-forge-text text-sm">{trigger.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Muscle Recovery Grid */}
      <div className="space-y-2">
        <h3 className="text-forge-muted text-xs font-condensed uppercase">{t('coachPanel.muscleRecovery')}</h3>
        <div className="grid grid-cols-2 gap-2">
          {state.muscleRecovery.map((m) => {
            const statusColor = {
              fresh: 'text-forge-green',
              recovering: 'text-yellow-400',
              ready: 'text-forge-text',
              overdue: 'text-red-400',
            }[m.status];

            return (
              <div key={m.muscle} className="card-elevated py-2 px-3 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-forge-text text-sm font-body capitalize">{t('muscles.' + String(m.muscle).toLowerCase())}</span>
                  <span className={`text-[10px] font-condensed font-semibold uppercase ${statusColor}`}>
                    {t('coachPanel.status.' + m.status)}
                  </span>
                </div>
                <div className="text-forge-dim text-[10px] mt-0.5">
                  {m.daysSince < 999
                    ? t('coachPanel.recoveryDetail', { days: m.daysSince, sets: m.totalSets7d })
                    : t('coachPanel.notTrainedYet')}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
