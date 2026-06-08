import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Clock, 
  TrendingUp, 
  ShieldAlert, 
  Search, 
  Sliders, 
  Scale, 
  Zap, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  ShieldCheck, 
  Info,
  LayoutGrid,
  Coins,
  Star,
  Trash2,
  Download,
  AlertCircle,
  Linkedin,
  Instagram,
  User,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Cpu,
  Code,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Layers,
  Settings,
  FolderOpen,
  Share2,
  Play,
  Square,
  BookOpen,
  Heart,
  CloudRain,
  CloudSun,
  Eye,
  GraduationCap,
  Gauge,
  MessageCircle
} from 'lucide-react';

import LatencyLab from './components/LatencyLab';
import PortfolioXRay from './components/PortfolioXRay';
import MarketOverview from './components/MarketOverview';
import OpportunityScanner from './components/OpportunityScanner';
import StrategyLab from './components/StrategyLab';
import ReplayStudio from './components/ReplayStudio';
import BidAskLiquidity from './components/BidAskLiquidity';
import TradingJournalTab from './components/TradingJournalTab';
import LoginScreen from './components/LoginScreen';

const WEBSOCKET_URL = "ws://localhost:9005";

const DEFAULT_STOCKS = ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMD', 'SPY', 'QQQ'];
const DEFAULT_CRYPTOS = ['X:BTCUSD', 'X:ETHUSD'];
const LINKEDIN_URL = "http://www.linkedin.com/in/tharun-sai-gangadhar-p-a32245396";
const INSTAGRAM_URL = "https://www.instagram.com/delulu_daydreamer";

