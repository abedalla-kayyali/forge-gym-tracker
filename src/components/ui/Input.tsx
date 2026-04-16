import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1">
        {label && <label htmlFor={inputId} className="text-forge-muted text-sm font-condensed">{label}</label>}
        <input
          ref={ref}
          id={inputId}
          className={`bg-forge-bg border border-forge-border rounded-lg px-3 py-2 text-forge-text text-sm font-body placeholder:text-forge-muted/50 focus:outline-none focus:border-forge-green transition-colors ${error ? 'border-red-500' : ''} ${className}`}
          {...props}
        />
        {error && <span className="text-red-400 text-xs">{error}</span>}
      </div>
    );
  },
);

Input.displayName = 'Input';
