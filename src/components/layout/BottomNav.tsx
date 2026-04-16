import { NavLink } from 'react-router';
import { useTranslation } from 'react-i18next';
import { PenLine, LayoutGrid, Brain, Activity, Settings } from 'lucide-react';

interface NavItem {
  path: string;
  labelKey: string;
  Icon: typeof PenLine;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/log', labelKey: 'nav.log', Icon: PenLine },
  { path: '/dashboard', labelKey: 'nav.dashboard', Icon: LayoutGrid },
  { path: '/coach', labelKey: 'nav.coach', Icon: Brain },
  { path: '/body', labelKey: 'nav.body', Icon: Activity },
  { path: '/settings', labelKey: 'nav.settings', Icon: Settings },
];

export function BottomNav() {
  const { t } = useTranslation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-[#0a0d0b] to-forge-bg border-t border-forge-border-light safe-area-bottom"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1.5 min-w-[44px] min-h-[44px] justify-center cursor-pointer transition-all duration-200 ${
                isActive ? 'text-forge-green' : 'text-forge-dim hover:text-forge-muted'
              }`
            }
            aria-label={t(item.labelKey)}
          >
            {({ isActive }) => (
              <>
                <item.Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className="text-[10px] font-condensed font-semibold">{t(item.labelKey)}</span>
                {isActive && (
                  <div className="w-1 h-1 rounded-full bg-forge-green glow-dot" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
