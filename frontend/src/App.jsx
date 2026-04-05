import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Global Data Providers
import { AuthProvider } from './store/AuthContext';
import { VideoProvider } from './store/VideoContext';

// Protected Wrap & Role Guards
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleGate } from './components/RoleGate';
import { Navbar } from './components/Navbar';

// Public Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { JoinPage } from './pages/JoinPage';

// Protected Pages
import { DashboardPage } from './pages/DashboardPage';
import { LibraryPage } from './pages/LibraryPage';
import { UploadPage } from './pages/UploadPage';
import { PlayerPage } from './pages/PlayerPage';
import { AdminPage } from './pages/AdminPage';

/**
 * Standard Application Shell for Authenticated Routes
 * Provides global navigation without re-rendering per page transition
 */
const AppLayout = () => {
  return (
    <VideoProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">
          {/* Outlet safely injects the matched child Route */}
          <Routes>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="library" element={<LibraryPage />} />
            
            {/* Strict RBAC natively locking the UI Router Path */}
            <Route 
              path="upload" 
              element={
                <RoleGate allowedRoles={['editor', 'admin']} fallback="You must be an Editor or Admin to upload videos.">
                  <UploadPage />
                </RoleGate>
              } 
            />
            
            <Route 
              path="admin" 
              element={
                <RoleGate allowedRoles={['admin']} fallback="You must be an Administrator.">
                  <AdminPage />
                </RoleGate>
              } 
            />
            
            <Route path="player/:id" element={<PlayerPage />} />
            
            {/* Default invalid routes back to the dashboard securely */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </VideoProvider>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Endpoints */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/join" element={<JoinPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Secure Endpoints (Locked behind JWT) */}
          <Route path="/" element={<ProtectedRoute />}>
             {/* All nested routes inherit index wildcard matching utilizing AppLayout */}
            <Route path="*" element={<AppLayout />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
