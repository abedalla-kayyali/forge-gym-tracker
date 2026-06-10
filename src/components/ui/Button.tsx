import { type ButtonHTMLAttributes, type MouseEvent } from 'react';
import { createRipple } from '../../lib/fx';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'luxury' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-br from-forge-green via-forge-green to-forge-green-dark text-forge-bg-deep font-semibold ' +
    'shadow-[0_6px_20px_rgba(46,204,113,0.32),0_1px_0_rgba(255,255,255,0.12)_inset] ' +
    'hover:shadow-[0_10px_28px_rgba(46,204,113,0.45),0_1px_0_rgba(255,255,255,0.16)_inset] ' +
    'hover:brightness-110',
  secondary:
    'card-elevated text-forge-text border border-forge-border-light ' +
    'hover:border-forge-green/30 hover:bg-forge-surface-hover',
  ghost:
    'bg-transparent text-forge-text-soft ' +
    'hover:text-forge-text hover:bg-white/5',
  outline:
    'bg-transparent text-forge-green border border-forge-green/40 ' +
    'hover:bg-forge-green/10 hover:border-forge-green/60',
  danger:
    'bg-gradient-to-br from-red-500 to-red-700 text-white font-semibold ' +
    'shadow-[0_6px_20px_rgba(239,68,68,0.28),0_1px_0_rgba(255,255,255,0.12)_inset] ' +
    'hover:brightness-110',
  luxury:
    'bg-gradient-to-br from-forge-gold-light via-forge-gold to-[#8a6f1a] text-forge-bg-deep font-semibold ' +
    'shadow-[0_6px_20px_rgba(212,175,55,0.35),0_1px_0_rgba(255,255,255,0.18)_inset] ' +
    'hover:brightness-110',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-2 text-[13px] rounded-lg min-h-[36px] gap-1.5',
  md: 'px-5 py-2.5 text-[15px] rounded-xl min-h-[44px] gap-2',
  lg: 'px-7 py-3.5 text-[17px] rounded-2xl min-h-[52px] gap-2.5',
  icon: 'p-0 w-11 h-11 min-h-[44px] rounded-full',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className = '',
  children,
  disabled,
  onClick,
  ...props
}: ButtonProps) {
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    // Only ripple on primary + luxury CTAs (not secondary/ghost which feel noisy)
    if ((variant === 'primary' || variant === 'luxury' || variant === 'danger') && !disabled && !loading) {
      createRipple(e.currentTarget, variant === 'luxury' ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.35)');
    }
    onClick?.(e);
  };
  return (
    <button
      className={[
        'relative overflow-hidden isolate',
        'inline-flex items-center justify-center',
        'font-condensed uppercase tracking-wider cursor-pointer',
        'transition-all duration-200 press-scale',
        'disabled:opacity-40 disabled:pointer-events-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge-green',
        fullWidth ? 'w-full' : '',
        variantStyles[variant],
        sizeStyles[size],
        className,
      ].join(' ')}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      onClick={handleClick}
      {...props}
    >
      {loading && (
        <span className="absolute inset-0 z-[1] flex items-center justify-center" aria-hidden>
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </span>
      )}
      {/* display:contents keeps the children as direct flex items (width-preserving),
          while inherited visibility:hidden hides them under the spinner. */}
      <span className={loading ? 'contents invisible' : 'contents'}>{children}</span>
    </button>
  );
}
