import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Package,
  ShoppingBag,
  TrendingUp,
  FolderTree,
  AlertTriangle,
  Shield,
  Clock,
  ArrowRight
} from 'lucide-react';
import { api } from '../../services/api';
import AdminSidebar from '../../components/AdminSidebar';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await api.getAdminStats();
        setStats(data.metrics);
        setRecentActivity(data.recentActivity || []);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-content">
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
            <span className="badge badge-new">Campus Administration</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>UoH Marketplace Control Panel</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Platform metrics, student moderation, product governance, and audit trails
          </p>
        </div>

        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading platform statistics...
          </div>
        ) : (
          <>
            {/* Primary Metrics Grid */}
            <div className="grid-cols-4" style={{ marginBottom: '2.5rem' }}>
              {/* Total Users */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Students</span>
                  <div style={{ background: 'rgba(8, 145, 178, 0.1)', padding: '0.4rem', borderRadius: 'var(--radius-sm)', color: 'var(--teal)' }}>
                    <Users size={20} />
                  </div>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {stats?.totalUsers || 0}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{stats?.activeUsers || 0} Active</span>
                  <span style={{ color: 'var(--text-muted)' }}>•</span>
                  <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{stats?.bannedUsers || 0} Suspended</span>
                </div>
              </div>

              {/* Total Products */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Products</span>
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.4rem', borderRadius: 'var(--radius-sm)', color: 'var(--accent)' }}>
                    <Package size={20} />
                  </div>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {stats?.totalProducts || 0}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{stats?.activeProducts || 0} Active</span>
                  <span style={{ color: 'var(--text-muted)' }}>•</span>
                  <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{stats?.delistedProducts || 0} Delisted</span>
                  <span style={{ color: 'var(--text-muted)' }}>•</span>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>{stats?.soldProducts || 0} Sold</span>
                </div>
              </div>

              {/* Total Completed Orders */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Completed Orders</span>
                  <div style={{ background: 'rgba(37, 99, 235, 0.1)', padding: '0.4rem', borderRadius: 'var(--radius-sm)', color: '#2563eb' }}>
                    <ShoppingBag size={20} />
                  </div>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {stats?.totalOrders || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Total peer-to-peer campus trades
                </div>
              </div>

              {/* Total Volume */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Trading Volume</span>
                  <div style={{ background: 'rgba(217, 119, 6, 0.1)', padding: '0.4rem', borderRadius: 'var(--radius-sm)', color: '#d97706' }}>
                    <TrendingUp size={20} />
                  </div>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>
                  ₹{(stats?.totalVolume || 0).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600, marginTop: '0.5rem' }}>
                  100% Student Value Kept (Zero Fees)
                </div>
              </div>
            </div>

            {/* Quick Management Navigation Cards */}
            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--primary)' }}>
                Administration Modules
              </h3>
              <div className="grid-cols-3" style={{ gap: '1.25rem' }}>
                <Link to="/admin/users" className="card" style={{ padding: '1.5rem', textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <Users size={22} color="var(--teal)" />
                    <h4 style={{ fontSize: '1.05rem', margin: 0 }}>Manage Students</h4>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    View all verified UoH student accounts, suspend rule breakers (Ban), restore (Unban), or permanently hard-delete user data.
                  </p>
                  <span style={{ color: 'var(--teal)', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    Open User Manager <ArrowRight size={14} />
                  </span>
                </Link>

                <Link to="/admin/products" className="card" style={{ padding: '1.5rem', textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <Package size={22} color="var(--accent)" />
                    <h4 style={{ fontSize: '1.05rem', margin: 0 }}>Manage Products</h4>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    Review listings across categories, delist inappropriate products without deleting records, or relist approved items.
                  </p>
                  <span style={{ color: 'var(--teal)', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    Open Product Governance <ArrowRight size={14} />
                  </span>
                </Link>

                <Link to="/admin/categories" className="card" style={{ padding: '1.5rem', textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <FolderTree size={22} color="#2563eb" />
                    <h4 style={{ fontSize: '1.05rem', margin: 0 }}>Manage Categories</h4>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    Create new campus marketplace categories, edit descriptions, or remove unused categories safely.
                  </p>
                  <span style={{ color: 'var(--teal)', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    Open Category Editor <ArrowRight size={14} />
                  </span>
                </Link>
              </div>
            </div>

            {/* Recent Administrative Activity Logs */}
            <div className="card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={18} color="var(--primary)" />
                  <h3 style={{ fontSize: '1.15rem' }}>Recent Administrative Logs</h3>
                </div>
                <Link to="/admin/logs" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  View All Logs ({recentActivity.length}) →
                </Link>
              </div>

              {recentActivity.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No activity logs recorded yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {recentActivity.map((log) => (
                    <div
                      key={log.id}
                      style={{
                        padding: '0.85rem 1rem',
                        backgroundColor: 'var(--bg-subtle)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.85rem'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <span className="badge badge-new" style={{ fontSize: '0.68rem' }}>
                            {log.action}
                          </span>
                          <span style={{ fontWeight: 600 }}>{log.description}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Admin: {log.admin_name || 'System'}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