export default function App() {
  // Theme State
  const [theme, setTheme] = useState(() => localStorage.getItem('liquiditywatch_theme') || 'dark');
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('theme-light');
    } else {
      root.classList.remove('theme-light');
    }
    localStorage.setItem('liquiditywatch_theme', theme);
  }, [theme]);

  // Beginner / Professional Mode Toggle
  const [beginnerMode, setBeginnerMode] = useState(() => {
    const saved = localStorage.getItem('liquiditywatch_beginner_mode');
    try {
      return saved !== null ? JSON.parse(saved) : true;
    } catch(e) {
      return true;
    }
  });
  useEffect(() => {
    localStorage.setItem('liquiditywatch_beginner_mode', JSON.stringify(beginnerMode));
  }, [beginnerMode]);

  // Session & Login State
  const [user, setUser] = useState(() => localStorage.getItem('lw_user') || null);
  const handleLogin = (username, startAsBeginner) => {
    setUser(username);
    localStorage.setItem('lw_user', username);
    setBeginnerMode(startAsBeginner);
  };
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('lw_user');
  };

  // Load persistent trades from backend
  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const res = await fetch('http://localhost:9005/api/trades');
        const data = await res.json();
        if (data && Array.isArray(data.trades)) {
          setPaperHistory(data.trades);
        }
      } catch (e) {
        console.error("Failed to fetch persistent trades from backend:", e);
      }
    };
    if (user) {
      fetchTrades();
    }
  }, [user]);

  // ELI5 Explainer selection
  const [eli5Symbol, setEli5Symbol] = useState(null);

  // Tab State
  const [activeTab, setActiveTab] = useState("overview"); // overview, xray, scanner, strategy, replay, latency, orderbook

  // Collapsible Creator Panel (kept for safety, but hidden from main header)
  const [showCreatorBio, setShowCreatorBio] = useState(false);

  // Replay states
  const [replaySymbol, setReplaySymbol] = useState("AAPL");
  const [replayDate, setReplayDate] = useState(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  });
  const [replayProgress, setReplayProgress] = useState({
    currentIndex: 0,
    total: 0,
    timestamp: Date.now(),
    speed: 1,
    state: 'STOPPED'
  });
  const [replayMetrics, setReplayMetrics] = useState(null);
  const [replayHistory, setReplayHistory] = useState([]);

  // Chat states
  const [chatOpen, setChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    { sender: 'assistant', text: "Hello! I am Tharun's AI Research Assistant. Ask me anything about the active market metrics, volatility, liquidity, or risk scores." }
  ]);
  const [chatMessage, setChatMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Intelligence AI states
  const [marketBriefing, setMarketBriefing] = useState(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [alertAnalysis, setAlertAnalysis] = useState(null);
  const [alertAnalysisLoading, setAlertAnalysisLoading] = useState(null);
  const [addFundsOpen, setAddFundsOpen] = useState(false);

  // Connection & Feed states
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState({ 
    mode: 'LIVE', 
    polygonStatus: 'Offline', 
    message: 'Offline',
    apiStatus: { lastFetchTime: null, lastError: null, rateLimitWarning: false }
  });

  // Paper Trading states
  const [paperCash, setPaperCash] = useState(() => {
    const saved = localStorage.getItem('lw_paper_cash');
    return saved !== null ? parseFloat(saved) : 100000;
  });
  const [paperPositions, setPaperPositions] = useState(() => {
    const saved = localStorage.getItem('lw_paper_positions');
    try { const parsed = saved ? JSON.parse(saved) : null; return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {}; } catch(e) { return {}; }
  });
  const [paperHistory, setPaperHistory] = useState(() => {
    const saved = localStorage.getItem('lw_paper_history');
    try { const parsed = saved ? JSON.parse(saved) : null; return Array.isArray(parsed) ? parsed : []; } catch(e) { return []; }
  });
  const [pendingOrders, setPendingOrders] = useState(() => {
    const saved = localStorage.getItem('lw_pending_orders');
    try { const parsed = saved ? JSON.parse(saved) : null; return Array.isArray(parsed) ? parsed : []; } catch(e) { return []; }
  });
  const pendingOrdersRef = useRef(pendingOrders);
  useEffect(() => {
    pendingOrdersRef.current = pendingOrders;
    localStorage.setItem('lw_pending_orders', JSON.stringify(pendingOrders));
  }, [pendingOrders]);

  const [paperOrderQty, setPaperOrderQty] = useState(1);
  const [paperOrderAsset, setPaperOrderAsset] = useState("AAPL");

  useEffect(() => {
    localStorage.setItem('lw_paper_cash', paperCash.toString());
  }, [paperCash]);
  useEffect(() => {
    localStorage.setItem('lw_paper_positions', JSON.stringify(paperPositions));
  }, [paperPositions]);
  useEffect(() => {
    localStorage.setItem('lw_paper_history', JSON.stringify(paperHistory));
  }, [paperHistory]);

  const placeMarketOrder = (asset, qty, side) => {
    const assetData = metricsMap[asset];
    if (!assetData || !assetData.lastPrice) return alert("Real-time price unavailable.");
    const price = assetData.lastPrice;
    executeOrder(asset, qty, side, price, "Market");
  };

  const addVirtualFunds = (amount) => {
    setPaperCash(prev => prev + amount);
  };

  const placePendingOrder = (order) => {
    setPendingOrders(prev => [...prev, order]);
  };

  const cancelPendingOrder = (id) => {
    setPendingOrders(prev => prev.filter(o => o.id !== id));
  };

  const executeOrder = (asset, qty, side, price, note) => {
    const cost = price * qty;
    if (side === 'BUY') {
      if (paperCash < cost) return alert("Insufficient virtual cash.");
      setPaperCash(prev => prev - cost);
      setPaperPositions(prev => {
        const current = prev[asset] || { shares: 0, avgPrice: 0 };
        const newShares = current.shares + qty;
        const newAvg = ((current.shares * current.avgPrice) + cost) / newShares;
        return { ...prev, [asset]: { shares: newShares, avgPrice: newAvg } };
      });
    } else {
      const current = paperPositions[asset];
      if (!current || current.shares < qty) return alert("Insufficient shares to sell.");
      setPaperCash(prev => prev + cost);
      setPaperPositions(prev => {
        const newShares = current.shares - qty;
        if (newShares <= 0) {
          const { [asset]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [asset]: { shares: newShares, avgPrice: current.avgPrice } };
      });
    }
    const newTrade = { asset, qty, side, price, time: new Date().toLocaleTimeString(), type: side, note };
    setPaperHistory(prev => [newTrade, ...prev]);
    fetch('http://localhost:9005/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTrade)
    }).catch(err => console.error("Failed to save trade to backend:", err));
  };

  // Evaluate pending orders inside ws.onmessage
  const evaluatePendingOrders = (data) => {
    const orders = pendingOrdersRef.current;
    if (!orders || orders.length === 0) return;
    
    let toRemove = [];
    orders.forEach(order => {
      if (order.asset !== data.symbol) return;
      const p = data.lastPrice;
      let triggered = false;
      let note = "";
      
      if (order.type === 'LIMIT') {
        if (order.side === 'BUY' && p <= order.targetPrice) { triggered = true; note = "Limit Buy"; }
        if (order.side === 'SELL' && p >= order.targetPrice) { triggered = true; note = "Limit Sell"; }
      } else if (order.type === 'STOP') {
        if (order.side === 'BUY' && p >= order.targetPrice) { triggered = true; note = "Stop Buy"; }
        if (order.side === 'SELL' && p <= order.targetPrice) { triggered = true; note = "Stop Loss"; }
      }
      
      // Also check attached TP/SL if we held positions... (basic impl limits to pending triggers)
      
      if (triggered) {
        executeOrder(order.asset, order.qty, order.side, p, note);
        toRemove.push(order.id);
      }
    });

    if (toRemove.length > 0) {
      setPendingOrders(prev => prev.filter(o => !toRemove.includes(o.id)));
    }
  };

  const handleExecuteTrade = (type) => {
    const assetData = metricsMap[paperOrderAsset];
    if (!assetData || !assetData.lastPrice) {
      alert("Real-time price for this asset is not available.");
      return;
    }
    const price = assetData.lastPrice;
    const cost = price * paperOrderQty;

    if (type === 'BUY') {
      if (paperCash < cost) {
        alert("Insufficient virtual cash.");
        return;
      }
      setPaperCash(prev => prev - cost);
      setPaperPositions(prev => {
        const current = prev[paperOrderAsset] || { shares: 0, avgPrice: 0 };
        const newShares = current.shares + paperOrderQty;
        const newAvg = ((current.shares * current.avgPrice) + cost) / newShares;
        return { ...prev, [paperOrderAsset]: { shares: newShares, avgPrice: newAvg } };
      });
    } else {
      const current = paperPositions[paperOrderAsset] || { shares: 0 };
      if (current.shares < paperOrderQty) {
        alert("Insufficient shares to sell.");
        return;
      }
      setPaperCash(prev => prev + cost);
      setPaperPositions(prev => {
        const newShares = current.shares - paperOrderQty;
        if (newShares === 0) {
          const { [paperOrderAsset]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [paperOrderAsset]: { shares: newShares, avgPrice: current.avgPrice } };
      });
    }

    const newTrade = {
      type, asset: paperOrderAsset, qty: paperOrderQty, price, time: new Date().toLocaleTimeString()
    };
    setPaperHistory(prev => [newTrade, ...prev].slice(0, 100));
    fetch('http://localhost:9005/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTrade)
    }).catch(err => console.error("Failed to save trade to backend:", err));
  };

  // Workspace Configurations
  const [activeWorkspace, setActiveWorkspace] = useState(() => {
    return parseInt(localStorage.getItem('liquiditywatch_active_workspace') || '1');
  });

  const [workspaceData, setWorkspaceData] = useState(() => {
    const safeParseArray = (key, fallback) => {
      const saved = localStorage.getItem(key);
      try {
        const parsed = saved ? JSON.parse(saved) : null;
        return Array.isArray(parsed) ? parsed : fallback;
      } catch(e) {
        return fallback;
      }
    };
    const safeParseObj = (key, fallback) => {
      const saved = localStorage.getItem(key);
      try {
        const parsed = saved ? JSON.parse(saved) : null;
        return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : fallback;
      } catch(e) {
        return fallback;
      }
    };

    const savedWorkspace = safeParseObj('liquiditywatch_workspaces_v2', null);
    if (savedWorkspace) return savedWorkspace;

    return {
      1: {
        stocks: safeParseArray('liquiditywatch_stocks', DEFAULT_STOCKS),
        cryptos: safeParseArray('liquiditywatch_cryptos', DEFAULT_CRYPTOS),
        favorites: safeParseArray('liquiditywatch_favorites', [])
      },
      2: {
        stocks: ['AAPL', 'MSFT', 'NVDA'],
        cryptos: ['X:BTCUSD'],
        favorites: ['NVDA']
      },
      3: {
        stocks: ['TSLA', 'AMD', 'SPY', 'QQQ'],
        cryptos: ['X:ETHUSD'],
        favorites: ['TSLA']
      }
    };
  });

  // Derived properties from active workspace
  const stocks = workspaceData[activeWorkspace]?.stocks || DEFAULT_STOCKS;
  const cryptos = workspaceData[activeWorkspace]?.cryptos || DEFAULT_CRYPTOS;
  const favorites = workspaceData[activeWorkspace]?.favorites || [];

  const setStocks = (value) => {
    setWorkspaceData(prev => {
      const currentList = prev[activeWorkspace]?.stocks || [];
      const newList = typeof value === 'function' ? value(currentList) : value;
      const updated = {
        ...prev,
        [activeWorkspace]: {
          ...prev[activeWorkspace],
          stocks: newList
        }
      };
      localStorage.setItem('liquiditywatch_workspaces_v2', JSON.stringify(updated));
      return updated;
    });
  };

  const setCryptos = (value) => {
    setWorkspaceData(prev => {
      const currentList = prev[activeWorkspace]?.cryptos || [];
      const newList = typeof value === 'function' ? value(currentList) : value;
      const updated = {
        ...prev,
        [activeWorkspace]: {
          ...prev[activeWorkspace],
          cryptos: newList
        }
      };
      localStorage.setItem('liquiditywatch_workspaces_v2', JSON.stringify(updated));
      return updated;
    });
  };

  const setFavorites = (value) => {
    setWorkspaceData(prev => {
      const currentList = prev[activeWorkspace]?.favorites || [];
      const newList = typeof value === 'function' ? value(currentList) : value;
      const updated = {
        ...prev,
        [activeWorkspace]: {
          ...prev[activeWorkspace],
          favorites: newList
        }
      };
      localStorage.setItem('liquiditywatch_workspaces_v2', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    localStorage.setItem('liquiditywatch_active_workspace', activeWorkspace.toString());
  }, [activeWorkspace]);

  const [searchSymbol, setSearchSymbol] = useState("");
  const [searchAssetType, setSearchAssetType] = useState("stock"); // stock or crypto

  // Metrics, History, & Selection
  const [metricsMap, setMetricsMap] = useState({});
  const [historyMap, setHistoryMap] = useState({});
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  // Intelligence data state
  const [shocks, setShocks] = useState([]);
  const [regime, setRegime] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [health, setHealth] = useState(null);

  // Fetch intelligence data every 500ms (throttled)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [shocksRes, regimeRes, timelineRes, healthRes] = await Promise.all([
          fetch('http://localhost:9005/api/intelligence/shocks').then(r => r.json()),
          fetch('http://localhost:9005/api/intelligence/regime').then(r => r.json()),
          fetch('http://localhost:9005/api/intelligence/timeline').then(r => r.json()),
          fetch('http://localhost:9005/api/intelligence/health').then(r => r.json())
        ]);
        setShocks(shocksRes.shocks || []);
        setRegime(regimeRes.regime || null);
        setTimeline(timelineRes.timeline || []);
        setHealth(healthRes.health || null);
      } catch (e) {
        console.error('Failed to fetch intelligence data', e);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 500);
    return () => clearInterval(interval);
  }, []);

  // Alert Rules & History
  const [alertThresholds, setAlertThresholds] = useState(() => {
    const saved = localStorage.getItem('liquiditywatch_alert_thresholds');
    const fallback = {
      liquidityScoreBelow: 50,
      volatilityLevelHigh: true,
      marketHealthScoreBelow: 55,
      missingQuoteData: true
    };
    try { const parsed = saved ? JSON.parse(saved) : null; return parsed || fallback; } catch(e) { return fallback; }
  });
  const [alertHistory, setAlertHistory] = useState(() => {
    const saved = localStorage.getItem('liquiditywatch_alert_history');
    try { const parsed = saved ? JSON.parse(saved) : null; return Array.isArray(parsed) ? parsed : []; } catch(e) { return []; }
  });

  // Session Summary
  const [sessionUpdates, setSessionUpdates] = useState(0);
  const lastAlertTimes = useRef({}); // Avoid flood: symbol_alertType -> timestamp

  const wsRef = useRef(null);

  // Sound Config
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('liquiditywatch_sound_enabled');
    try { return saved !== null ? JSON.parse(saved) : true; } catch(e) { return true; }
  });
  useEffect(() => {
    localStorage.setItem('liquiditywatch_sound_enabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  // Fullscreen Layout State
  const [fullscreen, setFullscreen] = useState(false);

  // Compare Assets state
  const [compareAssetA, setCompareAssetA] = useState("AAPL");
  const [compareAssetB, setCompareAssetB] = useState("NVDA");

  // Notes per symbol
  const [symbolNotes, setSymbolNotes] = useState(() => {
    const saved = localStorage.getItem('liquiditywatch_symbol_notes');
    try { const parsed = saved ? JSON.parse(saved) : null; return parsed || {}; } catch(e) { return {}; }
  });
  useEffect(() => {
    localStorage.setItem('liquiditywatch_symbol_notes', JSON.stringify(symbolNotes));
  }, [symbolNotes]);

  // Watchlist filter state
  const [watchlistCollectionFilter, setWatchlistCollectionFilter] = useState("all"); // all, favorites

  // Card Visibility toggles
  const [cardVisibility, setCardVisibility] = useState(() => {
    const saved = localStorage.getItem('liquiditywatch_card_visibility');
    const fallback = {
      aiSummary: true,
      sessionStats: true,
      watchlistManager: true,
      timelineFeed: true,
      assetDetails: true,
      comparisonPanel: true,
      notesPanel: true,
      marketClocks: true
    };
    try { const parsed = saved ? JSON.parse(saved) : null; return parsed || fallback; } catch(e) { return fallback; }
  });
  useEffect(() => {
    localStorage.setItem('liquiditywatch_card_visibility', JSON.stringify(cardVisibility));
  }, [cardVisibility]);

  // Command Palette Open State
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandPaletteSearch, setCommandPaletteSearch] = useState("");

  // Interactive Tour Step
  const [tourStep, setTourStep] = useState(null);

  // Clocks
  const [clocks, setClocks] = useState({ nyse: "", nasdaq: "", crypto: "", local: "" });
  useEffect(() => {
    const updateClocks = () => {
      const now = new Date();
      const options = { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
      const nyTimeStr = now.toLocaleTimeString('en-US', options);
      
      const day = now.getDay();
      const isWeekDay = day >= 1 && day <= 5;
      const hoursEst = parseInt(nyTimeStr.split(':')[0]);
      const minsEst = parseInt(nyTimeStr.split(':')[1]);
      const estTotalMins = hoursEst * 60 + minsEst;
      const marketOpen = isWeekDay && estTotalMins >= 570 && estTotalMins <= 960; // 9:30 AM to 4:00 PM EST

      setClocks({
        nyse: `${nyTimeStr} (${marketOpen ? 'OPEN' : 'CLOSED'})`,
        nasdaq: `${nyTimeStr} (${marketOpen ? 'OPEN' : 'CLOSED'})`,
        crypto: `${now.toLocaleTimeString('en-US', { hour12: false })} (24/7 OPEN)`,
        local: now.toLocaleTimeString('en-US', { hour12: false })
      });
    };
    updateClocks();
    const interval = setInterval(updateClocks, 1000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard Shortcuts Hook
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      const key = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      } else if (key === 'f') {
        e.preventDefault();
        if (selectedSymbol) toggleFavorite(selectedSymbol);
      } else if (key === 's') {
        e.preventDefault();
        const searchInput = document.getElementById('symbol-search-input');
        if (searchInput) searchInput.focus();
      } else if (key === 'd') {
        e.preventDefault();
        setActiveTab('analytics');
      } else if (key === 't') {
        e.preventDefault();
        setTheme(t => t === 'dark' ? 'light' : 'dark');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSymbol, activeWorkspace, workspaceData]);

  // Request browser desktop notifications permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  const sendDesktopNotification = (title, message) => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(title, { body: message });
        } catch (e) {
          console.error("Failed to trigger desktop notification", e);
        }
      }
    }
  };

  // Web Audio synthetic alert sound
  const playAlertSound = (severity) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      if (severity === 'HIGH' || severity === 'CRITICAL') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(960, ctx.currentTime + 0.35);
        gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(580, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(420, ctx.currentTime + 0.15);
        gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch (e) {
      console.warn("Web Audio API blocked or failed", e);
    }
  };

  // Periodic Re-render timer (every 5 seconds) to refresh freshness timers
  const [ticker, setTicker] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTicker(t => t + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Save configurations in local storage
  useEffect(() => {
    localStorage.setItem('liquiditywatch_alert_thresholds', JSON.stringify(alertThresholds));
  }, [alertThresholds]);

  useEffect(() => {
    localStorage.setItem('liquiditywatch_alert_history', JSON.stringify(alertHistory));
  }, [alertHistory]);

  // Synchronize watchlist changes with backend WS
  useEffect(() => {
    if (connected && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: 'updateWatchlist',
        stocks,
        cryptos
      }));
    }
  }, [stocks, cryptos, connected]);

  useEffect(() => {
    function connect() {
      console.log(`Connecting to local gateway: ${WEBSOCKET_URL}...`);
      const ws = new WebSocket(WEBSOCKET_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("Local WebSocket server connected!");
        setConnected(true);
        ws.send(JSON.stringify({
          action: 'updateWatchlist',
          stocks,
          cryptos
        }));
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          
          if (payload.ev === 'status') {
            setStatus(payload.data);
            return;
          }

          if (payload.ev === 'replayProgress') {
            setReplayProgress(payload);
            return;
          }

          if (payload.ev === 'replayMetrics') {
            const data = payload.data;
            if (!data || !data.symbol) return;

            setReplayMetrics(data);

            setReplayHistory(prev => {
              const updated = [
                ...prev,
                {
                  price: data.lastPrice,
                  spread: data.spread,
                  volume: data.volume,
                  stdev: data.stdev,
                  timestamp: data.timestamp
                }
              ];
              return updated.slice(-300);
            });
            return;
          }

          if (payload.ev === 'metrics') {
            const data = payload.data;
            if (!data || !data.symbol) return;

            setSessionUpdates(prev => prev + 1);

            setMetricsMap(prev => ({
              ...prev,
              [data.symbol]: {
                ...data,
                receivedTime: Date.now()
              }
            }));

            setHistoryMap(prev => {
              const currentHistory = prev[data.symbol] || [];
              const updatedHistory = [
                ...currentHistory,
                {
                  price: data.lastPrice,
                  time: new Date(data.timestamp).toLocaleTimeString()
                }
              ];
              return {
                ...prev,
                [data.symbol]: updatedHistory.slice(-100)
              };
            });

            evaluateAlerts(data);
            evaluatePendingOrders(data);
          }
        } catch (e) {
          console.error("Error parsing WS message:", e);
        }
      };

      ws.onclose = () => {
        console.log("Local WebSocket server disconnected. Retrying in 2 seconds...");
        setConnected(false);
        setStatus(prev => ({
          ...prev,
          polygonStatus: 'Offline',
          message: 'Offline'
        }));
        setTimeout(connect, 2000);
      };

      ws.onerror = (err) => {
        console.error("Local WebSocket encountered error:", err);
        ws.close();
      };
    }

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [stocks, cryptos]);

  const evaluateAlerts = (data) => {
    const now = Date.now();
    const sym = data.symbol;

    const triggerAlert = (type, message, severity) => {
      const floodKey = `${sym}_${type}`;
      const lastTrigger = lastAlertTimes.current[floodKey] || 0;
      
      if (now - lastTrigger < 30000) return;

      lastAlertTimes.current[floodKey] = now;

      const newAlert = {
        id: `${sym}_${type}_${now}`,
        asset: sym,
        symbol: sym,
        message,
        timestamp: now,
        severity
      };

      setAlertHistory(prev => [newAlert, ...prev].slice(0, 50));
      playAlertSound(severity);
      sendDesktopNotification(`🚨 LiquidityWatch Alert: ${sym}`, `${message} [Severity: ${severity}]`);
    };

    if (data.liquidityScore < alertThresholds.liquidityScoreBelow) {
      triggerAlert(
        'liquidity',
        `Liquidity Score of ${formatVal(data.liquidityScore, 0)} fell below limit (${alertThresholds.liquidityScoreBelow})`,
        'MEDIUM'
      );
    }

    if (alertThresholds.volatilityLevelHigh && data.volatilityLevel === 'HIGH') {
      triggerAlert(
        'volatility',
        `High Volatility detected. Standard Deviation: ${formatVal(data.stdev, 4)}`,
        'HIGH'
      );
    }

    if (data.marketHealthScore < alertThresholds.marketHealthScoreBelow) {
      triggerAlert(
        'health',
        `Market Health Score of ${formatVal(data.marketHealthScore, 0)} fell below limit (${alertThresholds.marketHealthScoreBelow})`,
        'MEDIUM'
      );
    }

    if (alertThresholds.missingQuoteData && (data.bidPrice === null || data.askPrice === null)) {
      triggerAlert(
        'quoteMissing',
        `Order book quote data (bid/ask) is missing from current plan feed.`,
        'LOW'
      );
    }
  };

  const handleAddSymbol = (e) => {
    e.preventDefault();
    if (!searchSymbol.trim()) return;

    const sym = searchSymbol.trim().toUpperCase();
    
    if (searchAssetType === 'stock') {
      if (stocks.includes(sym)) return;
      setStocks(prev => [...prev, sym]);
      setSelectedSymbol(sym);
    } else {
      if (cryptos.includes(sym)) return;
      setCryptos(prev => [...prev, sym]);
      setSelectedSymbol(sym);
    }
    
    setSearchSymbol("");
  };

  const handleRemoveSymbol = (sym, type) => {
    if (type === 'stock') {
      setStocks(prev => prev.filter(s => s !== sym));
    } else {
      setCryptos(prev => prev.filter(s => s !== sym));
    }

    setMetricsMap(prev => {
      const copy = { ...prev };
      delete copy[sym];
      return copy;
    });
    setHistoryMap(prev => {
      const copy = { ...prev };
      delete copy[sym];
      return copy;
    });

    if (selectedSymbol === sym) {
      setSelectedSymbol(type === 'stock' ? stocks[0] : cryptos[0]);
    }
  };

  const toggleFavorite = (sym) => {
    setFavorites(prev => {
      if (prev.includes(sym)) {
        return prev.filter(f => f !== sym);
      } else {
        return [...prev, sym];
      }
    });
  };

  const handleSaveNote = (sym, text) => {
    setSymbolNotes(prev => ({
      ...prev,
      [sym]: text
    }));
  };

  const getSortedWatchlist = (list) => {
    const favs = list.filter(s => favorites.includes(s)).sort();
    const nonFavs = list.filter(s => !favorites.includes(s)).sort();
    return [...favs, ...nonFavs];
  };

  const getFreshness = (item) => {
    if (!item || !item.receivedTime) return { label: 'Stale', color: 'text-rose-400 bg-rose-950/20 border-rose-900' };
    const diff = (Date.now() - item.receivedTime) / 1000;
    if (diff < 30) return { label: 'Fresh', color: 'text-emerald-400 bg-emerald-950/20 border-emerald-900' };
    if (diff <= 120) return { label: 'Delayed', color: 'text-amber-400 bg-amber-950/20 border-amber-900' };
    return { label: 'Stale', color: 'text-rose-400 bg-rose-950/20 border-rose-900' };
  };

  const exportToCSV = () => {
    const visibleData = Object.values(metricsMap);
    if (visibleData.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Ticker,Asset Type,Price,Bid Price,Ask Price,Spread,Spread %,Volume,Liquidity Score,Liquidity Rating,Volatility,Market Health,Freshness\r\n";

    visibleData.forEach(m => {
      const freshness = getFreshness(m).label;
      const row = [
        m.symbol,
        m.assetType,
        m.lastPrice ?? "N/A",
        m.bidPrice ?? "N/A",
        m.askPrice ?? "N/A",
        m.spread ?? "N/A",
        m.spreadPercent ? `${m.spreadPercent.toFixed(3)}%` : "N/A",
        m.volume ?? "N/A",
        m.liquidityScore ?? "N/A",
        m.liquidityRating ?? "N/A",
        m.volatilityLevel ?? "N/A",
        m.marketHealthScore ?? "N/A",
        freshness
      ].join(",");
      csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `liquiditywatch_metrics_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAlertsJSON = () => {
    if (alertHistory.length === 0) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(alertHistory, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `liquiditywatch_alerts_${Date.now()}.json`);
    dlAnchorElem.click();
  };

  const exportAlertsCSV = () => {
    if (alertHistory.length === 0) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Timestamp,Symbol,Message,Severity\r\n";
    alertHistory.forEach(a => {
      const row = [a.timestamp, a.symbol, `"${a.message.replace(/"/g, '""')}"`, a.severity].join(",");
      csvContent += row + "\r\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `liquiditywatch_alerts_${Date.now()}.csv`);
    link.click();
  };

  const getSessionSummaries = () => {
    const list = Object.values(metricsMap);
    if (list.length === 0) return { bestLiq: "N/A", worstLiq: "N/A", highestVol: "N/A" };

    const sortedLiq = [...list].sort((a, b) => b.liquidityScore - a.liquidityScore);
    const bestLiq = sortedLiq[0]?.symbol || "N/A";
    const worstLiq = sortedLiq[sortedLiq.length - 1]?.symbol || "N/A";

    const sortedVol = [...list].sort((a, b) => {
      const aVal = a.stdev ?? 0;
      const bVal = b.stdev ?? 0;
      return bVal - aVal;
    });
    const highestVol = sortedVol[0]?.symbol || "N/A";

    return { bestLiq, worstLiq, highestVol };
  };

  const sessionSummary = getSessionSummaries();

  const generateImprovedAISummary = () => {
    const assets = Object.values(metricsMap);
    if (assets.length === 0) return "Awaiting market intelligence feed from the C++ analyzer...";

    const highVol = assets.filter(a => a.volatilityLevel === 'HIGH').map(a => a.symbol);
    const excellentLiq = assets.filter(a => a.liquidityRating === 'Excellent').map(a => a.symbol);
    const poorLiq = assets.filter(a => a.liquidityRating === 'Poor').map(a => a.symbol);
    const missingQuotes = assets.filter(a => a.bidPrice === null || a.askPrice === null).map(a => a.symbol);

    let statements = [];

    if (metricsMap["NVDA"]) {
      const m = metricsMap["NVDA"];
      statements.push(`NVDA currently shows ${m.liquidityRating.toLowerCase()} liquidity (score: ${formatVal(m.liquidityScore, 0)}) and ${m.volatilityLevel.toLowerCase()} volatility.`);
    }
    if (metricsMap["TSLA"]) {
      const m = metricsMap["TSLA"];
      statements.push(`TSLA has ${m.marketHealthScore < 50 ? 'weak' : 'moderate'} market health because ${m.bidPrice === null ? 'quote data is unavailable' : 'spread is active'} and volatility is ${m.volatilityLevel.toLowerCase()}.`);
    }
    if (metricsMap["X:BTCUSD"]) {
      const m = metricsMap["X:BTCUSD"];
      statements.push(`BTCUSD shows ${m.volatilityLevel === 'HIGH' ? 'elevated' : 'stable'} movement compared to recent updates, sporting a liquidity score of ${formatVal(m.liquidityScore, 0)}.`);
    }

    if (statements.length === 0) {
      if (excellentLiq.length > 0) {
        statements.push(`${excellentLiq.slice(0, 2).join(' & ')} currently showcase robust order books and excellent liquidity.`);
      }
      if (highVol.length > 0) {
        statements.push(`Elevated risk levels and high price volatility exist in ${highVol.join(', ')}.`);
      }
    }

    if (missingQuotes.length > 0) {
      statements.push(`Quote data is unavailable for ${missingQuotes.length} assets under the free plan, restricting full spread analytics.`);
    }

    return statements.join(" ");
  };

  const renderSVGSparkline = (points) => {
    if (!points || points.length < 2) return null;
    
    const width = 450;
    const height = 120;
    const padding = 10;
    
    const prices = points.map(p => p.price).filter(p => p !== null && !isNaN(p));
    if (prices.length < 2) return null;

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    const getX = (idx) => padding + (idx / (prices.length - 1)) * (width - padding * 2);
    const getY = (price) => height - padding - ((price - min) / range) * (height - padding * 2);

    const svgPoints = prices.map((p, idx) => `${getX(idx)},${getY(p)}`).join(" ");

    return (
      <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2}/>
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <line x1="0" y1={height - padding} x2={width} y2={height - padding} stroke="#1e293b" strokeDasharray="3 3" />
        <line x1="0" y1={padding} x2={width} y2={padding} stroke="#1e293b" strokeDasharray="3 3" />
        
        <path
          d={`M ${getX(0)},${height - padding} L ${svgPoints} L ${getX(prices.length - 1)},${height - padding} Z`}
          fill="url(#sparklineGrad)"
        />
        
        <polyline
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          points={svgPoints}
        />
        
        <circle
          cx={getX(prices.length - 1)}
          cy={getY(prices[prices.length - 1])}
          r="4"
          fill="#3b82f6"
          stroke="#0d0f14"
          strokeWidth="1.5"
        />
      </svg>
    );
  };

  const formatVal = (val, dec = 2, suffix = "") => {
    if (val === undefined || val === null || isNaN(val)) return "N/A";
    return val.toFixed(dec) + suffix;
  };

  const getLiquidityColor = (rating) => {
    switch (rating) {
      case 'Excellent': return 'text-emerald-400 border-emerald-900 bg-emerald-950/20';
      case 'Good': return 'text-cyan-400 border-cyan-900 bg-cyan-950/20';
      case 'Moderate': return 'text-amber-400 border-amber-900 bg-amber-950/20';
      case 'Poor': return 'text-rose-400 border-rose-900 bg-rose-950/20';
      default: return 'text-slate-500 border-slate-900 bg-slate-950/20';
    }
  };

  const getVolatilityBadge = (level) => {
    switch (level) {
      case 'HIGH': return 'text-rose-400 border-rose-900 bg-rose-950/40 animate-pulse';
      case 'MEDIUM': return 'text-amber-400 border-amber-900 bg-amber-950/20';
      case 'LOW': return 'text-slate-400 border-slate-900 bg-slate-900/40';
      default: return 'text-slate-500 border-slate-900 bg-slate-900/40';
    }
  };

  // ===================================================================
  // HUMAN-FRIENDLY INTELLIGENCE HELPERS
  // ===================================================================

  // 🏆 Traffic Light System per asset
  const getTrafficLight = (item) => {
    if (!item) return { emoji: '⚪', label: 'No Data', color: 'text-slate-500', bg: 'bg-slate-900/40' };
    const health = item.marketHealthScore ?? 50;
    const risk = item.overallRiskScore ?? 50;
    if (health >= 75 && risk < 40) return { emoji: '🟢', label: 'Good', color: 'text-emerald-400', bg: 'bg-emerald-950/30' };
    if (health >= 50 && risk < 65) return { emoji: '🟡', label: 'Caution', color: 'text-amber-400', bg: 'bg-amber-950/30' };
    return { emoji: '🔴', label: 'Risky', color: 'text-rose-400', bg: 'bg-rose-950/30' };
  };

  // 🏆 Market Weather
  const getMarketWeather = (item) => {
    if (!item) return { emoji: '🌫️', label: 'Unknown', desc: 'No data available', color: 'text-slate-400' };
    const vol = item.volatilityLevel || 'LOW';
    const health = item.marketHealthScore ?? 50;
    if (vol === 'LOW' && health >= 70) return { emoji: '☀️', label: 'Sunny', desc: 'Stable conditions, smooth trading', color: 'text-amber-300' };
    if (vol === 'MEDIUM' || (vol === 'LOW' && health < 70)) return { emoji: '⛅', label: 'Cloudy', desc: 'Moderate uncertainty, watch closely', color: 'text-slate-300' };
    if (vol === 'HIGH' && health >= 40) return { emoji: '🌧️', label: 'Rainy', desc: 'Elevated volatility, proceed carefully', color: 'text-blue-300' };
    return { emoji: '⛈️', label: 'Stormy', desc: 'High volatility and stress detected', color: 'text-rose-300' };
  };

  // 🏆 Market Mood
  const getMarketMood = () => {
    const assets = Object.values(metricsMap);
    if (assets.length === 0) return { emoji: '😶', label: 'Waiting', desc: 'Awaiting data feed' };
    const avgHealth = assets.reduce((s, a) => s + (a.marketHealthScore ?? 50), 0) / assets.length;
    const avgRisk = assets.reduce((s, a) => s + (a.overallRiskScore ?? 50), 0) / assets.length;
    if (avgHealth >= 80 && avgRisk < 30) return { emoji: '😊', label: 'Happy', desc: 'Markets are calm and healthy' };
    if (avgHealth >= 60 && avgRisk < 50) return { emoji: '😐', label: 'Neutral', desc: 'Mixed signals, nothing extreme' };
    if (avgHealth >= 40 || avgRisk < 70) return { emoji: '😟', label: 'Nervous', desc: 'Uncertainty rising, stay alert' };
    return { emoji: '😱', label: 'Panic', desc: 'High stress across multiple assets' };
  };

  // 🏆 Asset Report Card Grades
  const getGrade = (score, invert = false) => {
    const s = invert ? (100 - score) : score;
    if (s >= 90) return 'A+';
    if (s >= 80) return 'A';
    if (s >= 70) return 'B+';
    if (s >= 60) return 'B';
    if (s >= 50) return 'C+';
    if (s >= 40) return 'C';
    if (s >= 30) return 'D';
    return 'F';
  };

  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return 'text-emerald-400';
    if (grade.startsWith('B')) return 'text-cyan-400';
    if (grade.startsWith('C')) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getAssetReportCard = (item) => {
    if (!item) return null;
    const liqGrade = getGrade(item.liquidityScore ?? 0);
    const riskGrade = getGrade(item.overallRiskScore ?? 0, true);
    const volGrade = getGrade(item.volatilityLevel === 'LOW' ? 85 : (item.volatilityLevel === 'MEDIUM' ? 60 : 30));
    const healthGrade = getGrade(item.marketHealthScore ?? 0);
    const scores = [liqGrade, riskGrade, volGrade, healthGrade].map(g => {
      if (g === 'A+') return 97; if (g === 'A') return 85; if (g === 'B+') return 75;
      if (g === 'B') return 65; if (g === 'C+') return 55; if (g === 'C') return 45;
      if (g === 'D') return 35; return 20;
    });
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const overall = getGrade(avg);
    return { liqGrade, riskGrade, volGrade, healthGrade, overall };
  };

  // 🏆 ELI5 (Explain Like I'm 5) for any symbol
  const getELI5 = (item) => {
    if (!item) return ["No data available for this asset yet.", "Please wait for the next update cycle."];
    const lines = [];
    const sym = item.symbol;
    
    // Trading activity
    if (item.volume > 10000000) lines.push(`${sym} is very actively traded right now. Lots of people are buying and selling.`);
    else if (item.volume > 1000000) lines.push(`${sym} has moderate trading activity. A decent number of people are participating.`);
    else if (item.volume > 0) lines.push(`${sym} has relatively low trading activity right now.`);
    else lines.push(`${sym} volume data is not currently available.`);

    // Price stability
    const weather = getMarketWeather(item);
    if (weather.label === 'Sunny') lines.push(`Prices are stable. This is a calm, predictable environment.`);
    else if (weather.label === 'Cloudy') lines.push(`Prices are moving a bit. Nothing alarming, but worth watching.`);
    else if (weather.label === 'Rainy') lines.push(`Prices are shifting noticeably. There's some uncertainty in the market.`);
    else lines.push(`Prices are swinging significantly. This means higher risk but also potential opportunity.`);

    // Risk assessment
    const risk = item.overallRiskScore ?? 50;
    if (risk < 30) lines.push(`Risk is low. This asset looks safe for now.`);
    else if (risk < 60) lines.push(`Risk is moderate. Keep an eye on it, but nothing urgent.`);
    else lines.push(`Risk is elevated. Be cautious — large price moves are possible.`);

    // Liquidity
    if (item.liquidityRating === 'Excellent') lines.push(`Liquidity is excellent. You could buy or sell quickly without affecting the price.`);
    else if (item.liquidityRating === 'Good') lines.push(`Liquidity is good. Trades should execute smoothly.`);
    else if (item.liquidityRating === 'Moderate') lines.push(`Liquidity is moderate. Larger trades might move the price a bit.`);
    else lines.push(`Liquidity is low. Trading large amounts could significantly impact the price.`);

    return lines;
  };

  // 🏆 One Sentence Market Summary
  const getOneSentenceSummary = () => {
    const assets = Object.values(metricsMap);
    if (assets.length === 0) return ["Connecting to market data feed...", "Results will appear once data arrives."];

    const lines = [];
    const stockAssets = assets.filter(a => a.assetType === 'stock');
    const cryptoAssets = assets.filter(a => a.assetType === 'crypto');
    const avgHealth = assets.reduce((s, a) => s + (a.marketHealthScore ?? 50), 0) / assets.length;

    if (stockAssets.length > 0) {
      const highVol = stockAssets.filter(a => a.volatilityLevel === 'HIGH');
      if (highVol.length === 0) lines.push("Stocks are trading normally with stable conditions.");
      else if (highVol.length <= 2) lines.push(`Most stocks are stable, but ${highVol.map(a => a.symbol).join(' and ')} ${highVol.length === 1 ? 'is' : 'are'} showing elevated movement.`);
      else lines.push("Several stocks are experiencing higher-than-normal volatility.");
    }

    if (cryptoAssets.length > 0) {
      const cryptoHighVol = cryptoAssets.filter(a => a.volatilityLevel === 'HIGH');
      if (cryptoHighVol.length > 0) lines.push("Crypto markets are experiencing higher volatility.");
      else lines.push("Crypto markets are relatively calm.");
    }

    if (avgHealth >= 75) lines.push("Overall market health is good. ✅");
    else if (avgHealth >= 50) lines.push("Overall market health is moderate. ⚠️");
    else lines.push("Market health is below average. Proceed with caution. 🔻");

    return lines;
  };

  // 🏆 Market Pulse
  const getMarketPulse = () => {
    const assets = Object.values(metricsMap);
    if (assets.length === 0) return { label: 'Offline', strength: 0, color: 'text-slate-500', ring: 'border-slate-700' };
    const avgHealth = assets.reduce((s, a) => s + (a.marketHealthScore ?? 50), 0) / assets.length;
    const freshCount = assets.filter(a => a.receivedTime && (Date.now() - a.receivedTime) < 60000).length;
    const freshRatio = freshCount / assets.length;
    const pulse = Math.round(avgHealth * 0.7 + freshRatio * 30);
    if (pulse >= 75) return { label: 'Strong', strength: pulse, color: 'text-emerald-400', ring: 'border-emerald-500', glow: 'shadow-emerald-500/20' };
    if (pulse >= 50) return { label: 'Steady', strength: pulse, color: 'text-amber-400', ring: 'border-amber-500', glow: 'shadow-amber-500/20' };
    if (pulse >= 25) return { label: 'Weak', strength: pulse, color: 'text-rose-400', ring: 'border-rose-500', glow: 'shadow-rose-500/20' };
    return { label: 'Critical', strength: pulse, color: 'text-rose-500', ring: 'border-rose-600', glow: 'shadow-rose-600/30' };
  };

  // 🏆 Why Should I Care - Alert Enrichment
  const getWhyShouldICare = (alert) => {
    if (!alert) return '';
    const msg = alert.message.toLowerCase();
    if (msg.includes('liquidity')) return 'Large investors may find it harder to trade quickly without moving the price.';
    if (msg.includes('volatility')) return 'Prices could swing sharply — both gains and losses become more likely.';
    if (msg.includes('health')) return 'The overall trading environment is degrading. Caution advised for new positions.';
    if (msg.includes('quote') || msg.includes('missing')) return 'Without bid/ask data, true market depth and fair pricing cannot be determined.';
    return 'Market conditions have changed. Review your positions carefully.';
  };

  // 🏆 Overall Market Health Meter (aggregate)
  const getOverallMarketHealth = () => {
    const assets = Object.values(metricsMap);
    if (assets.length === 0) return { score: 0, label: 'Offline', color: 'text-slate-500', bg: 'from-slate-800 to-slate-900' };
    const avg = Math.round(assets.reduce((s, a) => s + (a.marketHealthScore ?? 50), 0) / assets.length);
    if (avg >= 80) return { score: avg, label: 'Healthy', color: 'text-emerald-400', bg: 'from-emerald-900/30 to-emerald-950/10' };
    if (avg >= 60) return { score: avg, label: 'Moderate', color: 'text-cyan-400', bg: 'from-cyan-900/30 to-cyan-950/10' };
    if (avg >= 40) return { score: avg, label: 'Stressed', color: 'text-amber-400', bg: 'from-amber-900/30 to-amber-950/10' };
    return { score: avg, label: 'Critical', color: 'text-rose-400', bg: 'from-rose-900/30 to-rose-950/10' };
  };

  const renderMarketScanner = () => {
    const list = Object.values(metricsMap);
    if (list.length === 0) {
      return (
        <div className="bg-[#0d0f14] border border-[#1e293b] rounded-xl p-8 text-center text-slate-500 font-mono text-sm">
          Awaiting market intelligence feed. Please make sure the backend is polling active assets.
        </div>
      );
    }

    const topGainers = [...list]
      .filter(a => a.dailyChangePercent !== undefined && a.dailyChangePercent !== null)
      .sort((a, b) => b.dailyChangePercent - a.dailyChangePercent)
      .slice(0, 10);

    const topLosers = [...list]
      .filter(a => a.dailyChangePercent !== undefined && a.dailyChangePercent !== null)
      .sort((a, b) => a.dailyChangePercent - b.dailyChangePercent)
      .slice(0, 10);

    const topVolume = [...list]
      .filter(a => a.volume !== undefined && a.volume !== null)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10);

    const topVolatile = [...list]
      .filter(a => a.stdev !== undefined && a.stdev !== null)
      .sort((a, b) => {
        const valA = a.stdev / (a.lastPrice || 1);
        const valB = b.stdev / (b.lastPrice || 1);
        return valB - valA;
      })
      .slice(0, 10);

    const topLiquidity = [...list]
      .filter(a => a.liquidityScore !== undefined && a.liquidityScore !== null)
      .sort((a, b) => b.liquidityScore - a.liquidityScore)
      .slice(0, 10);

    const worstLiquidity = [...list]
      .filter(a => a.liquidityScore !== undefined && a.liquidityScore !== null)
      .sort((a, b) => a.liquidityScore - b.liquidityScore)
      .slice(0, 10);

    return (
      <div className="space-y-6 max-w-[1600px] mx-auto w-full font-mono text-xs">
        <div className="bg-[#0d0f14] border border-[#1e293b] rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-[4px] h-full bg-blue-600" />
          <h2 className="text-lg font-bold text-slate-100 font-sans">Bloomberg Lite Scanner</h2>
          <p className="text-slate-500 text-xs mt-1">Real-time ranked lists across the entire watchlist, updated per polling cycle.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-[#0d0f14] border border-[#1e293b] rounded-xl overflow-hidden shadow-lg">
            <div className="bg-emerald-950/20 border-b border-[#1e293b] px-4 py-3 font-bold text-emerald-400 uppercase tracking-wider flex justify-between">
              <span>Top 10 Gainers</span>
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="divide-y divide-slate-900">
              {topGainers.length === 0 ? (
                <div className="px-4 py-3 text-slate-600 italic">No data</div>
              ) : (
                topGainers.map((item, idx) => (
                  <div key={item.symbol} className="px-4 py-2.5 flex justify-between items-center hover:bg-[#121620]/30">
                    <span className="font-bold text-slate-300">{idx + 1}. {item.symbol}</span>
                    <span className="font-semibold text-emerald-400">+{formatVal(item.dailyChangePercent, 2)}%</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-[#0d0f14] border border-[#1e293b] rounded-xl overflow-hidden shadow-lg">
            <div className="bg-rose-950/20 border-b border-[#1e293b] px-4 py-3 font-bold text-rose-400 uppercase tracking-wider flex justify-between">
              <span>Top 10 Losers</span>
              <TrendingUp className="w-4 h-4 rotate-180" />
            </div>
            <div className="divide-y divide-slate-900">
              {topLosers.length === 0 ? (
                <div className="px-4 py-3 text-slate-600 italic">No data</div>
              ) : (
                topLosers.map((item, idx) => (
                  <div key={item.symbol} className="px-4 py-2.5 flex justify-between items-center hover:bg-[#121620]/30">
                    <span className="font-bold text-slate-300">{idx + 1}. {item.symbol}</span>
                    <span className="font-semibold text-rose-400">{formatVal(item.dailyChangePercent, 2)}%</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-[#0d0f14] border border-[#1e293b] rounded-xl overflow-hidden shadow-lg">
            <div className="bg-blue-950/20 border-b border-[#1e293b] px-4 py-3 font-bold text-blue-400 uppercase tracking-wider flex justify-between">
              <span>Highest Volume</span>
              <Zap className="w-4 h-4" />
            </div>
            <div className="divide-y divide-slate-900">
              {topVolume.length === 0 ? (
                <div className="px-4 py-3 text-slate-600 italic">No data</div>
              ) : (
                topVolume.map((item, idx) => (
                  <div key={item.symbol} className="px-4 py-2.5 flex justify-between items-center hover:bg-[#121620]/30">
                    <span className="font-bold text-slate-300">{idx + 1}. {item.symbol}</span>
                    <span className="font-semibold text-slate-300">{Math.round(item.volume).toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-[#0d0f14] border border-[#1e293b] rounded-xl overflow-hidden shadow-lg">
            <div className="bg-amber-950/20 border-b border-[#1e293b] px-4 py-3 font-bold text-amber-400 uppercase tracking-wider flex justify-between">
              <span>Most Volatile</span>
              <Sliders className="w-4 h-4" />
            </div>
            <div className="divide-y divide-slate-900">
              {topVolatile.length === 0 ? (
                <div className="px-4 py-3 text-slate-600 italic">No data</div>
              ) : (
                topVolatile.map((item, idx) => {
                  const cv = (item.stdev / (item.lastPrice || 1)) * 100;
                  return (
                    <div key={item.symbol} className="px-4 py-2.5 flex justify-between items-center hover:bg-[#121620]/30">
                      <span className="font-bold text-slate-300">{idx + 1}. {item.symbol}</span>
                      <span className="font-semibold text-amber-400">{formatVal(cv, 3)}% (CV)</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-[#0d0f14] border border-[#1e293b] rounded-xl overflow-hidden shadow-lg">
            <div className="bg-cyan-950/20 border-b border-[#1e293b] px-4 py-3 font-bold text-cyan-400 uppercase tracking-wider flex justify-between">
              <span>Highest Liquidity</span>
              <Scale className="w-4 h-4" />
            </div>
            <div className="divide-y divide-slate-900">
              {topLiquidity.length === 0 ? (
                <div className="px-4 py-3 text-slate-600 italic">No data</div>
              ) : (
                topLiquidity.map((item, idx) => (
                  <div key={item.symbol} className="px-4 py-2.5 flex justify-between items-center hover:bg-[#121620]/30">
                    <span className="font-bold text-slate-300">{idx + 1}. {item.symbol}</span>
                    <span className="font-semibold text-cyan-400">{formatVal(item.liquidityScore, 0)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-[#0d0f14] border border-[#1e293b] rounded-xl overflow-hidden shadow-lg">
            <div className="bg-rose-950/20 border-b border-[#1e293b] px-4 py-3 font-bold text-rose-400 uppercase tracking-wider flex justify-between">
              <span>Worst Liquidity</span>
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="divide-y divide-slate-900">
              {worstLiquidity.length === 0 ? (
                <div className="px-4 py-3 text-slate-600 italic">No data</div>
              ) : (
                worstLiquidity.map((item, idx) => (
                  <div key={item.symbol} className="px-4 py-2.5 flex justify-between items-center hover:bg-[#121620]/30">
                    <span className="font-bold text-slate-300">{idx + 1}. {item.symbol}</span>
                    <span className="font-semibold text-rose-400">{formatVal(item.liquidityScore, 0)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderReplayStudio = () => {
    const prices = replayHistory.map(h => h.price).filter(p => p !== null && !isNaN(p));
    const spreads = replayHistory.map(h => h.spread).filter(s => s !== null && !isNaN(s));
    const volumes = replayHistory.map(h => h.volume).filter(v => v !== null && !isNaN(v));
    const stdevs = replayHistory.map(h => h.stdev).filter(sd => sd !== null && !isNaN(sd));

    const avgPrice = prices.length ? (prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
    const avgSpread = spreads.length ? (spreads.reduce((a, b) => a + b, 0) / spreads.length) : 0;
    const avgVolume = volumes.length ? (volumes.reduce((a, b) => a + b, 0) / volumes.length) : 0;
    const avgVolatility = stdevs.length ? (stdevs.reduce((a, b) => a + b, 0) / stdevs.length) : 0;

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

    return (
      <div className="space-y-6 max-w-[1200px] mx-auto w-full font-mono text-xs">
        <div className="bg-[#0d0f14] border border-[#1e293b] rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-[4px] h-full bg-blue-600" />
          <h2 className="text-lg font-bold text-slate-100 font-sans">Market Replay Studio</h2>
          <p className="text-slate-500 text-xs mt-1">Replay historical minute candles, simulated through the C++ analyzer pipeline.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#0d0f14] border border-[#1e293b] rounded-xl p-5 shadow-lg">
          <div className="space-y-1.5">
            <label className="text-slate-500 block">Replay Symbol:</label>
            <input
              type="text"
              value={replaySymbol}
              onChange={(e) => setReplaySymbol(e.target.value.toUpperCase())}
              placeholder="e.g. AAPL or X:BTCUSD"
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:border-blue-500 outline-none uppercase font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-500 block">Replay Date (within 30 days):</label>
            <input
              type="date"
              value={replayDate}
              onChange={(e) => setReplayDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:border-blue-500 outline-none font-bold"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={startReplay}
              disabled={replayProgress.state === 'PLAYING'}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded shadow-lg shadow-blue-500/10 transition-colors"
            >
              Load & Start Replay
            </button>
          </div>
        </div>

        {replayProgress.total > 0 && (
          <div className="bg-[#0d0f14] border border-[#1e293b] rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-slate-900">
              <div>
                <span className="text-[10px] font-bold text-blue-500 uppercase">REPLAY PROGRESS</span>
                <div className="text-sm font-bold text-slate-200">
                  {replayProgress.currentIndex} / {replayProgress.total} minutes
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-indigo-400 uppercase block">REPLAY TIMESTAMP</span>
                <span className="text-sm font-bold text-slate-200">
                  {new Date(replayProgress.timestamp).toUTCString()}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max={replayProgress.total - 1}
                value={replayProgress.currentIndex}
                onChange={(e) => handleSeek(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-950 border border-slate-850 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div className="flex flex-wrap justify-between items-center gap-4">
              <div className="flex space-x-2">
                {replayProgress.state === 'PLAYING' ? (
                  <button
                    onClick={pauseReplay}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2 rounded"
                  >
                    Pause
                  </button>
                ) : (
                  <button
                    onClick={resumeReplay}
                    disabled={replayProgress.state === 'COMPLETED'}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded"
                  >
                    Play
                  </button>
                )}
                <button
                  onClick={stopReplay}
                  className="bg-rose-700 hover:bg-rose-600 text-white font-bold px-4 py-2 rounded"
                >
                  Stop
                </button>
              </div>

              <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-900 rounded p-1">
                {[1, 2, 10, 100].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setSpeed(spd)}
                    className={`px-3 py-1 rounded text-[10px] font-bold transition-colors ${replayProgress.speed === spd ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {replayMetrics && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#0d0f14] border border-[#1e293b] rounded-xl p-5 shadow-lg space-y-4">
              <h3 className="text-sm font-bold text-slate-300 border-b border-slate-900 pb-2">Active Candle Metrics</h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-[#12151e] border border-slate-900 p-3 rounded">
                  <span className="text-slate-500 block mb-1">Replay Price:</span>
                  <span className="text-lg font-bold text-slate-200">{formatVal(replayMetrics.lastPrice, 2, " $")}</span>
                </div>
                <div className="bg-[#12151e] border border-slate-900 p-3 rounded">
                  <span className="text-slate-500 block mb-1">Spread:</span>
                  <span className="text-lg font-bold text-slate-200">
                    {replayMetrics.spread !== null ? `${formatVal(replayMetrics.spread, 2)} (${formatVal(replayMetrics.spreadPercent, 3, "%")})` : "N/A"}
                  </span>
                </div>
                <div className="bg-[#12151e] border border-slate-900 p-3 rounded">
                  <span className="text-slate-500 block mb-1">Liquidity:</span>
                  <span className="text-lg font-bold text-slate-200">{formatVal(replayMetrics.liquidityScore, 0)}</span>
                </div>
                <div className="bg-[#12151e] border border-slate-900 p-3 rounded">
                  <span className="text-slate-500 block mb-1">Risk Score:</span>
                  <span className="text-lg font-bold text-slate-200">{formatVal(replayMetrics.overallRiskScore, 0)}</span>
                </div>
              </div>

              <div className="bg-[#0b0c10] border border-slate-900 p-4 rounded-xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-3">Replay Sparkline</span>
                <div className="h-32 flex items-center justify-center">
                  {replayHistory.length < 2 ? (
                    <div className="text-slate-700 text-xs">Waiting for frames...</div>
                  ) : (
                    renderSVGSparkline(replayHistory)
                  )}
                </div>
              </div>
            </div>

            <div className="bg-[#0d0f14] border border-[#1e293b] rounded-xl p-5 shadow-lg space-y-4">
              <h3 className="text-sm font-bold text-slate-300 border-b border-slate-900 pb-2">Replay Stats Averages</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-900/60">
                  <span className="text-slate-500">Average Price:</span>
                  <span className="font-bold text-slate-200">{formatVal(avgPrice, 2, " $")}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-900/60">
                  <span className="text-slate-500">Average Spread:</span>
                  <span className="font-bold text-slate-200">{formatVal(avgSpread, 3, " $")}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-900/60">
                  <span className="text-slate-500">Average Volume:</span>
                  <span className="font-bold text-slate-200">{Math.round(avgVolume).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-slate-500">Average Volatility (StDev):</span>
                  <span className="font-bold text-slate-200">{formatVal(avgVolatility, 4)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const sortedActiveStocks = getSortedWatchlist(stocks).filter(sym => watchlistCollectionFilter === 'all' || favorites.includes(sym));
  const sortedActiveCryptos = getSortedWatchlist(cryptos).filter(sym => watchlistCollectionFilter === 'all' || favorites.includes(sym));
  const selectedMetric = metricsMap[selectedSymbol];
  const selectedHistory = historyMap[selectedSymbol] || [];


  // -------------------------------------------------------------
  // RENDERING MAIN APP
  // -------------------------------------------------------------
  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className={`min-h-screen bg-[#06070a] text-[#d1d5db] flex flex-col font-sans select-none selection:bg-blue-600 selection:text-white pb-6`}>
      
      {/* Header (Hidden in Fullscreen mode) */}
      {!fullscreen && (
        <header className="border-b border-[#1e293b]/70 bg-[#0a0c10]/95 px-6 py-4 flex flex-col lg:flex-row items-center justify-between gap-4 sticky top-0 z-40 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent leading-none">LiquidityWatch</h1>
                <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wider">Real-Time Market Liquidity Platform</p>
              </div>
            </div>
            
            <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

            {/* Live Clocks header section */}
            {cardVisibility.marketClocks && (
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-slate-500">
                <span>NYSE/NASDAQ: <strong className="text-slate-300">{clocks.nyse || "Loading..."}</strong></span>
                <span>CRYPTO: <strong className="text-indigo-400">{clocks.crypto || "Loading..."}</strong></span>
                <span>LOCAL: <strong className="text-slate-300">{clocks.local}</strong></span>
              </div>
            )}
          </div>

          {/* Tab Selection */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#0a0d12] border border-[#1e293b] rounded-lg p-1">
            {[
              { id: 'overview', icon: <LayoutGrid className="w-3.5 h-3.5" />, label: 'Market Overview', professionalOnly: false },
              { id: 'xray', icon: <User className="w-3.5 h-3.5" />, label: 'Portfolio X-Ray', professionalOnly: false },
              { id: 'journal', icon: <BookOpen className="w-3.5 h-3.5" />, label: 'Personal Journal', professionalOnly: false },
              { id: 'replay', icon: <Play className="w-3.5 h-3.5" />, label: 'Replay Studio', professionalOnly: false },
              { id: 'scanner', icon: <Activity className="w-3.5 h-3.5" />, label: 'Opportunity Scanner', professionalOnly: true },
              { id: 'strategy', icon: <Code className="w-3.5 h-3.5" />, label: 'Strategy Lab', professionalOnly: true },
              { id: 'latency', icon: <Cpu className="w-3.5 h-3.5" />, label: 'Latency Lab', professionalOnly: true },
              { id: 'orderbook', icon: <Layers className="w-3.5 h-3.5" />, label: 'Bid-Ask Liquidity', professionalOnly: true }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${activeTab === tab.id ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {tab.icon}
                <span className="hidden xl:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Quick Controls, Theme, Sound, Fullscreen, and Workspaces */}
          <div className="flex items-center space-x-3 text-xs w-full lg:w-auto justify-end flex-wrap gap-y-2">
            {/* User Profile and Sign Out */}
            {user && (
              <div className="flex items-center space-x-2 bg-slate-950/80 border border-slate-800 rounded px-2.5 py-1.5 text-[10px]">
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-slate-300 font-bold font-mono">{user}</span>
                <button 
                  onClick={handleLogout}
                  className="bg-rose-950/40 hover:bg-rose-950/80 border border-rose-900/50 text-rose-450 px-1.5 py-0.5 rounded transition-all font-semibold ml-1 cursor-pointer"
                  title="Sign Out"
                >
                  Exit
                </button>
              </div>
            )}
            {/* Workspace Selector */}
            <div className="flex items-center space-x-1 bg-slate-950 border border-slate-900 rounded p-0.5">
              {[1, 2, 3].map(wsNum => (
                <button
                  key={wsNum}
                  onClick={() => setActiveWorkspace(wsNum)}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${activeWorkspace === wsNum ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                  title={`Switch to Workspace ${wsNum}`}
                >
                  WS {wsNum}
                </button>
              ))}
            </div>

            {/* Interactive Tour Button */}
            <button
              onClick={() => setTourStep(0)}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 px-2 py-1.5 rounded font-semibold text-[10px]"
              title="Start Onboarding Tour"
            >
              🎓 Tour
            </button>

            {/* Beginner / Professional Mode Toggle */}
            <button
              onClick={() => setBeginnerMode(!beginnerMode)}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded text-[10px] font-bold transition-all border ${beginnerMode ? 'bg-emerald-900/30 border-emerald-700/50 text-emerald-400 hover:bg-emerald-900/50' : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'}`}
              title={beginnerMode ? 'Switch to Professional Mode' : 'Switch to Beginner Mode'}
            >
              {beginnerMode ? <Eye className="w-3 h-3" /> : <Gauge className="w-3 h-3" />}
              <span>{beginnerMode ? 'Beginner' : 'Pro'}</span>
            </button>

            {/* Global Virtual Cash Balance Indicator */}
            <div className="flex items-center space-x-2 bg-slate-950/80 border border-slate-800 rounded px-2.5 py-1.5 text-[10px] font-bold">
              <Coins className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-500 uppercase">Cash:</span>
              <span className="text-emerald-400 font-mono">${paperCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <button 
                onClick={() => setAddFundsOpen(true)}
                className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded transition-colors ml-1"
                title="Add Virtual Money"
              >
                + Add
              </button>
            </div>

            {/* Ctrl+K Command Palette Trigger Button */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-500 px-2.5 py-1.5 rounded font-mono text-[10px]"
              title="Open Command Palette (Ctrl+K)"
            >
              ⌘K
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200"
              title={`Toggle ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* Audio Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-455 hover:text-slate-200"
              title={`${soundEnabled ? 'Disable' : 'Enable'} Alert Sound`}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-rose-500" />}
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setFullscreen(true)}
              className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200"
              title="Enter Fullscreen Trading Mode"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {/* Mode Indicator */}
            {status.mode.startsWith('REPLAY') ? (
              <div className="flex items-center space-x-1.5 bg-indigo-950/40 border border-indigo-500/40 text-indigo-400 px-3 py-1.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
                <Clock className="w-3.5 h-3.5" />
                <span>REPLAY MODE</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 px-3 py-1.5 rounded-full font-bold uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>LIVE MODE</span>
              </div>
            )}

            <button 
              onClick={exportToCSV}
              disabled={Object.keys(metricsMap).length === 0}
              className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded font-semibold disabled:opacity-40 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <div className="flex items-center space-x-2 bg-[#121620] border border-[#1e293b] px-3 py-1.5 rounded-full">
              {connected ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
              )}
              <span className="font-semibold tracking-wide uppercase">{connected ? 'Gateway' : 'Offline'}</span>
            </div>

            <div className="flex items-center space-x-2 bg-[#121620] border border-[#1e293b] px-3 py-1.5 rounded-full">
              <span className={`w-2.5 h-2.5 rounded-full ${
                status.polygonStatus === 'Connected' ? 'bg-emerald-500 animate-pulse' : 
                (status.polygonStatus === 'Simulated' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500')
              }`} />
              <span>Feed: <strong className="text-slate-200">{status.polygonStatus}</strong></span>
            </div>
          </div>
        </header>
      )}

      {/* Floating Exit Fullscreen Button */}
      {fullscreen && (
        <button
          onClick={() => setFullscreen(false)}
          className="fixed top-4 right-4 z-50 p-2.5 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-250 backdrop-blur"
          title="Exit Fullscreen Trading Mode"
        >
          <Minimize2 className="w-5 h-5" />
        </button>
      )}

      {/* Main Dashboard Panels */}
      {activeTab === "analytics" && (
        <main className="flex-1 p-6 space-y-6 max-w-[1600px] mx-auto w-full">
          
          {/* AI Morning Briefing */}
          <div className="bg-[#0d0f14] border border-[#1e293b] rounded-xl p-5 shadow-lg relative overflow-hidden glass-panel">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold gradient-text flex items-center space-x-2">
                <Sun className="w-5 h-5 text-amber-400" />
                <span>AI Morning Market Briefing</span>
              </h3>
              <button
                onClick={async () => {
                  setBriefingLoading(true);
                  try {
                    const res = await fetch("http://localhost:9005/api/intelligence/briefing", { method: 'POST' });
                    const data = await res.json();
                    setMarketBriefing(data.response);
                  } catch (e) {
                    setMarketBriefing("Failed to generate briefing.");
                  } finally {
                    setBriefingLoading(false);
                  }
                }}
                disabled={briefingLoading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded text-xs font-semibold disabled:opacity-50 transition-colors flex items-center space-x-2"
              >
                {briefingLoading ? <Zap className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                <span>{marketBriefing ? 'Regenerate Briefing' : 'Generate Briefing'}</span>
              </button>
            </div>
            {marketBriefing && (
              <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-lg text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {marketBriefing}
              </div>
            )}
            {!marketBriefing && !briefingLoading && (
              <div className="text-slate-500 text-sm italic">Click the button to generate a fresh AI summary of the current market conditions.</div>
            )}
          </div>
          
          {/* Simulation Alert Banner */}
          {status.polygonStatus === 'Simulated' && (
            <div className="bg-amber-950/30 border border-amber-900/60 rounded-xl px-5 py-3.5 flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div className="text-xs text-amber-300 leading-normal">
                <strong>Simulated Data Active:</strong> {status.message}. Feed is simulated using high-fidelity C++ analytics calculations. Configure your `POLYGON_API_KEY` in `backend/.env` for real-time exchange feeds.
              </div>
            </div>
          )}

          {/* Render core Intelligence cards using fetched state */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Liquidity Shock Detector */}
            <div className="bg-[#0d0f14] border border-[#1e293b] p-4 rounded-xl shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-[4px] h-full bg-rose-600" />
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center mb-3">
                <span>Liquidity Shock Detector</span>
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              </h3>
              <div className="max-h-[120px] overflow-y-auto space-y-1.5 pr-2">
                {shocks.length === 0 ? (
                  <div className="text-slate-600 italic text-[11px]">No active shocks detected in the market...</div>
                ) : (
                  shocks.slice().reverse().map((s, i) => (
                    <div key={i} className="flex justify-between items-center bg-rose-950/10 border border-rose-900/30 rounded px-2.5 py-1.5 text-[11px] text-rose-300">
                      <div className="flex space-x-2 items-center">
                        <span className="font-bold">{s.symbol}</span>
                        <span>{s.type} ({s.changePct}%)</span>
                      </div>
                      <button 
                        onClick={async () => {
                          setAlertAnalysisLoading(i);
                          try {
                            const res = await fetch("http://localhost:9005/api/intelligence/explain-alert", {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ logText: s.type, asset: s.symbol })
                            });
                            const data = await res.json();
                            setAlertAnalysis(data.response);
                          } catch (e) {
                            setAlertAnalysis("Error fetching analysis.");
                          } finally {
                            setAlertAnalysisLoading(null);
                          }
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-0.5 rounded shadow-sm flex items-center space-x-1"
                      >
                        {alertAnalysisLoading === i ? <Zap className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                        <span>Analyze</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Market Regime Engine */}
            <div className="bg-[#0d0f14] border border-[#1e293b] p-4 rounded-xl shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-[4px] h-full bg-indigo-600" />
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center mb-3">
                <span>Market Regime Engine</span>
                <Activity className="w-3.5 h-3.5 text-indigo-400" />
              </h3>
              <div className="flex flex-col justify-center h-[120px] text-center">
                <span className="text-2xl font-bold text-slate-100 bg-indigo-950/20 border border-indigo-900/30 rounded-lg py-3">
                  {regime?.regime || 'Neutral'}
                </span>
                <span className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider">
                  Confidence Indicator: {regime?.confidence || 0}%
                </span>
              </div>
            </div>

            {/* Overall Market Health Meter */}
            <div className="bg-[#0d0f14] border border-[#1e293b] p-4 rounded-xl shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-[4px] h-full bg-emerald-600" />
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center mb-3">
                <span>Overall Market Health</span>
                <Scale className="w-3.5 h-3.5 text-emerald-400" />
              </h3>
              <div className="flex flex-col justify-center h-[120px] text-center">
                <span className="text-2xl font-bold text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 rounded-lg py-3">
                  {health?.score !== undefined ? `${health.score}%` : '0%'}
                </span>
                <span className="text-[10px] text-emerald-500 mt-2 font-bold uppercase tracking-wider">
                  State: {health?.description || 'Calculating...'}
                </span>
              </div>
            </div>
          </div>

          {/* Main Dashboard Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1: Watchlist Manager */}
            <div className="bg-[#0d0f14] border border-[#1e293b] rounded-xl p-5 shadow-lg space-y-4" id="watchlist-manager-section">
              <h3 className="text-sm font-bold text-slate-200 border-b border-[#1e293b] pb-2 flex justify-between items-center">
                <span>Watchlist Manager</span>
                <Sliders className="w-4 h-4 text-slate-500" />
              </h3>

              {/* Add Ticker Form */}
              <form onSubmit={handleAddSymbol} className="flex gap-2">
                <select
                  value={searchAssetType}
                  onChange={(e) => setSearchAssetType(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-300 focus:border-blue-500 outline-none"
                >
                  <option value="stock">Stock</option>
                  <option value="crypto">Crypto</option>
                </select>
                <input
                  type="text"
                  placeholder="e.g. NVDA or X:BTCUSD"
                  value={searchSymbol}
                  onChange={(e) => setSearchSymbol(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:border-blue-500 outline-none uppercase font-bold"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded text-xs transition-colors"
                >
                  Add
                </button>
              </form>

              {/* Filters & Actions */}
              <div className="flex justify-between items-center text-[10px]">
                <div className="flex space-x-1.5 bg-slate-950 border border-slate-900 rounded p-0.5">
                  <button
                    onClick={() => setWatchlistCollectionFilter('all')}
                    className={`px-2 py-1 rounded transition-colors ${watchlistCollectionFilter === 'all' ? 'bg-blue-600 text-white font-bold' : 'text-slate-500 hover:text-slate-350'}`}
                  >
                    All Tickers
                  </button>
                  <button
                    onClick={() => setWatchlistCollectionFilter('favorites')}
                    className={`px-2 py-1 rounded transition-colors ${watchlistCollectionFilter === 'favorites' ? 'bg-blue-600 text-white font-bold' : 'text-slate-500 hover:text-slate-350'}`}
                  >
                    Favorites ⭐
                  </button>
                </div>
              </div>

              {/* Tickers list */}
              <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1 divide-y divide-slate-900/60">
                {/* Stocks */}
                {sortedActiveStocks.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Stocks Watchlist</span>
                    {sortedActiveStocks.map(sym => {
                      const m = metricsMap[sym] || {};
                      const isFav = favorites.includes(sym);
                      return (
                        <div
                          key={sym}
                          onClick={() => setSelectedSymbol(sym)}
                          className={`flex items-center justify-between p-2 rounded cursor-pointer transition-all hover:bg-slate-900 ${selectedSymbol === sym ? 'bg-[#181d2a] border-l-2 border-blue-500' : 'bg-slate-950/40 border border-slate-900'}`}
                        >
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleFavorite(sym); }}
                              className="text-amber-500 hover:scale-110 transition-transform"
                            >
                              {isFav ? '★' : '☆'}
                            </button>
                            <span className="font-bold text-xs text-slate-200">{sym}</span>
                          </div>
                          <div className="flex items-center space-x-3 text-xs">
                            <span className="font-mono text-slate-400">{formatVal(m.lastPrice, 2, " $")}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRemoveSymbol(sym, 'stock'); }}
                              className="text-rose-500 hover:text-rose-400 animate-pulse"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Cryptos */}
                {sortedActiveCryptos.length > 0 && (
                  <div className="space-y-1.5 pt-4">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Crypto Watchlist</span>
                    {sortedActiveCryptos.map(sym => {
                      const m = metricsMap[sym] || {};
                      const isFav = favorites.includes(sym);
                      return (
                        <div
                          key={sym}
                          onClick={() => setSelectedSymbol(sym)}
                          className={`flex items-center justify-between p-2 rounded cursor-pointer transition-all hover:bg-slate-900 ${selectedSymbol === sym ? 'bg-[#181d2a] border-l-2 border-blue-500' : 'bg-slate-950/40 border border-slate-900'}`}
                        >
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleFavorite(sym); }}
                              className="text-amber-500 hover:scale-110 transition-transform"
                            >
                              {isFav ? '★' : '☆'}
                            </button>
                            <span className="font-bold text-xs text-slate-200">{sym}</span>
                          </div>
                          <div className="flex items-center space-x-3 text-xs">
                            <span className="font-mono text-slate-400">{formatVal(m.lastPrice, 2, " $")}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRemoveSymbol(sym, 'crypto'); }}
                              className="text-rose-500 hover:text-rose-400 animate-pulse"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Asset Deep Inspection */}
            <div className="bg-[#0d0f14] border border-[#1e293b] rounded-xl p-5 shadow-lg space-y-4 lg:col-span-2" id="asset-deep-inspection-section">
              <h3 className="text-sm font-bold text-slate-200 border-b border-[#1e293b] pb-2 flex justify-between items-center">
                <span>Asset Inspection: <strong className="text-blue-500">{selectedSymbol}</strong></span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">REAL-TIME RISK METRIC ENGINE</span>
              </h3>

              {selectedMetric ? (
                <div className="space-y-4">
                  {/* Metric highlights */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-[#12151e] border border-[#1e293b]/40 p-3 rounded">
                      <span className="text-slate-500 block mb-1 text-[10px] uppercase font-bold">Last Price</span>
                      <span className="text-base font-bold text-slate-200">{formatVal(selectedMetric.lastPrice, 2, " $")}</span>
                      <span className={`text-[9px] font-bold block mt-1 ${selectedMetric.dailyChangePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {selectedMetric.dailyChangePercent >= 0 ? '▲' : '▼'} {formatVal(selectedMetric.dailyChangePercent, 2)}%
                      </span>
                    </div>
                    <div className="bg-[#12151e] border border-[#1e293b]/40 p-3 rounded">
                      <span className="text-slate-500 block mb-1 text-[10px] uppercase font-bold">Liquidity Score</span>
                      <span className={`text-base font-bold block ${
                        selectedMetric.liquidityScore >= 75 ? 'text-emerald-400' : 
                        (selectedMetric.liquidityScore >= 45 ? 'text-amber-400' : 'text-rose-400')
                      }`}>{formatVal(selectedMetric.liquidityScore, 0)} ({selectedMetric.liquidityRating})</span>
                    </div>
                    <div className="bg-[#12151e] border border-[#1e293b]/40 p-3 rounded">
                      <span className="text-slate-500 block mb-1 text-[10px] uppercase font-bold">Volatility</span>
                      <span className={`text-base font-bold block ${
                        selectedMetric.volatilityLevel === 'HIGH' ? 'text-rose-400' : 
                        (selectedMetric.volatilityLevel === 'MEDIUM' ? 'text-amber-400' : 'text-slate-400')
                      }`}>{selectedMetric.volatilityLevel}</span>
                    </div>
                    <div className="bg-[#12151e] border border-[#1e293b]/40 p-3 rounded">
                      <span className="text-slate-500 block mb-1 text-[10px] uppercase font-bold">Overall Risk</span>
                      <span className={`text-base font-bold block ${
                        selectedMetric.overallRiskScore >= 70 ? 'text-rose-400 animate-pulse' : 
                        (selectedMetric.overallRiskScore >= 40 ? 'text-amber-400' : 'text-emerald-400')
                      }`}>{formatVal(selectedMetric.overallRiskScore, 0)}%</span>
                    </div>
                  </div>

                  {/* Sparkline & Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* SVG Sparkline */}
                    <div className="bg-slate-950/30 border border-[#1e293b]/30 rounded p-3 md:col-span-2 flex flex-col justify-between h-48">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Price Sparkline (Vite SVG)</span>
                      <div className="h-32 flex items-center justify-center">
                        {selectedHistory.length < 2 ? (
                          <div className="text-slate-700 text-xs italic">Awaiting tick stream frames...</div>
                        ) : (
                          renderSVGSparkline(selectedHistory)
                        )}
                      </div>
                    </div>

                    {/* Freshness / Info */}
                    <div className="bg-[#12151e] border border-[#1e293b]/40 rounded p-4 flex flex-col justify-between h-48">
                      <div className="space-y-3">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Telemetry Info</span>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">Spread:</span>
                          <span className="font-bold text-slate-300">{formatVal(selectedMetric.spread, 2)} ({formatVal(selectedMetric.spreadPercent, 3, "%")})</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">Volume:</span>
                          <span className="font-bold text-slate-300">{Math.round(selectedMetric.volume || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-550">Institutional:</span>
                          <span className={`font-bold ${selectedMetric.institutionalAlert !== 'NONE' ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`}>
                            {selectedMetric.institutionalAlert}
                          </span>
                        </div>
                      </div>

                      <div className={`border rounded-lg px-2.5 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider ${getFreshness(selectedMetric).color}`}>
                        Feed state: {getFreshness(selectedMetric).label}
                      </div>
                    </div>
                  </div>

                  {/* Notes & Risk analysis */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Personal Notes */}
                    <div className="bg-slate-950/40 border border-[#1e293b]/40 rounded p-4 space-y-2">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Personal Notes</span>
                      <textarea
                        value={symbolNotes[selectedSymbol] || ""}
                        onChange={(e) => handleSaveNote(selectedSymbol, e.target.value)}
                        placeholder={`Write analysis, alerts, or notes for ${selectedSymbol}...`}
                        className="w-full bg-slate-950 border border-slate-900 rounded p-2 text-xs text-slate-300 focus:border-blue-500 outline-none h-20 resize-none font-sans"
                      />
                    </div>

                    {/* Rule-Based AI Summary statement */}
                    <div className="bg-slate-950/40 border border-[#1e293b]/40 rounded p-4 space-y-2 flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">Local Intelligence statement</span>
                        <div className="text-[11px] text-slate-400 leading-relaxed italic">
                          {generateImprovedAISummary()}
                        </div>
                      </div>
                      <div className="text-[9px] text-slate-500 font-bold uppercase">
                        Metrics refreshed every 15 seconds
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-slate-600 italic text-xs">
                  Select a symbol from the watchlist to inspect real-time metrics...
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* Main Tab Rendering */}
      {activeTab === "overview" && (
        <main className="flex-1 p-6 space-y-6 max-w-[1600px] mx-auto w-full">
          <MarketOverview 
            stocks={stocks}
            cryptos={cryptos}
            metricsMap={metricsMap}
            historyMap={historyMap}
            alerts={alertHistory}
            beginnerMode={beginnerMode}
            onRequestExplain={async (query) => {
              setAlertAnalysisLoading('overview');
              try {
                const res = await fetch("http://localhost:9005/api/intelligence/explain-alert", {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ logText: query, asset: "MARKET" })
                });
                const data = await res.json();
                setAlertAnalysis(data.response);
              } catch (e) {
                setAlertAnalysis("Failed to explain.");
              } finally {
                setAlertAnalysisLoading(null);
              }
            }}
          />
        </main>
      )}

      {activeTab === "xray" && (
        <main className="flex-1 p-6 space-y-6 max-w-[1600px] mx-auto w-full">
          <PortfolioXRay 
            paperCash={paperCash}
            paperPositions={paperPositions}
            metricsMap={metricsMap}
            historyMap={historyMap}
            paperHistory={paperHistory}
            pendingOrders={pendingOrders}
            stocks={stocks}
            cryptos={cryptos}
            beginnerMode={beginnerMode}
            onOpenAddFunds={() => setAddFundsOpen(true)}
            onPlaceMarketOrder={placeMarketOrder}
            onPlacePendingOrder={placePendingOrder}
            onCancelPendingOrder={cancelPendingOrder}
            onRequestExplain={async (query) => {
              setAlertAnalysisLoading('portfolio');
              try {
                const res = await fetch("http://localhost:9005/api/intelligence/explain-alert", {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ logText: query, asset: "PORTFOLIO" })
                });
                const data = await res.json();
                setAlertAnalysis(data.response);
              } catch (e) {
                setAlertAnalysis("Failed to explain.");
              } finally {
                setAlertAnalysisLoading(null);
              }
            }}
          />
        </main>
      )}

      {activeTab === "scanner" && (
        <main className="flex-1 p-6 space-y-6 max-w-[1600px] mx-auto w-full">
          <OpportunityScanner metricsMap={metricsMap} />
        </main>
      )}

      {activeTab === "strategy" && (
        <main className="flex-1 p-6 space-y-6 max-w-[1600px] mx-auto w-full">
          <StrategyLab 
            paperHistory={paperHistory}
            paperPositions={paperPositions}
            beginnerMode={beginnerMode}
          />
        </main>
      )}

      {activeTab === "journal" && (
        <main className="flex-1 p-6 space-y-6 max-w-[1600px] mx-auto w-full">
          <TradingJournalTab paperHistory={paperHistory} />
        </main>
      )}

      {activeTab === "replay" && (
        <main className="flex-1 p-6 space-y-6 max-w-[1600px] mx-auto w-full">
          <ReplayStudio 
            replayHistory={replayHistory}
            replayMetrics={replayMetrics}
            replayProgress={replayProgress}
            replaySymbol={replaySymbol}
            setReplaySymbol={setReplaySymbol}
            replayDate={replayDate}
            setReplayDate={setReplayDate}
            wsRef={wsRef}
            setReplayHistory={setReplayHistory}
            setReplayMetrics={setReplayMetrics}
            beginnerMode={beginnerMode}
          />
        </main>
      )}

      {activeTab === "latency" && (
        <main className="flex-1 p-6 space-y-6 max-w-[1600px] mx-auto w-full">
          <LatencyLab beginnerMode={beginnerMode} />
        </main>
      )}

      {activeTab === "orderbook" && (
        <main className="flex-1 p-6 space-y-6 max-w-[1600px] mx-auto w-full">
          <BidAskLiquidity metricsMap={metricsMap} stocks={stocks} cryptos={cryptos} beginnerMode={beginnerMode} />
        </main>
      )}

      {/* Alert Analysis Modal */}
      {alertAnalysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0d0f14] border border-[#1e293b] rounded-xl p-6 max-w-lg w-full shadow-2xl glass-panel">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <Zap className="text-emerald-400" />
              <span>AI Institutional Anomaly Explanation</span>
            </h3>
            <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed mb-6 max-h-[60vh] overflow-y-auto pr-2">
              {alertAnalysis}
            </div>
            <button 
              onClick={() => setAlertAnalysis(null)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2 rounded font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Virtual Funding Desk Modal */}
      <AnimatePresence>
        {addFundsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-[#0d0f14] border border-[#1e293b] rounded-xl p-6 max-w-md w-full shadow-2xl glass-panel relative overflow-hidden font-sans"
            >
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 animate-pulse" />
              
              <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                <Coins className="text-emerald-400 w-5 h-5" />
                <span>Virtual Funding Desk</span>
              </h3>

              <div className="space-y-4 text-xs">
                {/* Balance display */}
                <div className="bg-[#0a0d12] border border-[#1e293b] p-4 rounded-lg flex justify-between items-center">
                  <span className="text-slate-400 uppercase font-bold text-[10px]">Current Cash Balance</span>
                  <span className="text-lg font-mono font-bold text-emerald-400">
                    ${paperCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Quick Add Presets */}
                <div className="space-y-2">
                  <span className="text-slate-500 font-bold uppercase text-[9px] block">Quick Injection Presets</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: '+$10k', value: 10000 },
                      { label: '+$50k', value: 50000 },
                      { label: '+$100k', value: 100000 },
                      { label: '+$500k', value: 500000 }
                    ].map(preset => (
                      <button
                        type="button"
                        key={preset.value}
                        onClick={() => addVirtualFunds(preset.value)}
                        className="bg-slate-900 hover:bg-[#161b22] border border-slate-880 hover:border-emerald-500/30 text-slate-300 hover:text-emerald-400 py-2 rounded font-bold font-mono transition-all text-xs"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Amount Form */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const amountInput = e.target.elements.customAmount;
                    const parsed = parseFloat(amountInput.value);
                    if (!isNaN(parsed) && parsed > 0) {
                      addVirtualFunds(parsed);
                      amountInput.value = "";
                      setAddFundsOpen(false);
                    } else {
                      alert("Please enter a valid positive number.");
                    }
                  }}
                  className="space-y-3 pt-2"
                >
                  <div className="space-y-1">
                    <label className="text-slate-500 font-bold uppercase text-[9px] block">Or Enter Custom Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono font-bold">$</span>
                      <input
                        name="customAmount"
                        type="number"
                        min="1"
                        step="any"
                        placeholder="e.g. 25000"
                        className="w-full bg-slate-950 border border-slate-800 rounded pl-7 pr-3 py-2 text-slate-100 placeholder-slate-600 outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setAddFundsOpen(false)}
                      className="flex-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 py-2 rounded font-semibold transition-colors animate-fadeIn"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded font-semibold transition-colors shadow-lg shadow-emerald-900/20"
                    >
                      Confirm Injection
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer (Hidden in Fullscreen) */}
      {!fullscreen && (
        <footer className="border-t border-[#1e293b]/50 bg-[#0a0c10] py-4 px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
          <span>LiquidityWatch © 2026 • Developed by <strong className="text-slate-500 font-semibold">Tharun Sai</strong></span>
          <div className="flex space-x-4">
            <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">LinkedIn</a>
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors">Instagram</a>
          </div>
        </footer>
      )}

      {/* AI Research Assistant Widget */}
      <div className="fixed bottom-6 right-6 z-40 font-sans">
        {!chatOpen ? (
          <button
            onClick={() => setChatOpen(true)}
            className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg hover:shadow-blue-500/20 transition-all transform hover:scale-105"
            title="Open AI Research Assistant"
          >
            <Cpu className="w-6 h-6 animate-pulse" />
          </button>
        ) : (
          <div className="w-80 sm:w-96 bg-[#0a0c10] border border-[#1e293b] rounded-xl shadow-2xl flex flex-col overflow-hidden font-mono text-xs max-h-[500px]">
            {/* Header */}
            <div className="bg-[#121620] border-b border-[#1e293b] px-4 py-3 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-slate-200">AI Research Assistant</span>
              </div>
              <button 
                onClick={() => setChatOpen(false)}
                className="text-slate-500 hover:text-slate-350 font-bold"
              >
                ✕
              </button>
            </div>
            
            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[250px] max-h-[350px]">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-lg p-2.5 leading-relaxed ${
                    msg.sender === 'user' 
                      ? 'bg-blue-600/20 border border-blue-500/30 text-blue-200' 
                      : 'bg-slate-900 border border-slate-800 text-slate-300'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-500 animate-pulse">
                    Thinking...
                  </div>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                if (!chatMessage.trim() || chatLoading) return;
                const userText = chatMessage.trim();
                setChatMessage("");
                setChatHistory(prev => [...prev, { sender: 'user', text: userText }]);
                setChatLoading(true);
                try {
                  const res = await fetch("http://localhost:9005/api/chat", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      message: userText,
                      portfolioData: {
                        cash: paperCash,
                        positions: paperPositions
                      }
                    })
                  });
                  if (!res.ok) throw new Error(`HTTP ${res.status}`);
                  const data = await res.json();
                  setChatHistory(prev => [...prev, { sender: 'assistant', text: data.response || "No response." }]);
                } catch (err) {
                  setChatHistory(prev => [...prev, { sender: 'assistant', text: `Error connecting to AI backend: ${err.message}` }]);
                } finally {
                  setChatLoading(false);
                }
              }}
              className="border-t border-[#1e293b] p-2 bg-[#090b0e] flex space-x-2"
            >
              <input
                type="text"
                placeholder="Ask e.g. Why is NVDA volatile?"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 placeholder-slate-600 outline-none focus:border-blue-500"
              />
              <button 
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Command Palette (⌘K) Modal */}
      {commandPaletteOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24 px-4 font-mono text-xs">
          <div className="bg-[#0c0e14] border border-[#1e293b] rounded-xl max-w-lg w-full overflow-hidden shadow-2xl">
            {/* Search Input */}
            <div className="p-4 border-b border-[#1e293b] flex items-center space-x-3 bg-[#0a0c10]">
              <Search className="w-4 h-4 text-slate-500" />
              <input
                type="text"
                autoFocus
                placeholder="Search symbol, switch tab, toggle theme..."
                value={commandPaletteSearch}
                onChange={(e) => setCommandPaletteSearch(e.target.value)}
                className="bg-transparent text-xs text-slate-200 outline-none w-full placeholder-slate-600 uppercase"
              />
              <button 
                onClick={() => { setCommandPaletteOpen(false); setCommandPaletteSearch(""); }}
                className="text-[10px] text-slate-500 hover:text-slate-400 font-bold"
              >
                ESC
              </button>
            </div>

            {/* List of actions */}
            <div className="p-2 max-h-[250px] overflow-y-auto divide-y divide-slate-900">
              {[
                { label: "Switch to Dashboard Tab", action: () => { setActiveTab("analytics"); setCommandPaletteOpen(false); } },
                { label: "Switch to Market Scanner Tab", action: () => { setActiveTab("scanner"); setCommandPaletteOpen(false); } },
                { label: "Switch to Replay Studio Tab", action: () => { setActiveTab("replay"); setCommandPaletteOpen(false); } },
                { label: "Switch to Portfolio Tab", action: () => { setActiveTab("portfolio"); setCommandPaletteOpen(false); } },
                { label: "Toggle Theme (Light/Dark)", action: () => { setTheme(t => t === 'dark' ? 'light' : 'dark'); setCommandPaletteOpen(false); } },
                { label: "Toggle Sound Alerts", action: () => { setSoundEnabled(!soundEnabled); setCommandPaletteOpen(false); } },
                { label: "Toggle Fullscreen Trading Mode", action: () => { setFullscreen(!fullscreen); setCommandPaletteOpen(false); } },
                { label: "Switch to Workspace 1", action: () => { setActiveWorkspace(1); setCommandPaletteOpen(false); } },
                { label: "Switch to Workspace 2", action: () => { setActiveWorkspace(2); setCommandPaletteOpen(false); } },
                { label: "Switch to Workspace 3", action: () => { setActiveWorkspace(3); setCommandPaletteOpen(false); } },
                { label: "Export Active Metrics as CSV", action: () => { exportToCSV(); setCommandPaletteOpen(false); } },
                { label: "Export Alerts Log as JSON", action: () => { exportAlertsJSON(); setCommandPaletteOpen(false); } },
                { label: "Export Alerts Log as CSV", action: () => { exportAlertsCSV(); setCommandPaletteOpen(false); } },
                { label: "Start Onboarding Tour", action: () => { setTourStep(0); setCommandPaletteOpen(false); } },
                { label: `Switch to ${beginnerMode ? 'Professional' : 'Beginner'} Mode`, action: () => { setBeginnerMode(!beginnerMode); setCommandPaletteOpen(false); } }
              ]
              .concat(stocks.concat(cryptos).map(sym => ({
                label: `Inspect Asset Ticker: ${sym}`,
                action: () => { setSelectedSymbol(sym); setActiveTab("analytics"); setCommandPaletteOpen(false); }
              })))
              .filter(item => item.label.toLowerCase().includes(commandPaletteSearch.toLowerCase()))
              .map((item, idx) => (
                <button
                  key={idx}
                  onClick={item.action}
                  className="w-full text-left px-3 py-2 rounded hover:bg-[#181d2a] text-slate-300 font-medium transition-colors flex justify-between items-center"
                >
                  <span>{item.label}</span>
                  <span className="text-[10px] text-slate-600 font-bold">↵</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Tour Step Overlay */}
      {tourStep !== null && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0c0e14] border border-[#1e293b] rounded-xl max-w-sm w-full p-6 shadow-2xl animate-scaleUp">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Step {tourStep + 1} of 4</span>
              <button 
                onClick={() => setTourStep(null)}
                className="text-slate-500 hover:text-slate-400 font-bold"
              >
                ✕
              </button>
            </div>
            <h4 className="text-sm font-bold text-slate-200 mb-2 font-sans">{TOUR_STEPS[tourStep].title}</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-sans mb-5">{TOUR_STEPS[tourStep].text}</p>
            <div className="flex justify-between items-center">
              <button 
                onClick={() => setTourStep(null)}
                className="text-[11px] text-slate-500 hover:text-slate-400 font-bold font-mono"
              >
                Skip Tour
              </button>
              <div className="flex space-x-2">
                {tourStep > 0 && (
                  <button 
                    onClick={() => setTourStep(s => s - 1)}
                    className="bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1.5 rounded font-bold text-[11px]"
                  >
                    Back
                  </button>
                )}
                <button 
                  onClick={() => {
                    if (tourStep < 3) {
                      setTourStep(s => s + 1);
                    } else {
                      setTourStep(null);
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded font-bold text-[11px] shadow-lg shadow-blue-500/10"
                >
                  {tourStep < 3 ? "Next" : "Finish"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const TOUR_STEPS = [
  {
    title: "Welcome to LiquidityWatch!",
    text: "This dashboard calculates and visualizes market liquidity, spreads, volatility levels, and overall risks in real-time. Let's take a quick 4-step tour.",
    element: null
  },
  {
    title: "Watchlist Manager",
    text: "Add and remove symbols for real-time monitoring. Switch between Stocks and Crypto, and star assets to pin them to the top.",
    element: "#watchlist-manager-section"
  },
  {
    title: "Asset Deep Inspection",
    text: "Select any ticker to load the Asset Deep Inspection panel, displaying calculated bid-ask spreads, real-time risk gauges, and custom personal notes.",
    element: "#asset-deep-inspection-section"
  },
  {
    title: "Command Palette (Ctrl + K)",
    text: "Press Ctrl + K anytime to open the Command Palette. Instantly jump to assets, switch tabs, customize dashboard panels, or toggle themes.",
    element: null
  }
];
