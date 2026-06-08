#include "MatchingEngine.h"
#include <iostream>
#include <vector>
#include <cassert>
#include <random>
#include <algorithm>
#include <stdexcept>

void test1_buy_stored() {
    MatchingEngine me;
    Order o{1, 100, 10, Side::Buy, 0};
    auto trades = me.addOrder(o);
    assert(trades.empty());
    assert(me.totalBuyOrders() == 1);
    assert(me.totalSellOrders() == 0);
    assert(me.buyLevels() == 1);
    assert(me.hasOrder(1));

    // Attempting to add duplicate active orderId should throw
    bool threw = false;
    try {
        me.addOrder(Order{1, 105, 5, Side::Buy, 0});
    } catch (const std::invalid_argument&) {
        threw = true;
    }
    assert(threw);

    assert(me.validateBook());
    std::cout << "Test 1 passed" << std::endl;
}

void test2_sell_stored() {
    MatchingEngine me;
    Order o{2, 101, 15, Side::Sell, 0};
    auto trades = me.addOrder(o);
    assert(trades.empty());
    assert(me.totalBuyOrders() == 0);
    assert(me.totalSellOrders() == 1);
    assert(me.sellLevels() == 1);
    assert(me.hasOrder(2));
    assert(me.validateBook());
    std::cout << "Test 2 passed" << std::endl;
}

void test3_buy_matches_lower_sell() {
    MatchingEngine me;
    me.addOrder(Order{1, 99, 10, Side::Sell, 0});
    auto trades = me.addOrder(Order{2, 100, 10, Side::Buy, 0});
    assert(trades.size() == 1);
    assert(trades[0].buyOrderId == 2);
    assert(trades[0].sellOrderId == 1);
    assert(trades[0].price == 99);
    assert(trades[0].quantity == 10);
    assert(me.totalBuyOrders() == 0);
    assert(me.totalSellOrders() == 0);
    assert(!me.hasOrder(1));
    assert(!me.hasOrder(2));
    assert(me.validateBook());
    std::cout << "Test 3 passed" << std::endl;
}

void test4_sell_matches_higher_buy() {
    MatchingEngine me;
    me.addOrder(Order{1, 100, 10, Side::Buy, 0});
    auto trades = me.addOrder(Order{2, 99, 10, Side::Sell, 0});
    assert(trades.size() == 1);
    assert(trades[0].buyOrderId == 1);
    assert(trades[0].sellOrderId == 2);
    assert(trades[0].price == 100);
    assert(trades[0].quantity == 10);
    assert(me.totalBuyOrders() == 0);
    assert(me.totalSellOrders() == 0);
    assert(!me.hasOrder(1));
    assert(!me.hasOrder(2));
    assert(me.validateBook());
    std::cout << "Test 4 passed" << std::endl;
}

void test5_partial_fill() {
    MatchingEngine me;
    me.addOrder(Order{1, 100, 10, Side::Buy, 0});
    auto trades = me.addOrder(Order{2, 100, 15, Side::Sell, 0});
    assert(trades.size() == 1);
    assert(trades[0].buyOrderId == 1);
    assert(trades[0].sellOrderId == 2);
    assert(trades[0].price == 100);
    assert(trades[0].quantity == 10);

    assert(me.totalBuyOrders() == 0);
    assert(me.totalSellOrders() == 1);
    assert(!me.hasOrder(1));
    assert(me.hasOrder(2));
    assert(me.sellBook[100].front().quantity == 5);
    assert(me.validateBook());
    std::cout << "Test 5 passed" << std::endl;
}

void test6_multiple_price_levels() {
    MatchingEngine me;
    me.addOrder(Order{1, 100, 5, Side::Sell, 0});
    me.addOrder(Order{2, 101, 5, Side::Sell, 0});

    auto trades = me.addOrder(Order{3, 102, 8, Side::Buy, 0});
    assert(trades.size() == 2);
    assert(trades[0].sellOrderId == 1);
    assert(trades[0].price == 100);
    assert(trades[0].quantity == 5);

    assert(trades[1].sellOrderId == 2);
    assert(trades[1].price == 101);
    assert(trades[1].quantity == 3);

    assert(me.totalBuyOrders() == 0);
    assert(me.totalSellOrders() == 1);
    assert(!me.hasOrder(1));
    assert(!me.hasOrder(3));
    assert(me.hasOrder(2));
    assert(me.sellBook[101].front().quantity == 2);
    assert(me.validateBook());
    std::cout << "Test 6 passed" << std::endl;
}

