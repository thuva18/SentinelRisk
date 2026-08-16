import { useState, useEffect } from 'react';
import { 
  Shield, AlertTriangle, Activity, TrendingUp, Cpu, Clock, Radio, 
  PenLine, Sliders, Volume2, VolumeX, Sparkles, BarChart2, ShieldCheck, Zap
} from 'lucide-react';
import TransactionFeed from './TransactionFeed';
import RiskAlertCard from './RiskAlertCard';
import ShapExplainer from './ShapExplainer';
import ManualCheck from './ManualCheck';
import TrendChart from './TrendChart';
import HistoryLog from './HistoryLog';
import InsightsDashboard from './InsightsDashboard';
import RuleEngineModal from './RuleEngineModal';

export default function Dashboard({ 
  transactions, 
  selectedTx, 
  evaluation, 
  isLoading, 
  stats, 
  onSelectTransaction, 
  trendData, 
  history,
  isStreaming,
  onToggleStream,
  streamSpeed,
  onChangeSpeed,
  onTriggerSpike,
  evaluatedMap,
  soundEnabled,
  onToggleSound,
  rules,
  onUpdateRules,
  onAnalystAction,
  onClearHistory,
}) {
  const [mainTab, setMainTab] = useState('dashboard'); // 'dashboard' | 'insights'
  const [leftTab, setLeftTab] = useState('feed'); // 'feed' | 'manual'
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-US', { hour12: false }));

  useEffect(() => {
    const t = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const modelModeColor = evaluation?.model_mode === 'live' ? 'text-neon' : 'text-amber-400';
  const modelModeLabel = evaluation?.model_mode === 'live' ? 'Live LGBM' : (evaluation?.model_mode === 'mock' ? 'Mock Engine' : 'Offline');

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Enterprise Header */}
      <header className="flex flex-wrap items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 gap-3">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-600/30 to-purple-600/30 rounded-xl border border-blue-500/40 shadow-lg shadow-blue-950/50">
            <Shield className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-1.5">
                Sentinel<span className="text-blue-400">Risk</span>
              </h1>
              <span className="text-[10px] bg-blue-950/80 text-blue-300 font-mono font-bold px-1.5 py-0.2 rounded border border-blue-800">
                v2.4 Enterprise
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Real-Time LightGBM + SHAP Fraud Prevention</p>
          </div>
        </div>

        {/* Center Main Tab Switcher */}
        <div className="flex bg-slate-900/90 rounded-xl p-1 border border-slate-800 text-xs shadow-inner">
          <button
            onClick={() => setMainTab('dashboard')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-bold transition-all ${
              mainTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Live Threat Radar
          </button>
          <button
            onClick={() => setMainTab('insights')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-bold transition-all ${
              mainTab === 'insights'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Security Intelligence
            {history.length > 0 && (
              <span className="text-[10px] bg-purple-950 text-purple-300 px-1.5 py-0.2 rounded-full border border-purple-800">
                {history.length}
              </span>
            )}
          </button>
        </div>

        {/* Right Tools: Rules, Sound, Status, Clock */}
        <div className="flex items-center gap-3">
          {/* Rule Engine Modal Button */}
          <button
            onClick={() => setIsRuleModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-all shadow-sm"
            title="Configure sensitivity threshold and custom guardrails"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            <span>Rules ({rules.threshold * 100}%)</span>
          </button>

          {/* Audio Alert Toggle */}
          <button
            onClick={onToggleSound}
            className={`p-1.5 rounded-lg border transition-all text-xs ${
              soundEnabled
                ? 'bg-slate-900 border-slate-700 text-blue-400 hover:text-blue-300'
                : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title={soundEnabled ? 'Audio Chimes Active' : 'Audio Muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* System Active Status Pill */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
            <div className="w-2 h-2 rounded-full bg-neon animate-pulse" style={{ boxShadow: '0 0 8px #39FF14' }} />
            <span className="text-xs font-medium text-slate-300">Live Defense</span>
          </div>

          {/* Clock */}
          <div className="hidden md:flex items-center gap-1.5 text-slate-400 font-mono text-xs bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{currentTime}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-5 flex flex-col gap-5 max-w-[1600px] w-full mx-auto">
        {mainTab === 'dashboard' ? (
          <>
            {/* KPI Row (4 Cards) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="kpi-card">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">Total Ingested</span>
                  <Activity className="w-4 h-4 text-blue-400" />
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-white font-mono">{stats.total.toLocaleString()}</span>
                  <span className="text-[10px] text-emerald-400 font-mono">+12.4% vs avg</span>
                </div>
                <span className="text-[11px] text-slate-500">live stream telemetry</span>
              </div>

              <div className="kpi-card">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">Fraud Intercepted</span>
                  <AlertTriangle className="w-4 h-4 text-crimson" />
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-crimson font-mono">{stats.fraudCount}</span>
                  <span className="text-[10px] text-red-400 font-mono font-semibold">High Threat</span>
                </div>
                <span className="text-[11px] text-slate-500">auto-flagged incidents</span>
              </div>

              <div className="kpi-card">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">Alert Frequency</span>
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-amber-400 font-mono">{stats.alertRate}%</span>
                  <span className="text-[10px] text-slate-400 font-mono">threshold: {(rules.threshold * 100)}%</span>
                </div>
                <span className="text-[11px] text-slate-500">active risk ratio</span>
              </div>

              <div className="kpi-card">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">Inference Engine</span>
                  <Cpu className="w-4 h-4 text-slate-400" />
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className={`text-xl font-bold ${modelModeColor} font-mono`}>
                    {evaluation ? modelModeLabel : 'Ready'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">14ms latency</span>
                </div>
                <span className="text-[11px] text-slate-500">LightGBM + TreeSHAP</span>
              </div>
            </div>

            {/* Live Trend Velocity Chart */}
            <TrendChart trendData={trendData} />

            {/* Main 3-Column Workstation Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
              {/* Left Column: Tabbed Feed / Manual Evaluator */}
              <div className="glass-card flex flex-col h-full max-h-[680px] overflow-hidden">
                {/* Switcher Tab */}
                <div className="flex border-b border-slate-800 bg-slate-950/40">
                  <button
                    onClick={() => setLeftTab('feed')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold transition-all ${
                      leftTab === 'feed'
                        ? 'text-white border-b-2 border-blue-500 bg-slate-800/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Radio className="w-3.5 h-3.5 text-blue-400" />
                    Live Stream Feed
                  </button>

                  <button
                    onClick={() => setLeftTab('manual')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold transition-all ${
                      leftTab === 'manual'
                        ? 'text-white border-b-2 border-purple-500 bg-slate-800/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <PenLine className="w-3.5 h-3.5 text-purple-400" />
                    Manual Evaluator
                  </button>
                </div>

                {/* Left Tab Body */}
                {leftTab === 'feed' ? (
                  <TransactionFeed
                    transactions={transactions}
                    selectedTx={selectedTx}
                    onSelect={onSelectTransaction}
                    isStreaming={isStreaming}
                    onToggleStream={onToggleStream}
                    streamSpeed={streamSpeed}
                    onChangeSpeed={onChangeSpeed}
                    onTriggerSpike={onTriggerSpike}
                    evaluatedMap={evaluatedMap}
                  />
                ) : (
                  <ManualCheck
                    onAnalyze={onSelectTransaction}
                    isLoading={isLoading}
                  />
                )}
              </div>

              {/* Center Column: Risk Assessment Radial Card */}
              <RiskAlertCard
                transaction={selectedTx}
                evaluation={evaluation}
                isLoading={isLoading}
                ruleThreshold={rules.threshold}
                onAnalystAction={onAnalystAction}
              />

              {/* Right Column: SHAP Explainability & Reasoning */}
              <ShapExplainer evaluation={evaluation} isLoading={isLoading} />
            </div>

            {/* Audit History Log Table */}
            <HistoryLog 
              history={history} 
              onClearHistory={onClearHistory} 
              onInspectTx={(tx) => onSelectTransaction(tx, false)} 
            />
          </>
        ) : (
          <InsightsDashboard history={history} />
        )}
      </main>

      {/* Rule Engine Modal */}
      <RuleEngineModal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        rules={rules}
        onUpdateRules={onUpdateRules}
      />
    </div>
  );
}
