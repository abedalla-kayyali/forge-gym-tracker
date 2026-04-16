import { NavLink } from 'react-router';
import { PenLine, BarChart3, Clock, Brain, MoreHorizontal } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/log', label: 'Log', Icon: PenLine },
  { path: '/stats', label: 'Stats', Icon: BarChart3 },
  { path: '/history', label: 'History', Icon: Clock },
  { path: '/coach', label: 'Coach', Icon: Brain },
  { path: '/more', label: 'More', Icon: MoreHorizontal },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-[#0a0d0b] to-forge-bg border-t border-forge-border-light safe-area-bottom" aria-label="Main navigation">
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-4 py-1.5 min-w-[48px] min-h-[44px] justify-center cursor-pointer transition-all duration-200 ${
                isActive ? 'text-forge-green' : 'text-forge-dim hover:text-forge-muted'
              }`
            }
            aria-label={item.label}
          >
            {({ isActive }) => (
              <>
                <item.Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className="text-[10px] font-condensed font-semibold">{item.label}</span>
                {isActive && <div className="w-1 h-1 rounded-full bg-forge-green glow-dot" />}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
