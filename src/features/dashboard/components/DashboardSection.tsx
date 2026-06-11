import { useState, type ReactNode } from 'react';
import { useFX } from '../../../hooks/useFX';

interface Props {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function DashboardSection({ title, children, defaultOpen = true }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const { play } = useFX();

  return (
    <div className="space-y-2">
      <button
        onClick={() => { play('tap'); setOpen(!open); }}
        className="flex items-center justify-between w-full cursor-pointer"
        aria-expanded={open}
      >
        <h3 className="text-forge-muted text-xs font-condensed font-semibold tracking-wider uppercase">
          {title}
        </h3>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`text-forge-muted transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && children}
    </div>
  );
}
