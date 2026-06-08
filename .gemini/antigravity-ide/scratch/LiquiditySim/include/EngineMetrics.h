#pragma once
#include <atomic>
#include <cstdint>

struct EngineMetrics {
    std::atomic<uint64_t> ordersProduced{0};
    std::atomic<uint64_t> ordersConsumed{0};
    std::atomic<uint64_t> tradesExecuted{0};
    std::atomic<uint64_t> pushFailures{0};
    std::atomic<uint64_t> popFailures{0};
    std::atomic<uint64_t> totalLatencyNanos{0};
    std::atomic<uint64_t> maxLatencyNanos{0};
};
