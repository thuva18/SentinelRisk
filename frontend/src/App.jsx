import { useState, useEffect, useCallback, useRef } from 'react';
import Dashboard from './components/Dashboard';
import ToastNotifications from './components/ToastNotifications';
import { soundFx } from './utils/audio';

// Mock transaction generation repository
const MERCHANT_NAMES = [
  'Amazon Prime', 'Walmart Supercenter', 'Shell Express Fuel', 'Starbucks Coffee',
  'Best Buy Electronics', 'Target Corp', 'Uber Technologies', 'Netflix Inc',
  'Apple Store', "McDonald's", 'Costco Wholesale', 'Home Depot', 'CVS Pharmacy',
  'Southwest Airlines', 'Steam Digital Games', 'Gucci Fifth Ave', 'Rolex Boutique',
  'Emirates Airlines', 'Chevron Gas Station', 'Nordstrom Online'
];

const CITIES = [
  'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ',
  'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA', 'Dallas, TX', 'Miami, FL', 'Online'
];

const CHIP_TYPES = ['Chip Transaction', 'Swipe Transaction', 'Online Transaction'];
const MCC_CODES = [5411, 5812, 5541, 5999, 5734, 4816, 7011, 5912, 4511];

let txCounter = 1000;
let evalCounter = 0;

function generateTransaction(isSpike = false) {
  const now = new Date();
  let amount, chipType, merchant, city, mcc, hasError, errorType, hour, minute;

  if (isSpike) {
    // Highly suspicious profile
    amount = parseFloat((Math.random() * 2500 + 1200).toFixed(2));
    chipType = 'Online Transaction';
    merchant = ['Best Buy Electronics', 'Apple Store', 'Emirates Airlines', 'Rolex Boutique'][Math.floor(Math.random() * 4)];
    city = 'Online';
    mcc = 5734;
    hasError = Math.random() < 0.6;
    errorType = hasError ? (Math.random() < 0.5 ? 'Bad PIN' : 'Insufficient Balance') : null;
    hour = Math.floor(Math.random() * 4) + 1; // 1 AM - 4 AM
    minute = Math.floor(Math.random() * 60);
  } else {
    // Normal distribution
    amount = parseFloat((Math.random() * 1200 + 10).toFixed(2));
    chipType = CHIP_TYPES[Math.floor(Math.random() * CHIP_TYPES.length)];
    merchant = MERCHANT_NAMES[Math.floor(Math.random() * MERCHANT_NAMES.length)];
    city = CITIES[Math.floor(Math.random() * CITIES.length)];
    mcc = MCC_CODES[Math.floor(Math.random() * MCC_CODES.length)];
    hasError = Math.random() < 0.07;
    errorType = hasError
      ? (['Bad PIN', 'Insufficient Balance', 'Technical Glitch'][Math.floor(Math.random() * 3)])
      : null;
    hour = now.getHours();
    minute = now.getMinutes();
  }

  txCounter++;
  return {
    id: `TXN-${txCounter}`,
    merchant, 
    city, 
    amount, 
    chipType, 
    mcc, 
    errorType,
    hour,
    minute,
    timestamp: now.toLocaleTimeString('en-US', { hour12: false }),
    card: `**** **** **** ${Math.floor(1000 + Math.random() * 9000)}`,
    isSpike,
    apiPayload: {
      amount,
      hour,
      minute,
      mcc,
      'use_chip_Chip Transaction': chipType === 'Chip Transaction' ? 1 : 0,
      'use_chip_Online Transaction': chipType === 'Online Transaction' ? 1 : 0,
      'use_chip_Swipe Transaction': chipType === 'Swipe Transaction' ? 1 : 0,
      'errors_Insufficient Balance': errorType === 'Insufficient Balance' ? 1 : 0,
      'errors_Bad PIN': errorType === 'Bad PIN' ? 1 : 0,
      'errors_Technical Glitch': errorType === 'Technical Glitch' ? 1 : 0,
    }
  };
}

