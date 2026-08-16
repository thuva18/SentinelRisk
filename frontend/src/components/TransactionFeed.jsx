import { useState, useMemo } from 'react';
import { CreditCard, Wifi, Layers, Search, Play, Pause, Zap, Filter, ShieldCheck, ShieldAlert, ArrowUpDown } from 'lucide-react';

const CHIP_ICONS = {
  'Chip Transaction': Layers,
  'Online Transaction': Wifi,
  'Swipe Transaction': CreditCard,
};

export default function TransactionFeed({
  transactions,
  selectedTx,
  onSelect,
  isStreaming,
  onToggleStream,
  streamSpeed,
  onChangeSpeed,
  onTriggerSpike,
  evaluatedMap = {},
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'ONLINE' | 'CHIP' | 'SWIPE' | 'ERRORS'

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Text search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        tx.merchant.toLowerCase().includes(q) || 
        tx.city.toLowerCase().includes(q) || 
        tx.card.toLowerCase().includes(q) ||
        tx.id.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Type filter
      if (filterType === 'ONLINE') return tx.chipType === 'Online Transaction';
      if (filterType === 'CHIP') return tx.chipType === 'Chip Transaction';
      if (filterType === 'SWIPE') return tx.chipType === 'Swipe Transaction';
      if (filterType === 'ERRORS') return Boolean(tx.errorType);

      return true;
    });
  }, [transactions, searchQuery, filterType]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Stream Controls Bar */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/40 flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Play/Pause & Speed */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleStream}
              className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
                isStreaming
                  ? 'bg-emerald-950/50 border-emerald-600/60 text-emerald-400 hover:bg-emerald-900/60'
                  : 'bg-amber-950/50 border-amber-600/60 text-amber-400 hover:bg-amber-900/60'
              }`}
              title={isStreaming ? 'Pause real-time stream' : 'Resume live stream'}
            >
              {isStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isStreaming ? 'Live' : 'Paused'}</span>
            </button>

            {/* Speed Selector */}
            <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[11px] font-mono">
              {[
                { label: '1x', val: 3500 },
                { label: '2x', val: 1800 },
                { label: '5x', val: 800 },
              ].map(s => (
                <button
                  key={s.label}
                  onClick={() => onChangeSpeed(s.val)}
                  className={`px-2 py-0.5 rounded transition-all ${
                    streamSpeed === s.val
                      ? 'bg-blue-600 text-white font-bold shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Trigger Spike */}
          <button
            onClick={onTriggerSpike}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-red-600/30 to-amber-600/30 border border-red-500/50 text-red-300 hover:from-red-600/50 hover:to-amber-600/50 transition-all shadow-sm group"
            title="Simulate sudden wave of high-risk suspicious fraud transactions"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 group-hover:animate-bounce" />
            <span>Spike Attack</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search merchant, card, city..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 rounded-lg pl-8 pr-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-all"
            />
          </div>
          <span className="text-[11px] font-mono text-slate-500 shrink-0">
            {filteredTransactions.length} txns
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1 overflow-x-auto pb-0.5 text-[11px]">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'ONLINE', label: 'Online' },
            { id: 'CHIP', label: 'Chip' },
            { id: 'SWIPE', label: 'Swipe' },
            { id: 'ERRORS', label: '⚠️ Errors' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-all ${
                filterType === tab.id
                  ? 'bg-blue-600/40 text-blue-300 border border-blue-500/60 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
            <Filter className="w-8 h-8 text-slate-700 mb-2" />
            <p className="text-xs">No transactions match the active filter</p>
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const Icon = CHIP_ICONS[tx.chipType] || CreditCard;
            const isSelected = selectedTx?.id === tx.id;
            const evalResult = evaluatedMap[tx.id];

            return (
              <div
                key={tx.id}
                className={`feed-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelect(tx)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 border transition-all ${
                      evalResult?.prediction === 'Fraud'
                        ? 'bg-red-950/60 border-red-600/60 text-crimson'
                        : evalResult?.prediction === 'Legitimate'
                        ? 'bg-green-950/60 border-green-600/60 text-neon'
                        : 'bg-slate-800 border-slate-700/60 text-blue-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-white truncate">{tx.merchant}</p>
                        {tx.isSpike && (
                          <span className="text-[9px] bg-red-950 text-red-400 border border-red-800 px-1 rounded font-mono uppercase">
                            Spike
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-slate-400 truncate">{tx.card}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-white font-mono">${tx.amount.toFixed(2)}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{tx.timestamp}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/60 text-[11px]">
                  <span className="text-slate-400 truncate max-w-[120px]">{tx.city}</span>

                  <div className="flex items-center gap-1.5">
                    {tx.errorType && (
                      <span className="text-[10px] bg-red-950/70 text-red-400 border border-red-800/60 px-1.5 py-0.2 rounded font-medium">
                        {tx.errorType}
                      </span>
                    )}

                    <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700/50 px-1.5 py-0.2 rounded">
                      {tx.chipType.replace(' Transaction', '')}
                    </span>

                    {/* Evaluated Pill */}
                    {evalResult && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border flex items-center gap-0.5 ${
                        evalResult.prediction === 'Fraud'
                          ? 'bg-red-950 text-crimson border-red-700/60'
                          : 'bg-green-950 text-neon border-green-700/60'
                      }`}>
                        {evalResult.prediction === 'Fraud' ? (
                          <ShieldAlert className="w-2.5 h-2.5" />
                        ) : (
                          <ShieldCheck className="w-2.5 h-2.5" />
                        )}
                        {(evalResult.fraud_probability * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Instructions */}
      <div className="p-2 border-t border-slate-800 bg-slate-950/40">
        <p className="text-[11px] text-slate-500 text-center font-medium">
          ⚡ Click any item to run instant LightGBM inference
        </p>
      </div>
    </div>
  );
}
