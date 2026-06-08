import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import readline from 'readline';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import { addMetric } from './src/analytics/metricsBuffer.js';
import { initAnalytics, getShocks, getRegime, getTimeline, getHealth } from './src/analytics/intelligenceService.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// After defining caches, start analytics (runs every 500 ms)
// initAnalytics(metricsCache); // moved below after metricsCache definition


// Bypass SSL verification in dev sandbox
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Load config
dotenv.config();

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION]', reason);
});

const POLYGON_API_KEY = process.env.POLYGON_API_KEY;
const ALPACA_KEY_ID = process.env.ALPACA_KEY_ID;
const ALPACA_SECRET_KEY = process.env.ALPACA_SECRET_KEY;
const PORT = 9005;

// Find executable binary location
const isWindows = os.platform() === 'win32';
const analyzerBinary = isWindows ? 'LiquidityWatchAnalyzer.exe' : 'LiquidityWatchAnalyzer';

const possiblePaths = [
  path.resolve('../cpp-analyzer/build', analyzerBinary),
  path.resolve('../cpp-analyzer/build/Release', analyzerBinary),
  path.resolve('../cpp-analyzer/build/Debug', analyzerBinary),
  path.resolve('./cpp-analyzer/build', analyzerBinary),
];

let analyzerPath = '';
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    analyzerPath = p;
    break;
  }
}

if (!analyzerPath) {
  console.error('[Backend ERROR] C++ analyzer executable was not found!');
  process.exit(1);
}

console.log(`[Backend] Spawning C++ analyzer at: ${analyzerPath}`);

// Spawn the child C++ process
const analyzer = spawn(analyzerPath, [], {
  stdio: ['pipe', 'pipe', 'inherit']
});

analyzer.on('close', (code) => {
  console.log(`[Backend] C++ analyzer process exited with code ${code}`);
  process.exit(code);
});

// Spawn the LiquiditySim engine child process
const simBinary = isWindows ? 'LiquiditySim.exe' : 'LiquiditySim';
const possibleSimPaths = [
  path.resolve(__dirname, '..', 'simulator-engine', 'build', simBinary),
  path.resolve(__dirname, '..', 'simulator-engine', 'build', 'build', simBinary),
  path.resolve(__dirname, '..', 'simulator-engine', 'build', 'Release', simBinary),
  path.resolve(__dirname, '..', 'simulator-engine', 'build', 'Debug', simBinary),
];

let simExePath = '';
for (const p of possibleSimPaths) {
  if (fs.existsSync(p)) {
    simExePath = p;
    break;
  }
}

let simulator = null;
let simulatorWss = null;

if (simExePath) {
  console.log(`[Backend] Spawning C++ Simulator at: ${simExePath}`);
  simulator = spawn(simExePath, ['dashboard'], {
    stdio: ['ignore', 'pipe', 'inherit'] // pipe stdout, inherit stderr
  });

  // Start a fallback WebSocket server on port 9001
  try {
    simulatorWss = new WebSocketServer({ port: 9001 });
    console.log('[Backend] Simulator WebSocket Server listening on port 9001');

    simulatorWss.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log('[Backend] Port 9001 already in use (likely C++ TelemetryServer). Node.js fallback WebSocket server will not intercept.');
      } else {
        console.error('[Backend ERROR] Simulator WebSocket Server error:', err);
      }
    });
  } catch (err) {
    console.error('[Backend ERROR] Failed to start Simulator WebSocket Server on port 9001:', err.message);
  }

  // Setup readline interface for simulator stdout
  const simRl = readline.createInterface({
    input: simulator.stdout,
    terminal: false
  });

  simRl.on('line', (line) => {
    try {
      if (!line.trim()) return;
      if (simulatorWss) {
        simulatorWss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(line);
          }
        });
      }
    } catch (e) {
      console.error(`[Backend] Failed to handle simulator output line: ${line}`, e);
    }
  });

  simulator.on('close', (code) => {
    console.log(`[Backend] C++ Simulator process exited with code ${code}`);
    if (simulatorWss) {
      simulatorWss.close();
    }
  });
} else {
  console.warn(`[Backend WARNING] C++ Simulator executable not found in any of the expected paths. It will not run.`);
}

// Setup readline interface for C++ stdout
const rl = readline.createInterface({
  input: analyzer.stdout,
  terminal: false
});

// Dynamic Watchlists state (initialized to default watchlists)
let activeStocks = ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMD', 'SPY', 'QQQ'];
let activeCryptos = ['X:BTCUSD', 'X:ETHUSD'];

// State Cache to hold the latest metrics for all monitored assets
const metricsCache = {};
const metricsHistory = {};
// Store original dailyChangePercent separately as C++ doesn't pass it through
const dailyChangeCache = {};
// Initialize analytics after caches are defined
initAnalytics(metricsHistory);
const statusCache = {
  mode: 'LIVE',
  polygonStatus: 'Initializing',
  message: 'Initializing system...',
  apiStatus: {
    lastFetchTime: null,
    lastError: null,
    rateLimitWarning: false
  }
};

// Replay State variables
const replayState = {
  active: false,
  playing: false,
  symbol: null,
  date: null,
  candles: [],
  currentIndex: 0,
  speed: 1,
  timerId: null
};

// Replay metrics cache (so replay does not overwrite metricsCache)
const replayMetricsCache = {};

