import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { api } from '../../services/api';
import {
  useAuth,
  filterNegotiationsForSeller,
  filterOrdersForSeller,
  isAwaitingSeller,
  isAwaitingCustomer
} from '../../context/AuthContext';
import { EmptyState, Loader } from '../../components/common/Loader';
import { formatINR, formatDateIN } from '../../utils/formatters';
import { MOCK_CATEGORIES } from '../../data/mockData';
import {
  Package,
  TrendingUp,
  Tag,
  Percent,
  ShoppingBag,
  User,
  Plus,
  Loader2
} from 'lucide-react';
import './SellerDashboard.css';

// Furniture photo used when a merchant has not pasted their own yet. It must
// stay distinct from every catalog image: listings sharing an already-used
// photo are collapsed by the catalog de-duplication pass and would not show.
// No default photo: a blank image field renders a local category placeholder.
// Prefilling one shared stock photo made every listing created through the
// form carry the same wrong picture.

const offerStatusLabel = (status) =>
  ({
    accepted: 'Offer Accepted',
    ACCEPTED: 'Offer Accepted',
    countered: 'Counter Accepted',
    COUNTERED: 'Counter Accepted',
    countered_to_customer: 'Counter Accepted',
    pending_customer: 'Counter Accepted',
    pending: 'Customer Offer Applied',
    PENDING: 'Customer Offer Applied',
    pending_seller: 'Customer Offer Applied',
    declined: 'Offer Rejected',
    rejected: 'Offer Rejected',
    REJECTED: 'Offer Rejected'
  })[status] || 'Smart Offer';

