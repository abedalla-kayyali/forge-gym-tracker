import { Timer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTimer } from '../../../hooks/useTimer';

const PRESETS = [60, 90, 120, 180];

export function RestTimer() {
  const { t } = useTranslation();
  const { restRemaining, restTotal, restActive, startRest, cancelRest, setRestPreset } = useTimer();

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = restTotal > 0 && restActive ? ((restTotal - restRemaining) / restTotal) * 100 : 0;

  return (
    <div className="card-elevated rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer size={14} className="text-forge-dim" />
          <span className="text-forge-dim text-xs font-condensed uppercase tracking-wider">{t('restTimer.title')}</span>
        </div>
        {restActive && (
          <button onClick={cancelRest} className="text-forge-dim text-xs hover:text-red-400 cursor-pointer transition-colors duration-150">{t('common.cancel')}</button>
        )}
      </div>

      {restActive ? (
        <div className="space-y-2">
          <div className="text-forge-green text-4xl font-mono text-center font-bold" style={{ textShadow: '0 0 20px rgba(46,204,113,0.3)' }}>
            {formatTime(restRemaining)}
          </div>
          <div className="h-1.5 bg-[rgba(255,255,255,0.04)] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-forge-green to-forge-green-light rounded-full transition-all duration-1000" style={{ width: `${progress}%`, boxShadow: '0 0 12px rgba(46,204,113,0.4)' }} />
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          {PRESETS.map((seconds) => (
            <button key={seconds} onClick={() => { setRestPreset(seconds); startRest(); }}
              className="flex-1 card-elevated py-2.5 rounded-xl text-forge-text text-sm font-mono cursor-pointer press-scale hover:text-forge-green transition-all duration-200 min-h-[44px]">
              {formatTime(seconds)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
