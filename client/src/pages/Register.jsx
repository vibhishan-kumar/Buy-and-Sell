import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, User, Phone, BookOpen, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth, UOH_EMAIL_REGEX } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: 'School of Computer and Information Sciences',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const departments = [
    'School of Computer and Information Sciences',
    'School of Chemistry',
    'School of Physics',
    'School of Mathematics and Statistics',
    'Department of Life Sciences',
    'Department of Biotechnology',
    'School of Economics',
    'School of Management Studies',
    'Department of English & Humanities',
    'Sarojini Naidu School of Arts & Communication',
    'School of Engineering Sciences',
    'Other UoH Department'
  ];

  const isEmailValidUoH = UOH_EMAIL_REGEX.test(formData.email.trim().toLowerCase());

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Profile photo must be less than 5MB.');
        return;
      }
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const normalizedEmail = formData.email.trim().toLowerCase();

    // Strict UoH Regex check
    if (!UOH_EMAIL_REGEX.test(normalizedEmail)) {
      setErrorMsg('Only University of Hyderabad email addresses ending with @uohyd.ac.in are allowed.');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append('name', formData.name.trim());
      data.append('email', normalizedEmail);
      data.append('department', formData.department);
      data.append('phone', formData.phone.trim());
      data.append('password', formData.password);
      if (profileImage) {
        data.append('profile_image', profileImage);
      }

      await register(data);
      showToast('Registration successful! Welcome to UoH Marketplace.', 'success');
      navigate('/marketplace');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create student account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '3.5rem 1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 12rem)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '2.25rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '3.2rem',
              height: '3.2rem',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--teal) 0%, var(--primary) 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem auto'
            }}
          >
            <ShieldCheck size={28} />
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.35rem' }}>Create Student Account</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Join the verified University of Hyderabad student marketplace
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
          {/* Name */}
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                name="name"
                className="form-control"
                placeholder="e.g. Vibhishan Kumar"
                value={formData.name}
                onChange={handleInputChange}
                required
                style={{ paddingLeft: '2.5rem' }}
              />
              <User
                size={18}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">UoH Email Address (@uohyd.ac.in)</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="e.g. 25mca01@uohyd.ac.in"
                value={formData.email}
                onChange={handleInputChange}
                required
                style={{ paddingLeft: '2.5rem' }}
              />
              <Mail
                size={18}
                color={formData.email ? (isEmailValidUoH ? 'var(--accent)' : 'var(--danger)') : 'var(--text-muted)'}
                style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }}
              />
              {formData.email && isEmailValidUoH && (
                <CheckCircle2
                  size={18}
                  color="var(--accent)"
                  style={{ position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)' }}
                />
              )}
            </div>
            <small style={{ color: formData.email && !isEmailValidUoH ? 'var(--danger)' : 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.3rem', display: 'block' }}>
              {formData.email && !isEmailValidUoH
                ? 'Only University of Hyderabad email addresses ending with @uohyd.ac.in are allowed.'
                : 'Enter your valid university email ID ending with @uohyd.ac.in'}
            </small>
          </div>

          {/* Department */}
          <div className="form-group">
            <label className="form-label">Department / School</label>
            <div style={{ position: 'relative' }}>
              <select
                name="department"
                className="form-control"
                value={formData.department}
                onChange={handleInputChange}
                style={{ paddingLeft: '2.5rem' }}
              >
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <BookOpen
                size={18}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          {/* Phone */}
          <div className="form-group">
            <label className="form-label">Phone / WhatsApp (Optional)</label>
            <div style={{ position: 'relative' }}>
              <input
                type="tel"
                name="phone"
                className="form-control"
                placeholder="e.g. +91 98765 43210"
                value={formData.phone}
                onChange={handleInputChange}
                style={{ paddingLeft: '2.5rem' }}
              />
              <Phone
                size={18}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          {/* Passwords */}
          <div className="grid-cols-2">
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  name="password"
                  className="form-control"
                  placeholder="Min. 6 chars"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Lock
                  size={16}
                  color="var(--text-muted)"
                  style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  name="confirmPassword"
                  className="form-control"
                  placeholder="Repeat password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Lock
                  size={16}
                  color="var(--text-muted)"
                  style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
            </div>
          </div>

          {/* Profile Photo Upload */}
          <div className="form-group">
            <label className="form-label">Profile Photo (Optional)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <User size={24} />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={isSubmitting || !isEmailValidUoH}
            style={{ marginTop: '0.75rem' }}
          >
            {isSubmitting ? 'Creating Account...' : 'Register as Student'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          Already have a UoH student account?{' '}
          <Link to="/login" style={{ fontWeight: 700, color: 'var(--teal)' }}>
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}
