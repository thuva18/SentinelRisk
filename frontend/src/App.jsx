import { useState, useEffect, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import ToastNotifications from './components/ToastNotifications';

// Mock transaction generator
const MERCHANT_NAMES = [
  'Amazon Prime', 'Walmart Supercenter', 'Shell Gas Station', 'Starbucks Coffee',
  'Best Buy Electronics', 'Target Corp', 'Uber Technologies', 'Netflix Inc',
  'Apple Store', "McDonald's", 'Costco Wholesale', 'Home Depot', 'CVS Pharmacy',
  'Southwest Airlines', 'Steam Games'
];

const CITIES = ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ',
  'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA', 'Dallas, TX', 'Online'];

const CHIP_TYPES = ['Chip Transaction', 'Swipe Transaction', 'Online Transaction'];
const MCC_CODES = [5411, 5812, 5541, 5999, 5734, 4816, 7011, 5912, 4511];

let txCounter = 1000;
let evalCounter = 0;

function generateTransaction() {
  const now = new Date();
  const amount = parseFloat((Math.random() * 2000 + 1).toFixed(2));
  const chipType = CHIP_TYPES[Math.floor(Math.random() * CHIP_TYPES.length)];
  const merchant = MERCHANT_NAMES[Math.floor(Math.random() * MERCHANT_NAMES.length)];
  const city = CITIES[Math.floor(Math.random() * CITIES.length)];
  const mcc = MCC_CODES[Math.floor(Math.random() * MCC_CODES.length)];
  const hasError = Math.random() < 0.08;
  const errorType = hasError
    ? (['Bad PIN', 'Insufficient Balance', 'Technical Glitch'][Math.floor(Math.random() * 3)])
    : null;

  txCounter++;
  return {
    id: `TXN-${txCounter}`,
    merchant, city, amount, chipType, mcc, errorType,
    hour: now.getHours(),
    minute: now.getMinutes(),
    timestamp: now.toLocaleTimeString('en-US', { hour12: false }),
    card: `**** **** **** ${Math.floor(1000 + Math.random() * 9000)}`,
    apiPayload: {
      amount,
      hour: now.getHours(),
      minute: now.getMinutes(),
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
    Array.from({ length: 8 }, generateTransaction)
  );
  const [selectedTx, setSelectedTx] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ total: 8, fraudCount: 0, alertRate: 0 });

  // New state for Tier 1 features
  const [history, setHistory] = useState([]);         // full evaluation log
  const [trendData, setTrendData] = useState([]);     // last 20 probabilities
  const [toasts, setToasts] = useState([]);           // active toast alerts

  // Simulate live feed
  useEffect(() => {
    const interval = setInterval(() => {
      setTransactions(prev => {
        const newTx = generateTransaction();
        return [newTx, ...prev].slice(0, 25);
      });
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const evaluateTransaction = useCallback(async (tx) => {
    setSelectedTx(tx);
    setIsLoading(true);
    setEvaluation(null);

    let result;
    try {
      const response = await fetch('http://localhost:8000/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tx.apiPayload),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      result = await response.json();
    } catch (err) {
      console.error('Evaluation failed:', err);
      // Offline mock fallback
      const prob = parseFloat((Math.random() * 0.95 + 0.02).toFixed(4));
      result = {
        fraud_probability: prob,
        prediction: prob >= 0.5 ? 'Fraud' : 'Legitimate',
        model_mode: 'offline-mock',
        shap_values: [
          { feature: 'Amount', impact: parseFloat((Math.random() * 0.6 - 0.1).toFixed(4)) },
          { feature: 'Hour', impact: parseFloat((Math.random() * 0.4 - 0.2).toFixed(4)) },
          { feature: 'Use Chip_Online Transaction', impact: parseFloat((Math.random() * 0.5).toFixed(4)) },
          { feature: 'MCC', impact: parseFloat((Math.random() * 0.3 - 0.1).toFixed(4)) },
          { feature: 'Errors?_Bad PIN', impact: parseFloat((Math.random() * 0.35).toFixed(4)) },
          { feature: 'Use Chip_Swipe Transaction', impact: parseFloat((-Math.random() * 0.2).toFixed(4)) },
        ].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)),
      };
    } finally {
      setIsLoading(false);
    }

    setEvaluation(result);

    // Update KPI stats
    const isFraud = result.prediction === 'Fraud';
    setStats(prev => {
      const newFraud = isFraud ? prev.fraudCount + 1 : prev.fraudCount;
      const newTotal = prev.total + 1;
      return {
        total: newTotal,
        fraudCount: newFraud,
        alertRate: parseFloat(((newFraud / newTotal) * 100).toFixed(1)),
      };
    });

    // Append to trend chart (keep last 20)
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
    ].slice(-20));

    // Append to history log
    setHistory(prev => [
      { tx, evaluation: result, index: evalCounter },
      ...prev,
    ].slice(0, 100));

    // Fire toast for risky transactions (>= 50%)
    if (result.fraud_probability >= 0.5) {
      const toastId = `toast-${Date.now()}`;
      setToasts(prev => [
        { id: toastId, merchant: tx.merchant, amount: tx.amount, probability: result.fraud_probability },
        ...prev,
      ].slice(0, 4)); // max 4 toasts at once
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 font-inter">
      {/* Toast overlay — fixed top-right */}
      <ToastNotifications toasts={toasts} onDismiss={dismissToast} />

      <Dashboard
        transactions={transactions}
        selectedTx={selectedTx}
        evaluation={evaluation}
        isLoading={isLoading}
        stats={stats}
        onSelectTransaction={evaluateTransaction}
        trendData={trendData}
        history={history}
      />
    </div>
  );
}
