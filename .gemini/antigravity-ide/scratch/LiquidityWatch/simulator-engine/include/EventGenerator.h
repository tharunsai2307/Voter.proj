#pragma once
#include "Order.h"
#include <random>

enum class MarketRegime {
    Normal,
    HighVolatility,
    LowLiquidity,
    FlashCrash
};

class EventGenerator {
private:
    uint64_t nextOrderId;
    std::mt19937 rng;
    MarketRegime regime;

public:
    EventGenerator();
    void setRegime(MarketRegime r);
    Order nextOrder();
    void reset();
};
