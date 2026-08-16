import { useState } from 'react';
import { X, Sliders, Shield, AlertTriangle, CheckCircle, Zap, RefreshCw } from 'lucide-react';

export default function RuleEngineModal({ isOpen, onClose, rules, onUpdateRules }) {
  if (!isOpen) return null;

  const [localRules, setLocalRules] = useState(rules);

  const toggleRule = (key) => {
    setLocalRules(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleThresholdChange = (e) => {
    setLocalRules(prev => ({
      ...prev,
      threshold: parseFloat(e.target.value)
    }));
  };

  const handleSave = () => {
    onUpdateRules(localRules);
    onClose();
  };

  const handleReset = () => {
    const defaultRules = {
      threshold: 0.5,
      flagNightRush: true,
      flagHighOnline: true,
      flagRepeatedErrors: true,
      autoBlockHighRisk: true,
    };
    setLocalRules(defaultRules);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-in">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Security & Decision Rules Engine</h3>
              <p className="text-xs text-slate-400">Configure LightGBM inference thresholds & guardrail heuristics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Threshold Slider */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Fraud Probability Decision Threshold
              </label>
              <span className={`text-sm font-mono font-bold px-2 py-0.5 rounded border ${
                localRules.threshold <= 0.45 
                  ? 'text-amber-400 bg-amber-950/40 border-amber-800/50' 
                  : localRules.threshold >= 0.7 
                  ? 'text-neon bg-green-950/40 border-green-800/50' 
                  : 'text-blue-400 bg-blue-950/40 border-blue-800/50'
              }`}>
                {(localRules.threshold * 100).toFixed(0)}%
              </span>
            </div>
            
            <input
              type="range"
              min="0.30"
              max="0.85"
              step="0.05"
              value={localRules.threshold}
              onChange={handleThresholdChange}
              className="w-full accent-blue-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />

            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>30% (Strict / High Alert)</span>
              <span>50% (Standard)</span>
              <span>85% (Conservative)</span>
            </div>
            <p className="text-xs text-slate-400">
              Transactions exceeding this probability are classified as <span className="text-crimson font-semibold">Fraud</span> and trigger immediate notifications.
            </p>
          </div>

          {/* Heuristic Guardrails */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Rule Heuristics</h4>

            {/* Rule 1 */}
            <div 
              onClick={() => toggleRule('flagNightRush')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                localRules.flagNightRush 
                  ? 'bg-slate-800/70 border-blue-500/50 shadow-sm' 
                  : 'bg-slate-900/40 border-slate-800 text-slate-500 opacity-60'
              }`}
            >
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <span>🌙 Nighttime Off-Hours Surcharge Guard</span>
                  {localRules.flagNightRush && <span className="text-[10px] bg-blue-900/40 text-blue-400 px-1.5 rounded">Active</span>}
                </div>
                <p className="text-xs text-slate-400">Penalize transactions between 12:00 AM – 5:00 AM with amounts &gt; $800.</p>
              </div>
              <input 
                type="checkbox" 
                checked={localRules.flagNightRush} 
                onChange={() => {}} 
                className="mt-1 accent-blue-500 rounded" 
              />
            </div>

            {/* Rule 2 */}
            <div 
              onClick={() => toggleRule('flagHighOnline')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                localRules.flagHighOnline 
                  ? 'bg-slate-800/70 border-blue-500/50 shadow-sm' 
                  : 'bg-slate-900/40 border-slate-800 text-slate-500 opacity-60'
              }`}
            >
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <span>🌐 High-Value Online Card-Not-Present Filter</span>
                  {localRules.flagHighOnline && <span className="text-[10px] bg-blue-900/40 text-blue-400 px-1.5 rounded">Active</span>}
                </div>
                <p className="text-xs text-slate-400">Elevate scrutiny on e-commerce transactions &gt; $1,200 without chip validation.</p>
              </div>
              <input 
                type="checkbox" 
                checked={localRules.flagHighOnline} 
                onChange={() => {}} 
                className="mt-1 accent-blue-500 rounded" 
              />
            </div>

            {/* Rule 3 */}
            <div 
              onClick={() => toggleRule('flagRepeatedErrors')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                localRules.flagRepeatedErrors 
                  ? 'bg-slate-800/70 border-blue-500/50 shadow-sm' 
                  : 'bg-slate-900/40 border-slate-800 text-slate-500 opacity-60'
              }`}
            >
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <span>⚠️ Terminal PIN &amp; Glitch Penalty</span>
                  {localRules.flagRepeatedErrors && <span className="text-[10px] bg-blue-900/40 text-blue-400 px-1.5 rounded">Active</span>}
                </div>
                <p className="text-xs text-slate-400">Add immediate +15% risk bias for 'Bad PIN' or 'Insufficient Balance' terminal responses.</p>
              </div>
              <input 
                type="checkbox" 
                checked={localRules.flagRepeatedErrors} 
                onChange={() => {}} 
                className="mt-1 accent-blue-500 rounded" 
              />
            </div>

            {/* Rule 4 */}
            <div 
              onClick={() => toggleRule('autoBlockHighRisk')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                localRules.autoBlockHighRisk 
                  ? 'bg-red-950/20 border-red-800/50 shadow-sm' 
                  : 'bg-slate-900/40 border-slate-800 text-slate-500 opacity-60'
              }`}
            >
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <span>🚨 Automatic Card Lock Trigger (&gt; 80% Probability)</span>
                  {localRules.autoBlockHighRisk && <span className="text-[10px] bg-red-900/50 text-red-300 px-1.5 rounded">Critical</span>}
                </div>
                <p className="text-xs text-slate-400">Suggest immediate automated card freeze recommendations when critical confidence is reached.</p>
              </div>
              <input 
                type="checkbox" 
                checked={localRules.autoBlockHighRisk} 
                onChange={() => {}} 
                className="mt-1 accent-red-500 rounded" 
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 border border-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/30 transition-all flex items-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Apply Rules
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
