import { useState } from 'react';
import { Search, RotateCcw, Loader2 } from 'lucide-react';

const CHIP_OPTIONS = [
  { label: 'Chip Transaction', value: 'chip' },
  { label: 'Swipe Transaction', value: 'swipe' },
  { label: 'Online Transaction', value: 'online' },
];

const ERROR_OPTIONS = [
  { label: 'None', value: 'none' },
  { label: 'Bad PIN', value: 'bad_pin' },
  { label: 'Insufficient Balance', value: 'insufficient' },
  { label: 'Technical Glitch', value: 'glitch' },
];

const MCC_OPTIONS = [
  { label: '5411 — Grocery Stores', value: 5411 },
  { label: '5812 — Restaurants', value: 5812 },
  { label: '5541 — Gas Stations', value: 5541 },
  { label: '5999 — Misc Retail', value: 5999 },
  { label: '5734 — Electronics', value: 5734 },
  { label: '4816 — Online Services', value: 4816 },
  { label: '7011 — Hotels', value: 7011 },
  { label: '5912 — Drug Stores', value: 5912 },
  { label: '4511 — Airlines', value: 4511 },
];

const DEFAULT_FORM = {
  amount: '',
  hour: new Date().getHours(),
  minute: new Date().getMinutes(),
  chipType: 'online',
  mcc: 5999,
  errorType: 'none',
  merchant: '',
};

export default function ManualCheck({ onAnalyze, isLoading }) {
  const [form, setForm] = useState(DEFAULT_FORM);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) return;

    const tx = {
      id: `MANUAL-${Date.now()}`,
      merchant: form.merchant || 'Manual Entry',
      city: 'Manual Check',
      amount,
      chipType: CHIP_OPTIONS.find(c => c.value === form.chipType)?.label || 'Online Transaction',
      mcc: parseInt(form.mcc),
      errorType: form.errorType === 'none' ? null :
        form.errorType === 'bad_pin' ? 'Bad PIN' :
        form.errorType === 'insufficient' ? 'Insufficient Balance' : 'Technical Glitch',
      hour: parseInt(form.hour),
      minute: parseInt(form.minute),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      card: '**** **** **** MANUAL',
      apiPayload: {
        amount,
        hour: parseInt(form.hour),
        minute: parseInt(form.minute),
        mcc: parseInt(form.mcc),
        'use_chip_Chip Transaction': form.chipType === 'chip' ? 1 : 0,
        'use_chip_Online Transaction': form.chipType === 'online' ? 1 : 0,
        'use_chip_Swipe Transaction': form.chipType === 'swipe' ? 1 : 0,
        'errors_Insufficient Balance': form.errorType === 'insufficient' ? 1 : 0,
        'errors_Bad PIN': form.errorType === 'bad_pin' ? 1 : 0,
        'errors_Technical Glitch': form.errorType === 'glitch' ? 1 : 0,
      },
    };

    onAnalyze(tx);
  };

  const handleReset = () => setForm(DEFAULT_FORM);

  const inputClass =
    'w-full bg-slate-900/70 border border-slate-600/60 rounded-lg px-3 py-2 text-sm text-white ' +
    'placeholder-slate-500 focus:outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/30 ' +
    'transition-all duration-200';

  const labelClass = 'block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">

        {/* Amount */}
        <div>
          <label className={labelClass}>Transaction Amount (USD)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">$</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={e => handleChange('amount', e.target.value)}
              className={`${inputClass} pl-7`}
              required
            />
          </div>
        </div>

        {/* Merchant Name */}
        <div>
          <label className={labelClass}>Merchant Name <span className="text-slate-600 normal-case font-normal">(optional)</span></label>
          <input
            type="text"
            placeholder="e.g. Amazon, Shell Gas Station"
            value={form.merchant}
            onChange={e => handleChange('merchant', e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Time row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Hour <span className="text-slate-600 font-normal normal-case">(0–23)</span></label>
            <input
              type="number"
              min="0"
              max="23"
              value={form.hour}
              onChange={e => handleChange('hour', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Minute <span className="text-slate-600 font-normal normal-case">(0–59)</span></label>
            <input
              type="number"
              min="0"
              max="59"
              value={form.minute}
              onChange={e => handleChange('minute', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Chip Type */}
        <div>
          <label className={labelClass}>Transaction Type</label>
          <div className="grid grid-cols-3 gap-2">
            {CHIP_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleChange('chipType', opt.value)}
                className={`py-2 px-2 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                  form.chipType === opt.value
                    ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                    : 'bg-slate-800/60 border-slate-600/40 text-slate-400 hover:border-slate-500'
                }`}
              >
                {opt.label.replace(' Transaction', '')}
              </button>
            ))}
          </div>
        </div>

        {/* MCC */}
        <div>
          <label className={labelClass}>Merchant Category (MCC)</label>
          <select
            value={form.mcc}
            onChange={e => handleChange('mcc', e.target.value)}
            className={`${inputClass} cursor-pointer`}
          >
            {MCC_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value} className="bg-slate-800">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Error Type */}
        <div>
          <label className={labelClass}>Terminal Error</label>
          <div className="grid grid-cols-2 gap-2">
            {ERROR_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleChange('errorType', opt.value)}
                className={`py-2 px-2 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                  form.errorType === opt.value
                    ? opt.value === 'none'
                      ? 'bg-green-900/30 border-green-600/50 text-green-400'
                      : 'bg-red-900/30 border-red-500/50 text-red-400'
                    : 'bg-slate-800/60 border-slate-600/40 text-slate-400 hover:border-slate-500'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Risk hint */}
        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
          <p className="text-xs text-slate-500 leading-relaxed">
            💡 <span className="text-slate-400">High-risk signals:</span> large amounts at night, online transactions, "Bad PIN" errors, or unusual MCC codes.
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-4 border-t border-slate-700/50 flex gap-2">
        <button
          type="button"
          onClick={handleReset}
          className="p-2 rounded-lg border border-slate-600/50 text-slate-400 hover:text-white hover:border-slate-500 transition-all duration-200"
          title="Reset form"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          type="submit"
          disabled={isLoading || !form.amount}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
            isLoading || !form.amount
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/30'
          }`}
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
          ) : (
            <><Search className="w-4 h-4" /> Analyze Transaction</>
          )}
        </button>
      </div>
    </form>
  );
}
