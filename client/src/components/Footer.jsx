import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ShieldCheck, MapPin, Mail, School } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#fff', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
      <div className="container" style={{ padding: '3.5rem 1.25rem 2rem 1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2.5rem', marginBottom: '2.5rem' }}>
          {/* Col 1: About */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <div className="nav-brand-logo" style={{ width: '2rem', height: '2rem' }}>
                <ShoppingBag size={16} />
              </div>
              <span style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--primary)' }}>
                UoH <span style={{ color: 'var(--teal)' }}>Marketplace</span>
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '1rem' }}>
              The exclusive, verified peer-to-peer campus marketplace for students and scholars of the University of Hyderabad (UoH).
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600 }}>
              <ShieldCheck size={18} />
              <span>@uohyd.ac.in Verified Students Only</span>
            </div>
          </div>

          {/* Col 2: Campus Categories */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Categories
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.88rem' }}>
              <li><Link to="/marketplace?category=Books+%26+Study+Materials" style={{ color: 'var(--text-secondary)' }}>Books & Course Packs</Link></li>
              <li><Link to="/marketplace?category=Electronics" style={{ color: 'var(--text-secondary)' }}>Electronics & Calculators</Link></li>
              <li><Link to="/marketplace?category=Vehicles%2FBicycles" style={{ color: 'var(--text-secondary)' }}>Campus Bicycles</Link></li>
              <li><Link to="/marketplace?category=Hostel%2FDorm+Items" style={{ color: 'var(--text-secondary)' }}>Hostel Essentials</Link></li>
              <li><Link to="/marketplace?category=Furniture" style={{ color: 'var(--text-secondary)' }}>Study Tables & Chairs</Link></li>
            </ul>
          </div>

          {/* Col 3: Student Links */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Campus Community
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.88rem' }}>
              <li><Link to="/marketplace" style={{ color: 'var(--text-secondary)' }}>Browse All Items</Link></li>
              <li><Link to="/add-product" style={{ color: 'var(--text-secondary)' }}>Post a Free Listing</Link></li>
              <li><Link to="/wishlist" style={{ color: 'var(--text-secondary)' }}>Saved Wishlist</Link></li>
              <li><Link to="/messages" style={{ color: 'var(--text-secondary)' }}>Student In-App Chat</Link></li>
              <li><Link to="/orders" style={{ color: 'var(--text-secondary)' }}>Orders & Transactions</Link></li>
            </ul>
          </div>

          {/* Col 4: Campus Contact */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              University Location
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <School size={18} style={{ flexShrink: 0, color: 'var(--primary)' }} />
                <span>Prof. C.R. Rao Road, Gachibowli, Hyderabad 500046, Telangana</span>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <MapPin size={18} style={{ flexShrink: 0, color: 'var(--primary)' }} />
                <span>Recommended meeting hubs: Shopping Complex, IGM Library steps, DSW Office.</span>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <Mail size={18} style={{ flexShrink: 0, color: 'var(--primary)' }} />
                <span>support@uohyd.ac.in</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <div>
            © {new Date().getFullYear()} UoH Marketplace. Developed exclusively for University of Hyderabad students.
          </div>
          <div>
            Safe Campus Trading • Zero Platform Commission • Verified Academic Network
          </div>
        </div>
      </div>
    </footer>
  );
}
