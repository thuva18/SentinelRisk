import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, AreaChart, Dot
} from 'recharts';
import { TrendingUp } from 'lucide-react';

const CustomDot = (props) => {
  const { cx, cy, payload } = props;
  const prob = payload.probability;
  const color = prob >= 0.8 ? '#DC143C' : prob >= 0.5 ? '#F59E0B' : '#39FF14';
  return <circle cx={cx} cy={cy} r={4} fill={color} stroke="#0f172a" strokeWidth={1.5} />;
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    const prob = d.probability;
    const color = prob >= 0.8 ? '#DC143C' : prob >= 0.5 ? '#F59E0B' : '#39FF14';
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl text-xs">
        <p className="text-slate-400 mb-1 truncate max-w-[140px]">{d.merchant}</p>
        <p className="text-white font-semibold">${d.amount?.toFixed(2)}</p>
        <p className="font-bold mt-1" style={{ color }}>
          {(prob * 100).toFixed(1)}% — {d.prediction}
        </p>
      </div>
    );
  }
  return null;
};

export default function TrendChart({ trendData }) {
  if (trendData.length === 0) {
    return (
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Fraud Probability Trend</h3>
          </div>
          <span className="text-xs text-slate-500">Last 20 evaluations</span>
        </div>
        <div className="flex items-center justify-center h-24 text-slate-600 text-sm">
          Evaluate transactions to see the trend →
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Fraud Probability Trend</h3>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-neon" />
            <span className="text-slate-400">Safe</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-slate-400">Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-crimson" />
            <span className="text-slate-400">Fraud</span>
          </div>
          <span className="text-slate-500">Last {trendData.length} evaluations</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={130}>
        <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="probGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="index"
            tick={{ fill: '#475569', fontSize: 9 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 1]}
            tickFormatter={v => `${(v * 100).toFixed(0)}%`}
            tick={{ fill: '#475569', fontSize: 9 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          {/* Threshold lines */}
          <ReferenceLine y={0.5} stroke="#F59E0B" strokeDasharray="4 4" strokeWidth={1} opacity={0.6} />
          <ReferenceLine y={0.8} stroke="#DC143C" strokeDasharray="4 4" strokeWidth={1} opacity={0.6} />
          <Area
            type="monotone"
            dataKey="probability"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#probGradient)"
            dot={<CustomDot />}
            activeDot={{ r: 6, fill: '#3b82f6', stroke: '#0f172a', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
