import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 9001, path: '/metrics' });

console.log('Mock LiquiditySim Backend listening on ws://localhost:9001/metrics');

let ordersProduced = 1000;
let ordersConsumed = 1000;
let tradesExecuted = 450;
let pushFailures = 0;
let popFailures = 5;

const regimes = ['Normal', 'HighVolatility', 'LowLiquidity', 'FlashCrash'];
let regimeIndex = 0;

setInterval(() => {
    // Cycle regimes every 15 seconds
    if (Math.random() < 0.08) {
        regimeIndex = (regimeIndex + 1) % regimes.length;
    }
    const regime = regimes[regimeIndex];

    let deltaProduced = 0;
    let deltaConsumed = 0;
    let deltaTrades = 0;
    let avgLat = 0;
    let p99Lat = 0;
    let maxLat = 0;

    switch (regime) {
        case 'Normal':
            deltaProduced = Math.floor(1500 + Math.random() * 500);
            deltaConsumed = deltaProduced;
            deltaTrades = Math.floor(deltaProduced * 0.45);
            avgLat = 1.0 + Math.random() * 0.5;
            p99Lat = 2.5 + Math.random() * 1.0;
            maxLat = 8.0 + Math.random() * 5.0;
            break;
        case 'HighVolatility':
            deltaProduced = Math.floor(3000 + Math.random() * 1000);
            deltaConsumed = deltaProduced;
            deltaTrades = Math.floor(deltaProduced * 0.65);
            avgLat = 2.5 + Math.random() * 1.5;
            p99Lat = 6.0 + Math.random() * 3.0;
            maxLat = 25.0 + Math.random() * 15.0;
            break;
        case 'LowLiquidity':
            deltaProduced = Math.floor(100 + Math.random() * 50);
            deltaConsumed = deltaProduced;
            deltaTrades = Math.floor(deltaProduced * 0.15);
            avgLat = 0.5 + Math.random() * 0.2;
            p99Lat = 1.2 + Math.random() * 0.4;
            maxLat = 3.5 + Math.random() * 1.5;
            break;
        case 'FlashCrash':
            deltaProduced = Math.floor(5000 + Math.random() * 2000);
            deltaConsumed = deltaProduced;
            deltaTrades = Math.floor(deltaProduced * 0.85);
            avgLat = 5.5 + Math.random() * 3.5;
            p99Lat = 15.0 + Math.random() * 10.0;
            maxLat = 80.0 + Math.random() * 50.0;
            break;
    }

    ordersProduced += deltaProduced;
    ordersConsumed += deltaConsumed;
    tradesExecuted += deltaTrades;
    if (Math.random() < 0.05) pushFailures += Math.floor(Math.random() * 3);

    const snapshot = {
        ordersProduced,
        ordersConsumed,
        tradesExecuted,
        pushFailures,
        popFailures,
        finalBuyOrders: Math.floor(10 + Math.random() * 100),
        finalSellOrders: Math.floor(5 + Math.random() * 50),
        throughputOrdersPerSecond: deltaConsumed,
        averageLatencyMicros: avgLat,
        p50LatencyMicros: avgLat * 0.8,
        p90LatencyMicros: avgLat * 1.5,
        p99LatencyMicros: p99Lat,
        maxLatencyMicros: maxLat,
        regimeName: regime
    };

    const message = JSON.stringify(snapshot);
    wss.clients.forEach(client => {
        if (client.readyState === 1) {
            client.send(message);
        }
    });
}, 1000);
