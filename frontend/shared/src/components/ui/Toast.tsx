'use client';

import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  title?: string;
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
}

interface ToastItem extends ToastOptions {
  id: string;
  variant: ToastVariant;
  durationMs: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (options: ToastOptions) => void;
  removeToast: (id: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

const MAX_VISIBLE_TOASTS = 4;
const DEFAULT_DURATION_MS = 4200;

const ToastContext = createContext<ToastContextValue | null>(null);

function toastIcon(variant: ToastVariant) {
  if (variant === 'success') {
    return <CheckCircle2 size={16} className="text-emerald-600" />;
  }
  if (variant === 'error') {
    return <AlertCircle size={16} className="text-red-600" />;
  }
  if (variant === 'warning') {
    return <AlertTriangle size={16} className="text-amber-600" />;
  }
  return <Info size={16} className="text-primary-600" />;
}

function nextToastId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timerMap = useRef<Record<string, number>>({});

  const removeToast = useCallback((id: string) => {
    const activeTimer = timerMap.current[id];
    if (activeTimer) {
      window.clearTimeout(activeTimer);
      delete timerMap.current[id];
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (options: ToastOptions) => {
      const id = nextToastId();
      const toast: ToastItem = {
        id,
        title: options.title,
        message: options.message,
        variant: options.variant || 'info',
        durationMs: options.durationMs ?? DEFAULT_DURATION_MS,
      };

      setToasts((prev) => {
        const next = [...prev, toast];
        return next.length > MAX_VISIBLE_TOASTS ? next.slice(next.length - MAX_VISIBLE_TOASTS) : next;
      });

      timerMap.current[id] = window.setTimeout(() => {
        removeToast(id);
      }, toast.durationMs);
    },
    [removeToast],
  );

  useEffect(() => {
    return () => {
      Object.values(timerMap.current).forEach((timer) => window.clearTimeout(timer));
      timerMap.current = {};
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      toasts,
      showToast,
      removeToast,
      success: (message, title) => showToast({ message, title, variant: 'success' }),
      error: (message, title) => showToast({ message, title, variant: 'error' }),
      info: (message, title) => showToast({ message, title, variant: 'info' }),
      warning: (message, title) => showToast({ message, title, variant: 'warning' }),
    }),
    [removeToast, showToast, toasts],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider.');
  }
  return context;
}

export function ToastViewport() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[120] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'pointer-events-auto rounded-xl border bg-white p-3 shadow-xl shadow-slate-900/10',
            'animate-[fade-in_140ms_ease-out] transition-opacity',
            toast.variant === 'success' ? 'border-emerald-200' : '',
            toast.variant === 'error' ? 'border-red-200' : '',
            toast.variant === 'warning' ? 'border-amber-200' : '',
            toast.variant === 'info' ? 'border-primary-200' : '',
          )}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5">{toastIcon(toast.variant)}</span>
            <div className="min-w-0 flex-1">
              {toast.title ? <p className="text-sm font-semibold text-slate-900">{toast.title}</p> : null}
              <p className="text-sm text-slate-700">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
