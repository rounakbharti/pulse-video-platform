import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import api from '../services/api';
import { Loader2, AlertCircle, Users, CheckCircle, ArrowLeft } from 'lucide-react';

/**
 * JoinPage — accessed via an invite link:
 *   /join?code=<inviteCode>
 *
 * Flow:
 * 1. On mount, validate the invite code and fetch the org name.
 * 2. Show a registration form pre-labelled with the org name.
 * 3. On submit, POST /api/auth/join — creates user as VIEWER.
 * 4. Admin can promote them later from /admin.
 */
export const JoinPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const inviteCode = searchParams.get('code') || '';

  const [orgName, setOrgName] = useState('');
  const [codeValid, setCodeValid] = useState(null); // null=loading, true, false
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [manualCode, setManualCode] = useState('');

  // Validate invite code on mount or when inviteCode changes
  useEffect(() => {
    if (!inviteCode) {
      setCodeValid(null);
      return;
    }

    const validateCode = async () => {
      try {
        const res = await api.get(`/auth/invite/${inviteCode}`);
        setOrgName(res.data.tenantName);
        setCodeValid(true);
      } catch (err) {
        setCodeValid(false);
        setError(err.message || 'This invite link is invalid or has expired.');
      }
    };

    validateCode();
  }, [inviteCode]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/join', {
        ...formData,
        inviteCode,
      });
      login(res.data.token, res.data.user, res.data.tenant);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to join. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="glass-panel auth-card animate-slide-up">
        <div className="auth-logo-wrap">
          <span className="auth-logo">Pulse</span>
        </div>

        {/* No code provided — show input form to paste code/link */}
        {codeValid === null && !inviteCode && (
          <div style={{ textAlign: 'center' }}>
            <div className="auth-header">
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <div style={{ padding: '0.85rem', background: 'rgba(99,102,241,0.15)', borderRadius: '50%' }}>
                  <Users size={28} style={{ color: 'var(--accent-primary)' }} />
                </div>
              </div>
              <h1 className="auth-title">Join a Workspace</h1>
              <p className="auth-sub">Paste your invite link or code below to join an existing organization.</p>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!manualCode.trim()) return;
              // Extract code from link if a full URL is pasted
              let extractedCode = manualCode.trim();
              if (extractedCode.includes('=')) {
                extractedCode = extractedCode.split('=').pop();
              } else if (extractedCode.includes('/')) {
                extractedCode = extractedCode.split('/').pop();
              }
              navigate(`/join?code=${extractedCode}`);
            }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-field">
                <input
                  type="text"
                  required
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="e.g. https://domain.com/join?code=xyz or xyz"
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Continue
              </button>
            </form>
          </div>
        )}

        {/* Loading invite code */}
        {codeValid === null && inviteCode && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <Loader2 className="animate-spin text-accent-primary" size={32} style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Validating invite link…</p>
          </div>
        )}

        {/* Invalid code */}
        {codeValid === false && inviteCode && (
          <div style={{ textAlign: 'center' }}>
            <div className="alert alert-danger">{error}</div>
            <button onClick={() => navigate('/join')} className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
              Try another code
            </button>
            <Link to="/register" className="btn btn-secondary" style={{ marginTop: '1rem', width: '100%', display: 'flex', justifyContent: 'center' }}>
              <ArrowLeft size={14} /> Create a new workspace instead
            </Link>
          </div>
        )}

        {/* Valid code — show join form */}
        {codeValid === true && (
          <>
            <div className="auth-header">
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <div style={{ padding: '0.85rem', background: 'rgba(99,102,241,0.15)', borderRadius: '50%' }}>
                  <Users size={28} style={{ color: 'var(--accent-primary)' }} />
                </div>
              </div>
              <h1 className="auth-title">Join {orgName}</h1>
              <p className="auth-sub">
                You've been invited to join <strong style={{ color: 'white' }}>{orgName}</strong> on Pulse.
                You'll join as a <strong style={{ color: 'var(--accent-primary)' }}>Viewer</strong> — your admin can upgrade your role.
              </p>
            </div>

            {error && (
              <div className="alert alert-danger">
                <AlertCircle size={15} /> {error}
              </div>
            )}

            {/* Role info strip */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', padding: '0.75rem', background: 'rgba(99,102,241,0.08)', borderRadius: '0.625rem', border: '1px solid rgba(99,102,241,0.2)' }}>
              <CheckCircle size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Starting role: Viewer</strong><br />
                Viewers can browse and watch videos assigned to them. The admin of <em>{orgName}</em> can promote you to Editor or Admin.
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-field">
                <label htmlFor="name">Your full name <span className="required">*</span></label>
                <input
                  id="name"
                  type="text"
                  required
                  minLength={2}
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                />
              </div>
              <div className="form-field">
                <label htmlFor="email">Email address <span className="required">*</span></label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@acme.com"
                />
              </div>
              <div className="form-field">
                <label htmlFor="password">Password <span className="required">*</span></label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                />
              </div>

              <button type="submit" disabled={isLoading} className="btn btn-primary" style={{ width: '100%' }}>
                {isLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <><Users size={16} /> Join {orgName}</>
                )}
              </button>
            </form>
          </>
        )}

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};
