import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Save, FileText, Trash2, HeartPulse } from 'lucide-react';

export default function TradingJournalTab({ paperHistory }) {
  const [journalEntries, setJournalEntries] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('General');
  const [psychology, setPsychology] = useState('Neutral');

  const tradedAssets = ['General', ...new Set(paperHistory.map(h => h.asset))];
  const psychStates = ['Neutral', 'Confident', 'Anxious', 'FOMO', 'Revenge Trading', 'Focused'];

  useEffect(() => {
    const saved = localStorage.getItem('lw_personal_journal');
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
      psychology,
      note: newNote,
    };
    const updated = [entry, ...journalEntries];
    setJournalEntries(updated);
    localStorage.setItem('lw_personal_journal', JSON.stringify(updated));
    setNewNote('');
  };

  const deleteEntry = (id) => {
    const updated = journalEntries.filter(e => e.id !== id);
    setJournalEntries(updated);
    localStorage.setItem('lw_personal_journal', JSON.stringify(updated));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 font-sans w-full"
    >
      <div className="glass-panel-sharp p-4 border-l-4 border-l-emerald-600 flex items-center space-x-3">
        <BookOpen className="w-5 h-5 text-emerald-500" />
        <div>
          <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wider">Trading Journal</h2>
          <p className="text-[10px] text-slate-500 uppercase">Personal Decisions & Psychological State</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Editor */}
        <div className="glass-panel-sharp p-4 lg:col-span-1 h-fit space-y-4">
          <h3 className="text-xs font-bold text-slate-200 flex items-center space-x-2 border-b border-[#1e293b] pb-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>New Personal Entry</span>
          </h3>
          
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Related Asset</label>
              <select 
                value={selectedAsset} 
                onChange={(e) => setSelectedAsset(e.target.value)}
                className="pro-input w-full"
              >
                {tradedAssets.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Psychological State</label>
              <select 
                value={psychology} 
                onChange={(e) => setPsychology(e.target.value)}
                className="pro-input w-full"
              >
                {psychStates.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            
            <div>
              <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Notes</label>
              <textarea 
                rows="6"
                placeholder="Why did you take this trade? How did you feel?"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="pro-input w-full resize-none font-sans text-xs"
              ></textarea>
            </div>

            <button 
              onClick={saveEntry}
              disabled={!newNote.trim()}
              className="pro-btn bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white w-full py-2 flex items-center justify-center space-x-2"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Entry</span>
            </button>
          </div>
        </div>

        {/* Entries Log */}
        <div className="glass-panel-sharp p-4 lg:col-span-2 flex flex-col h-full max-h-[600px]">
          <h3 className="text-xs font-bold text-slate-200 mb-4 flex items-center space-x-2 border-b border-[#1e293b] pb-2">
            <HeartPulse className="w-4 h-4 text-rose-400" />
            <span>Personal Journal History</span>
          </h3>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {journalEntries.length === 0 ? (
              <div className="text-center py-12 text-slate-600 font-sans text-xs">
                No personal journal entries documented.
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
                    <span className="bg-emerald-900/30 text-emerald-400 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm">
                      {entry.asset}
                    </span>
                    <span className="bg-rose-900/30 text-rose-400 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm flex items-center space-x-1">
                       <span>{entry.psychology}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono ml-auto mr-6">{entry.date}</span>
                  </div>
                  <p className="text-sm text-slate-300 font-sans whitespace-pre-wrap leading-relaxed">
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