// HTTP Server and Router for Gemini AI assistant
const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Phase 1 Intelligence Endpoints
  if (req.method === 'GET' && req.url.startsWith('/api/intelligence')) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;
    if (path === '/api/intelligence/shocks') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ shocks: getShocks() }));
      return;
    }
    if (path === '/api/intelligence/regime') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ regime: getRegime() }));
      return;
    }
    if (path === '/api/intelligence/timeline') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ timeline: getTimeline() }));
      return;
    }
    if (path === '/api/intelligence/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ health: getHealth() }));
      return;
    }
    // Unknown sub‑path
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unknown intelligence endpoint' }));
    return;
  }

  if (req.method === 'POST' && req.url === '/api/chat') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body);
        const userMessage = parsed.message;
        const portfolioData = parsed.portfolioData || null;
        const responseText = await queryAI(userMessage, portfolioData);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ response: responseText }));
      } catch (e) {
        console.error('[Chat API Error]', e.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/intelligence/briefing') {
    const userMessage = "Generate a comprehensive Morning Market Briefing. Identify the top macro trends, the strongest and weakest assets from the watchlists, and any notable volatility or liquidity conditions. Keep it professional and concise.";
    try {
      const responseText = await queryAI(userMessage, null);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ response: responseText }));
    } catch (e) {
      console.error('[Briefing API Error]', e.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/api/intelligence/explain-alert') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body);
        const { logText, asset } = parsed;
        const userMessage = `Explain this market alert regarding ${asset}: "${logText}". Why did this happen based on the metrics, and what does it mean for market liquidity/volatility?`;
        const responseText = await queryAI(userMessage, null);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ response: responseText }));
      } catch (e) {
        console.error('[Alert Explain API Error]', e.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // Persistent Trades endpoints
  if (req.method === 'GET' && req.url === '/api/trades') {
    const filePath = path.resolve(__dirname, 'trades.json');
    let trades = [];
    if (fs.existsSync(filePath)) {
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        trades = JSON.parse(fileContent);
      } catch (e) {
        console.error('Failed to parse trades file', e);
      }
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ trades }));
    return;
  }

  if (req.method === 'POST' && req.url === '/api/trades') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const newTrade = JSON.parse(body);
        const filePath = path.resolve(__dirname, 'trades.json');
        let trades = [];
        if (fs.existsSync(filePath)) {
          try {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            trades = JSON.parse(fileContent);
          } catch (e) {
            console.error('Failed to parse trades file', e);
          }
        }
        trades.push(newTrade);
        fs.writeFileSync(filePath, JSON.stringify(trades, null, 2), 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, trade: newTrade }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (req.method === 'DELETE' && req.url === '/api/trades') {
    const filePath = path.resolve(__dirname, 'trades.json');
    fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf8');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  res.writeHead(404);
  res.end();
});

// Setup WebSocket Server bound to the HTTP Server
const wss = new WebSocketServer({ server });
server.listen(PORT, () => {
  console.log(`[Backend] HTTP and WebSocket Server listening on port ${PORT}`);
});

// Broadcast payload to all connected clients
function broadcast(payload) {
  const dataString = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(dataString);
    }
  });
}

// Read stats output from C++ and broadcast to dashboard
rl.on('line', (line) => {
  try {
    if (!line.trim()) return;
    const data = JSON.parse(line);
    if (data.symbol) {
      console.log(`[Backend] Received data from C++ for: ${data.symbol}`);
      // Store raw metric in buffer for analytics
      addMetric(metricsHistory, data);

      if (replayState.active && data.symbol === replayState.symbol) {
        replayMetricsCache[data.symbol] = data;
        broadcast({ ev: 'replayMetrics', data });
      } else {
        const oldData = metricsCache[data.symbol];
        // Optimize: Only broadcast if price, volume or stdev changes significantly
        const hasChanged = !oldData || 
          oldData.lastPrice !== data.lastPrice || 
          oldData.volume !== data.volume || 
          oldData.stdev !== data.stdev;
        
        metricsCache[data.symbol] = {
          ...data,
          dailyChangePercent: dailyChangeCache[data.symbol] ?? data.dailyChangePercent ?? null
        };
        
        if (hasChanged) {
          broadcast({ ev: 'metrics', data: metricsCache[data.symbol] });
        }
      }
    }
  } catch (e) {
    console.error(`[Backend] Failed to parse JSON from C++ process: ${line}`, e);
  }
});

