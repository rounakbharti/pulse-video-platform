import axios from 'axios';

// Vite proxy handles the host routing locally.
// E.g., '/api/auth/login' -> 'http://localhost:5000/api/auth/login'
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT to every outgoing request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pulse_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response Interceptor: Globally handle 401 Unauthorized (expired token)
api.interceptors.response.use(
  (response) => response.data, // Unpack { success, data, message } wrapper automatically
  (error) => {
    if (error.response?.status === 401) {
      // Clean up dead tokens and force re-authentication gracefully
      localStorage.removeItem('pulse_token');
      // We dispatch a custom event that our AuthContext will listen to
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    
    // Extract standard message
    let message = error.response?.data?.message || 'An unexpected error occurred';
    
    // Extract granular express-validator array payloads if they exist
    if (error.response?.data?.data && Array.isArray(error.response.data.data)) {
      message = error.response.data.data.map(err => err.msg).join(', ');
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
