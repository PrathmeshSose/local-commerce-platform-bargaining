import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProducts } from '../../hooks/useProducts';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { BargainingModal } from '../../components/bargaining/BargainingModal';
import { formatINR, formatDistance } from '../../utils/formatters';
import { categoryPlaceholder } from '../../utils/placeholders';
import { resolveProductImages } from '../../utils/productPhotos';
import {
  useAuth,
  filterNegotiationsForCustomer,
  getAgreedPrice,
  getCounterPrice,
  isAwaitingSeller,
  isAwaitingCustomer,
  isDealAccepted,
  isNegotiationOpen
} from '../../context/AuthContext';
import {
  Star,
  Tag,
  Store,
  ShoppingBag,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import './ProductDetails.css';

/**
 * Renders the stored `description` — one plain string, exactly as the API
 * returns it. Paragraphs are separated by a blank line and feature lines
 * start with a bullet mark, so the copy reads as prose plus a feature list.
 *
 * Two deliberate tolerances, both needed because the field is free text that
 * other parts of the product keep editing:
 *  - a bullet preceded only by horizontal whitespace (which is what a
 *    single-line editor leaves behind when it drops line breaks) is put back
 *    on its own line;
 *  - a block may mix prose and bullets, so runs of each are grouped rather
 *    than requiring the whole block to be one or the other.
 *
 * A description without any line breaks (what the catalogue stored before)
 * therefore still renders as the single paragraph it always did.
 */
const renderDescription = (description) => {
  const text = typeof description === 'string' ? description.trim() : '';
  const fallback = (
    <p className="text-xs text-muted leading-relaxed">
      Contact the store for details about this piece.
    </p>
  );
  if (!text) return fallback;

  // " • feature" -> "\n• feature". A bullet that already starts a line is
  // preceded by a newline, which this pattern cannot match, so stored copy
  // passes through untouched.
  const restored = text.replace(/[^\S\n]+•/g, '\n•');

  const elements = [];
  let key = 0;

  restored.split(/\n\s*\n/).forEach((block) => {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
    let paragraph = [];
    let features = [];

    const flushParagraph = () => {
      if (!paragraph.length) return;
      elements.push(
        <p key={key++} className="text-xs text-muted leading-relaxed">{paragraph.join(' ')}</p>
      );
      paragraph = [];
    };

    const flushFeatures = () => {
      if (!features.length) return;
      const items = features;
      features = [];
      elements.push(
        <ul key={key++} className="desc-features">
          {items.map((line, index) => (
            <li key={index}>{line.replace(/^[•\-*]\s+/, '')}</li>
          ))}
        </ul>
      );
    };

    lines.forEach((line) => {
      if (/^[•\-*]\s+/.test(line)) {
        flushParagraph();
        features.push(line);
      } else {
        flushFeatures();
        paragraph.push(line);
      }
    });

    flushParagraph();
    flushFeatures();
  });

  return elements.length ? elements : fallback;
};

export const ProductDetails = () => {
  const { id } = useParams();
  const { products, loading: productsLoading } = useProducts();
  // Exact match only: falling back to `products[0]` used to render an unrelated
  // listing (at its own price) for any id the catalog did not contain, which is
  // how a wrong product ended up in the bag.
  const product = products.find((p) => String(p.id || p._id) === String(id));
  // Store name, rating and distance all come from the API-populated product
  // record. There is no local seller directory to fall back on: a MongoDB
  // ObjectId must never be resolved against a frontend-only list, and the old
  // `|| MOCK_SELLERS[0]` fallback silently gave every product a different
  // seller's address and rating.

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  // Image sources that failed to load. Once a URL lands here the gallery swaps
  // it for the local placeholder, so a dead link can never trigger repeated
  // failed requests or leave a broken-image icon in the layout.
  const [failedImages, setFailedImages] = useState({});
  const [isBargainOpen, setIsBargainOpen] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const {
    addToCart,
    negotiations,
    currentUser,
    negotiationError,
    refreshNegotiations,
    acceptCounterOffer,
    rejectCounterOffer
  } = useAuth();

  // Re-read this product's thread from MongoDB on mount so the page shows the
  // seller's latest counter/decision even if it happened in another browser.
  useEffect(() => {
    refreshNegotiations();
  }, [refreshNegotiations]);

  const [modalInitialOffer, setModalInitialOffer] = useState(null);
  const openBargainModal = (prefill = null) => {
    setModalInitialOffer(prefill);
    setIsBargainOpen(true);
  };

  const prodKey = product ? (product.id || product._id) : '';
  const myNegotiations = filterNegotiationsForCustomer(negotiations, currentUser).filter(
    (n) => String(n.productId) === String(prodKey)
  );

  const newestFirst = (list) =>
    [...list].sort((a, b) =>
      String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || ''))
    );
  const openThreads = myNegotiations.filter((n) => isNegotiationOpen(n.status));
  const activeNegotiation =
    myNegotiations.find((n) => isDealAccepted(n.status) && !n.convertedToOrderId) ||
    newestFirst(openThreads)[0] ||
    myNegotiations.find((n) => isDealAccepted(n.status)) ||
    newestFirst(myNegotiations)[0] ||
    null;

  const agreedPrice = activeNegotiation ? getAgreedPrice(activeNegotiation) : null;
  // An accepted thread that already carries `convertedToOrder` is history, not
  // a second chance to buy at that price: checkout refuses a deal that has
  // been converted, and the bag drops the negotiated price for it (see
  // reconcileCartWithNegotiations). Pricing this page and its buy button from
  // that thread promised "Buy at Negotiated Price" while the bag — and the
  // order — charged the listed one.
  const alreadyOrdered =
    !!activeNegotiation &&
    isDealAccepted(activeNegotiation.status) &&
    !!activeNegotiation.convertedToOrderId;
  const negotiatedPrice =
    !alreadyOrdered && agreedPrice !== null && agreedPrice < product?.price ? agreedPrice : null;
  const effectiveUnitPrice = negotiatedPrice !== null ? negotiatedPrice : (product?.price || 0);

  const customerOfferPrice = activeNegotiation ? Number(activeNegotiation.currentOfferPrice ?? activeNegotiation.offeredPrice) : null;
  const sellerCounterPrice = activeNegotiation ? getCounterPrice(activeNegotiation) : null;
  const awaitingSeller = activeNegotiation ? isAwaitingSeller(activeNegotiation.status) : false;
  const awaitingCustomer = activeNegotiation ? isAwaitingCustomer(activeNegotiation.status) : false;
  const dealAccepted = activeNegotiation ? isDealAccepted(activeNegotiation.status) : false;
  // Only a settled deal that has NOT been converted into an order yet may
  // price a purchase or drive the "Buy at Negotiated Price" button.
  const purchasableDeal = dealAccepted && !alreadyOrdered;

  const suggestedCounterPrefill =
    awaitingCustomer && sellerCounterPrice && customerOfferPrice
      ? Math.round((customerOfferPrice + sellerCounterPrice) / 2)
      : null;

  if (!product) {
    return (
      <div className="product-details-page container mt-8 text-center">
        {productsLoading ? (
          <p>Loading product details...</p>
        ) : (
          <>
            <p className="mb-3">This listing is not in the current catalog.</p>
            <Link to="/products" className="back-link flex items-center gap-1 text-sm text-muted justify-center hover:text-main">
              <ArrowLeft size={16} /> Back to Catalog
            </Link>
          </>
        )}
      </div>
    );
  }

  const handleAddToCart = (useCustomPrice = false) => {
    const custom = useCustomPrice && negotiatedPrice !== null ? negotiatedPrice : null;
    const backingOffer = useCustomPrice && purchasableDeal ? activeNegotiation : null;
    addToCart(product, quantity, custom, backingOffer);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  };

  // Listings without a photo get the verified local photo that matches the
  // piece they name; only a listing we cannot match falls back to the local
  // category-specific placeholder rather than a shared stock photo of some
  // other product.
  const placeholderImage = categoryPlaceholder(product.category);
  const resolvedImages = resolveProductImages(product);
  const images = resolvedImages.length ? resolvedImages : [placeholderImage];
  const activeSrc = images[activeImageIndex] || images[0];
  const shownSrc = failedImages[activeSrc] ? placeholderImage : activeSrc;
  const handleImageError = (src) => {
    setFailedImages((prev) => (prev[src] ? prev : { ...prev, [src]: true }));
  };

  return (
    <div className="product-details-page container mt-6">
      <Link to="/products" className="back-link flex items-center gap-1 text-sm text-muted mb-4 hover:text-main">
        <ArrowLeft size={16} /> Back to Catalog
      </Link>

      <div className="product-details-grid">
        {/* Gallery */}
        <div className="product-gallery">
          <div className="main-image-wrap">
            <img
              src={shownSrc}
              alt={product.title}
              className="gallery-main-img"
              onError={() => handleImageError(activeSrc)}
            />
            {(product.bargainable || product.isNegotiable) && (
              <Badge variant="bargain" size="md" className="gallery-float-badge">
                <Tag size={12} /> Smart Bargaining
              </Badge>
            )}
          </div>
          {images.length > 1 && (
            <div className="thumb-row">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`thumb-btn ${activeImageIndex === idx ? 'active' : ''}`}
                >
                  <img
                    src={failedImages[img] ? placeholderImage : img}
                    alt={`Thumbnail ${idx + 1}`}
                    className="thumb-img"
                    onError={() => handleImageError(img)}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details Info */}
        <div className="product-info-panel flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="default" size="sm">{product.category}</Badge>
              <Badge variant="success" size="sm">In Stock ({product.stock} units)</Badge>
            </div>
            <h1 className="product-main-title">{product.title || product.name}</h1>
          </div>

          {/* Pricing Row */}
          <div className="pricing-box surface-card">
            <div className="pricing-row">
              <span className="product-price-current">{formatINR(effectiveUnitPrice)}</span>
              {negotiatedPrice !== null ? (
                <span className="product-price-was">{formatINR(product.price)}</span>
              ) : product.originalPrice && product.originalPrice > product.price ? (
                <span className="product-price-was">{formatINR(product.originalPrice)}</span>
              ) : null}
            </div>

            {dealAccepted && negotiatedPrice !== null && (
              <div className="savings-note text-xs flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>Smart Bargain Won! You saved {formatINR(product.price - negotiatedPrice)}</span>
              </div>
            )}
          </div>

          {/* Negotiation Status Banner */}
          {activeNegotiation && (
            <Card padding="md" className="negotiation-status-card">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm flex items-center gap-1">
                  <Tag size={14} className="text-bargain" /> Smart Bargaining Status
                </span>
                <Badge
                  variant={dealAccepted ? 'success' : awaitingCustomer ? 'bargain' : awaitingSeller ? 'info' : 'danger'}
                  size="sm"
                >
                  {dealAccepted ? 'Deal Accepted' : awaitingCustomer ? 'Counter Received' : awaitingSeller ? 'Waiting for Seller' : 'Declined'}
                </Badge>
              </div>

              <div className="mt-2 text-xs text-muted">
                {negotiationError && (
                  <p className="text-danger mb-2" role="alert">
                    {negotiationError}
                  </p>
                )}
                {awaitingSeller && (
                  <p>Your proposed offer of <strong>{formatINR(customerOfferPrice)}</strong> is currently being reviewed by the merchant.</p>
                )}
                {awaitingCustomer && (
                  <div>
                    <p className="mb-2">Merchant responded with counter price: <strong className="text-accent font-bold text-sm">{formatINR(sellerCounterPrice)}</strong></p>
                    <div className="flex gap-2">
                      <Button variant="primary" size="sm" onClick={() => acceptCounterOffer(activeNegotiation.id || activeNegotiation._id)}>
                        Accept Deal
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openBargainModal(suggestedCounterPrefill)}>
                        Counter Again
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => rejectCounterOffer(activeNegotiation.id || activeNegotiation._id)}>
                        Decline
                      </Button>
                    </div>
                  </div>
                )}
                {dealAccepted && (
                  <p>
                    {alreadyOrdered ? (
                      <>
                        Deal agreed at <strong>{formatINR(agreedPrice)}</strong> and already turned
                        into an order — track it in{' '}
                        <Link to="/orders" className="font-semibold">My Orders</Link>.
                      </>
                    ) : (
                      <>
                        Both parties agreed at <strong>{formatINR(agreedPrice)}</strong>. Add to bag
                        to complete purchase at this negotiated rate.
                      </>
                    )}
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* Description */}
          <div className="product-desc-section">
            <h2 className="text-sm font-semibold mb-1">About this Piece</h2>
            {renderDescription(product.description)}
          </div>

          {/* Quantity and Actions */}
          <div className="actions-cluster flex flex-col gap-3 mt-2">
            <div className="quantity-row flex items-center gap-3">
              <span className="text-xs font-semibold">Quantity:</span>
              <div className="quantity-selector">
                <button
                  type="button"
                  className="qty-btn"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <span className="qty-val" aria-live="polite">{quantity}</span>
                <button
                  type="button"
                  className="qty-btn"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity((q) => Math.min(product.stock || 10, q + 1))}
                  disabled={quantity >= (product.stock || 10)}
                >
                  +
                </button>
              </div>
            </div>

            <div className="action-buttons-row flex gap-3">
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                icon={ShoppingBag}
                onClick={() => handleAddToCart(purchasableDeal)}
              >
                {addedToCart ? 'Added to Bag!' : purchasableDeal ? 'Buy at Negotiated Price' : 'Add to Bag'}
              </Button>

              {(product.bargainable || product.isNegotiable) && (
                <Button
                  variant="bargain"
                  size="lg"
                  icon={Tag}
                  onClick={() => openBargainModal()}
                >
                  Smart Bargain
                </Button>
              )}
            </div>
          </div>

          {/* Store Info & Local Pickups */}
          <Card padding="md" className="seller-summary-card mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="seller-avatar bg-accent-light p-2 rounded-full">
                  <Store size={20} className="text-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{product.sellerName || 'Local Merchant'}</h3>
                  <p className="text-xs text-muted">Indore, MP</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-xs font-bold">
                  {Number(product.rating) > 0 ? (
                    <>
                      <Star size={12} fill="#f59e0b" color="#f59e0b" /> {product.rating}
                    </>
                  ) : (
                    <span className="text-xs text-muted">Not rated yet</span>
                  )}
                </div>
                <span className="text-xs text-muted">{formatDistance(product.distanceKm)}</span>
              </div>
            </div>

            {/* Technical identifier: real Mongo id, kept for support but out
                of the shopper's primary reading path. */}
            <p className="item-id-line text-xs text-muted">Item ID: {product._id || product.id}</p>
          </Card>
        </div>
      </div>

      <BargainingModal
        isOpen={isBargainOpen}
        onClose={() => setIsBargainOpen(false)}
        product={product}
        initialOffer={modalInitialOffer}
        activeNegotiation={activeNegotiation}
      />
    </div>
  );
};
