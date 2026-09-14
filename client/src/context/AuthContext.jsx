import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const UOH_EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@uohyd\.ac\.in$/;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('uoh_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [stats, setStats] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('uoh_token') || null);
  const [loading, setLoading] = useState(true);

  // Validate UoH email format
  const isUoHEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    return UOH_EMAIL_REGEX.test(email.trim().toLowerCase());
  };

  const refreshUser = async () => {
    if (!token) {
      setUser(null);
      setStats(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api.getMe();
      setUser(data.user);
      setStats(data.stats);
      localStorage.setItem('uoh_user', JSON.stringify(data.user));
    } catch (err) {
      console.warn('Failed to refresh user session:', err.message);
      // If token expired or user is banned
      if (err.status === 401 || err.status === 403) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [token]);

  const login = async (email, password) => {
    const normalized = email.trim().toLowerCase();
    if (!isUoHEmail(normalized)) {
      throw new Error('Only University of Hyderabad email addresses ending with @uohyd.ac.in are allowed.');
    }

    const data = await api.login(normalized, password);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('uoh_token', data.token);
    localStorage.setItem('uoh_user', JSON.stringify(data.user));
    await refreshUser();
    return data;
  };

  const register = async (formData) => {
    // If formData is plain object or FormData
    const email = formData instanceof FormData ? formData.get('email') : formData.email;
    const normalized = (email || '').trim().toLowerCase();
    if (!isUoHEmail(normalized)) {
      throw new Error('Only University of Hyderabad email addresses ending with @uohyd.ac.in are allowed.');
    }

    const data = await api.register(formData);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('uoh_token', data.token);
    localStorage.setItem('uoh_user', JSON.stringify(data.user));
    await refreshUser();
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setStats(null);
    localStorage.removeItem('uoh_token');
    localStorage.removeItem('uoh_user');
  };

  const isAdmin = user?.role === 'admin';
  const isAuthenticated = Boolean(user && token);

  return (
    <AuthContext.Provider
      value={{
        user,
        stats,
        token,
        loading,
        isAuthenticated,
        isAdmin,
        login,
        register,
        logout,
        refreshUser,
        isUoHEmail
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
