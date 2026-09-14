import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, BookOpen, Phone, Star, ShieldCheck, Edit, Package, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import ProductCard from '../components/ProductCard';

export default function Profile() {
  const { user, stats } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [activeListings, setActiveListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfileData() {
      if (!user) return;
      try {
        const [revRes, listRes] = await Promise.all([
          api.getSellerReviews(user.id),
          api.getMyListings('ACTIVE')
        ]);
        setReviews(revRes.reviews || []);
        setActiveListings(listRes.products || []);
      } catch (err) {
        console.warn('Profile data load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfileData();
  }, [user]);

  return (
    <div className="container" style={{ padding: '2.5rem 1.25rem 4rem 1.25rem' }}>
      {/* Profile Header Card */}
      <div className="card" style={{ padding: '2.5rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: '1 1 320px' }}>
            <img
              src={user?.profile_image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
              alt={user?.name}
              style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border)' }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                <h1 style={{ fontSize: '1.6rem', color: 'var(--primary)' }}>{user?.name}</h1>
                <span className={`badge ${user?.role === 'admin' ? 'badge-new' : 'badge-active'}`}>
                  {user?.role === 'admin' ? 'Admin' : 'Verified Student'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Mail size={14} color="var(--teal)" />
                  <span>{user?.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <BookOpen size={14} color="var(--teal)" />
                  <span>{user?.department || 'University of Hyderabad'}</span>
                </div>
                {user?.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Phone size={14} color="var(--teal)" />
                    <span>{user?.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Edit Settings Shortcut */}
          <div>
            <Link to="/settings" className="btn btn-outline">
              <Edit size={16} />
              <span>Edit Profile & Settings</span>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{stats?.activeListings || 0}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Active Items</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)' }}>{stats?.soldListings || 0}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Items Sold</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563eb' }}>{stats?.purchasesCount || 0}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Purchases</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}>
              <Star size={18} fill="#d97706" />
              <span>{stats?.avgRating > 0 ? stats.avgRating : 'New'}</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Seller Rating</div>
          </div>
        </div>
      </div>

      {/* Active Listings by User */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', color: 'var(--primary)' }}>My Active Listings</h2>
          <Link to="/my-listings" style={{ fontWeight: 600, fontSize: '0.85rem' }}>View All →</Link>
        </div>

        {activeListings.length === 0 ? (
          <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <Package size={42} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem auto' }} />
            <h4>No active listings</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.3rem 0 1rem 0' }}>Post items you no longer need!</p>
            <Link to="/add-product" className="btn btn-primary btn-sm">Sell Item</Link>
          </div>
        ) : (
          <div className="grid-products">
            {activeListings.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>

      {/* Verified Reviews Section */}
      <div>
        <h2 style={{ fontSize: '1.35rem', color: 'var(--primary)', marginBottom: '1.25rem' }}>
          Reviews from Buyers ({reviews.length})
        </h2>

        {reviews.length === 0 ? (
          <div className="card" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            No buyer reviews yet. Reviews will appear here once verified buyers complete purchases from you!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {reviews.map((rev) => (
              <div key={rev.id} className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{rev.buyer_name}</div>
                  <div style={{ display: 'flex', color: '#d97706' }}>
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} size={14} fill="#d97706" />
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--teal)', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Item: {rev.product_name}
                </div>
                {rev.review_text && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic', lineHeight: 1.5 }}>
                    "{rev.review_text}"
                  </p>
                )}
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  {new Date(rev.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
