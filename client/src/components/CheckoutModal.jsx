import React, { useState } from 'react';
import { X, ShieldCheck, CreditCard, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function CheckoutModal({ product, onClose, onSuccess }) {
  const { showToast } = useToast();
  const [deliveryLocation, setDeliveryLocation] = useState(product.location || 'South Campus Shopping Complex');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [orderComplete, setOrderComplete] = useState(null);

  const price = parseFloat(product.price);
  const platformFee = 0.00;
  const total = price + platformFee;

  const handlePay = async () => {
    setIsProcessing(true);
    setErrorMsg('');

    try {
      // 1. Create order on backend
      const orderData = await api.createOrder(product.id);

      // Check if real Razorpay script is active on window
      if (window.Razorpay && orderData.keyId && !orderData.keyId.includes('demo')) {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'UoH Marketplace',
          description: `Purchase: ${product.name}`,
          order_id: orderData.orderId,
          handler: async function (response) {
            try {
              const verifyRes = await api.verifyPayment({
                productId: product.id,
                deliveryLocation,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              });
              setOrderComplete(verifyRes.order);
              showToast('Payment successful! Order confirmed.', 'success');
              if (onSuccess) onSuccess(verifyRes.order);
            } catch (err) {
              setErrorMsg(err.message || 'Payment verification failed');
            } finally {
              setIsProcessing(false);
            }
          },
          prefill: {
            name: 'UoH Student',
            email: 'student@uohyd.ac.in'
          },
          theme: {
            color: '#0c2340'
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          setErrorMsg(`Payment failed: ${response.error.description}`);
          setIsProcessing(false);
        });
        rzp.open();
      } else {
        // Test / Sandbox simulation mode: Instant verified transaction execution
        // Generates sandbox signature and verifies atomically on backend
        const simulatedPaymentId = 'pay_sb_' + Date.now();
        const simulatedSig = 'sandbox_sig_' + Date.now();

        const verifyRes = await api.verifyPayment({
          productId: product.id,
          deliveryLocation,
          razorpayOrderId: orderData.orderId,
          razorpayPaymentId: simulatedPaymentId,
          razorpaySignature: simulatedSig
        });

        setOrderComplete(verifyRes.order);
        showToast('Payment verified successfully in Razorpay sandbox mode!', 'success');
        if (onSuccess) onSuccess(verifyRes.order);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setErrorMsg(err.message || 'Failed to complete checkout');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '1.15rem' }}>Checkout & Payment</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {orderComplete ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <CheckCircle size={56} color="var(--accent)" style={{ margin: '0 auto 1rem auto' }} />
              <h3 style={{ marginBottom: '0.5rem' }}>Payment Successful!</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Your order <strong>#{orderComplete.order_number}</strong> has been created. The seller has been notified to meet at your campus handover point.
              </p>
              <div style={{ background: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'left', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Product:</span>
                  <strong>{product.name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Amount Paid:</span>
                  <strong>₹{total.toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Handover Spot:</span>
                  <span>{deliveryLocation}</span>
                </div>
              </div>
              <button
                className="btn btn-primary btn-block"
                onClick={onClose}
              >
                Close & View Orders
              </button>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Product Brief */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                <img
                  src={product.primary_image || (product.images && product.images[0]?.image_url) || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80'}
                  alt={product.name}
                  style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                />
                <div>
                  <h4 style={{ fontSize: '1rem', marginBottom: '0.2rem' }}>{product.name}</h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Sold by: {product.seller_name || 'UoH Student'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Condition: {product.condition}
                  </div>
                </div>
              </div>

              {/* Handover Spot Input */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={14} color="var(--primary)" />
                  <span>Campus Meeting & Handover Spot</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. MH-J Hostel Gate, SCIS Lab Steps, Shopping Complex"
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  required
                />
                <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  Specify where you and the seller will meet on campus to inspect and exchange the item.
                </small>
              </div>

              {/* Price Breakdown */}
              <div style={{ background: 'var(--bg-subtle)', padding: '1.1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Item Price</span>
                  <span>₹{price.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Campus Platform Fee</span>
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>₹0.00 (Free)</span>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>
                  <span>Total Amount</span>
                  <span>₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Razorpay Trust Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                <ShieldCheck size={18} color="var(--accent)" />
                <span>Protected by Razorpay Test Sandbox. No real money deducted. Card details never stored.</span>
              </div>

              {/* Pay Button */}
              <button
                className="btn btn-primary btn-block btn-lg"
                onClick={handlePay}
                disabled={isProcessing || !deliveryLocation.trim()}
              >
                {isProcessing ? 'Processing Secure Payment...' : `Pay ₹${total.toLocaleString('en-IN')} Now`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
