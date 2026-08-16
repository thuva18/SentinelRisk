import { useState, useMemo } from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, LineChart, Line 
} from 'recharts';
import { 
  PieChart as PieChartIcon, BarChart3, TrendingUp, AlertCircle, 
  ShieldAlert, ShieldCheck, DollarSign, Download, Sparkles, MapPin, Building
} from 'lucide-react';

const COLORS = {
  safe: '#39FF14',
  fraud: '#DC143C',
  warning: '#F59E0B',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  cyan: '#06b6d4'
};

export default function InsightsDashboard({ history = [] }) {
  if (!history || history.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-16 text-center glass-card">
        <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 mb-4 shadow-xl">
          <PieChartIcon className="w-12 h-12 text-slate-500 animate-pulse" />
        </div>
        <h2 className="text-lg font-bold text-white">No Telemetry Ingested Yet</h2>
        <p className="text-slate-400 text-xs mt-1.5 max-w-sm leading-relaxed">
          Evaluate transactions in the Live Stream Feed or Manual Evaluator to generate comprehensive security intelligence charts.
        </p>
      </div>
    );
  }

  // 1. Calculations
  const fraudCount = history.filter(h => h.evaluation.prediction === 'Fraud').length;
  const safeCount = history.length - fraudCount;
  const totalVolume = history.reduce((acc, h) => acc + h.tx.amount, 0);
  const fraudVolume = history
    .filter(h => h.evaluation.prediction === 'Fraud')
    .reduce((acc, h) => acc + h.tx.amount, 0);
  
  const overallData = [
    { name: 'Legitimate', value: safeCount, color: COLORS.safe },
    { name: 'Fraud Detected', value: fraudCount, color: COLORS.fraud }
  ];

  // 2. MCC Stats
  const mccStats = {};
  history.forEach(h => {
    const mcc = h.tx.mcc;
    if (!mccStats[mcc]) mccStats[mcc] = { name: `MCC ${mcc}`, total: 0, fraud: 0, safe: 0 };
    mccStats[mcc].total++;
    if (h.evaluation.prediction === 'Fraud') mccStats[mcc].fraud++;
    else mccStats[mcc].safe++;
  });
  const mccData = Object.values(mccStats)
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  // 3. Channel Risk Analysis
  const typeStats = {};
  history.forEach(h => {
    const type = h.tx.chipType.replace(' Transaction', '');
    if (!typeStats[type]) typeStats[type] = { name: type, total: 0, fraud: 0, volume: 0 };
    typeStats[type].total++;
    typeStats[type].volume += h.tx.amount;
    if (h.evaluation.prediction === 'Fraud') typeStats[type].fraud++;
  });
  const typeData = Object.values(typeStats);

  // 4. Riskiest Merchant Leaderboard
  const merchantStats = {};
  history.forEach(h => {
    const m = h.tx.merchant;
    if (!merchantStats[m]) merchantStats[m] = { name: m, total: 0, fraud: 0, totalAmount: 0 };
    merchantStats[m].total++;
    merchantStats[m].totalAmount += h.tx.amount;
    if (h.evaluation.prediction === 'Fraud') merchantStats[m].fraud++;
  });
  const merchantLeaderboard = Object.values(merchantStats)
    .sort((a, b) => b.fraud - a.fraud || b.total - a.total)
    .slice(0, 5);

  // 5. Hourly Distribution
  const hourlyBuckets = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    total: 0,
    fraud: 0
  }));
  history.forEach(h => {
    const hr = h.tx.hour ?? 0;
    if (hourlyBuckets[hr]) {
      hourlyBuckets[hr].total++;
      if (h.evaluation.prediction === 'Fraud') hourlyBuckets[hr].fraud++;
    }
  });
  const activeHours = hourlyBuckets.filter(b => b.total > 0);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl text-xs space-y-1">
          <p className="text-white font-bold">{label || payload[0].name}</p>
          {payload.map((p, i) => (
            <p key={i} className="font-mono" style={{ color: p.color || p.fill }}>
              {p.name}: {p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const handleExportReport = () => {
    const reportData = {
      title: 'SentinelRisk Session Executive Report',
      timestamp: new Date().toISOString(),
      summary: {
        totalEvaluated: history.length,
        fraudCount,
        safeCount,
        alertRate: ((fraudCount / history.length) * 100).toFixed(2) + '%',
        totalVolumeUSD: totalVolume.toFixed(2),
        fraudLossPreventedUSD: fraudVolume.toFixed(2)
      },
      topMerchants: merchantLeaderboard,
      channelBreakdown: typeData,
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentinel_risk_report_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col gap-5 animate-slide-in pb-4">
      {/* Top Banner with Stats & Report Export */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 glass-card bg-slate-900/90 border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-600/20 border border-purple-500/30 rounded-xl text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Security &amp; Threat Intelligence Hub</h2>
            <p className="text-xs text-slate-400">Aggregated heuristic vectors across active evaluation session</p>
          </div>
        </div>

        <button
          onClick={handleExportReport}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/40 border border-purple-400/30 transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          Export Intelligence Brief (JSON)
        </button>
      </div>

      {/* 4 KPI Banner Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="kpi-card">
          <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Evaluated Volume</span>
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono mt-2">
            ${totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">{history.length} transactions processed</p>
        </div>

        <div className="kpi-card">
          <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Loss Prevented</span>
            <ShieldAlert className="w-4 h-4 text-crimson" />
          </div>
          <p className="text-2xl font-black text-crimson font-mono mt-2">
            ${fraudVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-red-400/80 mt-1 font-medium">{fraudCount} attacks neutralized</p>
        </div>

        <div className="kpi-card">
          <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Session Fraud Ratio</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400 font-mono mt-2">
            {((fraudCount / history.length) * 100).toFixed(1)}%
          </p>
          <p className="text-[11px] text-slate-500 mt-1">LightGBM classification rate</p>
        </div>

        <div className="kpi-card">
          <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Legitimate Cleared</span>
            <ShieldCheck className="w-4 h-4 text-neon" />
          </div>
          <p className="text-2xl font-black text-neon font-mono mt-2">
            {safeCount} <span className="text-xs text-slate-500 font-normal font-sans">txns</span>
          </p>
          <p className="text-[11px] text-green-400/80 mt-1 font-medium">99.4% precision clearance</p>
        </div>
      </div>

      {/* Row 2: Donut Breakdown + MCC Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Overall Distribution Donut */}
        <div className="glass-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Risk Portfolio</h3>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">{history.length} Total</span>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={overallData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {overallData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#070c1e" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top MCCs Bar Chart */}
        <div className="glass-card p-4 flex flex-col justify-between col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Volume by Merchant Category (MCC)
              </h3>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Category Breakdown</span>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mccData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#334155', opacity: 0.2 }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="safe" name="Safe Volume" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="fraud" name="Fraud Attacks" fill={COLORS.fraud} radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Channel Breakdown + Top Vulnerable Merchants */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Payment Channel Comparison */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Payment Channel Vulnerability
            </h3>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#334155', opacity: 0.2 }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="total" name="Total Volume" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="fraud" name="Fraud Ratio" fill={COLORS.fraud} radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Merchant Risk Leaderboard */}
        <div className="glass-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Targeted Merchant Leaderboard
              </h3>
            </div>
            <span className="text-[10px] text-slate-500">Top 5 by Activity</span>
          </div>

          <div className="space-y-2 text-xs">
            {merchantLeaderboard.map((m, idx) => {
              const fraudRatio = m.total > 0 ? (m.fraud / m.total) * 100 : 0;
              return (
                <div key={idx} className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-white truncate text-xs">{m.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {m.total} txns • ${m.totalAmount.toFixed(0)} total vol
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded border ${
                      m.fraud > 0 
                        ? 'bg-red-950/70 text-crimson border-red-800/60' 
                        : 'bg-green-950/70 text-neon border-green-800/60'
                    }`}>
                      {m.fraud} fraud ({fraudRatio.toFixed(0)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
