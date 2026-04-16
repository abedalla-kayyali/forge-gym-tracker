import { useState, useEffect } from 'react';
import { useGamificationStore } from '../../stores/useGamificationStore';
import { useSessionStore } from '../../stores/useSessionStore';
import { useProfileStore } from '../../stores/useProfileStore';

export function Header() {
  const [expanded, setExpanded] = useState(false);
  const profile = useProfileStore((s) => s.profile);
  const session = useSessionStore();
  const { getLevel, experience } = useGamificationStore();
  const level = getLevel();

  return (
    <header className="bg-forge-bg border-b border-forge-border sticky top-0 z-40">
      {/* SLIM STRIP — always visible */}
      <div className="flex items-center justify-between px-4 h-12">
        <div className="flex items-center gap-2">
          <span className="text-forge-green font-display text-xl tracking-wide">FORGE</span>
          <span className="text-forge-muted text-xs font-mono">
            {profile.name ? `// ${profile.name}` : '// Gym OS'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Session timer pill */}
          {session.active && session.startTime !== null && (
            <SessionPill startTime={session.startTime} />
          )}

          {/* Expand/collapse chevron */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-forge-muted hover:text-forge-text transition-colors p-1"
            aria-label={expanded ? 'Collapse header' : 'Expand header'}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </div>

      {/* COLLAPSIBLE ZONE */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-forge-border/50 pt-3">
          {/* XP BAR */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">{getLevelIcon(level.level)}</span>
                <span className="text-forge-green font-condensed font-semibold text-sm">
                  {level.name}
                </span>
              </div>
              <span className="text-forge-muted text-xs font-mono">{experience} XP</span>
            </div>
            <div className="h-1.5 bg-forge-border rounded-full overflow-hidden">
              <div
                className="h-full bg-forge-green rounded-full transition-all duration-500"
                style={{ width: `${level.progress}%` }}
              />
            </div>
          </div>

          {/* MASCOT STRIP */}
          <div className="flex items-start gap-3">
            <span className="text-2xl">💪</span>
            <div className="flex-1 bg-forge-bg rounded-lg px-3 py-2 border border-forge-border/50">
              <div className="text-forge-green font-condensed font-semibold text-xs">
                FORGE BUDDY
              </div>
              <div className="text-forge-text text-sm mt-0.5">
                Every legend starts somewhere.
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function getLevelIcon(level: number): string {
  const icons = ['🏅', '⚙️', '🥉', '🥈', '🥇', '💎', '💠', '🏆'];
  return icons[level - 1] ?? '🏅';
}

function SessionPill({ startTime }: { startTime: number }) {
  const [elapsed, setElapsed] = useState('00:00');

  useEffect(() => {
    const interval = setInterval(() => {
      const secs = Math.floor((Date.now() - startTime) / 1000);
      const m = Math.floor(secs / 60).toString().padStart(2, '0');
      const s = (secs % 60).toString().padStart(2, '0');
      setElapsed(`${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="flex items-center gap-1.5 bg-forge-green/10 border border-forge-green/30 rounded-full px-2.5 py-0.5">
      <div className="w-1.5 h-1.5 rounded-full bg-forge-green animate-pulse" />
      <span className="text-forge-green text-xs font-mono">{elapsed}</span>
    </div>
  );
}
