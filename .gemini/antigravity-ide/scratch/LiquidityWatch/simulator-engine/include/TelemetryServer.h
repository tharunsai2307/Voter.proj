#pragma once
#include <string>
#include <memory>

class TelemetryServer {
private:
    struct Impl;
    std::unique_ptr<Impl> impl;
    int port;

public:
    TelemetryServer(int port);
    ~TelemetryServer();
    void start();
    void stop();
    void broadcast(const std::string& message);
};
