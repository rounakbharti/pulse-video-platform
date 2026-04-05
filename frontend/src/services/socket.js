import { io } from 'socket.io-client';

// Establish connection only when specifically requested.
// We proxy the socket correctly through Vite, so no URL hardcoding needed.
let socket = null;

export const connectSocket = (tenantId) => {
  if (socket) return socket;

  // Extract the base host (e.g., https://pulse-api-xyz.onrender.com) by stripping /api 
  // or default to '/' if using Vite proxy locally.
  const socketUrl = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api', '') 
    : '/';

  socket = io(socketUrl, {
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
