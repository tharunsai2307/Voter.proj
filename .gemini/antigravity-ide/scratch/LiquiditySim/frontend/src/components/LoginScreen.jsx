import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, TrendingUp, Eye, Gauge, Lock, User, Sparkles } from 'lucide-react';

export default function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('beginner'); // beginner or pro
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);

  // Candlestick background canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Generate random candlestick objects
    const candles = [];
    const candleWidth = 10;
    const gap = 15;
    const totalCandles = Math.ceil(width / (candleWidth + gap)) + 2;

    let lastClose = height / 2;
    for (let i = 0; i < totalCandles; i++) {
      const isBull = Math.random() > 0.45;
      const bodyHeight = Math.random() * 80 + 10;
      const open = isBull ? lastClose : lastClose - bodyHeight;
      const close = isBull ? lastClose + bodyHeight : lastClose;
      const high = Math.min(open, close) - Math.random() * 30;
      const low = Math.max(open, close) + Math.random() * 30;

      candles.push({
        x: i * (candleWidth + gap),
        open,
        close,
        high,
        low,
        isBull,
        speed: Math.random() * 0.5 + 0.2
      });

      lastClose = close;
    }

    // Animation Loop
    const draw = () => {
      ctx.fillStyle = 'rgba(6, 8, 11, 0.2)'; // trail effect
      ctx.fillRect(0, 0, width, height);

      // Draw horizontal grid lines
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.15)';
      ctx.lineWidth = 1;
      for (let y = 0; y < height; y += 80) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw moving candlesticks
      candles.forEach((c) => {
        c.x -= c.speed;
        if (c.x < -(candleWidth + gap)) {
          c.x = width + gap;
          const isBull = Math.random() > 0.45;
          const bodyHeight = Math.random() * 80 + 10;
          const lastC = candles[candles.length - 1];
          const startPrice = lastC ? lastC.close : height / 2;
          c.open = isBull ? startPrice : startPrice - bodyHeight;
          c.close = isBull ? startPrice + bodyHeight : startPrice;
          c.high = Math.min(c.open, c.close) - Math.random() * 30;
          c.low = Math.max(c.open, c.close) + Math.random() * 30;
          c.isBull = isBull;
        }

        const color = c.isBull ? 'rgba(0, 200, 83, 0.15)' : 'rgba(255, 61, 0, 0.15)';
        const wickColor = c.isBull ? 'rgba(0, 200, 83, 0.3)' : 'rgba(255, 61, 0, 0.3)';

        // Draw wick
        ctx.strokeStyle = wickColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(c.x + candleWidth / 2, c.high);
        ctx.lineTo(c.x + candleWidth / 2, c.low);
        ctx.stroke();

        // Draw body
        ctx.fillStyle = color;
        ctx.fillRect(c.x, Math.min(c.open, c.close), candleWidth, Math.abs(c.open - c.close));
      });

      // Draw neon moving line overlay (simulating a ticker)
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      let first = true;
      candles.forEach((c) => {
        const y = (c.open + c.close) / 2;
        if (first) {
          ctx.moveTo(c.x + candleWidth / 2, y);
          first = false;
        } else {
          ctx.lineTo(c.x + candleWidth / 2, y);
        }
      });
      ctx.stroke();
      ctx.shadowBlur = 0; // reset shadow

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    // Simulate server side auth latency
    setTimeout(() => {
      setLoading(false);
      onLogin(username.trim(), mode === 'beginner');
    }, 1200);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#06080b] overflow-hidden font-sans">
      {/* Dynamic Candlestick Canvas Background */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Floating Particles or Glow elements */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-500/5 rounded-full filter blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-purple-500/5 rounded-full filter blur-3xl pointer-events-none animate-pulse" />

      {/* Glassmorphism Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md p-8 m-4 rounded-xl border border-[#1e293b] bg-[#0d1117]/85 backdrop-blur-md shadow-2xl text-slate-100 relative overflow-hidden"
      >
        {/* Animated header neon strip */}
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 animate-pulse" />

        {/* Brand / Logo */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ rotate: -15, scale: 0.9 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 100 }}
            className="w-12 h-12 bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4"
          >
            <TrendingUp className="w-6 h-6 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold tracking-wider bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            LIQUIDITY WATCH
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-1">Real-time Order Book & Latency Telemetry</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 text-xs bg-rose-950/40 border border-rose-900/50 text-rose-450 rounded-sm font-mono text-center"
            >
              ⚠️ {error}
            </motion.div>
          )}

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Username</label>
            <div className="relative flex items-center bg-[#05070a] border border-[#1e293b] rounded-sm focus-within:border-blue-500/50 transition-all">
              <User className="absolute left-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Enter trader alias..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-transparent border-none py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:ring-0 placeholder-slate-600"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Access Key</label>
            <div className="relative flex items-center bg-[#05070a] border border-[#1e293b] rounded-sm focus-within:border-blue-500/50 transition-all">
              <Lock className="absolute left-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                placeholder="Enter password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-none py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:ring-0 placeholder-slate-600"
                required
              />
            </div>
          </div>

          {/* Experience Mode Toggle */}
          <div className="space-y-2">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Workspace Mode</label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setMode('beginner')}
                className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded border font-semibold text-xs transition-all ${
                  mode === 'beginner'
                    ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-400'
                    : 'bg-[#05070a] border-[#1e293b] text-slate-500 hover:text-slate-350'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>Beginner</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('pro')}
                className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded border font-semibold text-xs transition-all ${
                  mode === 'pro'
                    ? 'bg-blue-950/30 border-blue-500/50 text-blue-450'
                    : 'bg-[#05070a] border-[#1e293b] text-slate-500 hover:text-slate-350'
                }`}
              >
                <Gauge className="w-4 h-4" />
                <span>Professional</span>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full pro-btn bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3 rounded-md font-bold tracking-wider uppercase text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-blue-500/10"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Establish Trading Session</span>
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-8 text-center text-[10px] text-slate-600 font-mono">
          🔒 Secure 256-bit Web-Socket Encrypted Tunnel
        </div>
      </motion.div>
    </div>
  );
}
