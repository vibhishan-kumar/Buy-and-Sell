import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  PlusCircle,
  Heart,
  MessageSquare,
  Bell,
  User,
  Shield,
  LogOut,
  Package,
  Layers,
  Check,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { api } from '../services/api';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { unreadNotifications, unreadMessages, resetNotifications } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notificationsList, setNotificationsList] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/marketplace?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/marketplace');
    }
  };

  const handleOpenNotifications = async () => {
    setShowNotifications(!showNotifications);
    setShowUserMenu(false);
    if (!showNotifications && isAuthenticated) {
      setLoadingNotifs(true);
      try {
        const data = await api.getNotifications();
        setNotificationsList(data.notifications || []);
      } catch (err) {
        console.warn('Failed to load notifications:', err);
      } finally {
        setLoadingNotifs(false);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      resetNotifications();
      setNotificationsList((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="navbar">
      <div className="container nav-container">
        {/* Brand */}
        <Link to="/" className="nav-brand">
          <div className="nav-brand-logo">
            <ShoppingBag size={20} />
          </div>
          <div>
            <span>UoH <span style={{ color: 'var(--teal)' }}>Marketplace</span></span>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.02em', marginTop: '-3px' }}>
              University of Hyderabad
            </div>
          </div>
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="nav-search">
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search textbooks, bicycles, dorm items, electronics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem', borderRadius: 'var(--radius-full)', fontSize: '0.9rem' }}
            />
            <Search
              size={18}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>
        </form>

        {/* Navigation Actions */}
        <div className="nav-actions">
          <Link to="/marketplace" className="btn btn-outline btn-sm">
            Browse
          </Link>

          {isAuthenticated ? (
            <>
              {/* Sell Button */}
              <Link to="/add-product" className="btn btn-accent btn-sm">
                <PlusCircle size={16} />
                <span>Sell Item</span>
              </Link>

              {/* Wishlist Icon */}
              <Link
                to="/wishlist"
                style={{ position: 'relative', color: 'var(--text-secondary)', padding: '0.4rem' }}
                title="My Wishlist"
              >
                <Heart size={22} />
              </Link>

              {/* Messages Icon */}
              <Link
                to="/messages"
                style={{ position: 'relative', color: 'var(--text-secondary)', padding: '0.4rem' }}
                title="Chat & Messages"
              >
                <MessageSquare size={22} />
                {unreadMessages > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      background: 'var(--teal)',
                      color: '#fff',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #fff'
                    }}
                  >
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </Link>

              {/* Notifications Dropdown */}
              <div style={{ position: 'relative' }} ref={notifRef}>
                <button
                  onClick={handleOpenNotifications}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    padding: '0.4rem',
                    position: 'relative'
                  }}
                  title="Notifications"
                >
                  <Bell size={22} />
                  {unreadNotifications > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        background: 'var(--danger)',
                        color: '#fff',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid #fff'
                      }}
                    >
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '115%',
                      width: '320px',
                      background: '#fff',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-xl)',
                      border: '1px solid var(--border)',
                      zIndex: 200,
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        padding: '0.8rem 1rem',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'var(--bg-subtle)'
                      }}
                    >
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Notifications</span>
                      {unreadNotifications > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--teal)',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {loadingNotifs ? (
                        <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          Loading notifications...
                        </div>
                      ) : notificationsList.length === 0 ? (
                        <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          No notifications yet.
                        </div>
                      ) : (
                        notificationsList.slice(0, 5).map((n) => (
                          <div
                            key={n.id}
                            style={{
                              padding: '0.75rem 1rem',
                              borderBottom: '1px solid var(--border)',
                              background: n.is_read ? '#fff' : '#f0fdf4',
                              fontSize: '0.85rem',
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              setShowNotifications(false);
                              if (n.link) navigate(n.link);
                            }}
                          >
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                              {n.title}
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                              {n.message}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                              {new Date(n.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div
                      style={{
                        padding: '0.6rem',
                        textAlign: 'center',
                        borderTop: '1px solid var(--border)',
                        background: 'var(--bg-subtle)'
                      }}
                    >
                      <Link
                        to="/notifications"
                        onClick={() => setShowNotifications(false)}
                        style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--teal)' }}
                      >
                        View all notifications
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar Menu */}
              <div style={{ position: 'relative' }} ref={userMenuRef}>
                <button
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                    setShowNotifications(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border)',
                    padding: '0.35rem 0.65rem',
                    borderRadius: 'var(--radius-full)',
                    cursor: 'pointer'
                  }}
                >
                  <img
                    src={user.profile_image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                    alt={user.name}
                    style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown size={14} color="var(--text-muted)" />
                </button>

                {showUserMenu && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '115%',
                      width: '240px',
                      background: '#fff',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-xl)',
                      border: '1px solid var(--border)',
                      zIndex: 200,
                      overflow: 'hidden',
                      padding: '0.5rem 0'
                    }}
                  >
                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {user.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user.email}
                      </div>
                      <div style={{ marginTop: '0.3rem' }}>
                        <span className={`badge ${isAdmin ? 'badge-new' : 'badge-active'}`}>
                          {isAdmin ? 'Campus Admin' : 'UoH Student'}
                        </span>
                      </div>
                    </div>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setShowUserMenu(false)}
                        className="admin-menu-link"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          padding: '0.65rem 1rem',
                          color: '#b91c1c',
                          fontWeight: 700,
                          fontSize: '0.88rem',
                          background: '#fef2f2'
                        }}
                      >
                        <Shield size={16} />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}

                    <Link
                      to="/dashboard"
                      onClick={() => setShowUserMenu(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.65rem 1rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.88rem'
                      }}
                    >
                      <Layers size={16} />
                      <span>Student Dashboard</span>
                    </Link>

                    <Link
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.65rem 1rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.88rem'
                      }}
                    >
                      <User size={16} />
                      <span>My Profile</span>
                    </Link>

                    <Link
                      to="/my-listings"
                      onClick={() => setShowUserMenu(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.65rem 1rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.88rem'
                      }}
                    >
                      <Package size={16} />
                      <span>My Listings</span>
                    </Link>

                    <Link
                      to="/orders"
                      onClick={() => setShowUserMenu(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.65rem 1rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.88rem'
                      }}
                    >
                      <ShoppingBag size={16} />
                      <span>My Orders</span>
                    </Link>

                    <div style={{ borderTop: '1px solid var(--border)', margin: '0.3rem 0' }}></div>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                        navigate('/login');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.65rem 1rem',
                        color: 'var(--danger)',
                        fontSize: '0.88rem',
                        background: 'none',
                        border: 'none',
                        width: '100%',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link to="/login" className="btn btn-outline btn-sm">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register (UoH Only)
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
