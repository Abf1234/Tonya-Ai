import { CheckCircle2, CircleAlert, Info, X, XCircle } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext({ showToast: () => {} });

const variants = {
  info: { icon: Info, classes: 'border-blue-200 bg-white text-blue-950', iconClass: 'text-blue-700' },
  success: { icon: CheckCircle2, classes: 'border-emerald-200 bg-white text-emerald-950', iconClass: 'text-emerald-700' },
  warning: { icon: CircleAlert, classes: 'border-amber-200 bg-white text-amber-950', iconClass: 'text-amber-700' },
  error: { icon: XCircle, classes: 'border-rose-200 bg-white text-rose-950', iconClass: 'text-rose-700' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((messageOrOptions, options = {}) => {
    const config =
      messageOrOptions && typeof messageOrOptions === 'object'
        ? messageOrOptions
        : { ...options, message: messageOrOptions };
    const id = config.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const duration = config.duration ?? 4200;
    const toast = {
      id,
      message: typeof config.message === 'string' ? config.message : 'Notification',
      type: config.type || 'info',
      title: config.title,
      duration,
    };
    setToasts((current) => [...current.filter((item) => item.id !== id), toast].slice(-4));
    if (duration > 0) window.setTimeout(() => removeToast(id), duration);
    return id;
  }, [removeToast]);

  const value = useMemo(() => ({ showToast, dismissToast: removeToast }), [showToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-3 bottom-3 z-[80] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[min(380px,calc(100vw-2.5rem))]"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((toast) => {
          const config = variants[toast.type] || variants.info;
          const Icon = config.icon;
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex w-full items-start gap-3 rounded-2xl border p-4 shadow-soft animate-toast-in ${config.classes}`}
              role={toast.type === 'error' ? 'alert' : 'status'}
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${config.iconClass}`} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                {toast.title ? <p className="text-sm font-extrabold">{toast.title}</p> : null}
                <p className={`text-sm leading-6 ${toast.title ? 'mt-0.5 text-current/80' : 'font-semibold'}`}>
                  {toast.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="rounded-lg p-1 text-current opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
