import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useFX } from '../../hooks/useFX';
import { prefersReducedMotion } from '../../lib/fx';

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

const EXIT_MS = 200;

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, title, subtitle, children, size = 'md' }: ModalProps) {
  const { play } = useFX();
  const sheetRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  // `shown` keeps the portal mounted during the exit animation.
  const [shown, setShown] = useState(open);
  const [closing, setClosing] = useState(false);

  const handleClose = useCallback(() => { play('tap'); onClose(); }, [onClose, play]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
        return;
      }
      // Focus trap: keep Tab cycling inside the sheet.
      if (e.key === 'Tab') {
        const root = sheetRef.current;
        if (!root) return;
        const focusables = root.querySelectorAll<HTMLElement>(FOCUSABLE);
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!first || !last) {
          e.preventDefault();
          root.focus();
          return;
        }
        const activeEl = document.activeElement;
        if (e.shiftKey) {
          if (activeEl === first || !root.contains(activeEl)) {
            e.preventDefault();
            last.focus();
          }
        } else if (activeEl === last || !root.contains(activeEl)) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [handleClose],
  );

  // Mount/unmount with exit animation (backdrop fade + sheet slide-down).
  useEffect(() => {
    if (open) {
      setShown(true);
      setClosing(false);
      return;
    }
    if (!shown) return;
    if (prefersReducedMotion()) {
      setShown(false);
      return;
    }
    setClosing(true);
    const timer = setTimeout(() => {
      setShown(false);
      setClosing(false);
    }, EXIT_MS);
    return () => clearTimeout(timer);
  }, [open, shown]);

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

  // Initial focus into the sheet on open; restore focus to the opener on close.
  useEffect(() => {
    if (open) {
      restoreFocusRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const id = requestAnimationFrame(() => {
        const root = sheetRef.current;
        if (!root) return;
        const first = root.querySelector<HTMLElement>(FOCUSABLE);
        (first ?? root).focus();
      });
      return () => cancelAnimationFrame(id);
    }
    const restore = restoreFocusRef.current;
    restoreFocusRef.current = null;
    if (restore && document.contains(restore)) restore.focus();
    return;
  }, [open]);

  if (!shown) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Dimmed, blurred luxury backdrop (pointer-events-none so clicks land on
          the wrapper and trigger close-on-backdrop as intended) */}
      <div
        className={`absolute inset-0 bg-black/65 backdrop-blur-xl pointer-events-none ${closing ? 'animate-fade-out' : 'animate-fade-in'}`}
      />

      {/* Modal surface with sheen + luxury border */}
      <div
        ref={sheetRef}
        tabIndex={-1}
        className={[
          'relative w-full max-h-[92dvh] overflow-y-auto',
          closing ? 'animate-sheet-down' : 'animate-scale-in',
          'card-elevated card-luxury-border',
          'rounded-t-3xl sm:rounded-3xl',
          sizeClasses[size],
          'shadow-[var(--shadow-modal)]',
          'focus:outline-none',
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
              className="tap flex items-center justify-center rounded-full text-forge-muted hover:text-forge-text hover:bg-white/5 transition-all duration-200 cursor-pointer press-scale -me-2"
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
