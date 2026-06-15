@echo off
call "C:\Program Files\Microsoft Visual Studio\18\Community\VC\Auxiliary\Build\vcvarsall.bat" x64
cl.exe /EHsc /O2 /std:c++20 main.cpp /Fe"build\LiquidityWatchAnalyzer.exe"