// AI chat helper supporting both OpenAI and Gemini APIs
async function queryAI(userMessage, portfolioData) {
  const openAiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  
  if (!openAiKey && !geminiKey) {
    throw new Error('Neither OPENAI_API_KEY nor GEMINI_API_KEY is configured in .env');
  }

  const systemInstruction = `You are the LiquidityWatch AI Research Analyst.
  Your purpose is to assist users analyzing market liquidity, spread, volatility, and risk metrics.
  
  CRITICAL RULES:
  1. You must NEVER say "buy", "sell", or "hold". 
  2. You must NEVER guarantee outcomes or provide financial advice.
  3. Every response MUST end with exactly this sentence: "This analysis is informational and not financial advice."
  4. Every response MUST include a section titled "Metrics Used" listing the specific metrics you evaluated.
  
  CONTEXT:
  Active Watchlists: Stocks: ${activeStocks.join(', ')} | Cryptos: ${activeCryptos.join(', ')}
  
  Current Market Metrics:
  ${JSON.stringify(metricsCache, null, 2)}
  
  User's Simulated Portfolio Data:
  ${portfolioData ? JSON.stringify(portfolioData, null, 2) : 'No portfolio data provided.'}
  
  Provide professional, metric-grounded insights explaining the state of the portfolio or market based on the data. Identify strongest/weakest assets based on health and volatility.`;

  if (openAiKey) {
    // OpenAI routing
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userMessage }
        ]
      })
    });
    if (!response.ok) throw new Error(`OpenAI API Error: ${await response.text()}`);
    const data = await response.json();
    return data.choices[0].message.content;
  } else {
    // Gemini fallback routing
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] }
      })
    });
    if (!response.ok) throw new Error(`Gemini API Error: ${await response.text()}`);
    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
  }
}

// Normalization function for Unix timestamps
function normalizeTimestamp(t) {
  if (!t) return Date.now();
  if (t > 9999999999999) { // Nanoseconds
    return Math.floor(t / 1000000);
  }
  return t;
}

// Both Polygon and Alpaca keys are invalid/expired — use free public API fallback
const hasValidPolygonKey = false;
const hasValidAlpacaKeys = false;

// Active Provider State: 'POLYGON' | 'ALPACA' | 'PUBLIC' | 'SIMULATION'
// Defaulting to PUBLIC (Yahoo Finance + Coinbase) — no API key required
let activeProvider = 'PUBLIC';

updateStatusCache();

function updateStatusCache() {
  if (activeProvider === 'POLYGON') {
    statusCache.polygonStatus = 'Connected';
    statusCache.message = 'Active: Polling Polygon.io REST API';
  } else if (activeProvider === 'ALPACA') {
    statusCache.polygonStatus = 'Connected';
    statusCache.message = 'Active: Polling Alpaca REST Data API';
  } else if (activeProvider === 'PUBLIC') {
    statusCache.polygonStatus = 'Connected';
    statusCache.message = 'Active: Polling Public APIs (Yahoo Finance/Coinbase Exchange)';
  } else {
    statusCache.polygonStatus = 'Simulated';
    statusCache.message = 'Simulation Fallback Active (No Markets Connected)';
  }
}

// REST Polling scheduler
let pollStocksTurn = true; // Alternate between stocks and cryptos

async function executePollCycle() {
  if (replayState.active) {
    return;
  }
  if (activeProvider === 'SIMULATION') {
    runSimulationTurn();
    pollStocksTurn = !pollStocksTurn;
    return;
  }

  try {
    const promises = [];
    if (pollStocksTurn) {
      if (activeStocks.length > 0) {
        if (hasValidPolygonKey) promises.push(pollStocksSnapshotPolygon());
        if (hasValidAlpacaKeys) promises.push(pollStocksSnapshotAlpaca());
        if (!hasValidPolygonKey && !hasValidAlpacaKeys) promises.push(pollStocksSnapshotPublic());
      }
    } else {
      if (activeCryptos.length > 0) {
        if (hasValidPolygonKey) promises.push(pollCryptoSnapshotPolygon());
        if (hasValidAlpacaKeys) promises.push(pollCryptoSnapshotAlpaca());
        if (!hasValidPolygonKey && !hasValidAlpacaKeys) promises.push(pollCryptoSnapshotPublic());
      }
    }
    await Promise.allSettled(promises);
    
    // Update status to reflect combined usage
    statusCache.polygonStatus = 'Connected';
    statusCache.message = `Active: Polling ${hasValidPolygonKey && hasValidAlpacaKeys ? 'Polygon & Alpaca' : activeProvider}`;
    broadcast({ ev: 'status', data: statusCache });

  } catch (error) {
    console.error(`[Backend ERROR] Polling failed:`, error.message);
    statusCache.apiStatus.lastError = `Polling error: ${error.message}`;
    broadcast({ 
      ev: 'alert', 
      type: 'apiError', 
      message: `Polling Error: ${error.message}` 
    });
  }

  pollStocksTurn = !pollStocksTurn;
}

// -------------------------------------------------------------
// FETCH WITH RETRY HELPER
// -------------------------------------------------------------
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let attempt = 0;
  let delayMs = 1000;
  while (attempt < maxRetries) {
    try {
      const res = await fetch(url, options);
      if (res.status === 429) throw new Error('Rate Limit (429) Hit');
      if (res.status >= 500) throw new Error(`Server Error (${res.status})`);
      return res;
    } catch (e) {
      attempt++;
      if (attempt >= maxRetries) throw e;
      console.warn(`[Backend] Fetch failed (${e.message}), retrying in ${delayMs}ms... (${attempt}/${maxRetries})`);
      await new Promise(r => setTimeout(r, delayMs));
      delayMs *= 2; // Exponential backoff
    }
  }
}

