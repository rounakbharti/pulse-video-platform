import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Wait for initial JWT check

  const login = useCallback((token, userData, tenantData) => {
    localStorage.setItem('pulse_token', token);
    setUser(userData);
    setTenant(tenantData || userData.tenantId); // Sometimes embedded in user fetch
    setIsAuthenticated(true);
    
    // Wire up real-time socket
    connectSocket(userData.tenantId?._id || userData.tenantId);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('pulse_token');
    setUser(null);
    setTenant(null);
    setIsAuthenticated(false);
    disconnectSocket();
  }, []);

  // On initial mount, rehydrate the user context if a token exists
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('pulse_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me'); // Response interceptor unpacks this
        login(token, response.data.user, response.data.user.tenantId);
      } catch (err) {
        console.error('Failed session check:', err.message);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();

    // Listen for the Axios interceptor's "401 dead token" event
    const handleUnauthorized = () => logout();
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [login, logout]);

  // Expose role checks explicitly
  const isEditor = user?.role === 'editor' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  const value = {
    user,
    tenant,
    isAuthenticated,
    isLoading,
    login,
    logout,
    isEditor,
    isAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
