import { useState, useCallback, useEffect, createContext, useContext, type ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div
        className="fixed bottom-24 left-0 right-0 z-[60] flex flex-col items-center gap-2 px-4 pointer-events-none"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const typeConfig: Record<ToastType, { style: string; Icon: typeof CheckCircle2; iconClass: string }> = {
  success: {
    style: 'border-forge-green/30 bg-forge-green/[0.08]',
    Icon: CheckCircle2,
    iconClass: 'text-forge-green',
  },
  error: {
    style: 'border-red-500/40 bg-red-500/[0.08]',
    Icon: XCircle,
    iconClass: 'text-red-400',
  },
  info: {
    style: 'border-white/10',
    Icon: Info,
    iconClass: 'text-forge-text-soft',
  },
  warning: {
    style: 'border-yellow-500/30 bg-yellow-500/[0.08]',
    Icon: AlertTriangle,
    iconClass: 'text-yellow-400',
  },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const { style, Icon, iconClass } = typeConfig[toast.type];

  return (
    <div
      role="status"
      className={[
        'pointer-events-auto max-w-md w-full',
        'card-glass border rounded-2xl px-4 py-3',
        'text-sm font-body text-forge-text',
        'animate-slide-up flex items-center gap-3',
        'shadow-[0_12px_40px_rgba(0,0,0,0.5)]',
        style,
      ].join(' ')}
    >
      <Icon size={18} className={`shrink-0 ${iconClass}`} />
      <span className="flex-1 leading-snug">{toast.message}</span>
    </div>
  );
}
