import React, { useState, useEffect } from 'react';
import { ShoppingBag, ShieldCheck, MapPin } from 'lucide-react';
import { api } from '../../services/api';
import AdminSidebar from '../../components/AdminSidebar';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await api.getAdminOrders();
        setOrders(data.orders || []);
      } catch (err) {
        console.error('Failed to load admin transactions:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-content">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>Transactions & Order History</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Comprehensive campus transaction records, payment statuses, and student exchange points
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            Loading transactions...
          </div>
        ) : orders.length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No transactions recorded on the marketplace yet.
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Product</th>
                  <th>Buyer</th>
                  <th>Seller</th>
                  <th>Amount</th>
                  <th>Razorpay Payment ID</th>
                  <th>Status</th>
                  <th>Campus Handover</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <code style={{ fontSize: '0.8rem', fontWeight: 700 }}>{o.order_number}</code>
                    </td>
                    <td style={{ fontWeight: 600 }}>{o.product_name}</td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{o.buyer_name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{o.buyer_email}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{o.seller_name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{o.seller_email}</div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      ₹{parseFloat(o.total_amount).toLocaleString('en-IN')}
                    </td>
                    <td>
                      <code style={{ fontSize: '0.75rem', background: 'var(--bg-subtle)', padding: '0.2rem 0.4rem', borderRadius: 'var(--radius-sm)' }}>
                        {o.razorpay_payment_id || 'sandbox_test'}
                      </code>
                    </td>
                    <td>
                      <span className="badge badge-active">{o.status}</span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {o.delivery_location || 'Campus Gate'}
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
