import { useState, useEffect } from 'react';
import { useGamificationStore } from '../../stores/useGamificationStore';
import { useSessionStore } from '../../stores/useSessionStore';
import { useProfileStore } from '../../stores/useProfileStore';
import { ChevronDown, Trophy, Dumbbell } from 'lucide-react';

export function Header() {
  const [expanded, setExpanded] = useState(false);
  const profile = useProfileStore((s) => s.profile);
  const session = useSessionStore();
  const { getLevel, experience } = useGamificationStore();
  const level = getLevel();

  return (
    <header className="bg-gradient-to-b from-[#0d100e] to-forge-bg border-b border-forge-border-light sticky top-0 z-40">
      {/* SLIM STRIP */}
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2.5">
          <span className="text-forge-green font-display text-2xl tracking-wide">FORGE</span>
          <span className="text-forge-dim text-xs font-mono">
            {profile.name ? `// ${profile.name}` : '// Gym OS'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {session.active && session.startTime !== null && (
            <SessionPill startTime={session.startTime} />
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-forge-muted hover:text-forge-text transition-colors duration-150 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={expanded ? 'Collapse header' : 'Expand header'}
          >
            <ChevronDown
              size={18}
              className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* COLLAPSIBLE ZONE */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-forge-border-light pt-3 animate-fade-in">
          {/* XP BAR */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-forge-green to-forge-green-dark flex items-center justify-center shadow-[0_2px_8px_rgba(46,204,113,0.3)]">
                  <Trophy size={14} className="text-forge-bg" />
                </div>
                <span className="text-forge-green font-condensed font-semibold text-sm">{level.name}</span>
              </div>
              <span className="text-forge-dim text-xs font-mono">{experience} XP</span>
            </div>
            <div className="h-1.5 bg-[rgba(255,255,255,0.04)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-forge-green to-forge-green-light rounded-full transition-all duration-500"
                style={{ width: `${level.progress}%`, boxShadow: '0 0 12px rgba(46,204,113,0.4)' }}
              />
            </div>
          </div>

          {/* MASCOT STRIP */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-forge-green/20 to-forge-green/5 flex items-center justify-center border border-forge-green/10">
              <Dumbbell size={20} className="text-forge-green" />
            </div>
            <div className="flex-1 card-elevated rounded-xl px-3.5 py-2.5">
              <div className="text-forge-green font-condensed font-semibold text-xs tracking-wider">FORGE BUDDY</div>
              <div className="text-forge-text text-sm mt-0.5 leading-relaxed">Every legend starts somewhere.</div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
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
    <div className="flex items-center gap-1.5 bg-forge-green/8 border border-forge-green/20 rounded-full px-3 py-1.5">
      <div className="w-2 h-2 rounded-full bg-forge-green glow-dot animate-pulse" />
      <span className="text-forge-green text-xs font-mono font-medium">{elapsed}</span>
    </div>
  );
}
