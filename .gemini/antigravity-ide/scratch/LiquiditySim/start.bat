@echo off
echo Starting LiquidityWatch Backend...
start cmd /k "cd backend && node server.js"

echo Starting LiquidityWatch Frontend...
start cmd /k "cd frontend && npm run dev"

echo LiquidityWatch starting... Check the new terminal windows.