// -------------------------------------------------------------
// POLYGON.IO API CALLS
// -------------------------------------------------------------
async function pollStocksSnapshotPolygon() {
  const url = `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers?tickers=${activeStocks.join(',')}&apiKey=${POLYGON_API_KEY}`;
  console.log(`[Polygon API] Fetching stocks snapshot...`);
  
  const response = await fetchWithRetry(url);
  if (response.status === 429) {
    statusCache.apiStatus.rateLimitWarning = true;
    statusCache.apiStatus.lastError = 'Rate Limit (429) Hit';
    broadcast({ ev: 'status', data: statusCache });
    return;
  }
  if (response.status === 401 || response.status === 403) {
    throw new Error(`Auth failed (HTTP ${response.status})`);
  }
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  if (data.status === 'OK' && data.tickers) {
    statusCache.apiStatus.lastFetchTime = new Date().toLocaleTimeString();
    statusCache.apiStatus.rateLimitWarning = false;
    statusCache.apiStatus.lastError = null;
    broadcast({ ev: 'status', data: statusCache });

    for (const item of data.tickers) {
      const payload = mapStockTickerPolygon(item);
      pipeToAnalyzer(payload);
    }
  }
}

async function pollCryptoSnapshotPolygon() {
  const url = `https://api.polygon.io/v2/snapshot/locale/global/markets/crypto/tickers?tickers=${activeCryptos.join(',')}&apiKey=${POLYGON_API_KEY}`;
  console.log(`[Polygon API] Fetching crypto snapshot...`);

  const response = await fetchWithRetry(url);
  if (response.status === 429) {
    statusCache.apiStatus.rateLimitWarning = true;
    statusCache.apiStatus.lastError = 'Rate Limit (429) Hit';
    broadcast({ ev: 'status', data: statusCache });
    return;
  }
  if (response.status === 401 || response.status === 403) {
    throw new Error(`Auth failed (HTTP ${response.status})`);
  }
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  if (data.status === 'OK' && data.tickers) {
    statusCache.apiStatus.lastFetchTime = new Date().toLocaleTimeString();
    statusCache.apiStatus.rateLimitWarning = false;
    statusCache.apiStatus.lastError = null;
    broadcast({ ev: 'status', data: statusCache });

    for (const item of data.tickers) {
      const payload = mapCryptoTickerPolygon(item);
      pipeToAnalyzer(payload);
    }
  }
}

// -------------------------------------------------------------
// ALPACA API CALLS
// -------------------------------------------------------------
async function pollStocksSnapshotAlpaca() {
  const url = `https://data.alpaca.markets/v2/stocks/snapshots?symbols=${activeStocks.join(',')}`;
  console.log(`[Alpaca API] Fetching real stocks snapshot...`);

  const response = await fetchWithRetry(url, {
    headers: {
      'APCA-API-KEY-ID': ALPACA_KEY_ID,
      'APCA-API-SECRET-KEY': ALPACA_SECRET_KEY
    }
  });

  if (response.status === 429) {
    statusCache.apiStatus.rateLimitWarning = true;
    statusCache.apiStatus.lastError = 'Rate Limit (429) Hit';
    broadcast({ ev: 'status', data: statusCache });
    return;
  }
  if (response.status === 401 || response.status === 403) {
    throw new Error(`Auth failed (HTTP ${response.status})`);
  }
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  if (data && data.snapshots) {
    statusCache.apiStatus.lastFetchTime = new Date().toLocaleTimeString();
    statusCache.apiStatus.rateLimitWarning = false;
    statusCache.apiStatus.lastError = null;
    broadcast({ ev: 'status', data: statusCache });

    for (const [sym, snap] of Object.entries(data.snapshots)) {
      const payload = mapStockTickerAlpaca(sym, snap);
      pipeToAnalyzer(payload);
    }
  }
}

async function pollCryptoSnapshotAlpaca() {
  const alpacaSymbols = activeCryptos.map(s => s.replace('X:', '').replace('USD', '/USD'));
  const url = `https://data.alpaca.markets/v1beta3/crypto/us/snapshots?symbols=${alpacaSymbols.join(',')}`;
  console.log(`[Alpaca API] Fetching real crypto snapshot...`);

  const response = await fetchWithRetry(url, {
    headers: {
      'APCA-API-KEY-ID': ALPACA_KEY_ID,
      'APCA-API-SECRET-KEY': ALPACA_SECRET_KEY
    }
  });

  if (response.status === 429) {
    statusCache.apiStatus.rateLimitWarning = true;
    statusCache.apiStatus.lastError = 'Rate Limit (429) Hit';
    broadcast({ ev: 'status', data: statusCache });
    return;
  }
  if (response.status === 401 || response.status === 403) {
    throw new Error(`Auth failed (HTTP ${response.status})`);
  }
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  if (data && data.snapshots) {
    statusCache.apiStatus.lastFetchTime = new Date().toLocaleTimeString();
    statusCache.apiStatus.rateLimitWarning = false;
    statusCache.apiStatus.lastError = null;
    broadcast({ ev: 'status', data: statusCache });

    for (const [alpacaSym, snap] of Object.entries(data.snapshots)) {
      const sym = 'X:' + alpacaSym.replace('/', '');
      const payload = mapCryptoTickerAlpaca(sym, snap);
      pipeToAnalyzer(payload);
    }
  }
}

