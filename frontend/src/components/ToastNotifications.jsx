import { useEffect, useRef } from 'react';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';

export default function ToastNotifications({ toasts, onDismiss }) {
  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 w-80">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function Toast({ toast, onDismiss }) {
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(toast.id), 5000);
    return () => clearTimeout(timerRef.current);
  }, [toast.id, onDismiss]);

  const isHighRisk = toast.probability >= 0.8;
  const color = isHighRisk ? '#DC143C' : '#F59E0B';
  const bgClass = isHighRisk ? 'bg-red-950/90 border-red-500/60' : 'bg-amber-950/90 border-amber-500/60';

  return (
    <div
      className={`${bgClass} backdrop-blur-sm border rounded-xl p-4 shadow-2xl animate-slide-in`}
      style={{ boxShadow: `0 0 20px ${color}30` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <ShieldAlert className="w-5 h-5 shrink-0" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-black uppercase tracking-wider"
              style={{ color }}
            >
              {isHighRisk ? '🚨 High Risk Alert' : '⚠️ Medium Risk'}
            </span>
          </div>
          <p className="text-white text-sm font-semibold truncate">{toast.merchant}</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-slate-300 text-xs">${toast.amount.toFixed(2)}</span>
            <span className="text-xs font-bold" style={{ color }}>
              {(toast.probability * 100).toFixed(1)}% Fraud
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${toast.probability * 100}%`, backgroundColor: color }}
            />
          </div>
          <p className="text-slate-500 text-xs mt-1.5">Auto-dismisses in 5s</p>
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          className="text-slate-500 hover:text-slate-300 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
