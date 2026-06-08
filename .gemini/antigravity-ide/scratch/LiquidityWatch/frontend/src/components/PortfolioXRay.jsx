import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Zap, TrendingUp, TrendingDown, Activity, AlertCircle, ShoppingCart, Clock, Crosshair, Target, Trash2, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, Tooltip, YAxis } from 'recharts';

export default function PortfolioXRay({ 
  paperCash, 
  paperPositions, 
  metricsMap,
  historyMap,
  paperHistory,
  pendingOrders,
  stocks,
  cryptos,
  onPlaceMarketOrder,
  onPlacePendingOrder,
  onCancelPendingOrder,
  beginnerMode,
  onRequestExplain,
  onOpenAddFunds
}) {
  const [activeExplain, setActiveExplain] = useState(null);
  const [chartSymbol, setChartSymbol] = useState(null); // selected full-screen chart
  const [orderType, setOrderType] = useState('MARKET');
  const [asset, setAsset] = useState('AAPL');
  const [qty, setQty] = useState(1);
  const [limitPrice, setLimitPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');

  const allSymbols = [...stocks, ...cryptos];

  // Build chart data from historyMap — last 60 ticks per symbol
  const buildChartData = (sym) => {
    const hist = historyMap?.[sym] || [];
    return hist.slice(-60).map((h, i) => ({
      i,
      price: typeof h === 'object' ? (h.price ?? h.lastPrice) : h
    })).filter(d => d.price != null && !isNaN(d.price));
  };

  let totalValue = paperCash;
  let unrealizedPL = 0;
  
  const positionsWithMetrics = Object.entries(paperPositions).map(([sym, pos]) => {
    const m = metricsMap[sym] || {};
    const price = m.lastPrice || pos.avgPrice;
    const pl = (price - pos.avgPrice) * pos.shares;
    const plPct = pos.avgPrice > 0 ? ((price - pos.avgPrice) / pos.avgPrice) * 100 : 0;
    
    totalValue += price * pos.shares;
    unrealizedPL += pl;
    
    return { sym, pos, price, pl, plPct, m };
  });

  const returnPct = ((totalValue - 100000) / 100000) * 100;

  // Simple heuristic scores
  const riskScore = 61; // Stub
  const liquidityScore = 84; // Stub
  const divScore = Math.min(100, positionsWithMetrics.length * 15);

  const bestPerformer = positionsWithMetrics.reduce((best, curr) => curr.plPct > (best?.plPct || -Infinity) ? curr : best, null);
  const worstPerformer = positionsWithMetrics.reduce((worst, curr) => curr.plPct < (worst?.plPct || Infinity) ? curr : worst, null);

  const currentPrice = metricsMap[asset]?.lastPrice || 0;

  const handleExecute = (side) => {
    if (orderType === 'MARKET') {
      onPlaceMarketOrder(asset, qty, side);
    } else {
      if (!limitPrice && orderType === 'LIMIT') return alert("Enter Limit Price");
      onPlacePendingOrder({
        id: Date.now().toString(),
        asset,
        qty,
        side,
        type: orderType,
        targetPrice: parseFloat(limitPrice),
        stopLoss: stopLoss ? parseFloat(stopLoss) : null,
        takeProfit: takeProfit ? parseFloat(takeProfit) : null,
        time: new Date().toLocaleTimeString()
      });
      setLimitPrice('');
      setStopLoss('');
      setTakeProfit('');
    }
  };

  const formatVal = (val, dec = 2) => (val === undefined || val === null || isNaN(val)) ? '---' : Number(val).toFixed(dec);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 font-sans w-full"
    >
      {/* Top X-Ray Summary */}
      <div className={`grid grid-cols-2 ${beginnerMode ? 'md:grid-cols-3' : 'md:grid-cols-5'} gap-4`}>
        <div className="glass-panel-sharp p-4 flex flex-col justify-center border-l-4 border-l-blue-600">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Portfolio Value</span>
          <span className="text-xl font-mono font-bold text-slate-100">${totalValue.toFixed(2)}</span>
        </div>
        <div className="glass-panel-sharp p-4 flex flex-col justify-center relative group">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Available Cash</span>
          <span className="text-xl font-mono font-bold text-emerald-400">${paperCash.toFixed(2)}</span>
          <button 
            onClick={onOpenAddFunds}
            className="absolute top-2 right-2 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-400 px-2 py-1 rounded text-[9px] font-bold transition-all shadow shadow-emerald-950/50 cursor-pointer"
          >
            + Add Cash
          </button>
        </div>
        <div className="glass-panel-sharp p-4 flex flex-col justify-center">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Unrealized P/L</span>
          <span className={`text-xl font-mono font-bold flex items-center space-x-1 ${unrealizedPL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {unrealizedPL >= 0 ? <TrendingUp className="w-4 h-4"/> : <TrendingDown className="w-4 h-4"/>}
            <span>${Math.abs(unrealizedPL).toFixed(2)}</span>
          </span>
        </div>
        {!beginnerMode && (
          <>
            <div className="glass-panel-sharp p-4 flex flex-col justify-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Risk Score</span>
              <div className="flex items-center space-x-2">
                <span className={`text-xl font-mono font-bold ${riskScore > 70 ? 'text-rose-400' : riskScore > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {riskScore}/100
                </span>
                <button onClick={() => onRequestExplain(`Explain risk score ${riskScore}`)} className="text-blue-500 hover:text-blue-400"><Zap className="w-3.5 h-3.5"/></button>
              </div>
            </div>
            <div className="glass-panel-sharp p-4 flex flex-col justify-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Liquidity Score</span>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-mono font-bold text-indigo-400">{liquidityScore}/100</span>
                <button onClick={() => onRequestExplain(`Explain liquidity score ${liquidityScore}`)} className="text-blue-500 hover:text-blue-400"><Zap className="w-3.5 h-3.5"/></button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── LIVE PRICE CHARTS ── */}
      <div className="glass-panel-sharp overflow-hidden">
        <div className="bg-[#0a0d12] px-4 py-2 border-b border-[#1e293b] flex items-center justify-between">
          <h3 className="font-bold text-slate-400 text-[10px] tracking-wider uppercase flex items-center space-x-2">
            <BarChart2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Live Price Streams</span>
          </h3>
          <span className="text-[9px] text-slate-600 font-mono">Updates every 15s &bull; last 60 ticks</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-0 divide-x divide-[#1e293b] border-t border-[#1e293b]">
          {allSymbols.map(sym => {
            const m = metricsMap[sym] || {};
            const chartData = buildChartData(sym);
            const first = chartData[0]?.price;
            const last = chartData[chartData.length - 1]?.price;
            const isUp = last != null && first != null ? last >= first : true;
            const color = isUp ? '#00c853' : '#ff3d00';
            const gradId = `grad_${sym.replace(/[^a-z0-9]/gi,'_')}`;
            const changeAmt = (last && first) ? last - first : null;
            const changePct = (last && first && first !== 0) ? ((last - first) / first) * 100 : null;

            return (
              <motion.div
                key={sym}
                className="p-3 cursor-pointer hover:bg-[#0d1117] transition-colors group"
                onClick={() => setChartSymbol(chartSymbol === sym ? null : sym)}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
              >
                {/* Symbol + Price */}
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <div className="text-[10px] font-bold text-slate-300 font-mono">{sym.replace('X:','')}</div>
                    <div className="text-base font-bold font-mono" style={{ color }}>
                      {m.lastPrice != null ? `$${m.lastPrice.toFixed(sym.startsWith('X:') ? 2 : 2)}` : '---'}
                    </div>
                  </div>
                  <div className="text-right">
                    {changePct != null ? (
                      <span className="text-[9px] font-mono font-bold" style={{ color }}>
                        {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%
                      </span>
                    ) : (
                      m.dailyChangePercent != null ? (
                        <span className={`text-[9px] font-mono font-bold ${m.dailyChangePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {m.dailyChangePercent >= 0 ? '+' : ''}{m.dailyChangePercent.toFixed(2)}%
                        </span>
                      ) : <span className="text-[9px] text-slate-600">—</span>
                    )}
                    <div className="text-[8px] text-slate-600 font-mono mt-0.5">
                      {chartData.length > 0 ? `${chartData.length} ticks` : 'Awaiting data...'}
                    </div>
                  </div>
                </div>

                {/* Sparkline Area Chart */}
                {chartData.length >= 2 ? (
                  <div className="h-14">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
                        <defs>
                          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={color} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <YAxis domain={['auto', 'auto']} hide />
                        <Tooltip
                          contentStyle={{ background: '#0d1117', border: '1px solid #1e293b', fontSize: 9, borderRadius: 4 }}
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
                          animationDuration={300}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-14 flex items-center justify-center">
                    <div className="w-full h-0.5 bg-slate-800 rounded animate-pulse" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Expanded full chart on click */}
        <AnimatePresence>
          {chartSymbol && (() => {
            const chartData = buildChartData(chartSymbol);
            const m = metricsMap[chartSymbol] || {};
            const first = chartData[0]?.price;
            const last = chartData[chartData.length - 1]?.price;
            const isUp = last != null && first != null ? last >= first : true;
            const color = isUp ? '#00c853' : '#ff3d00';
            const gradId = `grad_expanded_${chartSymbol.replace(/[^a-z0-9]/gi,'_')}`;
            return (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-[#1e293b] overflow-hidden bg-[#08090d]"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-sm font-bold text-slate-100 font-mono">{chartSymbol}</span>
                      <span className="text-xs text-slate-500 ml-3">
                        ${m.lastPrice?.toFixed(2) ?? '---'} &bull; {chartData.length} ticks &bull; Real-time
                      </span>
                    </div>
                    <button onClick={() => setChartSymbol(null)} className="text-slate-600 hover:text-slate-400 text-xs">✕ Close</button>
                  </div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <defs>
                          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.25}/>
                            <stop offset="95%" stopColor={color} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <YAxis domain={['auto', 'auto']} tick={{ fill: '#475569', fontSize: 9 }} width={55} tickFormatter={v => `$${v.toFixed(2)}`} />
                        <Tooltip
                          contentStyle={{ background: '#0d1117', border: `1px solid ${color}40`, fontSize: 10, borderRadius: 6 }}
                          formatter={(val) => [`$${Number(val).toFixed(2)}`, 'Price']}
                          labelFormatter={(i) => `Tick ${i}`}
                        />
                        <Area
                          type="monotone"
                          dataKey="price"
                          stroke={color}
                          strokeWidth={2}
                          fill={`url(#${gradId})`}
                          dot={false}
                          isAnimationActive={true}
                          animationDuration={400}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Side: Active Holdings & History */}
        <div className="lg:col-span-2 space-y-4 flex flex-col">
          <div className="glass-panel-sharp flex-1 flex flex-col">
            <div className="bg-[#0a0d12] px-4 py-2 border-b border-[#1e293b]">
              <h3 className="font-bold text-slate-400 text-[10px] tracking-wider uppercase flex items-center space-x-2">
                <Activity className="w-3.5 h-3.5" />
                <span>Active Holdings</span>
              </h3>
            </div>
            {positionsWithMetrics.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10 text-slate-500 font-mono text-xs">
                No active positions. Execute orders to build portfolio.
              </div>
            ) : (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-[#1e293b] text-[10px] uppercase tracking-wider">
                      <th className="px-4 py-2 font-normal">Asset</th>
                      <th className="px-4 py-2 font-normal text-right">Shares</th>
                      <th className="px-4 py-2 font-normal text-right">Avg Price</th>
                      <th className="px-4 py-2 font-normal text-right">Mkt Price</th>
                      <th className="px-4 py-2 font-normal text-right">P/L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]/50">
                    {positionsWithMetrics.map(({ sym, pos, price, pl, plPct }) => (
                      <React.Fragment key={sym}>
                        <tr className="interactive-row cursor-pointer" onClick={() => setActiveExplain(activeExplain === sym ? null : sym)}>
                          <td className="px-4 py-2 font-bold text-slate-200">{sym}</td>
                          <td className="px-4 py-2 text-right text-slate-300">{pos.shares}</td>
                          <td className="px-4 py-2 text-right text-slate-300">${pos.avgPrice.toFixed(2)}</td>
                          <td className="px-4 py-2 text-right text-slate-300">${price.toFixed(2)}</td>
                          <td className={`px-4 py-2 text-right font-bold ${pl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            ${Math.abs(pl).toFixed(2)} <span className="opacity-80 font-normal">({plPct >= 0 ? '+' : ''}{plPct.toFixed(2)}%)</span>
                          </td>
                        </tr>
                        <AnimatePresence>
                          {activeExplain === sym && (
                            <motion.tr 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="bg-[#0a0d12]"
                            >
                              <td colSpan="5" className="px-4 py-3 border-b border-[#1e293b]">
                                <div className="flex justify-between items-center text-[10px]">
                                  <div className="text-slate-400">Position Analysis for {sym}: <span className="text-slate-200">{formatVal(pos.shares * price)} Total Exposure</span></div>
                                  <button 
                                    onClick={() => onRequestExplain(`Analyze my position in ${sym}. I hold ${pos.shares} shares at average price ${pos.avgPrice} and it is currently at ${price}.`)}
                                    className="text-blue-500 hover:text-blue-400 flex items-center space-x-1"
                                  >
                                    <Zap className="w-3 h-3" /> <span>AI Position Breakdown</span>
                                  </button>
                                </div>
                              </td>
                            </motion.tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Trade History */}
          <div className="glass-panel-sharp h-48 flex flex-col">
            <div className="bg-[#0a0d12] px-4 py-2 border-b border-[#1e293b]">
              <h3 className="font-bold text-slate-400 text-[10px] tracking-wider uppercase flex items-center space-x-2">
                <Target className="w-3.5 h-3.5" />
                <span>Execution Log</span>
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 font-mono text-[10px]">
              {paperHistory.length === 0 ? (
                <div className="text-slate-600 text-center mt-6">No executions yet.</div>
              ) : (
                <div className="space-y-1">
                  {[...paperHistory].reverse().map((t, i) => (
                    <div key={i} className="flex justify-between items-center px-2 py-1 hover:bg-[#161b22] rounded-sm transition-colors">
                      <div className="flex space-x-3 w-1/3">
                        <span className={`font-bold ${t.type === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>{t.type}</span>
                        <span className="text-slate-300">{t.qty}x <span className="font-bold">{t.asset}</span></span>
                      </div>
                      <div className="text-slate-400 w-1/3 text-center">{t.note && <span>{t.note}</span>}</div>
                      <div className="w-1/3 text-right">
                        <span className="text-slate-200 mr-3">${t.price.toFixed(2)}</span>
                        <span className="text-slate-600">{t.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Order Entry & Pending */}
        <div className="space-y-4 flex flex-col">
          {/* Order Entry */}
          <div className="glass-panel-sharp p-4 border-t-2 border-t-indigo-500 flex-1">
            <h3 className="text-xs font-bold text-slate-200 mb-4 flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4 text-indigo-400" />
              <span>Order Entry</span>
            </h3>
            
            <div className="flex space-x-1 mb-4 bg-[#0a0d12] p-1 rounded-sm border border-[#1e293b]">
              {['MARKET', 'LIMIT', 'STOP'].map(t => (
                <button
                  key={t}
                  onClick={() => setOrderType(t)}
                  className={`flex-1 py-1 text-[10px] font-bold rounded-sm transition-colors ${orderType === t ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-[#161b22]'}`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Asset</label>
                  <select 
                    value={asset} 
                    onChange={(e) => setAsset(e.target.value)}
                    className="pro-input w-full"
                  >
                    {[...stocks, ...cryptos].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Quantity</label>
                  <input 
                    type="number" min="1" 
                    value={qty} 
                    onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                    className="pro-input w-full"
                  />
                </div>
              </div>

              <div className="bg-[#0a0d12] p-2 rounded-sm border border-[#1e293b] flex justify-between items-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold">LTP</span>
                <span className="text-sm font-mono font-bold text-blue-400">${currentPrice > 0 ? currentPrice.toFixed(2) : '---'}</span>
              </div>

              {orderType === 'LIMIT' && (
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Limit Price</label>
                  <input 
                    type="number" step="0.01" placeholder="0.00"
                    value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)}
                    className="pro-input w-full"
                  />
                </div>
              )}

              {orderType === 'STOP' && (
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Stop Price (Trigger)</label>
                  <input 
                    type="number" step="0.01" placeholder="0.00"
                    value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)}
                    className="pro-input w-full"
                  />
                </div>
              )}

              {(orderType === 'LIMIT' || orderType === 'MARKET') && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Take Profit</label>
                    <input 
                      type="number" step="0.01" placeholder="Opt"
                      value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)}
                      className="pro-input w-full border-emerald-900/50 focus:border-emerald-500/50 focus:ring-emerald-500/30 text-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Stop Loss</label>
                    <input 
                      type="number" step="0.01" placeholder="Opt"
                      value={stopLoss} onChange={(e) => setStopLoss(e.target.value)}
                      className="pro-input w-full border-rose-900/50 focus:border-rose-500/50 focus:ring-rose-500/30 text-rose-400"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-3">
                <button onClick={() => handleExecute('BUY')} className="pro-btn bg-emerald-600 hover:bg-emerald-500 text-white py-2 shadow-sm shadow-emerald-900/20">Buy</button>
                <button onClick={() => handleExecute('SELL')} className="pro-btn bg-rose-600 hover:bg-rose-500 text-white py-2 shadow-sm shadow-rose-900/20">Sell</button>
              </div>
            </div>
          </div>

          {/* Pending Orders */}
          <div className="glass-panel-sharp h-48 flex flex-col">
            <div className="bg-[#0a0d12] px-4 py-2 border-b border-[#1e293b]">
              <h3 className="font-bold text-slate-400 text-[10px] tracking-wider uppercase flex items-center space-x-2">
                <Clock className="w-3.5 h-3.5" />
                <span>Pending Orders</span>
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {pendingOrders.length === 0 ? (
                <div className="text-slate-600 text-[10px] text-center mt-6 font-mono">No pending orders.</div>
              ) : (
                <div className="space-y-2">
                  {pendingOrders.map(po => (
                    <div key={po.id} className="bg-[#0a0d12] p-2 rounded-sm border border-[#1e293b] flex justify-between items-center group text-xs font-mono">
                      <div>
                        <div className="flex items-center space-x-2 mb-0.5">
                          <span className={`text-[9px] font-bold px-1 rounded-sm ${po.side === 'BUY' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-rose-900/40 text-rose-400'}`}>
                            {po.side}
                          </span>
                          <span className="font-bold text-slate-200">{po.qty}x {po.asset}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center space-x-2">
                          <span>{po.type} @ ${po.targetPrice?.toFixed(2)}</span>
                          {po.takeProfit && <span className="text-emerald-500">TP: ${po.takeProfit}</span>}
                          {po.stopLoss && <span className="text-rose-500">SL: ${po.stopLoss}</span>}
                        </div>
                      </div>
                      <button 
                        onClick={() => onCancelPendingOrder(po.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
