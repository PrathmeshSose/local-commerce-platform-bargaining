import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { EmptyState } from '../../components/common/Loader';
import { Clock, Check, X, Tag, Store, ShoppingBag } from 'lucide-react';
import { formatINR, formatDateIN } from '../../utils/formatters';
import {
  useAuth,
  filterNegotiationsForCustomer,
  getAgreedPrice,
  getCounterPrice,
  isAwaitingSeller,
  isAwaitingCustomer,
  isDealAccepted
} from '../../context/AuthContext';
import './Negotiations.css';

// Status presentation for the customer's view of a negotiation
const statusMeta = (neg) => {
  if (isDealAccepted(neg.status)) return { label: 'Deal Accepted', variant: 'success' };
  if (isAwaitingCustomer(neg.status)) return { label: 'Waiting for You', variant: 'bargain' };
  if (isAwaitingSeller(neg.status)) return { label: 'Pending with Seller', variant: 'info' };
  return { label: 'Declined', variant: 'danger' };
};

// Minimal product descriptor so the customer page can reuse submitCustomerOffer
const asProduct = (neg) => ({
  id: neg.productId,
  title: neg.productTitle,
  price: Number(neg.originalPrice),
  images: [neg.productImage],
  sellerId: neg.sellerId,
  sellerName: neg.sellerName
});

