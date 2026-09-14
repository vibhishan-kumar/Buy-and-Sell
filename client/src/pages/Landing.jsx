import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  ShieldCheck,
  Zap,
  BookOpen,
  Laptop,
  Bike,
  Home,
  ArrowRight,
  Sparkles,
  Users,
  Search
} from 'lucide-react';
import { api } from '../services/api';
import ProductCard from '../components/ProductCard';

export default function Landing() {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        const [catRes, prodRes] = await Promise.all([
          api.getCategories(),
          api.getProducts({ limit: 8, sort: 'newest' })
        ]);
        setCategories(catRes.categories || []);
        setFeaturedProducts(prodRes.products || []);
      } catch (err) {
        console.warn('Failed to load landing data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/marketplace?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/marketplace');
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section
        style={{
          background: 'linear-gradient(135deg, #0c2340 0%, #163660 50%, #0891b2 100%)',
          color: '#fff',
          padding: '5rem 0 4rem 0',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ maxWidth: '780px', margin: '0 auto', textAlign: 'center' }}>
            {/* Campus Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(8px)',
                padding: '0.35rem 0.9rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
                marginBottom: '1.5rem',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <ShieldCheck size={16} color="#34d399" />
              <span>Official University of Hyderabad Peer-to-Peer Hub</span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
                color: '#fff',
                marginBottom: '1.25rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1.15
              }}
            >
              Buy, Sell & Connect Across the <span style={{ color: '#38bdf8' }}>UoH Campus</span>
            </h1>

            <p
              style={{
                fontSize: 'clamp(1rem, 2vw, 1.2rem)',
                color: '#e2e8f0',
                marginBottom: '2.5rem',
                lineHeight: 1.6,
                fontWeight: 400
              }}
            >
              From semester textbooks and hostel fans to campus bicycles and electronics — trade directly with verified @uohyd.ac.in classmates safely with zero commissions.
            </p>

            {/* Hero Search Box */}
            <form onSubmit={handleHeroSearch} style={{ maxWidth: '580px', margin: '0 auto 2rem auto' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#fff',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.4rem 0.6rem 0.4rem 1.4rem',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                }}
              >
                <Search size={20} color="#64748b" style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="What are you looking for on campus today?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    padding: '0.7rem 0.9rem',
                    fontSize: '1rem',
                    color: '#0f172a'
                  }}
                />
                <button type="submit" className="btn btn-primary" style={{ borderRadius: 'var(--radius-full)', padding: '0.7rem 1.5rem' }}>
                  Search
                </button>
              </div>
            </form>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/marketplace" className="btn btn-accent btn-lg">
                Explore Marketplace
                <ArrowRight size={18} />
              </Link>
              <Link to="/add-product" className="btn btn-outline btn-lg" style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#fff' }}>
                Post a Free Listing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Safety Highlights */}
      <section style={{ backgroundColor: '#fff', borderBottom: '1px solid var(--border)', padding: '2.5rem 0' }}>
        <div className="container">
          <div className="grid-cols-3" style={{ gap: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ background: '#eff6ff', padding: '0.75rem', borderRadius: 'var(--radius-md)', color: '#2563eb' }}>
                <ShieldCheck size={28} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.05rem', marginBottom: '0.3rem' }}>UoH Email Verification</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Only verified accounts with official <code>@uohyd.ac.in</code> credentials can access, list, and buy products.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ background: '#ecfdf5', padding: '0.75rem', borderRadius: 'var(--radius-md)', color: '#059669' }}>
                <Zap size={28} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.05rem', marginBottom: '0.3rem' }}>Real-Time Student Chat</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Message sellers instantly through in-app Socket.IO chat to ask questions and coordinate hostel meetups.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ background: '#fef3c7', padding: '0.75rem', borderRadius: 'var(--radius-md)', color: '#d97706' }}>
                <Sparkles size={28} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.05rem', marginBottom: '0.3rem' }}>Razorpay Sandbox & Reviews</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Test sandbox payments, prevent double purchases, and leave verified ratings for trusted student sellers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section style={{ padding: '4rem 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
            <div>
              <span style={{ color: 'var(--teal)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Campus Catalog
              </span>
              <h2 style={{ fontSize: '1.8rem', marginTop: '0.2rem' }}>Shop by Category</h2>
            </div>
            <Link to="/marketplace" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span>View All</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
            {categories.map((c) => (
              <Link
                key={c.id}
                to={`/marketplace?category=${encodeURIComponent(c.name)}`}
                className="card"
                style={{
                  padding: '1.25rem 0.75rem',
                  textAlign: 'center',
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}
              >
                <div
                  style={{
                    width: '3.2rem',
                    height: '3.2rem',
                    borderRadius: '50%',
                    background: 'rgba(8, 145, 178, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--teal)'
                  }}
                >
                  <ShoppingBag size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.2rem' }}>{c.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {c.active_products_count || 0} items
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured / Fresh Campus Listings */}
      <section style={{ padding: '0 0 5rem 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
            <div>
              <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Latest Arrivals
              </span>
              <h2 style={{ fontSize: '1.8rem', marginTop: '0.2rem' }}>Recently Listed by Students</h2>
            </div>
            <Link to="/marketplace" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span>Browse All Listings</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              Loading campus listings...
            </div>
          ) : featuredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
              <h3>No items listed yet</h3>
              <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 1.5rem 0' }}>Be the first student to post an item on UoH Marketplace!</p>
              <Link to="/add-product" className="btn btn-primary">Post First Listing</Link>
            </div>
          ) : (
            <div className="grid-products">
              {featuredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
