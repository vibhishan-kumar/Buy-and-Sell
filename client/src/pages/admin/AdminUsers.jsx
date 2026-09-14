import React, { useState, useEffect } from 'react';
import { Search, Ban, CheckCircle, Trash2, AlertTriangle, ShieldCheck, UserCheck } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import AdminSidebar from '../../components/AdminSidebar';
import ConfirmModal from '../../components/ConfirmModal';

export default function AdminUsers() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminUsers({ q: searchQuery, status: statusFilter });
      setUsers(data.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  // 1. Ban User Action
  const handleBan = async () => {
    if (!selectedUser) return;
    setIsProcessing(true);
    try {
      const res = await api.banUser(selectedUser.id);
      showToast(res.message, 'success');
      setShowBanModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Failed to ban user', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Unban User Action
  const handleUnban = async (user) => {
    try {
      const res = await api.unbanUser(user.id);
      showToast(res.message, 'success');
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Failed to unban user', 'error');
    }
  };

  // 3. Permanent Hard Delete User Action
  const handleDelete = async () => {
    if (!selectedUser) return;
    setIsProcessing(true);
    try {
      const res = await api.deleteUser(selectedUser.id);
      showToast(res.message, 'success');
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Failed to delete user', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-content">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>Manage Student Accounts</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Monitor verified campus students, enforce suspensions (Ban), or execute permanent hard deletions
          </p>
        </div>

        {/* Filters and Search Bar */}
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 260px', position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search by student name, @uohyd.ac.in email, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: 'auto', minWidth: '160px' }}
            >
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="banned">Suspended / Banned Only</option>
            </select>

            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </form>
        </div>

        {/* Users Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            Loading student accounts...
          </div>
        ) : users.length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No students found matching your criteria.
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>UoH Email</th>
                  <th>Department</th>
                  <th>Registered</th>
                  <th>Status</th>
                  <th>Listings</th>
                  <th>Purchases</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ backgroundColor: u.is_banned ? '#fef2f2' : undefined }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img
                          src={u.profile_image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                          alt={u.name}
                          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <span style={{ fontWeight: 600 }}>{u.name}</span>
                      </div>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.82rem', background: 'var(--bg-subtle)', padding: '0.2rem 0.4rem', borderRadius: 'var(--radius-sm)' }}>
                        {u.email}
                      </code>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.department || 'General'}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <span className={`badge ${u.is_banned ? 'badge-delisted' : 'badge-active'}`}>
                        {u.is_banned ? 'Banned' : 'Active'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{u.listings_count || 0}</td>
                    <td style={{ fontWeight: 600 }}>{u.purchases_count || 0}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        {u.is_banned ? (
                          <button
                            onClick={() => handleUnban(u)}
                            className="btn btn-outline btn-sm"
                            style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
                            title="Unban student"
                          >
                            <CheckCircle size={14} />
                            <span>Unban</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setShowBanModal(true);
                            }}
                            className="btn btn-outline btn-sm"
                            style={{ color: '#d97706', borderColor: '#fde68a' }}
                            title="Ban student"
                          >
                            <Ban size={14} />
                            <span>Ban</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setShowDeleteModal(true);
                          }}
                          className="btn btn-outline btn-sm"
                          style={{ color: 'var(--danger)', borderColor: '#fca5a5' }}
                          title="Permanently Delete User"
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Ban User Confirmation Modal */}
        <ConfirmModal
          isOpen={showBanModal}
          title="Ban Student Account"
          message={`Are you sure you want to suspend student account "${selectedUser?.name}" (${selectedUser?.email})? Their existing listings will be hidden from the public marketplace, and they will not be able to log in.`}
          confirmText="Yes, Ban Account"
          isDanger={true}
          isProcessing={isProcessing}
          onConfirm={handleBan}
          onCancel={() => {
            setShowBanModal(false);
            setSelectedUser(null);
          }}
        />

        {/* Permanent Hard Delete Modal */}
        <ConfirmModal
          isOpen={showDeleteModal}
          title="Permanently Delete User"
          message={`Are you sure you want to permanently delete this user? All associated data will be permanently removed. This includes listings, messages, reviews, and transaction records.`}
          confirmText="Permanently Delete User"
          isDanger={true}
          isProcessing={isProcessing}
          onConfirm={handleDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setSelectedUser(null);
          }}
        />
      </main>
    </div>
  );
}
