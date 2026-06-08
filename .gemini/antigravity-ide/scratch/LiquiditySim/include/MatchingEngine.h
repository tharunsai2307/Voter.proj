#pragma once
#include "Order.h"
#include "Trade.h"
#include <map>
#include <unordered_map>
#include <list>
#include <vector>

struct OrderLocation {
    Side side;
    int64_t price;
    std::list<Order>::iterator it;
};

class MatchingEngine {
public:
    std::map<int64_t, std::list<Order>, std::greater<int64_t>> buyBook;
    std::map<int64_t, std::list<Order>> sellBook;
    std::unordered_map<uint64_t, OrderLocation> orderIndex;

    std::vector<Trade> addOrder(Order order);
    bool cancelOrder(uint64_t orderId);
    size_t buyLevels() const;
    size_t sellLevels() const;
    size_t totalBuyOrders() const;
    size_t totalSellOrders() const;
    bool hasOrder(uint64_t orderId) const;
    bool validateBook() const;
};
