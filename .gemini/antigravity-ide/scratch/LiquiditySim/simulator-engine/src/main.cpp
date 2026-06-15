#include "Order.h"
#include "Trade.h"
#include "MatchingEngine.h"
#include "LockFreeQueue.h"
#include "EventGenerator.h"
#include "EngineMetrics.h"
#include "LatencyRecorder.h"
#include "TelemetrySnapshot.h"
#include "TelemetryServer.h"
#include <iostream>
#include <thread>
#include <chrono>
#include <vector>
#include <atomic>
#include <string>
#include <iomanip>
#include <mutex>
#include <cassert>

void runMatchingEngineTests();

// Global or local queue size
constexpr size_t QUEUE_SIZE = 4096;

inline uint64_t getCurrentTimeNanos() {
    return std::chrono::duration_cast<std::chrono::nanoseconds>(
        std::chrono::high_resolution_clock::now().time_since_epoch()
    ).count();
}

std::string getRegimeName(MarketRegime regime) {
    switch (regime) {
        case MarketRegime::Normal: return "Normal";
        case MarketRegime::HighVolatility: return "HighVolatility";
        case MarketRegime::LowLiquidity: return "LowLiquidity";
        case MarketRegime::FlashCrash: return "FlashCrash";
    }
    return "Unknown";
}

void runBasicQueueBenchmark() {
    std::cout << "=== Running Basic LockFreeQueue Benchmark ===" << std::endl;
    LockFreeQueue<QUEUE_SIZE> queue;
    std::atomic<bool> producerDone{false};
    std::atomic<uint64_t> producedCount{0};
    std::atomic<uint64_t> consumedCount{0};

    std::thread producer([&]() {
        for (uint64_t i = 1; i <= 20000; ++i) {
            Order o{i, 10000, 10, Side::Buy, getCurrentTimeNanos()};
            while (!queue.push(o)) {
                #if defined(_MSC_VER)
                _mm_pause();
                #else
                __builtin_ia32_pause();
                #endif
            }
            producedCount.fetch_add(1, std::memory_order_relaxed);
        }
        producerDone.store(true, std::memory_order_release);
    });

    std::thread consumer([&]() {
        Order o;
        while (true) {
            if (queue.pop(o)) {
                consumedCount.fetch_add(1, std::memory_order_relaxed);
            } else {
                if (producerDone.load(std::memory_order_acquire)) {
                    // Try popping one more time to ensure queue is truly drained
                    while (queue.pop(o)) {
                        consumedCount.fetch_add(1, std::memory_order_relaxed);
                    }
                    break;
                }
                #if defined(_MSC_VER)
                _mm_pause();
                #else
                __builtin_ia32_pause();
                #endif
            }
        }
    });

    producer.join();
    consumer.join();

    assert(producedCount == 20000);
    assert(consumedCount == 20000);
    std::cout << "Basic queue benchmark passed. (Processed " << consumedCount << " items successfully)\n\n";
}

