#pragma once
#include "Order.h"
#include <array>
#include <atomic>
#include <cstddef>
#if defined(_MSC_VER)
#include <intrin.h>
#else
#include <immintrin.h>
#endif

template<size_t SIZE>
class LockFreeQueue {
private:
    std::array<Order, SIZE> buffer;
    alignas(64) std::atomic<uint64_t> head{0};
    alignas(64) std::atomic<uint64_t> tail{0};

public:
    size_t capacity() const {
        return SIZE;
    }

    size_t approximateSize() const {
        uint64_t t = tail.load(std::memory_order_relaxed);
        uint64_t h = head.load(std::memory_order_relaxed);
        return (t >= h) ? (t - h) : 0;
    }

    bool push(const Order& order) {
        uint64_t current_tail = tail.load(std::memory_order_relaxed);
        uint64_t current_head = head.load(std::memory_order_acquire);
        if (current_tail - current_head >= SIZE) {
            return false; // Queue full
        }
        buffer[current_tail % SIZE] = order;
        tail.store(current_tail + 1, std::memory_order_release);
        return true;
    }

    bool pop(Order& order) {
        uint64_t current_head = head.load(std::memory_order_relaxed);
        uint64_t current_tail = tail.load(std::memory_order_acquire);
        if (current_head == current_tail) {
            return false; // Queue empty
        }
        order = buffer[current_head % SIZE];
        head.store(current_head + 1, std::memory_order_release);
        return true;
    }
};
