import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit, Trash2, FolderTree, AlertCircle, X } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import AdminSidebar from '../../components/AdminSidebar';
import ConfirmModal from '../../components/ConfirmModal';

export default function AdminCategories() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Delete modal
  const [selectedForDelete, setSelectedForDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await api.getCategories();
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCurrentId(null);
    setCategoryName('');
    setCategoryDesc('');
    setModalError('');
    setShowModal(true);
  };

  const handleOpenEdit = (cat) => {
    setIsEditing(true);
    setCurrentId(cat.id);
    setCategoryName(cat.name);
    setCategoryDesc(cat.description || '');
    setModalError('');
    setShowModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!categoryName.trim()) {
      setModalError('Category name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await api.editCategory(currentId, {
          name: categoryName.trim(),
          description: categoryDesc.trim()
        });
        showToast('Category updated successfully.', 'success');
      } else {
        await api.addCategory({
          name: categoryName.trim(),
          description: categoryDesc.trim()
        });
        showToast('New category created successfully.', 'success');
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      setModalError(err.message || 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedForDelete) return;
    try {
      await api.deleteCategory(selectedForDelete.id);
      showToast('Category deleted successfully.', 'success');
      setShowDeleteModal(false);
      setSelectedForDelete(null);
      fetchCategories();
    } catch (err) {
      showToast(err.message || 'Failed to delete category', 'error');
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>Manage Marketplace Categories</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Create, modify, and manage product classifications across the university
            </p>
          </div>
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <PlusCircle size={18} />
            <span>Add Category</span>
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            Loading categories...
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Category Name</th>
                  <th>Description</th>
                  <th>Active Products</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ background: 'rgba(8, 145, 178, 0.1)', color: 'var(--teal)', padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}>
                          <FolderTree size={16} />
                        </div>
                        <span style={{ fontWeight: 700 }}>{c.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {c.description || 'No description'}
                    </td>
                    <td>
                      <span className="badge badge-active">
                        {c.active_products_count || 0} items
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="btn btn-outline btn-sm"
                          title="Edit Category"
                        >
                          <Edit size={14} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedForDelete(c);
                            setShowDeleteModal(true);
                          }}
                          className="btn btn-outline btn-sm"
                          style={{ color: 'var(--danger)', borderColor: '#fca5a5' }}
                          title="Delete Category"
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

        {/* Add / Edit Category Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
              <div className="modal-header">
                <h3 style={{ fontSize: '1.15rem' }}>
                  {isEditing ? 'Edit Category' : 'Create New Category'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveCategory} className="modal-body">
                {modalError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                    {modalError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Category Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Lab Equipment & Coats"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description (Optional)</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Brief description of items in this category"
                    value={categoryDesc}
                    onChange={(e) => setCategoryDesc(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : isEditing ? 'Update Category' : 'Create Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        <ConfirmModal
          isOpen={showDeleteModal}
          title="Delete Category"
          message={`Are you sure you want to delete category "${selectedForDelete?.name}"? If it contains existing products, deletion will be safely rejected.`}
          confirmText="Yes, Delete"
          isDanger={true}
          onConfirm={handleDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setSelectedForDelete(null);
          }}
        />
      </main>
    </div>
  );
}
