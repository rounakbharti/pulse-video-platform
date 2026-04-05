import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import {
  Loader2, ShieldAlert, CheckCircle2, UserCog, Users,
  Link2, RefreshCw, Copy, Check, Eye, Edit3, Crown,
} from 'lucide-react';
import { useAuth } from '../store/AuthContext';

// Role icon + color map
const ROLE_META = {
  admin:  { label: 'Admin',  cls: 'role-badge-admin',  icon: Crown,  desc: 'Full access + user management' },
  editor: { label: 'Editor', cls: 'role-badge-editor', icon: Edit3, desc: 'Upload + manage videos' },
  viewer: { label: 'Viewer', cls: 'role-badge-viewer', icon: Eye,   desc: 'Watch approved videos only' },
};

// ── Invite Panel ─────────────────────────────────────────────────────────────
const InvitePanel = () => {
  const [inviteCode, setInviteCode] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRotating, setIsRotating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const fetchInvite = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/admin/invite');
      setInviteCode(res.data.inviteCode);
      setTenantName(res.data.tenantName);
    } catch (err) {
      setError('Could not load invite link.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchInvite(); }, [fetchInvite]);

  const inviteLink = inviteCode
    ? `${window.location.origin}/join?code=${inviteCode}`
    : '';

  const handleCopy = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRotate = async () => {
    if (!window.confirm('Rotating the invite code will invalidate all existing invite links. Continue?')) return;
    setIsRotating(true);
    try {
      const res = await api.post('/admin/invite/rotate');
      setInviteCode(res.data.inviteCode);
    } catch (err) {
      setError('Failed to rotate invite code.');
    } finally {
      setIsRotating(false);
    }
  };

  return (
    <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--glass-bg)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 'var(--radius-lg)', backdropFilter: 'var(--glass-blur)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ padding: '0.6rem', background: 'rgba(99,102,241,0.15)', borderRadius: '0.5rem', color: 'var(--accent-primary)' }}>
          <Link2 size={20} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: 0 }}>Invite Team Members</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
            Share this link to let people join <strong style={{ color: 'white' }}>{tenantName}</strong> as a <strong style={{ color: 'var(--accent-primary)' }}>Viewer</strong>. Then promote them here.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
          <Loader2 className="animate-spin" size={24} style={{ color: 'var(--accent-primary)' }} />
        </div>
      ) : (
        <>
          {/* The invite link display */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
            <div style={{
              flex: 1,
              padding: '0.7rem 1rem',
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              fontFamily: 'monospace',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {inviteLink}
            </div>
            <button
              className="btn btn-primary"
              onClick={handleCopy}
              style={{ flexShrink: 0, gap: '0.35rem', fontSize: '0.82rem' }}
              title="Copy invite link"
            >
              {copied ? <><Check size={15} /> Copied!</> : <><Copy size={15} /> Copy</>}
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleRotate}
              disabled={isRotating}
              title="Rotate invite code (invalidates current link)"
              style={{ flexShrink: 0, fontSize: '0.82rem' }}
            >
              <RefreshCw size={15} className={isRotating ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* How-it-works steps */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            {[
              { step: '1', text: 'Copy & share the invite link' },
              { step: '2', text: 'They register with the link (joins as Viewer)' },
              { step: '3', text: 'Promote them to Editor or Admin below' },
            ].map(({ step, text }) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'var(--accent-primary)',
                  color: 'white', fontWeight: 700, fontSize: '0.7rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>{step}</span>
                {text}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ── Main Admin Page ───────────────────────────────────────────────────────────
export const AdminPage = () => {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.users);
    } catch (err) {
      setError(err.message || 'Failed to fetch users. Check your admin permissions.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchUsers();
    else setIsLoading(false);
  }, [isAdmin, fetchUsers]);

  const handleRoleChange = async (userId, newRole) => {
    setSuccessMsg('');
    setError('');
    setUpdatingId(userId);
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      setSuccessMsg(`Role updated to "${newRole}" successfully.`);
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to update role.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <ShieldAlert size={48} className="empty-icon text-danger" />
          <h2 className="empty-title">Access Denied</h2>
          <p className="empty-text">You must be a tenant administrator to access this panel.</p>
        </div>
      </div>
    );
  }

  const tenantName = user?.tenantId?.name || '';

  return (
    <div className="page-container animate-slide-up" style={{ maxWidth: '900px' }}>
      {/* Page header */}
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            padding: '0.85rem',
            background: 'rgba(99,102,241,0.15)',
            borderRadius: '0.75rem',
            color: 'var(--accent-primary)',
          }}>
            <UserCog size={28} />
          </div>
          <div>
            <h1 className="page-title">Admin Panel</h1>
            <p className="page-subtitle">
              Manage roles and invite team members for{' '}
              <strong style={{ color: 'white' }}>{tenantName || 'your organization'}</strong>
            </p>
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.5rem 0.85rem',
          background: 'var(--bg-surface)',
          borderRadius: '0.5rem',
          border: '1px solid var(--glass-border)',
        }}>
          <Users size={15} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            {users.length} member{users.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* ── Invite Panel ── */}
      <InvitePanel />

      {/* ── Alerts ── */}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
          <ShieldAlert size={16} /> {error}
        </div>
      )}
      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {/* ── Role Legend ── */}
      <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {Object.entries(ROLE_META).map(([key, { label, cls, icon: Icon, desc }]) => (
          <div key={key} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.45rem 0.85rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--glass-border)',
            borderRadius: '0.5rem',
          }}>
            <span className={`role-badge ${cls}`}><Icon size={11} style={{ marginRight: 3 }} />{label}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{desc}</span>
          </div>
        ))}
      </div>

      {/* ── User Table ── */}
      <div style={{ marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Users size={14} style={{ color: 'var(--accent-primary)' }} />
        Team Members
      </div>

      {isLoading ? (
        <div className="center-loader">
          <Loader2 className="animate-spin text-accent-primary" size={32} />
        </div>
      ) : (
        <div className="admin-table-wrap glass-panel" style={{ padding: 0 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Email</th>
                <th>Current Role</th>
                <th style={{ textAlign: 'right' }}>Promote / Demote</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const meta = ROLE_META[u.role] || ROLE_META.viewer;
                const isSelf = u._id === user._id;
                return (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: isSelf
                            ? 'linear-gradient(135deg, var(--success), #059669)'
                            : 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.78rem', fontWeight: 700, color: 'white', flexShrink: 0,
                        }}>
                          {u.name?.slice(0, 2).toUpperCase() || '?'}
                        </div>
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>{u.name}</span>
                          {isSelf && (
                            <span style={{ fontSize: '0.68rem', color: 'var(--accent-primary)', fontWeight: 600 }}>You</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{u.email}</td>
                    <td>
                      <span className={`role-badge ${meta.cls}`}>{meta.label}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {isSelf ? (
                        <span className="you-badge">← you (cannot change own role)</span>
                      ) : updatingId === u._id ? (
                        <Loader2 size={16} className="animate-spin text-accent-primary" />
                      ) : (
                        <select
                          className="role-select"
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        >
                          <option value="viewer">Viewer — read only</option>
                          <option value="editor">Editor — upload + manage</option>
                          <option value="admin">Admin — full control</option>
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })}

              {users.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    No team members yet. Share the invite link above to get people in.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
