import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, EyeOff, RotateCcw, AlertTriangle, ExternalLink } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import AdminSidebar from '../../components/AdminSidebar';

export default function AdminProducts() {
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminProducts({
        q: searchQuery,
        status: statusFilter,
        category: categoryFilter
      });
      setProducts(data.products || []);
    } catch (err) {
      console.error('Failed to load admin products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        const catRes = await api.getCategories();
        setCategories(catRes.categories || []);
      } catch (err) {
        console.error(err);
      }
      fetchProducts();
    }
    init();
  }, [statusFilter, categoryFilter]);

  const handleDelist = async (id, name) => {
    try {
      const res = await api.delistProduct(id);
      showToast(res.message, 'success');
      fetchProducts();
    } catch (err) {
      showToast(err.message || 'Failed to delist product', 'error');
    }
  };

  const handleRelist = async (id, name) => {
    try {
      const res = await api.relistProduct(id);
      showToast(res.message, 'success');
      fetchProducts();
    } catch (err) {
      showToast(err.message || 'Failed to relist product', 'error');
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-content">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>Marketplace Product Governance</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Delist policy-violating items without deleting records, or restore delisted listings
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchProducts();
            }}
            style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}
          >
            <div style={{ flex: '1 1 240px', position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search products or seller name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            <select
              className="form-control"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ width: 'auto', minWidth: '180px' }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: 'auto', minWidth: '140px' }}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="SOLD">SOLD</option>
              <option value="DELISTED">DELISTED</option>
            </select>

            <button type="submit" className="btn btn-primary">
              Filter
            </button>
          </form>
        </div>

        {/* Products Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            Loading marketplace products...
          </div>
        ) : products.length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No products match the selected filters.
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Seller</th>
                  <th>Campus Location</th>
                  <th>Status</th>
                  <th>Listed Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img
                          src={p.primary_image}
                          alt={p.name}
                          style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.condition}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{p.category_name}</span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      ₹{parseFloat(p.price).toLocaleString('en-IN')}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{p.seller_name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.seller_email}</div>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {p.location}
                    </td>
                    <td>
                      <span className={`badge ${p.status === 'ACTIVE' ? 'badge-active' : p.status === 'SOLD' ? 'badge-sold' : 'badge-delisted'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <Link
                          to={`/products/${p.id}`}
                          className="btn btn-outline btn-sm"
                          target="_blank"
                          title="Open product in new tab"
                        >
                          <ExternalLink size={14} />
                        </Link>

                        {p.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleDelist(p.id, p.name)}
                            className="btn btn-outline btn-sm"
                            style={{ color: 'var(--danger)', borderColor: '#fca5a5' }}
                            title="Delist from public catalog"
                          >
                            <EyeOff size={14} />
                            <span>Delist</span>
                          </button>
                        )}

                        {p.status === 'DELISTED' && (
                          <button
                            onClick={() => handleRelist(p.id, p.name)}
                            className="btn btn-outline btn-sm"
                            style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
                            title="Relist back to public catalog"
                          >
                            <RotateCcw size={14} />
                            <span>Relist</span>
                          </button>
                        )}
                      </div>
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
