import { type ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-forge-green text-forge-bg font-semibold hover:brightness-110 active:brightness-90',
  secondary: 'bg-forge-surface text-forge-text border border-forge-border hover:bg-forge-border',
  ghost: 'bg-transparent text-forge-muted hover:text-forge-text hover:bg-forge-surface',
  danger: 'bg-red-600 text-white font-semibold hover:bg-red-700',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-md',
  md: 'px-5 py-2.5 text-base rounded-lg',
  lg: 'px-8 py-3 text-lg rounded-lg',
};

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`font-condensed transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
