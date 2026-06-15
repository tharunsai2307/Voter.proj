import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line 
} from 'recharts';
import { 
  Activity, TrendingUp, Clock, ShieldAlert, Database, Cpu, Layers, Wifi, WifiOff 
} from 'lucide-react';

const WEBSOCKET_URL = "ws://localhost:9001/metrics";

export default function LatencyLab({ beginnerMode }) {
  const [connected, setConnected] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [history, setHistory] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    function connect() {
      console.log(`Connecting to ${WEBSOCKET_URL}...`);
      const ws = new WebSocket(WEBSOCKET_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected!");
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setMetrics(data);

          // Append to history
          setHistory(prev => {
            const time = new Date().toLocaleTimeString();
            const newHistory = [
              ...prev, 
              {
                time,
                throughput: data.throughputOrdersPerSecond,
                avgLatency: data.averageLatencyMicros,
                p99Latency: data.p99LatencyMicros,
                maxLatency: data.maxLatencyMicros,
                trades: data.tradesExecuted
              }
            ];
            // Keep last 30 intervals
            return newHistory.slice(-30);
          });
        } catch (e) {
          console.error("Error parsing WebSocket JSON data:", e);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected. Retrying in 2 seconds...");
        setConnected(false);
        setMetrics(null);
        setTimeout(connect, 2000);
      };

      ws.onerror = (err) => {
        console.error("WebSocket encountered error:", err);
        ws.close();
      };
    }

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Format big numbers
  const formatNum = (val) => {
    if (val === undefined || val === null) return "0";
    return val.toLocaleString();
  };

  const getRegimeColor = (regime) => {
    switch (regime) {
      case 'Normal': return 'text-emerald-400 bg-emerald-950/40 border-emerald-900/50';
      case 'HighVolatility': return 'text-amber-400 bg-amber-950/40 border-amber-900/50';
      case 'LowLiquidity': return 'text-cyan-400 bg-cyan-950/40 border-cyan-900/50';
      case 'FlashCrash': return 'text-rose-500 bg-rose-950/40 border-rose-900/50 animate-pulse';
      default: return 'text-gray-400 bg-gray-950/40 border-gray-900/50';
    }
  };

  return (
    <div className="flex flex-col select-none selection:bg-[#2979ff] selection:text-white pb-10">
      {/* Header */}
      <div className="border-b border-[#1e293b] bg-[#0d0f14] px-6 py-4 flex items-center justify-between sticky top-0 z-40 rounded-t-xl">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-100">Latency Lab</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">C++ Engine Telemetry</p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center space-x-3 bg-[#131522] border border-[#212437] px-4 py-1.5 rounded-full">
          {connected ? (
            <>
              <Wifi className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-400 tracking-wide uppercase">C++ Engine Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-rose-500 animate-bounce" />
              <span className="text-xs font-semibold text-rose-500 tracking-wide uppercase">Awaiting C++ Engine...</span>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 relative">
        <AnimatePresence>
          {!connected && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#090a0f]/90 backdrop-blur-md flex flex-col items-center justify-center z-30 min-h-[500px]"
            >
              <div className="bg-[#121422] border border-[#23273e] p-8 rounded-2xl max-w-md w-full text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-pulse" />
                <div className="w-16 h-16 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-center mx-auto mb-5 shadow-inner">
                  <Activity className="w-8 h-8 text-blue-400 animate-pulse" />
                </div>
                <h3 className="text-xl font-bold mb-2">Waiting for Simulator</h3>
                <p className="text-sm text-slate-400 mb-6">
                  The C++ simulation engine is either starting up or processing a heavy regime...
                </p>
                <div className="flex items-center justify-center space-x-2 text-xs text-slate-500">
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping" />
                  <span>Polling ws://localhost:9001/metrics</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {metrics && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {beginnerMode && (
              <div className="bg-blue-950/20 border border-blue-900/30 p-4 rounded-sm text-xs text-slate-350 space-y-2 text-left">
                <h4 className="font-bold text-blue-400 flex items-center space-x-1.5">
                  <span>💡 Beginner Guide: Matching Engine Latency Lab</span>
                </h4>
                <p className="leading-relaxed">
                  This panel monitors the speed of our C++ matching engine simulator. 
                  <strong>Latency</strong> measures how long it takes to process a trade (lower is better), 
                  while <strong>Throughput</strong> measures how many trades the engine can process per second (higher is better). 
                  In high-frequency trading (HFT), sub-millisecond execution is crucial to secure the best prices!
                </p>
              </div>
            )}
            {/* Grid of Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card: Orders */}
              <div className="glass-panel-sharp p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Database className="w-16 h-16 text-blue-400" />
                </div>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-2">Queue Telemetry</span>
                <div className="space-y-2.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-slate-400">Produced:</span>
                    <span className="text-lg font-bold font-mono text-blue-400">{formatNum(metrics.ordersProduced)}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-slate-400">Consumed:</span>
                    <span className="text-lg font-bold font-mono text-indigo-400">{formatNum(metrics.ordersConsumed)}</span>
                  </div>
                </div>
              </div>

              {/* Card: Engine Metrics */}
              <div className="glass-panel-sharp p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Cpu className="w-16 h-16 text-emerald-400" />
                </div>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-2">Engine Execution</span>
                <div className="space-y-2.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-slate-400">Trades Executed:</span>
                    <span className="text-lg font-bold font-mono text-emerald-400">{formatNum(metrics.tradesExecuted)}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-slate-400">Throughput:</span>
                    <span className="text-lg font-bold font-mono text-blue-400">
                      {formatNum(Math.round(metrics.throughputOrdersPerSecond))} <span className="text-xs font-normal text-slate-400">ops</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Card: Latency */}
              <div className="glass-panel-sharp p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Clock className="w-16 h-16 text-indigo-400" />
                </div>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-1">Latency Profile</span>
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-400">Average:</span>
                    <span className="text-sm font-bold font-mono text-slate-200">{(metrics.averageLatencyMicros ?? 0).toFixed(2)} µs</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-400">P99 Percentile:</span>
                    <span className="text-sm font-bold font-mono text-amber-400">{(metrics.p99LatencyMicros ?? 0).toFixed(2)} µs</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-400">Max:</span>
                    <span className="text-sm font-bold font-mono text-rose-400">{(metrics.maxLatencyMicros ?? 0).toFixed(2)} µs</span>
                  </div>
                </div>
              </div>

              {/* Card: Market Regime */}
              <div className="glass-panel-sharp p-4 flex flex-col justify-between">
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-2">Market Condition</span>
                  <div className={`text-center py-2.5 px-4 rounded-lg border font-bold text-sm tracking-wide ${getRegimeColor(metrics.regimeName)}`}>
                    {(metrics.regimeName ?? 'UNKNOWN').toUpperCase()}
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-[#1b1e2c] mt-2">
                  <span>Bids: {formatNum(metrics.finalBuyOrders)}</span>
                  <span>Asks: {formatNum(metrics.finalSellOrders)}</span>
                </div>
              </div>

            </div>

            {/* Core Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Chart: Throughput */}
              <div className="glass-panel-sharp p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-300 flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-blue-500" />
                    <span>Real-time Ingestion Speed (Orders / Sec)</span>
                  </h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorThroughput" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2979ff" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#2979ff" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#1c1f30" strokeDasharray="3 3" />
                      <XAxis dataKey="time" stroke="#4a526d" fontSize={10} />
                      <YAxis stroke="#4a526d" fontSize={10} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#161826", borderColor: "#272a3e", borderRadius: 8, color: "#fff" }}
                        labelClassName="text-slate-400 font-mono text-xs"
                      />
                      <Area type="monotone" dataKey="throughput" stroke="#2979ff" strokeWidth={2} fillOpacity={1} fill="url(#colorThroughput)" name="Orders/Sec" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart: Latency (Avg vs P99) */}
              <div className="glass-panel-sharp p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-300 flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    <span>Latency Profile (Microseconds)</span>
                  </h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorP99" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ffb300" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#ffb300" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2979ff" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#2979ff" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#1c1f30" strokeDasharray="3 3" />
                      <XAxis dataKey="time" stroke="#4a526d" fontSize={10} />
                      <YAxis stroke="#4a526d" fontSize={10} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#161826", borderColor: "#272a3e", borderRadius: 8, color: "#fff" }}
                        labelClassName="text-slate-400 font-mono text-xs"
                      />
                      <Area type="monotone" dataKey="p99Latency" stroke="#ffb300" strokeWidth={2} fillOpacity={1} fill="url(#colorP99)" name="P99 Latency (µs)" />
                      <Area type="monotone" dataKey="avgLatency" stroke="#2979ff" strokeWidth={1.5} fillOpacity={1} fill="url(#colorAvg)" name="Avg Latency (µs)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart: Max Latency */}
              <div className="glass-panel-sharp p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-300 flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                    <span>Interval Max Latency Spikes (Microseconds)</span>
                  </h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid stroke="#1c1f30" strokeDasharray="3 3" />
                      <XAxis dataKey="time" stroke="#4a526d" fontSize={10} />
                      <YAxis stroke="#4a526d" fontSize={10} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#161826", borderColor: "#272a3e", borderRadius: 8, color: "#fff" }}
                        labelClassName="text-slate-400 font-mono text-xs"
                      />
                      <Line type="monotone" dataKey="maxLatency" stroke="#ff1744" strokeWidth={2} activeDot={{ r: 6 }} name="Max Latency (µs)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart: Cumulative Trades */}
              <div className="glass-panel-sharp p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-300 flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-emerald-500" />
                    <span>Cumulative Matching Engine Executed Trades</span>
                  </h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTrades" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00e676" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#00e676" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#1c1f30" strokeDasharray="3 3" />
                      <XAxis dataKey="time" stroke="#4a526d" fontSize={10} />
                      <YAxis stroke="#4a526d" fontSize={10} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#161826", borderColor: "#272a3e", borderRadius: 8, color: "#fff" }}
                        labelClassName="text-slate-400 font-mono text-xs"
                      />
                      <Area type="monotone" dataKey="trades" stroke="#00e676" strokeWidth={2} fillOpacity={1} fill="url(#colorTrades)" name="Cumulative Trades" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Error and Failures Log */}
            <div className="glass-panel-sharp p-4 mt-6">
              <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                <span>Buffer Error and Collision Logging</span>
              </h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-[#090a0f] border border-[#1f2235] p-4 rounded-xl">
                  <span className="text-xs text-slate-400 block mb-1">Queue Push Failures (Buffer Collisions)</span>
                  <span className={`text-xl font-bold font-mono ${metrics.pushFailures > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                    {formatNum(metrics.pushFailures)}
                  </span>
                </div>
                <div className="bg-[#090a0f] border border-[#1f2235] p-4 rounded-xl">
                  <span className="text-xs text-slate-400 block mb-1">Queue Pop Failures (Queue Underruns)</span>
                  <span className="text-xl font-bold font-mono text-slate-400">
                    {formatNum(metrics.popFailures)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
