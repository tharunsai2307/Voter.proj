// src/analytics/metricsBuffer.js
// In‑memory circular buffer for per‑symbol metrics with 7‑day retention.

const DAY_MS = 24 * 60 * 60 * 1000;
const RETENTION_MS = 7 * DAY_MS;

/**
 * Store a metric snapshot.
 * @param {Object} cache Global metrics cache from server.js
 * @param {Object} data Metric object emitted by C++ analyzer (must contain `symbol`, `ts` timestamp in ms, plus numeric fields).
 */
export function addMetric(cache, data) {
  if (!data || !data.symbol) return;
  const now = Date.now();
  // Ensure we have an array for this symbol
  if (!cache[data.symbol]) cache[data.symbol] = [];
  const series = cache[data.symbol];
  series.push({
    ts: data.ts || now,
    price: data.price,
    volume: data.volume,
    spread: data.spread,
    liquidity: data.liquidity,
  });
  // Purge old entries beyond retention window
  while (series.length && now - series[0].ts > RETENTION_MS) {
    series.shift();
  }
}

/**
 * Retrieve the series for a symbol.
 */
export function getSeries(cache, symbol) {
  return cache[symbol] || [];
}

/**
 * Helper to get the most recent metric for a symbol.
 */
export function getLatest(cache, symbol) {
  const series = getSeries(cache, symbol);
  return series.length ? series[series.length - 1] : null;
}

/**
 * Retrieve all symbols currently tracked.
 */
export function getAllSymbols(cache) {
  return Object.keys(cache);
}

export const metricsBuffer = {
  addMetric,
  getSeries,
  getLatest,
  getAllSymbols,
};
