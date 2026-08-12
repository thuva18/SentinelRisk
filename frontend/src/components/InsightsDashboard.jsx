import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PieChart as PieChartIcon, BarChart3, TrendingUp, AlertCircle } from 'lucide-react';

const COLORS = {
  safe: '#39FF14',
  fraud: '#DC143C',
  warning: '#F59E0B'
};

export default function InsightsDashboard({ history }) {
  if (!history || history.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <PieChartIcon className="w-16 h-16 text-slate-700 mb-4" />
        <h2 className="text-xl font-bold text-slate-300">No Data Available</h2>
        <p className="text-slate-500 mt-2 max-w-md">Evaluate transactions in the Live Feed or Manual Check to generate session insights.</p>
      </div>
    );
  }

  // 1. Overall Fraud vs Safe
  const fraudCount = history.filter(h => h.evaluation.prediction === 'Fraud').length;
  const safeCount = history.length - fraudCount;
  const overallData = [
    { name: 'Legitimate', value: safeCount, color: COLORS.safe },
    { name: 'Fraud', value: fraudCount, color: COLORS.fraud }
  ];

  // 2. Fraud by MCC
  const mccStats = {};
  history.forEach(h => {
    const mcc = h.tx.mcc;
    if (!mccStats[mcc]) mccStats[mcc] = { name: String(mcc), total: 0, fraud: 0 };
    mccStats[mcc].total++;
    if (h.evaluation.prediction === 'Fraud') mccStats[mcc].fraud++;
  });
  const mccData = Object.values(mccStats)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5); // top 5 MCCs

  // 3. Fraud by Chip Type
  const typeStats = {};
  history.forEach(h => {
    const type = h.tx.chipType.replace(' Transaction', '');
    if (!typeStats[type]) typeStats[type] = { name: type, total: 0, fraud: 0 };
    typeStats[type].total++;
    if (h.evaluation.prediction === 'Fraud') typeStats[type].fraud++;
  });
  const typeData = Object.values(typeStats);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl text-xs">
          <p className="text-slate-300 font-semibold mb-1">{label || payload[0].name}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ color: p.color || p.fill }}>
              {p.name}: {p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex-1 flex flex-col gap-6 animate-slide-in">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="w-5 h-5 text-purple-400" />
        <h2 className="text-lg font-bold text-white">Session Insights</h2>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Overall Distribution */}
        <div className="glass-card p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Overall Distribution</h3>
          </div>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={overallData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {overallData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top MCCs */}
        <div className="glass-card p-5 flex flex-col col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Top Merchant Categories (MCC)</h3>
          </div>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mccData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#334155', opacity: 0.3 }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="total" name="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="fraud" name="Fraud" fill={COLORS.fraud} radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* By Transaction Type */}
        <div className="glass-card p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">By Transaction Type</h3>
          </div>
          <div className="flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#334155', opacity: 0.3 }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="total" name="Total" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                <Bar dataKey="fraud" name="Fraud" fill={COLORS.fraud} radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Key Takeaways */}
        <div className="glass-card p-5 flex flex-col">
           <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Session Summary</h3>
          </div>
          <div className="flex flex-col gap-4">
            <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
              <p className="text-sm text-slate-300">
                <span className="font-bold text-white text-lg">{history.length}</span> total transactions analyzed in this session.
              </p>
            </div>
            <div className="p-4 bg-red-900/10 rounded-lg border border-red-900/30">
              <p className="text-sm text-slate-300">
                <span className="font-bold text-crimson text-lg">{fraudCount}</span> high-risk transactions flagged.
              </p>
            </div>
            <div className="p-4 bg-green-900/10 rounded-lg border border-green-900/30">
              <p className="text-sm text-slate-300">
                <span className="font-bold text-neon text-lg">{safeCount}</span> legitimate transactions approved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
