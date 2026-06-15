import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Search, BarChart2, ShieldAlert, Cpu, List, FileText, Trash2 } from 'lucide-react';

export default function BidAskLiquidity({ metricsMap, stocks, cryptos, beginnerMode }) {
  const [selectedAsset, setSelectedAsset] = useState('AAPL');
  const [depthLevel, setDepthLevel] = useState(3); // 1 = L1, 2 = L2, 3 = L3
  const [orderFeed, setOrderFeed] = useState([]); // for Level 3 real-time order match log
  const [customOrders, setCustomOrders] = useState([]); // { id, orderId, price, size, side, asset, time }

  const [orderSide, setOrderSide] = useState('BID');
  const [orderPrice, setOrderPrice] = useState('');
  const [orderSize, setOrderSize] = useState('100');

  const metric = metricsMap[selectedAsset];

  const hasData = metric && metric.bidPrice && metric.askPrice;
  
  const activeCustomOrders = customOrders.filter(o => o.asset === selectedAsset);
  const customBids = activeCustomOrders.filter(o => o.side === 'BID');
  const customAsks = activeCustomOrders.filter(o => o.side === 'ASK');

  // Override L1 Best Bid and Ask if custom orders are placed inside/at the spread
  const maxCustomBid = customBids.length > 0 ? Math.max(...customBids.map(o => o.price)) : 0;
  const minCustomAsk = customAsks.length > 0 ? Math.min(...customAsks.map(o => o.price)) : Infinity;

  const displayBidPrice = (hasData && maxCustomBid > 0) ? Math.max(metric.bidPrice, maxCustomBid) : (metric?.bidPrice || null);
  const displayAskPrice = (hasData && minCustomAsk !== Infinity) ? Math.min(metric.askPrice, minCustomAsk) : (metric?.askPrice || null);

  const displayBidSize = (hasData && metric.bidPrice === displayBidPrice) 
    ? metric.bidSize + customBids.filter(o => o.price === displayBidPrice).reduce((sum, o) => sum + o.size, 0)
    : (customBids.filter(o => o.price === displayBidPrice).reduce((sum, o) => sum + o.size, 0) || (metric?.bidSize || 0));

  const displayAskSize = (hasData && metric.askPrice === displayAskPrice)
    ? metric.askSize + customAsks.filter(o => o.price === displayAskPrice).reduce((sum, o) => sum + o.size, 0)
    : (customAsks.filter(o => o.price === displayAskPrice).reduce((sum, o) => sum + o.size, 0) || (metric?.askSize || 0));

  const hasSizes = hasData && displayBidSize > 0 && displayAskSize > 0;

  const imbalance = hasSizes 
    ? (displayBidSize / (displayBidSize + displayAskSize)) * 100 
    : 50;

  // Helper to get tick size based on asset type
  const getTickSize = (symbol) => {
    if (symbol.startsWith('X:BTC')) return 1.0;
    if (symbol.startsWith('X:ETH')) return 0.1;
    return 0.01;
  };

  // Generate Level 2 Order Book Depth
  const generateLevel2 = (bidPrice, bidSize, askPrice, askSize, symbol) => {
    if (!bidPrice || !askPrice) return { bids: [], asks: [] };
    const tickSize = getTickSize(symbol);
    const bids = [];
    const asks = [];
    let cumulativeBid = 0;
    let cumulativeAsk = 0;

    for (let i = 0; i < 5; i++) {
      // Bids: Decreasing price levels
      const bPrice = bidPrice - tickSize * i;
      const bSeed = Math.sin(bPrice * 1000 + i) * 0.5 + 0.5; // 0 to 1
      const bSize = Math.round(bidSize * (1.1 - 0.15 * i) * (0.8 + 0.4 * bSeed));
      cumulativeBid += bSize;
      bids.push({ level: i + 1, price: bPrice, size: bSize, cumulative: cumulativeBid });

      // Asks: Increasing price levels
      const aPrice = askPrice + tickSize * i;
      const aSeed = Math.cos(aPrice * 1000 + i) * 0.5 + 0.5; // 0 to 1
      const aSize = Math.round(askSize * (1.1 - 0.15 * i) * (0.8 + 0.4 * aSeed));
      cumulativeAsk += aSize;
      asks.push({ level: i + 1, price: aPrice, size: aSize, cumulative: cumulativeAsk });
    }

    return { bids, asks };
  };

  // Merge custom orders into L2 levels
  const mergeCustomOrdersIntoL2 = (standardL2, customOrdersList, isBid, symbol) => {
    const tickSize = getTickSize(symbol);
    const mergedMap = {};

    standardL2.forEach(lvl => {
      const key = lvl.price.toFixed(4);
      mergedMap[key] = { price: lvl.price, size: lvl.size, fromFeed: true };
    });

    customOrdersList.forEach(co => {
      const key = co.price.toFixed(4);
      if (mergedMap[key]) {
        mergedMap[key].size += co.size;
      } else {
        mergedMap[key] = { price: co.price, size: co.size, fromFeed: false };
      }
    });

    const mergedList = Object.values(mergedMap);

    if (isBid) {
      mergedList.sort((a, b) => b.price - a.price);
    } else {
      mergedList.sort((a, b) => a.price - b.price);
    }

    const result = mergedList.slice(0, 5);

    let cumulative = 0;
    return result.map((item, idx) => {
      cumulative += item.size;
      return {
        level: idx + 1,
        price: item.price,
        size: item.size,
        cumulative,
        fromFeed: item.fromFeed
      };
    });
  };

  // Generate Level 3 Individual Orders
  const generateLevel3 = (bids, asks) => {
    const individualBids = [];
    const individualAsks = [];

    // Split each level's volume into 3-4 individual orders
    bids.forEach((b, i) => {
      const customAtPrice = customBids.filter(o => o.price.toFixed(4) === b.price.toFixed(4));
      const customTotal = customAtPrice.reduce((sum, o) => sum + o.size, 0);
      let standardSize = Math.max(0, b.size - customTotal);

      const orderCount = 3;
      let remaining = standardSize;
      for (let j = 0; j < orderCount; j++) {
        const orderSeed = Math.cos(b.price * 2000 + i * 10 + j) * 0.5 + 0.5;
        const size = j === orderCount - 1 ? remaining : Math.round((standardSize / orderCount) * (0.6 + 0.8 * orderSeed));
        if (size <= 0) continue;
        remaining -= size;
        const orderId = Math.round(100000 + (b.price * 500 + j * 97) % 900000);
        const timeOffset = Math.round((orderSeed * 120) * 1000); // ms ago
        const timeStr = new Date(Date.now() - timeOffset).toLocaleTimeString([], { hour12: false });
        individualBids.push({ orderId, price: b.price, size, time: timeStr, level: b.level, isUser: false });
      }

      customAtPrice.forEach(co => {
        individualBids.push({ 
          orderId: co.orderId, 
          price: co.price, 
          size: co.size, 
          time: co.time, 
          level: b.level, 
          isUser: true 
        });
      });
    });

    asks.forEach((a, i) => {
      const customAtPrice = customAsks.filter(o => o.price.toFixed(4) === a.price.toFixed(4));
      const customTotal = customAtPrice.reduce((sum, o) => sum + o.size, 0);
      let standardSize = Math.max(0, a.size - customTotal);

      const orderCount = 3;
      let remaining = standardSize;
      for (let j = 0; j < orderCount; j++) {
        const orderSeed = Math.sin(a.price * 2000 + i * 10 + j) * 0.5 + 0.5;
        const size = j === orderCount - 1 ? remaining : Math.round((standardSize / orderCount) * (0.6 + 0.8 * orderSeed));
        if (size <= 0) continue;
        remaining -= size;
        const orderId = Math.round(100000 + (a.price * 500 + j * 97) % 900000);
        const timeOffset = Math.round((orderSeed * 120) * 1000);
        const timeStr = new Date(Date.now() - timeOffset).toLocaleTimeString([], { hour12: false });
        individualAsks.push({ orderId, price: a.price, size, time: timeStr, level: a.level, isUser: false });
      }

      customAtPrice.forEach(co => {
        individualAsks.push({
          orderId: co.orderId,
          price: co.price,
          size: co.size,
          time: co.time,
          level: a.level,
          isUser: true
        });
      });
    });

    return { bids: individualBids, asks: individualAsks };
  };

  const { bids: standardL2Bids, asks: standardL2Asks } = generateLevel2(
    metric?.bidPrice, 
    metric?.bidSize || 100, 
    metric?.askPrice, 
    metric?.askSize || 100, 
    selectedAsset
  );

  const l2Bids = mergeCustomOrdersIntoL2(standardL2Bids, customBids, true, selectedAsset);
  const l2Asks = mergeCustomOrdersIntoL2(standardL2Asks, customAsks, false, selectedAsset);

  const { bids: l3Bids, asks: l3Asks } = generateLevel3(l2Bids, l2Asks);

  // Set default price when BBO side or asset changes
  useEffect(() => {
    if (hasData) {
      setOrderPrice((orderSide === 'BID' ? displayBidPrice : displayAskPrice).toFixed(selectedAsset.startsWith('X:') ? 2 : 2));
    }
  }, [selectedAsset, orderSide]);

  const handlePlaceDepthOrder = (e) => {
    e.preventDefault();
    const price = parseFloat(orderPrice);
    const size = parseInt(orderSize);
    if (isNaN(price) || price <= 0 || isNaN(size) || size <= 0) {
      return alert("Please enter valid price and size.");
    }

    const orderId = Math.round(100000 + Math.random() * 900000);
    const time = new Date().toLocaleTimeString([], { hour12: false });
    const newOrder = {
      id: Math.random().toString(),
      orderId,
      price,
      size,
      side: orderSide,
      asset: selectedAsset,
      time
    };

    setCustomOrders(prev => [...prev, newOrder]);
    setOrderSize('100');
  };

  const handleCancelDepthOrder = (id) => {
    setCustomOrders(prev => prev.filter(o => o.id !== id));
  };

  // Save latest metrics in ref to avoid resetting interval on tick updates
  const metricRef = useRef(metric);
  useEffect(() => {
    metricRef.current = metric;
  }, [metric]);

  // Simulate dynamic Level 3 order matches log on tick update
  useEffect(() => {
    if (!hasData) return;
    
    // Create a mock stream of incoming/cancelling/matching orders in Level 3
    const interval = setInterval(() => {
      const currentMetric = metricRef.current;
      if (!currentMetric || !currentMetric.bidPrice || !currentMetric.askPrice) return;

      const side = Math.random() > 0.5 ? 'BID' : 'ASK';
      const tickSize = getTickSize(selectedAsset);
      const basePrice = side === 'BID' ? currentMetric.bidPrice : currentMetric.askPrice;
      const priceJitter = (Math.floor(Math.random() * 4) * tickSize);
      const price = side === 'BID' ? basePrice - priceJitter : basePrice + priceJitter;
      const size = Math.round((side === 'BID' ? currentMetric.bidSize || 100 : currentMetric.askSize || 100) * (0.1 + Math.random() * 0.4));
      
      const actions = ['NEW_ORDER', 'PARTIAL_FILL', 'FULL_MATCH', 'CANCEL'];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const orderId = Math.round(100000 + Math.random() * 900000);
      const time = new Date().toLocaleTimeString([], { hour12: false });

      setOrderFeed(prev => [
        { id: Math.random().toString(), orderId, action, side, price, size, time },
        ...prev.slice(0, 14)
      ]);
    }, 1200);

    return () => clearInterval(interval);
  }, [selectedAsset, hasData]);

  const getActionColor = (action, side) => {
    if (action === 'CANCEL') return 'text-slate-500';
    if (action === 'NEW_ORDER') return side === 'BID' ? 'text-emerald-400' : 'text-rose-500';
    return side === 'BID' ? 'text-teal-400 font-bold' : 'text-pink-400 font-bold';
  };

  const maxL2Size = Math.max(...l2Bids.map(b => b.size), ...l2Asks.map(a => a.size), 1);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 font-sans w-full max-w-[1400px] mx-auto pb-10"
    >
      {/* Header with Depth selector */}
      <div className="glass-panel-sharp p-4 border-l-4 border-l-purple-600 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
            <Layers className="w-5 h-5 text-purple-500" />
            <span>Order Book Depth Intelligence</span>
          </h2>
          <p className="text-[10px] text-slate-500 uppercase">Interactive Level 1, 2, and 3 Market Depth & Microstructure Analysis</p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Depth Selector Tabs */}
          <div className="flex space-x-1 bg-[#0a0d12] border border-[#1e293b] p-0.5 rounded-sm">
            {[
              { id: 1, label: 'L1 (BBO)', icon: <Cpu className="w-3 h-3" /> },
              { id: 2, label: 'L2 (Depth)', icon: <List className="w-3 h-3" /> },
              { id: 3, label: 'L3 (Orders)', icon: <FileText className="w-3 h-3" /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setDepthLevel(tab.id)}
                className={`flex items-center space-x-1 px-3 py-1 rounded-sm text-[10px] font-bold transition-all ${depthLevel === tab.id ? 'bg-purple-950/80 border border-purple-800 text-purple-300' : 'text-slate-500 hover:text-slate-350'}`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
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
      </div>

      {!metric ? (
        <div className="glass-panel-sharp p-12 text-center text-slate-600 font-mono text-sm">
          Awaiting tick data for {selectedAsset}...
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          
          {/* Main Visualizer Panel (L1, L2, or L3 depending on select) */}
          <div className="xl:col-span-2 space-y-4">
            
            <AnimatePresence mode="wait">
              
              {/* LEVEL 1: BBO */}
              {depthLevel === 1 && (
                <motion.div
                  key="L1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="glass-panel-sharp flex flex-col h-[520px]"
                >
                  <div className="bg-[#0a0d12] border-b border-[#1e293b] px-4 py-3 flex justify-between items-center">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">BBO (Best Bid & Offer) Dashboard</span>
                    <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">Real-time L1 proxy</span>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative">
                    <div className="w-full flex justify-between items-center mb-8 border-b border-[#1e293b] pb-8">
                      <div className="text-left w-1/2">
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Best Bid Size</div>
                        <div className="text-2xl font-mono text-slate-200">
                          {hasSizes ? displayBidSize.toLocaleString() : 'N/A'}
                        </div>
                      </div>
                      <div className="text-right w-1/2">
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Best Bid Price</div>
                        <div className="text-3xl font-mono text-emerald-400 font-bold">
                          ${hasData ? displayBidPrice.toFixed(2) : '---'}
                        </div>
                      </div>
                    </div>

                    <div className="w-full flex justify-between items-center mb-8">
                      <div className="text-left w-1/2">
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Best Ask Price</div>
                        <div className="text-3xl font-mono text-rose-400 font-bold">
                          ${hasData ? displayAskPrice.toFixed(2) : '---'}
                        </div>
                      </div>
                      <div className="text-right w-1/2">
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Best Ask Size</div>
                        <div className="text-2xl font-mono text-slate-200">
                          {hasSizes ? displayAskSize.toLocaleString() : 'N/A'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 bg-slate-900/50 p-4 border border-[#1e293b]/70 rounded-sm max-w-md w-full">
                      <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
                        * Best Bid and Offer (BBO) represents the absolute highest buying price and lowest selling price currently available in the public quotes ledger.
                      </p>
                    </div>

                    {beginnerMode && (
                      <div className="mt-4 bg-blue-950/20 border border-blue-900/30 p-4 rounded-sm text-xs text-slate-350 space-y-2 text-left max-w-md w-full">
                        <h4 className="font-bold text-blue-400 flex items-center space-x-1.5">
                          <span>💡 Beginner Guide: What is L1 Market Spread?</span>
                        </h4>
                        <p className="leading-relaxed">
                          In trading, the <strong>Bid</strong> is the highest price buyers want to pay, and the <strong>Ask</strong> is the lowest price sellers want to receive. 
                          The difference between them is the <strong>Spread</strong>. A narrow spread means high liquidity, making it easier for you to buy or sell quickly!
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* LEVEL 2: Aggregate Depth Book */}
              {depthLevel === 2 && (
                <motion.div
                  key="L2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="glass-panel-sharp flex flex-col h-[520px]"
                >
                  <div className="bg-[#0a0d12] border-b border-[#1e293b] px-4 py-3 flex justify-between items-center">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Level 2 Depth Book (Aggregated price levels)</span>
                    <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">5 Depth Levels</span>
                  </div>

                  {beginnerMode && (
                    <div className="bg-blue-950/20 border-b border-blue-900/30 p-3 text-xs text-slate-300 text-left">
                      <h4 className="font-bold text-blue-455 mb-1">📖 Understanding Level 2 (Order Book Depth)</h4>
                      <p className="leading-relaxed text-[11px]">
                        Level 2 displays cumulative order size at different price levels. The green bars represent buy orders (bids), while the red bars represent sell orders (asks). 
                        This helps you see where big institutional orders are waiting to trigger.
                      </p>
                    </div>
                  )}

                  <div className="flex-1 grid grid-cols-2 divide-x divide-[#1e293b]/60 overflow-hidden font-mono">
                    {/* Bids Column */}
                    <div className="p-3 overflow-y-auto flex flex-col">
                      <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase font-bold pb-2 border-b border-[#1e293b]/40 mb-2">
                        <span>Total (Size)</span>
                        <span>Bid Price</span>
                      </div>
                      <div className="flex-1 space-y-2.5">
                        {l2Bids.map(b => {
                          const wPct = (b.size / maxL2Size) * 100;
                          return (
                            <div key={b.level} className="relative flex justify-between items-center py-1.5 px-2 hover:bg-slate-900/40 rounded transition-all">
                              {/* Background volume bar */}
                              <div className="absolute right-0 top-0 bottom-0 bg-emerald-950/20 transition-all duration-300" style={{ width: `${wPct}%` }} />
                              
                              <span className="text-slate-300 text-xs z-10">{b.size.toLocaleString()} <span className="text-[9px] text-slate-600">({b.cumulative.toLocaleString()})</span></span>
                              <span className="text-emerald-400 font-bold text-xs z-10">${b.price.toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Asks Column */}
                    <div className="p-3 overflow-y-auto flex flex-col">
                      <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase font-bold pb-2 border-b border-[#1e293b]/40 mb-2">
                        <span>Ask Price</span>
                        <span>Total (Size)</span>
                      </div>
                      <div className="flex-1 space-y-2.5">
                        {l2Asks.map(a => {
                          const wPct = (a.size / maxL2Size) * 100;
                          return (
                            <div key={a.level} className="relative flex justify-between items-center py-1.5 px-2 hover:bg-slate-900/40 rounded transition-all">
                              {/* Background volume bar */}
                              <div className="absolute left-0 top-0 bottom-0 bg-rose-950/20 transition-all duration-300" style={{ width: `${wPct}%` }} />
                              
                              <span className="text-rose-500 font-bold text-xs z-10">${a.price.toFixed(2)}</span>
                              <span className="text-slate-300 text-xs z-10">{a.size.toLocaleString()} <span className="text-[9px] text-slate-600">({a.cumulative.toLocaleString()})</span></span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* LEVEL 3: Full Order log & Matching Simulation */}
              {depthLevel === 3 && (
                <motion.div
                  key="L3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn"
                >
                  {/* Detailed resting orders (L3 Book) */}
                  <div className="glass-panel-sharp flex flex-col h-[520px] md:col-span-2">
                    <div className="bg-[#0a0d12] border-b border-[#1e293b] px-4 py-3 flex justify-between items-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Resting Order Ledger (L3 Priority)</span>
                      <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">Individual orders</span>
                    </div>

                    {beginnerMode && (
                      <div className="bg-blue-950/20 border-b border-blue-900/30 p-3 text-xs text-slate-300 text-left">
                        <h4 className="font-bold text-blue-455 mb-1">📖 Understanding Level 3 (Individual Ledger)</h4>
                        <p className="leading-relaxed text-[11px]">
                          Level 3 shows the actual queue of individual orders before they are matched. Each order has a unique ID, size, and submission timestamp. 
                          Your own custom orders will show up marked as <span className="text-purple-400 font-bold font-mono">YOU</span> in this list!
                        </p>
                      </div>
                    )}

                    <div className="flex-1 grid grid-cols-2 divide-x divide-[#1e293b]/60 overflow-hidden font-mono text-[11px]">
                      {/* Bids Queue */}
                      <div className="p-3 overflow-y-auto flex flex-col">
                        <div className="flex justify-between items-center text-[9px] text-slate-500 uppercase font-bold pb-2 border-b border-[#1e293b]/40 mb-2">
                          <span>Order ID / Time</span>
                          <span>Size @ Price</span>
                        </div>
                        <div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
                          {l3Bids.map((b, idx) => (
                            <div key={`${b.orderId}-${b.price}-${idx}`} className="flex justify-between items-center py-1 px-1.5 hover:bg-slate-900 border-b border-slate-900/40">
                              <div>
                                <div className="flex items-center space-x-1">
                                  <span className="text-slate-400 text-[10px] font-bold">#{b.orderId}</span>
                                  {b.isUser && (
                                    <span className="px-1 py-0.2 bg-purple-950 border border-purple-800 text-purple-300 text-[8px] font-bold uppercase rounded">
                                      YOU
                                    </span>
                                  )}
                                </div>
                                <span className="text-[9px] text-slate-600 block">{b.time}</span>
                              </div>
                              <span className="text-slate-200 font-medium">
                                {b.size.toLocaleString()} @ <span className="text-emerald-400 font-bold">${b.price.toFixed(2)}</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Asks Queue */}
                      <div className="p-3 overflow-y-auto flex flex-col">
                        <div className="flex justify-between items-center text-[9px] text-slate-500 uppercase font-bold pb-2 border-b border-[#1e293b]/40 mb-2">
                          <span>Price @ Size</span>
                          <span>Order ID / Time</span>
                        </div>
                        <div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
                          {l3Asks.map((a, idx) => (
                            <div key={`${a.orderId}-${a.price}-${idx}`} className="flex justify-between items-center py-1 px-1.5 hover:bg-slate-900 border-b border-slate-900/40">
                              <span className="text-slate-200 font-medium text-left">
                                <span className="text-rose-500 font-bold">${a.price.toFixed(2)}</span> @ {a.size.toLocaleString()}
                              </span>
                              <div className="text-right">
                                <div className="flex items-center justify-end space-x-1">
                                  {a.isUser && (
                                    <span className="px-1 py-0.2 bg-purple-950 border border-purple-800 text-purple-300 text-[8px] font-bold uppercase rounded">
                                      YOU
                                    </span>
                                  )}
                                  <span className="text-slate-400 text-[10px] font-bold">#{a.orderId}</span>
                                </div>
                                <span className="text-[9px] text-slate-600 block">{a.time}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Real-time match feed */}
                  <div className="glass-panel-sharp flex flex-col h-[520px]">
                    <div className="bg-[#0a0d12] border-b border-[#1e293b] px-4 py-3">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Market Activity Matcher</span>
                    </div>
                    <div className="flex-1 p-3 overflow-y-auto font-mono text-[10px] space-y-2 select-none">
                      {orderFeed.length === 0 ? (
                        <div className="text-slate-600 italic text-center mt-20">Waiting for tick updates to capture matched orders...</div>
                      ) : (
                        <AnimatePresence>
                          {orderFeed.map((feed) => (
                            <motion.div
                              key={feed.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0 }}
                              className="flex justify-between items-center bg-[#0d1017]/80 border border-slate-900 rounded p-2 shadow-sm"
                            >
                              <div>
                                <span className={`text-[8px] font-bold px-1 rounded-sm border ${feed.action === 'CANCEL' ? 'border-slate-800 bg-slate-950 text-slate-500' : (feed.side === 'BID' ? 'border-emerald-900/50 bg-emerald-950/20 text-emerald-400' : 'border-rose-900/50 bg-rose-950/20 text-rose-500')}`}>
                                  {feed.action}
                                </span>
                                <span className="text-slate-400 text-[9px] block mt-1">Order ID: #{feed.orderId}</span>
                              </div>
                              <div className="text-right">
                                <span className={getActionColor(feed.action, feed.side)}>
                                  {feed.size} @ ${feed.price.toFixed(2)}
                                </span>
                                <span className="text-[9px] text-slate-600 block mt-0.5">{feed.time}</span>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      )}
                    </div>
                  </div>

                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Right Side: Imbalance and Metrics (Always visible) */}
          <div className="space-y-4 flex flex-col">

            {/* Depth Order Entry Card */}
            <div className="glass-panel-sharp p-6 border-t-2 border-t-purple-600 flex flex-col">
              <h3 className="text-xs font-bold text-slate-300 uppercase flex items-center space-x-2 mb-4">
                <Layers className="w-4 h-4 text-purple-500" />
                <span>Depth Order Entry</span>
              </h3>
              
              <form onSubmit={handlePlaceDepthOrder} className="space-y-4">
                {/* Side Selector Toggle */}
                <div className="flex space-x-1 bg-[#0a0d12] border border-[#1e293b] p-0.5 rounded-sm">
                  <button
                    type="button"
                    onClick={() => setOrderSide('BID')}
                    className={`flex-1 py-1.5 rounded-sm text-[10px] font-bold uppercase transition-all ${orderSide === 'BID' ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-400' : 'text-slate-500 hover:text-slate-350'}`}
                  >
                    Bid (Buy)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderSide('ASK')}
                    className={`flex-1 py-1.5 rounded-sm text-[10px] font-bold uppercase transition-all ${orderSide === 'ASK' ? 'bg-rose-950/80 border border-rose-800 text-rose-450' : 'text-slate-500 hover:text-slate-350'}`}
                  >
                    Ask (Sell)
                  </button>
                </div>

                {/* Price and Size inputs side-by-side */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-slate-500 font-bold uppercase text-[9px]">Limit Price</label>
                    <div className="relative flex items-center bg-[#0a0d12] border border-[#1e293b] rounded-sm px-2">
                      <span className="text-slate-500 font-mono mr-1">$</span>
                      <input
                        type="number"
                        step={getTickSize(selectedAsset)}
                        min="0.01"
                        value={orderPrice}
                        onChange={(e) => setOrderPrice(e.target.value)}
                        className="bg-transparent border-none text-slate-200 font-mono w-full focus:outline-none focus:ring-0 p-1"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-500 font-bold uppercase text-[9px]">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={orderSize}
                      onChange={(e) => setOrderSize(e.target.value)}
                      className="bg-[#0a0d12] border border-[#1e293b] rounded-sm text-slate-200 font-mono w-full focus:outline-none focus:ring-0 p-1 px-2"
                      required
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className={`w-full py-2 rounded font-semibold uppercase text-xs transition-all ${orderSide === 'BID' ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/20' : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/20'}`}
                >
                  Place resting {orderSide === 'BID' ? 'Bid' : 'Ask'}
                </button>
              </form>

              {/* Your Resting Orders Ledger (Only visible if there are active custom orders) */}
              {activeCustomOrders.length > 0 && (
                <div className="mt-6 border-t border-[#1e293b]/60 pt-4">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-3">Your Active Resting Orders</span>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {activeCustomOrders.map(order => (
                      <div
                        key={order.id}
                        className="flex justify-between items-center bg-[#0a0d12] border border-[#1e293b]/40 rounded px-2.5 py-1.5 font-mono text-[10px]"
                      >
                        <div className="flex items-center space-x-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${order.side === 'BID' ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                          <span className="text-slate-300">{order.size} @ ${order.price.toFixed(2)}</span>
                        </div>
                        <button
                          onClick={() => handleCancelDepthOrder(order.id)}
                          className="text-slate-500 hover:text-rose-450 p-1 transition-colors"
                          title="Cancel Order"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* L1 Imbalance Gauge */}
            <div className="glass-panel-sharp p-6 flex flex-col items-center justify-center text-center">
               <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-4">Level 1 Imbalance Ratio</span>
               {hasSizes ? (
                 <div className="w-full">
                   <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden flex relative mb-3">
                     <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${imbalance}%` }} />
                     <div className="bg-rose-500 h-full transition-all duration-500" style={{ width: `${100 - imbalance}%` }} />
                     <div className="absolute top-0 left-1/2 w-0.5 h-full bg-slate-100/50" />
                   </div>
                   <div className="flex justify-between w-full text-sm font-mono font-bold">
                     <span className="text-emerald-400">{imbalance.toFixed(1)}% Bids</span>
                     <span className="text-rose-500">{(100 - imbalance).toFixed(1)}% Asks</span>
                   </div>
                 </div>
               ) : (
                 <div className="text-xs font-mono text-slate-600">Imbalance ratio unavailable.</div>
               )}
            </div>

            {/* Metrics Profile */}
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

            {/* Regime panel */}
            <div className="glass-panel-sharp p-6 flex-1">
               <h3 className="text-xs font-bold text-slate-300 uppercase flex items-center space-x-2 mb-4">
                 <ShieldAlert className="w-4 h-4 text-amber-500" />
                 <span>Microstructure Anomaly</span>
               </h3>
               {metric.volatilityLevel && metric.volatilityLevel !== 'NORMAL' ? (
                 <div className="text-xs text-rose-500 bg-rose-950/20 p-4 border border-rose-900/50 rounded-sm">
                   Detected {metric.volatilityLevel} regime. Spread widening observed due to micro-structure changes.
                 </div>
               ) : (
                 <div className="text-xs text-emerald-400 bg-emerald-950/20 p-4 border border-emerald-900/50 rounded-sm">
                   Normal market conditions. Stable spreads and high liquidity support active market orders.
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
