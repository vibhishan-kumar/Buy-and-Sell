import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MapPin, Star, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';

export default function ProductCard({ product, onWishlistToggle }) {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [isWishlisted, setIsWishlisted] = useState(Boolean(product.isWishlisted));
  const [loadingWish, setLoadingWish] = useState(false);

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      showToast('Please login with your UoH email to save items.', 'info');
      navigate('/login');
      return;
    }

    setLoadingWish(true);
    try {
      const res = await api.toggleWishlist(product.id);
      setIsWishlisted(res.isWishlisted);
      showToast(res.message, 'success');
      if (onWishlistToggle) {
        onWishlistToggle(product.id, res.isWishlisted);
      }
    } catch (err) {
      showToast(err.message || 'Failed to update wishlist', 'error');
    } finally {
      setLoadingWish(false);
    }
  };

  const getConditionColor = (cond) => {
    switch (cond) {
      case 'New': return '#059669';
      case 'Like New': return '#0284c7';
      case 'Good': return '#d97706';
      case 'Fair': return '#64748b';
      default: return '#475569';
    }
  };

  return (
    <div className="card product-card">
      <Link to={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Image Container */}
        <div className="product-image-wrap">
          <img
            src={product.primary_image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80'}
            alt={product.name}
            loading="lazy"
          />

          {/* Condition Pill */}
          <span
            style={{
              position: 'absolute',
              top: '0.75rem',
              left: '0.75rem',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              color: getConditionColor(product.condition),
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.72rem',
              fontWeight: 700,
              boxShadow: 'var(--shadow-sm)',
              border: `1px solid ${getConditionColor(product.condition)}40`
            }}
          >
            {product.condition}
          </span>

          {/* Sold / Delisted Overlay */}
          {product.status !== 'ACTIVE' && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(2px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: '1.2rem',
                letterSpacing: '0.05em'
              }}
            >
              <span className={`badge ${product.status === 'SOLD' ? 'badge-sold' : 'badge-delisted'}`} style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                {product.status}
              </span>
            </div>
          )}

          {/* Wishlist Button */}
          <button
            onClick={handleToggleWishlist}
            disabled={loadingWish}
            className={`product-wishlist-btn ${isWishlisted ? 'active' : ''}`}
            title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <Heart size={17} fill={isWishlisted ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Card Content */}
        <div className="product-card-body">
          {/* Category & Rating */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--teal)', fontWeight: 600, textTransform: 'uppercase' }}>
              {product.category_name}
            </span>
            {product.seller_avg_rating > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', color: '#d97706', fontWeight: 700 }}>
                <Star size={13} fill="#d97706" />
                <span>{product.seller_avg_rating}</span>
              </div>
            )}
          </div>

          {/* Title */}
          <h3 className="product-title" title={product.name}>
            {product.name}
          </h3>

          {/* Price */}
          <div className="product-price">
            ₹{parseFloat(product.price).toLocaleString('en-IN')}
          </div>

          {/* Location */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
            <MapPin size={13} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {product.location}
            </span>
          </div>

          {/* Seller Footer */}
          <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <User size={13} />
              <span>{product.seller_name ? product.seller_name.split(' ')[0] : 'UoH Student'}</span>
            </div>
            <span>{new Date(product.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
