import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label htmlFor={inputId} className="text-forge-dim text-xs font-condensed uppercase tracking-wider">{label}</label>}
        <input
          ref={ref}
          id={inputId}
          className={`bg-[#0a0d0b] border border-[rgba(255,255,255,0.06)] rounded-xl px-3.5 py-3 text-forge-text text-sm font-body min-h-[44px] placeholder:text-forge-muted/40 focus:outline-none focus:border-forge-green/40 focus:shadow-[0_0_0_3px_rgba(46,204,113,0.12),0_0_20px_rgba(46,204,113,0.06)] transition-all duration-200 ${error ? 'border-red-500/50' : ''} ${className}`}
          {...props}
        />
        {error && <span className="text-red-400 text-xs">{error}</span>}
      </div>
    );
  },
);

Input.displayName = 'Input';