// -------------------------------------------------------------
// PUBLIC APIS CALLS (UNAUTHENTICATED LIVE TELEMETRY)
// -------------------------------------------------------------
async function pollStocksSnapshotPublic() {
  console.log(`[Public API] Querying Yahoo Finance for stocks: ${activeStocks.join(', ')}`);
  
  const promises = activeStocks.map(async (sym) => {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1m&range=1d`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      const meta = body?.chart?.result?.[0]?.meta;
      if (!meta) throw new Error('Empty result metadata');

      const lastPrice = meta.regularMarketPrice !== undefined ? meta.regularMarketPrice : null;
      const volume = meta.regularMarketVolume !== undefined ? meta.regularMarketVolume : 0;
      const dailyChangePercent = meta.regularMarketChangePercent !== undefined ? meta.regularMarketChangePercent : null;
      const previousClose = meta.previousClose || meta.regularMarketPreviousClose || null;

      return {
        symbol: sym,
        assetType: 'stock',
        lastPrice,
        volume,
        dailyChangePercent,
        previousClose,
        bidPrice: null,
        bidSize: null,
        askPrice: null,
        askSize: null,
        timestamp: Date.now()
      };
    } catch (e) {
      console.warn(`[Public API Stocks] Failed to fetch ${sym}:`, e.message);
      return null;
    }
  });

  const results = await Promise.all(promises);
  let succCount = 0;
  for (const payload of results) {
    if (payload) {
      succCount++;
      pipeToAnalyzer(payload);
    }
  }

  if (succCount > 0) {
    statusCache.apiStatus.lastFetchTime = new Date().toLocaleTimeString();
    statusCache.apiStatus.rateLimitWarning = false;
    statusCache.apiStatus.lastError = null;
    broadcast({ ev: 'status', data: statusCache });
  } else {
    throw new Error('All Yahoo stock queries failed');
  }
}

async function pollCryptoSnapshotPublic() {
  console.log(`[Public API] Querying Coinbase Exchange for cryptos: ${activeCryptos.join(', ')}`);

  const promises = activeCryptos.map(async (sym) => {
    try {
      // Map format X:BTCUSD to Coinbase product BTC-USD
      const cbSym = sym.replace('X:', '').replace('USD', '-USD');
      const url = `https://api.exchange.coinbase.com/products/${cbSym}/ticker`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const lastPrice = data.price ? parseFloat(data.price) : null;
      const volume = data.volume ? parseFloat(data.volume) : 0;
      const bidPrice = data.bid ? parseFloat(data.bid) : null;
      const askPrice = data.ask ? parseFloat(data.ask) : null;
      const bidSize = data.size ? parseFloat(data.size) * 0.5 : null;
      const askSize = data.size ? parseFloat(data.size) * 0.5 : null;

      return {
        symbol: sym,
        assetType: 'crypto',
        lastPrice,
        volume,
        bidPrice,
        bidSize,
        askPrice,
        askSize,
        timestamp: Date.now()
      };
    } catch (e) {
      console.warn(`[Public API Crypto] Failed to fetch ${sym}:`, e.message);
      return null;
    }
  });

  const results = await Promise.all(promises);
  let succCount = 0;
  for (const payload of results) {
    if (payload) {
      succCount++;
      pipeToAnalyzer(payload);
    }
  }

  if (succCount > 0) {
    statusCache.apiStatus.lastFetchTime = new Date().toLocaleTimeString();
    statusCache.apiStatus.rateLimitWarning = false;
    statusCache.apiStatus.lastError = null;
    broadcast({ ev: 'status', data: statusCache });
  } else {
    throw new Error('All Coinbase crypto queries failed');
  }
}

// -------------------------------------------------------------
// MAPPER UTILITIES
// -------------------------------------------------------------
function mapStockTickerPolygon(item) {
  const symbol = item.ticker;
  const lastTrade = item.lastTrade || {};
  const lastQuote = item.lastQuote || {};
  const min = item.min || {};

  const lastPrice = lastTrade.p !== undefined ? lastTrade.p : (min.c !== undefined ? min.c : null);
  const volume = min.v !== undefined ? min.v : (lastTrade.s !== undefined ? lastTrade.s : 0);

  const bidPrice = lastQuote.p !== undefined && lastQuote.p !== 0 ? lastQuote.p : null;
  const bidSize = lastQuote.s !== undefined && lastQuote.s !== 0 ? lastQuote.s : null;
  const askPrice = lastQuote.P !== undefined && lastQuote.P !== 0 ? lastQuote.P : null;
  const askSize = lastQuote.S !== undefined && lastQuote.S !== 0 ? lastQuote.S : null;

  const timestamp = normalizeTimestamp(lastTrade.t || lastQuote.t || Date.now());

  return { symbol, assetType: 'stock', lastPrice, volume, bidPrice, bidSize, askPrice, askSize, timestamp };
}

function mapCryptoTickerPolygon(item) {
  const symbol = item.ticker;
  const lastTrade = item.lastTrade || {};
  const lastQuote = item.lastQuote || {};
  const min = item.min || {};

  const lastPrice = lastTrade.p !== undefined ? lastTrade.p : (min.c !== undefined ? min.c : null);
  const volume = min.v !== undefined ? min.v : (lastTrade.s !== undefined ? lastTrade.s : 0);

  const bidPrice = lastQuote.p !== undefined && lastQuote.p !== 0 ? lastQuote.p : null;
  const bidSize = lastQuote.s !== undefined && lastQuote.s !== 0 ? lastQuote.s : null;
  const askPrice = lastQuote.P !== undefined && lastQuote.P !== 0 ? lastQuote.P : null;
  const askSize = lastQuote.S !== undefined && lastQuote.S !== 0 ? lastQuote.S : null;

  const timestamp = normalizeTimestamp(lastTrade.t || lastQuote.t || Date.now());

  return { symbol, assetType: 'crypto', lastPrice, volume, bidPrice, bidSize, askPrice, askSize, timestamp };
}

