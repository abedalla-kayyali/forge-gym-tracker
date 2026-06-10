import { NavLink, useLocation } from 'react-router';
import { PenLine, BarChart3, Clock, Users, Brain, MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFX } from '../../hooks/useFX';

const NAV_ITEMS = [
  { path: '/log',     key: 'nav.log',     Icon: PenLine },
  { path: '/stats',   key: 'nav.stats',   Icon: BarChart3 },
  { path: '/history', key: 'nav.history', Icon: Clock },
  { path: '/social',  key: 'nav.social',  Icon: Users },
  { path: '/coach',   key: 'nav.coach',   Icon: Brain },
  { path: '/more',    key: 'nav.more',    Icon: MoreHorizontal },
];

export function BottomNav() {
  const { t } = useTranslation();
  const { play } = useFX();
  const location = useLocation();
  const handleTap = (path: string) => {
    if (location.pathname !== path) play('tap');
  };
  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-[48] pointer-events-none"
    >
      {/* Background fade hides underlying scroll behind the floating pill */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-forge-bg-deep via-forge-bg-deep/85 to-transparent"
      />

      <div className="relative mx-auto max-w-md px-3 pb-2.5 pt-2 safe-area-bottom pointer-events-none">
        <ul className="nav-pill pointer-events-auto flex items-center justify-between gap-0.5 rounded-full px-1.5 py-1.5">
          {NAV_ITEMS.map((item) => {
            const label = t(item.key);
            return (
            <li key={item.path} className="flex-1">
              <NavLink
                to={item.path}
                aria-label={label}
                title={label}
                onClick={() => handleTap(item.path)}
                className={({ isActive }) =>
                  [
                    'group relative flex flex-col items-center justify-center rounded-full cursor-pointer press-scale',
                    'min-h-[44px] px-1.5 py-1.5 transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-br from-forge-green/20 to-forge-green/5 text-forge-green shadow-[0_0_0_1px_rgba(46,204,113,0.28)_inset]'
                      : 'text-forge-muted hover:text-forge-text',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    <item.Icon
                      size={20}
                      strokeWidth={isActive ? 2.4 : 1.8}
                      className={isActive ? 'drop-shadow-[0_0_8px_rgba(46,204,113,0.7)]' : ''}
                    />
                    <span
                      className={[
                        'mt-0.5 block text-[9px] font-condensed uppercase tracking-wider leading-none',
                        isActive ? 'text-forge-green' : 'text-forge-muted',
                      ].join(' ')}
                    >
                      {label}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
