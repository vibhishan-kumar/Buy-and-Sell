import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, AlertCircle, ArrowRight, MapPin, Tag, PlusCircle } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function AddProduct() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    condition: 'Good',
    location: 'Men\'s Hostel J (MH-J)'
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const campusLocations = [
    'Men\'s Hostel J (MH-J)',
    'Men\'s Hostel K (MH-K)',
    'Men\'s Hostel F (MH-F)',
    'Ladies Hostel A (LH-A)',
    'Ladies Hostel B (LH-B)',
    'Ladies Hostel C (LH-C)',
    'South Campus Shopping Complex',
    'Indira Gandhi Memorial (IGM) Library Steps',
    'SCIS Building Entrance',
    'School of Chemistry Foyer',
    'School of Physics Foyer',
    'School of Management Studies Porch',
    'University Main Ground Pavilion',
    'Campus Lake Road Cafeteria',
    'Old Campus / Golden Threshold Wing',
    'Other UoH Campus Spot'
  ];

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await api.getCategories();
        setCategories(res.categories || []);
        if (res.categories && res.categories.length > 0) {
          setFormData((prev) => ({ ...prev, category_id: res.categories[0].id }));
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    loadCategories();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg('');
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (imageFiles.length + files.length > 5) {
      setErrorMsg('You can upload up to 5 images per listing.');
      return;
    }

    const newFiles = [...imageFiles, ...files];
    setImageFiles(newFiles);

    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const handleRemoveImage = (index) => {
    const nextFiles = imageFiles.filter((_, i) => i !== index);
    const nextPreviews = imagePreviews.filter((_, i) => i !== index);
    setImageFiles(nextFiles);
    setImagePreviews(nextPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim() || !formData.description.trim() || !formData.price) {
      setErrorMsg('Please complete all required product listing details.');
      return;
    }

    if (parseFloat(formData.price) < 0) {
      setErrorMsg('Price must be greater than or equal to 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append('name', formData.name.trim());
      data.append('description', formData.description.trim());
      data.append('price', formData.price);
      data.append('category_id', formData.category_id);
      data.append('condition', formData.condition);
      data.append('location', formData.location);

      // Append image files
      imageFiles.forEach((file) => {
        data.append('images', file);
      });

      const res = await api.createProduct(data);
      showToast('Listing posted successfully to UoH Marketplace!', 'success');
      navigate(`/products/${res.product.id}`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create product listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.25rem 4rem 1.25rem', maxWidth: '720px' }}>
      <div className="card" style={{ padding: '2.5rem' }}>
        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: '1.6rem', color: 'var(--primary)' }}>Post a New Campus Listing</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
            List books, electronics, dorm items or bicycles for sale to fellow UoH students
          </p>
        </div>

        {errorMsg && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.85rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Photos Upload Section */}
          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label className="form-label">Product Photos (Up to 5 images)</label>

            {/* Thumbnails grid */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
              {imagePreviews.map((previewUrl, idx) => (
                <div
                  key={idx}
                  style={{
                    position: 'relative',
                    width: '90px',
                    height: '90px',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    border: '1px solid var(--border)'
                  }}
                >
                  <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      background: 'rgba(0,0,0,0.6)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={12} />
                  </button>
                  {idx === 0 && (
                    <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--primary)', color: '#fff', fontSize: '0.65rem', textAlign: 'center', fontWeight: 600 }}>
                      Primary
                    </span>
                  )}
                </div>
              ))}

              {imageFiles.length < 5 && (
                <label
                  style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: 'var(--radius-md)',
                    border: '2px dashed var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    transition: 'var(--transition)'
                  }}
                >
                  <Upload size={20} />
                  <span style={{ marginTop: '0.2rem' }}>Add Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>
            <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              Clear photos of the actual item help items sell 3x faster.
            </small>
          </div>

          {/* Product Title */}
          <div className="form-group">
            <label className="form-label">Product Name / Title *</label>
            <input
              type="text"
              name="name"
              className="form-control"
              placeholder="e.g. CLRS Algorithms 4th Edition, Orient 400mm Table Fan..."
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
                <option value="New">New (Unopened / Unused)</option>
                <option value="Like New">Like New (Barely used)</option>
                <option value="Good">Good (Working fine with minor cosmetic wear)</option>
                <option value="Fair">Fair (Noticeable wear but functional)</option>
              </select>
            </div>
          </div>

          {/* Price & Location */}
          <div className="grid-cols-2">
            <div className="form-group">
              <label className="form-label">Price in ₹ (INR) *</label>
              <input
                type="number"
                name="price"
                min="0"
                step="1"
                className="form-control"
                placeholder="e.g. 750"
                value={formData.price}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Campus Handover Location *</label>
              <select
                name="location"
                className="form-control"
                value={formData.location}
                onChange={handleInputChange}
                required
              >
                {campusLocations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea
              name="description"
              className="form-control"
              rows={5}
              placeholder="Describe condition, reason for selling, inclusions (cables, manuals, bills), and preferred campus meeting hours..."
              value={formData.description}
              onChange={handleInputChange}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={isSubmitting}
            style={{ marginTop: '1rem' }}
          >
            {isSubmitting ? 'Publishing Listing...' : 'Publish Campus Listing'}
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
