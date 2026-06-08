#pragma once
#include <string>
#include <cstdint>

struct TelemetrySnapshot {
    uint64_t ordersProduced;
    uint64_t ordersConsumed;
    uint64_t tradesExecuted;
    uint64_t pushFailures;
    uint64_t popFailures;
    uint64_t finalBuyOrders;
    uint64_t finalSellOrders;
    double throughputOrdersPerSecond;
    double averageLatencyMicros;
    double p50LatencyMicros;
    double p90LatencyMicros;
    double p99LatencyMicros;
    double maxLatencyMicros;
    std::string regimeName;
};

std::string toJson(const TelemetrySnapshot& snapshot);
