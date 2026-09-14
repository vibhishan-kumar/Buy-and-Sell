import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  FolderTree,
  ShoppingBag,
  History,
  ArrowLeft,
  LogOut,
  Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminSidebar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const navLinks = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/users', label: 'Manage Users', icon: Users },
    { to: '/admin/products', label: 'Manage Products', icon: Package },
    { to: '/admin/categories', label: 'Manage Categories', icon: FolderTree },
    { to: '/admin/orders', label: 'Orders & Transactions', icon: ShoppingBag },
    { to: '/admin/logs', label: 'Admin Activity Logs', icon: History }
  ];

  return (
    <aside className="admin-sidebar">
      {/* Header */}
      <div style={{ padding: '0.5rem 0.5rem 1.5rem 0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ background: '#ef4444', padding: '0.4rem', borderRadius: 'var(--radius-sm)', color: '#fff' }}>
            <Shield size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>UoH Admin</div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Campus Portal</div>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Switch back to Student marketplace */}
      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Link
          to="/marketplace"
          className="admin-nav-item"
          style={{ color: '#38bdf8' }}
        >
          <ArrowLeft size={18} />
          <span>Student Marketplace</span>
        </Link>

        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="admin-nav-item"
          style={{ background: 'none', border: 'none', color: '#f87171', width: '100%', textAlign: 'left', cursor: 'pointer' }}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
