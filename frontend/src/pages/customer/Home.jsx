import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { ProductCard } from '../../components/common/ProductCard';

import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../hooks/useProducts';
import { formatDistance } from '../../utils/formatters';
import {
  MapPin,
  Tag,
  Store,
  ArrowRight,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import './Home.css';

export const Home = () => {
  const { maxRadiusKm, userLocation } = useAuth();
  const { products } = useProducts();

  // Filter products based on active radius setting
  const nearbyProducts = products.filter((p) => Number(p.distanceKm ?? 0) <= maxRadiusKm).slice(0, 8);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-banner">
        <div className="container">
          <div className="hero-content mx-auto text-center flex flex-col items-center">
            <div className="hero-badge flex items-center gap-2">
              <Sparkles size={14} className="text-bargain" />
              <span>Hyperlocal Furniture & Smart Bargaining</span>
            </div>
            <h1 className="hero-heading">
              Find furniture you'll love, <br />
              <span className="text-gradient">from stores just around the corner.</span>
            </h1>
            <p className="hero-subtext">
              Browse sofas, beds, dining sets, wardrobes and more from verified sellers within{' '}
              <strong>{formatDistance(maxRadiusKm)}</strong> of {userLocation}. Make real-time counter offers and pick up locally or order delivery.
            </p>

            <div className="hero-cta-group flex items-center justify-center gap-3">
              <Link to="/products">
                <Button variant="primary" size="lg" icon={ArrowRight}>
                  Explore Furniture Deals
                </Button>
              </Link>
              <Link to="/seller">
                <Button variant="outline" size="lg" icon={Store}>
                  Are you a Merchant?
                </Button>
              </Link>
            </div>

            {/* Platform Highlights */}
            <div className="hero-features-strip grid grid-cols-3 gap-4 mt-8 w-full">
              <div className="feature-item flex items-center gap-3">
                <div className="feature-icon-box bg-accent-light">
                  <MapPin size={20} className="text-accent" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm">Hyperlocal Radius</h2>
                  <p className="text-xs text-muted">Shop within 1 to 20 km</p>
                </div>
              </div>

              <div className="feature-item flex items-center gap-3">
                <div className="feature-icon-box bg-bargain-light">
                  <Tag size={20} className="text-bargain" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm">Smart Bargaining</h2>
                  <p className="text-xs text-muted">Counter-offer in INR directly</p>
                </div>
              </div>

              <div className="feature-item flex items-center gap-3">
                <div className="feature-icon-box bg-secondary-light">
                  <ShieldCheck size={20} style={{ color: 'var(--secondary)' }} />
                </div>
                <div>
                  <h2 className="font-semibold text-sm">2% Seller Commission</h2>
                  <p className="text-xs text-muted">Paid by seller upon sale</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nearby Products Section */}
      <section className="section-featured container mt-8">
        <div className="section-header flex justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="section-title">Furniture Near You</h2>
              <Badge variant="accent" size="sm">{nearbyProducts.length} Available</Badge>
            </div>
            <p className="text-xs text-muted">
              Hand-picked designs from shops within {formatDistance(maxRadiusKm)} of {userLocation}
            </p>
          </div>
          <Link to="/products" className="text-xs font-semibold text-accent hover:underline flex items-center gap-1">
            View All Catalog <ArrowRight size={12} />
          </Link>
        </div>

        <div className="home-products-grid">
          {nearbyProducts.map((product) => (
            <ProductCard key={product.id || product._id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
};
