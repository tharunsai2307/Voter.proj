# LiquiditySim
### *High-Performance Market Microstructure Simulator with Live Telemetry Dashboard*

---

## Problem Statement
Simulating market microstructure requires high-throughput and ultra-low-latency processing of massive streams of order messages (Limit Order Books). Traditional simulation engines often suffer from concurrency bottlenecks (such as lock contention) and lack real-time telemetry visibility. 

`LiquiditySim` addresses these issues by:
1. Building a lock-free, single-producer single-consumer (SPSC) queue to process incoming order streams.
2. Implementing an efficient FIFO price-time priority Limit Order Book (LOB) matching engine.
3. Exposing interval-based telemetry JSON metrics via WebSockets to a modern React-based visualization terminal.

---

## Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                  LIQUIDITYSIM                                     |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  +-----------------------+              +-----------------------+                 |
|  |    Producer Thread    |              |    Consumer Thread    |                 |
|  |  (Deterministic Flow) |              |  (Matching Engine)    |                 |
|  +-----------+-----------+              +-----------^-----------+                 |
|              |                                      |                             |
|              |  [Push Order]                        |  [Pop Order]                |
|              |                                      |                             |
|        +-----v--------------------------------------+-----+                       |
|        |     SPSC Lock-Free Queue (alignas(64) Ring Buffer)|                      |
|        +--------------------------------------------------+                       |
|                                                     |                             |
|                                                     | [Match Order]               |
|                                                     v                             |
|                                         +-----------------------+                 |
|                                         |   MatchingEngine      |                 |
|                                         | (Order Book Matching) |                 |
|                                         +-----------+-----------+                 |
|                                                     |                             |
|                                                     | [Report Metrics]            |
|                                                     v                             |
|                                         +-----------------------+                 |
|                                         |   TelemetryServer     |                 |
|                                         |  (WebSocket / Nanos)  |                 |
|                                         +-----------+-----------+                 |
|                                                     |                             |
+-----------------------------------------------------|-----------------------------+
                                                      |
                                                      |  [Broadcast JSON Snapshot]
                                                      |  (ws://localhost:9001/metrics)
                                                      v
                                         +-----------------------+
                                         |   React Frontend      |
                                         | (Tailwind / Recharts) |
                                         +-----------------------+
```

---

## Features
- **Deterministic Event Generator**: Models four different market regimes (Normal, High Volatility, Low Liquidity, Flash Crash) using reproducible pseudo-random streams.
- **SPSC Ring Buffer**: Cache-aligned (`alignas(64)`), lock-free, Single-Producer Single-Consumer queue using C++20 memory barriers (`std::memory_order`).
- **High-Performance Order Book**: $O(1)$ lookup for order cancellations via stable iterators and double indexing, with FIFO price-time priority matching.
- **Real-Time Telemetry**: Captures per-order end-to-end queue-to-execution latency, tracking throughput, P50, P90, P99, and Max latency.
- **Visual Analytics**: Interactive React dashboard plotting real-time ingestion speed, latency spikes, and execution charts using Recharts.

---

## Tech Stack
- **Backend**: C++20, CMake, Pthreads, uWebSockets (Optional)
- **Frontend**: React 18, Vite, Tailwind CSS v3, Recharts, Framer Motion

---

## Backend Build & Run Instructions

### 1. Prerequisites
- CMake (version 3.15+)
- Visual Studio C++ Compiler (MSVC) or GCC supporting C++20.

### 2. Build the Project
Run the following from the root directory of the project:
```bash
mkdir build
cd build
cmake ..
cmake --build .
```

### 3. Run Benchmark Mode
Evaluates correctness tests, basic queue operations, and processes 100,000 orders across all 4 market regimes:
```bash
# On Linux/macOS:
./LiquiditySim benchmark

# On Windows:
LiquiditySim.exe benchmark
```

### 4. Run Dashboard Mode
Launches the simulator with the live telemetry WebSocket server:
```bash
# On Linux/macOS:
./LiquiditySim dashboard

# On Windows:
LiquiditySim.exe dashboard
```

---

## Frontend Setup & Run Instructions

```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Sample Telemetry JSON
Broadcasting payload schema:
```json
{
  "ordersProduced": 19482,
  "ordersConsumed": 19480,
  "tradesExecuted": 9481,
  "pushFailures": 0,
  "popFailures": 24,
  "finalBuyOrders": 2490,
  "finalSellOrders": 12,
  "throughputOrdersPerSecond": 1980.00,
  "averageLatencyMicros": 1.45,
  "p50LatencyMicros": 1.20,
  "p90LatencyMicros": 1.95,
  "p99LatencyMicros": 3.80,
  "maxLatencyMicros": 15.40,
  "regimeName": "Normal"
}
```

---

## Sample Benchmark Output
```
=== Running MatchingEngine Correctness Tests ===
Test 1 passed
Test 2 passed
...
All MatchingEngine tests passed.

=== Running Basic LockFreeQueue Benchmark ===
Basic queue benchmark passed. (Processed 20000 items successfully)

--- Running Regime Benchmark: Normal (100000 orders) ---
Regime Name: Normal
Orders Produced: 100000
Orders Consumed: 100000
Trades Executed: 45192
Push Failures: 142
Pop Failures: 24890
Final Buy Orders: 1042
Final Sell Orders: 981
Total Time Microseconds: 84032
Throughput Orders/Sec: 1190022.85
Average Latency Microseconds: 1.15
P50 Latency Microseconds: 0.90
P90 Latency Microseconds: 1.60
P99 Latency Microseconds: 2.80
Max Latency Microseconds: 12.50
validateBook result: VALID
```

---

## Screenshots Placeholder
*(Include your system screenshots and animated recordings of the React dashboard in action here.)*

---

## Future Improvements
- **Multi-Consumer Scaling**: Extend the queue to support MPMC (Multi-Producer Multi-Consumer) using lock-free ring buffers (disruptor pattern).
- **GPU Ingestion**: Offload order matching algorithms to CUDA for massive simulation scaling.
- **Historical Analysis Export**: Integrate Parquet export for model backtesting.
