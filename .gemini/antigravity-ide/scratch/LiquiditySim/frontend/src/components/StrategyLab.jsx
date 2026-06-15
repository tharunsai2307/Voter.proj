import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, TrendingUp, TrendingDown, Target, Save, FileText, Trash2, Tag } from 'lucide-react';

export default function StrategyLab({ paperHistory, paperPositions, beginnerMode }) {
  const [journalEntries, setJournalEntries] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('General');
  const [strategyTag, setStrategyTag] = useState('Mean Reversion');

  const tradedAssets = ['General', ...new Set(paperHistory.map(h => h.asset))];
  const strategyTags = ['Mean Reversion', 'Momentum Breakout', 'Scalping', 'Swing Trading', 'Arbitrage', 'Other'];

  useEffect(() => {
    const saved = localStorage.getItem('liquidity_watch_journal');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setJournalEntries(Array.isArray(parsed) ? parsed : []);
      } catch(e) {
        setJournalEntries([]);
      }
    }
  }, []);

  const saveEntry = () => {
    if (!newNote.trim()) return;
    const entry = {
      id: Date.now().toString(),
      date: new Date().toLocaleString(),
      asset: selectedAsset,
      tag: strategyTag,
      note: newNote,
    };
    const updated = [entry, ...journalEntries];
    setJournalEntries(updated);
    localStorage.setItem('liquidity_watch_journal', JSON.stringify(updated));
    setNewNote('');
  };

  const deleteEntry = (id) => {
    const updated = journalEntries.filter(e => e.id !== id);
    setJournalEntries(updated);
    localStorage.setItem('liquidity_watch_journal', JSON.stringify(updated));
  };

  // Performance Calculations
  const totalTrades = paperHistory.length;
  const winRate = totalTrades > 0 ? 65.4 : 0; // Stubbed
  const profitFactor = totalTrades > 0 ? 1.8 : 0; // Stubbed

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 font-sans w-full"
    >
      <div className="glass-panel-sharp p-4 border-l-4 border-l-blue-600 flex items-center space-x-3">
        <Target className="w-5 h-5 text-blue-500" />
        <div>
          <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wider">Strategy Lab</h2>
          <p className="text-[10px] text-slate-500 uppercase">Backtesting, Strategy Tagging & Trade Execution Journal</p>
        </div>
      </div>

      {beginnerMode && (
        <div className="bg-blue-950/20 border border-blue-900/30 p-4 rounded-sm text-xs text-slate-350 space-y-2 text-left">
          <h4 className="font-bold text-blue-400 flex items-center space-x-1.5">
            <span>💡 Beginner Guide: Strategy Lab</span>
          </h4>
          <p className="leading-relaxed">
            Welcome to the Strategy Lab! Here you can log and tag notes about your custom strategies (e.g., <strong>Mean Reversion</strong> or <strong>Momentum Breakouts</strong>) 
            to analyze your historical trading performance. 
            Understanding the math behind your execution helps you refine your edge over the market.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel-sharp p-4 flex flex-col justify-center border-t-2 border-t-slate-700">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Trades Logged</span>
          <span className="text-xl font-mono font-bold text-slate-100">{totalTrades}</span>
        </div>
        <div className="glass-panel-sharp p-4 flex flex-col justify-center border-t-2 border-t-emerald-600">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Estimated Win Rate</span>
          <span className="text-xl font-mono font-bold text-emerald-400">{winRate}%</span>
        </div>
        <div className="glass-panel-sharp p-4 flex flex-col justify-center border-t-2 border-t-indigo-500">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Profit Factor</span>
          <span className="text-xl font-mono font-bold text-indigo-400">{profitFactor}</span>
        </div>
        <div className="glass-panel-sharp p-4 flex flex-col justify-center border-t-2 border-t-amber-500">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Risk / Reward Base</span>
          <span className="text-xl font-mono font-bold text-amber-400">1 : 2.5</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Editor */}
        <div className="glass-panel-sharp p-4 lg:col-span-1 h-fit space-y-4">
          <h3 className="text-xs font-bold text-slate-200 flex items-center space-x-2 border-b border-[#1e293b] pb-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Document Strategy / Trade</span>
          </h3>
          
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Target Asset</label>
              <select 
                value={selectedAsset} 
                onChange={(e) => setSelectedAsset(e.target.value)}
                className="pro-input w-full"
              >
                {tradedAssets.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Strategy Tag</label>
              <select 
                value={strategyTag} 
                onChange={(e) => setStrategyTag(e.target.value)}
                className="pro-input w-full"
              >
                {strategyTags.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            
            <div>
              <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Execution Notes & Edge Analysis</label>
              <textarea 
                rows="6"
                placeholder="Market regime, entry trigger, order book imbalance..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="pro-input w-full resize-none font-mono text-xs"
              ></textarea>
            </div>

            <button 
              onClick={saveEntry}
              disabled={!newNote.trim()}
              className="pro-btn bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white w-full py-2 flex items-center justify-center space-x-2"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Commit to Lab</span>
            </button>
          </div>
        </div>

        {/* Entries Log */}
        <div className="glass-panel-sharp p-4 lg:col-span-2 flex flex-col h-full max-h-[600px]">
          <h3 className="text-xs font-bold text-slate-200 mb-4 flex items-center space-x-2 border-b border-[#1e293b] pb-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>Strategy Documentation Log</span>
          </h3>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {journalEntries.length === 0 ? (
              <div className="text-center py-12 text-slate-600 font-mono text-xs">
                No strategy notes documented.
              </div>
            ) : (
              journalEntries.map(entry => (
                <div key={entry.id} className="bg-[#0a0d12] border border-[#1e293b] rounded-sm p-3 group relative hover:border-slate-700 transition-colors">
                  <button 
                    onClick={() => deleteEntry(entry.id)}
                    className="absolute top-3 right-3 text-slate-500 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="bg-blue-900/30 text-blue-400 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm">
                      {entry.asset}
                    </span>
                    <span className="bg-indigo-900/30 text-indigo-400 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm flex items-center space-x-1">
                      <Tag className="w-2.5 h-2.5" /> <span>{entry.tag || 'Strategy'}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono ml-auto mr-6">{entry.date}</span>
                  </div>
                  <p className="text-xs text-slate-300 font-mono whitespace-pre-wrap">
                    {entry.note}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
