@echo off
call "C:\Program Files\Microsoft Visual Studio\18\Community\VC\Auxiliary\Build\vcvarsall.bat" x64
cl.exe /EHsc /O2 /std:c++20 src/main.cpp src/MatchingEngine.cpp src/EventGenerator.cpp src/TelemetrySnapshot.cpp src/TelemetryServer.cpp tests/MatchingEngineTests.cpp /I include /Fe"build\LiquiditySim.exe"
