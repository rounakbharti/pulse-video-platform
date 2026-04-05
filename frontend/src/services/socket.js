import { io } from 'socket.io-client';

// Establish connection only when specifically requested.
// We proxy the socket correctly through Vite, so no URL hardcoding needed.
let socket = null;

export const connectSocket = (tenantId) => {
  if (socket) return socket;

  socket = io('/', {
    path: '/socket.io',
    transports: ['websocket'],
    autoConnect: true,
  });

  socket.on('connect', () => {
    // Immediately join the tenant room securely isolating broadcasts
    socket.emit('join-tenant', { tenantId });
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
