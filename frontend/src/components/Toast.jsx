// Lightweight toast notification system.
// Usage anywhere in the app:
//   import { toast } from '../../components/Toast';
//   toast.success('Saved!');
//   toast.error('Something went wrong');
//   toast.info('FYI');
//   toast.warning('Heads up');
//
// Just mount <ToastContainer /> once at app root.

import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

// Pub/sub — keeps the API usable from non-React code too (utils, api layers).
const listeners = new Set();
let counter = 0;

const emit = (event) => { listeners.forEach((fn) => fn(event)); };

export const toast = {
  show: (message, type = 'info', duration = 4000) => {
    const id = ++counter;
    emit({ kind: 'add', toast: { id, message: String(message ?? ''), type, duration } });
    return id;
  },
  success: (msg, duration) => toast.show(msg, 'success', duration),
  error:   (msg, duration) => toast.show(msg, 'error',   duration ?? 5500),
  warning: (msg, duration) => toast.show(msg, 'warning', duration),
  info:    (msg, duration) => toast.show(msg, 'info',    duration),
  dismiss: (id) => emit({ kind: 'remove', id })
};

const TYPE_STYLES = {
  success: { Icon: CheckCircle2,  bg: 'bg-white', accent: 'border-l-emerald-500', iconColor: 'text-emerald-500' },
  error:   { Icon: AlertCircle,   bg: 'bg-white', accent: 'border-l-red-500',     iconColor: 'text-red-500' },
  warning: { Icon: AlertTriangle, bg: 'bg-white', accent: 'border-l-amber-500',   iconColor: 'text-amber-500' },
  info:    { Icon: Info,          bg: 'bg-white', accent: 'border-l-blue-500',    iconColor: 'text-blue-500' }
};

function ToastItem({ id, message, type, duration }) {
  const [leaving, setLeaving] = useState(false);
  const s = TYPE_STYLES[type] || TYPE_STYLES.info;
  const { Icon } = s;

  const close = () => {
    setLeaving(true);
    // Wait for the exit animation before actually removing the toast.
    setTimeout(() => toast.dismiss(id), 180);
  };

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(close, duration);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 w-[340px] max-w-[calc(100vw-2rem)] px-4 py-3 rounded-lg shadow-lg border border-slate-200 border-l-4 ${s.bg} ${s.accent} transition-all duration-200 ${
        leaving ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
      }`}
      style={{ animation: leaving ? undefined : 'toast-in 0.2s ease-out' }}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${s.iconColor}`} />
      <div className="flex-1 text-sm text-slate-700 whitespace-pre-line break-words">{message}</div>
      <button
        onClick={close}
        className="flex-shrink-0 text-slate-400 hover:text-slate-700 transition"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (event) => {
      if (event.kind === 'add') {
        setToasts((prev) => [...prev, event.toast]);
      } else if (event.kind === 'remove') {
        setToasts((prev) => prev.filter((t) => t.id !== event.id));
      }
    };
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  return (
    <>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(100%); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      {/* Positioned just below the 56px (h-14) fixed header, in the content area's top-right. */}
      <div className="fixed top-[4.5rem] right-4 z-[1000] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => <ToastItem key={t.id} {...t} />)}
      </div>
    </>
  );
}
