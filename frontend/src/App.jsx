import { useState, useEffect, useCallback } from 'react';
import Dashboard from './components/Dashboard';

// Mock transaction generator
const MERCHANT_NAMES = [
  'Amazon Prime', 'Walmart Supercenter', 'Shell Gas Station', 'Starbucks Coffee',
  'Best Buy Electronics', 'Target Corp', 'Uber Technologies', 'Netflix Inc',
  'Apple Store', 'McDonald\'s', 'Costco Wholesale', 'Home Depot', 'CVS Pharmacy',
  'Southwest Airlines', 'Steam Games'
];

const CITIES = ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ',
  'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA', 'Dallas, TX', 'Online'];

const CHIP_TYPES = ['Chip Transaction', 'Swipe Transaction', 'Online Transaction'];
const MCC_CODES = [5411, 5812, 5541, 5999, 5734, 4816, 7011, 5912, 4511];

let txCounter = 1000;

function generateTransaction() {
  const now = new Date();
  const amount = parseFloat((Math.random() * 2000 + 1).toFixed(2));
  const chipType = CHIP_TYPES[Math.floor(Math.random() * CHIP_TYPES.length)];
  const merchant = MERCHANT_NAMES[Math.floor(Math.random() * MERCHANT_NAMES.length)];
  const city = CITIES[Math.floor(Math.random() * CITIES.length)];
  const mcc = MCC_CODES[Math.floor(Math.random() * MCC_CODES.length)];
  const hasError = Math.random() < 0.08;
  const errorType = hasError ? (['Bad PIN', 'Insufficient Balance', 'Technical Glitch'][Math.floor(Math.random() * 3)]) : null;

  txCounter++;
  return {
    id: `TXN-${txCounter}`,
    merchant,
    city,
    amount,
    chipType,
    mcc,
    errorType,
    hour: now.getHours(),
    minute: now.getMinutes(),
    timestamp: now.toLocaleTimeString('en-US', { hour12: false }),
    card: `**** **** **** ${Math.floor(1000 + Math.random() * 9000)}`,
    // API payload shape
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

  // Simulate live feed
  useEffect(() => {
    const interval = setInterval(() => {
      setTransactions(prev => {
        const newTx = generateTransaction();
        const updated = [newTx, ...prev].slice(0, 25);
        return updated;
      });
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const evaluateTransaction = useCallback(async (tx) => {
    setSelectedTx(tx);
    setIsLoading(true);
    setEvaluation(null);
    try {
      const response = await fetch('http://localhost:8000/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tx.apiPayload),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setEvaluation(data);
      if (data.prediction === 'Fraud') {
        setStats(prev => ({
          ...prev,
          total: prev.total + 1,
          fraudCount: prev.fraudCount + 1,
          alertRate: parseFloat(((prev.fraudCount + 1) / (prev.total + 1) * 100).toFixed(1)),
        }));
      } else {
        setStats(prev => ({ ...prev, total: prev.total + 1 }));
      }
    } catch (err) {
      console.error('Evaluation failed:', err);
      // Offline mock so UI still works without backend
      const prob = parseFloat((Math.random() * 0.95 + 0.02).toFixed(4));
      setEvaluation({
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
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 font-inter">
      <Dashboard
        transactions={transactions}
        selectedTx={selectedTx}
        evaluation={evaluation}
        isLoading={isLoading}
        stats={stats}
        onSelectTransaction={evaluateTransaction}
      />
    </div>
  );
}
