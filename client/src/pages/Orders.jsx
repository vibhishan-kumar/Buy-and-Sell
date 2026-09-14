import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ShoppingBag,
  Star,
  CheckCircle,
  MapPin,
  Receipt,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Building2,
  Handshake,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import ReviewModal from '../components/ReviewModal';
import InvoiceModal from '../components/InvoiceModal';

export default function Orders() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('buyer'); // 'buyer' or 'seller'
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewingOrder, setReviewingOrder] = useState(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);

  const fetchOrders = async (role) => {
    setLoading(true);
    try {
      const data = await api.getUserOrders(role);
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(activeTab);
  }, [activeTab]);

  const renderPaymentBadge = (order) => {
    let details = {};
    if (order.payment_details) {
      try {
        details = typeof order.payment_details === 'string'
          ? JSON.parse(order.payment_details)
          : order.payment_details;
      } catch {
        details = {};
      }
    }

    const m = (order.payment_method || 'CARD').toUpperCase();

    if (m === 'UPI') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.25rem 0.6rem',
            background: '#f5f3ff',
            border: '1px solid #ddd6fe',
            color: '#7c3aed',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.75rem',
            fontWeight: 700
          }}
        >
          <Smartphone size={13} />
          <span>{details.upiId ? `UPI: ${details.upiId}` : (details.app ? `UPI (${details.app.toUpperCase()})` : 'UPI Instant')}</span>
        </span>
      );
    }

    if (m === 'CARD') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.25rem 0.6rem',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            color: '#2563eb',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.75rem',
            fontWeight: 700
          }}
        >
          <CreditCard size={13} />
          <span>{details.last4 ? `${(details.brand || 'CARD').toUpperCase()} •••• ${details.last4}` : 'Card Payment'}</span>
        </span>
      );
    }

    if (m === 'NETBANKING') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.25rem 0.6rem',
            background: '#ecfeff',
            border: '1px solid #a5f3fc',
            color: '#0891b2',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.75rem',
            fontWeight: 700
          }}
        >
          <Building2 size={13} />
          <span>{details.bank || 'Net Banking'}</span>
        </span>
      );
    }

    if (m === 'CAMPUS_HANDOVER') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.25rem 0.6rem',
            background: '#fffbeb',
            border: '1px solid #fde68a',
            color: '#d97706',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.75rem',
            fontWeight: 700
          }}
        >
          <Handshake size={13} />
          <span>Campus Handover Pay</span>
        </span>
      );
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.25rem 0.6rem',
          background: 'var(--bg-subtle)',
          color: 'var(--text-secondary)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.75rem',
          fontWeight: 600
        }}
      >
        <CreditCard size={13} />
        <span>{m}</span>
      </span>
    );
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.25rem 4rem 1.25rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>Orders & Purchase History</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
          Track campus transactions, payment receipts, and seller reviews
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('buyer')}
          style={{
            padding: '0.55rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: activeTab === 'buyer' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'buyer' ? '#fff' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          My Purchases
        </button>
        <button
          onClick={() => setActiveTab('seller')}
          style={{
            padding: '0.55rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: activeTab === 'seller' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'seller' ? '#fff' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          My Sales
        </button>
      </div>

      {/* Orders List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          Loading order history...
        </div>
      ) : orders.length === 0 ? (
        <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <ShoppingBag size={52} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
          <h3>No {activeTab === 'buyer' ? 'purchases' : 'sales'} recorded</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.5rem 0 1.5rem 0' }}>
            {activeTab === 'buyer'
              ? 'Find books, calculators, and bicycles on the marketplace!'
              : 'Post your items to sell directly to fellow UoH students.'}
          </p>
          <Link to="/marketplace" className="btn btn-primary">
            Explore Marketplace
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {orders.map((order) => (
            <div key={order.id} className="card" style={{ padding: '1.5rem' }}>
              {/* Order Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.85rem', marginBottom: '1.1rem' }}>
                <div>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--primary)' }}>
                    Order #{order.order_number}
                  </span>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    Placed on {new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {renderPaymentBadge(order)}
                  <span className="badge badge-active" style={{ fontSize: '0.75rem' }}>
                    {order.status}
                  </span>
                </div>
              </div>

              {/* Order Item Details */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: '1 1 320px' }}>
                  <img
                    src={order.product_image}
                    alt={order.product_name}
                    style={{ width: '76px', height: '76px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                  />
                  <div>
                    <Link to={`/products/${order.product_id}`} style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                      {order.product_name}
                    </Link>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      {activeTab === 'buyer' ? `Seller: ${order.seller_name} (${order.seller_email})` : `Buyer: ${order.buyer_name} (${order.buyer_email})`}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.2rem' }}>
                      <MapPin size={13} />
                      <span>Handover Point: {order.delivery_location || 'Campus Handover Point'}</span>
                    </div>
                  </div>
                </div>

                {/* Amount */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)' }}>
                    ₹{parseFloat(order.total_amount).toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 600 }}>
                    ₹0 Campus Platform Fee
                  </div>
                </div>

                {/* Actions (Invoice Receipt & Rating) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setSelectedInvoiceOrder(order)}
                    className="btn btn-outline btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem' }}
                    title="View Official Campus Receipt & Gate Pass"
                  >
                    <Receipt size={14} color="var(--teal)" />
                    <span>View Receipt</span>
                  </button>

                  {activeTab === 'buyer' && (
                    <div>
                      {order.review_rating ? (
                        <div style={{ background: '#fef3c7', border: '1px solid #fde68a', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem', color: '#d97706', fontWeight: 700, fontSize: '0.82rem' }}>
                            <Star size={13} fill="#d97706" />
                            <span>Rated {order.review_rating}/5</span>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setReviewingOrder(order)}
                          className="btn btn-outline btn-sm"
                          style={{ color: '#d97706', borderColor: '#fde68a', background: '#fffbeb', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem' }}
                        >
                          <Star size={14} />
                          <span>Rate Seller</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {reviewingOrder && (
        <ReviewModal
          order={reviewingOrder}
          onClose={() => setReviewingOrder(null)}
          onSuccess={() => fetchOrders('buyer')}
        />
      )}

      {/* Campus Invoice / Receipt Modal */}
      {selectedInvoiceOrder && (
        <InvoiceModal
          order={selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}
    </div>
  );
}

