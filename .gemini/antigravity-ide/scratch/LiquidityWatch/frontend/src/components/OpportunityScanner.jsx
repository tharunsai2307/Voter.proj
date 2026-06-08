import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Zap, Activity, ShieldAlert, Crosshair } from 'lucide-react';

export default function OpportunityScanner({ metricsMap }) {
  const list = Object.values(metricsMap);
  
  if (list.length === 0) {
    return (
      <div className="glass-panel p-8 text-center text-slate-500 font-mono text-sm h-[50vh] flex flex-col items-center justify-center">
        <Activity className="w-10 h-10 mb-4 opacity-20" />
        Awaiting market intelligence feed. Ensure the backend is polling active assets.
      </div>
    );
  }

  const formatVal = (val, decimals = 2) => {
    if (val === undefined || val === null || isNaN(val)) return '---';
    return Number(val).toFixed(decimals);
  };

  const formatVol = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '---';
    if (val > 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val > 1000) return (val / 1000).toFixed(1) + 'K';
    return val;
  };

  const topGainers = [...list].filter(a => a.dailyChangePercent != null).sort((a, b) => b.dailyChangePercent - a.dailyChangePercent).slice(0, 10);
  const topLosers = [...list].filter(a => a.dailyChangePercent != null).sort((a, b) => a.dailyChangePercent - b.dailyChangePercent).slice(0, 10);
  const topVolume = [...list].filter(a => a.volume != null).sort((a, b) => b.volume - a.volume).slice(0, 10);
  const topVolatile = [...list].filter(a => a.stdev != null && a.lastPrice).sort((a, b) => (b.stdev / b.lastPrice) - (a.stdev / a.lastPrice)).slice(0, 10);
  const topLiquidity = [...list].filter(a => a.liquidityScore != null).sort((a, b) => b.liquidityScore - a.liquidityScore).slice(0, 10);
  const worstLiquidity = [...list].filter(a => a.liquidityScore != null).sort((a, b) => a.liquidityScore - b.liquidityScore).slice(0, 10);

  const renderTable = (title, icon, data, valueRenderer, headerColorClass, valueColorClass) => (
    <div className="glass-panel-sharp overflow-hidden">
      <div className={`px-4 py-2 font-bold text-xs uppercase tracking-wider flex justify-between items-center ${headerColorClass}`}>
        <span className="flex items-center space-x-2">
          {icon}
          <span>{title}</span>
        </span>
      </div>
      <div className="divide-y divide-[#1e293b]/50">
        {data.length === 0 ? (
          <div className="px-4 py-3 text-slate-600 italic text-xs">No data</div>
        ) : (
          data.map((item, idx) => (
            <div key={item.symbol} className="interactive-row px-4 py-2 flex justify-between items-center text-xs">
              <span className="font-mono text-slate-300"><span className="text-slate-600 mr-2">{idx + 1}.</span>{item.symbol}</span>
              <span className={`font-mono font-medium ${valueColorClass(item)}`}>
                {valueRenderer(item)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, filter: 'blur(4px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.3 }}
      className="space-y-4 font-sans w-full"
    >
      <div className="glass-panel-sharp p-4 border-l-4 border-l-blue-500">
        <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
          <Crosshair className="w-5 h-5 text-blue-400" />
          <span>Opportunity Scanner</span>
        </h2>
        <p className="text-slate-500 text-xs mt-1">Real-time ranked lists across the entire monitored universe, updated per polling cycle.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {renderTable(
          "Top Gainers", 
          <TrendingUp className="w-3.5 h-3.5" />, 
          topGainers, 
          (item) => `+${formatVal(item.dailyChangePercent)}%`,
          "bg-emerald-900/20 text-emerald-400 border-b border-emerald-900/50",
          () => "text-emerald-400"
        )}

        {renderTable(
          "Top Losers", 
          <TrendingUp className="w-3.5 h-3.5 rotate-180" />, 
          topLosers, 
          (item) => `${formatVal(item.dailyChangePercent)}%`,
          "bg-rose-900/20 text-rose-400 border-b border-rose-900/50",
          () => "text-rose-400"
        )}

        {renderTable(
          "Highest Volume", 
          <Zap className="w-3.5 h-3.5" />, 
          topVolume, 
          (item) => formatVol(item.volume),
          "bg-blue-900/20 text-blue-400 border-b border-blue-900/50",
          () => "text-blue-400"
        )}

        {renderTable(
          "Highest Volatility", 
          <Activity className="w-3.5 h-3.5" />, 
          topVolatile, 
          (item) => `${formatVal((item.stdev / item.lastPrice) * 100)}% CV`,
          "bg-amber-900/20 text-amber-400 border-b border-amber-900/50",
          () => "text-amber-400"
        )}

        {renderTable(
          "Best Liquidity", 
          <ShieldAlert className="w-3.5 h-3.5" />, 
          topLiquidity, 
          (item) => `${formatVal(item.liquidityScore)}/100`,
          "bg-indigo-900/20 text-indigo-400 border-b border-indigo-900/50",
          (item) => item.liquidityScore >= 80 ? 'text-emerald-400' : 'text-indigo-400'
        )}

        {renderTable(
          "Worst Liquidity (Risk)", 
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />, 
          worstLiquidity, 
          (item) => `${formatVal(item.liquidityScore)}/100`,
          "bg-[#0a0d12] text-slate-400 border-b border-[#1e293b]",
          (item) => item.liquidityScore <= 40 ? 'text-rose-400' : 'text-amber-400'
        )}
      </div>
    </motion.div>
  );
}
