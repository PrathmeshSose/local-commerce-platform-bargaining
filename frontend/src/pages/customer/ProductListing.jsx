import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductCard } from '../../components/common/ProductCard';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { EmptyState, Loader } from '../../components/common/Loader';
import { MOCK_CATEGORIES } from '../../data/mockData';
import { useAuth, RADIUS_OPTIONS } from '../../context/AuthContext';
import { useProducts } from '../../hooks/useProducts';
import { formatDistance } from '../../utils/formatters';
import { Search, SlidersHorizontal, Tag, RefreshCw } from 'lucide-react';
import './ProductListing.css';

export const ProductListing = () => {
  const [searchParams] = useSearchParams();
  const { maxRadiusKm, setMaxRadiusKm } = useAuth();
  const { products, loading, error, refetch } = useProducts();

  const priceValues = products.length ? products.map((p) => p.price) : [1000, 100000];
  const priceMin = Math.min(...priceValues);
  const priceMax = Math.max(...priceValues);

  const [minPrice, setMinPrice] = useState(priceMin);
  const [maxPrice, setMaxPrice] = useState(priceMax);
  const [minRating, setMinRating] = useState(0);
  const [sortOption, setSortOption] = useState('relevance');

  const [selectedCategory, setSelectedCategory] = useState(
    MOCK_CATEGORIES.includes(searchParams.get('category')) ? searchParams.get('category') : MOCK_CATEGORIES[0]
  );
  const searchParam = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category') || '';
  const [searchQuery, setSearchQuery] = useState(searchParam);
  const [onlyBargainable, setOnlyBargainable] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [lastSearchParam, setLastSearchParam] = useState(searchParam);
  if (searchParam !== lastSearchParam) {
    setLastSearchParam(searchParam);
    setSearchQuery(searchParam);
  }
  const [lastCategoryParam, setLastCategoryParam] = useState(categoryParam);
  if (categoryParam !== lastCategoryParam) {
    setLastCategoryParam(categoryParam);
    setSelectedCategory(MOCK_CATEGORIES.includes(categoryParam) ? categoryParam : MOCK_CATEGORIES[0]);
  }

  const categories = MOCK_CATEGORIES;
  const ALL_CATEGORIES = MOCK_CATEGORIES[0];

  // The slider walks the shared radius options by index so it can only ever
  // produce a value the navbar dropdown also offers — the two controls stay
  // consistent no matter which one the shopper uses.
  const radiusIndex = Math.max(0, RADIUS_OPTIONS.indexOf(maxRadiusKm));

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === ALL_CATEGORIES || product.category === selectedCategory;
    const matchesSearch =
      (product.title || product.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.sellerName || '').toLowerCase().includes(searchQuery.toLowerCase());
    // The API already radius-filters server side; this only keeps the chip in
    // step with it (an unmeasurable distance must not hide a listing).
    const matchesDistance = Number(product.distanceKm ?? 0) <= maxRadiusKm;
    const matchesBargain = !onlyBargainable || product.bargainable || product.isNegotiable;
    const matchesPrice = product.price >= minPrice && product.price <= maxPrice;
    const matchesRating = (Number(product.rating) || 0) >= minRating;
    return matchesCategory && matchesSearch && matchesDistance && matchesBargain && matchesPrice && matchesRating;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortOption) {
      case 'priceLowHigh':
        return a.price - b.price;
      case 'priceHighLow':
        return b.price - a.price;
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      default:
        return 0;
    }
  });

  return (
    <div className="product-listing-page container mt-6">
      <div className="listing-header mb-6 flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1>Local Furniture Catalog</h1>
          <p className="text-muted text-sm">
            Browse sofas, wardrobes, dining sets and more from neighborhood furniture stores within{' '}
            {formatDistance(maxRadiusKm)} radius
          </p>
        </div>
        <button
          type="button"
          onClick={refetch}
          className="text-xs text-muted hover:text-accent flex items-center gap-1 cursor-pointer"
          title="Refresh products from backend"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Live</span>
        </button>
      </div>

      <button
        type="button"
        className="mobile-filter-toggle"
        onClick={() => setFiltersOpen((prev) => !prev)}
        aria-expanded={filtersOpen}
      >
        <SlidersHorizontal size={14} />
        {filtersOpen ? 'Hide Filters' : 'Show Filters'}
      </button>

      <div className="listing-layout">
        <aside className={`listing-sidebar ${filtersOpen ? 'filters-open' : ''}`}>
          <Card padding="md" className="filter-card">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-sm flex items-center gap-1">
                <SlidersHorizontal size={14} /> Filter Products
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory(ALL_CATEGORIES);
                  setSearchQuery('');
                  setOnlyBargainable(false);
                  setMinPrice(priceMin);
                  setMaxPrice(priceMax);
                  setMinRating(0);
                  setSortOption('relevance');
                }}
                className="text-xs text-accent font-medium hover:underline"
              >
                Reset
              </button>
            </div>

            <div className="filter-group mb-5">
              <div className="flex justify-between items-center mb-1 text-xs font-semibold">
                <span>Discovery Radius</span>
                <span className="text-accent">{formatDistance(maxRadiusKm)} max</span>
              </div>
              <input
                id="listing-radius-slider"
                data-testid="listing-radius-slider"
                type="range"
                min={0}
                max={RADIUS_OPTIONS.length - 1}
                step={1}
                value={radiusIndex}
                onChange={(e) => setMaxRadiusKm(RADIUS_OPTIONS[Number(e.target.value)])}
                className="radius-slider"
                aria-label="Filter radius in kilometers"
              />
              <div className="flex justify-between text-xs text-muted mt-1">
                <span>{RADIUS_OPTIONS[0]} km</span>
                <span>{RADIUS_OPTIONS[RADIUS_OPTIONS.length - 1]} km</span>
              </div>
            </div>

            <div className="filter-group mb-5">
              <div className="flex justify-between items-center mb-1 text-xs font-semibold">
                <span>Price Range (₹)</span>
                <span className="text-accent">{minPrice} – {maxPrice}</span>
              </div>
              <div className="price-inputs-row">
                <input
                  type="number"
                  min={priceMin}
                  max={priceMax}
                  value={minPrice}
                  onChange={(e) => setMinPrice(Number(e.target.value))}
                  aria-label="Minimum price"
                />
                <input
                  type="number"
                  min={priceMin}
                  max={priceMax}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  aria-label="Maximum price"
                />
              </div>
            </div>

            <div className="filter-group mb-5">
              <span className="text-xs font-semibold uppercase text-muted block mb-2">Seller Rating</span>
              <select
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="filter-select"
                aria-label="Minimum seller rating"
              >
                <option value={0}>All Ratings</option>
                <option value={4}>4★ & up</option>
                <option value={4.5}>4.5★ & up</option>
                <option value={5}>5★</option>
              </select>
            </div>

            <div className="filter-group mb-5">
              <span className="text-xs font-semibold uppercase text-muted block mb-2">Category</span>
              <div className="category-pill-list flex flex-col gap-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`category-filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                  >
                    <span>{cat}</span>
                    <span className="count-badge">
                      {cat === ALL_CATEGORIES ? products.length : products.filter((p) => p.category === cat).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <label className="bargain-toggle-label flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyBargainable}
                  onChange={(e) => setOnlyBargainable(e.target.checked)}
                />
                <span className="font-medium flex items-center gap-1 text-xs">
                  <Tag size={12} className="text-bargain" /> Open to Smart Bargaining
                </span>
              </label>
            </div>
          </Card>
        </aside>

        <div className="listing-main">
          <div className="search-and-sort-bar">
            <div className="search-input-wrap">
              <Input
                icon={Search}
                placeholder="Filter by furniture name, store, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Filter products"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">Sort:</span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="sort-select"
                aria-label="Sort products"
              >
                <option value="relevance">Relevance</option>
                <option value="priceLowHigh">Price: Low to High</option>
                <option value="priceHighLow">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>

          {error && !loading && (
            <p className="text-sm text-danger mb-4" role="alert">{error}</p>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader size="lg" message="Discovering nearby furniture..." />
            </div>
          ) : sortedProducts.length === 0 ? (
            <EmptyState
              title="No furniture items found"
              message="Try broadening your discovery radius or clearing your active filters."
              action={
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory(ALL_CATEGORIES);
                    setSearchQuery('');
                    setOnlyBargainable(false);
                    setMinPrice(priceMin);
                    setMaxPrice(priceMax);
                    setMinRating(0);
                  }}
                  className="btn btn-outline btn-md"
                >
                  Clear All Filters
                </button>
              }
            />
          ) : (
            <>
              {/* Section heading for the grid: keeps the document outline at
                  h1 → h2 → h3 (card titles are h3) without adding visible
                  chrome next to the page header. */}
              <h2 className="sr-only">Products in this view</h2>
              <div className="product-grid">
                {sortedProducts.map((product) => (
                  <ProductCard key={product.id || product._id} product={product} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
