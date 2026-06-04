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
        <div className="flex justify-center py-1">
          <RestRing remaining={restRemaining} total={restTotal} label={formatTime(restRemaining)} />
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

/** Circular draining ring — full at start, empties as rest counts down. */
function RestRing({ remaining, total, label }: { remaining: number; total: number; label: string }) {
  const size = 136;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const frac = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
  const offset = C * (1 - frac);
  const low = remaining <= 3;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={low ? '#ff7a45' : 'url(#restGrad)'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1s linear, stroke 0.3s',
            filter: `drop-shadow(0 0 8px ${low ? 'rgba(255,122,69,0.6)' : 'rgba(46,204,113,0.5)'})`,
          }}
        />
        <defs>
          <linearGradient id="restGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2ecc71" />
            <stop offset="100%" stopColor="#27ae60" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={`text-3xl font-mono font-bold ${low ? 'text-forge-ember animate-pulse' : 'text-forge-green'}`}
          style={{ textShadow: '0 0 20px rgba(46,204,113,0.3)' }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