export const CustomerNegotiations = () => {
  const {
    negotiations: allNegotiations,
    currentUser,
    isAuthenticated,
    submitCustomerOffer,
    acceptCounterOffer,
    rejectCounterOffer
  } = useAuth();

  const [counterValues, setCounterValues] = useState({});
  const [errors, setErrors] = useState({});

  // Only THIS customer's queries — never another buyer's negotiations
  const negotiations = filterNegotiationsForCustomer(allNegotiations, currentUser);

  const pendingCount = negotiations.filter((n) => isAwaitingSeller(n.status)).length;
  const waitingCount = negotiations.filter((n) => isAwaitingCustomer(n.status)).length;

  const handleAccept = (neg) => acceptCounterOffer(neg.id);
  const handleReject = (neg) => rejectCounterOffer(neg.id);

  const handleCounterAgain = (neg) => {
    const amount = Number(counterValues[neg.id]);
    const listed = Number(neg.originalPrice);
    if (!amount || amount <= 0) {
      setErrors((prev) => ({ ...prev, [neg.id]: 'Enter a valid price in ₹.' }));
      return;
    }
    if (amount >= listed) {
      setErrors((prev) => ({
        ...prev,
        [neg.id]: `Must be below the listed price (${formatINR(listed)}).`
      }));
      return;
    }
    setErrors((prev) => ({ ...prev, [neg.id]: '' }));
    // Sends a new pending query back to the seller (no order is created)
    submitCustomerOffer(asProduct(neg), amount, 'Counter price offer');
    setCounterValues((prev) => ({ ...prev, [neg.id]: '' }));
  };

  return (
    <div className="customer-negotiations-page container mt-6">
      <div className="cn-header mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold">My Bargains</h1>
          <Badge variant="bargain" size="md">{pendingCount} Pending</Badge>
          <Badge variant="info" size="md">{waitingCount} Waiting for You</Badge>
        </div>
        <p className="text-sm text-muted">
          Track your price queries, respond to seller counter-offers and continue to checkout
          once both sides agree — an order is only created at checkout.
        </p>
      </div>

      {!isAuthenticated && negotiations.length === 0 ? (
        <EmptyState
          title="Log in to see your bargains"
          message="Sign in to track the offers you sent to neighborhood stores and respond to their counter-offers."
          action={
            <Link to="/login">
              <Button variant="primary" size="md">Log In</Button>
            </Link>
          }
        />
      ) : negotiations.length === 0 ? (
        <EmptyState
          title="No bargaining queries yet"
          message="Open any product and use Smart Bargaining to send your first price offer. It will appear here until the seller responds."
          action={
            <Link to="/products">
              <Button variant="primary" size="md">Browse Furniture</Button>
            </Link>
          }
        />
      ) : (
        <div className="cn-list flex flex-col gap-4">
          {negotiations.map((neg) => {
            const meta = statusMeta(neg);
            const agreed = getAgreedPrice(neg);
            const counter = getCounterPrice(neg);
            const awaitingCustomer = isAwaitingCustomer(neg.status);
            const awaitingSeller = isAwaitingSeller(neg.status);
            const accepted = isDealAccepted(neg.status);
            const discountPercent =
              neg.originalPrice > 0
                ? Math.round(((neg.originalPrice - neg.offeredPrice) / neg.originalPrice) * 100)
                : 0;

            return (
              <Card key={neg.id} padding="md" className="cn-card">
                <div className="cn-card-top">
                  <div className="cn-product">
                    <img src={neg.productImage} alt={neg.productTitle} className="cn-product-img" />
                    <div>
                      <h4 className="font-bold text-sm">{neg.productTitle}</h4>
                      <span className="text-xs text-muted cn-store">
                        <Store size={12} /> {neg.sellerName}
                      </span>
                      <span className="text-xs text-muted">
                        Query #{neg.id}
                        {neg.createdAt ? ` • Sent on ${formatDateIN(neg.createdAt)}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="cn-status">
                    <Badge variant={meta.variant} size="sm">{meta.label}</Badge>
                    {neg.convertedToOrderId && (
                      <Badge variant="success" size="sm">Ordered</Badge>
                    )}
                    {awaitingSeller && (
                      <span className="text-xs text-muted flex items-center gap-1">
                        <Clock size={12} /> Seller reviewing
                      </span>
                    )}
                  </div>
                </div>

                {/* Price ladder — negotiation concept, never an order */}
                <div className="cn-price-grid">
                  <div>
                    <span className="cn-price-label">Listed Price</span>
                    <span className="cn-price-value line-through text-muted">
                      {formatINR(neg.originalPrice)}
                    </span>
                  </div>
                  <div>
                    <span className="cn-price-label">Your Offer</span>
                    <span className="cn-price-value cn-price-offer">
                      {formatINR(neg.offeredPrice)}
                      {discountPercent > 0 && <em> (-{discountPercent}%)</em>}
                    </span>
                  </div>
                  {counter !== null && (
                    <div>
                      <span className="cn-price-label">Seller Counter Offer</span>
                      <span className="cn-price-value cn-price-counter">
                        {formatINR(counter)}
                      </span>
                    </div>
                  )}
                  {accepted && agreed !== null && (
                    <div>
                      <span className="cn-price-label">Agreed Deal Price</span>
                      <span className="cn-price-value cn-price-agreed">{formatINR(agreed)}</span>
                    </div>
                  )}
                </div>

                {/* Conversation */}
                <div className="cn-history">
                  <span className="text-xs font-semibold text-muted block mb-1">History:</span>
                  {(neg.history || []).map((item, idx) => (
                    <div key={idx} className={`cn-bubble cn-bubble-${item.sender} text-xs`}>
                      <strong>{item.sender === 'customer' ? 'You' : 'Seller'}:</strong>{' '}
                      {formatINR(item.amount)} — <em>"{item.note}"</em>{' '}
                      <span className="text-muted">({item.time})</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                {awaitingCustomer && (
                  <div className="cn-actions">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Check}
                      onClick={() => handleAccept(neg)}
                    >
                      Accept Counter ({formatINR(counter ?? neg.offeredPrice)})
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={X}
                      onClick={() => handleReject(neg)}
                    >
                      Reject
                    </Button>
                  </div>
                )}

                {awaitingCustomer && (
                  <div className="cn-counter-group">
                    <Input
                      type="number"
                      placeholder="Counter again (₹)"
                      value={counterValues[neg.id] || ''}
                      onChange={(e) => {
                        setCounterValues({ ...counterValues, [neg.id]: e.target.value });
                        setErrors((prev) => ({ ...prev, [neg.id]: '' }));
                      }}
                      aria-label="Enter your counter price in INR"
                    />
                    <Button
                      variant="bargain"
                      size="sm"
                      icon={Tag}
                      onClick={() => handleCounterAgain(neg)}
                    >
                      Send Counter
                    </Button>
                    {errors[neg.id] && <p className="cn-error text-xs">{errors[neg.id]}</p>}
                  </div>
                )}

                {awaitingSeller && (
                  <div className="cn-footer">
                    <p className="text-xs text-muted">
                      Waiting for {neg.sellerName} to accept, decline or counter your offer.
                    </p>
                    <Link to={`/products/${neg.productId}`} className="cn-link text-xs font-semibold">
                      View Product <ShoppingBag size={12} />
                    </Link>
                  </div>
                )}

                {accepted && (
                  <div className="cn-footer">
                    <p className="text-xs text-accent font-semibold">
                      Deal locked at {formatINR(agreed)} — proceed to buy at this price.
                    </p>
                    <Link to={`/products/${neg.productId}`} className="cn-link text-xs font-semibold">
                      Buy at Agreed Price <ShoppingBag size={12} />
                    </Link>
                  </div>
                )}

                {!awaitingSeller && !awaitingCustomer && !accepted && (
                  <div className="cn-footer">
                    <p className="text-xs text-muted">
                      This query was declined — no order was created.
                    </p>
                    <Link to={`/products/${neg.productId}`} className="cn-link text-xs font-semibold">
                      Send a New Offer <Tag size={12} />
                    </Link>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomerNegotiations;
