import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  CheckCircle,
  ShoppingBag,
  Heart,
  Star,
  PlusCircle,
  MessageSquare,
  Bell,
  ArrowRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function Dashboard() {
  const { user, stats } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [myActiveListings, setMyActiveListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [convRes, notifRes, listingsRes] = await Promise.all([
          api.getConversations(),
          api.getNotifications(),
          api.getMyListings('ACTIVE')
        ]);
        setConversations((convRes.conversations || []).slice(0, 4));
        setNotifications((notifRes.notifications || []).slice(0, 5));
        setMyActiveListings((listingsRes.products || []).slice(0, 3));
      } catch (err) {
        console.warn('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  return (
    <div className="container" style={{ padding: '2.5rem 1.25rem 4rem 1.25rem' }}>
      {/* Welcome Hero Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0c2340 0%, #163660 100%)',
          color: '#fff',
          padding: '2rem 2.5rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}
      >
        <div>
          <span style={{ color: '#38bdf8', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Student Portal
          </span>
          <h1 style={{ fontSize: '1.85rem', color: '#fff', margin: '0.3rem 0' }}>
            Welcome back, {user?.name}!
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
            {user?.department || 'University of Hyderabad'} • {user?.email}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/add-product" className="btn btn-accent">
            <PlusCircle size={18} />
            <span>Post New Listing</span>
          </Link>
          <Link to="/marketplace" className="btn btn-outline" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }}>
            Browse Catalog
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid-cols-4" style={{ marginBottom: '2.5rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Listings</span>
            <Package size={20} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>
            {stats?.activeListings || 0}
          </div>
          <Link to="/my-listings" style={{ fontSize: '0.75rem', color: 'var(--teal)', fontWeight: 600 }}>
            Manage listings →
          </Link>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Sold Items</span>
            <CheckCircle size={20} color="var(--accent)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>
            {stats?.soldListings || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Completed campus sales</span>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Purchases</span>
            <ShoppingBag size={20} color="#2563eb" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>
            {stats?.purchasesCount || 0}
          </div>
          <Link to="/orders" style={{ fontSize: '0.75rem', color: 'var(--teal)', fontWeight: 600 }}>
            View order receipts →
          </Link>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Seller Rating</span>
            <Star size={20} color="#d97706" fill="#d97706" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>
            {stats?.avgRating > 0 ? `${stats.avgRating} / 5` : 'New'}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {stats?.totalReviews || 0} verified buyer reviews
          </span>
        </div>
      </div>

      {/* 2-Column Split: Active Listings & Recent Messages / Notifications */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        {/* Left Column: Recent Messages & Active Listings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Recent Messages */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={18} color="var(--primary)" />
                <h3 style={{ fontSize: '1.1rem' }}>Recent Messages</h3>
              </div>
              <Link to="/messages" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Open Chat →</Link>
            </div>

            {loading ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading conversations...</p>
            ) : conversations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                No active chat conversations yet. Message a seller on the marketplace to start chatting!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {conversations.map((c) => (
                  <Link
                    key={c.id}
                    to={`/messages?conv=${c.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-subtle)',
                      textDecoration: 'none',
                      color: 'inherit'
                    }}
                  >
                    <img
                      src={c.other_user_image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                      alt={c.other_user_name}
                      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.other_user_name}</span>
                        {c.unread_count > 0 && (
                          <span className="badge badge-active" style={{ fontSize: '0.65rem' }}>
                            {c.unread_count} new
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.last_message || `Regarding: ${c.product_name}`}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Active Listings Preview */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Package size={18} color="var(--primary)" />
                <h3 style={{ fontSize: '1.1rem' }}>My Active Listings</h3>
              </div>
              <Link to="/my-listings" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Manage All →</Link>
            </div>

            {myActiveListings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                You have no active products listed right now.{' '}
                <Link to="/add-product" style={{ color: 'var(--teal)', fontWeight: 600 }}>List one today!</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {myActiveListings.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <img
                      src={p.primary_image}
                      alt={p.name}
                      style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link to={`/products/${p.id}`} style={{ fontWeight: 600, fontSize: '0.9rem', color: 'inherit', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.name}
                      </Link>
                      <div style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 700 }}>
                        ₹{parseFloat(p.price).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <Link to={`/edit-product/${p.id}`} className="btn btn-outline btn-sm">
                      Edit
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Notifications Feed */}
        <div>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell size={18} color="var(--primary)" />
                <h3 style={{ fontSize: '1.1rem' }}>Activity Feed</h3>
              </div>
              <Link to="/notifications" style={{ fontSize: '0.82rem', fontWeight: 600 }}>All Notifications →</Link>
            </div>

            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                No recent activity.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: '0.85rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: n.is_read ? 'var(--bg-card)' : 'rgba(8, 145, 178, 0.05)',
                      border: '1px solid var(--border)',
                      fontSize: '0.85rem'
                    }}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                      {n.title}
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                      {n.message}
                    </p>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={12} />
                      <span>{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
