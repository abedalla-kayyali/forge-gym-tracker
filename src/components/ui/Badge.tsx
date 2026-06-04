import { type ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'gold' | 'sapphire' | 'ember';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

const badgeStyles: Record<BadgeVariant, string> = {
  default: 'bg-white/[0.04] text-forge-text border border-white/[0.08]',
  success: 'bg-forge-green/12 text-forge-green border border-forge-green/25 shadow-[0_0_12px_rgba(46,204,113,0.15)]',
  warning: 'bg-forge-warn/10 text-forge-warn border border-forge-warn/25',
  danger:  'bg-forge-danger/10 text-forge-danger border border-forge-danger/25',
  gold:    'bg-forge-gold/12 text-forge-gold border border-forge-gold/30 shadow-[0_0_12px_rgba(212,175,55,0.2)]',
  sapphire:'bg-forge-sapphire/12 text-forge-sapphire border border-forge-sapphire/25',
  ember:   'bg-forge-ember/12 text-forge-ember border border-forge-ember/25',
};

const dotStyles: Record<BadgeVariant, string> = {
  default: 'bg-forge-muted',
  success: 'bg-forge-green glow-dot',
  warning: 'bg-forge-warn',
  danger:  'bg-forge-danger',
  gold:    'bg-forge-gold glow-dot-gold',
  sapphire:'bg-forge-sapphire',
  ember:   'bg-forge-ember',
};

export function Badge({ children, variant = 'default', className = '', dot = false }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full',
        'text-[11px] font-condensed font-semibold uppercase tracking-wider',
        badgeStyles[variant],
        className,
      ].join(' ')}
    >
      {dot && <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotStyles[variant]}`} />}
      {children}
    </span>
  );
}
