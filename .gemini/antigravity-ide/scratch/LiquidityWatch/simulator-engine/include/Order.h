#pragma once
#include <cstdint>

enum class Side : uint8_t { Buy, Sell };

struct Order {
    uint64_t orderId;
    int64_t price;
    uint32_t quantity;
    Side side;
    uint64_t timestampNanos;
};
