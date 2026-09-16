import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth, UOH_EMAIL_REGEX } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/marketplace';

  const isEmailValidUoH = UOH_EMAIL_REGEX.test(email.trim().toLowerCase());

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const normalized = email.trim().toLowerCase();

    if (!UOH_EMAIL_REGEX.test(normalized)) {
      setErrorMsg('Only University of Hyderabad email addresses ending with @uohyd.ac.in are allowed.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await login(normalized, password);
      showToast(`Welcome back, ${data.user.name}!`, 'success');
      if (data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate(from);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Invalid credentials or login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '3.5rem 1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 12rem)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '2rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '3rem',
              height: '3rem',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--teal) 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem auto'
            }}
          >
            <ShieldCheck size={26} />
          </div>
          <h2 style={{ fontSize: '1.45rem', marginBottom: '0.35rem' }}>Sign In to UoH Marketplace</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Exclusive to University of Hyderabad students & faculty
          </p>
        </div>

        {errorMsg && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* UoH Email Field */}
          <div className="form-group">
            <label className="form-label">Official UoH Student Email</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-control"
                placeholder="e.g. vibhishan.kumar@uohyd.ac.in"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                required
                style={{ paddingLeft: '2.5rem' }}
              />
              <Mail
                size={18}
                color={email ? (isEmailValidUoH ? 'var(--accent)' : 'var(--danger)') : 'var(--text-muted)'}
                style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }}
              />
              {email && isEmailValidUoH && (
                <CheckCircle2
                  size={18}
                  color="var(--accent)"
                  style={{ position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)' }}
                />
              )}
            </div>
            <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.3rem', display: 'block' }}>
              Must end with <strong>@uohyd.ac.in</strong>
            </small>
          </div>

          {/* Password Field */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
              <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--teal)' }}>
                Forgot Password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-control"
                placeholder="Enter account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: '2.5rem' }}
              />
              <Lock
                size={18}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={isSubmitting}
            style={{ marginTop: '0.75rem' }}
          >
            {isSubmitting ? 'Signing In...' : 'Sign In'}
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Register Link */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          Don't have an account yet?{' '}
          <Link to="/register" style={{ fontWeight: 700, color: 'var(--teal)' }}>
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
