import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, PlusCircle, Edit, Trash2, CheckCircle, Eye, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

export default function MyListings() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('ALL');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const data = await api.getMyListings(activeTab === 'ALL' ? '' : activeTab);
      setListings(data.products || []);
    } catch (err) {
      console.error('Failed to load listings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [activeTab]);

  const handleMarkAsSold = async (id) => {
    try {
      await api.markAsSold(id);
      showToast('Product marked as SOLD!', 'success');
      fetchListings();
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleDeleteListing = async () => {
    if (!selectedProduct) return;
    setIsDeleting(true);
    try {
      await api.deleteProduct(selectedProduct.id);
      showToast('Listing deleted successfully.', 'success');
      setShowDeleteModal(false);
      setSelectedProduct(null);
      fetchListings();
    } catch (err) {
      showToast(err.message || 'Failed to delete listing', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.25rem 4rem 1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>My Marketplace Listings</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
            Manage and track your products listed across the UoH campus
          </p>
        </div>
        <Link to="/add-product" className="btn btn-accent">
          <PlusCircle size={18} />
          <span>Post New Item</span>
        </Link>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
        {['ALL', 'ACTIVE', 'SOLD', 'DELISTED'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: activeTab === tab ? 'var(--primary)' : 'transparent',
              color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'var(--transition)'
            }}
          >
            {tab === 'ALL' ? 'All Listings' : tab}
          </button>
        ))}
      </div>

      {/* Listings List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          Loading your listings...
        </div>
      ) : listings.length === 0 ? (
        <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <Package size={52} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
          <h3>No {activeTab !== 'ALL' ? activeTab.toLowerCase() : ''} listings found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.5rem 0 1.5rem 0' }}>
            Ready to sell your textbooks, dorm essentials or campus gear?
          </p>
          <Link to="/add-product" className="btn btn-primary">
            Create a Listing
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {listings.map((p) => (
            <div
              key={p.id}
              className="card"
              style={{
                padding: '1.25rem',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '1.25rem',
                justifyContent: 'space-between'
              }}
            >
              {/* Image & Title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 320px' }}>
                <img
                  src={p.primary_image}
                  alt={p.name}
                  style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span className={`badge ${p.status === 'ACTIVE' ? 'badge-active' : p.status === 'SOLD' ? 'badge-sold' : 'badge-delisted'}`}>
                      {p.status}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {p.category_name} • {p.condition}
                    </span>
                  </div>
                  <Link to={`/products/${p.id}`} style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--primary)' }}>
                    {p.name}
                  </Link>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    Campus Location: {p.location}
                  </div>
                </div>
              </div>

              {/* Price & Metrics */}
              <div style={{ textAlign: 'right', flex: '0 0 auto' }}>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)' }}>
                  ₹{parseFloat(p.price).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {p.wishlist_count || 0} students saved
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '0 0 auto' }}>
                <Link to={`/products/${p.id}`} className="btn btn-outline btn-sm" title="View Listing">
                  <Eye size={15} />
                  <span>View</span>
                </Link>

                <Link to={`/edit-product/${p.id}`} className="btn btn-outline btn-sm" title="Edit Listing">
                  <Edit size={15} />
                  <span>Edit</span>
                </Link>

                {p.status === 'ACTIVE' && (
                  <button
                    onClick={() => handleMarkAsSold(p.id)}
                    className="btn btn-outline btn-sm"
                    style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
                    title="Mark as Sold"
                  >
                    <CheckCircle size={15} />
                    <span>Mark Sold</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setSelectedProduct(p);
                    setShowDeleteModal(true);
                  }}
                  className="btn btn-outline btn-sm"
                  style={{ color: 'var(--danger)', borderColor: '#fca5a5' }}
                  title="Delete Listing"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Listing"
        message={`Are you sure you want to permanently remove "${selectedProduct?.name}"?`}
        confirmText="Yes, Delete"
        isDanger={true}
        isProcessing={isDeleting}
        onConfirm={handleDeleteListing}
        onCancel={() => {
          setShowDeleteModal(false);
          setSelectedProduct(null);
        }}
      />
    </div>
  );
}
