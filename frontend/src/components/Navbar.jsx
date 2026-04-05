import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { LogOut, LayoutDashboard, Library, UploadCloud, ShieldAlert } from 'lucide-react';

export const Navbar = () => {
  const { user, tenant, logout, isEditor, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const navLinkClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <div className="navbar-brand">
          <span className="navbar-logo">Pulse</span>
          {tenant && (
            <span className="navbar-tenant-badge">{tenant.name || user?.tenantId?.name}</span>
          )}
        </div>

        {/* Nav links */}
        <nav className="navbar-nav">
          <NavLink to="/dashboard" className={navLinkClass}>
            <LayoutDashboard size={16} /> Dashboard
          </NavLink>
          <NavLink to="/library" className={navLinkClass}>
            <Library size={16} /> Library
          </NavLink>
          {isEditor && (
            <NavLink to="/upload" className={navLinkClass}>
              <UploadCloud size={16} /> Upload
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" className={navLinkClass}>
              <ShieldAlert size={16} /> Admin Panel
            </NavLink>
          )}
        </nav>

        {/* User info */}
        <div className="navbar-user">
          <div className="user-info">
            <p className="user-name">{user?.name}</p>
            <p className="user-role">{user?.role}</p>
          </div>
          <div
            className="user-avatar"
            title={user?.email}
          >
            {initials}
          </div>
          <button
            className="logout-btn"
            onClick={handleLogout}
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};
