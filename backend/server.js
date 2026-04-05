'use strict';

const http = require('http');
const { Server: SocketServer } = require('socket.io');

const connectDB = require('./src/config/db');
const { port, cors: corsConfig } = require('./src/config/env');
const createApp = require('./src/app');
const logger = require('./src/utils/logger');
const { initSocketManager } = require('./src/sockets/socketManager');

const bootstrap = async () => {
  // 1. Connect to MongoDB before accepting any traffic
  await connectDB();

  // 2. Create Express app
  const app = createApp();

  // 3. Attach Socket.io to the same HTTP server
  const httpServer = http.createServer(app);
  const io = new SocketServer(httpServer, {
    cors: {
      origin: true, // Dynamically accept the incoming origin
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // 4. Initialise Socket manager (registers connection handlers, room logic)
  initSocketManager(io);

  // 5. Start listening
  httpServer.listen(port, () => {
    logger.info(`🚀 Pulse API running on http://localhost:${port}`);
    logger.info(`🔌 Socket.io attached to the same server`);
  });

  // 6. Graceful shutdown
  const shutdown = (signal) => {
    logger.info(`${signal} received — shutting down gracefully`);
    httpServer.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
