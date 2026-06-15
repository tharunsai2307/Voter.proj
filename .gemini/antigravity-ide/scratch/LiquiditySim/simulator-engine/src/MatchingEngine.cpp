#include "MatchingEngine.h"
#include <stdexcept>
#include <algorithm>

std::vector<Trade> MatchingEngine::addOrder(Order order) {
    if (orderIndex.find(order.orderId) != orderIndex.end()) {
        throw std::invalid_argument("Duplicate active orderId");
    }
    if (order.quantity == 0) {
        throw std::invalid_argument("Order quantity must be greater than zero");
    }

    std::vector<Trade> trades;

    if (order.side == Side::Buy) {
        while (order.quantity > 0 && !sellBook.empty()) {
            auto bookIt = sellBook.begin();
            int64_t sellPrice = bookIt->first;
            if (order.price < sellPrice) {
                break;
            }

            auto& restingOrders = bookIt->second;
            while (order.quantity > 0 && !restingOrders.empty()) {
                auto& restingOrder = restingOrders.front();
                uint32_t matchQty = std::min(order.quantity, restingOrder.quantity);

                trades.push_back(Trade{
                    .buyOrderId = order.orderId,
                    .sellOrderId = restingOrder.orderId,
                    .price = sellPrice,
                    .quantity = matchQty
                });

                order.quantity -= matchQty;
                restingOrder.quantity -= matchQty;

                if (restingOrder.quantity == 0) {
                    orderIndex.erase(restingOrder.orderId);
                    restingOrders.pop_front();
                }
            }

            if (restingOrders.empty()) {
                sellBook.erase(bookIt);
            }
        }

        if (order.quantity > 0) {
            auto& queue = buyBook[order.price];
            queue.push_back(order);
            orderIndex[order.orderId] = OrderLocation{
                .side = Side::Buy,
                .price = order.price,
                .it = std::prev(queue.end())
            };
        }
    } else { // Side::Sell
        while (order.quantity > 0 && !buyBook.empty()) {
            auto bookIt = buyBook.begin();
            int64_t buyPrice = bookIt->first;
            if (order.price > buyPrice) {
                break;
            }

            auto& restingOrders = bookIt->second;
            while (order.quantity > 0 && !restingOrders.empty()) {
                auto& restingOrder = restingOrders.front();
                uint32_t matchQty = std::min(order.quantity, restingOrder.quantity);

                trades.push_back(Trade{
                    .buyOrderId = restingOrder.orderId,
                    .sellOrderId = order.orderId,
                    .price = buyPrice,
                    .quantity = matchQty
                });

                order.quantity -= matchQty;
                restingOrder.quantity -= matchQty;

                if (restingOrder.quantity == 0) {
                    orderIndex.erase(restingOrder.orderId);
                    restingOrders.pop_front();
                }
            }

            if (restingOrders.empty()) {
                buyBook.erase(bookIt);
            }
        }

        if (order.quantity > 0) {
            auto& queue = sellBook[order.price];
            queue.push_back(order);
            orderIndex[order.orderId] = OrderLocation{
                .side = Side::Sell,
                .price = order.price,
                .it = std::prev(queue.end())
            };
        }
    }

    return trades;
}

bool MatchingEngine::cancelOrder(uint64_t orderId) {
    auto idxIt = orderIndex.find(orderId);
    if (idxIt == orderIndex.end()) {
        return false;
    }

    OrderLocation loc = idxIt->second;
    if (loc.side == Side::Buy) {
        auto bookIt = buyBook.find(loc.price);
        if (bookIt != buyBook.end()) {
            bookIt->second.erase(loc.it);
            if (bookIt->second.empty()) {
                buyBook.erase(bookIt);
            }
        }
    } else {
        auto bookIt = sellBook.find(loc.price);
        if (bookIt != sellBook.end()) {
            bookIt->second.erase(loc.it);
            if (bookIt->second.empty()) {
                sellBook.erase(bookIt);
            }
        }
    }

    orderIndex.erase(idxIt);
    return true;
}

size_t MatchingEngine::buyLevels() const {
    return buyBook.size();
}

size_t MatchingEngine::sellLevels() const {
    return sellBook.size();
}

size_t MatchingEngine::totalBuyOrders() const {
    size_t count = 0;
    for (const auto& [price, list] : buyBook) {
        count += list.size();
    }
    return count;
}

size_t MatchingEngine::totalSellOrders() const {
    size_t count = 0;
    for (const auto& [price, list] : sellBook) {
        count += list.size();
    }
    return count;
}

bool MatchingEngine::hasOrder(uint64_t orderId) const {
    return orderIndex.find(orderId) != orderIndex.end();
}

bool MatchingEngine::validateBook() const {
    size_t orderCountInBooks = 0;
    std::unordered_map<uint64_t, int> seenIds;

    // Validate Buy Book
    for (auto bookIt = buyBook.begin(); bookIt != buyBook.end(); ++bookIt) {
        int64_t price = bookIt->first;
        if (bookIt->second.empty()) {
            return false;
        }
        for (auto listIt = bookIt->second.begin(); listIt != bookIt->second.end(); ++listIt) {
            const Order& order = *listIt;
            orderCountInBooks++;

            if (order.quantity == 0) return false;
            if (order.side != Side::Buy) return false;
            if (order.price != price) return false;
            if (++seenIds[order.orderId] > 1) return false;

            auto idxIt = orderIndex.find(order.orderId);
            if (idxIt == orderIndex.end()) return false;

            const OrderLocation& loc = idxIt->second;
            if (loc.side != Side::Buy) return false;
            if (loc.price != price) return false;
            if (loc.it != listIt) return false;
        }
    }

    // Validate Sell Book
    for (auto bookIt = sellBook.begin(); bookIt != sellBook.end(); ++bookIt) {
        int64_t price = bookIt->first;
        if (bookIt->second.empty()) {
            return false;
        }
        for (auto listIt = bookIt->second.begin(); listIt != bookIt->second.end(); ++listIt) {
            const Order& order = *listIt;
            orderCountInBooks++;

            if (order.quantity == 0) return false;
            if (order.side != Side::Sell) return false;
            if (order.price != price) return false;
            if (++seenIds[order.orderId] > 1) return false;

            auto idxIt = orderIndex.find(order.orderId);
            if (idxIt == orderIndex.end()) return false;

            const OrderLocation& loc = idxIt->second;
            if (loc.side != Side::Sell) return false;
            if (loc.price != price) return false;
            if (loc.it != listIt) return false;
        }
    }

    if (orderIndex.size() != orderCountInBooks) return false;

    return true;
}