void runRegimeBenchmark(MarketRegime regime, size_t orderCount) {
    std::string regimeName = getRegimeName(regime);
    std::cout << "--- Running Regime Benchmark: " << regimeName << " (" << orderCount << " orders) ---" << std::endl;

    MatchingEngine me;
    LockFreeQueue<QUEUE_SIZE> queue;
    EventGenerator eg;
    eg.setRegime(regime);

    std::atomic<bool> producerDone{false};
    EngineMetrics metrics;
    LatencyRecorder recorder;

    auto startTime = std::chrono::high_resolution_clock::now();

    // Spawning threads
    std::thread producer([&]() {
        for (size_t i = 0; i < orderCount; ++i) {
            Order o = eg.nextOrder();
            o.timestampNanos = getCurrentTimeNanos();
            while (!queue.push(o)) {
                metrics.pushFailures.fetch_add(1, std::memory_order_relaxed);
                #if defined(_MSC_VER)
                _mm_pause();
                #else
                __builtin_ia32_pause();
                #endif
            }
            metrics.ordersProduced.fetch_add(1, std::memory_order_relaxed);
        }
        producerDone.store(true, std::memory_order_release);
    });

    std::thread consumer([&]() {
        Order o;
        while (true) {
            if (queue.pop(o)) {
                metrics.ordersConsumed.fetch_add(1, std::memory_order_relaxed);

                uint64_t popTime = getCurrentTimeNanos();
                uint64_t latency = popTime - o.timestampNanos;
                metrics.totalLatencyNanos.fetch_add(latency, std::memory_order_relaxed);
                recorder.record(latency);

                // Update max latency atomically
                uint64_t prevMax = metrics.maxLatencyNanos.load(std::memory_order_relaxed);
                while (latency > prevMax && !metrics.maxLatencyNanos.compare_exchange_weak(prevMax, latency, std::memory_order_relaxed));

                auto trades = me.addOrder(o);
                metrics.tradesExecuted.fetch_add(trades.size(), std::memory_order_relaxed);
            } else {
                metrics.popFailures.fetch_add(1, std::memory_order_relaxed);
                if (producerDone.load(std::memory_order_acquire)) {
                    // Drain the rest of the queue
                    while (queue.pop(o)) {
                        metrics.ordersConsumed.fetch_add(1, std::memory_order_relaxed);

                        uint64_t popTime = getCurrentTimeNanos();
                        uint64_t latency = popTime - o.timestampNanos;
                        metrics.totalLatencyNanos.fetch_add(latency, std::memory_order_relaxed);
                        recorder.record(latency);

                        uint64_t prevMax = metrics.maxLatencyNanos.load(std::memory_order_relaxed);
                        while (latency > prevMax && !metrics.maxLatencyNanos.compare_exchange_weak(prevMax, latency, std::memory_order_relaxed));

                        auto trades = me.addOrder(o);
                        metrics.tradesExecuted.fetch_add(trades.size(), std::memory_order_relaxed);
                    }
                    break;
                }
                #if defined(_MSC_VER)
                _mm_pause();
                #else
                __builtin_ia32_pause();
                #endif
            }
        }
    });

    producer.join();
    consumer.join();

    auto endTime = std::chrono::high_resolution_clock::now();
    uint64_t totalTimeMicros = std::chrono::duration_cast<std::chrono::microseconds>(endTime - startTime).count();

    double throughput = (double)metrics.ordersConsumed.load() / (totalTimeMicros / 1000000.0);

    bool bookValid = me.validateBook();

    std::cout << std::fixed << std::setprecision(2);
    std::cout << "Regime Name: " << regimeName << std::endl;
    std::cout << "Orders Produced: " << metrics.ordersProduced.load() << std::endl;
    std::cout << "Orders Consumed: " << metrics.ordersConsumed.load() << std::endl;
    std::cout << "Trades Executed: " << metrics.tradesExecuted.load() << std::endl;
    std::cout << "Push Failures: " << metrics.pushFailures.load() << std::endl;
    std::cout << "Pop Failures: " << metrics.popFailures.load() << std::endl;
    std::cout << "Final Buy Orders: " << me.totalBuyOrders() << std::endl;
    std::cout << "Final Sell Orders: " << me.totalSellOrders() << std::endl;
    std::cout << "Total Time Microseconds: " << totalTimeMicros << std::endl;
    std::cout << "Throughput Orders/Sec: " << throughput << std::endl;
    std::cout << "Average Latency Microseconds: " << recorder.average() << std::endl;
    std::cout << "P50 Latency Microseconds: " << recorder.p50() << std::endl;
    std::cout << "P90 Latency Microseconds: " << recorder.p90() << std::endl;
    std::cout << "P99 Latency Microseconds: " << recorder.p99() << std::endl;
    std::cout << "Max Latency Microseconds: " << recorder.max() << std::endl;
    std::cout << "validateBook result: " << (bookValid ? "VALID" : "INVALID") << std::endl;
    std::cout << std::endl;
}

