# LiquiditySim Live Telemetry React Dashboard

A modern trading-terminal styled dashboard built with React, Vite, Tailwind CSS, Framer Motion, and Recharts to visualize real-time high-resolution metrics from the `LiquiditySim` simulator.

## Getting Started

### 1. Install Dependencies
Make sure you have Node.js installed, then execute:
```bash
npm install
```

### 2. Run Dashboard Locally
Start the local development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Connection Requirement
The dashboard connects to the backend over WebSockets (`ws://localhost:9001/metrics`).

Make sure to run your C++ simulator backend first in dashboard mode:
```bash
./LiquiditySim dashboard
```
