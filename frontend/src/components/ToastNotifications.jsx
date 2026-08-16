import { useEffect, useRef } from 'react';
import { AlertTriangle, X, ShieldAlert, CheckCircle2, Zap, BellRing } from 'lucide-react';

export default function ToastNotifications({ toasts = [], onDismiss }) {
  return (
    <div className="fixed top-16 right-4 z-50 flex flex-col gap-2.5 w-84 max-w-[calc(100vw-2rem)] pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onDismiss={onDismiss} />
        </div>
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

  const isAction = Boolean(toast.isActionToast);
  const isSpike = Boolean(toast.isSpikeAlert);
  const isHighRisk = toast.probability >= 0.8;

  let color = '#DC143C';
  let bgClass = 'bg-red-950/95 border-red-500/70';
  let Icon = ShieldAlert;
  let tag = '🚨 High Risk Fraud';

  if (isAction) {
    color = '#38bdf8';
    bgClass = 'bg-slate-900/95 border-blue-500/70';
    Icon = CheckCircle2;
    tag = 'Security Action Logged';
  } else if (isSpike) {
    color = '#f59e0b';
    bgClass = 'bg-amber-950/95 border-amber-500/70';
    Icon = Zap;
    tag = '⚡ Threat Surge Injected';
  } else if (!isHighRisk) {
    color = '#f59e0b';
    bgClass = 'bg-amber-950/95 border-amber-500/70';
    Icon = AlertTriangle;
    tag = '⚠️ Suspicious Transaction';
  }

  return (
    <div
      className={`${bgClass} backdrop-blur-md border rounded-2xl p-4 shadow-2xl animate-slide-in text-xs`}
      style={{ boxShadow: `0 0 24px ${color}35` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="p-1.5 rounded-lg bg-slate-950/60 shrink-0 mt-0.5" style={{ color }}>
          <Icon className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className="text-[10px] font-black uppercase tracking-wider font-mono"
              style={{ color }}
            >
              {tag}
            </span>
          </div>

          <p className="text-white font-bold text-xs truncate">{toast.merchant}</p>

          {!isAction && !isSpike && (
            <div className="flex items-center justify-between mt-1 font-mono text-[11px]">
              <span className="text-slate-300">${toast.amount?.toFixed(2)}</span>
              <span className="font-bold" style={{ color }}>
                {(toast.probability * 100).toFixed(1)}% Threat
              </span>
            </div>
          )}

          {/* Progress Bar */}
          <div className="mt-2.5 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: isAction ? '100%' : `${toast.probability * 100}%`,
                backgroundColor: color
              }}
            />
          </div>
        </div>

        <button
          onClick={() => onDismiss(toast.id)}
          className="text-slate-500 hover:text-slate-300 p-1 transition-colors shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