export default function App() {
  const [transactions, setTransactions] = useState(() =>
    Array.from({ length: 8 }, () => generateTransaction(false))
  );
  const [selectedTx, setSelectedTx] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ total: 8, fraudCount: 0, alertRate: 0 });

  // Stream controls
  const [isStreaming, setIsStreaming] = useState(true);
  const [streamSpeed, setStreamSpeed] = useState(3500); // 3500ms, 1800ms, 800ms

  // Sound feedback toggle
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Custom Rules & Sensitivity
  const [rules, setRules] = useState({
    threshold: 0.5,
    flagNightRush: true,
    flagHighOnline: true,
    flagRepeatedErrors: true,
    autoBlockHighRisk: true,
  });

  // History, Trend, and Toasts state
  const [history, setHistory] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [evaluatedMap, setEvaluatedMap] = useState({});

  const rulesRef = useRef(rules);
  rulesRef.current = rules;

  // Real-time live feed stream simulation
  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      setTransactions(prev => {
        const newTx = generateTransaction(false);
        return [newTx, ...prev].slice(0, 30);
      });
      setStats(prev => ({ ...prev, total: prev.total + 1 }));
    }, streamSpeed);

    return () => clearInterval(interval);
  }, [isStreaming, streamSpeed]);

  const toggleStream = () => setIsStreaming(prev => !prev);
  const toggleSound = () => {
    const newState = soundFx.toggle();
    setSoundEnabled(newState);
  };

  const triggerSpike = () => {
    soundFx.playFraudAlert();
    const spikes = [
      generateTransaction(true),
      generateTransaction(true),
      generateTransaction(true),
    ];
    setTransactions(prev => [...spikes, ...prev].slice(0, 35));
    setStats(prev => ({ ...prev, total: prev.total + 3 }));

    // Add toast notice
    setToasts(prev => [
      {
        id: `toast-spike-${Date.now()}`,
        merchant: 'Simulated Threat Burst (3 txns)',
        amount: 5400.00,
        probability: 0.94,
        isSpikeAlert: true
      },
      ...prev
    ].slice(0, 4));
  };

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const evaluateTransaction = useCallback(async (tx, playAudio = true) => {
    setSelectedTx(tx);
    setIsLoading(true);
    setEvaluation(null);

    let result;
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tx.apiPayload),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      result = await response.json();
    } catch (err) {
      console.debug('Evaluation API offline, engaging mock fallback:', err);
      // Offline robust mock calculation based on heuristics
      let baseProb = 0.05;
      if (tx.amount > 1000) baseProb += 0.35;
      if (tx.chipType === 'Online Transaction') baseProb += 0.25;
      if (tx.errorType === 'Bad PIN') baseProb += 0.30;
      if (tx.errorType === 'Insufficient Balance') baseProb += 0.15;
      if (tx.hour >= 0 && tx.hour <= 5) baseProb += 0.20;

      const randomJitter = (Math.random() * 0.15) - 0.05;
      const prob = Math.min(0.98, Math.max(0.02, parseFloat((baseProb + randomJitter).toFixed(4))));

      result = {
        fraud_probability: prob,
        prediction: prob >= rulesRef.current.threshold ? 'Fraud' : 'Legitimate',
        model_mode: 'mock',
        shap_values: [
          { feature: 'Amount', impact: tx.amount > 1000 ? 0.38 : -0.15 },
          { feature: 'Use Chip_Online Transaction', impact: tx.chipType === 'Online Transaction' ? 0.28 : -0.12 },
          { feature: 'Hour', impact: (tx.hour >= 0 && tx.hour <= 5) ? 0.22 : -0.08 },
          { feature: 'Errors?_Bad PIN', impact: tx.errorType === 'Bad PIN' ? 0.31 : 0.0 },
          { feature: 'MCC', impact: parseFloat((Math.random() * 0.12 - 0.04).toFixed(4)) },
          { feature: 'Use Chip_Swipe Transaction', impact: tx.chipType === 'Swipe Transaction' ? 0.08 : -0.05 },
        ].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)),
      };
    } finally {
      setIsLoading(false);
    }

    // Apply rule sensitivity threshold
    const isFraud = result.fraud_probability >= rulesRef.current.threshold;
    result.prediction = isFraud ? 'Fraud' : 'Legitimate';

    setEvaluation(result);

    // Audio Feedback
    if (playAudio) {
      if (isFraud) {
        soundFx.playFraudAlert();
      } else {
        soundFx.playSafeBeep();
      }
    }

    // Mark in evaluated map
    setEvaluatedMap(prev => ({
      ...prev,
      [tx.id]: result
    }));

    // Update KPI stats
    setStats(prev => {
      const newFraud = isFraud ? prev.fraudCount + 1 : prev.fraudCount;
      const newTotal = prev.total;
      return {
        total: newTotal,
        fraudCount: newFraud,
        alertRate: parseFloat(((newFraud / Math.max(1, newTotal)) * 100).toFixed(1)),
      };
    });

    // Append to trend chart
    evalCounter++;
    setTrendData(prev => [
      ...prev,
      {
        index: evalCounter,
        probability: result.fraud_probability,
        prediction: result.prediction,
        merchant: tx.merchant,
        amount: tx.amount,
      }
    ].slice(-50));

    // Append to history log
    setHistory(prev => [
      { tx, evaluation: result, index: evalCounter },
      ...prev,
    ].slice(0, 150));

    // Fire toast for risky transactions
    if (result.fraud_probability >= rulesRef.current.threshold) {
      const toastId = `toast-${Date.now()}`;
      setToasts(prev => [
        { 
          id: toastId, 
          merchant: tx.merchant, 
          amount: tx.amount, 
          probability: result.fraud_probability 
        },
        ...prev,
      ].slice(0, 4));
    }
  }, []);

  const handleAnalystAction = (actionType, tx, evaluation) => {
    soundFx.playClick();
    const actionLabels = {
      freeze: '🚨 Card Frozen & Blocked at Processor',
      '2fa': '💬 Biometric 2FA SMS Pushed to User',
      whitelist: '🛡️ Merchant Marked as Trusted'
    };

    setToasts(prev => [
      {
        id: `toast-action-${Date.now()}`,
        merchant: actionLabels[actionType] || 'Action Executed',
        amount: tx.amount,
        probability: evaluation?.fraud_probability || 0,
        isActionToast: true
      },
      ...prev
    ].slice(0, 4));
  };

  const handleClearHistory = () => {
    setHistory([]);
    setTrendData([]);
    setEvaluatedMap({});
  };

  return (
    <div className="min-h-screen bg-[#070c1e] text-slate-100 font-inter selection:bg-blue-600 selection:text-white">
      {/* Toast Alert Stack */}
      <ToastNotifications toasts={toasts} onDismiss={dismissToast} />

      {/* Main App Dashboard */}
      <Dashboard
        transactions={transactions}
        selectedTx={selectedTx}
        evaluation={evaluation}
        isLoading={isLoading}
        stats={stats}
        onSelectTransaction={evaluateTransaction}
        trendData={trendData}
        history={history}
        isStreaming={isStreaming}
        onToggleStream={toggleStream}
        streamSpeed={streamSpeed}
        onChangeSpeed={setStreamSpeed}
        onTriggerSpike={triggerSpike}
        evaluatedMap={evaluatedMap}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        rules={rules}
        onUpdateRules={setRules}
        onAnalystAction={handleAnalystAction}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
}
