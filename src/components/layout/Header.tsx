import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGamificationStore } from '../../stores/useGamificationStore';
import { useSessionStore } from '../../stores/useSessionStore';
import { useProfileStore } from '../../stores/useProfileStore';
import { useFX } from '../../hooks/useFX';
import { ChevronDown, Trophy, Flame, Sparkles } from 'lucide-react';
import { CountUp } from '../ui/CountUp';

export function Header() {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profile = useProfileStore((s) => s.profile);
  const session = useSessionStore();
  const { getLevel, experience } = useGamificationStore();
  const { play } = useFX();
  const level = getLevel();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={[
        'sticky top-0 z-40 safe-area-top transition-all duration-300',
        scrolled
          ? 'bg-forge-bg-deep/85 backdrop-blur-xl backdrop-saturate-150 border-b border-forge-border-light'
          : 'bg-transparent border-b border-transparent',
      ].join(' ')}
    >
      {/* Top strip — logo, streak, session, expand */}
      <div className="flex items-center justify-between px-4 h-14 max-w-md mx-auto">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="brand-mark text-[1.65rem] leading-none tracking-[0.2em]">FORGE</span>
          </div>
          {profile.name && (
            <span className="text-forge-dim text-[11px] font-mono uppercase tracking-[0.18em]">
              · {profile.name.split(' ')[0]}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {session.active && session.startTime !== null && (
            <SessionPill startTime={session.startTime} />
          )}
          <button
            onClick={() => { play('tap'); setExpanded(!expanded); }}
            className="tap flex items-center justify-center rounded-full text-forge-muted hover:text-forge-text hover:bg-white/5 transition-all duration-200 cursor-pointer press-scale"
            aria-label={expanded ? t('header.collapse') : t('header.expand')}
            aria-expanded={expanded}
          >
            <ChevronDown
              size={18}
              className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Expanded zone — level, XP, coach whisper */}
      {expanded && (
        <div className="max-w-md mx-auto px-4 pb-4 pt-2 space-y-3 border-t border-forge-border-light animate-fade-in">
          {/* Level + XP progress */}
          <div className="card-elevated card-luxury-border rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-forge-green to-forge-green-dark flex items-center justify-center shadow-[0_6px_16px_rgba(46,204,113,0.35)]">
                <Trophy size={18} className="text-forge-bg-deep" />
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-forge-gold text-forge-bg-deep text-[9px] font-bold flex items-center justify-center shadow-[0_0_10px_rgba(212,175,55,0.6)]">
                  {Math.min(99, Math.floor(experience / 100))}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-forge-text font-condensed font-semibold text-[15px] tracking-wide truncate">
                    {level.name}
                  </span>
                  <span className="kpi-md text-forge-green shrink-0"><CountUp value={experience} /><span className="text-[10px] text-forge-muted ms-0.5">{t('header.xp')}</span></span>
                </div>
                <div className="mt-1.5 track h-1.5">
                  <div
                    className="track-fill"
                    style={{ width: `${level.progress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="label-cap">{t('header.progress')}</span>
                  <span className="text-[10px] font-mono text-forge-muted">{Math.round(level.progress)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Daily whisper */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-forge-green/25 to-forge-green/5 flex items-center justify-center border border-forge-green/15 shrink-0">
              <Sparkles size={16} className="text-forge-green" />
            </div>
            <div className="flex-1 card-elevated rounded-xl px-3.5 py-2.5">
              <div className="label-cap text-forge-green/90">{t('header.coachTitle')}</div>
              <div className="text-forge-text-soft text-sm mt-0.5 leading-relaxed">
                {t('header.coachWhisper')}
              </div>
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
    <div className="flex items-center gap-1.5 bg-forge-green/12 border border-forge-green/25 rounded-full px-3 py-1.5 shadow-[0_0_12px_rgba(46,204,113,0.2)]">
      <Flame size={12} className="text-forge-green animate-pulse" />
      <span className="text-forge-green text-[11px] font-mono font-semibold tracking-wider">{elapsed}</span>
    </div>
  );
}
