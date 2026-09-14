import React, { useState } from 'react';
import { X, Star, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function ReviewModal({ order, onClose, onSuccess }) {
  const { showToast } = useToast();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await api.createReview({
        orderId: order.id,
        rating,
        reviewText
      });
      showToast('Thank you! Your review has been submitted.', 'success');
      if (onSuccess) onSuccess(res.review);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <h3 style={{ fontSize: '1.15rem' }}>Rate & Review Seller</h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {errorMsg && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              How was your experience purchasing <strong>{order.product_name}</strong> from <strong>{order.seller_name}</strong>?
            </p>

            {/* Star Rating selector */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', margin: '1rem 0' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: star <= (hoverRating || rating) ? '#f59e0b' : '#cbd5e1',
                    transition: 'transform 0.1s',
                    transform: star <= (hoverRating || rating) ? 'scale(1.15)' : 'none',
                    padding: '0.25rem'
                  }}
                >
                  <Star size={32} fill={star <= (hoverRating || rating) ? '#f59e0b' : 'none'} />
                </button>
              ))}
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f59e0b' }}>
              {rating === 5 && 'Outstanding & Verified! (5/5)'}
              {rating === 4 && 'Very Good Seller (4/5)'}
              {rating === 3 && 'Average Experience (3/5)'}
              {rating === 2 && 'Could Be Better (2/5)'}
              {rating === 1 && 'Poor Experience (1/5)'}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Review Comment (Optional)</label>
            <textarea
              className="form-control"
              rows={4}
              placeholder="Was the product condition as described? Was the seller punctual at the campus meeting point?"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
