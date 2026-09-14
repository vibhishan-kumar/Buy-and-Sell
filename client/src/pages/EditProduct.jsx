import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, X, AlertCircle, ArrowRight, Trash2, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    condition: 'Good',
    location: '',
    status: 'ACTIVE'
  });
  const [existingImages, setExistingImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, prodRes] = await Promise.all([
          api.getCategories(),
          api.getProductById(id)
        ]);
        setCategories(catRes.categories || []);
        const p = prodRes.product;

        if (user && p.seller_id !== user.id && user.role !== 'admin') {
          showToast('You are not authorized to edit this listing.', 'error');
          navigate(`/products/${id}`);
          return;
        }

        setFormData({
          name: p.name,
          description: p.description,
          price: p.price,
          category_id: p.category_id,
          condition: p.condition,
          location: p.location,
          status: p.status
        });
        setExistingImages(p.images || []);
      } catch (err) {
        setErrorMsg(err.message || 'Failed to load product for editing.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNewFiles = (e) => {
    const files = Array.from(e.target.files);
    setNewImageFiles((prev) => [...prev, ...files]);
    const previews = files.map((f) => URL.createObjectURL(f));
    setNewPreviews((prev) => [...prev, ...previews]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const data = new FormData();
      data.append('name', formData.name.trim());
      data.append('description', formData.description.trim());
      data.append('price', formData.price);
      data.append('category_id', formData.category_id);
      data.append('condition', formData.condition);
      data.append('location', formData.location);
      data.append('status', formData.status);

      newImageFiles.forEach((file) => {
        data.append('images', file);
      });

      await api.updateProduct(id, data);
      showToast('Product listing updated successfully!', 'success');
      navigate(`/products/${id}`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.deleteProduct(id);
      showToast('Listing deleted successfully.', 'success');
      navigate('/my-listings');
    } catch (err) {
      showToast(err.message || 'Failed to delete listing', 'error');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return <div className="container" style={{ padding: '5rem 0', textAlign: 'center' }}>Loading product...</div>;
  }

  return (
    <div className="container" style={{ padding: '2.5rem 1.25rem 4rem 1.25rem', maxWidth: '720px' }}>
      <button onClick={() => navigate(-1)} className="btn btn-outline btn-sm" style={{ marginBottom: '1.5rem' }}>
        <ArrowLeft size={16} />
        <span>Back</span>
      </button>

      <div className="card" style={{ padding: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', color: 'var(--primary)' }}>Edit Product Listing</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Update your listing details or status</p>
          </div>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={() => setShowDeleteModal(true)}
          >
            <Trash2 size={16} />
            <span>Delete Listing</span>
          </button>
        </div>

        {errorMsg && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Status Selection */}
          <div className="form-group">
            <label className="form-label">Listing Status</label>
            <select
              name="status"
              className="form-control"
              value={formData.status}
              onChange={handleInputChange}
            >
              <option value="ACTIVE">ACTIVE (Available on Marketplace)</option>
              <option value="SOLD">SOLD (Mark as completed)</option>
              <option value="DELISTED">DELISTED (Hidden from catalog)</option>
            </select>
          </div>

          {/* Title */}
          <div className="form-group">
            <label className="form-label">Product Title *</label>
            <input
              type="text"
              name="name"
              className="form-control"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Category & Condition */}
          <div className="grid-cols-2">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                name="category_id"
                className="form-control"
                value={formData.category_id}
                onChange={handleInputChange}
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Condition *</label>
              <select
                name="condition"
                className="form-control"
                value={formData.condition}
                onChange={handleInputChange}
                required
              >
                <option value="New">New</option>
                <option value="Like New">Like New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
              </select>
            </div>
          </div>

          {/* Price & Location */}
          <div className="grid-cols-2">
            <div className="form-group">
              <label className="form-label">Price (₹) *</label>
              <input
                type="number"
                name="price"
                min="0"
                className="form-control"
                value={formData.price}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Campus Location *</label>
              <input
                type="text"
                name="location"
                className="form-control"
                value={formData.location}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea
              name="description"
              className="form-control"
              rows={5}
              value={formData.description}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Existing Photos */}
          <div className="form-group">
            <label className="form-label">Current Photos</label>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              {existingImages.map((img) => (
                <div key={img.id} style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <img src={img.image_url} alt="Product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
            <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
              <Upload size={16} />
              <span>Add More Photos</span>
              <input type="file" accept="image/*" multiple onChange={handleNewFiles} style={{ display: 'none' }} />
            </label>
            {newPreviews.length > 0 && (
              <span style={{ fontSize: '0.8rem', color: 'var(--teal)', marginLeft: '0.75rem' }}>
                +{newPreviews.length} new photo(s) selected
              </span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={isSubmitting}
            style={{ marginTop: '1rem' }}
          >
            {isSubmitting ? 'Saving Changes...' : 'Save Listing Changes'}
            <ArrowRight size={18} />
          </button>
        </form>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Listing"
        message="Are you sure you want to permanently delete this product listing? This action cannot be undone."
        confirmText="Delete Listing"
        isDanger={true}
        isProcessing={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
