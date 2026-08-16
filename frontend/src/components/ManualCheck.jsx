import { useState } from 'react';
import { Search, RotateCcw, Loader2, Sparkles, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

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
  { label: '5411 — Grocery Stores & Supermarkets', value: 5411 },
  { label: '5812 — Restaurants & Dining', value: 5812 },
  { label: '5541 — Gas Stations & Automated Fuel', value: 5541 },
  { label: '5999 — Miscellaneous & Online Retail', value: 5999 },
  { label: '5734 — Computer Software & Electronics', value: 5734 },
  { label: '4816 — Digital Services & Streaming', value: 4816 },
  { label: '7011 — Hotels & Luxury Lodging', value: 7011 },
  { label: '5912 — Drug Stores & Pharmacies', value: 5912 },
  { label: '4511 — Airlines & Travel Booking', value: 4511 },
];

// 1-Click Forensic Simulation Presets
const PRESETS = [
  {
    name: '🚨 Night Online ATO',
    desc: 'High amount, off-hours, bad pin',
    data: {
      amount: '1850.00',
      merchant: 'Best Buy Electronics',
      hour: 3,
      minute: 24,
      chipType: 'online',
      mcc: 5734,
      errorType: 'bad_pin'
    }
  },
  {
    name: '🛒 Regular Grocery',
    desc: 'Low amount, chip, daytime',
    data: {
      amount: '58.40',
      merchant: 'Whole Foods Market',
      hour: 14,
      minute: 15,
      chipType: 'chip',
      mcc: 5411,
      errorType: 'none'
    }
  },
  {
    name: '⛽ Gas Pump Skim',
    desc: 'Swipe, late evening, glitch',
    data: {
      amount: '94.20',
      merchant: 'Shell Express Fuel',
      hour: 23,
      minute: 40,
      chipType: 'swipe',
      mcc: 5541,
      errorType: 'glitch'
    }
  },
  {
    name: '✈️ Airline Ticket',
    desc: 'High-value flight purchase',
    data: {
      amount: '1420.00',
      merchant: 'Emirates Airlines Online',
      hour: 19,
      minute: 10,
      chipType: 'online',
      mcc: 4511,
      errorType: 'none'
    }
  }
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

  const applyPreset = (presetData) => {
    setForm({
      ...presetData,
      hour: presetData.hour,
      minute: presetData.minute,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) return;

    const tx = {
      id: `MANUAL-${Date.now().toString().slice(-4)}`,
      merchant: form.merchant.trim() || 'Custom Manual Check',
      city: 'Analyst Terminal',
      amount,
      chipType: CHIP_OPTIONS.find(c => c.value === form.chipType)?.label || 'Online Transaction',
      mcc: parseInt(form.mcc),
      errorType: form.errorType === 'none' ? null :
        form.errorType === 'bad_pin' ? 'Bad PIN' :
        form.errorType === 'insufficient' ? 'Insufficient Balance' : 'Technical Glitch',
      hour: parseInt(form.hour),
      minute: parseInt(form.minute),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      card: '**** **** **** 8821',
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
    'w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white ' +
    'placeholder-slate-500 focus:outline-none focus:border-purple-500/70 focus:ring-1 focus:ring-purple-500/30 ' +
    'transition-all duration-200';

  const labelClass = 'block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5">
        
        {/* Scenario Presets Bar */}
        <div>
          <label className="block text-[11px] font-bold text-purple-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-400" /> Quick-Test Scenario Presets
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {PRESETS.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => applyPreset(p.data)}
                className="p-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 rounded-lg text-left transition-all group"
              >
                <p className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                  {p.name}
                </p>
                <p className="text-[10px] text-slate-500 truncate">{p.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className={labelClass}>Transaction Amount (USD)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold font-mono">$</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={e => handleChange('amount', e.target.value)}
              className={`${inputClass} pl-7 font-mono font-bold text-sm`}
              required
            />
          </div>
        </div>

        {/* Merchant Name */}
        <div>
          <label className={labelClass}>Merchant / Entity Name</label>
          <input
            type="text"
            placeholder="e.g. Amazon Prime, Apple Store, Shell Gas"
            value={form.merchant}
            onChange={e => handleChange('merchant', e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Time of Day */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className={labelClass}>Hour (0–23)</label>
            <input
              type="number"
              min="0"
              max="23"
              value={form.hour}
              onChange={e => handleChange('hour', e.target.value)}
              className={`${inputClass} font-mono`}
            />
          </div>
          <div>
            <label className={labelClass}>Minute (0–59)</label>
            <input
              type="number"
              min="0"
              max="59"
              value={form.minute}
              onChange={e => handleChange('minute', e.target.value)}
              className={`${inputClass} font-mono`}
            />
          </div>
        </div>

        {/* Transaction Channel / Type */}
        <div>
          <label className={labelClass}>Payment Channel / Method</label>
          <div className="grid grid-cols-3 gap-1.5">
            {CHIP_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleChange('chipType', opt.value)}
                className={`py-2 px-1 rounded-lg text-xs font-semibold border transition-all text-center ${
                  form.chipType === opt.value
                    ? 'bg-purple-600/30 border-purple-500 text-purple-300 font-bold shadow-sm'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {opt.label.replace(' Transaction', '')}
              </button>
            ))}
          </div>
        </div>

        {/* Merchant Category Code */}
        <div>
          <label className={labelClass}>Merchant Category Code (MCC)</label>
          <select
            value={form.mcc}
            onChange={e => handleChange('mcc', e.target.value)}
            className={`${inputClass} cursor-pointer`}
          >
            {MCC_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Terminal Error Condition */}
        <div>
          <label className={labelClass}>Terminal Error Flag</label>
          <div className="grid grid-cols-2 gap-1.5">
            {ERROR_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleChange('errorType', opt.value)}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                  form.errorType === opt.value
                    ? opt.value === 'none'
                      ? 'bg-green-950/60 border-green-600 text-green-300'
                      : 'bg-red-950/60 border-red-600 text-red-300'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Submit Button & Reset Bar */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/50 flex gap-2">
        <button
          type="button"
          onClick={handleReset}
          className="p-2.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition-all"
          title="Clear form"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          type="submit"
          disabled={isLoading || !form.amount}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
            isLoading || !form.amount
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-950/50 border border-purple-400/30'
          }`}
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Evaluating...</>
          ) : (
            <><Search className="w-4 h-4" /> Evaluate Transaction</>
          )}
        </button>
      </div>
    </form>
  );
}
