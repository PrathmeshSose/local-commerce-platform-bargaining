import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { MOCK_PRODUCTS } from '../../data/mockData';
import { useAuth, filterNegotiationsForSeller, filterOrdersForSeller, isAwaitingSeller, isAwaitingCustomer } from '../../context/AuthContext';
import { EmptyState } from '../../components/common/Loader';
import { formatINR, formatDateIN } from '../../utils/formatters';
import {
  Package,
  Clock,
  TrendingUp,
  Tag,
  ArrowRight,
  Percent,
  ShoppingBag,
  User,
  MessageSquare
} from 'lucide-react';
import './SellerDashboard.css';

// Human readable label for the offer that produced a negotiated order price.
// (Only ACCEPTED deals ever reach checkout, so 'accepted' is the common case.)
const offerStatusLabel = (status) =>
  ({
    accepted: 'Offer Accepted',
    countered: 'Counter Accepted',
    countered_to_customer: 'Counter Accepted',
    pending_customer: 'Counter Accepted',
    pending: 'Customer Offer Applied',
    pending_seller: 'Customer Offer Applied',
    declined: 'Offer Rejected',
    rejected: 'Offer Rejected'
  })[status] || 'Smart Offer';

export const SellerDashboard = () => {
  const [sellerProducts, setSellerProducts] = useState(MOCK_PRODUCTS.filter((p) => p.sellerId === 'seller_2'));

  // Shared negotiation state lives in AuthContext (no duplicate store here).
  // Incoming queue = offers addressed to THIS logged-in seller (identity match),
  // still awaiting a response.
  const {
    negotiations,
    orders,
    currentUser,
    acceptNegotiation,
    declineNegotiation,
    counterNegotiation
  } = useAuth();
  // A query counts as "pending" ONLY while it waits for THIS seller's decision
  // (pending_seller). Once countered it moves to "Waiting for Customer", and it
  // becomes an order only after the customer completes checkout — so a pending
  // bargain can never show up as an order.
  const sellerNegotiations = filterNegotiationsForSeller(negotiations, currentUser);
  const pendingNegotiations = sellerNegotiations.filter((n) => isAwaitingSeller(n.status));
  const counteredNegotiations = sellerNegotiations.filter((n) => isAwaitingCustomer(n.status));

  // Real orders placed by customers at checkout — same shared order state the
  // customer's /orders page reads. Filtered by THIS seller's identity, so only
  // this seller's products are listed (never another seller's orders).
  const sellerOrders = filterOrdersForSeller(orders, currentUser);

  // Active negotiation being countered
  const [activeCounterNeg, setActiveCounterNeg] = useState(null);
  const [counterInputVal, setCounterInputVal] = useState('');
  const [counterError, setCounterError] = useState('');

  const handleAddProduct = () => {
    const newProd = {
      id: `new_${Date.now()}`,
      title: 'New Product',
      price: 1000,
      originalPrice: 1200,
      stock: 10,
      minAcceptablePrice: 900,
      bargainable: true,
      sellerId: 'seller_2',
      images: ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80'],
      category: 'Misc',
    };
    setSellerProducts([...sellerProducts, newProd]);
  };

  const handleDeleteProduct = (id) => {
    setSellerProducts(sellerProducts.filter((p) => p.id !== id));
  };

  // Handlers for Accept, Decline, Counter actions on pending queries.
  // Each one updates the shared negotiation record so the outcomes differ
  // (accepted / declined / pending_customer) instead of dropping the row,
  // and none of them ever creates an order — that happens at customer checkout.
  const handleAcceptNegotiation = (id) => {
    acceptNegotiation(id);
  };

  const handleRejectNegotiation = (id) => {
    declineNegotiation(id);
  };

  const handleOpenCounter = (neg) => {
    setActiveCounterNeg(neg);
    setCounterInputVal(String(Math.round(neg.offeredPrice * 1.05) || neg.offeredPrice));
    setCounterError('');
  };

  const handleCounterSubmit = (e) => {
    e.preventDefault();
    const amount = Number(counterInputVal);
    if (!amount || amount <= 0) {
      setCounterError('Please enter a valid amount.');
      return;
    }
    if (activeCounterNeg && amount > activeCounterNeg.originalPrice) {
      setCounterError(`Counter offer cannot exceed listed price (₹${activeCounterNeg.originalPrice}).`);
      return;
    }
    // Store the counter amount in the shared negotiation (status + price + history)
    counterNegotiation(activeCounterNeg.id, amount);
    setActiveCounterNeg(null);
    setCounterInputVal('');
    setCounterError('');
  };

  const totalGrossSales = 68400; // In INR
  const platformCommissionPaid = totalGrossSales * 0.02; // 2% commission = ₹1,368
  const netEarnings = totalGrossSales - platformCommissionPaid; // ₹67,032

  return (
    <div className="seller-dashboard-page container mt-6">
      <div className="dashboard-header flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Sharma Furniture Gallery</h1>
            <Badge variant="success" size="sm">Verified Merchant</Badge>
          </div>
          <p className="text-sm text-muted">
            Palasia Main Road, Indore • Manage inventory, customer counter-offers, and 2% platform deductions
          </p>
        </div>

        <Link to="/seller/negotiations">
          <Button variant="bargain" icon={Tag}>
            Review Active Offers ({pendingNegotiations.length})
          </Button>
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-metrics-grid grid gap-4 mb-6">
        <Card padding="md" className="kpi-card">
          <div className="flex items-center justify-between text-muted text-xs font-semibold mb-1">
            <span>Gross Marketplace Sales</span>
            <TrendingUp size={16} className="text-accent" />
          </div>
          <span className="text-2xl font-bold text-main">{formatINR(totalGrossSales)}</span>
          <span className="text-xs text-accent mt-1 block flex items-center gap-1">
            <TrendingUp size={12} /> +14% this month
          </span>
        </Card>

        <Card padding="md" className="kpi-card">
          <div className="flex items-center justify-between text-muted text-xs font-semibold mb-1">
            <span>Net Seller Earnings</span>
            <TrendingUp size={16} className="text-accent" />
          </div>
          <span className="text-2xl font-bold text-accent">{formatINR(netEarnings)}</span>
          <span className="text-xs text-muted mt-1 block">After 2% platform take-rate</span>
        </Card>

        <Card padding="md" className="kpi-card">
          <div className="flex items-center justify-between text-muted text-xs font-semibold mb-1">
            <span>Platform Commission (2%)</span>
            <Percent size={16} style={{ color: 'var(--secondary)' }} />
          </div>
          <span className="text-2xl font-bold" style={{ color: 'var(--secondary)' }}>
            {formatINR(platformCommissionPaid)}
          </span>
          <span className="text-xs text-muted mt-1 block">Paid to NearDeal upon sales</span>
        </Card>

        <Card padding="md" className="kpi-card">
          <div className="flex items-center justify-between text-muted text-xs font-semibold mb-1">
            <span>Customer Offers Pending</span>
            <Clock size={16} className="text-bargain" />
          </div>
          <span className="text-2xl font-bold text-bargain">{pendingNegotiations.length}</span>
          <span className="text-xs text-muted mt-1 block">Requires response</span>
        </Card>

        <Card padding="md" className="kpi-card">
          <div className="flex items-center justify-between text-muted text-xs font-semibold mb-1">
            <span>Orders Received</span>
            <ShoppingBag size={16} className="text-accent" />
          </div>
          <span className="text-2xl font-bold text-main">{sellerOrders.length}</span>
          <span className="text-xs text-muted mt-1 block">Placed by customers at checkout</span>
        </Card>
      </div>

      {/* Real customer orders (created at checkout) — the source of truth for
          seller order visibility, independent of negotiation records */}
      <Card padding="md" className="seller-orders-card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base flex items-center gap-2">
            <ShoppingBag size={16} className="text-accent" /> Customer Orders & Pickup Requests
            <Badge variant={sellerOrders.length ? 'success' : 'default'} size="sm">
              {sellerOrders.length} {sellerOrders.length === 1 ? 'Order' : 'Orders'}
            </Badge>
          </h3>
          <span className="text-xs text-muted">Live from customer checkout • 2% platform fee per order</span>
        </div>

        {sellerOrders.length === 0 ? (
          <EmptyState
            title="No orders yet"
            message="Orders placed by customers for your store's products appear here the moment checkout completes."
          />
        ) : (
          <div className="seller-orders-list flex flex-col gap-3">
            {sellerOrders.map((order) => (
              <div key={order.id} className="seller-order-row surface-card p-3">
                <div className="flex items-center gap-3">
                  <img src={order.productImage} alt={order.productName} className="offer-thumb" />
                  <div className="seller-order-info">
                    <h5 className="font-semibold text-xs">{order.productName}</h5>
                    <p className="text-xs text-muted">
                      Order #{order.id} • {formatDateIN(order.date)} • Qty: {order.quantity}
                    </p>
                    <p className="text-xs text-muted flex items-center gap-1">
                      <User size={12} /> Customer: {order.customerName || 'Customer'}
                    </p>
                    <div className="seller-order-price-row flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs font-bold text-main">
                        Final: {formatINR(order.unitPrice)}
                      </span>
                      <span className="text-xs text-muted">
                        Total: {formatINR(order.totalAmount)}
                      </span>
                      {order.negotiated ? (
                        <>
                          {order.originalPrice ? (
                            <span className="text-xs text-muted line-through">
                              {formatINR(order.originalPrice)}
                            </span>
                          ) : null}
                          <Badge variant="bargain" size="sm">
                            Smart Offer • {offerStatusLabel(order.offerStatus)}
                          </Badge>
                        </>
                      ) : (
                        <Badge variant="default" size="sm">Normal Purchase</Badge>
                      )}
                      <span className="text-xs text-muted">
                        2% fee: {formatINR(order.platformCommission, true)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="seller-order-side flex items-center gap-2">
                  <Badge
                    variant={order.status === 'Delivered' ? 'success' : 'info'}
                    size="sm"
                  >
                    {order.status}
                  </Badge>
                  <span className="text-xs text-muted whitespace-nowrap">{order.paymentStatus}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="seller-dashboard-sections grid grid-cols-2 gap-6">
        {/* Incoming customer offers awaiting THIS seller's decision (concept A —
            never an order). Countered queries move to "Waiting for Customer". */}
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Tag size={16} className="text-bargain" /> Incoming Offers (Pending Queries)
              <Badge variant="bargain" size="sm">{pendingNegotiations.length}</Badge>
            </h3>
            <Link to="/seller/negotiations" className="text-xs text-accent font-semibold flex items-center gap-1">
              View Queue <ArrowRight size={12} />
            </Link>
          </div>

          <p className="pending-queries-note text-xs text-muted flex items-center gap-1">
            <MessageSquare size={12} />
            {counteredNegotiations.length === 0
              ? 'No counters pending a customer response.'
              : `${counteredNegotiations.length} counter offer(s) waiting for the customer.`}{' '}
            Orders only appear above once customers finish checkout.
          </p>

          <div className="offers-list flex flex-col gap-3">
            {pendingNegotiations.length === 0 && (
              <EmptyState
                title="No pending queries"
                message="New customer price offers for your products show up here instantly."
              />
            )}
            {pendingNegotiations.map((neg) => (
              <div key={neg.id} className="offer-summary-row flex items-center justify-between p-3 surface-card">
                <div className="flex items-center gap-3">
                  <img src={neg.productImage} alt={neg.productTitle} className="offer-thumb" />
                  <div>
                    <h5 className="font-semibold text-xs">{neg.productTitle}</h5>
                    <p className="text-xs text-muted">
                      Buyer: {neg.buyerName}
                      {neg.createdAt ? ` • Received ${formatDateIN(neg.createdAt)}` : ''}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted line-through">{formatINR(neg.originalPrice)}</span>
                      <span className="text-xs font-bold text-bargain">{formatINR(neg.offeredPrice)}</span>
                      <Badge variant="bargain" size="sm">Pending</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={() => handleAcceptNegotiation(neg.id)}>
                    Accept
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleRejectNegotiation(neg.id)}>
                    Decline
                  </Button>
                  <Button variant="bargain" size="sm" onClick={() => handleOpenCounter(neg)}>
                    Counter
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Store Active Listings */}
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Package size={16} className="text-accent" /> Store Catalog ({sellerProducts.length} Items)
            </h3>
            <Button variant="primary" size="sm" onClick={handleAddProduct}>
              + Add Product
            </Button>
          </div>

          <div className="seller-products-list flex flex-col gap-3">
            {sellerProducts.map((prod) => (
              <div key={prod.id} className="seller-product-row flex items-center justify-between p-3 surface-card">
                <div className="flex items-center gap-3">
                  <img src={prod.images[0]} alt={prod.title} className="offer-thumb" />
                  <div>
                    <h5 className="font-semibold text-xs">{prod.title}</h5>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold">{formatINR(prod.price)}</span>
                      <span className="text-xs text-muted">Stock: {prod.stock}</span>
                      <span className="text-xs text-muted">Floor: {formatINR(prod.minAcceptablePrice)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={prod.bargainable ? 'bargain' : 'default'} size="sm">
                    {prod.bargainable ? 'Bargaining ON' : 'Fixed Price'}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteProduct(prod.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <CounterModal
        isOpen={Boolean(activeCounterNeg)}
        onClose={() => setActiveCounterNeg(null)}
        negotiation={activeCounterNeg}
        onSubmit={handleCounterSubmit}
        counterValue={counterInputVal}
        setCounterValue={(val) => {
          setCounterInputVal(val);
          setCounterError('');
        }}
        error={counterError}
      />
    </div>
  );
};

// Counter Offer Modal
const CounterModal = ({ isOpen, onClose, negotiation, onSubmit, counterValue, setCounterValue, error }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Counter Offer" maxWidth="400px">
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <p>Countering <strong>{negotiation?.productTitle}</strong> (listed ₹{negotiation?.originalPrice})</p>
      <Input
        label="Counter Amount (₹)"
        type="number"
        min={1}
        max={negotiation?.originalPrice}
        value={counterValue}
        onChange={(e) => setCounterValue(e.target.value)}
        error={error}
        required
      />
      <div className="flex justify-end gap-2 mt-2">
        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
        <Button variant="primary" type="submit">Send Counter</Button>
      </div>
    </form>
  </Modal>
);

export default SellerDashboard;

