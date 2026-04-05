import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import api from '../services/api';
import { Loader2, AlertCircle, Building2 } from 'lucide-react';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    tenantName: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/register', formData);
      login(res.data.token, res.data.user, res.data.tenant);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
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
          <h1 className="auth-title">Create workspace</h1>
          <p className="auth-sub">Register a new tenant organization on Pulse.<br />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Got an invite link? <Link to="/join" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Join existing org →</Link></span>
          </p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div className="form-field">
            <label htmlFor="tenantName">Organization name <span className="required">*</span></label>
            <input
              id="tenantName"
              type="text"
              required
              minLength={2}
              value={formData.tenantName}
              onChange={handleChange}
              placeholder="e.g. Acme Corp"
            />
          </div>
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
            <label htmlFor="email">Work email <span className="required">*</span></label>
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

          <button type="submit" disabled={isLoading} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <><Building2 size={16} /> Create Account</>}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};
