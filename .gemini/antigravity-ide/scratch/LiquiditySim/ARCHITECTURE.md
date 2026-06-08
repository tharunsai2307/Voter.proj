# LiquiditySim System Architecture
## *Technical Concurrency & Execution Design*

---

## 1. Producer-Consumer Pipeline
`LiquiditySim` separates order generation from matching engine execution using a decoupled, multithreaded architecture. 

- **Producer Thread**: Represents the market ingestion layer. It generates deterministic orders via the `EventGenerator` and stamps them with the current time in nanoseconds. It then pushes them to the lock-free ring buffer queue.
- **Consumer Thread**: Represents the exchange matching core. It pulls orders from the queue, passes them into the `MatchingEngine` for execution, and records latency.

---

## 2. LockFreeQueue Explanation
The queue is a Single-Producer Single-Consumer (SPSC) ring buffer implemented as `LockFreeQueue<SIZE>`:
- **Zero Mutex Locks**: Thread safety is achieved entirely through atomic operations and memory barriers, eliminating OS-level context switches.
- **Cache Alignment (`alignas(64)`)**: The `head` and `tail` atomic counters are aligned to 64-byte boundaries. This separates them onto different L1/L2 cache lines, preventing **false sharing** (where writes to `tail` invalidate the cache line containing `head` on the other core).
- **C++20 Memory Ordering**:
  - `push()` stores the updated `tail` with `std::memory_order_release` and reads `head` with `std::memory_order_acquire`.
  - `pop()` stores the updated `head` with `std::memory_order_release` and reads `tail` with `std::memory_order_acquire`.
  - This guarantees that buffer writes are visible to the consumer before the tail update is seen.

---

## 3. MatchingEngine & OrderBook Structure
The `MatchingEngine` uses a double-indexed data structure to manage resting orders:
- **Price Levels (`buyBook` & `sellBook`)**:
  - Maintained as `std::map<int64_t, std::list<Order>>`.
  - Maps sort price levels in $O(\log M)$ time.
  - Using a linked list (`std::list`) at each price level ensures that adding a new resting order (`push_back`) or removing a matched order (`erase`/`pop_front`) is done in $O(1)$ time, and critically, **never invalidates iterators** to other resting orders in the book.
- **Order Index (`orderIndex`)**:
  - Maintained as `std::unordered_map<uint64_t, OrderLocation>`.
  - Maps an `orderId` to its price, side, and exact `std::list::iterator`.
  - This allows the engine to find and cancel any resting order in $O(1)$ time.

---

## 4. Telemetry System
- **Timestamping**: Latency is calculated end-to-end. The producer records `timestampNanos` immediately before pushing. The consumer records `popTime` immediately after popping.
- **Metrics Collector (`EngineMetrics`)**: Accumulates statistics using `std::atomic<uint64_t>` values. Since the consumer thread executes sequentially, it updates its local metrics in a lock-free manner using relaxed memory orders.

---

## 5. WebSocket Bridge (`TelemetryServer`)
- To isolate network compilation dependencies, the `TelemetryServer` is implemented using the **Pimpl (Private Implementation) Pattern**.
- The main application only interacts with the generic `TelemetryServer` interface.
- Inside [TelemetryServer.cpp](file:///C:/Users/Hp/.gemini/antigravity-ide/scratch/LiquiditySim/src/TelemetryServer.cpp), if `WITH_UWEBSOCKETS` is defined, uWebSockets executes on a background thread.
- If not defined, a lightweight fallback stub is compiled, enabling immediate compile-and-run capabilities.

---

## 6. Frontend Dashboard Flow
- The React dashboard connects to the backend over `ws://localhost:9001/metrics`.
- The connection runs in a persistent background `useEffect` loop that handles automatic reconnection.
- Every time a JSON telemetry payload is received, the dashboard updates its state, pushes the new values to a historic rolling array (last 30 samples), and renders interactive area and line charts via Recharts.
