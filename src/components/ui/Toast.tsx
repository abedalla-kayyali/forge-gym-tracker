import { useState, useCallback, useEffect, createContext, useContext, type ReactNode } from 'react';
import { CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';

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
      <div className="fixed bottom-20 left-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const typeConfig: Record<ToastType, { style: string; Icon: typeof CheckCircle }> = {
  success: { style: 'border-forge-green/30 text-forge-green', Icon: CheckCircle },
  error: { style: 'border-red-500/30 text-red-400', Icon: XCircle },
  info: { style: 'border-forge-border text-forge-text', Icon: Info },
  warning: { style: 'border-yellow-500/30 text-yellow-400', Icon: AlertTriangle },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const { style, Icon } = typeConfig[toast.type];

  return (
    <div className={`pointer-events-auto card-elevated border rounded-xl px-4 py-3 text-sm font-body animate-slide-up flex items-center gap-3 ${style}`}>
      <Icon size={18} className="shrink-0" />
      <span>{toast.message}</span>
    </div>
  );
}
