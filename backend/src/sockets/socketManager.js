'use strict';

const logger = require('../utils/logger');
const { SOCKET_EVENTS } = require('../config/constants');

/**
 * Initialises Socket.io connection handling.
 * Each tenant gets its own room: `tenant:<tenantId>`
 * Users join the room after authenticating their socket token.
 *
 * Full room auth + event emission helpers are wired in Step 6
 * when the processing worker is added. This stub registers
 * the connection event so the server starts cleanly.
 */
const initSocketManager = (io) => {
  // Make io globally accessible to the processing worker
  global._io = io;

  io.on('connection', (socket) => {
    logger.debug(`Socket connected: ${socket.id}`);

    socket.on(SOCKET_EVENTS.JOIN_TENANT, ({ tenantId }) => {
      if (!tenantId) return;
      const room = `tenant:${tenantId}`;
      socket.join(room);
      logger.debug(`Socket ${socket.id} joined room ${room}`);
    });

    socket.on('disconnect', (reason) => {
      logger.debug(`Socket ${socket.id} disconnected: ${reason}`);
    });
  });

  logger.info('Socket.io manager initialised');
};

/**
 * Emit an event to all users currently subscribed to a specific tenant room.
 * Safely handles cases where IO hasn't mounted yet or no one is connected.
 */
const emitToTenant = (tenantId, event, payload) => {
  if (!global._io) {
    logger.warn('Socket.io not initialised, failed to emit event');
    return;
  }
  const room = `tenant:${tenantId}`;
  global._io.to(room).emit(event, payload);
};

module.exports = {
  initSocketManager,
  emitToTenant,
};
