import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/Loader';
import { Trash2, Store, ShieldCheck, Plus, Minus, Loader2 } from 'lucide-react';
import { formatINR, formatDistance } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import './Cart.css';

export const Cart = () => {
  const { cartItems, updateCartQuantity, removeCartItem } = useAuth();

  // Set just before checkout clears the cart. `placeOrder` calls `clearCart()`,
  // which unmounts the form below, so the confirmation has to live here or it
  // would never be rendered and the user would only ever see "bag is empty".
  const [completedOrder, setCompletedOrder] = useState(null);

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const totalSavings = cartItems.reduce((acc, item) =>
    item.isNegotiated && item.originalPrice && item.originalPrice > item.price
      ? acc + (item.originalPrice - item.price) * item.quantity
      : acc,
    0
  );

  const sellerGroups = cartItems.reduce((acc, item) => {
    const key = item.seller || 'Local Merchant';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  if (cartItems.length === 0) {
    return (
      <div className="cart-page container">
        <h1 className="cart-page-title text-2xl font-bold">Your Local Shopping Bag</h1>
        <p className="cart-page-subtitle text-sm text-muted">
          Items organized by neighborhood seller for pickup or delivery
        </p>
        {completedOrder ? (
          <div className="order-confirmed-block surface-card">
            <h2 className="order-confirmed-title">Order Confirmed!</h2>
            <p className="order-confirmed-text text-xs text-muted">
              Your order of {formatINR(completedOrder.amount)} has been verified and registered for
              pickup/delivery from {completedOrder.storeName}.
            </p>
            <Link to="/orders" className="btn btn-primary btn-sm order-confirmed-link">
              View in My Orders
            </Link>
          </div>
        ) : (
          <EmptyState
            title="Your bag is empty"
            message="Browse nearby neighborhood deals and use Smart Bargaining to lock a fair price."
            action={
              <Link to="/products">
                <Button variant="primary" size="md">
                  Explore Local Deals
                </Button>
              </Link>
            }
          />
        )}
      </div>
    );
  }

  return (
    <div className="cart-page container">
      <h1 className="cart-page-title text-2xl font-bold">Your Local Shopping Bag</h1>
      <p className="cart-page-subtitle text-sm text-muted">
        Items organized by neighborhood seller for pickup or delivery
      </p>

      <div className="cart-layout">
        <div className="cart-items-column">
          {Object.entries(sellerGroups).map(([sellerName, items]) => (
            <Card padding="md" className="merchant-cart-group" key={sellerName}>
              <div className="cart-group-header">
                <div className="cart-group-title">
                  <Store size={18} className="text-accent" />
                  <span>{sellerName}</span>
                  <span className="cart-group-meta">
                    {items[0]?.distanceKm != null
                      ? `(${formatDistance(items[0].distanceKm)} away)`
                      : ''}
                  </span>
                </div>
                <Badge variant="success" size="sm">Store Pickup Ready</Badge>
              </div>

              <div className="cart-items-list">
                {items.map((item) => (
                  <div key={item.id} className="cart-item-row">
                    <div className="cart-item-info">
                      <img src={item.image} alt={item.title} className="cart-item-thumb" />
                      <div className="cart-item-details">
                        <h2 className="cart-item-title text-sm">{item.title}</h2>
                        <div className="cart-item-price-row">
                          <span className="cart-item-price text-sm font-bold">{formatINR(item.price)}</span>
                          {item.originalPrice && item.originalPrice > item.price && (
                            <span className="cart-item-original-price text-xs text-muted">
                              {formatINR(item.originalPrice)}
                            </span>
                          )}
                          {item.isNegotiated && (
                            <Badge variant="bargain" size="sm">Smart Offer Won</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="cart-item-actions">
                      <span className="cart-item-qty text-xs text-muted">Qty: {item.quantity}</span>
                      <div className="qty-stepper">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.id, -1)}
                          className="cart-icon-btn"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.id, 1)}
                          className="cart-icon-btn"
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        type="button"
                        className="cart-icon-btn cart-icon-btn-remove"
                        aria-label="Remove item"
                        onClick={() => removeCartItem(item.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="cart-summary-column">
          <Card padding="md" className="summary-card">
            <h2 className="summary-title text-base">Order Summary</h2>

            <div className="summary-rows">
              <div className="summary-row">
                <span className="summary-label">Subtotal:</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              <div className="summary-row summary-row-savings">
                <span>Bargaining Savings:</span>
                <span>-{formatINR(totalSavings)}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Store Pickup (Indore):</span>
                <span className="summary-free">FREE</span>
              </div>

              <div className="summary-divider" />

              <div className="summary-row summary-row-total">
                <span>Customer Payable:</span>
                <span>{formatINR(subtotal)}</span>
              </div>
            </div>

            <div className="revenue-transparency-box">
              <ShieldCheck size={18} className="revenue-transparency-icon" />
              <div className="revenue-transparency-text">
                <strong>Neighborhood Guarantee:</strong> Zero convenience surcharges or platform
                fees for buyers. Inspect and verify items directly at the store or upon delivery.
              </div>
            </div>

            <p className="cart-summary-footnote text-xs text-muted">
              Pay via UPI, Card, or Cash directly at the store upon verification.
            </p>
          </Card>
        </div>

        {/* Delivery / Pickup form — its own grid cell BELOW the item list, in
            the wide left column. Nested in the fixed 360px summary rail it made
            that column ~436px taller than the item list, so the grid row grew to
            the rail's height and the whole area under the items stayed blank. */}
        <div className="cart-checkout-column">
          <CheckoutForm
            cartItems={cartItems}
            subtotal={subtotal}
            onCompleted={setCompletedOrder}
          />
        </div>
      </div>
    </div>
  );
};

const CheckoutForm = ({ cartItems, subtotal, onCompleted }) => {
  const { placeOrder, currentUser } = useAuth();
  // Defaults only where they cannot be wrong (the signed-in buyer's own name,
  // the marketplace's Indore pickup city/state). Address, PIN and phone start
  // empty: pre-filled fake delivery details would be stored on the customer's
  // behalf if they never noticed them.
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    address: '',
    city: 'Indore',
    state: 'Madhya Pradesh',
    pin: '',
    phone: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const storeName = cartItems[0]?.seller || 'your neighborhood store';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Indian mobile: 10 digits starting 6-9, optionally typed with a +91/91
  // prefix or spaces/dashes. Everything else is refused before the order runs.
  const normalizePhone = (raw) => String(raw || '').replace(/[\s-]/g, '').replace(/^\+?91/, '');
  const isValidPhone = (raw) => /^[6-9][0-9]{9}$/.test(normalizePhone(raw));

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name required';
    if (!formData.address.trim()) newErrors.address = 'Address required';
    if (!formData.city.trim()) newErrors.city = 'City required';
    if (!formData.state.trim()) newErrors.state = 'State required';
    if (!/^[0-9]{6}$/.test(formData.pin)) newErrors.pin = 'Enter a valid 6-digit PIN';
    if (!isValidPhone(formData.phone)) newErrors.phone = 'Enter a valid 10-digit mobile number';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setSubmitError('');
    // Record the completed order BEFORE `placeOrder` runs: it ends with
    // `clearCart()`, which unmounts this form, so setting state afterwards
    // would never render and the user would just see an empty bag.
    onCompleted?.({ amount: subtotal, storeName });
    try {
      await placeOrder(cartItems);
    } catch (err) {
      // The backend refused (or the listing is not server-connected). Undo the
      // optimistic confirmation and keep the bag so the real reason is visible.
      onCompleted?.(null);
      setSubmitError(err.message || 'Your order could not be placed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Placeholder-as-label inputs still need an accessible name and a wired-up
  // error message for screen readers and keyboard users.
  const fieldA11y = (name, label) => ({
    'aria-label': label,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `${name}-checkout-error` : undefined
  });

  return (
    <form className="checkout-form surface-card" onSubmit={handleSubmit} noValidate>
      <h3 className="checkout-form-title text-sm">Delivery / Pickup Details</h3>
      <div className="checkout-grid">
        <div className="checkout-field">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            autoComplete="name"
            value={formData.name}
            onChange={handleChange}
            className={`checkout-input ${errors.name ? 'input-error' : ''}`}
            {...fieldA11y('name', 'Full name')}
          />
          {errors.name && <span className="checkout-error-msg" id="name-checkout-error">{errors.name}</span>}
        </div>

        <div className="checkout-field">
          <input
            type="tel"
            name="phone"
            placeholder="Mobile Number (10 digits)"
            autoComplete="tel"
            inputMode="numeric"
            maxLength={14}
            value={formData.phone}
            onChange={handleChange}
            className={`checkout-input ${errors.phone ? 'input-error' : ''}`}
            {...fieldA11y('phone', 'Mobile number')}
          />
          {errors.phone && <span className="checkout-error-msg" id="phone-checkout-error">{errors.phone}</span>}
        </div>

        <div className="checkout-field">
          <input
            type="text"
            name="address"
            placeholder="Street Address / Locality"
            autoComplete="street-address"
            value={formData.address}
            onChange={handleChange}
            className={`checkout-input ${errors.address ? 'input-error' : ''}`}
            {...fieldA11y('address', 'Street address and locality')}
          />
          {errors.address && <span className="checkout-error-msg" id="address-checkout-error">{errors.address}</span>}
        </div>

        <div className="checkout-field-row">
          <div className="checkout-field">
            <input
              type="text"
              name="city"
              placeholder="City"
              autoComplete="address-level2"
              value={formData.city}
              onChange={handleChange}
              className={`checkout-input ${errors.city ? 'input-error' : ''}`}
              {...fieldA11y('city', 'City')}
            />
            {errors.city && <span className="checkout-error-msg" id="city-checkout-error">{errors.city}</span>}
          </div>

          <div className="checkout-field">
            <input
              type="text"
              name="state"
              placeholder="State"
              autoComplete="address-level1"
              value={formData.state}
              onChange={handleChange}
              className={`checkout-input ${errors.state ? 'input-error' : ''}`}
              {...fieldA11y('state', 'State')}
            />
            {errors.state && <span className="checkout-error-msg" id="state-checkout-error">{errors.state}</span>}
          </div>

          <div className="checkout-field">
            <input
              type="text"
              name="pin"
              placeholder="PIN Code"
              autoComplete="postal-code"
              inputMode="numeric"
              maxLength={6}
              value={formData.pin}
              onChange={handleChange}
              className={`checkout-input ${errors.pin ? 'input-error' : ''}`}
              {...fieldA11y('pin', 'Six-digit PIN code')}
            />
            {errors.pin && <span className="checkout-error-msg" id="pin-checkout-error">{errors.pin}</span>}
          </div>
        </div>
      </div>

      {submitError && (
        <p className="checkout-error-msg" role="alert" style={{ display: 'block', marginTop: '0.75rem' }}>
          {submitError}
        </p>
      )}

      <button
        type="submit"
        className="btn btn-primary btn-lg checkout-submit-btn w-full mt-3"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Submitting Order...
          </span>
        ) : (
          `Complete Checkout • ${formatINR(subtotal)}`
        )}
      </button>
    </form>
  );
};
