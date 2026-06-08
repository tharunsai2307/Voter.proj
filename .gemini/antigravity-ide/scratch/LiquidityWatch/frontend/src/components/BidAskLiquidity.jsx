import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, Search, BarChart2, ShieldAlert } from 'lucide-react';

export default function BidAskLiquidity({ metricsMap, stocks, cryptos }) {
  const [selectedAsset, setSelectedAsset] = useState('AAPL');
  const metric = metricsMap[selectedAsset];

  const hasData = metric && metric.bidPrice && metric.askPrice;
  const hasSizes = hasData && metric.bidSize > 0 && metric.askSize > 0;

  const imbalance = hasSizes 
    ? (metric.bidSize / (metric.bidSize + metric.askSize)) * 100 
    : 50;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 font-sans w-full max-w-[1400px] mx-auto"
    >
      <div className="glass-panel-sharp p-4 border-l-4 border-l-purple-600 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
            <Layers className="w-5 h-5 text-purple-500" />
            <span>Bid-Ask Liquidity Intelligence</span>
          </h2>
          <p className="text-[10px] text-slate-500 uppercase">Real-Time Level 1 Liquidity & Spread Analysis</p>
        </div>
        
        <div className="flex items-center space-x-2 bg-[#0a0d12] border border-[#1e293b] p-1 rounded-sm">
          <Search className="w-4 h-4 text-slate-500 ml-2" />
          <select 
            value={selectedAsset} 
            onChange={(e) => setSelectedAsset(e.target.value)}
            className="bg-transparent border-none text-slate-200 text-xs font-mono focus:outline-none focus:ring-0 uppercase pr-4"
          >
            {[...stocks, ...cryptos].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {!metric ? (
        <div className="glass-panel-sharp p-12 text-center text-slate-600 font-mono text-sm">
          Awaiting tick data for {selectedAsset}...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* L1 Viewer */}
          <div className="glass-panel-sharp flex flex-col h-[600px]">
            <div className="bg-[#0a0d12] border-b border-[#1e293b] px-4 py-3 flex justify-between items-center">
               <span className="text-[10px] text-slate-500 font-bold uppercase">Order Book (L1 Proxy)</span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-full flex justify-between items-center mb-8 border-b border-[#1e293b] pb-8">
                <div className="text-left w-1/3">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Bid Size</div>
                  <div className="text-2xl font-mono text-slate-200">
                    {hasSizes ? metric.bidSize : 'N/A'}
                  </div>
                </div>
                <div className="text-center w-1/3">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Bid Price</div>
                  <div className="text-3xl font-mono text-emerald-400 font-bold">
                    ${hasData ? metric.bidPrice.toFixed(2) : '---'}
                  </div>
                </div>
              </div>

              <div className="w-full flex justify-between items-center">
                <div className="text-center w-1/3">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Ask Price</div>
                  <div className="text-3xl font-mono text-rose-400 font-bold">
                    ${hasData ? metric.askPrice.toFixed(2) : '---'}
                  </div>
                </div>
                <div className="text-right w-1/3">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Ask Size</div>
                  <div className="text-2xl font-mono text-slate-200">
                    {hasSizes ? metric.askSize : 'N/A'}
                  </div>
                </div>
              </div>

              <div className="mt-16 bg-slate-900/50 p-4 border border-[#1e293b] rounded-sm max-w-md w-full">
                <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
                  * Note: Full Level 2 depth data is unavailable on the current Polygon plan. The interface displays Level 1 BBO (Best Bid and Offer) from the WebSocket stream.
                </p>
              </div>
            </div>
          </div>

          {/* Intelligence Panel */}
          <div className="space-y-4 flex flex-col">
            <div className="glass-panel-sharp p-6 flex flex-col items-center justify-center text-center">
               <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-4">Level 1 Imbalance Ratio</span>
               {hasSizes ? (
                 <>
                   <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden flex relative mb-3">
                     <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${imbalance}%` }} />
                     <div className="bg-rose-500 h-full transition-all duration-500" style={{ width: `${100 - imbalance}%` }} />
                     <div className="absolute top-0 left-1/2 w-0.5 h-full bg-slate-100/50" />
                   </div>
                   <div className="flex justify-between w-full text-sm font-mono font-bold">
                     <span className="text-emerald-400">{imbalance.toFixed(1)}%</span>
                     <span className="text-rose-400">{(100 - imbalance).toFixed(1)}%</span>
                   </div>
                 </>
               ) : (
                 <div className="text-xs font-mono text-slate-600">Imbalance ratio unavailable.</div>
               )}
            </div>

            <div className="glass-panel-sharp p-6 border-t-2 border-t-blue-500">
               <h3 className="text-xs font-bold text-slate-300 uppercase flex items-center space-x-2 mb-4">
                 <BarChart2 className="w-4 h-4 text-blue-500" />
                 <span>Liquidity Profile</span>
               </h3>
               
               <div className="space-y-4 font-mono text-sm">
                 <div className="flex justify-between items-center border-b border-[#1e293b] pb-3">
                   <span className="text-slate-500">L1 Spread</span>
                   <span className="text-amber-400 font-bold">{metric.spread?.toFixed(2) || '0.00'}</span>
                 </div>
                 <div className="flex justify-between items-center border-b border-[#1e293b] pb-3">
                   <span className="text-slate-500">Liquidity Score</span>
                   <span className="text-blue-400 font-bold">{metric.liquidityScore?.toFixed(0) || '0'} / 100</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-slate-500">Volatility (StDev)</span>
                   <span className="text-indigo-400 font-bold">{metric.stdev?.toFixed(4) || '0.00'}</span>
                 </div>
               </div>
            </div>

            <div className="glass-panel-sharp p-6 flex-1">
               <h3 className="text-xs font-bold text-slate-300 uppercase flex items-center space-x-2 mb-4">
                 <ShieldAlert className="w-4 h-4 text-amber-500" />
                 <span>Microstructure Anomaly</span>
               </h3>
               {metric.volatilityLevel !== 'NORMAL' ? (
                 <div className="text-xs text-rose-400 bg-rose-950/20 p-4 border border-rose-900/50 rounded-sm">
                   Detected {metric.volatilityLevel} regime. Spread widening observed.
                 </div>
               ) : (
                 <div className="text-xs text-emerald-400 bg-emerald-950/20 p-4 border border-emerald-900/50 rounded-sm">
                   Normal market conditions. Stable spread observed.
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
