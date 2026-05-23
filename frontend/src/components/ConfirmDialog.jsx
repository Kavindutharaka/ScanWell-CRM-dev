// Centered confirmation modal — Promise-based replacement for window.confirm().
// Usage:
//   import { confirm } from '../../components/ConfirmDialog';
//   if (await confirm('Delete this item?')) { ... }
//   if (await confirm({ title: 'Delete?', message: '...', confirmText: 'Delete', variant: 'danger' })) { ... }
//
// Mount <ConfirmDialogContainer /> once at app root.

import { useState, useEffect } from 'react';
import { AlertTriangle, Info, HelpCircle } from 'lucide-react';

const listeners = new Set();
let counter = 0;
const pendingResolvers = new Map();

const emit = (event) => { listeners.forEach((fn) => fn(event)); };

/**
 * Returns a Promise<boolean> that resolves to true if confirmed, false otherwise.
 * Accepts a string or an options object:
 *   { title, message, confirmText, cancelText, variant: 'danger' | 'warning' | 'info' }
 */
export const confirm = (options) => {
  return new Promise((resolve) => {
    const id = ++counter;
    pendingResolvers.set(id, resolve);
    const config = typeof options === 'string' ? { message: options } : (options || {});
    emit({
      kind: 'show',
      dialog: {
        id,
        title:       config.title       ?? 'Are you sure?',
        message:     config.message     ?? '',
        confirmText: config.confirmText ?? 'Confirm',
        cancelText:  config.cancelText  ?? 'Cancel',
        variant:     config.variant     ?? 'danger',
      }
    });
  });
};

const resolvePending = (id, answer) => {
  const resolver = pendingResolvers.get(id);
  if (resolver) {
    resolver(answer);
    pendingResolvers.delete(id);
  }
};

const VARIANT_STYLES = {
  danger:  { Icon: AlertTriangle, iconBg: 'bg-red-100',    iconColor: 'text-red-600',    btn: 'bg-red-600 hover:bg-red-700' },
  warning: { Icon: AlertTriangle, iconBg: 'bg-amber-100',  iconColor: 'text-amber-600',  btn: 'bg-amber-600 hover:bg-amber-700' },
  info:    { Icon: Info,          iconBg: 'bg-blue-100',   iconColor: 'text-blue-600',   btn: 'bg-blue-600 hover:bg-blue-700' },
  question:{ Icon: HelpCircle,    iconBg: 'bg-slate-100',  iconColor: 'text-slate-600',  btn: 'bg-slate-700 hover:bg-slate-800' }
};

export function ConfirmDialogContainer() {
  const [dialog, setDialog] = useState(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const handler = (event) => {
      if (event.kind === 'show') {
        setLeaving(false);
        setDialog(event.dialog);
      }
    };
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  // Close on Escape (Cancel), Enter (Confirm).
  useEffect(() => {
    if (!dialog) return;
    const onKey = (e) => {
      if (e.key === 'Escape') answer(false);
      else if (e.key === 'Enter') answer(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialog]);

  const answer = (result) => {
    if (!dialog) return;
    const id = dialog.id;
    setLeaving(true);
    setTimeout(() => {
      resolvePending(id, result);
      setDialog(null);
      setLeaving(false);
    }, 150);
  };

  if (!dialog) return null;

  const v = VARIANT_STYLES[dialog.variant] || VARIANT_STYLES.danger;
  const { Icon } = v;

  return (
    <>
      <style>{`
        @keyframes confirm-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes confirm-scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          style={{ animation: leaving ? 'confirm-fade-in 0.15s reverse' : 'confirm-fade-in 0.15s ease-out' }}
          onClick={() => answer(false)}
        />
        <div
          className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
          style={{ animation: leaving ? 'confirm-scale-in 0.15s reverse' : 'confirm-scale-in 0.15s ease-out' }}
        >
          <div className="flex items-start gap-4 mb-2">
            <div className={`flex-shrink-0 w-12 h-12 rounded-full ${v.iconBg} flex items-center justify-center`}>
              <Icon className={`w-6 h-6 ${v.iconColor}`} />
            </div>
            <div className="flex-1 pt-1 min-w-0">
              <h3 className="text-lg font-semibold text-slate-900 break-words">{dialog.title}</h3>
              {dialog.message && (
                <p className="mt-2 text-sm text-slate-600 whitespace-pre-line break-words">{dialog.message}</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => answer(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition"
            >
              {dialog.cancelText}
            </button>
            <button
              type="button"
              onClick={() => answer(true)}
              className={`px-4 py-2 ${v.btn} text-white rounded-lg font-medium transition`}
              autoFocus
            >
              {dialog.confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