function mapStockTickerAlpaca(sym, snap) {
  const lastTrade = snap.latestTrade || {};
  const lastQuote = snap.latestQuote || {};
  const min = snap.minuteBar || {};

  const lastPrice = lastTrade.p !== undefined ? lastTrade.p : (min.c !== undefined ? min.c : null);
  const volume = min.v !== undefined ? min.v : (lastTrade.s !== undefined ? lastTrade.s : 0);

  const bidPrice = lastQuote.bp !== undefined && lastQuote.bp !== 0 ? lastQuote.bp : null;
  const bidSize = lastQuote.bs !== undefined && lastQuote.bs !== 0 ? lastQuote.bs : null;
  const askPrice = lastQuote.ap !== undefined && lastQuote.ap !== 0 ? lastQuote.ap : null;
  const askSize = lastQuote.as !== undefined && lastQuote.as !== 0 ? lastQuote.as : null;

  const timestamp = normalizeTimestamp(Date.parse(lastTrade.t || lastQuote.t || new Date().toISOString()));

  return { symbol: sym, assetType: 'stock', lastPrice, volume, bidPrice, bidSize, askPrice, askSize, timestamp };
}

function mapCryptoTickerAlpaca(sym, snap) {
  const lastTrade = snap.latestTrade || {};
  const lastQuote = snap.latestQuote || {};
  const min = snap.minuteBar || {};

  const lastPrice = lastTrade.p !== undefined ? lastTrade.p : (min.c !== undefined ? min.c : null);
  const volume = min.v !== undefined ? min.v : (lastTrade.s !== undefined ? lastTrade.s : 0);

  const bidPrice = lastQuote.bp !== undefined && lastQuote.bp !== 0 ? lastQuote.bp : null;
  const bidSize = lastQuote.bs !== undefined && lastQuote.bs !== 0 ? lastQuote.bs : null;
  const askPrice = lastQuote.ap !== undefined && lastQuote.ap !== 0 ? lastQuote.ap : null;
  const askSize = lastQuote.as !== undefined && lastQuote.as !== 0 ? lastQuote.as : null;

  const timestamp = normalizeTimestamp(Date.parse(lastTrade.t || lastQuote.t || new Date().toISOString()));

  return { symbol: sym, assetType: 'crypto', lastPrice, volume, bidPrice, bidSize, askPrice, askSize, timestamp };
}

// Pipe normalized event to C++ stdin
function pipeToAnalyzer(payload) {
  // Cache daily change before stripping (C++ doesn't know this field)
  if (payload.dailyChangePercent != null) {
    dailyChangeCache[payload.symbol] = payload.dailyChangePercent;
  }
  if (analyzer.stdin.writable) {
    console.log(`[Backend] Piping to C++ for symbol: ${payload.symbol}`);
    analyzer.stdin.write(JSON.stringify(payload) + '\n');
  }
}

// -------------------------------------------------------------
// HIGH-FIDELITY SIMULATION FALLBACK
// -------------------------------------------------------------
const simPrices = {};
const simBaseVolumes = {};

function initSimData(sym, type) {
  if (!simPrices[sym]) {
    if (type === 'crypto') {
      simPrices[sym] = sym.includes('BTC') ? 67500.00 : (sym.includes('ETH') ? 3500.00 : 150.00);
      simBaseVolumes[sym] = sym.includes('BTC') ? 1.85 : (sym.includes('ETH') ? 12.4 : 50.0);
    } else {
      simPrices[sym] = sym === 'SPY' ? 520.00 : (sym === 'QQQ' ? 440.00 : 180.00);
      simBaseVolumes[sym] = sym === 'SPY' ? 95000 : (sym === 'QQQ' ? 75000 : 25000);
    }
  }
}

function runSimulationTurn() {
  const currentBatch = pollStocksTurn ? activeStocks : activeCryptos;
  const type = pollStocksTurn ? 'stock' : 'crypto';

  statusCache.message = `Simulated Turn: Updating ${type === 'stock' ? 'Stocks' : 'Crypto'}`;
  statusCache.apiStatus.lastFetchTime = new Date().toLocaleTimeString();
  statusCache.apiStatus.rateLimitWarning = false;
  statusCache.apiStatus.lastError = null;
  broadcast({ ev: 'status', data: statusCache });

  if (currentBatch.length === 0) return;

  for (const sym of currentBatch) {
    initSimData(sym, type);

    const changePct = (Math.random() - 0.5) * 0.003;
    simPrices[sym] *= (1 + changePct);
    const lastPrice = simPrices[sym];

    const volumeMultiplier = Math.random() < 0.1 ? (3.5 + Math.random() * 2) : (0.8 + Math.random() * 0.4);
    const volume = simBaseVolumes[sym] * volumeMultiplier;

    const quoteMissing = type === 'stock' && Math.random() < 0.3;
    let bidPrice = null, askPrice = null, bidSize = null, askSize = null;

    if (!quoteMissing) {
      const spread = lastPrice * (0.0001 + Math.random() * 0.0008);
      bidPrice = lastPrice - spread * 0.5;
      askPrice = lastPrice + spread * 0.5;
      
      if (type === 'stock') {
        bidSize = Math.floor(5 + Math.random() * 50) * 100;
        askSize = Math.floor(5 + Math.random() * 50) * 100;
      } else {
        bidSize = Number((0.1 + Math.random() * 1.5).toFixed(3));
        askSize = Number((0.1 + Math.random() * 1.5).toFixed(3));
      }
    }

    const payload = { symbol: sym, assetType: type, lastPrice, volume, bidPrice, bidSize, askPrice, askSize, timestamp: Date.now() };
    pipeToAnalyzer(payload);
  }
}

