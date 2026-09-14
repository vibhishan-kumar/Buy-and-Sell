import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Mail, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { UOH_EMAIL_REGEX } from '../context/AuthContext';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [tokenInfo, setTokenInfo] = useState(null);
  const navigate = useNavigate();

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
      const res = await api.forgotPassword(normalized);
      setTokenInfo(res);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to process request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '3.5rem 1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 12rem)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '3rem',
              height: '3rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(8, 145, 178, 0.1)',
              color: 'var(--teal)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem auto'
            }}
          >
            <KeyRound size={24} />
          </div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.35rem' }}>Reset Password</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Enter your official UoH email to receive a password recovery link
          </p>
        </div>

        {errorMsg && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.85rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {tokenInfo ? (
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '1.25rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <CheckCircle2 size={36} color="#059669" style={{ margin: '0 auto 0.5rem auto' }} />
            <h4 style={{ marginBottom: '0.5rem', color: '#065f46' }}>Reset Token Ready</h4>
            <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
              In production this is sent to your campus inbox. For instant testing in local environment, your reset token is:
            </p>
            <div style={{ background: '#fff', padding: '0.5rem', borderRadius: 'var(--radius-sm)', fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all', marginBottom: '1rem', border: '1px solid #a7f3d0' }}>
              {tokenInfo.resetToken}
            </div>
            <button
              className="btn btn-accent btn-block"
              onClick={() => navigate(`/reset-password?token=${tokenInfo.resetToken}`)}
            >
              Proceed to Set New Password
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">UoH Student Email</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="form-control"
                  placeholder="e.g. 25mca01@uohyd.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Mail
                  size={18}
                  color={email ? (isEmailValidUoH ? 'var(--accent)' : 'var(--danger)') : 'var(--text-muted)'}
                  style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={isSubmitting || !isEmailValidUoH}
              style={{ marginTop: '0.75rem' }}
            >
              {isSubmitting ? 'Verifying...' : 'Request Password Reset'}
              <ArrowRight size={18} />
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem' }}>
              <Link to="/login" style={{ color: 'var(--teal)', fontWeight: 600 }}>
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
