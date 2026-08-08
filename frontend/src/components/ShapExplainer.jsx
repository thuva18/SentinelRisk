import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Loader2, BrainCircuit } from 'lucide-react';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    const isPositive = val > 0;
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl">
        <p className="text-xs text-slate-400 mb-1">{payload[0].payload.feature}</p>
        <p className={`text-sm font-bold ${isPositive ? 'text-crimson' : 'text-neon'}`}>
          {isPositive ? '+' : ''}{val.toFixed(4)}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {isPositive ? '↑ Increases fraud risk' : '↓ Reduces fraud risk'}
        </p>
      </div>
    );
  }
  return null;
};

export default function ShapExplainer({ evaluation, isLoading }) {
  const shapData = evaluation?.shap_values
    ? [...evaluation.shap_values]
        .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
        .slice(0, 8)
        .map(d => ({ ...d, feature: d.feature.replace('Use Chip_', '').replace('Errors?_', '').replace('_', ' ') }))
    : [];

  return (
    <div className="glass-card flex flex-col h-full max-h-[680px]">
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
        <h2 className="font-semibold text-white text-sm">SHAP Explainability</h2>
        <BrainCircuit className="w-4 h-4 text-purple-400" />
      </div>

      <div className="flex-1 flex flex-col justify-center p-4">
        {isLoading && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            <p className="text-slate-400 text-sm">Computing SHAP values...</p>
          </div>
        )}

        {!isLoading && shapData.length === 0 && (
          <div className="flex flex-col items-center gap-4 text-center px-4">
            <BrainCircuit className="w-12 h-12 text-slate-600" />
            <p className="text-slate-400 font-medium">No Explanation Yet</p>
            <p className="text-slate-500 text-sm">Select and analyze a transaction to see which features drove the model's decision.</p>
          </div>
        )}

        {!isLoading && shapData.length > 0 && (
          <>
            <div className="mb-3">
              <p className="text-xs text-slate-400 text-center">Feature impact on fraud probability</p>
              <div className="flex justify-center gap-6 mt-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#DC143C' }} />
                  <span className="text-xs text-slate-400">Fraud signal</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#39FF14' }} />
                  <span className="text-xs text-slate-400">Safe signal</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={shapData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickFormatter={v => v.toFixed(2)}
                  axisLine={{ stroke: '#475569' }}
                  tickLine={{ stroke: '#475569' }}
                />
                <YAxis
                  type="category"
                  dataKey="feature"
                  width={120}
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  axisLine={{ stroke: '#475569' }}
                  tickLine={{ stroke: '#475569' }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#334155', opacity: 0.3 }} />
                <ReferenceLine x={0} stroke="#475569" strokeWidth={2} />
                <Bar dataKey="impact" radius={[0, 3, 3, 0]} maxBarSize={22}>
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
            <div className="mt-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/30">
              <p className="text-xs text-slate-500 text-center">
                Base rate: {evaluation?.model_mode === 'live' ? 'LightGBM TreeExplainer' : 'Approximate SHAP (mock mode)'}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
