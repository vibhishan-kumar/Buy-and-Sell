import React from 'react';
import { Filter, RotateCcw, Check } from 'lucide-react';

export default function FilterSidebar({
  categories = [],
  selectedCategory,
  onSelectCategory,
  condition,
  onSelectCondition,
  minPrice,
  maxPrice,
  onPriceChange,
  sort,
  onSortChange,
  onReset
}) {
  const conditionsList = ['New', 'Like New', 'Good', 'Fair'];

  const pricePresets = [
    { label: 'Under ₹500', min: '', max: '500' },
    { label: '₹500 - ₹2,000', min: '500', max: '2000' },
    { label: '₹2,000 - ₹5,000', min: '2000', max: '5000' },
    { label: 'Above ₹5,000', min: '5000', max: '' }
  ];

  return (
    <div className="card" style={{ padding: '1.25rem', position: 'sticky', top: '5.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1rem', color: 'var(--primary)' }}>
          <Filter size={18} />
          <span>Filters</span>
        </div>
        <button
          onClick={onReset}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--teal)',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}
        >
          <RotateCcw size={12} />
          <span>Reset</span>
        </button>
      </div>

      {/* Sort By */}
      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
        <label className="form-label" style={{ fontSize: '0.85rem' }}>Sort By</label>
        <select
          className="form-control"
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          style={{ fontSize: '0.85rem' }}
        >
          <option value="newest">Newest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      {/* Category List */}
      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
        <label className="form-label" style={{ fontSize: '0.85rem' }}>Category</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '200px', overflowY: 'auto' }}>
          <button
            type="button"
            onClick={() => onSelectCategory('')}
            style={{
              textAlign: 'left',
              padding: '0.45rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: selectedCategory === '' ? 'var(--bg-subtle)' : 'transparent',
              fontWeight: selectedCategory === '' ? 700 : 500,
              color: selectedCategory === '' ? 'var(--teal)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>All Categories</span>
            {selectedCategory === '' && <Check size={14} />}
          </button>

          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectCategory(c.name)}
              style={{
                textAlign: 'left',
                padding: '0.45rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: selectedCategory === c.name ? 'var(--bg-subtle)' : 'transparent',
                fontWeight: selectedCategory === c.name ? 700 : 500,
                color: selectedCategory === c.name ? 'var(--teal)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.name}
              </span>
              {selectedCategory === c.name && <Check size={14} />}
            </button>
          ))}
        </div>
      </div>

      {/* Condition */}
      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
        <label className="form-label" style={{ fontSize: '0.85rem' }}>Condition</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {conditionsList.map((cond) => {
            const isSelected = condition === cond;
            return (
              <button
                key={cond}
                type="button"
                onClick={() => onSelectCondition(isSelected ? '' : cond)}
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: 'var(--radius-full)',
                  border: isSelected ? '1.5px solid var(--teal)' : '1px solid var(--border)',
                  background: isSelected ? 'rgba(8, 145, 178, 0.1)' : '#fff',
                  color: isSelected ? 'var(--teal)' : 'var(--text-secondary)',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                {cond}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Range */}
      <div className="form-group" style={{ marginBottom: '1rem' }}>
        <label className="form-label" style={{ fontSize: '0.85rem' }}>Price Range (₹)</label>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
          <input
            type="number"
            placeholder="Min"
            className="form-control"
            value={minPrice}
            onChange={(e) => onPriceChange(e.target.value, maxPrice)}
            style={{ fontSize: '0.82rem', padding: '0.45rem 0.6rem' }}
          />
          <span style={{ color: 'var(--text-muted)' }}>-</span>
          <input
            type="number"
            placeholder="Max"
            className="form-control"
            value={maxPrice}
            onChange={(e) => onPriceChange(minPrice, e.target.value)}
            style={{ fontSize: '0.82rem', padding: '0.45rem 0.6rem' }}
          />
        </div>

        {/* Quick Presets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {pricePresets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => onPriceChange(p.min, p.max)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.78rem',
                textAlign: 'left',
                cursor: 'pointer',
                padding: '0.25rem 0'
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
