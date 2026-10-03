import React from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { api } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { formatINR } from '../../utils/formatters';
import {
  IndianRupee,
  TrendingUp,
  Store,
  Users,
  ShieldCheck,
  Percent,
  CheckCircle
} from 'lucide-react';
import './AdminPanel.css';

// Merchant accounts have no portrait field, and inventing a stock photo of a
// stranger would misrepresent a real business. The roster keeps its avatar
// slot with a neutral shop glyph instead.
const SELLER_AVATAR_PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect width="48" height="48" rx="24" fill="#e8eef5"/><path d="M14 20h20l-2 14H16z" fill="none" stroke="#7b8aa0" stroke-width="2"/><path d="M18 20a6 6 0 0 1 12 0" fill="none" stroke="#7b8aa0" stroke-width="2"/></svg>'
)}`;

// The admin screens render lowercase statuses ('active', 'approved',
// 'pending'), while the API speaks its database enums. Normalising once on
// load keeps every comparison in the JSX below working unchanged.
const lower = (value) => String(value || '').toLowerCase();

/**
 * Reads all six ADMIN-only collections in one batch.
 *
 * Module scope on purpose: the mount effect below only *applies* the result,
 * and it can cancel the application when the panel unmounts while the requests
 * are still in flight.
 */
const fetchAdminSnapshot = async () => {
  const [metricsRes, usersRes, sellersRes, productsRes, ordersRes, reviewsRes] =
    await Promise.all([
      api.getAdminMetrics(),
      api.getAdminUsers(),
      api.getAdminSellers(),
      api.getAdminProducts(),
      api.getAdminOrders(),
      api.getAdminReviews()
    ]);

  return {
    metrics: metricsRes?.data || null,
    users: (usersRes?.data || []).map((u) => ({ ...u, status: lower(u.status) })),
    sellers: sellersRes?.data || [],
    products: (productsRes?.data || []).map((p) => ({ ...p, status: lower(p.status) })),
    orders: ordersRes?.data || [],
    // /admin/reviews answers with the raw documents (only `_id`), unlike the
    // five endpoints above which each expose a string `id`. Reading `r.id` off
    // those rows yielded undefined: React keys collided and Approve/Reject
    // posted PUT /admin/reviews/undefined/status, which can only 404 — so
    // moderation from this panel never reached the server. The id is taken
    // from whichever of the two the payload actually carries.
    reviews: (reviewsRes?.data || []).map((r) => ({
      ...r,
      id: r.id || r._id,
      status: lower(r.status)
    }))
  };
};

export const AdminPanel = () => {
  // Platform data, all read from the ADMIN-only API on mount
  const [metrics, setMetrics] = React.useState(null);
  const [users, setUsers] = React.useState([]);
  const [reviews, setReviews] = React.useState([]);
  const [products, setProducts] = React.useState([]);
  const [sellers, setSellers] = React.useState([]);
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState('');
  const [actionError, setActionError] = React.useState('');
  const [userSearch, setUserSearch] = React.useState('');
  const [productSearch, setProductSearch] = React.useState('');
  const [reviewSearch, setReviewSearch] = React.useState('');

  React.useEffect(() => {
    let active = true;
    fetchAdminSnapshot()
      .then((snapshot) => {
        if (!active) return;
        setMetrics(snapshot.metrics);
        setUsers(snapshot.users);
        setSellers(snapshot.sellers);
        setProducts(snapshot.products);
        setOrders(snapshot.orders);
        setReviews(snapshot.reviews);
        setLoadError('');
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setLoadError(err.message || 'Could not reach the platform API. Is the backend running?');
        setLoading(false);
      });
    return () => {
      active = false;
    };
    // The admin snapshot is read once when the panel mounts.
  }, []);

  // Applies a server-confirmed status change to the row that is on screen. The
  // request is what actually decides the new state — the panel never mutates
  // data the backend refused.
  const runAction = async (request, apply) => {
    setActionError('');
    try {
      await request();
      apply();
    } catch (err) {
      setActionError(err.message || 'That change could not be saved.');
    }
  };

  // User status handlers — PUT /admin/users/:id/status
  const toggleUserStatus = (id) => {
    const target = users.find((u) => u.id === id);
    if (!target) return;
    const nextStatus = target.status === 'active' ? 'suspended' : 'active';
    // Suspending cuts a real account off immediately, so it is confirmed with
    // the account named — the reverse (reinstating) is not destructive.
    if (
      nextStatus === 'suspended' &&
      !window.confirm(
        `Suspend ${target.businessName || target.name} (${target.role.toLowerCase()})? They will no longer be able to sign in until reactivated.`
      )
    ) {
      return;
    }
    runAction(
      () => api.setAdminUserStatus(id, nextStatus.toUpperCase()),
      () =>
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: nextStatus } : u)))
    );
  };

  // Product handlers — PUT /admin/products/:id/status
  const approveProduct = (id) => {
    runAction(
      () => api.setAdminProductStatus(id, 'ACTIVE'),
      () => setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'approved' } : p)))
    );
  };
  const removeProduct = (id) => {
    const target = products.find((p) => p.id === id);
    // Removal takes a listing out of the public catalogue — confirm first.
    if (
      !window.confirm(
        `Remove “${target?.name || 'this listing'}” from the public catalogue? Customers will see it as unavailable.`
      )
    ) {
      return;
    }
    runAction(
      () => api.setAdminProductStatus(id, 'INACTIVE'),
      () => setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'removed' } : p)))
    );
  };

  // Review handlers — PUT /admin/reviews/:id/status. Approving also recomputes
  // the seller's public rating on the server, so the roster is re-read after.
  const approveReview = (id) => {
    runAction(async () => {
      await api.setAdminReviewStatus(id, 'APPROVED');
      const sellersRes = await api.getAdminSellers();
      setSellers(sellersRes?.data || []);
    }, () => setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'approved' } : r))));
  };
  const rejectReview = (id) => {
    const target = reviews.find((r) => r.id === id);
    // Rejecting a customer's words (and recomputing the seller rating) is
    // irreversible from this panel — confirm with the text in view.
    if (
      !window.confirm(
        `Reject this review by ${target?.customerName || target?.customer?.name || 'the customer'}? It stays hidden from the product page.`
      )
    ) {
      return;
    }
    runAction(async () => {
      await api.setAdminReviewStatus(id, 'REJECTED');
      const sellersRes = await api.getAdminSellers();
      setSellers(sellersRes?.data || []);
    }, () => setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'rejected' } : r))));
  };
  return (
    <div className="admin-panel-page container mt-6">
      <div className="admin-header flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Platform Governance & Revenue</h1>
            <Badge variant="info" size="sm">Admin Oversight</Badge>
          </div>
          <p className="text-sm text-muted">
            Monitors hyperlocal volume, seller health, and the 2% platform fee take-rate
          </p>
        </div>
      </div>

      {loading && (
        <p className="text-sm text-muted mb-4">Loading platform data…</p>
      )}
      {loadError && (
        <p className="text-sm text-danger mb-4" role="alert">{loadError}</p>
      )}
      {actionError && (
        <p className="text-sm text-danger mb-4" role="alert">{actionError}</p>
      )}

      {/* Admin KPI Summary */}
      <div className="admin-kpi-grid grid grid-cols-4 gap-4 mb-6">
        <Card padding="md" className="admin-kpi-card">
          <div className="flex justify-between items-center text-xs text-muted font-semibold mb-1">
            <span>Gross Marketplace Volume</span>
            <IndianRupee size={16} className="text-accent" />
          </div>
          <span className="text-2xl font-bold text-main">
            {metrics ? formatINR(metrics.totalGrossVolume) : '—'}
          </span>
          <span className="text-xs text-muted mt-1 block">All orders except cancelled</span>
        </Card>

        <Card padding="md" className="admin-kpi-card">
          <div className="flex justify-between items-center text-xs text-muted font-semibold mb-1">
            <span>Platform Commission (2%)</span>
            <Percent size={16} style={{ color: 'var(--secondary)' }} />
          </div>
          <span className="text-2xl font-bold" style={{ color: 'var(--secondary)' }}>
            {metrics ? formatINR(metrics.totalPlatformCommission) : '—'}
          </span>
          <span className="text-xs text-accent mt-1 block flex items-center gap-1">
            <ShieldCheck size={12} /> Revenue from sellers
          </span>
        </Card>

        <Card padding="md" className="admin-kpi-card">
          <div className="flex justify-between items-center text-xs text-muted font-semibold mb-1">
            <span>Active Local Sellers</span>
            <Store size={16} className="text-accent" />
          </div>
          <span className="text-2xl font-bold text-main">
            {metrics ? metrics.activeLocalSellers : '—'}
          </span>
          <span className="text-xs text-muted mt-1 block">In 5 km downtown zone</span>
        </Card>

        <Card padding="md" className="admin-kpi-card">
          <div className="flex justify-between items-center text-xs text-muted font-semibold mb-1">
            <span>Bargain Settlements</span>
            <TrendingUp size={16} className="text-bargain" />
          </div>
          <span className="text-2xl font-bold text-bargain">
            {metrics ? metrics.totalCompletedNegotiations : '—'}
          </span>
          <span className="text-xs text-muted mt-1 block">
            Avg discount: {metrics ? metrics.averageDiscountRate : '—'}
          </span>
        </Card>
      </div>

      <div className="admin-sections-grid grid grid-cols-2 gap-6">
        {/* Active Local Sellers Directory */}
        <Card padding="md">
          <h2 className="font-bold text-base mb-4 flex items-center gap-2">
            <Store size={16} className="text-accent" /> Neighborhood Merchant Roster
          </h2>

          <div className="seller-roster-list flex flex-col gap-3">
            {sellers.length === 0 && !loading && (
              <p className="text-xs text-muted">No merchant accounts have registered yet.</p>
            )}
            {sellers.map((seller) => (
              <div key={seller.id} className="seller-roster-item flex items-center justify-between p-3 surface-card">
                <div className="flex items-center gap-3">
                  <img
                    src={seller.avatar || SELLER_AVATAR_PLACEHOLDER}
                    alt={seller.name}
                    className="roster-avatar"
                  />
                  <div>
                    <h3 className="font-semibold text-sm">{seller.name}</h3>
                    <p className="text-xs text-muted">Owner: {seller.owner} • {seller.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={seller.status === 'ACTIVE' ? 'success' : 'danger'} size="sm">
                    {seller.status === 'ACTIVE' ? 'Active Store' : 'Suspended'}
                  </Badge>
                  {seller.verified && (
                    <Badge variant="info" size="sm" className="ml-1">Verified</Badge>
                  )}
                  <span className="text-xs text-muted block mt-1">
                    Rating: {seller.rating > 0 ? `${seller.rating} ★` : 'Not rated yet'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

{/* User Management */}
<Card padding="md">
  <h2 className="font-bold text-base mb-4 flex items-center gap-2">
    <Users size={16} className="text-accent" /> User Management
  </h2>
  <Input
    placeholder="Search users..."
    value={userSearch}
    onChange={(e) => setUserSearch(e.target.value)}
  />
  <div className="admin-users-list flex flex-col gap-3 mt-3">
    {users.length === 0 && !loading && (
      <p className="text-xs text-muted">No accounts registered yet.</p>
    )}
    {users
      .filter((u) =>
        (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(userSearch.toLowerCase())
      )
      .map((u) => (
        <div key={u.id} className="user-item flex items-center justify-between p-3 surface-card">
          <div>
            <h3 className="font-semibold text-sm">{u.name}</h3>
            <p className="text-xs text-muted">{u.email} • {u.role}</p>
          </div>
          <div className="text-right flex items-center gap-2">
            <Badge variant={u.status === 'active' ? 'success' : u.status === 'suspended' ? 'danger' : 'warning'} size="sm">
              {u.status}
            </Badge>
            <Button
              variant={u.status === 'active' ? 'danger' : 'primary'}
              size="sm"
              onClick={() => toggleUserStatus(u.id)}
            >
              {u.status === 'active' ? 'Suspend' : 'Activate'}
            </Button>
          </div>
        </div>
      ))}
  </div>
</Card>

{/* Product Management */}
<Card padding="md" className="mt-6">
  <h2 className="font-bold text-base mb-4 flex items-center gap-2">
    <Store size={16} className="text-accent" /> Product Management
  </h2>
  <Input
    placeholder="Search products..."
    value={productSearch}
    onChange={(e) => setProductSearch(e.target.value)}
  />
  <div className="admin-products-list flex flex-col gap-3 mt-3">
    {products.length === 0 && !loading && (
      <p className="text-xs text-muted">No listings exist yet.</p>
    )}
    {products
      .filter((p) => (p.title || p.name || '').toLowerCase().includes(productSearch.toLowerCase()))
      .map((p) => (
        <div key={p.id} className="product-item flex items-center justify-between p-3 surface-card">
          <div>
            <h3 className="font-semibold text-sm">{p.title || p.name}</h3>
            <p className="text-xs text-muted">Status: {p.status} • {p.sellerName} • Stock: {p.stock}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => approveProduct(p.id)}
              disabled={p.status === 'approved'}
            >
              Approve
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => removeProduct(p.id)}
            >
              Remove
            </Button>
          </div>
        </div>
      ))}
  </div>
</Card>

{/* Reviews Section */}
<Card padding="md" className="mt-6">
  <h2 className="font-bold text-base mb-4 flex items-center gap-2">
    <CheckCircle size={16} className="text-accent" /> Reviews
  </h2>
  <Input
    placeholder="Search reviews..."
    value={reviewSearch}
    onChange={(e) => setReviewSearch(e.target.value)}
  />
  <div className="admin-reviews-list flex flex-col gap-3 mt-3">
    {reviews.length === 0 && !loading && (
      <p className="text-xs text-muted">
        No reviews have been submitted yet. Nothing here is simulated — this list fills up as
        customers review their purchases.
      </p>
    )}
    {reviews
      .filter((r) => (r.comment || '').toLowerCase().includes(reviewSearch.toLowerCase()))
      .map((r) => (
        <div key={r.id} className="review-item flex items-center justify-between p-3 surface-card">
          <div>
            <p className="text-sm">{r.comment}</p>
            <p className="text-xs text-muted">Rating: {r.rating}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'danger' : 'warning'} size="sm">
              {r.status}
            </Badge>
            <Button
              variant="primary"
              size="sm"
              onClick={() => approveReview(r.id)}
              disabled={r.status !== 'pending'}
            >
              Approve
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => rejectReview(r.id)}
            >
              Reject
            </Button>
          </div>
        </div>
      ))}
  </div>
</Card>

        {/* Recent Platform Orders & Fees */}
        <Card padding="md">
          <h2 className="font-bold text-base mb-4 flex items-center gap-2">
            <IndianRupee size={16} className="text-secondary" /> Recent Settlements & 2% Fee Cut
          </h2>

          <div className="admin-orders-list flex flex-col gap-3">
            {orders.length === 0 && !loading && (
              <p className="text-xs text-muted">No transactions have settled yet.</p>
            )}
            {orders.map((ord) => (
              <div key={ord.id} className="order-fee-row flex items-center justify-between p-3 surface-card">
                <div>
                  <h3 className="font-semibold text-sm">Order #{ord.orderNumber || ord.id}</h3>
                  <p className="text-xs text-muted">Store: {ord.sellerName} • {ord.statusLabel}</p>
                  <span className="text-xs text-accent">{ord.fulfillmentType}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold block">{formatINR(ord.totalAmount)} GMV</span>
                  <span className="text-xs font-semibold text-secondary">
                    +{formatINR(ord.platformCommission, true)} (2% platform)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