void runDashboardSimulation() {
    std::cout << "=== Starting Live Dashboard Simulation (Continuous) ===" << std::endl;

    TelemetryServer server(9001);
    server.start();

    MatchingEngine me;
    LockFreeQueue<QUEUE_SIZE> queue;
    EventGenerator eg;
    eg.setRegime(MarketRegime::Normal);

    std::atomic<bool> producerRunning{true};
    std::atomic<bool> consumerRunning{true};
    EngineMetrics metrics;
    
    // Using a mutex-protected vector for thread-safe latency recording in the dashboard
    std::mutex recorderMutex;
    LatencyRecorder recorder;

    // Spawning producer (generates orders continuously with a small delay to simulate real market pacing)
    std::thread producer([&]() {
        while (producerRunning.load(std::memory_order_relaxed)) {
            Order o = eg.nextOrder();
            o.timestampNanos = getCurrentTimeNanos();
            while (!queue.push(o)) {
                metrics.pushFailures.fetch_add(1, std::memory_order_relaxed);
                std::this_thread::sleep_for(std::chrono::microseconds(10));
            }
            metrics.ordersProduced.fetch_add(1, std::memory_order_relaxed);
            std::this_thread::sleep_for(std::chrono::microseconds(500)); // ~2000 orders/sec base pacing
        }
    });

    // Spawning consumer
    std::thread consumer([&]() {
        Order o;
        while (consumerRunning.load(std::memory_order_relaxed) || queue.approximateSize() > 0) {
            if (queue.pop(o)) {
                metrics.ordersConsumed.fetch_add(1, std::memory_order_relaxed);

                uint64_t popTime = getCurrentTimeNanos();
                uint64_t latency = popTime - o.timestampNanos;
                metrics.totalLatencyNanos.fetch_add(latency, std::memory_order_relaxed);
                
                {
                    std::lock_guard<std::mutex> lock(recorderMutex);
                    recorder.record(latency);
                }

                uint64_t prevMax = metrics.maxLatencyNanos.load(std::memory_order_relaxed);
                while (latency > prevMax && !metrics.maxLatencyNanos.compare_exchange_weak(prevMax, latency, std::memory_order_relaxed));

                auto trades = me.addOrder(o);
                metrics.tradesExecuted.fetch_add(trades.size(), std::memory_order_relaxed);
            } else {
                metrics.popFailures.fetch_add(1, std::memory_order_relaxed);
                #if defined(_MSC_VER)
                _mm_pause();
                #else
                __builtin_ia32_pause();
                #endif
            }
        }
    });

    // Monitoring thread - prints and broadcasts JSON every 1 second
    uint64_t lastConsumed = 0;
    for (int sec = 1; ; ++sec) {
        std::this_thread::sleep_for(std::chrono::seconds(1));

        uint64_t currentConsumed = metrics.ordersConsumed.load();
        uint64_t deltaConsumed = currentConsumed - lastConsumed;
        lastConsumed = currentConsumed;

        double throughput = (double)deltaConsumed; // delta over 1 second is orders/sec

        double avgLat = 0.0, p50Lat = 0.0, p90Lat = 0.0, p99Lat = 0.0, maxLat = 0.0;
        {
            std::lock_guard<std::mutex> lock(recorderMutex);
            avgLat = recorder.average();
            p50Lat = recorder.p50();
            p90Lat = recorder.p90();
            p99Lat = recorder.p99();
            maxLat = recorder.max();
            recorder.clear(); // Clear so we show interval metrics
        }

        TelemetrySnapshot snapshot{
            .ordersProduced = metrics.ordersProduced.load(),
            .ordersConsumed = currentConsumed,
            .tradesExecuted = metrics.tradesExecuted.load(),
            .pushFailures = metrics.pushFailures.load(),
            .popFailures = metrics.popFailures.load(),
            .finalBuyOrders = me.totalBuyOrders(),
            .finalSellOrders = me.totalSellOrders(),
            .throughputOrdersPerSecond = throughput,
            .averageLatencyMicros = avgLat,
            .p50LatencyMicros = p50Lat,
            .p90LatencyMicros = p90Lat,
            .p99LatencyMicros = p99Lat,
            .maxLatencyMicros = maxLat,
            .regimeName = "Normal"
        };

        std::string jsonStr = toJson(snapshot);
        std::cout << jsonStr << std::endl;
        server.broadcast(jsonStr);
    }

    // Graceful Stop
    producerRunning.store(false, std::memory_order_relaxed);
    producer.join();

    consumerRunning.store(false, std::memory_order_relaxed);
    consumer.join();

    server.stop();
    std::cout << "=== Live Dashboard Simulation Stopped ===" << std::endl;
}

int main(int argc, char* argv[]) {
    std::string mode = "benchmark";
    if (argc > 1) {
        mode = argv[1];
    }

    if (mode == "dashboard") {
        runDashboardSimulation();
    } else {
        // Run correctness tests
        runMatchingEngineTests();

        // Run lock-free queue sanity benchmark
        runBasicQueueBenchmark();

        // Run regime benchmarks (100,000 orders each)
        runRegimeBenchmark(MarketRegime::Normal, 100000);
        runRegimeBenchmark(MarketRegime::HighVolatility, 100000);
        runRegimeBenchmark(MarketRegime::LowLiquidity, 100000);
        runRegimeBenchmark(MarketRegime::FlashCrash, 100000);
    }

    return 0;
}
