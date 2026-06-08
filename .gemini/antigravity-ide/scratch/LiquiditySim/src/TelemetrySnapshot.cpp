#include "TelemetrySnapshot.h"
#include <sstream>
#include <iomanip>

std::string toJson(const TelemetrySnapshot& snapshot) {
    std::ostringstream oss;
    oss << std::fixed << std::setprecision(2);
    oss << "{"
        << "\"ordersProduced\":" << snapshot.ordersProduced << ","
        << "\"ordersConsumed\":" << snapshot.ordersConsumed << ","
        << "\"tradesExecuted\":" << snapshot.tradesExecuted << ","
        << "\"pushFailures\":" << snapshot.pushFailures << ","
        << "\"popFailures\":" << snapshot.popFailures << ","
        << "\"finalBuyOrders\":" << snapshot.finalBuyOrders << ","
        << "\"finalSellOrders\":" << snapshot.finalSellOrders << ","
        << "\"throughputOrdersPerSecond\":" << snapshot.throughputOrdersPerSecond << ","
        << "\"averageLatencyMicros\":" << snapshot.averageLatencyMicros << ","
        << "\"p50LatencyMicros\":" << snapshot.p50LatencyMicros << ","
        << "\"p90LatencyMicros\":" << snapshot.p90LatencyMicros << ","
        << "\"p99LatencyMicros\":" << snapshot.p99LatencyMicros << ","
        << "\"maxLatencyMicros\":" << snapshot.maxLatencyMicros << ","
        << "\"regimeName\":\"" << snapshot.regimeName << "\""
        << "}";
    return oss.str();
}
