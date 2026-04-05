import React from 'react';
import { useAuth } from '../store/AuthContext';
import { ShieldAlert } from 'lucide-react';

/**
 * UI Component guard.
 * Only renders its children if the current user possesses the required role.
 * Otherwise, renders an optional fallback (or nothing).
 */
export const RoleGate = ({ allowedRoles, children, fallback = null }) => {
  const { user } = useAuth();
  
  if (!user || (!allowedRoles.includes(user.role) && !allowedRoles.includes('any'))) {
    return fallback ? (
      <div className="glass-card flex w-full flex-col items-center justify-center p-8 text-center">
        <ShieldAlert className="mb-4 text-warning" size={32} />
        <h3 className="text-lg font-medium text-white">Access Restricted</h3>
        <p className="text-text-secondary mt-1">{fallback}</p>
      </div>
    ) : null;
  }

  return <>{children}</>;
};
