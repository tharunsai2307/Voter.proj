cmake_minimum_required(VERSION 3.15)
project(LiquiditySim CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include_directories(include)

set(SOURCES
    src/main.cpp
    src/MatchingEngine.cpp
    src/EventGenerator.cpp
    src/TelemetrySnapshot.cpp
    src/TelemetryServer.cpp
    tests/MatchingEngineTests.cpp
)

# Search for Threads library
find_package(Threads REQUIRED)

# Option to compile with uWebSockets
option(WITH_UWEBSOCKETS "Compile with uWebSockets server support" OFF)

if (WITH_UWEBSOCKETS)
    add_compile_definitions(WITH_UWEBSOCKETS)
    find_package(OpenSSL REQUIRED)
endif()

add_executable(LiquiditySim ${SOURCES})
target_link_libraries(LiquiditySim PRIVATE Threads::Threads)

if (WITH_UWEBSOCKETS)
    target_link_libraries(LiquiditySim PRIVATE OpenSSL::SSL OpenSSL::Crypto)
endif()
