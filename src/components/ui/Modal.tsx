import { useEffect, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in" />
      <div className="relative w-full sm:max-w-md max-h-[90vh] overflow-y-auto animate-scale-in card-elevated rounded-t-2xl sm:rounded-2xl">
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-forge-border-light">
            <h2 className="text-forge-text font-condensed font-semibold text-lg">{title}</h2>
            <button
              onClick={onClose}
              className="text-forge-muted hover:text-forge-text transition-colors duration-150 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2"
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
