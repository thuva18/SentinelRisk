import { Download, History, ChevronUp, ChevronDown } from 'lucide-react';
import { useState } from 'react';

function exportCSV(history) {
  const headers = ['ID', 'Merchant', 'Amount (USD)', 'Time', 'Type', 'MCC', 'Error', 'Fraud %', 'Verdict', 'Top SHAP Feature', 'SHAP Impact', 'Model Mode'];
  const rows = history.map(({ tx, evaluation }) => {
    const topShap = evaluation.shap_values?.[0];
    return [
      tx.id,
      `"${tx.merchant}"`,
      tx.amount.toFixed(2),
      tx.timestamp,
      tx.chipType,
      tx.mcc,
      tx.errorType || 'None',
      (evaluation.fraud_probability * 100).toFixed(2) + '%',
      evaluation.prediction,
      topShap ? `"${topShap.feature}"` : '',
      topShap ? topShap.impact.toFixed(4) : '',
      evaluation.model_mode,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `sentinel_risk_session_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const VERDICT_COLORS = {
  Fraud: { text: 'text-crimson', bg: 'bg-red-900/30 border-red-700/40' },
  Legitimate: { text: 'text-neon', bg: 'bg-green-900/20 border-green-700/30' },
};

export default function HistoryLog({ history }) {
  const [sortField, setSortField] = useState('index');
  const [sortDir, setSortDir] = useState('desc');
  const [collapsed, setCollapsed] = useState(false);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sorted = [...history].sort((a, b) => {
    let aVal, bVal;
    if (sortField === 'index') { aVal = a.index; bVal = b.index; }
    else if (sortField === 'amount') { aVal = a.tx.amount; bVal = b.tx.amount; }
    else if (sortField === 'probability') { aVal = a.evaluation.fraud_probability; bVal = b.evaluation.fraud_probability; }
    else { aVal = a.tx.merchant; bVal = b.tx.merchant; }
    if (typeof aVal === 'string') return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 opacity-20" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-blue-400" />
      : <ChevronDown className="w-3 h-3 text-blue-400" />;
  };

  const ColHeader = ({ field, label }) => (
    <th
      className="px-3 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white select-none whitespace-nowrap"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        <SortIcon field={field} />
      </div>
    </th>
  );

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Session History</h3>
          <span className="text-xs bg-slate-700/60 text-slate-400 px-2 py-0.5 rounded-full">
            {history.length} evaluated
          </span>
          {history.filter(h => h.evaluation.prediction === 'Fraud').length > 0 && (
            <span className="text-xs bg-red-900/40 text-red-400 border border-red-700/40 px-2 py-0.5 rounded-full">
              {history.filter(h => h.evaluation.prediction === 'Fraud').length} fraud
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              onClick={() => exportCSV(history)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-600/60 border border-slate-600/40 px-3 py-1.5 rounded-lg transition-all duration-200"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="text-slate-500 hover:text-slate-300 p-1 transition-colors"
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <History className="w-10 h-10 text-slate-700 mb-3" />
              <p className="text-slate-500 text-sm">No transactions evaluated yet</p>
              <p className="text-slate-600 text-xs mt-1">Click a transaction in the feed or use Manual Check</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-800/90 backdrop-blur-sm border-b border-slate-700/50">
                  <tr>
                    <ColHeader field="index" label="#" />
                    <ColHeader field="merchant" label="Merchant" />
                    <ColHeader field="amount" label="Amount" />
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Time</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Type</th>
                    <ColHeader field="probability" label="Fraud %" />
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Verdict</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Top Signal</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Model</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {sorted.map(({ tx, evaluation, index }) => {
                    const prob = evaluation.fraud_probability;
                    const probColor = prob >= 0.8 ? '#DC143C' : prob >= 0.5 ? '#F59E0B' : '#39FF14';
                    const verdict = VERDICT_COLORS[evaluation.prediction] || VERDICT_COLORS.Legitimate;
                    const topShap = evaluation.shap_values?.[0];

                    return (
                      <tr key={tx.id} className="hover:bg-slate-700/20 transition-colors group">
                        <td className="px-3 py-2.5 text-slate-500 text-xs font-mono">{index}</td>
                        <td className="px-3 py-2.5">
                          <span className="text-white font-medium text-xs">{tx.merchant}</span>
                          {tx.errorType && (
                            <span className="ml-2 text-xs bg-red-900/30 text-red-400 px-1.5 py-0.5 rounded">
                              {tx.errorType}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-white font-bold text-xs">${tx.amount.toFixed(2)}</td>
                        <td className="px-3 py-2.5 text-slate-400 text-xs font-mono">{tx.timestamp}</td>
                        <td className="px-3 py-2.5 text-slate-400 text-xs whitespace-nowrap">
                          {tx.chipType?.replace(' Transaction', '') || '—'}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${prob * 100}%`, backgroundColor: probColor }}
                              />
                            </div>
                            <span className="text-xs font-bold" style={{ color: probColor }}>
                              {(prob * 100).toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${verdict.bg} ${verdict.text}`}>
                            {evaluation.prediction}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-400 text-xs">
                          {topShap ? (
                            <span className={topShap.impact > 0 ? 'text-red-400' : 'text-green-400'}>
                              {topShap.feature.replace('Use Chip_', '').replace('Errors?_', '')}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`text-xs font-mono ${evaluation.model_mode === 'live' ? 'text-neon' : 'text-slate-500'}`}>
                            {evaluation.model_mode}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
