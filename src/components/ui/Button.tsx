import { type ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-gradient-to-br from-forge-green to-forge-green-dark text-forge-bg font-semibold shadow-[0_4px_16px_rgba(46,204,113,0.25)] hover:shadow-[0_6px_24px_rgba(46,204,113,0.35)]',
  secondary: 'card-elevated text-forge-text hover:bg-forge-surface-hover',
  ghost: 'bg-transparent text-forge-muted hover:text-forge-text hover:bg-forge-surface/50',
  danger: 'bg-gradient-to-br from-red-600 to-red-700 text-white font-semibold shadow-[0_4px_16px_rgba(220,38,38,0.2)]',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-sm rounded-lg min-h-[36px]',
  md: 'px-5 py-2.5 text-base rounded-xl min-h-[44px]',
  lg: 'px-8 py-3.5 text-lg rounded-xl min-h-[48px]',
};

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`font-condensed cursor-pointer transition-all duration-200 press-scale disabled:opacity-40 disabled:pointer-events-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
