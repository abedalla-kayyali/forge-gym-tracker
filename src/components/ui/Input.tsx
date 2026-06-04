import { type InputHTMLAttributes, type ReactNode, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightSlot, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="label-cap">
            {label}
          </label>
        )}
        <div
          className={[
            'group relative flex items-center gap-2',
            'bg-[#070a0d] border rounded-xl px-3 transition-all duration-200',
            error
              ? 'border-red-500/50 shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
              : 'border-white/[0.06] focus-within:border-forge-green/40 focus-within:shadow-[var(--shadow-input-focus)]',
          ].join(' ')}
        >
          {leftIcon && (
            <span className="text-forge-muted group-focus-within:text-forge-green transition-colors shrink-0">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={[
              'flex-1 bg-transparent py-3 text-forge-text text-[15px] font-body min-h-[44px]',
              'placeholder:text-forge-muted/50 focus:outline-none',
              'num',
              className,
            ].join(' ')}
            {...props}
          />
          {rightSlot && <span className="shrink-0 text-forge-muted">{rightSlot}</span>}
        </div>
        {error ? (
          <span className="text-red-400 text-xs font-condensed">{error}</span>
        ) : hint ? (
          <span className="text-forge-muted text-xs font-condensed">{hint}</span>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';
