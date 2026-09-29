import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MOCK_PRODUCTS, MOCK_SELLERS } from '../../data/mockData';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { BargainingModal } from '../../components/bargaining/BargainingModal';
import { formatINR, formatDistance } from '../../utils/formatters';
import {
  useAuth,
  filterNegotiationsForCustomer,
  getAgreedPrice,
  getCounterPrice,
  isAwaitingSeller,
  isAwaitingCustomer,
  isDealAccepted,
  isNegotiationClosed,
  isNegotiationOpen
} from '../../context/AuthContext';
import {
  MapPin,
  Star,
  Tag,
  Store,
  ShieldCheck,
  ShoppingBag,
  ArrowLeft,
  Truck,
  Check,
  Phone,
  Clock,
  AlertTriangle,
  CheckCircle2,
  X
} from 'lucide-react';
import './ProductDetails.css';

export const ProductDetails = () => {
  const { id } = useParams();
  const product = MOCK_PRODUCTS.find((p) => p.id === id) || MOCK_PRODUCTS[0];
  const seller = MOCK_SELLERS.find((s) => s.id === product.sellerId) || MOCK_SELLERS[0];

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isBargainOpen, setIsBargainOpen] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const {
    addToCart,
    negotiations,
    currentUser,
    acceptCounterOffer,
    rejectCounterOffer
  } = useAuth();

  // Bargain modal can be prefilled (e.g. "Counter Again" suggests a midpoint)
  const [modalInitialOffer, setModalInitialOffer] = useState(null);
  const openBargainModal = (prefill = null) => {
    setModalInitialOffer(prefill);
    setIsBargainOpen(true);
  };

  // ---- Negotiation (query) state for THIS product and THIS customer --------
  // Concept A (negotiation) / B (accepted deal) only. A pending offer or a
  // seller counter NEVER sets the purchase price — only an ACCEPTED deal does.
  // The order itself is created later, at checkout (concept C).
  const myNegotiations = filterNegotiationsForCustomer(negotiations, currentUser).filter(
    (n) => n.productId === product.id
  );
  // Newest first (updatedAt, falling back to createdAt) so a freshly submitted
  // offer is never hidden behind an older record.
  const newestFirst = (list) =>
    [...list].sort((a, b) =>
      String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || ''))
    );
  const openThreads = myNegotiations.filter((n) => isNegotiationOpen(n.status));
  // Priority: a deal still waiting for checkout > the live (open) query > any
  // accepted deal > the newest record. The live query wins over an accepted
  // deal that was ALREADY converted into an order, so re-bargaining after a
  // purchase shows the new pending offer instead of the stale agreed price.
  const activeNegotiation =
    myNegotiations.find((n) => isDealAccepted(n.status) && !n.convertedToOrderId) ||
    newestFirst(openThreads)[0] ||
    myNegotiations.find((n) => isDealAccepted(n.status)) ||
    newestFirst(myNegotiations)[0] ||
    null;

  // Negotiated price is usable ONLY once the deal is accepted
  const agreedPrice = activeNegotiation ? getAgreedPrice(activeNegotiation) : null;
  const negotiatedPrice =
    agreedPrice !== null && agreedPrice < product.price ? agreedPrice : null;
  const effectiveUnitPrice = negotiatedPrice !== null ? negotiatedPrice : product.price;

  const customerOfferPrice = activeNegotiation ? Number(activeNegotiation.offeredPrice) : null;
  const sellerCounterPrice = activeNegotiation ? getCounterPrice(activeNegotiation) : null;
  const awaitingSeller = activeNegotiation ? isAwaitingSeller(activeNegotiation.status) : false;
  const awaitingCustomer = activeNegotiation ? isAwaitingCustomer(activeNegotiation.status) : false;
  const dealAccepted = activeNegotiation ? isDealAccepted(activeNegotiation.status) : false;
  const offerDeclined = activeNegotiation ? isNegotiationClosed(activeNegotiation.status) : false;
  // Suggested midpoint when the customer counters the seller's counter
  const counterAgainPrice =
    customerOfferPrice !== null && sellerCounterPrice !== null
      ? Math.min(
          product.price - 1,
          Math.max(1, Math.round((customerOfferPrice + sellerCounterPrice) / 2))
        )
      : null;

  const handleAddToCart = () => {
    // Passes the agreed price ONLY when the deal is accepted, otherwise null
    // (normal listed price). The negotiation record travels with the item so
    // the seller can see which accepted deal produced the order.
    addToCart(product, quantity, negotiatedPrice, negotiatedPrice !== null ? activeNegotiation : null);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <div className="product-details-page container mt-6">
      <Link to="/products" className="back-link flex items-center gap-1 text-sm text-muted mb-4">
        <ArrowLeft size={16} /> Back to Catalog
      </Link>

      <div className="product-details-grid">
        {/* Images Gallery */}
        <div className="product-gallery">
          <div className="main-image-wrap">
            <img
              src={product.images[activeImageIndex] || product.images[0]}
              alt={product.title}
              className="gallery-main-img"
            />
            {product.bargainable && (
              <Badge variant="bargain" size="md" className="gallery-float-badge">
                <Tag size={12} /> Open to Smart Bargaining
              </Badge>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="thumb-row">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`thumb-btn ${activeImageIndex === idx ? 'active' : ''}`}
                  aria-label={`View image thumbnail ${idx + 1}`}
                >
                  <img src={img} alt="Thumbnail" className="thumb-img" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details & Purchase Controls */}
        <div className="product-info-panel">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="default" size="sm">{product.category}</Badge>
            <span className="text-xs text-muted">Stock: {product.stock} units available</span>
          </div>

          <h1 className="product-main-title">{product.title}</h1>

          <div className="flex items-center gap-3 mt-2 text-sm text-muted">
            <span className="flex items-center gap-1">
              <Star size={14} fill="#f59e0b" color="#f59e0b" />
              <strong className="text-main">{product.rating}</strong> ({seller.reviewsCount} verified reviews)
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin size={14} className="text-accent" />
              <strong>{formatDistance(product.distanceKm)}</strong> from your location
            </span>
          </div>

          {/* Pricing Box */}
          <div className="pricing-box surface-card mt-4 p-4">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-main">{formatINR(product.price)}</span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-lg text-muted line-through">
                  {formatINR(product.originalPrice)}
                </span>
              )}
            </div>

            <div className="bargaining-callout-box mt-3 p-3 bg-bargain-light rounded">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-bargain">Smart Bargaining Available</h5>
                  <p className="text-xs text-muted">
                    Seller welcomes fair price counter-offers for local pickup or bulk orders.
                  </p>
                </div>
                <Button
                  variant="bargain"
                  size="sm"
                  icon={Tag}
                  onClick={() => openBargainModal(null)}
                >
                  Make an Offer
                </Button>
              </div>
            </div>

            {/* Negotiation status (concept A/B) — a pending offer or a seller
                counter is NEVER shown here as a completed order */}
            {activeNegotiation && (
              <div
                className={`negotiation-status-panel ${
                  dealAccepted
                    ? 'panel-accepted'
                    : offerDeclined
                    ? 'panel-declined'
                    : awaitingCustomer
                    ? 'panel-countered'
                    : 'panel-pending'
                }`}
              >
                <div className="neg-status-head">
                  {dealAccepted ? (
                    <CheckCircle2 size={16} />
                  ) : offerDeclined ? (
                    <AlertTriangle size={16} />
                  ) : awaitingCustomer ? (
                    <Tag size={16} />
                  ) : (
                    <Clock size={16} />
                  )}
                  <span className="neg-status-title font-bold text-xs">
                    {dealAccepted
                      ? 'Deal Accepted'
                      : offerDeclined
                      ? 'Offer Declined'
                      : awaitingCustomer
                      ? 'Seller Sent a Counter Offer'
                      : awaitingSeller
                      ? 'Your Offer is Pending with the Seller'
                      : 'Bargain Query'}
                  </span>
                  <Badge
                    variant={
                      dealAccepted
                        ? 'success'
                        : offerDeclined
                        ? 'danger'
                        : awaitingCustomer
                        ? 'bargain'
                        : 'info'
                    }
                    size="sm"
                  >
                    {dealAccepted
                      ? 'Accepted'
                      : offerDeclined
                      ? 'Declined'
                      : awaitingCustomer
                      ? 'Waiting for You'
                      : 'Pending'}
                  </Badge>
                  {activeNegotiation.convertedToOrderId && (
                    <Badge variant="success" size="sm">Ordered</Badge>
                  )}
                </div>

                <div className="neg-status-prices">
                  <div>
                    <span>Your Offer</span>
                    <strong>{formatINR(customerOfferPrice)}</strong>
                  </div>
                  {sellerCounterPrice !== null && (
                    <div>
                      <span>Seller Counter Offer</span>
                      <strong className="text-bargain">{formatINR(sellerCounterPrice)}</strong>
                    </div>
                  )}
                  {dealAccepted && agreedPrice !== null && (
                    <div>
                      <span>Deal Price</span>
                      <strong className="text-accent">{formatINR(agreedPrice)}</strong>
                    </div>
                  )}
                  <div>
                    <span>Listed Price</span>
                    <strong className="line-through text-muted">{formatINR(product.price)}</strong>
                  </div>
                </div>

                <p className="neg-status-help text-xs text-muted">
                  {dealAccepted
                    ? `Both sides agreed on ${formatINR(agreedPrice)}. Add to cart to buy at this price.`
                    : offerDeclined
                    ? 'The seller declined this offer. Buy at the listed price or send a new offer — no order was created.'
                    : awaitingCustomer
                    ? `Counter at ${formatINR(sellerCounterPrice)}. Accept it, counter again or reject — an order is only created after checkout.`
                    : `Offer of ${formatINR(customerOfferPrice)} is with the seller. The negotiated price applies only after the seller accepts.`}
                </p>

                {awaitingCustomer && (
                  <div className="neg-status-actions">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Check}
                      onClick={() => acceptCounterOffer(activeNegotiation.id)}
                    >
                      Accept Counter
                    </Button>
                    <Button
                      variant="bargain"
                      size="sm"
                      icon={Tag}
                      onClick={() => openBargainModal(counterAgainPrice)}
                    >
                      Counter Again
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={X}
                      onClick={() => rejectCounterOffer(activeNegotiation.id)}
                    >
                      Reject
                    </Button>
                  </div>
                )}

                <div className="neg-status-footer">
                  {offerDeclined && (
                    <Button
                      variant="bargain"
                      size="sm"
                      icon={Tag}
                      onClick={() => openBargainModal(null)}
                    >
                      Make a New Offer
                    </Button>
                  )}
                  <Link to="/negotiations" className="neg-status-link text-xs font-semibold">
                    View in My Bargains →
                  </Link>
                </div>
              </div>
            )}

            <div className="action-buttons-stack">
              <div className="quantity-selector flex items-center">
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="qty-btn"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="qty-val">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(q => q + 1)}
                  className="qty-btn"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <Button
                variant={addedToCart ? 'secondary' : 'primary'}
                size="lg"
                className="w-full add-cart-btn"
                icon={addedToCart ? Check : ShoppingBag}
                onClick={handleAddToCart}
              >
                {addedToCart ? 'Added to Cart!' : `Add to Cart (${formatINR(effectiveUnitPrice * quantity)})`}
              </Button>
            </div>
          </div>

          {/* Description */}
          <div className="product-desc-section">
            <h4 className="font-bold text-base mb-2">Product Description</h4>
            <p className="text-sm text-muted leading-relaxed">{product.description}</p>
          </div>

          {/* Fulfillment options */}
          <div className="fulfillment-grid">
            <div className="fulfillment-item">
              <Store size={18} className="text-accent" />
              <div>
                <span className="font-semibold text-xs block">Local Store Pickup</span>
                <span className="text-xs text-muted">Ready within 1-2 hours</span>
              </div>
            </div>
            <div className="fulfillment-item">
              <Truck size={18} className="text-accent" />
              <div>
                <span className="font-semibold text-xs block">Hyperlocal Delivery</span>
                <span className="text-xs text-muted">Same-day delivery in city limits</span>
              </div>
            </div>
          </div>

          {/* Seller Profile Summary Card */}
          <Card padding="md" className="seller-summary-card mt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={seller.avatar} alt={seller.name} className="seller-avatar-sm" />
                <div>
                  <h4 className="font-bold text-sm">{seller.name}</h4>
                  <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                    <MapPin size={12} className="flex-shrink-0" /> {seller.location} ({formatDistance(seller.distanceKm)})
                  </p>
                  <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                    <Phone size={11} className="flex-shrink-0" /> {seller.phone}
                  </p>
                </div>
              </div>
              <Badge variant="success" size="sm">Verified Merchant</Badge>
            </div>
            <div className="flex items-center justify-between text-xs text-muted mt-3 pt-3 border-t border-border">
              <span>Bargaining Flex: <strong className="text-main">{seller.bargainTolerance}</strong></span>
              <span className="text-accent font-semibold flex items-center gap-1">
                <ShieldCheck size={13} /> Local Neighborhood Guarantee
              </span>
            </div>
          </Card>
        </div>
      </div>

      <BargainingModal
        isOpen={isBargainOpen}
        onClose={() => setIsBargainOpen(false)}
        product={product}
        initialOffer={modalInitialOffer}
      />
    </div>
  );
};

