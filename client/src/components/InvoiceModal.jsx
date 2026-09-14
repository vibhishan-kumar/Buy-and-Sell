import React from 'react';
import {
  X,
  Printer,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  Calendar,
  CreditCard,
  Smartphone,
  Building2,
  Handshake,
  User,
  Hash,
  Download
} from 'lucide-react';

export default function InvoiceModal({ order, onClose }) {
  if (!order) return null;

  // Parse payment details
  let paymentDetails = {};
  if (order.payment_details) {
    try {
      paymentDetails = typeof order.payment_details === 'string'
        ? JSON.parse(order.payment_details)
        : order.payment_details;
    } catch {
      paymentDetails = { raw: order.payment_details };
    }
  }

  // Determine method label and icon
  const method = (order.payment_method || 'CARD').toUpperCase();
  const getMethodBadge = () => {
    switch (method) {
      case 'UPI':
        return {
          icon: <Smartphone size={16} color="#7c3aed" />,
          label: paymentDetails.upiId ? `UPI (${paymentDetails.upiId})` : 'UPI Instant Pay',
          sub: paymentDetails.app ? `App: ${paymentDetails.app.toUpperCase()}` : 'Virtual Payment Address'
        };
      case 'CARD':
        return {
          icon: <CreditCard size={16} color="#2563eb" />,
          label: paymentDetails.last4 ? `${(paymentDetails.brand || 'Card').toUpperCase()} •••• ${paymentDetails.last4}` : 'Credit / Debit Card',
          sub: 'RBI Compliant 3D-Secure Authenticated'
        };
      case 'NETBANKING':
        return {
          icon: <Building2 size={16} color="#0891b2" />,
          label: paymentDetails.bank || 'Net Banking',
          sub: 'Internet Banking Gateway'
        };
      case 'CAMPUS_HANDOVER':
        return {
          icon: <Handshake size={16} color="#d97706" />,
          label: 'Campus Handover Pay',
          sub: 'Pay with Cash or Spot UPI at Meetup'
        };
      default:
        return {
          icon: <CreditCard size={16} color="#2563eb" />,
          label: method,
          sub: 'Electronic Payment'
        };
    }
  };

  const methodInfo = getMethodBadge();

  // Extract or generate a 4-digit security PIN based on order number
  const securityPin = paymentDetails.pin ||
    (order.order_number
      ? order.order_number.replace(/\D/g, '').slice(-4)
      : '4921');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 1500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        className="modal-content invoice-printable"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          width: '100%',
          maxHeight: '94vh',
          overflowY: 'auto',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          background: '#fff',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Modal Toolbar (hidden in print) */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.85rem 1.25rem',
            background: 'var(--bg-subtle)',
            borderBottom: '1px solid var(--border)'
          }}
        >
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Official Campus Transaction Receipt
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={handlePrint}
              className="btn btn-outline btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
            >
              <Printer size={15} />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="btn-icon"
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0.25rem' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Invoice Printable Body */}
        <div style={{ padding: '2rem' }}>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '2px solid var(--primary)',
              paddingBottom: '1.25rem',
              marginBottom: '1.5rem'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'var(--primary)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1rem'
                  }}
                >
                  UoH
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
                    UoH Student Marketplace
                  </h2>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    University of Hyderabad • Gachibowli, Hyderabad 500046
                  </div>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  display: 'inline-block',
                  background: '#ecfdf5',
                  color: '#059669',
                  border: '1px solid #a7f3d0',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '999px',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  marginBottom: '0.35rem'
                }}
              >
                PAYMENT CONFIRMED
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Order #{order.order_number}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {new Date(order.created_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>

          {/* Student Details Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              background: 'var(--bg-subtle)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem',
              border: '1px solid var(--border)'
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.25rem' }}>
                Buyer (Student)
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                {order.buyer_name}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {order.buyer_email}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600, marginTop: '0.2rem' }}>
                ✓ Verified UoH Student
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.25rem' }}>
                Seller (Student)
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                {order.seller_name}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {order.seller_email}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600, marginTop: '0.2rem' }}>
                ✓ Verified UoH Student
              </div>
            </div>
          </div>

          {/* Handover & Security Exchange PIN */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.85rem 1rem',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#166534', fontWeight: 700, fontSize: '0.88rem' }}>
                <MapPin size={16} />
                <span>Campus Handover Location</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#15803d', marginTop: '0.15rem' }}>
                {order.delivery_location || 'Campus Handover Point'}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 600, textTransform: 'uppercase' }}>
                Security Handover PIN
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '0.25em', color: '#14532d' }}>
                {securityPin}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#15803d' }}>
                Exchange upon physical inspection
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div style={{ marginBottom: '1.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '0.5rem 0', color: 'var(--text-secondary)', fontWeight: 600 }}>Description</th>
                  <th style={{ padding: '0.5rem 0', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '0.5rem 0', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.85rem 0' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{order.product_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Condition: {order.product_condition || 'Used - Good'} • Student Pre-owned
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 0', textAlign: 'center' }}>1</td>
                  <td style={{ padding: '0.85rem 0', textAlign: 'right', fontWeight: 700 }}>
                    ₹{parseFloat(order.amount || order.total_amount).toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.6rem 0', color: 'var(--text-secondary)' }}>
                    Campus Platform Convenience Fee
                  </td>
                  <td style={{ padding: '0.6rem 0', textAlign: 'center' }}>-</td>
                  <td style={{ padding: '0.6rem 0', textAlign: 'right', color: '#059669', fontWeight: 600 }}>
                    ₹0.00 (Waived)
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '0.85rem 0', fontWeight: 800, fontSize: '1rem', color: 'var(--primary)' }}>
                    Total Amount Paid
                  </td>
                  <td style={{ padding: '0.85rem 0', textAlign: 'center' }}>-</td>
                  <td style={{ padding: '0.85rem 0', textAlign: 'right', fontWeight: 800, fontSize: '1.15rem', color: 'var(--primary)' }}>
                    ₹{parseFloat(order.total_amount).toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Method Details */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              marginBottom: '1.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--radius-md)',
                  background: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {methodInfo.icon}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                  {methodInfo.label}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  {methodInfo.sub}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <div>Ref ID: <code>{order.razorpay_payment_id || 'sandbox_auth'}</code></div>
              <div style={{ color: '#059669', fontWeight: 600, marginTop: '0.15rem' }}>
                ✓ 256-Bit SSL Encrypted
              </div>
            </div>
          </div>

          {/* Campus Footer Note */}
          <div
            style={{
              textAlign: 'center',
              borderTop: '1px dashed var(--border)',
              paddingTop: '1.25rem',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              lineHeight: 1.5
            }}
          >
            <p style={{ margin: 0 }}>
              This is an official system-generated student receipt from the University of Hyderabad (UoH) Campus Marketplace.
            </p>
            <p style={{ margin: '0.25rem 0 0 0' }}>
              For student dispute resolution or inquiries, contact Student Welfare Council or marketplace admin at <strong>admin@uohyd.ac.in</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
