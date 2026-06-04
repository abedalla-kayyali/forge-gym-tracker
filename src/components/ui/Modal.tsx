import { useEffect, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useFX } from '../../hooks/useFX';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
};

export function Modal({ open, onClose, title, subtitle, children, size = 'md' }: ModalProps) {
  const { play } = useFX();
  const handleClose = useCallback(() => { play('tap'); onClose(); }, [onClose, play]);
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    },
    [handleClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Dimmed, blurred luxury backdrop */}
      <div className="absolute inset-0 bg-black/65 backdrop-blur-xl animate-fade-in" />

      {/* Modal surface with sheen + luxury border */}
      <div
        className={[
          'relative w-full max-h-[92dvh] overflow-y-auto animate-scale-in',
          'card-elevated card-luxury-border',
          'rounded-t-3xl sm:rounded-3xl',
          sizeClasses[size],
          'shadow-[var(--shadow-modal)]',
        ].join(' ')}
      >
        {/* Drag handle for bottom-sheet feel on mobile */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <span className="block h-1.5 w-10 rounded-full bg-white/15" />
        </div>

        {title && (
          <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-forge-border-light">
            <div className="min-w-0">
              <h2 className="text-forge-text font-display text-xl tracking-wide truncate">{title}</h2>
              {subtitle && (
                <p className="label-cap mt-0.5">{subtitle}</p>
              )}
            </div>
            <button
              onClick={handleClose}
              className="tap flex items-center justify-center rounded-full text-forge-muted hover:text-forge-text hover:bg-white/5 transition-all duration-200 cursor-pointer press-scale -mr-2"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
