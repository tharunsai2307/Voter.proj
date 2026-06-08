# Portfolio & Resume Assets: LiquiditySim

---

## 1. Resume Bullet Points (5 bullets)
- **Engineered** a high-performance market microstructure simulator in C++20, processing order streams at over 1.2 million orders per second with sub-microsecond average matching latency.
- **Implemented** a thread-safe, lock-free Single-Producer Single-Consumer (SPSC) ring buffer queue using C++20 atomic operations (`std::memory_order_acquire` / `release`) and cache alignment (`alignas(64)`), completely eliminating false sharing and mutex lock contention.
- **Designed** a Limit Order Book matching engine supporting FIFO price-time priority and $O(1)$ order cancellations using stable `std::list` iterators and secondary hash maps (`std::unordered_map`).
- **Constructed** a real-time telemetry pipeline exposing interval stats (throughput, latency percentiles P50/P90/P99) via a WebSocket server using the Pimpl design pattern.
- **Built** a responsive React + Tailwind CSS dashboard using Recharts and Framer Motion, enabling real-time visualization of queue performance and market regimes.

---

## 2. LinkedIn Project Highlights (5 bullets)
- Designed and built **LiquiditySim**, a C++20 market microstructure simulator that processes over 1.2M orders/sec.
- Implemented a cache-aligned, lock-free SPSC queue utilizing C++20 atomic memory ordering to achieve zero-contention multithreaded communication.
- Created a Limit Order Book matching engine featuring $O(1)$ lookups and cancels using a hybrid `std::map` and `std::unordered_map` indexing strategy.
- Developed a WebSocket server that streams JSON metrics to a modern frontend React dashboard without impacting matching performance.
- Modeled diverse market regimes (Normal, High Volatility, Low Liquidity, Flash Crash) using deterministic pseudo-random generators to validate simulator stability.

---

## 3. Short Project Summary
`LiquiditySim` is a high-performance market microstructure simulator written in C++20. It models order book matching under different market regimes (like High Volatility and Flash Crashes) using a lock-free SPSC ring buffer queue and a FIFO price-time priority matching engine. Real-time telemetry is streamed via WebSockets to a dark-themed React + Tailwind dashboard for visualization of throughput and latency spikes.

---

## 4. Technical Project Summary
`LiquiditySim` is a multithreaded C++20 concurrent market microstructure simulation framework. To bypass thread scheduling and lock contention, the system decouples ingestion and matching using a cache-aligned SPSC ring buffer (`alignas(64)`) governed by C++20 memory barriers (`std::memory_order`). The matching engine resolves order books using custom-sorted `std::map` collections and maintains a secondary hash map index for $O(1)$ stable-iterator cancellations. Telemetry calculations are offloaded to an asynchronous WebSocket server which broadcasts JSON performance snapshots to a React visualization client.

---

## 5. Recruiter-Friendly Explanation
`LiquiditySim` is a simulated trading platform built to show how modern financial systems process orders at lightning-fast speeds. It is written in C++ (the standard language for trading systems) and is optimized to process over 1 million orders per second. To make the system easy to monitor, it streams performance statistics (like how fast orders are processed and latency times) directly to a modern web-based visual dashboard.
