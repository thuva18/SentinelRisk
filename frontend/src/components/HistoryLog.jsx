import { useState, useMemo } from 'react';
import { 
  Download, History, ChevronUp, ChevronDown, Search, Filter, 
  Trash2, Eye, ShieldAlert, ShieldCheck, FileSpreadsheet, Sparkles, X
} from 'lucide-react';

function exportCSV(history) {
  const headers = [
    'Evaluation Index', 'Transaction ID', 'Merchant', 'Amount (USD)', 'Time', 
    'Channel Type', 'MCC', 'Terminal Error', 'Fraud Probability (%)', 'Verdict', 
    'Primary SHAP Driver', 'SHAP Attribution Impact', 'Model Inference Mode'
  ];
  
  const rows = history.map(({ tx, evaluation, index }) => {
    const topShap = evaluation.shap_values?.[0];
    return [
      index,
      tx.id,
      `"${tx.merchant.replace(/"/g, '""')}"`,
      tx.amount.toFixed(2),
      tx.timestamp,
      tx.chipType,
      tx.mcc,
      tx.errorType || 'None',
      (evaluation.fraud_probability * 100).toFixed(2) + '%',
      evaluation.prediction,
      topShap ? `"${topShap.feature}"` : 'N/A',
      topShap ? (topShap.impact * 100).toFixed(2) + '%' : '0%',
      evaluation.model_mode,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `sentinel_risk_forensics_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const VERDICT_COLORS = {
  Fraud: { text: 'text-crimson', bg: 'bg-red-950/60 border-red-700/60' },
  Legitimate: { text: 'text-neon', bg: 'bg-green-950/60 border-green-700/60' },
};

export default function HistoryLog({ history = [], onClearHistory, onInspectTx }) {
  const [sortField, setSortField] = useState('index');
  const [sortDir, setSortDir] = useState('desc');
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'FRAUD' | 'SAFE'
  const [inspectModalTx, setInspectModalTx] = useState(null);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      // Status filter
      if (statusFilter === 'FRAUD' && item.evaluation.prediction !== 'Fraud') return false;
      if (statusFilter === 'SAFE' && item.evaluation.prediction === 'Fraud') return false;

      // Text query
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.tx.merchant.toLowerCase().includes(q) ||
        item.tx.id.toLowerCase().includes(q) ||
        item.tx.card.toLowerCase().includes(q) ||
        item.tx.city.toLowerCase().includes(q)
      );
    });
  }, [history, statusFilter, searchQuery]);

  const sorted = useMemo(() => {
    return [...filteredHistory].sort((a, b) => {
      let aVal, bVal;
      if (sortField === 'index') { aVal = a.index; bVal = b.index; }
      else if (sortField === 'amount') { aVal = a.tx.amount; bVal = b.tx.amount; }
      else if (sortField === 'probability') { aVal = a.evaluation.fraud_probability; bVal = b.evaluation.fraud_probability; }
      else { aVal = a.tx.merchant; bVal = b.tx.merchant; }
      
      if (typeof aVal === 'string') return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [filteredHistory, sortField, sortDir]);

  // Aggregate metrics
  const totalVolume = history.reduce((acc, h) => acc + h.tx.amount, 0);
  const fraudCount = history.filter(h => h.evaluation.prediction === 'Fraud').length;
  const fraudPrevented = history
    .filter(h => h.evaluation.prediction === 'Fraud')
    .reduce((acc, h) => acc + h.tx.amount, 0);

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 opacity-20" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-blue-400" />
      : <ChevronDown className="w-3 h-3 text-blue-400" />;
  };

  const ColHeader = ({ field, label }) => (
    <th
      className="px-3.5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white select-none whitespace-nowrap"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1.5">
        {label}
        <SortIcon field={field} />
      </div>
    </th>
  );

  return (
    <div className="glass-card overflow-hidden">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/40 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-400">
            <History className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Evaluation Audit Trail</h3>
              <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded-full border border-slate-700">
                {history.length} records
              </span>
            </div>
          </div>
        </div>

        {/* Financial Summary Badges */}
        {history.length > 0 && (
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-400">
              Total Volume: <span className="text-white font-bold">${totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="bg-red-950/40 px-2.5 py-1 rounded-lg border border-red-900/50 text-red-300">
              Loss Prevented: <span className="font-bold text-crimson">${fraudPrevented.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <>
              <button
                onClick={() => exportCSV(history)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg transition-all shadow-sm"
                title="Download CSV report"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                Export CSV
              </button>

              {onClearHistory && (
                <button
                  onClick={onClearHistory}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg border border-transparent hover:border-red-800 transition-all"
                  title="Clear history session"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}

          <button
            onClick={() => setCollapsed(c => !c)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Sub-header Filter & Search Bar */}
          {history.length > 0 && (
            <div className="px-5 py-2.5 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-1 max-w-sm">
                <div className="relative w-full">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search merchant, card, city..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60"
                  />
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-[11px]">
                {[
                  { id: 'ALL', label: `All (${history.length})` },
                  { id: 'FRAUD', label: `🚨 Fraud (${fraudCount})` },
                  { id: 'SAFE', label: `🛡️ Legitimate (${history.length - fraudCount})` },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                      statusFilter === tab.id
                        ? 'bg-blue-600 text-white font-bold shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History className="w-10 h-10 text-slate-700 mb-3" />
              <p className="text-slate-400 text-xs font-semibold">Audit log is currently empty</p>
              <p className="text-slate-600 text-[11px] mt-1">
                Evaluate live stream items or enter manual transactions to record auditable verdicts.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 z-10">
                  <tr>
                    <ColHeader field="index" label="#" />
                    <ColHeader field="merchant" label="Merchant" />
                    <ColHeader field="amount" label="Amount" />
                    <th className="px-3.5 py-3 text-left font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Timestamp</th>
                    <th className="px-3.5 py-3 text-left font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Channel</th>
                    <ColHeader field="probability" label="Fraud Score" />
                    <th className="px-3.5 py-3 text-left font-bold text-slate-400 uppercase tracking-wider">Verdict</th>
                    <th className="px-3.5 py-3 text-left font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Primary Feature Signal</th>
                    <th className="px-3.5 py-3 text-right font-bold text-slate-400 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {sorted.map(({ tx, evaluation, index }) => {
                    const prob = evaluation.fraud_probability;
                    const probColor = prob >= 0.8 ? '#DC143C' : prob >= 0.5 ? '#F59E0B' : '#39FF14';
                    const verdict = VERDICT_COLORS[evaluation.prediction] || VERDICT_COLORS.Legitimate;
                    const topShap = evaluation.shap_values?.[0];

                    return (
                      <tr 
                        key={tx.id + '-' + index} 
                        className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                        onClick={() => {
                          setInspectModalTx({ tx, evaluation, index });
                          if (onInspectTx) onInspectTx(tx, evaluation);
                        }}
                      >
                        <td className="px-3.5 py-2.5 text-slate-500 font-mono">{index}</td>
                        <td className="px-3.5 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-white font-semibold">{tx.merchant}</span>
                            {tx.errorType && (
                              <span className="text-[10px] bg-red-950 text-red-400 border border-red-800/60 px-1 rounded">
                                {tx.errorType}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">{tx.card} • {tx.city}</span>
                        </td>
                        <td className="px-3.5 py-2.5 text-white font-bold font-mono text-xs">
                          ${tx.amount.toFixed(2)}
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-400 font-mono">{tx.timestamp}</td>
                        <td className="px-3.5 py-2.5 text-slate-300 whitespace-nowrap">
                          {tx.chipType?.replace(' Transaction', '') || 'Online'}
                        </td>
                        <td className="px-3.5 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-14 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${prob * 100}%`, backgroundColor: probColor }}
                              />
                            </div>
                            <span className="font-bold font-mono" style={{ color: probColor }}>
                              {(prob * 100).toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5">
                          <span className={`font-bold px-2 py-0.5 rounded-full border text-[10px] ${verdict.bg} ${verdict.text}`}>
                            {evaluation.prediction}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-300">
                          {topShap ? (
                            <span className={`font-mono text-[11px] ${topShap.impact > 0 ? 'text-red-400' : 'text-green-400'}`}>
                              {topShap.feature.replace('Use Chip_', '').replace('Errors?_', '').replace('_', ' ')}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-3.5 py-2.5 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectModalTx({ tx, evaluation, index });
                              if (onInspectTx) onInspectTx(tx, evaluation);
                            }}
                            className="p-1 text-slate-500 hover:text-blue-400 rounded hover:bg-slate-800 transition-colors"
                            title="Inspect in modal"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
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

      {/* Forensic Inspection Modal */}
      {inspectModalTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-in">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-purple-400" />
                <h4 className="text-sm font-bold text-white">Transaction Forensic Dossier #{inspectModalTx.index}</h4>
              </div>
              <button
                onClick={() => setInspectModalTx(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-mono">Merchant &amp; Card</p>
                  <p className="font-bold text-white text-sm">{inspectModalTx.tx.merchant}</p>
                  <p className="text-slate-400 font-mono text-[11px]">{inspectModalTx.tx.card} • {inspectModalTx.tx.city}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 uppercase font-mono">Amount</p>
                  <p className="font-bold text-white text-base font-mono">${inspectModalTx.tx.amount.toFixed(2)}</p>
                </div>
              </div>

              {/* Verdict Summary */}
              <div className="flex justify-between items-center bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div>
                  <p className="text-slate-400">Model Fraud Probability:</p>
                  <p className="text-lg font-black font-mono" style={{
                    color: inspectModalTx.evaluation.fraud_probability >= 0.5 ? '#DC143C' : '#39FF14'
                  }}>
                    {(inspectModalTx.evaluation.fraud_probability * 100).toFixed(2)}%
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full font-bold border text-xs ${
                  inspectModalTx.evaluation.prediction === 'Fraud'
                    ? 'bg-red-950 text-crimson border-red-800'
                    : 'bg-green-950 text-neon border-green-800'
                }`}>
                  {inspectModalTx.evaluation.prediction}
                </span>
              </div>

              {/* SHAP Feature Contribution List */}
              <div>
                <p className="font-bold text-slate-400 uppercase tracking-wider mb-2 text-[10px]">
                  SHAP Factor Contributions
                </p>
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {inspectModalTx.evaluation.shap_values?.map((sv, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-slate-950/40 rounded-lg border border-slate-800/80">
                      <span className="text-slate-300 font-mono text-[11px]">{sv.feature}</span>
                      <span className={`font-mono font-bold ${sv.impact > 0 ? 'text-crimson' : 'text-neon'}`}>
                        {sv.impact > 0 ? '+' : ''}{(sv.impact * 100).toFixed(2)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectModalTx(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
