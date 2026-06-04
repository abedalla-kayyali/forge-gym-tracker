import { type ReactNode, type HTMLAttributes } from 'react';

type CardVariant = 'default' | 'hero' | 'glass' | 'luxury' | 'gold';

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  children: ReactNode;
  className?: string;
  padding?: boolean;
  hoverable?: boolean;
  variant?: CardVariant;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'card-elevated',
  hero: 'card-hero',
  glass: 'card-glass',
  luxury: 'card-elevated card-luxury-border',
  gold: 'card-elevated card-luxury-border card-gold-border',
};

export function Card({
  children,
  className = '',
  padding = true,
  hoverable = false,
  variant = 'default',
  ...rest
}: CardProps) {
  return (
    <div
      className={[
        variantStyles[variant],
        'rounded-2xl transition-all duration-300',
        padding ? 'p-4' : '',
        hoverable
          ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] press-scale'
          : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
}
