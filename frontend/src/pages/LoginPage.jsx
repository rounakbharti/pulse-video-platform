import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import api from '../services/api';
import { Loader2, AlertCircle, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials and try again.');
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
        <div className="auth-header">
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-sub">Sign in to your workspace to continue.</p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={16} className="text-danger" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div className="form-field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </div>
          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={isLoading} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <><Lock size={16} /> Sign In</>}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Register organization</Link>
          <br />
          <span style={{ fontSize: '0.82rem', marginTop: '0.5rem', display: 'inline-block' }}>
            Got an invite link? <Link to="/join" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Join existing org →</Link>
          </span>
        </p>
      </div>
    </div>
  );
};
