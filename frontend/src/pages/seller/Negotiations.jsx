import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Clock, Check, X, Tag, PackageCheck } from 'lucide-react';
import { formatINR, formatDateIN } from '../../utils/formatters';
import {
  useAuth,
  filterNegotiationsForSeller,
  getCounterPrice,
  getStandingPrice,
  isAwaitingSeller,
  isAwaitingCustomer,
  isDealAccepted,
  isNegotiationClosed
} from '../../context/AuthContext';
import './Negotiations.css';

// Status presentation for the seller's queue
const statusMeta = (neg) => {
  if (isDealAccepted(neg.status)) return { label: 'Deal Accepted', variant: 'success' };
  if (isAwaitingCustomer(neg.status)) return { label: 'Waiting for Customer', variant: 'info' };
  if (isAwaitingSeller(neg.status)) return { label: 'Pending Query', variant: 'bargain' };
  if (isNegotiationClosed(neg.status))
    return { label: neg.status === 'closed' ? 'Closed' : 'Declined', variant: 'danger' };
  return { label: 'Pending Query', variant: 'bargain' };
};

export const Negotiations = () => {
  // Shared negotiation state from AuthContext, which is loaded from MongoDB via
  // GET /api/negotiations/seller. Nothing here is seeded from demo/localStorage
  // data, so this queue shows exactly the records the customer's offer created.
  // Scoped to the logged-in seller's real MongoDB _id: threads belonging to
  // other sellers never render here.
  const {
    negotiations: allNegotiations,
    currentUser,
    negotiationError,
    refreshNegotiations,
    acceptNegotiation,
    declineNegotiation,
    counterNegotiation
  } = useAuth();

  // Re-read the queue when the seller opens it, so offers submitted from
  // another browser appear without a manual reload.
  useEffect(() => {
    refreshNegotiations();
  }, [refreshNegotiations]);

  const negotiations = filterNegotiationsForSeller(allNegotiations, currentUser);
  const [counterValues, setCounterValues] = useState({});
  const [counterErrors, setCounterErrors] = useState({});

  const pendingCount = negotiations.filter((neg) => isAwaitingSeller(neg.status)).length;
  const waitingCount = negotiations.filter((neg) => isAwaitingCustomer(neg.status)).length;

  const handleAction = (id, newStatus) => {
    if (newStatus === 'accepted') acceptNegotiation(id);
    else declineNegotiation(id);
  };

  const handleCounter = (neg) => {
    const amount = Number(counterValues[neg.id]);
    if (!amount || amount <= 0) {
      setCounterErrors((prev) => ({ ...prev, [neg.id]: 'Enter a valid price in ₹.' }));
      return; // existing validation preserved
    }
    if (amount >= Number(neg.originalPrice)) {
      setCounterErrors((prev) => ({
        ...prev,
        [neg.id]: `Counter cannot be at or above the listed price (${formatINR(neg.originalPrice)}).`
      }));
      return;
    }
    setCounterErrors((prev) => ({ ...prev, [neg.id]: '' }));
    // Stores the counter amount in the shared negotiation (status becomes
    // "waiting for customer" — this never creates an order)
    counterNegotiation(neg.id, amount);
    setCounterValues((prev) => ({ ...prev, [neg.id]: '' }));
  };

  const handleCounterValueChange = (id, value) => {
    setCounterValues((prev) => ({ ...prev, [id]: value }));
    setCounterErrors((prev) => ({ ...prev, [id]: '' }));
  };

  return (
    <div className="negotiations-page container mt-6">
      <div className="negotiations-header mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold">Incoming Offers</h1>
          <Badge variant="bargain" size="md">{pendingCount} Pending Queries</Badge>
          <Badge variant="info" size="md">{waitingCount} Waiting for Customer</Badge>
        </div>
        <p className="text-sm text-muted">
          Review customer price proposals, accept, decline or counter them for local store
          pickup — an order is only created once the customer completes checkout.
        </p>
      </div>

      {negotiationError && (
        <p className="neg-counter-error text-sm mb-4" role="alert">
          {negotiationError}
        </p>
      )}

      <div className="negotiations-grid flex flex-col gap-4">
        {negotiations.map((neg) => {
          const meta = statusMeta(neg);
          const counter = getCounterPrice(neg);
          // The price that would actually settle this deal (for the 2% metrics)
          const standing = getStandingPrice(neg) ?? neg.offeredPrice;
          const discountPercent =
            neg.originalPrice > 0
              ? Math.round(((neg.originalPrice - neg.offeredPrice) / neg.originalPrice) * 100)
              : 0;
          // Platform fee rule: 2% of finalized negotiated purchase price
          const sellerFee = standing * 0.02;
          const netPayout = standing - sellerFee;

          const awaitingSeller = isAwaitingSeller(neg.status);
          const awaitingCustomer = isAwaitingCustomer(neg.status);
          const accepted = isDealAccepted(neg.status);

          return (
            <Card key={neg.id} padding="md" className="negotiation-card">
              <div className="negotiation-top flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <img src={neg.productImage} alt={neg.productTitle} className="neg-product-img" />
                  <div>
                    <h2 className="font-bold text-sm">{neg.productTitle}</h2>
                    <span className="text-xs text-muted">Buyer: <strong>{neg.buyerName}</strong></span>
                    {neg.createdAt && (
                      <span className="text-xs text-muted block">
                        Received on {formatDateIN(neg.createdAt)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={meta.variant} size="sm">{meta.label}</Badge>
                  {neg.convertedToOrderId && (
                    <Badge variant="success" size="sm">Ordered</Badge>
                  )}
                  <span className="text-xs text-muted flex items-center gap-1">
                    <Clock size={12} /> {neg.expiresInHours}h left
                  </span>
                </div>
              </div>

              {/* Price comparison & 2% commission metrics */}
              <div className="negotiation-metrics-row grid grid-cols-4 gap-4 my-3 p-3 bg-muted rounded">
                <div>
                  <span className="text-xs text-muted block">Original Listed</span>
                  <span className="text-sm font-semibold">{formatINR(neg.originalPrice)}</span>
                </div>
                <div>
                  <span className="text-xs text-muted block">Customer Offer</span>
                  <span className="text-sm font-bold text-bargain">
                    {formatINR(neg.offeredPrice)} (-{discountPercent}%)
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted block">Platform Commission (2%)</span>
                  <span className="text-sm font-semibold text-muted">{formatINR(sellerFee, true)}</span>
                </div>
                <div>
                  <span className="text-xs text-muted block">Net Seller Proceeds</span>
                  <span className="text-sm font-bold text-accent">{formatINR(netPayout, true)}</span>
                </div>
              </div>

              {counter !== null && (
                <p className="neg-counter-line text-xs">
                  <Tag size={12} /> Your counter offer:{' '}
                  <strong>{formatINR(counter)}</strong>
                  {awaitingCustomer && <span className="text-muted"> — waiting for the customer</span>}
                </p>
              )}

              {/* Negotiation Conversation Snippet */}
              <div className="negotiation-history-box mb-3">
                <span className="text-xs font-semibold text-muted block mb-1">Negotiation History:</span>
                {(neg.history || []).map((item, idx) => (
                  <div key={idx} className={`history-bubble bubble-${item.sender} text-xs`}>
                    <strong>{item.sender === 'customer' ? 'Customer' : 'You (Seller)'}:</strong>{' '}
                    Proposed {formatINR(item.amount)} — <em>"{item.note}"</em>{' '}
                    <span className="text-muted">({item.time})</span>
                  </div>
                ))}
              </div>

              {/* Pending query actions: Accept / Decline / Counter */}
              {awaitingSeller && (
                <div className="negotiation-actions flex items-center justify-between gap-4 pt-2 border-b border-border">
                  <div className="counter-input-group flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Counter (₹)"
                      style={{ maxWidth: '150px' }}
                      value={counterValues[neg.id] || ''}
                      onChange={(e) => handleCounterValueChange(neg.id, e.target.value)}
                      aria-label="Enter counter price in INR"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleCounter(neg)}
                    >
                      Send Counter
                    </Button>
                    {counterErrors[neg.id] && (
                      <span className="neg-counter-error text-xs">{counterErrors[neg.id]}</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="danger"
                      size="sm"
                      icon={X}
                      onClick={() => handleAction(neg.id, 'declined')}
                    >
                      Decline
                    </Button>
                    <Button
                      variant="bargain"
                      size="sm"
                      icon={Check}
                      onClick={() => handleAction(neg.id, 'accepted')}
                    >
                      Accept Deal ({formatINR(neg.offeredPrice)})
                    </Button>
                  </div>
                </div>
              )}

              {awaitingCustomer && (
                <p className="neg-waiting-note text-xs text-muted pt-2 border-t border-border">
                  <Clock size={12} /> Counter of {formatINR(counter ?? neg.offeredPrice)} sent —
                  waiting for the customer to accept, counter again or reject.
                </p>
              )}

              {accepted && (
                <p className="neg-settled-note text-xs text-accent pt-2 border-t border-border">
                  <Check size={12} /> Deal accepted at {formatINR(standing)}.
                  {neg.convertedToOrderId
                    ? ` Order ${neg.convertedToOrderId} created at checkout.`
                    : ' The customer can now proceed to checkout at this price.'}
                </p>
              )}

              {isNegotiationClosed(neg.status) && (
                <p className="neg-settled-note text-xs text-muted pt-2 border-t border-border">
                  <X size={12} /> Query closed — no order was created.
                </p>
              )}
            </Card>
          );
        })}
      </div>

      {negotiations.length === 0 && (
        <Card padding="md" className="negotiations-empty">
          <PackageCheck size={20} className="text-accent" />
          <p className="text-sm text-muted">
            No incoming offers for your store yet. Customer queries for your products appear
            here as soon as they are submitted.
          </p>
        </Card>
      )}
    </div>
  );
};

export default Negotiations;
