import { NavLink } from 'react-router';
import { useTranslation } from 'react-i18next';
import { PenLine, BarChart3, Clock, Users, Brain, UtensilsCrossed, MoreHorizontal } from 'lucide-react';

interface NavItem {
  path: string;
  labelKey: string;
  label: string;
  Icon: typeof PenLine;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/log', labelKey: 'nav.log', label: 'Log', Icon: PenLine },
  { path: '/stats', labelKey: 'nav.stats', label: 'Stats', Icon: BarChart3 },
  { path: '/history', labelKey: 'nav.history', label: 'History', Icon: Clock },
  { path: '/social', labelKey: 'nav.social', label: 'Social', Icon: Users },
  { path: '/coach', labelKey: 'nav.coach', label: 'Coach', Icon: Brain },
  { path: '/nutrition', labelKey: 'nav.nutrition', label: 'Nutrition', Icon: UtensilsCrossed },
  { path: '/more', labelKey: 'nav.more', label: 'More', Icon: MoreHorizontal },
];

export function BottomNav() {
  useTranslation();

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
              `flex flex-col items-center gap-0.5 px-1.5 py-1 min-w-[40px] min-h-[44px] justify-center cursor-pointer transition-all duration-200 ${
                isActive ? 'text-forge-green' : 'text-forge-dim hover:text-forge-muted'
              }`
            }
            aria-label={item.label}
          >
            {({ isActive }) => (
              <>
                <item.Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className="text-[9px] font-condensed font-semibold">{item.label}</span>
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