void test7_fifo_priority() {
    MatchingEngine me;
    me.addOrder(Order{1, 100, 5, Side::Buy, 0});
    me.addOrder(Order{2, 100, 5, Side::Buy, 0});

    auto trades = me.addOrder(Order{3, 100, 7, Side::Sell, 0});
    assert(trades.size() == 2);
    assert(trades[0].buyOrderId == 1);
    assert(trades[0].quantity == 5);
    assert(trades[1].buyOrderId == 2);
    assert(trades[1].quantity == 2);

    assert(me.totalBuyOrders() == 1);
    assert(me.totalSellOrders() == 0);
    assert(!me.hasOrder(1));
    assert(me.hasOrder(2));
    assert(me.buyBook[100].front().quantity == 3);
    assert(me.validateBook());
    std::cout << "Test 7 passed" << std::endl;
}

void test8_cancel_order_works() {
    MatchingEngine me;
    me.addOrder(Order{1, 100, 5, Side::Buy, 0});
    me.addOrder(Order{2, 100, 10, Side::Buy, 0});

    bool cancelled = me.cancelOrder(1);
    assert(cancelled);
    assert(!me.hasOrder(1));
    assert(me.hasOrder(2));
    assert(me.totalBuyOrders() == 1);
    assert(me.buyBook[100].front().orderId == 2);

    cancelled = me.cancelOrder(2);
    assert(cancelled);
    assert(me.buyBook.empty());
    assert(me.validateBook());
    std::cout << "Test 8 passed" << std::endl;
}

void test9_cancel_missing_order_returns_false() {
    MatchingEngine me;
    me.addOrder(Order{1, 100, 5, Side::Buy, 0});
    bool cancelled = me.cancelOrder(999);
    assert(!cancelled);
    assert(me.validateBook());
    std::cout << "Test 9 passed" << std::endl;
}

void test10_fully_filled_orders_removed() {
    MatchingEngine me;
    me.addOrder(Order{1, 100, 5, Side::Buy, 0});
    auto trades = me.addOrder(Order{2, 100, 5, Side::Sell, 0});
    assert(trades.size() == 1);
    assert(!me.hasOrder(1));
    assert(!me.hasOrder(2));
    assert(me.validateBook());
    std::cout << "Test 10 passed" << std::endl;
}

void test11_stress_test() {
    MatchingEngine me;
    std::mt19937 rng(42);
    std::uniform_int_distribution<int> sideDist(0, 1);
    std::uniform_int_distribution<int64_t> priceDist(90, 110);
    std::uniform_int_distribution<uint32_t> qtyDist(1, 100);
    std::uniform_int_distribution<int> actionDist(0, 9); // 80% add, 20% cancel

    std::vector<uint64_t> activeOrderIds;
    uint64_t nextOrderId = 1;

    for (int i = 0; i < 10000; ++i) {
        if (!activeOrderIds.empty() && actionDist(rng) < 2) {
            uint64_t orderIdToCancel = 0;
            while (!activeOrderIds.empty()) {
                std::uniform_int_distribution<size_t> idxDist(0, activeOrderIds.size() - 1);
                size_t idx = idxDist(rng);
                uint64_t id = activeOrderIds[idx];
                if (me.hasOrder(id)) {
                    orderIdToCancel = id;
                    activeOrderIds[idx] = activeOrderIds.back();
                    activeOrderIds.pop_back();
                    break;
                } else {
                    activeOrderIds[idx] = activeOrderIds.back();
                    activeOrderIds.pop_back();
                }
            }
            if (orderIdToCancel != 0) {
                bool cancelled = me.cancelOrder(orderIdToCancel);
                assert(cancelled);
            }
        } else {
            Side side = (sideDist(rng) == 0) ? Side::Buy : Side::Sell;
            int64_t price = priceDist(rng);
            uint32_t qty = qtyDist(rng);
            uint64_t orderId = nextOrderId++;

            Order o{orderId, price, qty, side, 0};
            me.addOrder(o);
            if (me.hasOrder(orderId)) {
                activeOrderIds.push_back(orderId);
            }
        }
    }

    assert(me.validateBook());
    std::cout << "Test 11 passed" << std::endl;
}

void runMatchingEngineTests() {
    std::cout << "=== Running MatchingEngine Correctness Tests ===" << std::endl;
    test1_buy_stored();
    test2_sell_stored();
    test3_buy_matches_lower_sell();
    test4_sell_matches_higher_buy();
    test5_partial_fill();
    test6_multiple_price_levels();
    test7_fifo_priority();
    test8_cancel_order_works();
    test9_cancel_missing_order_returns_false();
    test10_fully_filled_orders_removed();
    test11_stress_test();
    std::cout << "All MatchingEngine tests passed." << std::endl << std::endl;
}