// Replay Helper Functions
async function fetchHistoricalYahoo(symbol, startSec, endSec) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startSec}&period2=${endSec}&interval=1m`;
  console.log(`[Replay] Fetching Yahoo candles: ${url}`);
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`Yahoo Finance chart failed: ${res.status}`);
  const body = await res.json();
  const result = body?.chart?.result?.[0];
  const timestamps = result?.timestamp || [];
  const quote = result?.indicators?.quote?.[0] || {};
  const opens = quote.open || [];
  const closes = quote.close || [];
  const volumes = quote.volume || [];

  const candles = [];
  for (let i = 0; i < timestamps.length; i++) {
    const price = closes[i] || opens[i] || null;
    if (price === null) continue;
    
    // Generate synthetic spread/depth for analyzer
    const spread = price * (0.0001 + Math.random() * 0.0004);
    const volume = volumes[i] || 1000;
    candles.push({
      timestamp: timestamps[i] * 1000,
      close: price,
      volume,
      bidPrice: price - spread * 0.5,
      askPrice: price + spread * 0.5,
      bidSize: Math.floor((5 + Math.random() * 20) * 100),
      askSize: Math.floor((5 + Math.random() * 20) * 100)
    });
  }
  return candles;
}

async function fetchHistoricalCoinbase(cbSym, startOfDayMs, endOfDayMs) {
  const candles = [];
  const durationMs = 5 * 60 * 60 * 1000; // 5 hours chunk
  for (let chunkStart = startOfDayMs; chunkStart < endOfDayMs; chunkStart += durationMs) {
    const chunkEnd = Math.min(chunkStart + durationMs, endOfDayMs);
    const startIso = new Date(chunkStart).toISOString();
    const endIso = new Date(chunkEnd).toISOString();
    const url = `https://api.exchange.coinbase.com/products/${cbSym}/candles?granularity=60&start=${startIso}&end=${endIso}`;
    console.log(`[Replay] Fetching Coinbase chunk: ${url}`);
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) {
      console.warn(`[Replay] Coinbase chunk fetch failed: ${res.status}`);
      continue;
    }
    const data = await res.json();
    if (Array.isArray(data)) {
      data.forEach((bar) => {
        const [time, low, high, open, close, volume] = bar;
        const price = close || open;
        const spread = price * (0.0001 + Math.random() * 0.0004);
        candles.push({
          timestamp: time * 1000,
          close: price,
          volume: volume,
          bidPrice: price - spread * 0.5,
          askPrice: price + spread * 0.5,
          bidSize: Number((0.1 + Math.random() * 1.5).toFixed(3)),
          askSize: Number((0.1 + Math.random() * 1.5).toFixed(3))
        });
      });
    }
  }
  candles.sort((a, b) => a.timestamp - b.timestamp);
  return candles;
}

function startPlaybackTimer() {
  if (replayState.timerId) clearInterval(replayState.timerId);
  
  const interval = Math.max(10, Math.floor(1000 / replayState.speed));
  replayState.timerId = setInterval(() => {
    if (!replayState.active || !replayState.playing) {
      clearInterval(replayState.timerId);
      return;
    }
    
    if (replayState.currentIndex >= replayState.candles.length) {
      clearInterval(replayState.timerId);
      replayState.playing = false;
      broadcast({
        ev: 'replayProgress',
        symbol: replayState.symbol,
        currentIndex: replayState.currentIndex,
        total: replayState.candles.length,
        timestamp: replayState.candles[replayState.candles.length - 1]?.timestamp || Date.now(),
        speed: replayState.speed,
        state: 'COMPLETED'
      });
      return;
    }
    
    const candle = replayState.candles[replayState.currentIndex];
    const payload = {
      symbol: replayState.symbol,
      assetType: replayState.symbol.startsWith('X:') ? 'crypto' : 'stock',
      lastPrice: candle.close,
      volume: candle.volume,
      bidPrice: candle.bidPrice,
      bidSize: candle.bidSize,
      askPrice: candle.askPrice,
      askSize: candle.askSize,
      timestamp: candle.timestamp
    };
    
    pipeToAnalyzer(payload);
    
    broadcast({
      ev: 'replayProgress',
      symbol: replayState.symbol,
      currentIndex: replayState.currentIndex,
      total: replayState.candles.length,
      timestamp: candle.timestamp,
      speed: replayState.speed,
      state: 'PLAYING'
    });
    
    replayState.currentIndex++;
  }, interval);
}

