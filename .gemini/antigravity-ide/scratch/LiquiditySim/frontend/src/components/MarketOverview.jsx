import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Search, TrendingUp, TrendingDown, Bell, ShieldAlert, Zap, Globe } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, Tooltip, YAxis } from 'recharts';


export default function MarketOverview({ stocks, cryptos, metricsMap, historyMap, alerts, beginnerMode, onRequestExplain }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState(['AAPL', 'X:BTCUSD']);
  const [expandedRow, setExpandedRow] = useState(null);

  const allAssets = [...stocks, ...cryptos];
  const filteredAssets = allAssets.filter(a => a.toLowerCase().includes(searchQuery.toLowerCase()));

  // Build chart data from historyMap — last 60 ticks per symbol
  const buildChartData = (sym) => {
    const hist = historyMap?.[sym] || [];
    return hist.slice(-60).map((h, i) => ({
      i,
      price: typeof h === 'object' ? (h.price ?? h.lastPrice) : h
    })).filter(d => d.price != null && !isNaN(d.price));
  };


  const toggleFavorite = (sym) => {
    setFavorites(prev => prev.includes(sym) ? prev.filter(f => f !== sym) : [...prev, sym]);
  };

  const getSector = (sym) => {
    if (sym.startsWith('X:')) return 'Crypto';
    if (['AAPL', 'MSFT', 'NVDA', 'AMD'].includes(sym)) return 'Technology';
    if (['SPY', 'QQQ'].includes(sym)) return 'Index ETF';
    if (['TSLA'].includes(sym)) return 'Automotive';
    return 'Equities';
  };

  const grouped = filteredAssets.reduce((acc, sym) => {
    const sec = getSector(sym);
    if (!acc[sec]) acc[sec] = [];
    acc[sec].push(sym);
    return acc;
  }, {});

  const renderSVGSparkline = (history) => {
    if (!history || history.length < 2) return <div className="w-16 h-4 bg-slate-900/50 rounded opacity-30" />;
    const prices = history.map(p => typeof p === 'object' ? (p.lastPrice || p.price || p) : p).filter(p => p != null && !isNaN(p));
    if (prices.length < 2) return <div className="w-16 h-4 bg-slate-900/50 rounded opacity-30" />;

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice || 1;

    const width = 60;
    const height = 20;
    const dx = width / (prices.length - 1);

    const points = prices.map((p, i) => {
      const x = i * dx;
      const y = height - ((p - minPrice) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    const isUp = prices[prices.length - 1] >= prices[0];
    const color = isUp ? "#00c853" : "#ff3d00";

    return (
      <svg width={width} height={height} viewBox={`0 -2 ${width} ${height + 4}`} className="overflow-visible">
        <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
      </svg>
    );
  };

  const formatVal = (val, dec = 2) => (val === undefined || val === null || isNaN(val)) ? '---' : Number(val).toFixed(dec);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 font-sans w-full"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel-sharp p-3">
        <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
          <Globe className="w-4 h-4 text-blue-500" />
          <span>Market Overview</span>
        </h2>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2 top-1.5 w-3.5 h-3.5 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search symbols..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pro-input w-full pl-7 uppercase font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 space-y-4">
          {Object.entries(grouped).map(([sector, symbols]) => (
            <div key={sector} className="glass-panel-sharp overflow-hidden">
              <div className="bg-[#0a0d12] px-4 py-2 border-b border-[#1e293b] flex items-center justify-between">
                <h3 className="font-bold text-slate-400 text-[10px] tracking-wider uppercase">{sector}</h3>
                <span className="text-[10px] text-slate-600 font-mono">{symbols.length}</span>
              </div>
              
              <table className="w-full text-left font-mono">
                <thead>
                  <tr className="text-[10px] text-slate-500 border-b border-[#1e293b]">
                    <th className="px-4 py-2 font-normal">Fav</th>
                    <th className="px-4 py-2 font-normal">Symbol</th>
                    <th className="px-4 py-2 font-normal text-right">Price</th>
                    <th className="px-4 py-2 font-normal text-right">Change</th>
                    <th className="px-4 py-2 font-normal text-center">Trend</th>
                    <th className="px-4 py-2 font-normal text-right">Vol</th>
                    <th className="px-4 py-2 font-normal text-center">Alerts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]/50">
                  {symbols.map(sym => {
                    const m = metricsMap[sym] || {};
                    const hist = historyMap[sym] || [];
                    const isFav = favorites.includes(sym);
                    const activeAlerts = alerts.filter(a => a.asset === sym);
                    const isExpanded = expandedRow === sym;

                    return (
                      <React.Fragment key={sym}>
                        <tr 
                          className="interactive-row cursor-pointer"
                          onClick={() => setExpandedRow(isExpanded ? null : sym)}
                        >
                          <td className="px-4 py-2 w-8 text-center" onClick={(e) => { e.stopPropagation(); toggleFavorite(sym); }}>
                            <Star className={`w-3.5 h-3.5 ${isFav ? 'text-amber-400 fill-amber-400' : 'text-slate-700 hover:text-slate-500'}`} />
                          </td>
                          <td className="px-4 py-2 font-bold text-slate-200">{sym}</td>
                          <td className="px-4 py-2 text-right">{m.lastPrice ? `$${m.lastPrice.toFixed(2)}` : '---'}</td>
                          <td className={`px-4 py-2 text-right ${m.dailyChangePercent >= 0 ? 'text-[#00c853]' : 'text-[#ff3d00]'}`}>
                            {m.dailyChangePercent != null ? `${m.dailyChangePercent >= 0 ? '+' : ''}${m.dailyChangePercent.toFixed(2)}%` : '---'}
                          </td>
                          <td className="px-4 py-2 w-24">
                            <div className="flex justify-center">
                              {renderSVGSparkline(hist)}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-right text-slate-400 text-[10px]">
                            {(() => {
                              const v = m.volume;
                              if (!v && v !== 0) return '---';
                              if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
                              if (v >= 1000) return (v / 1000).toFixed(1) + 'K';
                              return v.toFixed(v < 10 ? 2 : 0);
                            })()}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {activeAlerts.length > 0 ? <ShieldAlert className="w-3.5 h-3.5 text-rose-500 mx-auto" /> : <span className="text-slate-700">-</span>}
                          </td>
                        </tr>
                        
                        {/* Expandable Inline Explainer Panel */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.tr 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="bg-[#0a0d12]"
                            >
                              <td colSpan="7" className="px-4 py-3 border-b border-[#1e293b]">
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 text-[10px]">
                                  <div className="space-y-1 border-r border-[#1e293b]/50 pr-4">
                                    <span className="text-slate-500 block uppercase font-bold tracking-wider">Market Health</span>
                                    <div className="flex justify-between mt-1">
                                      <span className="text-slate-400">Score:</span>
                                      <span className="text-blue-400 font-bold">{formatVal(m.marketHealthScore, 0)}/100</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">Liquidity:</span>
                                      <span className="text-emerald-400">{formatVal(m.liquidityScore, 0)}</span>
                                    </div>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); onRequestExplain(`Explain the market health of ${sym} which has a score of ${m.marketHealthScore}`); }}
                                      className="mt-2 text-blue-500 hover:text-blue-400 underline decoration-blue-500/30 w-full text-left flex items-center space-x-1"
                                    >
                                      <Zap className="w-3 h-3" /> <span>Generate AI Explanation</span>
                                    </button>
                                  </div>
                                  {!beginnerMode && (
                                    <div className="space-y-1 border-r border-[#1e293b]/50 pr-4">
                                      <span className="text-slate-500 block uppercase font-bold tracking-wider">Volatility & Spread</span>
                                      <div className="flex justify-between mt-1">
                                        <span className="text-slate-400">Spread:</span>
                                        <span className="text-amber-400">{formatVal(m.spread, 2)} ({formatVal(m.spreadPercent, 3)}%)</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-400">Regime:</span>
                                        <span className="text-rose-400">{m.volatilityLevel || 'NORMAL'}</span>
                                      </div>
                                    </div>
                                  )}
                                  <div className={`space-y-1 border-r border-[#1e293b]/50 pr-4 ${beginnerMode ? 'lg:col-span-2' : ''}`}>
                                    <span className="text-slate-500 block uppercase font-bold tracking-wider">Active Alerts</span>
                                    <div className="mt-1 max-h-[70px] overflow-y-auto space-y-1">
                                      {activeAlerts.length > 0 ? (
                                        activeAlerts.map(alert => (
                                          <div key={alert.id} className="text-rose-400 break-words leading-tight">
                                            • {alert.message}
                                          </div>
                                        ))
                                      ) : (
                                        <span className="text-slate-600 italic">No anomalies detected.</span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Real-time Price Stream Chart */}
                                  <div className="space-y-1 lg:col-span-2">
                                    <span className="text-slate-500 block uppercase font-bold tracking-wider mb-1">Real-Time Price Stream</span>
                                    {(() => {
                                      const chartData = buildChartData(sym);
                                      const first = chartData[0]?.price;
                                      const last = chartData[chartData.length - 1]?.price;
                                      const isUp = last != null && first != null ? last >= first : true;
                                      const color = isUp ? '#00c853' : '#ff3d00';
                                      const gradId = `grad_overview_${sym.replace(/[^a-z0-9]/gi,'_')}`;
                                      
                                      if (chartData.length >= 2) {
                                        return (
                                          <div className="h-[75px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                              <AreaChart data={chartData} margin={{ top: 2, right: 5, left: 0, bottom: 2 }}>
                                                <defs>
                                                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={color} stopOpacity={0.25}/>
                                                    <stop offset="95%" stopColor={color} stopOpacity={0}/>
                                                  </linearGradient>
                                                </defs>
                                                <YAxis domain={['auto', 'auto']} hide />
                                                <Tooltip
                                                  contentStyle={{ background: '#0d1117', border: `1px solid ${color}40`, fontSize: 8, padding: '2px 6px', borderRadius: 4 }}
                                                  formatter={(val) => [`$${Number(val).toFixed(2)}`, 'Price']}
                                                  labelFormatter={() => ''}
                                                />
                                                <Area
                                                  type="monotone"
                                                  dataKey="price"
                                                  stroke={color}
                                                  strokeWidth={1.5}
                                                  fill={`url(#${gradId})`}
                                                  dot={false}
                                                  isAnimationActive={true}
                                                  animationDuration={250}
                                                />
                                              </AreaChart>
                                            </ResponsiveContainer>
                                          </div>
                                        );
                                      } else {
                                        return (
                                          <div className="h-[75px] flex items-center justify-center text-[9px] text-slate-600 font-mono italic">
                                            Awaiting price ticks...
                                          </div>
                                        );
                                      }
                                    })()}
                                  </div>
                                </div>
                              </td>
                            </motion.tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="glass-panel-sharp p-4">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center space-x-2">
              <Bell className="w-3.5 h-3.5 text-amber-500" />
              <span>Intelligence Feed</span>
            </h3>
            <div className="space-y-2">
              {alerts.slice(0, 8).map(alert => (
                <div key={alert.id} className="bg-[#0a0d12] p-2 rounded-sm border border-rose-900/30 text-[10px] hover:border-rose-500/50 transition-colors cursor-pointer"
                  onClick={() => {
                    setExpandedRow(expandedRow === alert.asset ? null : alert.asset);
                    onRequestExplain(`Analyze the anomaly: ${alert.message} for ${alert.asset}`);
                  }}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-rose-500">{alert.asset}</span>
                    <span className="text-slate-600">{alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : ''}</span>
                  </div>
                  <div className="text-slate-300 leading-tight">{alert.message}</div>
                </div>
              ))}
              {alerts.length === 0 && <div className="text-slate-600 text-[10px]">System running optimal. No intelligence events.</div>}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
