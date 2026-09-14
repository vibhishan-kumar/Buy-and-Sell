import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, PackageSearch } from 'lucide-react';
import { api } from '../services/api';
import ProductCard from '../components/ProductCard';
import FilterSidebar from '../components/FilterSidebar';
import Pagination from '../components/Pagination';

export default function Marketplace() {
  const [searchParams, setSearchParams] = useSearchParams();

  // State initialized from URL query params
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Filter params
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const condition = searchParams.get('condition') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Load categories once
  useEffect(() => {
    async function loadCats() {
      try {
        const res = await api.getCategories();
        setCategories(res.categories || []);
      } catch (err) {
        console.warn('Failed to load categories:', err);
      }
    }
    loadCats();
  }, []);

  // Fetch products whenever search params change
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const data = await api.getProducts({
          q,
          category,
          condition,
          minPrice,
          maxPrice,
          sort,
          page,
          limit: 12
        });
        setProducts(data.products || []);
        setPagination(data.pagination || { currentPage: 1, totalPages: 1, totalCount: 0 });
      } catch (err) {
        console.error('Failed to fetch marketplace products:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [searchParams]);

  // Update query params helper
  const updateFilter = (newParams) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, val]) => {
      if (val === '' || val === null || val === undefined) {
        next.delete(key);
      } else {
        next.set(key, val);
      }
    });
    // Reset to page 1 unless changing page specifically
    if (!('page' in newParams)) {
      next.set('page', '1');
    }
    setSearchParams(next);
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="container" style={{ padding: '2rem 1.25rem 4rem 1.25rem' }}>
      {/* Title & Results Count Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>
            {category ? `${category}` : q ? `Search results for "${q}"` : 'Marketplace Catalog'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
            {loading ? 'Searching campus inventory...' : `Showing ${pagination.totalCount} active items from UoH students`}
          </p>
        </div>

        {/* Mobile Filter Toggle Button */}
        <button
          className="btn btn-outline btn-sm"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <SlidersHorizontal size={16} />
          <span>{showMobileFilters ? 'Hide Filters' : 'Filters & Sort'}</span>
        </button>
      </div>

      {/* Main Layout Grid: Sidebar + Product Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Left Filter Sidebar */}
        <div style={{ display: showMobileFilters ? 'block' : undefined }}>
          <FilterSidebar
            categories={categories}
            selectedCategory={category}
            onSelectCategory={(cat) => updateFilter({ category: cat })}
            condition={condition}
            onSelectCondition={(cond) => updateFilter({ condition: cond })}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onPriceChange={(min, max) => updateFilter({ minPrice: min, maxPrice: max })}
            sort={sort}
            onSortChange={(s) => updateFilter({ sort: s })}
            onReset={handleResetFilters}
          />
        </div>

        {/* Right Product Grid */}
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-muted)' }}>
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
              <PackageSearch size={54} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No products found</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
                We couldn't find any listings matching your current search or filter combination.
              </p>
              <button onClick={handleResetFilters} className="btn btn-primary">
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid-products">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={(p) => updateFilter({ page: p.toString() })}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
