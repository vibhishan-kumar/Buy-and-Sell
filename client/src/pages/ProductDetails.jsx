import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Heart,
  MessageSquare,
  ShoppingBag,
  MapPin,
  Calendar,
  ShieldCheck,
  Star,
  User,
  AlertCircle,
  ArrowLeft,
  Share2,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PaymentModal from '../components/PaymentModal';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      try {
        const data = await api.getProductById(id);
        setProduct(data.product);
        setIsWishlisted(Boolean(data.product.isWishlisted));
      } catch (err) {
        setErrorMsg(err.message || 'Failed to load product details.');
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      showToast('Please sign in to save items to your wishlist.', 'info');
      navigate('/login');
      return;
    }
    try {
      const res = await api.toggleWishlist(product.id);
      setIsWishlisted(res.isWishlisted);
      showToast(res.message, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update wishlist', 'error');
    }
  };

  const handleMessageSeller = async () => {
    if (!isAuthenticated) {
      showToast('Please sign in to message this seller.', 'info');
      navigate('/login');
      return;
    }

    if (user.id === product.seller_id) {
      showToast('You cannot message yourself about your own product.', 'info');
      return;
    }

    setIsStartingChat(true);
    try {
      const res = await api.startConversation(product.id, product.seller_id);
      navigate(`/messages?conv=${res.conversationId}`);
    } catch (err) {
      showToast(err.message || 'Failed to start chat with seller.', 'error');
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      showToast('Please sign in to purchase items.', 'info');
      navigate('/login');
      return;
    }

    if (user.id === product.seller_id) {
      showToast('You cannot purchase your own product.', 'error');
      return;
    }

    setShowCheckout(true);
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '5rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading product information...
      </div>
    );
  }

  if (errorMsg || !product) {
    return (
      <div className="container" style={{ padding: '5rem 0', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '480px', margin: '0 auto', padding: '3rem 2rem' }}>
          <AlertCircle size={48} color="var(--danger)" style={{ margin: '0 auto 1rem auto' }} />
          <h3>Product Not Available</h3>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 1.5rem 0' }}>
            {errorMsg || 'This listing may have been removed or delisted.'}
          </p>
          <Link to="/marketplace" className="btn btn-primary">
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images && product.images.length > 0
    ? product.images
    : [{ image_url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80', is_primary: true }];

  const isOwner = user && user.id === product.seller_id;
  const isAvailable = product.status === 'ACTIVE';

  return (
    <div className="container" style={{ padding: '2rem 1.25rem 4rem 1.25rem' }}>
      {/* Back button */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-outline btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
      </div>

      {/* Main Grid: Gallery on left, Details on right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '3rem', alignItems: 'start' }}>
        {/* Left Column: Image Gallery */}
        <div>
          {/* Main Large Image */}
          <div
            className="card"
            style={{
              height: '420px',
              overflow: 'hidden',
              position: 'relative',
              backgroundColor: '#f1f5f9',
              marginBottom: '1rem'
            }}
          >
            <img
              src={images[selectedImageIndex]?.image_url}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />

            {/* Status badge if sold or delisted */}
            {!isAvailable && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(15, 23, 42, 0.7)',
                  backdropFilter: 'blur(3px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <span className={`badge ${product.status === 'SOLD' ? 'badge-sold' : 'badge-delisted'}`} style={{ fontSize: '1.2rem', padding: '0.6rem 1.4rem' }}>
                  {product.status}
                </span>
              </div>
            )}
          </div>

          {/* Thumbnails list */}
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    border: selectedImageIndex === idx ? '2px solid var(--teal)' : '1px solid var(--border)',
                    padding: 0,
                    cursor: 'pointer',
                    background: '#fff',
                    flexShrink: 0
                  }}
                >
                  <img src={img.image_url} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Info & Actions */}
        <div>
          {/* Category & Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--teal)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {product.category_name}
            </span>
            <span className="badge badge-active" style={{ fontSize: '0.75rem' }}>
              {product.condition}
            </span>
          </div>

          {/* Product Title */}
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--primary)', lineHeight: 1.25 }}>
            {product.name}
          </h1>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary)' }}>
              ₹{parseFloat(product.price).toLocaleString('en-IN')}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              (Campus Handover Price)
            </span>
          </div>

          {/* Location & Listed Date Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', padding: '1rem 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MapPin size={18} color="var(--primary)" />
              <span>Location: <strong>{product.location}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={18} color="var(--primary)" />
              <span>Listed: <strong>{new Date(product.created_at).toLocaleDateString()}</strong></span>
            </div>
          </div>

          {/* Action Buttons: Buy Now, Message Seller, Wishlist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
            {isAvailable ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={handleBuyNow}
                    disabled={isOwner}
                  >
                    <ShoppingBag size={20} />
                    <span>Buy Now</span>
                  </button>

                  <button
                    className="btn btn-accent btn-lg"
                    onClick={handleMessageSeller}
                    disabled={isOwner || isStartingChat}
                  >
                    <MessageSquare size={20} />
                    <span>{isStartingChat ? 'Opening...' : 'Message Seller'}</span>
                  </button>
                </div>

                <button
                  className={`btn ${isWishlisted ? 'btn-danger' : 'btn-outline'}`}
                  onClick={handleToggleWishlist}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
                  <span>{isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
                </button>
              </>
            ) : (
              <div style={{ padding: '1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>
                This product is no longer available ({product.status}).
              </div>
            )}

            {isOwner && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <Link to={`/edit-product/${product.id}`} className="btn btn-outline btn-block">
                  Edit My Listing
                </Link>
              </div>
            )}
          </div>

          {/* Description */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.6rem' }}>Product Description</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-line', fontSize: '0.95rem' }}>
              {product.description}
            </p>
          </div>

          {/* Seller Profile Card */}
          <div className="card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Seller Information
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <img
                src={product.seller_image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                alt={product.seller_name}
                style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--primary)' }}>
                  {product.seller_name}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {product.seller_department || 'University of Hyderabad'}
                </div>
                {/* Rating Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#d97706', fontWeight: 700, fontSize: '0.85rem' }}>
                    <Star size={15} fill="#d97706" />
                    <span>{product.seller_avg_rating > 0 ? product.seller_avg_rating : 'New'}</span>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    ({product.seller_total_reviews || 0} reviews)
                  </span>
                </div>
              </div>
            </div>

            {/* Verified Student Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>
              <ShieldCheck size={16} />
              <span>Verified UoH Student (@uohyd.ac.in)</span>
            </div>
          </div>

          {/* Seller Verified Reviews */}
          {product.sellerReviews && product.sellerReviews.length > 0 && (
            <div style={{ marginTop: '2.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Verified Buyer Reviews</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {product.sellerReviews.map((rev) => (
                  <div key={rev.id} className="card" style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{rev.buyer_name}</span>
                      <div style={{ display: 'flex', color: '#d97706' }}>
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} size={14} fill="#d97706" />
                        ))}
                      </div>
                    </div>
                    {rev.review_text && (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                        "{rev.review_text}"
                      </p>
                    )}
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      {new Date(rev.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Amazon-Style Multi-Payment Modal */}
      {showCheckout && (
        <PaymentModal
          product={product}
          onClose={() => setShowCheckout(false)}
          onSuccess={(order) => {
            setProduct((prev) => ({ ...prev, status: 'SOLD' }));
          }}
        />
      )}
    </div>
  );
}