export const SellerDashboard = () => {
  const {
    negotiations,
    orders,
    ordersLoading,
    ordersError,
    currentUser,
    negotiationError,
    refreshNegotiations,
    refreshOrders,
    acceptNegotiation,
    declineNegotiation,
    counterNegotiation
  } = useAuth();

  // The merchant's real inventory: GET /api/products/mine returns every
  // listing this account owns — including hidden ones. The dashboard used to
  // lean on the public catalogue read, which only ever shows ACTIVE stock
  // inside the visitor's radius, so a paused listing was invisible to the very
  // person meant to manage it.
  const [myProducts, setMyProducts] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState('');
  const [inventoryBusyId, setInventoryBusyId] = useState(null);

  const loadInventory = useCallback(async () => {
    try {
      const res = await api.getMyProducts();
      setMyProducts(res?.data || []);
      setInventoryError('');
    } catch (err) {
      setInventoryError(err.message || 'Could not load your listings.');
    } finally {
      setInventoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  // Load this seller's incoming offers from MongoDB (GET /api/negotiations/seller)
  useEffect(() => {
    refreshNegotiations();
  }, [refreshNegotiations]);

  // Backend-scoped by JWT — `/mine` only ever returns this account's records.
  const sellerProducts = myProducts;

  const sellerNegotiations = filterNegotiationsForSeller(negotiations, currentUser);
  const pendingNegotiations = sellerNegotiations.filter((n) => isAwaitingSeller(n.status));
  // eslint-disable-next-line no-unused-vars
  const _counteredNegotiations = sellerNegotiations.filter((n) => isAwaitingCustomer(n.status));

  const sellerOrders = filterOrdersForSeller(orders, currentUser);

  // Counter Modal State
  const [activeCounterNeg, setActiveCounterNeg] = useState(null);
  const [counterInputVal, setCounterInputVal] = useState('');
  const [counterError, setCounterError] = useState('');

  // Add Product Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  // Non-null while the modal edits an existing listing instead of creating one
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    category: 'Living Room',
    description: '',
    price: '',
    stock: 5,
    isNegotiable: true,
    hiddenMinimumPrice: '',
    images: ''
  });
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setNewProductForm({
      name: '',
      category: 'Living Room',
      description: '',
      price: '',
      stock: 5,
      isNegotiable: true,
      hiddenMinimumPrice: '',
      images: ''
    });
    setAddError('');
    setIsAddModalOpen(true);
  };

  // Prefills the same form for an existing listing; submit then PUTs instead
  // of POSTs, so merchants can edit price/stock/description without leaving
  // the dashboard (the backend endpoint already enforces ownership).
  const handleOpenEditProduct = (prod) => {
    setEditingProduct(prod);
    setNewProductForm({
      name: prod.name || '',
      category: prod.category || 'Living Room',
      description: prod.description || '',
      price: String(prod.price ?? ''),
      stock: prod.stock ?? 1,
      isNegotiable: !!prod.isNegotiable,
      hiddenMinimumPrice: prod.hiddenMinimumPrice != null ? String(prod.hiddenMinimumPrice) : '',
      images: prod.images?.[0] || ''
    });
    setAddError('');
    setIsAddModalOpen(true);
  };

  // Hide/publish toggle. Hiding is the backend's DELETE (a deactivation that
  // keeps orders and negotiations intact); publishing re-activates. Both are
  // confirmed first because they change what the public catalogue shows.
  const handleToggleListingVisibility = async (prod) => {
    const isActive = prod.status === 'ACTIVE';
    const confirmed = window.confirm(
      isActive
        ? `Hide “${prod.name}” from the public catalogue? Existing orders and offers stay intact.`
        : `Publish “${prod.name}” back to the public catalogue?`
    );
    if (!confirmed) return;

    setInventoryBusyId(prod._id || prod.id);
    try {
      if (isActive) await api.deleteProduct(prod._id || prod.id);
      else await api.updateProduct(prod._id || prod.id, { status: 'ACTIVE' });
      await loadInventory();
    } catch (err) {
      setInventoryError(err.message || 'Could not update the listing.');
    } finally {
      setInventoryBusyId(null);
    }
  };

  const handleCreateProductSubmit = async (e) => {
    e.preventDefault();
    setAddError('');
    const priceNum = Number(newProductForm.price);
    const minPriceNum = Number(newProductForm.hiddenMinimumPrice);

    if (!newProductForm.name.trim()) {
      setAddError('Product name is required');
      return;
    }
    if (!priceNum || priceNum <= 0) {
      setAddError('Please enter a valid price in ₹');
      return;
    }
    if (newProductForm.isNegotiable && minPriceNum && minPriceNum >= priceNum) {
      setAddError('Minimum price must be lower than the listed price');
      return;
    }

    setAddLoading(true);
    try {
      const payload = {
        name: newProductForm.name,
        category: newProductForm.category,
        description: newProductForm.description || 'Quality handcrafted local furniture piece.',
        price: priceNum,
        stock: Number(newProductForm.stock) || 1,
        isNegotiable: newProductForm.isNegotiable,
        // A blank image field means "no photo yet" — the card and detail page
        // show a local placeholder. Prefilling one shared photo made every
        // listing created through this form carry the same wrong picture.
        images: (() => {
          const image = (newProductForm.images || '').trim();
          return image ? [image] : [];
        })()
      };
      if (payload.isNegotiable) {
        payload.hiddenMinimumPrice = minPriceNum || Math.round(priceNum * 0.85);
      } else if (editingProduct) {
        // Switched to fixed price: clear a floor left behind by an earlier
        // negotiable version (undefined would mean "leave unchanged").
        payload.hiddenMinimumPrice = null;
      }

      if (editingProduct) {
        await api.updateProduct(editingProduct._id || editingProduct.id, payload);
      } else {
        await api.createProduct(payload);
      }
      await loadInventory();
      setIsAddModalOpen(false);
      setEditingProduct(null);
    } catch (err) {
      setAddError(err.message || 'Failed to save the product on the backend.');
    } finally {
      setAddLoading(false);
    }
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
    counterNegotiation(activeCounterNeg.id || activeCounterNeg._id, amount);
    setActiveCounterNeg(null);
    setCounterInputVal('');
    setCounterError('');
  };

  // --- Order lifecycle -----------------------------------------------------
  // Only the moves the backend will accept from a merchant, keyed by the
  // order's current status. The server validates the same table again (and
  // that this merchant owns the order), so the UI can never fake a transition.
  const NEXT_ORDER_ACTIONS = {
    PENDING: [
      { to: 'PAID', label: 'Payment Received' },
      { to: 'CANCELLED', label: 'Cancel Order', danger: true }
    ],
    PAID: [
      { to: 'PROCESSING', label: 'Start Preparing' },
      { to: 'COMPLETED', label: 'Mark Completed' },
      { to: 'CANCELLED', label: 'Cancel Order', danger: true }
    ],
    PROCESSING: [
      { to: 'COMPLETED', label: 'Mark Completed' },
      { to: 'CANCELLED', label: 'Cancel Order', danger: true }
    ]
  };

  const orderStatusVariant = (status) =>
    ({ PENDING: 'warning', PAID: 'success', PROCESSING: 'info', COMPLETED: 'success', CANCELLED: 'danger' })[status] || 'default';

  const [orderActionBusyId, setOrderActionBusyId] = useState(null);
  const [orderActionError, setOrderActionError] = useState('');

  const handleOrderStatusChange = async (order, nextStatus) => {
    if (
      nextStatus === 'CANCELLED' &&
      !window.confirm(
        `Cancel order #${order.orderNumber || order.id}? The reserved stock returns to your inventory and the sale will not count.`
      )
    ) {
      return;
    }
    setOrderActionBusyId(order.id);
    setOrderActionError('');
    try {
      await api.updateOrderStatus(order.id, nextStatus);
      await refreshOrders();
    } catch (err) {
      setOrderActionError(err.message || 'Could not update the order status.');
    } finally {
      setOrderActionBusyId(null);
    }
  };

  // Real totals only — never fall back to a placeholder figure, otherwise an
  // empty order book still displays "₹68,400 in sales" and masks the bug.
  // Cancelled orders are not sales: they leave the gross figure, and the
  // commission shown is the per-order value the BACKEND stored at checkout
  // (2% of that order's total) — summed here, never recomputed in the browser.
  const activeSellerOrders = sellerOrders.filter((ord) => ord.status !== 'CANCELLED');
  const totalGrossSales = activeSellerOrders.reduce((sum, ord) => sum + (ord.totalAmount || 0), 0);
  const platformCommissionPaid = activeSellerOrders.reduce(
    (sum, ord) => sum + (Number(ord.platformCommission) || 0),
    0
  );
  const netEarnings = totalGrossSales - platformCommissionPaid;

  return (
    <div className="seller-dashboard-page container mt-6">
      <div className="dashboard-header flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{currentUser?.storeName || currentUser?.businessName || currentUser?.name || 'My Store'}</h1>
            {/* Only shown when the account actually carries the verified flag —
                a hard-coded "Verified" badge claimed a check that never happened */}
            {currentUser?.isVerifiedSeller && (
              <Badge variant="success" size="sm">Verified Merchant</Badge>
            )}
          </div>
          <p className="text-sm text-muted">
            Manage inventory, customer counter-offers, and 2% platform deductions
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="primary" icon={Plus} onClick={handleOpenAddProduct}>
            + Add Product
          </Button>
          <Link to="/seller/negotiations">
            <Button variant="bargain" icon={Tag}>
              Review Active Offers ({pendingNegotiations.length})
            </Button>
          </Link>
        </div>
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
            <TrendingUp size={12} /> Live tracking
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
          <span className="text-xs text-muted mt-1 block">Paid strictly upon finalized sale</span>
        </Card>

        <Card padding="md" className="kpi-card">
          <div className="flex items-center justify-between text-muted text-xs font-semibold mb-1">
            <span>Incoming Offers</span>
            <Tag size={16} className="text-bargain" />
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

      {/* Customer Orders */}
      <Card padding="md" className="seller-orders-card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-base flex items-center gap-2">
            <ShoppingBag size={16} className="text-accent" /> Customer Orders & Pickup Requests
            <Badge variant={sellerOrders.length ? 'success' : 'default'} size="sm">
              {sellerOrders.length} {sellerOrders.length === 1 ? 'Order' : 'Orders'}
            </Badge>
          </h2>
          <span className="text-xs text-muted">Live from customer checkout • 2% platform fee per order</span>
        </div>

        {ordersLoading ? (
          <div className="flex justify-center items-center py-6">
            <Loader size="md" message="Loading orders..." />
          </div>
        ) : ordersError ? (
          <p className="text-sm text-danger" role="alert">{ordersError}</p>
        ) : sellerOrders.length === 0 ? (
          <EmptyState
            title="No orders yet"
            message="Orders placed by customers for your store's products appear here the moment checkout completes."
          />
        ) : (
          <div className="seller-orders-list flex flex-col gap-3">
            {orderActionError && (
              <p className="text-sm text-danger" role="alert">{orderActionError}</p>
            )}
            {sellerOrders.map((order) => (
              <div key={order.id} className="seller-order-row surface-card p-3">
                <div className="flex items-center gap-3">
                  <img src={order.productImage} alt={order.productName} className="offer-thumb" />
                  <div className="seller-order-info">
                    <h3 className="font-semibold text-xs">{order.productName}</h3>
                    <p className="text-xs text-muted">
                      Order #{order.orderNumber || order.id} • {formatDateIN(order.date)} • Qty: {order.quantity}
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
                      {order.negotiated && (
                        <Badge variant="bargain" size="sm">
                          Smart Offer • {offerStatusLabel(order.offerStatus)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="seller-order-meta text-right">
                  <Badge variant={orderStatusVariant(order.status)} size="sm">
                    {order.statusLabel || order.status}
                  </Badge>
                  <p className="text-xs text-muted mt-1">
                    Platform 2%: <strong>{formatINR(order.platformCommission, true)}</strong>
                  </p>
                  {NEXT_ORDER_ACTIONS[order.status] && (
                    <div className="seller-order-actions flex gap-2 mt-2 justify-end flex-wrap">
                      {NEXT_ORDER_ACTIONS[order.status].map((action) => (
                        <Button
                          key={action.to}
                          variant={action.danger ? 'danger' : 'primary'}
                          size="sm"
                          disabled={orderActionBusyId === order.id}
                          onClick={() => handleOrderStatusChange(order, action.to)}
                        >
                          {orderActionBusyId === order.id ? 'Saving…' : action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Incoming Offers */}
      <div className="dashboard-grid grid grid-cols-2 gap-6">
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base flex items-center gap-2">
              <Tag size={16} className="text-bargain" /> Incoming Price Proposals
              <Badge variant="bargain" size="sm">{pendingNegotiations.length} Pending</Badge>
            </h2>
            <Link to="/seller/negotiations" className="text-xs text-accent hover:underline">
              View All
            </Link>
          </div>

          <div className="offers-list flex flex-col gap-3">
            {negotiationError && (
              <p className="text-sm text-danger" role="alert">
                {negotiationError}
              </p>
            )}
            {pendingNegotiations.length === 0 && (
              <EmptyState
                title="No pending queries"
                message="New customer price offers for your products show up here instantly."
              />
            )}
            {pendingNegotiations.map((neg) => (
              <div key={neg.id || neg._id} className="offer-summary-row flex items-center justify-between p-3 surface-card">
                <div className="flex items-center gap-3">
                  <img src={neg.productImage} alt={neg.productTitle} className="offer-thumb" />
                  <div>
                    <h3 className="font-semibold text-xs">{neg.productTitle}</h3>
                    <p className="text-xs text-muted">
                      Buyer: {neg.buyerName}
                      {neg.createdAt ? ` • Received ${formatDateIN(neg.createdAt)}` : ''}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted line-through">{formatINR(neg.originalPrice)}</span>
                      <span className="text-xs font-bold text-bargain">{formatINR(neg.currentOfferPrice ?? neg.offeredPrice)}</span>
                      <Badge variant="bargain" size="sm">Pending</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={() => acceptNegotiation(neg.id || neg._id)}>
                    Accept
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => declineNegotiation(neg.id || neg._id)}>
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
            <h2 className="font-bold text-base flex items-center gap-2">
              <Package size={16} className="text-accent" /> Store Catalog ({sellerProducts.length} Items)
            </h2>
            <Button variant="primary" size="sm" onClick={handleOpenAddProduct}>
              + Add Product
            </Button>
          </div>

          <div className="seller-products-list flex flex-col gap-3">
            {inventoryLoading ? (
              <div className="flex justify-center items-center py-6">
                <Loader size="md" message="Loading your listings..." />
              </div>
            ) : inventoryError ? (
              <p className="text-sm text-danger" role="alert">{inventoryError}</p>
            ) : sellerProducts.length === 0 ? (
              <EmptyState
                title="No listings yet"
                message="Add your first furniture piece with the button above — it appears in the catalogue the moment it is saved."
              />
            ) : sellerProducts.map((prod) => (
              <div key={prod._id || prod.id} className="seller-product-row flex items-center justify-between p-3 surface-card">
                <div className="flex items-center gap-3">
                  <img src={prod.images?.[0]} alt={prod.title || prod.name} className="offer-thumb" />
                  <div>
                    <h3 className="font-semibold text-xs">{prod.title || prod.name}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs font-bold">{formatINR(prod.price)}</span>
                      <span className="text-xs text-muted">Stock: {prod.stock}</span>
                      <span className="text-xs text-muted">Floor: {formatINR(prod.hiddenMinimumPrice || prod.minAcceptablePrice)}</span>
                      <Badge variant={prod.status === 'ACTIVE' ? 'success' : 'default'} size="sm">
                        {prod.status === 'ACTIVE' ? 'Live' : 'Hidden'}
                      </Badge>
                      <Badge variant={prod.isNegotiable ? 'bargain' : 'default'} size="sm">
                        {prod.isNegotiable ? 'Bargaining ON' : 'Fixed Price'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditProduct(prod)}
                    disabled={inventoryBusyId === (prod._id || prod.id)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant={prod.status === 'ACTIVE' ? 'secondary' : 'primary'}
                    size="sm"
                    loading={inventoryBusyId === (prod._id || prod.id)}
                    onClick={() => handleToggleListingVisibility(prod)}
                  >
                    {prod.status === 'ACTIVE' ? 'Hide' : 'Publish'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Add/Edit Product Modal (POST /api/products or PUT /api/products/:id) */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setEditingProduct(null); }}
        title={editingProduct ? 'Edit Furniture Listing' : 'Add New Furniture Listing'}
        maxWidth="480px"
      >
        <form onSubmit={handleCreateProductSubmit} className="flex flex-col gap-3">
          {addError && (
            <div className="p-2 bg-danger-light text-danger rounded text-xs">
              {addError}
            </div>
          )}

          <Input
            label="Product Name"
            placeholder="e.g. Royal Teak 6-Seater Dining Set"
            value={newProductForm.name}
            onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="input-label block text-xs font-semibold mb-1">Category</label>
              <select
                className="filter-select w-full"
                value={newProductForm.category}
                onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
              >
                {/* Same vocabulary the public catalogue filters use, so a
                    listing can always be found under its category chip. */}
                {MOCK_CATEGORIES.filter((cat) => cat !== 'All Furniture').map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <Input
              label="Stock Quantity"
              type="number"
              min={1}
              value={newProductForm.stock}
              onChange={(e) => setNewProductForm({ ...newProductForm, stock: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Listed Price (₹)"
              type="number"
              min={1}
              placeholder="e.g. 25000"
              value={newProductForm.price}
              onChange={(e) => setNewProductForm({ ...newProductForm, price: e.target.value })}
              required
            />
            <Input
              label="Hidden Minimum Price (₹)"
              type="number"
              min={1}
              placeholder="e.g. 21000"
              value={newProductForm.hiddenMinimumPrice}
              onChange={(e) => setNewProductForm({ ...newProductForm, hiddenMinimumPrice: e.target.value })}
              title="Offers below this amount are auto-rejected by the backend bargaining engine"
            />
          </div>

          <Input
            label="Description"
            placeholder="Material, wood type, finish, warranty..."
            value={newProductForm.description}
            onChange={(e) => setNewProductForm({ ...newProductForm, description: e.target.value })}
            required
            minLength={10}
            title="Describe the piece in at least 10 characters"
          />

          <Input
            label="Image URL"
            placeholder="https://..."
            value={newProductForm.images}
            onChange={(e) => setNewProductForm({ ...newProductForm, images: e.target.value })}
          />

          <div className="flex justify-end gap-2 mt-3">
            <Button
              variant="outline"
              type="button"
              onClick={() => { setIsAddModalOpen(false); setEditingProduct(null); }}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={addLoading}>
              {addLoading ? (
                <span className="flex items-center gap-1">
                  <Loader2 size={14} className="animate-spin" /> Saving...
                </span>
              ) : (
                editingProduct ? 'Save Changes' : 'Add to Inventory'
              )}
            </Button>
          </div>
        </form>
      </Modal>

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
