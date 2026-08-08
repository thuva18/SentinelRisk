import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Activity, TrendingUp, Cpu, Clock, Radio, PenLine } from 'lucide-react';
import TransactionFeed from './TransactionFeed';
import RiskAlertCard from './RiskAlertCard';
import ShapExplainer from './ShapExplainer';
import ManualCheck from './ManualCheck';

export default function Dashboard({ transactions, selectedTx, evaluation, isLoading, stats, onSelectTransaction }) {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-US', { hour12: false }));
  const [leftTab, setLeftTab] = useState('feed'); // 'feed' | 'manual'

  useEffect(() => {
    const t = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const modelModeColor = evaluation?.model_mode === 'live' ? 'text-neon' : 'text-amber-400';
  const modelModeLabel = evaluation?.model_mode === 'live' ? 'Live Model' : (evaluation?.model_mode === 'mock' ? 'Mock Mode' : 'Offline');

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-slate-700/60 bg-slate-900/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 rounded-lg border border-blue-500/30">
            <Shield className="w-7 h-7 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">SentinelRisk</h1>
            <p className="text-xs text-slate-400 font-medium">Real-Time Fraud Detection Platform</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-neon animate-pulse" style={{boxShadow: '0 0 6px #39FF14'}} />
            <span className="text-xs text-slate-400">System Active</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-mono">{currentTime}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 flex flex-col gap-6">
        {/* KPI Row */}
        <div className="grid grid-cols-4 gap-4">
          <div className="kpi-card">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Total Transactions</span>
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-3xl font-bold text-white">{stats.total.toLocaleString()}</span>
            <span className="text-xs text-slate-500">since session start</span>
          </div>
          <div className="kpi-card">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Frauds Detected</span>
              <AlertTriangle className="w-4 h-4 text-crimson" />
            </div>
            <span className="text-3xl font-bold text-crimson">{stats.fraudCount}</span>
            <span className="text-xs text-slate-500">high-risk transactions</span>
          </div>
          <div className="kpi-card">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Alert Rate</span>
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-3xl font-bold text-amber-400">{stats.alertRate}%</span>
            <span className="text-xs text-slate-500">fraud rate this session</span>
          </div>
          <div className="kpi-card">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Model Status</span>
              <Cpu className="w-4 h-4 text-slate-400" />
            </div>
            <span className={`text-3xl font-bold ${modelModeColor}`}>
              {evaluation ? modelModeLabel : '—'}
            </span>
            <span className="text-xs text-slate-500">LightGBM + SHAP</span>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-3 gap-4 flex-1">
          {/* Left Panel — tabbed */}
          <div className="glass-card flex flex-col h-full max-h-[680px]">
            {/* Tab switcher */}
            <div className="flex border-b border-slate-700/50">
              <button
                onClick={() => setLeftTab('feed')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold transition-all duration-200 ${
                  leftTab === 'feed'
                    ? 'text-white border-b-2 border-blue-500 bg-slate-700/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                Live Feed
              </button>
              <button
                onClick={() => setLeftTab('manual')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold transition-all duration-200 ${
                  leftTab === 'manual'
                    ? 'text-white border-b-2 border-purple-500 bg-slate-700/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <PenLine className="w-3.5 h-3.5" />
                Manual Check
              </button>
            </div>

            {/* Tab content */}
            {leftTab === 'feed' ? (
              <TransactionFeed
                transactions={transactions}
                selectedTx={selectedTx}
                onSelect={onSelectTransaction}
                embedded
              />
            ) : (
              <ManualCheck
                onAnalyze={onSelectTransaction}
                isLoading={isLoading}
              />
            )}
          </div>

          <RiskAlertCard
            transaction={selectedTx}
            evaluation={evaluation}
            isLoading={isLoading}
          />
          <ShapExplainer evaluation={evaluation} isLoading={isLoading} />
        </div>
      </main>
    </div>
  );
}
