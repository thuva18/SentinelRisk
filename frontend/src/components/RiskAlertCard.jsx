import { useState } from 'react';
import { 
  Shield, ShieldAlert, ShieldCheck, Loader2, Lock, CheckCircle2, 
  Send, AlertTriangle, Cpu, Radio, Sparkles, MapPin, Clock, CreditCard
} from 'lucide-react';

function getRiskLevel(prob, threshold = 0.5) {
  if (prob < threshold * 0.8) {
    return { 
      label: 'LOW RISK — APPROVED', 
      color: '#39FF14', 
      textClass: 'text-neon', 
      bgClass: 'bg-green-950/40', 
      borderClass: 'border-green-500/50', 
      glowClass: '' 
    };
  }
  if (prob < 0.8) {
    return { 
      label: 'SUSPICIOUS — REVIEW', 
      color: '#F59E0B', 
      textClass: 'text-amber-400', 
      bgClass: 'bg-amber-950/40', 
      borderClass: 'border-amber-500/50', 
      glowClass: 'animate-pulse-glow-amber' 
    };
  }
  return { 
    label: 'CRITICAL — FRAUD DETECTED', 
    color: '#DC143C', 
    textClass: 'text-crimson', 
    bgClass: 'bg-red-950/40', 
    borderClass: 'border-red-500/60', 
    glowClass: 'animate-pulse-glow-red' 
  };
}

