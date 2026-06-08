#pragma once
#include <vector>
#include <cstdint>
#include <algorithm>
#include <numeric>

class LatencyRecorder {
private:
    std::vector<uint64_t> latencies;

public:
    void record(uint64_t latencyNanos) {
        latencies.push_back(latencyNanos);
    }

    void clear() {
        latencies.clear();
    }

    double average() const {
        if (latencies.empty()) return 0.0;
        uint64_t sum = std::accumulate(latencies.begin(), latencies.end(), 0ULL);
        return (double)sum / latencies.size() / 1000.0; // convert to microseconds
    }

    double p50() {
        if (latencies.empty()) return 0.0;
        std::sort(latencies.begin(), latencies.end());
        size_t idx = latencies.size() * 0.50;
        if (idx >= latencies.size()) idx = latencies.size() - 1;
        return latencies[idx] / 1000.0; // convert to microseconds
    }

    double p90() {
        if (latencies.empty()) return 0.0;
        std::sort(latencies.begin(), latencies.end());
        size_t idx = latencies.size() * 0.90;
        if (idx >= latencies.size()) idx = latencies.size() - 1;
        return latencies[idx] / 1000.0; // convert to microseconds
    }

    double p99() {
        if (latencies.empty()) return 0.0;
        std::sort(latencies.begin(), latencies.end());
        size_t idx = latencies.size() * 0.99;
        if (idx >= latencies.size()) idx = latencies.size() - 1;
        return latencies[idx] / 1000.0; // convert to microseconds
    }

    double max() const {
        if (latencies.empty()) return 0.0;
        auto it = std::max_element(latencies.begin(), latencies.end());
        return *it / 1000.0; // convert to microseconds
    }
};
