'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastType, string> = {
  success: 'check_circle',
  error: 'error',
  warning: 'warning',
  info: 'info',
};

const STYLES: Record<ToastType, string> = {
  success: 'bg-waste-organic text-white',
  error: 'bg-status-alert text-white',
  warning: 'bg-secondary text-white',
  info: 'bg-primary text-white',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const addToast = useCallback((type: ToastType, message: string, duration = 4000) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev.slice(-2), { id, type, message, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {mounted && createPortal(
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg shadow-black/20
                pointer-events-auto animate-slide-in
                ${STYLES[toast.type]}
              `}
            >
              <span className="material-symbols-outlined text-[20px]">
                {ICONS[toast.type]}
              </span>
              <p className="text-[14px] font-bold flex-1">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="opacity-70 hover:opacity-100 transition-opacity ml-2"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}