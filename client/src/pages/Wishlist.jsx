import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingBag, Eye, MapPin } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Wishlist() {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const data = await api.getWishlist();
      setItems(data.wishlist || []);
    } catch (err) {
      console.error('Failed to load wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (productId) => {
    try {
      await api.toggleWishlist(productId);
      setItems((prev) => prev.filter((item) => item.product_id !== productId));
      showToast('Item removed from wishlist.', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to remove item', 'error');
    }
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.25rem 4rem 1.25rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>My Saved Wishlist</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
          Items you are monitoring on the campus marketplace
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          Loading saved wishlist...
        </div>
      ) : items.length === 0 ? (
        <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <Heart size={52} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
          <h3>Your wishlist is empty</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.5rem 0 1.5rem 0' }}>
            Browse textbooks, electronics, and bicycles to save items for later.
          </p>
          <Link to="/marketplace" className="btn btn-primary">
            Explore Marketplace
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {items.map((item) => {
            const isAvailable = item.status === 'ACTIVE' && !item.seller_is_banned;
            return (
              <div key={item.wishlist_id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'relative', height: '180px', backgroundColor: '#f1f5f9' }}>
                  <img
                    src={item.primary_image}
                    alt={item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {!isAvailable && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <span className="badge badge-sold">
                        {item.seller_is_banned ? 'UNAVAILABLE' : item.status}
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => handleRemove(item.product_id)}
                    style={{
                      position: 'absolute',
                      top: '0.6rem',
                      right: '0.6rem',
                      background: 'rgba(255, 255, 255, 0.9)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--danger)',
                      cursor: 'pointer',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                    title="Remove from Wishlist"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--teal)', fontWeight: 600, textTransform: 'uppercase' }}>
                    {item.category_name}
                  </div>
                  <Link
                    to={`/products/${item.product_id}`}
                    style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', margin: '0.3rem 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                  >
                    {item.name}
                  </Link>

                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>
                    ₹{parseFloat(item.price).toLocaleString('en-IN')}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '1rem' }}>
                    <MapPin size={14} />
                    <span>{item.location}</span>
                  </div>

                  <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
                    <Link
                      to={`/products/${item.product_id}`}
                      className="btn btn-primary btn-block btn-sm"
                    >
                      <Eye size={15} />
                      <span>View Details</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
