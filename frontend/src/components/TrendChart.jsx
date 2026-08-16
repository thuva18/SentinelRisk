import { useState } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, AreaChart
} from 'recharts';
import { TrendingUp, Activity, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

const CustomDot = (props) => {
  const { cx, cy, payload } = props;
  const prob = payload.probability;
  const color = prob >= 0.8 ? '#DC143C' : prob >= 0.5 ? '#F59E0B' : '#39FF14';
  return (
    <circle 
      cx={cx} 
      cy={cy} 
      r={4} 
      fill={color} 
      stroke="#0b132b" 
      strokeWidth={2}
      className="transition-all duration-200 hover:r-6" 
    />
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    const prob = d.probability;
    const isFraud = d.prediction === 'Fraud';
    const color = prob >= 0.8 ? '#DC143C' : prob >= 0.5 ? '#F59E0B' : '#39FF14';

    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl text-xs space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="font-bold text-white truncate max-w-[150px]">{d.merchant}</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
            isFraud ? 'bg-red-950 text-crimson border-red-800' : 'bg-green-950 text-neon border-green-800'
          }`}>
            {d.prediction}
          </span>
        </div>
        <p className="text-slate-400 font-mono">${d.amount?.toFixed(2)}</p>
        <div className="pt-1 border-t border-slate-800 flex justify-between items-center">
          <span className="text-[11px] text-slate-400">Fraud Score:</span>
          <span className="font-bold font-mono text-sm" style={{ color }}>
            {(prob * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export default function TrendChart({ trendData = [] }) {
  const [viewCount, setViewCount] = useState(20); // 10 | 20 | 50

  const visibleData = trendData.slice(-viewCount);

  // Calculate live stats
  const avgRisk = visibleData.length > 0
    ? (visibleData.reduce((acc, d) => acc + d.probability, 0) / visibleData.length * 100).toFixed(1)
    : 0;

  const peakRisk = visibleData.length > 0
    ? (Math.max(...visibleData.map(d => d.probability)) * 100).toFixed(1)
    : 0;

  if (trendData.length === 0) {
    return (
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Fraud Probability Stream Trend</h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Continuous Threat Radar</span>
        </div>
        <div className="flex items-center justify-center h-20 text-slate-500 text-xs gap-2">
          <Activity className="w-4 h-4 text-slate-600 animate-pulse" />
          <span>Stream radar idle. Evaluate incoming transactions to build real-time trend telemetry.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 space-y-3">
      {/* Header with KPI highlights & Span Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Real-Time Risk Velocity
            </h3>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="bg-slate-950/60 px-2.5 py-0.5 rounded-lg border border-slate-800 flex items-center gap-1.5">
              <span className="text-slate-500 text-[10px] uppercase">Mean Risk:</span>
              <span className={`font-bold ${parseFloat(avgRisk) > 50 ? 'text-amber-400' : 'text-neon'}`}>
                {avgRisk}%
              </span>
            </div>

            <div className="bg-slate-950/60 px-2.5 py-0.5 rounded-lg border border-slate-800 flex items-center gap-1.5">
              <span className="text-slate-500 text-[10px] uppercase">Peak:</span>
              <span className={`font-bold ${parseFloat(peakRisk) > 75 ? 'text-crimson' : 'text-slate-300'}`}>
                {peakRisk}%
              </span>
            </div>
          </div>
        </div>

        {/* Legend and Window Selector */}
        <div className="flex items-center gap-4 text-xs">
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-3 text-[11px]">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-neon" />
              <span className="text-slate-400">Safe (&lt;50%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-slate-400">Suspicious</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-crimson" />
              <span className="text-slate-400">Critical (&gt;80%)</span>
            </div>
          </div>

          {/* Span toggle */}
          <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-[11px] font-mono">
            {[10, 20, 50].map(cnt => (
              <button
                key={cnt}
                onClick={() => setViewCount(cnt)}
                className={`px-2 py-0.5 rounded transition-all ${
                  viewCount === cnt
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cnt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <ResponsiveContainer width="100%" height={125}>
        <AreaChart data={visibleData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
          <defs>
            <linearGradient id="probGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="index"
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={{ stroke: '#334155' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 1]}
            tickFormatter={v => `${(v * 100).toFixed(0)}%`}
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={{ stroke: '#334155' }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Reference Threshold Lines */}
          <ReferenceLine y={0.5} stroke="#F59E0B" strokeDasharray="3 3" strokeWidth={1} opacity={0.6} />
          <ReferenceLine y={0.8} stroke="#DC143C" strokeDasharray="3 3" strokeWidth={1} opacity={0.7} />
          
          <Area
            type="monotone"
            dataKey="probability"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#probGradient)"
            dot={<CustomDot />}
            activeDot={{ r: 6, fill: '#60a5fa', stroke: '#070c1e', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
