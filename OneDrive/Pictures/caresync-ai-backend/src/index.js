// src/index.js – server entry point with Socket.io integration
import http from 'http';
import app from './app.js';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config/env.js';

const PORT = config.port || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Export io for use elsewhere
export { io };

server.listen(PORT, () => {
  console.log('=======================================================');
  console.log('🏥 CARESYNC AI SMART HOSPITAL COMMAND NODE.JS SERVER');
  console.log(`🚀 CLINICAL SERVICES ACTIVE: http://localhost:${PORT}`);
  console.log(`📡 MONITORING API HEALTH: http://localhost:${PORT}/health`);
  console.log('=======================================================');
});
