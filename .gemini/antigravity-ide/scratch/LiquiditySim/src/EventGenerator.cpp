#include "EventGenerator.h"

EventGenerator::EventGenerator() {
    reset();
}

void EventGenerator::setRegime(MarketRegime r) {
    regime = r;
}

void EventGenerator::reset() {
    nextOrderId = 1;
    rng.seed(42);
    regime = MarketRegime::Normal;
}

Order EventGenerator::nextOrder() {
    uint64_t id = nextOrderId++;
    int64_t basePrice = 10000; // 100.00 Rs
    int64_t price = basePrice;
    uint32_t qty = 10;
    Side side = Side::Buy;

    std::uniform_int_distribution<int> sideDist(0, 1);
    side = (sideDist(rng) == 0) ? Side::Buy : Side::Sell;

    switch (regime) {
        case MarketRegime::Normal: {
            std::uniform_int_distribution<int64_t> offsetDist(1, 10);
            std::uniform_int_distribution<uint32_t> qtyDist(10, 100);
            std::uniform_int_distribution<int> crossDist(0, 9); // 10% cross
            int64_t offset = offsetDist(rng);
            qty = qtyDist(rng);
            bool cross = (crossDist(rng) == 0);

            if (side == Side::Buy) {
                price = cross ? (basePrice + offset) : (basePrice - offset);
            } else {
                price = cross ? (basePrice - offset) : (basePrice + offset);
            }
            break;
        }
        case MarketRegime::HighVolatility: {
            std::uniform_int_distribution<int64_t> offsetDist(10, 100);
            std::uniform_int_distribution<uint32_t> qtyDist(50, 300);
            std::uniform_int_distribution<int> crossDist(0, 9); // 30% cross
            int64_t offset = offsetDist(rng);
            qty = qtyDist(rng);
            bool cross = (crossDist(rng) < 3);

            if (side == Side::Buy) {
                price = cross ? (basePrice + offset) : (basePrice - offset);
            } else {
                price = cross ? (basePrice - offset) : (basePrice + offset);
            }
            break;
        }
        case MarketRegime::LowLiquidity: {
            std::uniform_int_distribution<int64_t> offsetDist(20, 150);
            std::uniform_int_distribution<uint32_t> qtyDist(1, 30);
            std::uniform_int_distribution<int> crossDist(0, 99); // 2% cross
            int64_t offset = offsetDist(rng);
            qty = qtyDist(rng);
            bool cross = (crossDist(rng) < 2);

            if (side == Side::Buy) {
                price = cross ? (basePrice + offset) : (basePrice - offset);
            } else {
                price = cross ? (basePrice - offset) : (basePrice + offset);
            }
            break;
        }
        case MarketRegime::FlashCrash: {
            std::uniform_int_distribution<int> flashSideDist(0, 9); // 70% Sell, 30% Buy
            side = (flashSideDist(rng) < 7) ? Side::Sell : Side::Buy;

            if (side == Side::Sell) {
                std::uniform_int_distribution<int64_t> priceDist(9000, 9900); // agressively below base price
                std::uniform_int_distribution<uint32_t> qtyDist(50, 200);
                price = priceDist(rng);
                qty = qtyDist(rng);
            } else {
                std::uniform_int_distribution<int64_t> priceDist(8500, 9500); // weaker buy price
                std::uniform_int_distribution<uint32_t> qtyDist(5, 50); // weaker buy qty
                price = priceDist(rng);
                qty = qtyDist(rng);
            }
            break;
        }
    }

    return Order{
        .orderId = id,
        .price = price,
        .quantity = qty,
        .side = side,
        .timestampNanos = 0 // Will be set by Producer
    };
}
