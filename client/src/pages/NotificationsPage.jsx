import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Clock, ShieldCheck, ShoppingBag, MessageSquare, Star } from 'lucide-react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { resetNotifications } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAll = async () => {
    try {
      await api.markAllNotificationsAsRead();
      resetNotifications();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleItemClick = async (notif) => {
    if (!notif.is_read) {
      try {
        await api.markNotificationAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
      } catch (e) {
        console.error(e);
      }
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'NEW_MESSAGE': return <MessageSquare size={18} color="var(--teal)" />;
      case 'PRODUCT_SOLD':
      case 'PAYMENT_SUCCESS': return <ShoppingBag size={18} color="var(--accent)" />;
      case 'NEW_REVIEW': return <Star size={18} color="#d97706" />;
      default: return <Bell size={18} color="var(--primary)" />;
    }
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.25rem 4rem 1.25rem', maxWidth: '780px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>Notification Center</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
            Campus updates, chat alerts, and transaction receipts
          </p>
        </div>
        {notifications.some((n) => !n.is_read) && (
          <button onClick={handleMarkAll} className="btn btn-outline btn-sm">
            <CheckCheck size={16} />
            <span>Mark All Read</span>
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          Loading notifications...
        </div>
      ) : notifications.length === 0 ? (
        <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <Bell size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
          <h3>No notifications yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            We'll notify you when someone messages you, buys your item, or leaves a review!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleItemClick(n)}
              className="card"
              style={{
                padding: '1.1rem',
                cursor: 'pointer',
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start',
                backgroundColor: n.is_read ? '#fff' : '#f0fdf4',
                borderColor: n.is_read ? 'var(--border)' : '#a7f3d0'
              }}
            >
              <div style={{ background: 'var(--bg-subtle)', padding: '0.6rem', borderRadius: 'var(--radius-md)', flexShrink: 0 }}>
                {getIcon(n.type)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem' }}>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{n.title}</h4>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  {n.message}
                </p>
              </div>
              {!n.is_read && (
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--teal)', flexShrink: 0, marginTop: '0.5rem' }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
