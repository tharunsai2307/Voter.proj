// src/analytics/intelligenceService.js
// Core Phase 1 analytics: Liquidity Shock Detector, Market Regime Engine, Event Timeline, Market Health.

import { getSeries, getLatest } from './metricsBuffer.js';

// In‑memory storage for results (non‑persistent when USE_DB=false)
let shocks = [];
let timeline = [];
let currentRegime = { regime: 'Initializing', confidence: 0 };
let marketHealth = { score: 0, description: 'Calculating…' };

// Helper: compute simple moving average over last N seconds
function avgOver(series, seconds) {
  const now = Date.now();
  const cutoff = now - seconds * 1000;
  const filtered = series.filter(p => p.ts >= cutoff);
  if (!filtered.length) return null;
  const sum = filtered.reduce((a, b) => a + (b.value || 0), 0);
  return sum / filtered.length;
}

// Detect liquidity shocks
function detectLiquidityShocks(cache) {
  const symbols = Object.keys(cache);
  const newShocks = [];
  for (const sym of symbols) {
    const series = getSeries(cache, sym);
    if (!series || !Array.isArray(series) || series.length < 2) continue;
    const latest = series[series.length - 1];
    const prev = series[series.length - 2];
    if (!latest || !prev) continue;

    // Compute deltas safely
    const latestSpread = latest.spread !== undefined && latest.spread !== null ? latest.spread : 0;
    const prevSpread = prev.spread !== undefined && prev.spread !== null ? prev.spread : 0;
    const latestVol = latest.volume !== undefined && latest.volume !== null ? latest.volume : 0;
    const prevVol = prev.volume !== undefined && prev.volume !== null ? prev.volume : 0;
    const latestLiq = latest.liquidity !== undefined && latest.liquidity !== null ? latest.liquidity : 0;
    const prevLiq = prev.liquidity !== undefined && prev.liquidity !== null ? prev.liquidity : 0;

    const spreadDelta = ((latestSpread - prevSpread) / (prevSpread || 1)) * 100;
    const volDelta = ((latestVol - prevVol) / (prevVol || 1)) * 100;
    const liqDelta = ((latestLiq - prevLiq) / (prevLiq || 1)) * 100;
    // Simple thresholds (adjustable later)
    if (Math.abs(spreadDelta) > 200) {
      newShocks.push({
        symbol: sym,
        type: 'SpreadWiden',
        changePct: spreadDelta.toFixed(1),
        description: `Spread increased ${spreadDelta.toFixed(1)}% within the last update.`,
        timestamp: Date.now()
      });
    }
    if (volDelta > 150) {
      newShocks.push({
        symbol: sym,
        type: 'VolumeSpike',
        changePct: volDelta.toFixed(1),
        description: `Volume spiked ${volDelta.toFixed(1)}% in the last update.`,
        timestamp: Date.now()
      });
    }
    if (liqDelta < -70) {
      newShocks.push({
        symbol: sym,
        type: 'LiquidityDrop',
        changePct: liqDelta.toFixed(1),
        description: `Liquidity dropped ${Math.abs(liqDelta).toFixed(1)}% instantly.`,
        timestamp: Date.now()
      });
    }
  }
  // Keep only recent shocks (last 5 min)
  const cutoff = Date.now() - 5 * 60 * 1000;
  shocks = shocks.concat(newShocks).filter(s => s.timestamp >= cutoff);

  // Add to timeline
  newShocks.forEach(s => {
    timeline.push({
      ts: s.timestamp,
      message: `Liquidity Shock – ${s.symbol}: ${s.description}`
    });
  });
}

// Simple market regime detection (trend vs range vs volatile)
function detectRegime(cache) {
  // Use price series of all symbols, compute average price change over 5 min
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  let totalChange = 0;
  let count = 0;
  for (const sym of Object.keys(cache)) {
    const series = getSeries(cache, sym);
    if (series.length < 2) continue;
    const recent = series.filter(p => now - p.ts <= windowMs);
    if (recent.length < 2) continue;
    const first = recent[0];
    const last = recent[recent.length - 1];
    const change = ((last.price - first.price) / (first.price || 1)) * 100;
    totalChange += change;
    count++;
  }
  const avgChange = count ? totalChange / count : 0;
  // Volatility proxy – standard deviation of recent price changes
  let volatility = 0;
  if (count) {
    const changes = [];
    for (const sym of Object.keys(cache)) {
      const series = getSeries(cache, sym).filter(p => now - p.ts <= windowMs);
      if (series.length < 2) continue;
      for (let i = 1; i < series.length; i++) {
        const pct = ((series[i].price - series[i - 1].price) / (series[i - 1].price || 1)) * 100;
        changes.push(pct);
      }
    }
    const mean = changes.reduce((a, b) => a + b, 0) / changes.length;
    const variance = changes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / changes.length;
    volatility = Math.sqrt(variance);
  }
  let regime = 'Neutral';
  let confidence = 0;
  if (Math.abs(avgChange) > 1.5) {
    regime = avgChange > 0 ? 'Trending Up' : 'Trending Down';
    confidence = Math.min(100, Math.abs(avgChange) * 20);
  } else if (volatility > 2) {
    regime = 'Volatile';
    confidence = Math.min(100, volatility * 10);
  } else if (Math.abs(avgChange) < 0.3 && volatility < 1) {
    regime = 'Range Bound';
    confidence = 80;
  }
  currentRegime = { regime, confidence: Math.round(confidence) };
  // Timeline entry
  timeline.push({ ts: now, message: `Market Regime changed to ${regime}` });
}

// Market health: average liquidity score (0‑100) across symbols
function computeMarketHealth(cache) {
  let sum = 0;
  let cnt = 0;
  for (const sym of Object.keys(cache)) {
    const latest = getLatest(cache, sym);
    if (!latest) continue;
    // Assume liquidity metric is 0‑100 already; if not, normalize (placeholder)
    const liq = latest.liquidity || 0;
    sum += liq;
    cnt++;
  }
  const avg = cnt ? sum / cnt : 0;
  let label = 'Neutral';
  if (avg >= 80) label = 'Healthy';
  else if (avg >= 60) label = 'Good';
  else if (avg >= 40) label = 'Warning';
  else label = 'Risky';
  marketHealth = { score: Math.round(avg), description: label };
}

// Throttled main loop – runs every 500 ms
function startAnalytics(cache) {
  setInterval(() => {
    detectLiquidityShocks(cache);
    detectRegime(cache);
    computeMarketHealth(cache);
    // keep timeline size reasonable (last 24 h)
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    timeline = timeline.filter(e => e.ts >= cutoff);
  }, 500);
}

export function initAnalytics(cache) {
  startAnalytics(cache);
}

// Export getters for API routes
export function getShocks() { return shocks; }
export function getRegime() { return currentRegime; }
export function getTimeline() { return timeline; }
export function getHealth() { return marketHealth; }
