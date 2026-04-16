import { useTimer } from '../../../hooks/useTimer';

const PRESETS = [60, 90, 120, 180];

export function RestTimer() {
  const { restRemaining, restTotal, restActive, startRest, cancelRest, setRestPreset } = useTimer();

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = restTotal > 0 && restActive
    ? ((restTotal - restRemaining) / restTotal) * 100
    : 0;

  return (
    <div className="bg-forge-surface border border-forge-border rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-forge-muted text-xs font-condensed">REST TIMER</span>
        {restActive && (
          <button onClick={cancelRest} className="text-forge-muted text-xs hover:text-red-400">
            Cancel
          </button>
        )}
      </div>

      {restActive ? (
        <div className="space-y-2">
          <div className="text-forge-green text-3xl font-mono text-center font-bold">
            {formatTime(restRemaining)}
          </div>
          <div className="h-1 bg-forge-border rounded-full overflow-hidden">
            <div
              className="h-full bg-forge-green rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          {PRESETS.map((seconds) => (
            <button
              key={seconds}
              onClick={() => { setRestPreset(seconds); startRest(); }}
              className="flex-1 bg-forge-bg border border-forge-border rounded-lg py-2 text-forge-text text-sm font-mono hover:border-forge-green/50 transition-colors"
            >
              {formatTime(seconds)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
