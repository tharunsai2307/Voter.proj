import React from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Square, FastForward, Activity, Search } from 'lucide-react';

export default function ReplayStudio({
  replayHistory,
  replayMetrics,
  replayProgress,
  replaySymbol,
  setReplaySymbol,
  replayDate,
  setReplayDate,
  wsRef,
  setReplayHistory,
  setReplayMetrics,
  beginnerMode
}) {
  const prices = replayHistory.map(h => h.price).filter(p => p !== null && !isNaN(p));
  const spreads = replayHistory.map(h => h.spread).filter(s => s !== null && !isNaN(s));
  const volumes = replayHistory.map(h => h.volume).filter(v => v !== null && !isNaN(v));
  const stdevs = replayHistory.map(h => h.stdev).filter(sd => sd !== null && !isNaN(sd));

  const avgPrice = prices.length ? (prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
  const avgSpread = spreads.length ? (spreads.reduce((a, b) => a + b, 0) / spreads.length) : 0;
  const avgVolume = volumes.length ? (volumes.reduce((a, b) => a + b, 0) / volumes.length) : 0;
  const avgVolatility = stdevs.length ? (stdevs.reduce((a, b) => a + b, 0) / stdevs.length) : 0;

  const formatVal = (val, dec = 2, prefix = "") => {
    if (val === undefined || val === null || isNaN(val)) return '---';
    return prefix + Number(val).toFixed(dec);
  };

  const startReplay = () => {
    setReplayHistory([]);
    setReplayMetrics(null);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: 'startReplay',
        symbol: replaySymbol,
        date: replayDate
      }));
    }
  };

  const pauseReplay = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'pauseReplay' }));
    }
  };

  const resumeReplay = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'resumeReplay' }));
    }
  };

  const stopReplay = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'stopReplay' }));
    }
    setReplayHistory([]);
    setReplayMetrics(null);
  };

  const setSpeed = (spd) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'setReplaySpeed', speed: spd }));
    }
  };

  const handleSeek = (index) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'seekReplay', index }));
    }
  };

  const renderSVGSparkline = (history) => {
    if (history.length < 2) return null;
    const validPoints = history.filter(h => h.price !== null && !isNaN(h.price));
    if (validPoints.length < 2) return null;

    const minPrice = Math.min(...validPoints.map(h => h.price));
    const maxPrice = Math.max(...validPoints.map(h => h.price));
    const range = maxPrice - minPrice || 1;

    const width = 1000;
    const height = 100;
    const dx = width / (validPoints.length - 1);

    const points = validPoints.map((h, i) => {
      const x = i * dx;
      const y = height - ((h.price - minPrice) / range) * height;
      return `${x},${y}`;
    }).join(' ');

    const lastPoint = validPoints[validPoints.length - 1];
    const firstPoint = validPoints[0];
    const isUp = lastPoint.price >= firstPoint.price;
    const color = isUp ? "#10b981" : "#ef4444";

    return (
      <svg viewBox={`0 -10 ${width} ${height + 20}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points}
          className={isUp ? 'candle-glow-green' : 'candle-glow-red'}
        />
        {/* Fill gradient */}
        <polygon
          fill={`url(#gradient-${isUp ? 'up' : 'down'})`}
          points={`${points} ${width},${height} 0,${height}`}
          opacity="0.2"
        />
        <defs>
          <linearGradient id="gradient-up" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="gradient-down" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0"/>
          </linearGradient>
        </defs>
      </svg>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 font-sans w-full max-w-[1400px] mx-auto"
    >
      <div className="glass-panel-sharp p-4 border-l-4 border-l-blue-600">
        <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
          <Activity className="w-5 h-5 text-blue-500" />
          <span>Market Replay Studio</span>
        </h2>
        <p className="text-slate-500 text-xs mt-1">Replay historical data sequentially through the institutional analyzer pipeline.</p>
      </div>

      {beginnerMode && (
        <div className="bg-blue-950/20 border border-blue-900/30 p-4 rounded-sm text-xs text-slate-350 space-y-2 text-left">
          <h4 className="font-bold text-blue-400 flex items-center space-x-1.5">
            <span>💡 Beginner Guide: Market Replay Studio</span>
          </h4>
          <p className="leading-relaxed">
            Market Replay lets you pick a target date and asset (e.g. <strong>AAPL</strong>) and play historical order events step-by-step. 
            You can speed up execution up to 100x or pause/seek manually. This helps you study past flash crashes, volatility regimes, or liquidity gaps in historical context.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Controls Panel */}
        <div className="md:col-span-1 glass-panel-sharp p-4 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Asset Symbol</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2 top-2 text-slate-600" />
              <input
                type="text"
                value={replaySymbol}
                onChange={(e) => setReplaySymbol(e.target.value.toUpperCase())}
                placeholder="AAPL, BTCUSD..."
                className="pro-input w-full pl-8 uppercase font-mono"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Target Date</label>
            <input
              type="date"
              value={replayDate}
              onChange={(e) => setReplayDate(e.target.value)}
              className="pro-input w-full font-mono text-xs"
            />
          </div>
          <button
            onClick={startReplay}
            disabled={replayProgress.state === 'PLAYING'}
            className="pro-btn pro-btn-primary w-full flex items-center justify-center space-x-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Load & Execute</span>
          </button>
        </div>

        {/* Timeline Panel */}
        <div className="md:col-span-3 glass-panel-sharp p-4 flex flex-col justify-between">
          {replayProgress.total > 0 ? (
            <div className="space-y-4 h-full flex flex-col justify-between">
              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-500">Progress: </span>
                  <span className="font-mono text-blue-400 font-bold">{replayProgress.currentIndex} / {replayProgress.total}</span>
                </div>
                <div>
                  <span className="text-slate-500">Simulated Time: </span>
                  <span className="font-mono text-slate-200">{new Date(replayProgress.timestamp).toUTCString()}</span>
                </div>
              </div>

              <input
                type="range"
                min="0"
                max={replayProgress.total - 1}
                value={replayProgress.currentIndex}
                onChange={(e) => handleSeek(parseInt(e.target.value))}
                className="w-full h-1 bg-[#0a0d12] rounded-lg appearance-none cursor-pointer accent-blue-600"
              />

              <div className="flex justify-between items-center mt-4">
                <div className="flex space-x-2">
                  {replayProgress.state === 'PLAYING' ? (
                    <button onClick={pauseReplay} className="pro-btn bg-amber-600 hover:bg-amber-700 text-white flex items-center space-x-1">
                      <Pause className="w-3.5 h-3.5 fill-current" /> <span>Pause</span>
                    </button>
                  ) : (
                    <button onClick={resumeReplay} disabled={replayProgress.state === 'COMPLETED'} className="pro-btn bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1">
                      <Play className="w-3.5 h-3.5 fill-current" /> <span>Play</span>
                    </button>
                  )}
                  <button onClick={stopReplay} className="pro-btn bg-rose-600 hover:bg-rose-700 text-white flex items-center space-x-1">
                    <Square className="w-3.5 h-3.5 fill-current" /> <span>Stop</span>
                  </button>
                </div>

                <div className="flex bg-[#0a0d12] border border-[#1e293b] rounded-sm">
                  {[1, 2, 10, 100].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setSpeed(spd)}
                      className={`px-2 py-1 text-[10px] font-mono transition-colors ${replayProgress.speed === spd ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-[#161b22]'}`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-600 text-xs font-mono">
              Timeline awaiting data...
            </div>
          )}
        </div>
      </div>

      {replayMetrics && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 glass-panel-sharp p-4">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-[#1e293b] pb-2">Tape Sparkline</div>
            <div className="h-32 mb-4 border-b border-[#1e293b] pb-4">
              {renderSVGSparkline(replayHistory)}
            </div>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Simulated Price</div>
                <div className="font-mono text-lg text-slate-100">{formatVal(replayMetrics.lastPrice, 2, "$")}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Spread (Bps)</div>
                <div className="font-mono text-lg text-amber-400">
                  {replayMetrics.spread !== null ? `${formatVal(replayMetrics.spread, 2)}` : "---"}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Liquidity Rating</div>
                <div className="font-mono text-lg text-blue-400">{formatVal(replayMetrics.liquidityScore, 0)}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Risk Level</div>
                <div className="font-mono text-lg text-rose-400">{formatVal(replayMetrics.overallRiskScore, 0)}</div>
              </div>
            </div>
          </div>
          <div className="glass-panel-sharp p-4">
             <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-[#1e293b] pb-2">Session Averages</div>
             <div className="space-y-4 text-xs font-mono">
               <div className="flex justify-between text-slate-400">
                 <span>Avg Price:</span><span className="text-slate-200">{formatVal(avgPrice, 2, "$")}</span>
               </div>
               <div className="flex justify-between text-slate-400">
                 <span>Avg Spread:</span><span className="text-slate-200">{formatVal(avgSpread, 3, "$")}</span>
               </div>
               <div className="flex justify-between text-slate-400">
                 <span>Avg Volume:</span><span className="text-slate-200">{Math.round(avgVolume).toLocaleString()}</span>
               </div>
               <div className="flex justify-between text-slate-400">
                 <span>Volatility:</span><span className="text-slate-200">{formatVal(avgVolatility, 4)}</span>
               </div>
             </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
