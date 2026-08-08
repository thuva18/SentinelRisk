import { CreditCard, Wifi, Layers } from 'lucide-react';

const CHIP_ICONS = {
  'Chip Transaction': Layers,
  'Online Transaction': Wifi,
  'Swipe Transaction': CreditCard,
};

export default function TransactionFeed({ transactions, selectedTx, onSelect, embedded }) {
  const inner = (
    <>
      {!embedded && (
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <h2 className="font-semibold text-white text-sm">Live Transaction Feed</h2>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-neon animate-pulse" />
            <span className="text-xs text-slate-400">{transactions.length} active</span>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {transactions.map((tx) => {
          const Icon = CHIP_ICONS[tx.chipType] || CreditCard;
          const isSelected = selectedTx?.id === tx.id;
          return (
            <div
              key={tx.id}
              className={`feed-item ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(tx)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 bg-slate-700 rounded-md shrink-0">
                    <Icon className="w-3.5 h-3.5 text-blue-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{tx.merchant}</p>
                    <p className="text-xs text-slate-400 truncate">{tx.card}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-white">${tx.amount.toFixed(2)}</p>
                  <p className="text-xs text-slate-500">{tx.timestamp}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs text-slate-500 truncate">{tx.city}</span>
                <div className="flex items-center gap-1">
                  {tx.errorType && (
                    <span className="text-xs bg-red-900/40 text-red-400 px-1.5 py-0.5 rounded font-medium">
                      {tx.errorType}
                    </span>
                  )}
                  <span className="text-xs bg-slate-700/60 text-slate-400 px-1.5 py-0.5 rounded">
                    {tx.chipType.replace(' Transaction', '')}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="p-3 border-t border-slate-700/50">
        <p className="text-xs text-slate-500 text-center">Click any transaction to analyze →</p>
      </div>
    </>
  );

  if (embedded) return <div className="flex flex-col flex-1 overflow-hidden">{inner}</div>;
  return <div className="glass-card flex flex-col h-full max-h-[680px]">{inner}</div>;
}
