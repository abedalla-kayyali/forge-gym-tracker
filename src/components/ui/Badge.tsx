import { type ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const badgeStyles: Record<BadgeVariant, string> = {
  default: 'bg-forge-border text-forge-text',
  success: 'bg-forge-green/20 text-forge-green',
  warning: 'bg-yellow-500/20 text-yellow-400',
  danger: 'bg-red-500/20 text-red-400',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-condensed font-semibold ${badgeStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}