export default function RiskAlertCard({ 
  transaction, 
  evaluation, 
  isLoading,
  ruleThreshold = 0.5,
  onAnalystAction,
}) {
  const [actionDone, setActionDone] = useState(null); // 'frozen' | '2fa' | 'whitelisted'
  const prob = evaluation?.fraud_probability ?? null;
  const risk = prob !== null ? getRiskLevel(prob, ruleThreshold) : null;

  const handleAction = (actionType) => {
    setActionDone(actionType);
    if (onAnalystAction) {
      onAnalystAction(actionType, transaction, evaluation);
    }
  };

  // SVG Gauge calculations
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = prob !== null ? circumference - (prob * circumference) : circumference;

  return (
    <div className={`glass-card flex flex-col h-full max-h-[680px] transition-all duration-500 relative overflow-hidden ${risk?.glowClass || ''}`}>
      {/* Top Card Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-slate-800 bg-slate-950/30">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-400" />
          <h2 className="font-semibold text-white text-xs uppercase tracking-wider">Risk Evaluation Engine</h2>
        </div>
        {evaluation && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
              ⚡ 14ms
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${risk?.bgClass} ${risk?.borderClass} ${risk?.textClass}`}>
              {risk?.label}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-5 overflow-y-auto">
        {isLoading && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
              <Cpu className="w-6 h-6 text-blue-400 absolute" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-sm">Evaluating Risk Signals...</p>
              <p className="text-slate-500 text-xs mt-1">Executing LightGBM trees + SHAP kernel</p>
            </div>
          </div>
        )}

        {!isLoading && !evaluation && (
          <div className="flex flex-col items-center gap-4 text-center py-6">
            <div className="relative w-28 h-28 rounded-full border border-blue-500/30 flex items-center justify-center overflow-hidden bg-slate-900/80 shadow-inner">
              <div className="absolute inset-0 bg-blue-500/5 animate-pulse" />
              {/* Radar Sweeper */}
              <div 
                className="absolute w-full h-full origin-center animate-radar-sweep opacity-70"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(59, 130, 246, 0.4) 360deg)'
                }}
              />
              <div className="w-20 h-20 rounded-full border border-dashed border-blue-500/40 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full border border-blue-400/40 flex items-center justify-center">
                  <Radio className="w-5 h-5 text-blue-400 animate-pulse" />
                </div>
              </div>
            </div>
            <div>
              <p className="text-slate-200 font-bold text-sm">Real-Time Threat Radar Active</p>
              <p className="text-slate-400 text-xs px-4 mt-1 max-w-xs leading-relaxed">
                Select any transaction in the live feed or input custom params via <span className="text-purple-400 font-semibold">Manual Check</span> to inspect forensic risk signals.
              </p>
            </div>
          </div>
        )}

        {!isLoading && evaluation && prob !== null && (
          <div className="w-full flex flex-col items-center gap-4">
            {/* Radial SVG Gauge */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                {/* Background Ring */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke="#1e293b"
                  strokeWidth="10"
                  fill="transparent"
                />
                {/* Progress Ring */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke={risk?.color}
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              {/* Center Content */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-black tracking-tight font-mono" style={{ color: risk?.color }}>
                  {(prob * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Risk Score
                </span>
              </div>
            </div>

            {/* Forensic Risk Badges */}
            <div className="flex flex-wrap justify-center gap-1.5">
              {transaction?.amount > 1000 && (
                <span className="text-[10px] bg-red-950/60 text-red-400 border border-red-800/60 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <AlertTriangle className="w-2.5 h-2.5" /> High Volume (&gt;$1k)
                </span>
              )}
              {transaction?.chipType === 'Online Transaction' && (
                <span className="text-[10px] bg-amber-950/60 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded-full font-medium">
                  🌐 CNP / Online
                </span>
              )}
              {(transaction?.hour >= 0 && transaction?.hour <= 5) && (
                <span className="text-[10px] bg-purple-950/60 text-purple-300 border border-purple-800/60 px-2 py-0.5 rounded-full font-medium">
                  🌙 Night Hours ({transaction.hour}:{String(transaction.minute).padStart(2, '0')})
                </span>
              )}
              {transaction?.errorType && (
                <span className="text-[10px] bg-red-950/80 text-red-300 border border-red-700 px-2 py-0.5 rounded-full font-medium">
                  ⚠️ {transaction.errorType}
                </span>
              )}
            </div>

            {/* Transaction Key Data Cards */}
            {transaction && (
              <div className="w-full bg-slate-950/70 rounded-xl p-3.5 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Merchant</span>
                  <span className="text-white font-bold truncate max-w-[170px]">{transaction.merchant}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Amount &amp; Time</span>
                  <span className="text-white font-mono font-bold">
                    ${transaction.amount.toFixed(2)} <span className="text-slate-500 font-normal">@ {transaction.timestamp}</span>
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Location / Card</span>
                  <span className="text-slate-300 font-mono text-[11px]">
                    {transaction.city} • {transaction.card}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400">Inference Status</span>
                  <span className="text-[11px] font-mono text-blue-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-blue-400" />
                    {evaluation.model_mode === 'live' ? 'LGBM Ensemble (Live)' : 'Mock Fallback Engine'}
                  </span>
                </div>
              </div>
            )}

            {/* Analyst Quick Action Panel */}
            <div className="w-full space-y-2 pt-1 border-t border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                <span>Security Analyst Actions</span>
                {actionDone && (
                  <span className="text-emerald-400 font-mono lowercase flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> action logged
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleAction('freeze')}
                  className={`py-2 px-1.5 rounded-lg text-[11px] font-bold border transition-all flex flex-col items-center justify-center gap-1 ${
                    actionDone === 'freeze'
                      ? 'bg-red-900/60 border-red-500 text-red-200'
                      : 'bg-red-950/30 border-red-900/40 text-red-400 hover:bg-red-900/40 hover:border-red-600'
                  }`}
                  title="Freeze card immediately and alert cardholder"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Freeze Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAction('2fa')}
                  className={`py-2 px-1.5 rounded-lg text-[11px] font-bold border transition-all flex flex-col items-center justify-center gap-1 ${
                    actionDone === '2fa'
                      ? 'bg-amber-900/60 border-amber-500 text-amber-200'
                      : 'bg-amber-950/30 border-amber-900/40 text-amber-400 hover:bg-amber-900/40 hover:border-amber-600'
                  }`}
                  title="Send biometric SMS push notification to user"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Push 2FA</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAction('whitelist')}
                  className={`py-2 px-1.5 rounded-lg text-[11px] font-bold border transition-all flex flex-col items-center justify-center gap-1 ${
                    actionDone === 'whitelist'
                      ? 'bg-green-900/60 border-green-500 text-green-200'
                      : 'bg-green-950/30 border-green-900/40 text-green-400 hover:bg-green-900/40 hover:border-green-600'
                  }`}
                  title="Mark merchant as trusted"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Whitelist</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
