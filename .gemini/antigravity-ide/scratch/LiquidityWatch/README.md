# LiquidityWatch
### *Real-Time Market-Data Intelligence Engine using Polygon.io & C++*

**Author:** Tharun Sai  
**LinkedIn:** [www.linkedin.com/in/tharun-sai-gangadhar-p-a32245396](http://www.linkedin.com/in/tharun-sai-gangadhar-p-a32245396)  
**Instagram:** [https://www.instagram.com/delulu_daydreamer](https://www.instagram.com/delulu_daydreamer)  

`LiquidityWatch` is a real-time market data intelligence platform built to monitor and analyze market liquidity on Windows. It tracks stocks and cryptocurrencies using the Polygon.io REST API, processes incoming events via a high-performance C++ analyzer child process, and visualizes live indicators, alert panels, and rule-based AI summaries in a dark-themed financial React dashboard.

> [!IMPORTANT]
> **This is a real market-data analytics dashboard, not a trading bot.** It does not execute trades, place orders, or predict stock trends. It calculates real-time liquidity, spread, volatility, and market health metrics based on actual exchange quotes and trades.

---

## Key Features

1. **Watchlist Manager & Search Helper:** 
   - Add and remove Stocks and Crypto symbols dynamically on the dashboard.
   - Saves active watchlists in the browser's `localStorage`.
   - Transmits active watchlists to the backend via WebSocket so that the backend only polls active tickers.
   - Format search helper hints prevent input mistakes.
2. **Starred Favorites:**
   - Star/unstar tickers to pin them to the top of their respective lists.
   - Saved across restarts via browser `localStorage`.
3. **Alert Rules & Log History:**
   - Configure custom alert thresholds for Liquidity Score, HIGH volatility trigger, Market Health, and missing quote bounds.
   - Checks conditions in real-time on the frontend, logging triggers to a persistent 50-alert history ledger (saved in `localStorage`).
4. **CSV Data Export:**
   - Click "Export CSV" to compile active metrics of all watchlist tickers and download them as a CSV file.
5. **Mini Price Chart:**
   - Cache up to 100 price points in-memory per active asset. Renders a sleek, responsive SVG sparkline chart for the inspected ticker.
6. **API Health Panel:**
   - Displays real-time API health status from the backend, including gateway connection, last fetch time, error text, and rate limit states.
7. **Session Summary:**
   - Displays session stats: ticks processed, alerts logged, best/worst liquidity tickers, and maximum volatility tickers.
8. **Rule-Based AI Summary:**
   - Improved template engine analyzes real metrics to compile statements highlighting specific symbol trends.
9. **Visual Data Freshness Indicators:**
   - Indicators mark assets as **Fresh** (<30s), **Delayed** (30-120s), or **Stale** (>120s).
10. **Market Scanner (Bloomberg Lite):**
    - A dedicated scanner page showing Top 10 rankings for Gainers, Losers, Highest Volume, Most Volatile, and Highest/Lowest Liquidity assets.
11. **Institutional Activity Detector:**
    - Analyzes rolling windows inside C++ to flag large volume spikes (5x+ rolling average) and spread compression, outputting alerts: `LOW`, `MEDIUM`, or `HIGH`.
12. **Multi-Factor Risk Engine:**
    - Computes an overall Risk Score (0-100) combining Liquidity Risk, Volatility Risk, and Spread Risk components in real-time.
13. **Replay Studio:**
    - Replays historical 1-minute chart candles (downloaded from Yahoo Finance or Coinbase Exchange REST APIs) with Play, Pause, Seek, and Speed multipliers (2x, 10x, 100x).
14. **Paper Trading Simulator:**
    - A dedicated educational sandbox where users start with $100,000 virtual cash to buy and sell stocks and cryptos using real-time market data. Tracks portfolio return, realized/unrealized P/L, and active positions over time (persisted in `localStorage`).
15. **Portfolio Intelligence & Exportable PDF:**
    - Computes real-time Portfolio Health, Risk, and Liquidity Scores with explainable "Why?" score breakdowns. Generates and downloads a complete portfolio summary PDF.
16. **AI Research Analyst (Dual LLM Support):**
    - A contextual chat widget powered by either OpenAI or Google Gemini (configured in `.env`). The AI analyzes both real-time market metrics and the user's simulated portfolio to provide metric-grounded insights.
17. **Beginner / Professional Modes:**
    - Simplifies dense metrics using intuitive Market Weather (e.g., ⛈ Stormy) and Mood (e.g., 😱 Panic) indicators in Beginner Mode.

---

## Architecture Flow

```
 Polygon.io REST API (Active Tickers Snapshots)
            ▲
            │ (Alternating 15-second Polling Scheduler)
      Node.js Backend (server.js)
            ▲
            │ (WebSocket sync: activeWatchlist update)
      React Frontend (App.jsx) ──► localStorage
            │
            ▼ (stdin pipe: Flat JSON lines)
    C++ Analyzer (LiquidityWatchAnalyzer.exe)
            │
            ▼ (stdout pipe: Calculated JSON metrics)
      Node.js Backend (server.js)
            │
            ▼ (Broadcast: ws://localhost:9001)
      React Frontend (App.jsx)
```

---

## Default Watchlists
- **Stocks:** `AAPL`, `MSFT`, `NVDA`, `TSLA`, `AMD`, `SPY`, `QQQ`
- **Crypto:** `X:BTCUSD`, `X:ETHUSD`

---

## Setup & Run Guide on Windows

### 1. Configure Environment Variables
1. Navigate to the `backend/` folder.
2. Create or open `backend/.env`.
3. Set your Polygon API key:
   ```env
   POLYGON_API_KEY=your_polygon_api_key_here
   ```
   *(If left as the default placeholder or empty, the backend automatically falls back to simulated high-fidelity feeds for local testing.)*

### 2. Build the C++ Analyzer
From the root directory:
```powershell
cd cpp-analyzer
mkdir build
cd build
cmake .. -G "NMake Makefiles" -DCMAKE_BUILD_TYPE=Release
cmake --build .
```
This produces `LiquidityWatchAnalyzer.exe` in `cpp-analyzer/build`.

### 3. Run the Backend Gateway
```powershell
cd backend
npm install
npm start
```
The Node.js server will launch, spawn the C++ analyzer, start polling Polygon REST endpoints, and listen for dashboard clients on `ws://localhost:9001`.

### 4. Run the React Frontend
```powershell
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your browser to view the live dashboard.