function sendSingleReplayFrame() {
  if (replayState.currentIndex < replayState.candles.length) {
    const candle = replayState.candles[replayState.currentIndex];
    const payload = {
      symbol: replayState.symbol,
      assetType: replayState.symbol.startsWith('X:') ? 'crypto' : 'stock',
      lastPrice: candle.close,
      volume: candle.volume,
      bidPrice: candle.bidPrice,
      bidSize: candle.bidSize,
      askPrice: candle.askPrice,
      askSize: candle.askSize,
      timestamp: candle.timestamp
    };
    pipeToAnalyzer(payload);
    broadcast({
      ev: 'replayProgress',
      symbol: replayState.symbol,
      currentIndex: replayState.currentIndex,
      total: replayState.candles.length,
      timestamp: candle.timestamp,
      speed: replayState.speed,
      state: 'PAUSED'
    });
  }
}

async function startReplayInternal(symbol, date) {
  try {
    stopReplayInternal(); // Reset existing replay

    replayState.active = true;
    replayState.playing = true;
    replayState.symbol = symbol;
    replayState.date = date;
    replayState.currentIndex = 0;

    statusCache.mode = 'REPLAY';
    statusCache.polygonStatus = 'Loading';
    statusCache.message = `Loading historical candles for ${symbol} on ${date}...`;
    broadcast({ ev: 'status', data: statusCache });

    const startOfDay = new Date(date + 'T00:00:00Z').getTime();
    const endOfDay = new Date(date + 'T23:59:59Z').getTime();

    let candles = [];
    if (symbol.startsWith('X:')) {
      const cbSym = symbol.replace('X:', '').replace('USD', '-USD');
      candles = await fetchHistoricalCoinbase(cbSym, startOfDay, endOfDay);
    } else {
      const startSec = Math.floor(startOfDay / 1000);
      const endSec = Math.floor(endOfDay / 1000);
      candles = await fetchHistoricalYahoo(symbol, startSec, endSec);
    }

    if (!candles || candles.length === 0) {
      throw new Error(`No historical candles found for ${symbol} on ${date}. Note: Yahoo 1m chart data is kept for the last 30 days.`);
    }

    replayState.candles = candles;
    statusCache.polygonStatus = 'Connected';
    statusCache.message = `Replaying ${candles.length} candles for ${symbol}`;
    broadcast({ ev: 'status', data: statusCache });

    startPlaybackTimer();
  } catch (error) {
    console.error('[Replay ERROR]', error.message);
    stopReplayInternal();
    statusCache.apiStatus.lastError = `Replay error: ${error.message}`;
    broadcast({ ev: 'status', data: statusCache });
    broadcast({
      ev: 'alert',
      type: 'apiError',
      message: `Replay failed: ${error.message}`
    });
  }
}

function stopReplayInternal() {
  replayState.active = false;
  replayState.playing = false;
  if (replayState.timerId) {
    clearInterval(replayState.timerId);
    replayState.timerId = null;
  }
  replayState.candles = [];
  replayState.currentIndex = 0;
  replayState.symbol = null;
  replayState.date = null;

  statusCache.mode = 'LIVE';
  updateStatusCache();
  broadcast({ ev: 'status', data: statusCache });
}

// Websocket connection management
wss.on('connection', (ws) => {
  console.log('[Dashboard Server] Client connected');

  ws.send(JSON.stringify({ ev: 'status', data: statusCache }));

  Object.values(metricsCache).forEach((data) => {
    if (activeStocks.includes(data.symbol) || activeCryptos.includes(data.symbol)) {
      ws.send(JSON.stringify({ ev: 'metrics', data }));
    }
  });

  ws.on('message', async (message) => {
    try {
      const payload = JSON.parse(message);
      if (payload.action === 'updateWatchlist') {
        activeStocks = payload.stocks || [];
        activeCryptos = payload.cryptos || [];
        console.log(`[Dashboard Server] Updated active watchlists: Stocks=${activeStocks.join(',')}, Cryptos=${activeCryptos.join(',')}`);
        
        ws.send(JSON.stringify({ ev: 'status', data: statusCache }));
      } else if (payload.action === 'startReplay') {
        const { symbol, date } = payload;
        await startReplayInternal(symbol, date);
      } else if (payload.action === 'pauseReplay') {
        replayState.playing = false;
        statusCache.mode = 'REPLAY_PAUSED';
        broadcast({ ev: 'status', data: statusCache });
      } else if (payload.action === 'resumeReplay') {
        replayState.playing = true;
        statusCache.mode = 'REPLAY';
        broadcast({ ev: 'status', data: statusCache });
        startPlaybackTimer();
      } else if (payload.action === 'stopReplay') {
        stopReplayInternal();
      } else if (payload.action === 'setReplaySpeed') {
        replayState.speed = Number(payload.speed) || 1;
        if (replayState.playing) {
          startPlaybackTimer();
        }
      } else if (payload.action === 'seekReplay') {
        replayState.currentIndex = Math.max(0, Math.min(Number(payload.index), replayState.candles.length - 1));
        if (replayState.playing) {
          startPlaybackTimer();
        } else {
          sendSingleReplayFrame();
        }
      }
    } catch (e) {
      console.error('[Dashboard Server Error] Failed to parse message:', e.message);
    }
  });

  ws.on('close', () => {
    console.log('[Dashboard Server] Client disconnected');
  });
});

// Start scheduler (15-second cycles)
let activePollingTimer = setInterval(executePollCycle, 15000);
// Trigger first cycle immediately
executePollCycle();
