#include "TelemetryServer.h"
#include <iostream>
#include <vector>
#include <thread>
#include <mutex>
#include <algorithm>

#ifdef WITH_UWEBSOCKETS
#include "App.h"

struct TelemetryServer::Impl {
    struct PerSocketData {};
    typedef uWS::WebSocket<false, true, PerSocketData> WebSocketType;

    uWS::App* app = nullptr;
    std::vector<WebSocketType*> sockets;
    std::mutex socketsMutex;
    std::thread serverThread;
    us_listen_socket_t* listenSocket = nullptr;
    bool running = false;

    ~Impl() {
        if (app) delete app;
    }
};

TelemetryServer::TelemetryServer(int port) : port(port), impl(std::make_unique<Impl>()) {}

TelemetryServer::~TelemetryServer() {
    stop();
}

void TelemetryServer::start() {
    impl->running = true;
    impl->serverThread = std::thread([this]() {
        impl->app = new uWS::App();
        impl->app->ws<typename Impl::PerSocketData>("/metrics", {
            .compression = uWS::SHARED_COMPRESSOR,
            .maxPayloadLength = 16 * 1024,
            .idleTimeout = 120,
            .open = [this](auto* ws) {
                std::cout << "[WebSocket] Client connected" << std::endl;
                std::lock_guard<std::mutex> lock(impl->socketsMutex);
                impl->sockets.push_back(ws);
            },
            .message = [](auto* ws, std::string_view message, uWS::OpCode opCode) {
                // Echo or process message
            },
            .drain = [](auto* ws) {
                // Handle backpressure
            },
            .close = [this](auto* ws, int code, std::string_view message) {
                std::cout << "[WebSocket] Client disconnected" << std::endl;
                std::lock_guard<std::mutex> lock(impl->socketsMutex);
                auto it = std::find(impl->sockets.begin(), impl->sockets.end(), ws);
                if (it != impl->sockets.end()) {
                    impl->sockets.erase(it);
                }
            }
        }).listen(port, [this](auto* token) {
            if (token) {
                std::cout << "[WebSocket] Server listening on port " << port << std::endl;
                impl->listenSocket = token;
            } else {
                std::cerr << "[WebSocket] Failed to listen on port " << port << std::endl;
            }
        }).run();
    });
}

void TelemetryServer::stop() {
    if (!impl->running) return;
    impl->running = false;
    if (impl->listenSocket) {
        us_listen_socket_close(0, impl->listenSocket);
        impl->listenSocket = nullptr;
    }
    if (impl->serverThread.joinable()) {
        impl->serverThread.join();
    }
}

void TelemetryServer::broadcast(const std::string& message) {
    std::lock_guard<std::mutex> lock(impl->socketsMutex);
    for (auto* ws : impl->sockets) {
        ws->send(message, uWS::OpCode::TEXT);
    }
}

#else // Fallback stub

struct TelemetryServer::Impl {
    bool running = false;
};

TelemetryServer::TelemetryServer(int port) : port(port), impl(std::make_unique<Impl>()) {}
TelemetryServer::~TelemetryServer() {}

void TelemetryServer::start() {
    impl->running = true;
    std::cout << "[TelemetryServer] Running in console fallback mode (uWebSockets not enabled)." << std::endl;
}

void TelemetryServer::stop() {
    impl->running = false;
}

void TelemetryServer::broadcast(const std::string& message) {
    // Broadcast is a stub in console mode (main thread already logs snapshot)
}

#endif
