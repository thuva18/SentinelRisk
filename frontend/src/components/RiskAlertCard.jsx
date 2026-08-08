import { Shield, ShieldAlert, Loader2, MousePointerClick } from 'lucide-react';

function getRiskLevel(prob) {
  if (prob < 0.5) return { label: 'LOW RISK', color: '#39FF14', textClass: 'text-neon', bgClass: 'bg-green-900/20', borderClass: 'border-green-500/30' };
  if (prob < 0.8) return { label: 'MEDIUM RISK', color: '#F59E0B', textClass: 'text-amber-400', bgClass: 'bg-amber-900/20', borderClass: 'border-amber-500/30' };
  return { label: 'HIGH RISK — FRAUD', color: '#DC143C', textClass: 'text-crimson', bgClass: 'bg-red-900/20', borderClass: 'border-red-500/30' };
}

export default function RiskAlertCard({ transaction, evaluation, isLoading }) {
  const prob = evaluation?.fraud_probability ?? null;
  const risk = prob !== null ? getRiskLevel(prob) : null;

  return (
    <div className="glass-card flex flex-col h-full max-h-[680px]">
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
        <h2 className="font-semibold text-white text-sm">Risk Assessment</h2>
        {evaluation && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full border ${risk?.bgClass} ${risk?.borderClass} ${risk?.textClass}`}>
            {risk?.label}
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        {isLoading && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
            <p className="text-slate-400 text-sm">Analyzing transaction...</p>
            <p className="text-slate-500 text-xs">Running LightGBM inference</p>
          </div>
        )}

        {!isLoading && !evaluation && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="p-5 bg-slate-700/40 rounded-full">
              <MousePointerClick className="w-12 h-12 text-slate-500" />
            </div>
            <p className="text-slate-400 font-medium">Select a Transaction</p>
            <p className="text-slate-500 text-sm">Click any item in the feed to run fraud analysis</p>
          </div>
        )}

        {!isLoading && evaluation && prob !== null && (
          <>
            {/* Risk icon */}
            <div className={`p-5 rounded-full border-2 ${risk?.borderClass} ${risk?.bgClass} transition-all duration-500`}
              style={{ boxShadow: `0 0 30px ${risk?.color}40` }}>
              {prob >= 0.5
                ? <ShieldAlert className="w-14 h-14" style={{ color: risk?.color }} />
                : <Shield className="w-14 h-14" style={{ color: risk?.color }} />}
            </div>

            {/* Probability display */}
            <div className="text-center">
              <p className="text-6xl font-black tracking-tight" style={{ color: risk?.color }}>
                {(prob * 100).toFixed(1)}%
              </p>
              <p className="text-slate-400 text-sm mt-1">Fraud Probability</p>
            </div>

            {/* Progress bar */}
            <div className="w-full">
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${prob * 100}%`,
                    backgroundColor: risk?.color,
                    boxShadow: `0 0 8px ${risk?.color}80`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Safe</span>
                <span>Fraud</span>
              </div>
            </div>

            {/* Transaction details */}
            {transaction && (
              <div className="w-full bg-slate-900/60 rounded-lg p-4 border border-slate-700/50 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Merchant</span>
                  <span className="text-white font-medium truncate max-w-[55%]">{transaction.merchant}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Amount</span>
                  <span className="text-white font-bold">${transaction.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Card</span>
                  <span className="text-slate-300 font-mono text-xs">{transaction.card}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Verdict</span>
                  <span className={`font-bold ${evaluation.prediction === 'Fraud' ? 'text-crimson' : 'text-neon'}`}>
                    {evaluation.prediction}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Model</span>
                  <span className="text-xs text-slate-500 font-mono">{evaluation.model_mode}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
