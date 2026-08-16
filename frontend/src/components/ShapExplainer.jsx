import { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, ReferenceLine 
} from 'recharts';
import { Loader2, BrainCircuit, Sparkles, MessageSquareText, Layers, AlertCircle, CheckCircle2 } from 'lucide-react';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    const isPositive = val > 0;
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl text-xs">
        <p className="text-xs font-bold text-white mb-1">{payload[0].payload.feature}</p>
        <p className={`text-sm font-mono font-black ${isPositive ? 'text-crimson' : 'text-neon'}`}>
          {isPositive ? '+' : ''}{(val * 100).toFixed(2)}% Impact
        </p>
        <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
          {isPositive ? '↑ Shifts decision toward Fraud' : '↓ Shifts decision toward Safe'}
        </p>
      </div>
    );
  }
  return null;
};

export default function ShapExplainer({ evaluation, isLoading }) {
  const [viewMode, setViewMode] = useState('chart'); // 'chart' | 'ai'

  const shapData = evaluation?.shap_values
    ? [...evaluation.shap_values]
        .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
        .slice(0, 7)
        .map(d => ({ 
          ...d, 
          feature: d.feature.replace('Use Chip_', '').replace('Errors?_', '').replace('_', ' ') 
        }))
    : [];

  // Generate plain English narrative from SHAP findings
  const generateNarrative = () => {
    if (!shapData || shapData.length === 0) return null;
    const topPositive = shapData.filter(d => d.impact > 0);
    const topNegative = shapData.filter(d => d.impact < 0);

    return {
      riskDrivers: topPositive.slice(0, 3),
      trustDrivers: topNegative.slice(0, 2),
      summary: topPositive.length > topNegative.length
        ? `Model flagged significant anomaly primarily due to ${topPositive[0]?.feature || 'transaction variance'}.`
        : `Transaction exhibits standard legitimate spending patterns consistent with verified baseline.`
    };
  };

  const narrative = generateNarrative();

  return (
    <div className="glass-card flex flex-col h-full max-h-[680px]">
      {/* Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-slate-800 bg-slate-950/30">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-purple-400" />
          <h2 className="font-semibold text-white text-xs uppercase tracking-wider">SHAP Model Explainability</h2>
        </div>

        {/* View Switcher Tabs */}
        {shapData.length > 0 && (
          <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[11px]">
            <button
              onClick={() => setViewMode('chart')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                viewMode === 'chart'
                  ? 'bg-purple-600/40 text-purple-200 border border-purple-500/50 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Waterfall Chart
            </button>
            <button
              onClick={() => setViewMode('ai')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${
                viewMode === 'ai'
                  ? 'bg-purple-600/40 text-purple-200 border border-purple-500/50 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3 h-3 text-purple-300" />
              AI Reasoning
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-center p-4 overflow-y-auto">
        {isLoading && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
            <div className="text-center">
              <p className="text-slate-300 font-semibold text-xs">Computing Shapley Additive Explanations...</p>
              <p className="text-slate-500 text-[11px] mt-0.5">Calculating game-theoretic feature attribution</p>
            </div>
          </div>
        )}

        {!isLoading && shapData.length === 0 && (
          <div className="flex flex-col items-center gap-4 text-center px-4 py-6">
            <div className="relative w-28 h-28 rounded-full border border-purple-500/30 flex items-center justify-center overflow-hidden bg-slate-900/80 shadow-inner">
              <div className="absolute inset-0 bg-purple-500/5 animate-pulse" />
              <div 
                className="absolute w-[150%] h-[150%] bg-gradient-to-b from-transparent to-purple-500/30 origin-bottom animate-scan" 
                style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)', animationDelay: '0.5s' }} 
              />
              <BrainCircuit className="w-9 h-9 text-purple-400 z-10" />
            </div>
            <div>
              <p className="text-slate-200 font-bold text-sm">Awaiting Evaluation Payload</p>
              <p className="text-slate-400 text-xs px-2 mt-1 max-w-xs leading-relaxed">
                SHAP feature contribution values decompose the LightGBM decision score for full regulatory compliance and auditability.
              </p>
            </div>
          </div>
        )}

        {!isLoading && shapData.length > 0 && viewMode === 'chart' && (
          <div className="flex flex-col h-full justify-between gap-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-400 font-medium">Feature Attribution Vector</span>
                <div className="flex items-center gap-3 text-[11px]">
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-sm bg-crimson" />
                    <span className="text-slate-400">Risk (+)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-sm bg-neon" />
                    <span className="text-slate-400">Safe (-)</span>
                  </div>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={shapData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 15, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    tickFormatter={v => `${(v * 100).toFixed(0)}%`}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={{ stroke: '#334155' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="feature"
                    width={110}
                    tick={{ fill: '#cbd5e1', fontSize: 10, fontWeight: 500 }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={{ stroke: '#334155' }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#334155', opacity: 0.25 }} />
                  <ReferenceLine x={0} stroke="#475569" strokeWidth={1.5} />
                  <Bar dataKey="impact" radius={[0, 4, 4, 0]} maxBarSize={20}>
                    {shapData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.impact > 0 ? '#DC143C' : '#39FF14'}
                        fillOpacity={0.9}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Diagnostic Footer */}
            <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[11px] text-slate-500">
                Method: TreeSHAP Exact Partitioning
              </span>
              <span className="text-purple-400 font-semibold flex items-center gap-1 text-[11px]">
                <Sparkles className="w-3 h-3" /> Explainable AI
              </span>
            </div>
          </div>
        )}

        {!isLoading && shapData.length > 0 && viewMode === 'ai' && (
          <div className="flex flex-col gap-4 py-2 animate-fade-in text-xs">
            {/* Top Summary */}
            <div className="p-3 bg-purple-950/20 border border-purple-800/40 rounded-xl">
              <p className="font-semibold text-purple-200 flex items-center gap-1.5 mb-1 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Automated Forensic Narrative
              </p>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {narrative?.summary}
              </p>
            </div>

            {/* Risk Drivers */}
            {narrative?.riskDrivers.length > 0 && (
              <div className="space-y-1.5">
                <span className="font-bold text-red-400 text-[11px] uppercase tracking-wider flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Key Fraud Drivers (+)
                </span>
                <div className="space-y-1">
                  {narrative.riskDrivers.map((d, i) => (
                    <div key={i} className="p-2 bg-slate-950/60 rounded-lg border border-red-900/30 flex justify-between items-center">
                      <span className="text-slate-200 font-medium">{d.feature}</span>
                      <span className="text-crimson font-mono font-bold">+{(d.impact * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trust Drivers */}
            {narrative?.trustDrivers.length > 0 && (
              <div className="space-y-1.5">
                <span className="font-bold text-green-400 text-[11px] uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Mitigating Trust Signals (-)
                </span>
                <div className="space-y-1">
                  {narrative.trustDrivers.map((d, i) => (
                    <div key={i} className="p-2 bg-slate-950/60 rounded-lg border border-green-900/30 flex justify-between items-center">
                      <span className="text-slate-200 font-medium">{d.feature}</span>
                      <span className="text-neon font-mono font-bold">{(d.impact * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
