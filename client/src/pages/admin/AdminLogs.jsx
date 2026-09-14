import React, { useState, useEffect } from 'react';
import { History, Shield, Clock } from 'lucide-react';
import { api } from '../../services/api';
import AdminSidebar from '../../components/AdminSidebar';

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        const data = await api.getAdminLogs();
        setLogs(data.logs || []);
      } catch (err) {
        console.error('Failed to load admin logs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-content">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>Administrative Activity Logs</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Permanent tamper-evident audit trail of all actions performed by campus administrators
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            Loading audit logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No administrative actions recorded yet.
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Target Type</th>
                  <th>Administrator</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={13} />
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-new" style={{ fontSize: '0.72rem' }}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.8rem' }}>{log.target_type}</code>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                        {log.admin_name || 'System / Initial Seed'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {log.admin_email}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                      {log.description}
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
