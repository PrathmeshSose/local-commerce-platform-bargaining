/* eslint-disable react/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_NEGOTIATIONS } from '../data/mockData';

export const AuthContext = createContext();

const MOCK_CREDENTIALS = {
  customer: {
    email: 'customer@neardeal.local',
    name: 'Aarav Mehta',
    phone: '+91 98765 43210',
    city: 'Indore, MP'
  },
  seller: {
    email: 'seller@neardeal.local',
    name: 'Rajesh Sharma',
    storeName: 'Sharma Furniture Gallery',
    sellerId: 'seller_2', // matches MOCK_SELLERS.seller_2 (Sharma Furniture Gallery)
    phone: '+91 98930 56789',
    city: 'Indore, MP'
  },
  admin: {
    email: 'admin@neardeal.local',
    name: 'Platform Moderator',
    storeName: 'NearDeal Operations',
    phone: '+91 98260 00001',
    city: 'Indore HQ'
  }
};

/**
 * Builds order records from cart items using the EFFECTIVE purchase price
 * (negotiated price when the item was won through bargaining, listed price
 * otherwise). The customer's totalAmount NEVER includes the seller-side 2%
 * platform commission — that is recorded separately as informational data.
 *
 * Every order keeps enough seller identity (sellerId + sellerName) and
 * product identity (productId) for the Seller Portal to find its own orders,
 * plus the offer/negotiation reference when the price was agreed through
 * Smart Bargaining. No demo/mock orders are produced here — only real
 * checkout records.
 */
export const buildOrdersFromCart = (cartItems = [], customer = {}) => {
  const stamp = Date.now().toString(36);
  const customerName = customer.name || 'Customer';
  const customerAddress = [customer.address, customer.city, customer.state, customer.pin]
    .filter(Boolean)
    .join(', ');

  return cartItems.map((item, index) => {
    const unitPrice = Number(item.price); // effective purchase price
    const quantity = Number(item.quantity);
    const totalAmount = unitPrice * quantity; // customer payable
    const negotiated = !!item.isNegotiated;
    const sellerName = item.seller || 'Local Merchant';
    const sellerId = item.sellerId || null;
    const productId = item.productId || null;
    const offerId = item.offerId || null;
    const offerStatus = item.offerStatus || null;

    return {
      id: `ord_${stamp}_${index + 1}`,
      date: new Date().toISOString().slice(0, 10),
      status: 'Ready for Pickup',
      paymentStatus: 'Pay on Pickup (Cash / UPI)',
      fulfillmentType: `Store Pickup (${Number(item.distanceKm || 1.0).toFixed(1)} km)`,
      productName: item.title,
      productImage: item.image || '',
      quantity,
      unitPrice,
      // Seller identity — the Seller Portal filters exclusively on this
      sellerId,
      sellerName,
      productId,
      // Buyer identity shown on the seller's order card
      customerName,
      customerAddress,
      totalAmount,
      // Seller-side only — displayed as info, never added to totalAmount
      platformCommission: Math.round(totalAmount * 2) / 100,
      negotiated,
      originalPrice: item.originalPrice || null,
      // Effective/lock-in price when the item was bought through bargaining
      negotiatedPrice: negotiated ? unitPrice : null,
      offerId,
      offerStatus,
      items: [
        {
          productId,
          sellerId,
          sellerName,
          title: item.title,
          quantity,
          unitPrice,
          negotiated,
          originalPrice: item.originalPrice || null,
          negotiatedPrice: negotiated ? unitPrice : null,
          offerId,
          offerStatus,
          image: item.image || ''
        }
      ]
    };
  });
};

/**
 * Repairs the order list read back from localStorage.
 *
 * Older builds let a customer check out on a price that had NOT been agreed
 * yet (a pending offer or an unanswered seller counter), which persisted
 * orders carrying offerStatus 'pending_seller' / 'countered'. The current
 * flow can only ever write 'accepted' (or null for a normal purchase), so
 * anything else is a leftover bargain-priced "order" and is dropped here —
 * otherwise the Seller Portal keeps showing a completed order for a query
 * that was never agreed. Normal orders and legitimate accepted-deal orders
 * are kept untouched.
 */
export const sanitizeStoredOrders = (orders = []) =>
  Array.isArray(orders)
    ? orders.filter((order) => !order?.offerStatus || order.offerStatus === 'accepted')
    : [];

/**
 * Returns only the negotiations addressed to THIS seller (their incoming queue).
 * Matching is by sellerId first; when an ID is missing on either side (legacy
 * records or registered sellers without a sellerId) it falls back to comparing
 * sellerName against the seller's storeName. A negotiation with no usable
 * seller identity is never shown, and a seller with no identity sees an
 * empty queue — nothing is exposed to every seller by default.
 */
export const filterNegotiationsForSeller = (negotiations = [], seller = null) => {
  const sellerId = seller?.sellerId;
  const storeName = (seller?.storeName || '').trim().toLowerCase();
  if (!sellerId && !storeName) return []; // no usable seller identity → show nothing
  return negotiations.filter((neg) => {
    const negSellerId = neg.sellerId;
    const negStoreName = (neg.sellerName || '').trim().toLowerCase();
    // IDs on both sides are authoritative: different IDs = different sellers
    if (negSellerId && sellerId) return negSellerId === sellerId;
    // Fallback when an ID is missing on one side: compare store names
    if (negStoreName && storeName) return negStoreName === storeName;
    return false; // record has no usable seller identity → never show it
  });
};

/**
 * Returns only the ORDERS addressed to THIS seller (created at customer
 * checkout). Matching mirrors filterNegotiationsForSeller: the order's
 * sellerId is authoritative when both sides carry an ID; the store name is a
 * fallback for older orders saved before sellerId was recorded. Customer
 * identity and product category are NEVER used as a substitute, so Seller A
 * and Seller B can never see each other's orders. Orders without any usable
 * seller identity are hidden from everyone.
 */
export const filterOrdersForSeller = (orders = [], seller = null) => {
  const sellerId = seller?.sellerId;
  const storeName = (seller?.storeName || '').trim().toLowerCase();
  if (!sellerId && !storeName) return []; // no usable seller identity → show nothing
  return orders.filter((order) => {
    const orderSellerId = order.sellerId;
    const orderStoreName = (order.sellerName || '').trim().toLowerCase();
    // IDs on both sides are authoritative: different IDs = different sellers
    if (orderSellerId && sellerId) return orderSellerId === sellerId;
    // Fallback when an ID is missing on one side: compare store names
    if (orderStoreName && storeName) return orderStoreName === storeName;
    return false; // order has no usable seller identity → never show it
  });
};

// ---------------------------------------------------------------------------
// NEGOTIATION / QUERY STATE MODEL — concept A (still negotiating) and concept B
// (accepted deal), kept strictly separate from concept C (ORDERS above).
//
//   pending_seller    → customer offer waiting for the seller   ("Pending")
//   pending_customer  → seller countered, waiting for the customer
//                       ("Waiting for Customer": Accept / Counter / Decline)
//   accepted          → both sides agreed on a price (the deal). ONLY in this
//                       state may the customer buy at that price.
//   declined          → declined by the seller or rejected by the customer
//   closed            → terminal without a deal
//
// Legacy values written by earlier builds are still accepted when READING
// persisted records: 'pending', 'countered', 'countered_to_customer',
// 'rejected'. New records always write the canonical names above.
//
// A negotiation NEVER creates an order. Orders exist only after checkout
// calls placeOrder().
// ---------------------------------------------------------------------------
export const NEGOTIATION_STATUS = {
  PENDING_SELLER: 'pending_seller',
  PENDING_CUSTOMER: 'pending_customer',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  CLOSED: 'closed',
  // Legacy values kept only so older localStorage records stay readable
  COUNTERED_TO_CUSTOMER: 'countered_to_customer',
  COUNTERED: 'countered'
};

/** Still waiting for the seller to Accept / Decline / Counter. */
export const isAwaitingSeller = (status) => status === 'pending_seller' || status === 'pending';

/** Seller countered — now waiting for the customer to Accept / Counter / Decline. */
export const isAwaitingCustomer = (status) =>
  status === 'pending_customer' ||
  status === 'countered_to_customer' ||
  status === 'countered';

/** Both sides agreed — the ONLY state where the negotiated price is usable. */
export const isDealAccepted = (status) => status === 'accepted';

/** Terminal without a new deal (declined/rejected/closed). */
export const isNegotiationClosed = (status) =>
  status === 'declined' || status === 'rejected' || status === 'closed';

/** Still open — either side may still act. */
export const isNegotiationOpen = (status) => isAwaitingSeller(status) || isAwaitingCustomer(status);

/** Agreed price — returns null unless the negotiation is accepted (concept B). */
export const getAgreedPrice = (neg) => {
  if (!neg || !isDealAccepted(neg.status)) return null;
  const price = Number(neg.agreedPrice ?? neg.offeredPrice);
  return Number.isFinite(price) ? price : null;
};

/** The seller's latest counter price, if any (works for legacy records too). */
export const getCounterPrice = (neg) => {
  if (!neg) return null;
  if (neg.counterPrice !== null && neg.counterPrice !== undefined && neg.counterPrice !== '') {
    const price = Number(neg.counterPrice);
    if (Number.isFinite(price)) return price;
  }
  if (isAwaitingCustomer(neg.status)) {
    const sellerEntry = [...(neg.history || [])].reverse().find((h) => h.sender === 'seller');
    const price = Number(sellerEntry?.amount);
    if (Number.isFinite(price)) return price;
  }
  return null;
};

/** Price currently on the table: agreed → seller counter → customer offer. */
export const getStandingPrice = (neg) => {
  if (!neg) return null;
  const agreed = getAgreedPrice(neg);
  if (agreed !== null) return agreed;
  const counter = getCounterPrice(neg);
  if (counter !== null) return counter;
  const offered = Number(neg.offeredPrice);
  return Number.isFinite(offered) ? offered : null;
};

const normalizeKey = (value) => String(value || '').trim().toLowerCase();
const buyerNameKey = (value) =>
  normalizeKey(String(value || '').replace(/\s*\(customer\)\s*$/i, ''));

/** Same buyer? Email first, then the buyer display name (role suffix ignored). */
export const isSameBuyer = (neg = {}, buyer = {}) => {
  const negEmail = normalizeKey(neg.buyerEmail);
  const buyerEmail = normalizeKey(buyer.email);
  if (negEmail && buyerEmail) return negEmail === buyerEmail;
  const negName = buyerNameKey(neg.buyerName);
  const name = buyerNameKey(buyer.name);
  if (negName && name) return negName === name;
  return false;
};

/** Offers made while logged out only identify this browser session. */
export const isSessionGuestOffer = (neg) => !!neg.sessionOffer && !neg.buyerEmail;

const isSameBuyerOrSession = (neg, buyer = {}) =>
  isSameBuyer(neg, buyer) || (isSessionGuestOffer(neg) && !normalizeKey(buyer.email));

/**
 * Returns only THIS customer's negotiations (never another buyer's offers).
 * Guest offers submitted in this browser session stay visible so the flow
 * survives logging in afterwards.
 */
export const filterNegotiationsForCustomer = (negotiations = [], user = null) => {
  if (!user) return negotiations.filter((neg) => isSessionGuestOffer(neg));
  return negotiations.filter((neg) => isSessionGuestOffer(neg) || isSameBuyer(neg, user));
};

// --- Pure negotiation reducers (one per allowed state transition) ----------
const commissionFor = (amount) => (Number(amount) * 0.02).toFixed(2);
const nowISO = () => new Date().toISOString();
const pushHistory = (neg, entry) => [...(neg.history || []), entry];

/** Seller ACCEPT → deal accepted at the customer's offered price. */
export const applySellerAccept = (neg) => {
  const price = Number(neg.offeredPrice);
  return {
    ...neg,
    status: NEGOTIATION_STATUS.ACCEPTED,
    agreedPrice: price,
    sellerCommissionAmount: commissionFor(price),
    updatedAt: nowISO(),
    history: pushHistory(neg, {
      sender: 'seller',
      amount: price,
      note: 'Deal accepted at the offered price',
      time: 'Just now'
    })
  };
};

/** Seller DECLINE → negotiation closed without a deal. No order is created. */
export const applySellerDecline = (neg) => ({
  ...neg,
  status: NEGOTIATION_STATUS.DECLINED,
  updatedAt: nowISO()
});

/** Seller COUNTER → status becomes pending_customer; the customer offer is kept. */
export const applySellerCounter = (neg, amount) => {
  const price = Number(amount);
  if (!Number.isFinite(price) || price <= 0) return neg; // ignore invalid counters
  return {
    ...neg,
    status: NEGOTIATION_STATUS.PENDING_CUSTOMER,
    counterPrice: price,
    sellerCommissionAmount: commissionFor(price),
    updatedAt: nowISO(),
    history: pushHistory(neg, {
      sender: 'seller',
      amount: price,
      note: 'Seller counter-offer',
      time: 'Just now'
    })
  };
};

/** Customer ACCEPTS the seller's counter → deal accepted at the counter price. */
export const applyCustomerAccept = (neg) => {
  const price = Number(getCounterPrice(neg) ?? neg.offeredPrice);
  return {
    ...neg,
    status: NEGOTIATION_STATUS.ACCEPTED,
    agreedPrice: price,
    sellerCommissionAmount: commissionFor(price),
    updatedAt: nowISO(),
    history: pushHistory(neg, {
      sender: 'customer',
      amount: price,
      note: 'Counter offer accepted',
      time: 'Just now'
    })
  };
};

/** Customer REJECTS the seller's counter → negotiation closed, no deal. */
export const applyCustomerReject = (neg) => {
  const price = Number(getCounterPrice(neg) ?? neg.offeredPrice);
  return {
    ...neg,
    status: NEGOTIATION_STATUS.DECLINED,
    updatedAt: nowISO(),
    history: pushHistory(neg, {
      sender: 'customer',
      amount: price,
      note: 'Counter offer rejected',
      time: 'Just now'
    })
  };
};

/** Customer sends a new price (first offer or counter-again) on a live thread. */
export const applyCustomerOffer = (neg, amount, note = '') => {
  const price = Number(amount);
  if (!Number.isFinite(price) || price <= 0) return neg; // ignore invalid offers
  return {
    ...neg,
    status: NEGOTIATION_STATUS.PENDING_SELLER,
    offeredPrice: price,
    counterPrice: null, // the seller's counter has been answered — ball is with the seller
    agreedPrice: null, // an accepted deal reopened for bargaining is no longer agreed
    sessionOffer: true,
    sellerCommissionAmount: commissionFor(price),
    updatedAt: nowISO(),
    history: pushHistory(neg, {
      sender: 'customer',
      amount: price,
      note: note || 'Proposed price offer',
      time: 'Just now'
    })
  };
};

/** Builds a brand-new PENDING query for a product. Never touches orders. */
export const buildNegotiationRecord = ({ product, amount, note = '', buyer = {} }) => {
  const price = Number(amount);
  const buyerName = buyer.name ? `${buyer.name} (Customer)` : 'Customer';
  return {
    // Identity — negotiation id + who it belongs to (seller + buyer)
    id: `neg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    productId: product.id,
    productTitle: product.title,
    productImage: product.images?.[0] || '',
    sellerId: product.sellerId,
    sellerName: product.sellerName,
    buyerName,
    buyerEmail: buyer.email || '',
    buyerPhone: buyer.phone || '',
    // Bargain details
    originalPrice: Number(product.price),
    offeredPrice: price,
    quantity: 1,
    counterPrice: null,
    agreedPrice: null,
    status: NEGOTIATION_STATUS.PENDING_SELLER,
    // Offer submitted in this session (guest offers have no buyer email)
    sessionOffer: true,
    // Timestamps
    createdAt: nowISO(),
    updatedAt: nowISO(),
    expiresInHours: 24,
    sellerCommissionAmount: commissionFor(price),
    convertedToOrderId: null,
    history: [
      { sender: 'customer', amount: price, note: note || 'Proposed price offer', time: 'Just now' }
    ]
  };
};

/** Pure: applies a negotiation reducer to the record with this id (no-op if absent). */
export const reduceNegotiation = (negotiations = [], id, reducer) =>
  negotiations.map((neg) => (neg.id === id ? reducer(neg) : neg));

/**
 * Pure: the negotiation list after a customer submits `amount` for `product`.
 * There is ONE live thread per product/seller/buyer: "counter again" updates
 * it instead of duplicating it, and so does a fresh offer made before checkout
 * on an already-accepted deal (the deal is reopened, status goes back to
 * pending_seller). Only a deal that was already converted into an order — or a
 * declined/closed thread — starts a new record. Orders are never touched.
 */
export const withCustomerOffer = (negotiations = [], product, amount, note = '', buyer = {}) => {
  const price = Number(amount);
  if (!product || !Number.isFinite(price) || price <= 0) {
    return { negotiations, record: null }; // invalid offer → state untouched
  }
  const thread = negotiations.find(
    (neg) =>
      neg.productId === product.id &&
      (neg.sellerId || '') === (product.sellerId || '') &&
      isSameBuyerOrSession(neg, buyer) &&
      (isNegotiationOpen(neg.status) ||
        (isDealAccepted(neg.status) && !neg.convertedToOrderId))
  );
  const record = thread
    ? applyCustomerOffer(thread, price, note)
    : buildNegotiationRecord({ product, amount: price, note, buyer });
  return {
    record,
    negotiations: thread
      ? negotiations.map((neg) => (neg.id === thread.id ? record : neg))
      : [record, ...negotiations]
  };
};

/**
 * Builds the cart item record for `addToCart`. Keeps the product's seller
 * identity (sellerId + name), the effective price (negotiated when the buyer
 * won it through bargaining) and the offer reference so the seller can be
 * identified from the order created at checkout. Exported for verification.
 */
export const createCartItem = (product, quantity = 1, customPrice = null, offer = null) => {
  const effectivePrice = customPrice !== null ? Number(customPrice) : Number(product.price);
  const isNegotiated = customPrice !== null && Number(customPrice) < Number(product.price);
  return {
    id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    productId: product.id,
    title: product.title,
    seller: product.sellerName || 'Local Merchant',
    // Seller identity carried into the order record at checkout
    sellerId: product.sellerId || null,
    distanceKm: product.distanceKm || 1.0,
    price: effectivePrice,
    // Negotiated items strike through the listed price; regular items keep the MRP
    originalPrice: isNegotiated ? product.price : (product.originalPrice || null),
    quantity: Math.max(1, quantity),
    isNegotiated: isNegotiated,
    offerId: offer?.id || null,
    offerStatus: offer?.status || null,
    image: product.images?.[0] || 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=200&auto=format&fit=crop&q=80'
  };
};

export const AuthProvider = ({ children }) => {
  // Check if session is stored
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('neardeal_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [userLocation, setUserLocation] = useState('Vijay Nagar, Indore');
  const [maxRadiusKm, setMaxRadiusKm] = useState(5);

  // Cart state initialized empty so demo products don't appear automatically
  const [cartItems, setCartItems] = useState([]);

  // Negotiations (queries) — concept A. Seeded with demo threads, persisted
  // like orders so a seller action survives a refresh within the session.
  const [negotiations, setNegotiations] = useState(() => {
    try {
      const saved = localStorage.getItem('neardeal_negotiations');
      return saved ? JSON.parse(saved) : MOCK_NEGOTIATIONS;
    } catch {
      return MOCK_NEGOTIATIONS;
    }
  });

  // Shared orders state — created at checkout, seeded empty (no demo orders).
  // Persisted like the auth session so orders survive refresh/navigation.
  // Legacy bargain-priced orders from older builds are repaired on read.
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('neardeal_orders');
      return sanitizeStoredOrders(saved ? JSON.parse(saved) : []);
    } catch {
      return [];
    }
  });

  const currentRole = currentUser?.role || null;
  const isAuthenticated = !!currentUser?.isAuthenticated;

  // Persist session
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('neardeal_auth_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('neardeal_auth_user');
    }
  }, [currentUser]);

  // Persist created orders during the current frontend session
  useEffect(() => {
    try {
      localStorage.setItem('neardeal_orders', JSON.stringify(orders));
    } catch {
      /* storage unavailable — keep in-memory state */
    }
  }, [orders]);

  // Persist negotiations (queries) — independent from orders state
  useEffect(() => {
    try {
      localStorage.setItem('neardeal_negotiations', JSON.stringify(negotiations));
    } catch {
      /* storage unavailable — keep in-memory state */
    }
  }, [negotiations]);

  // Cart actions
  // `offer` is the negotiation record backing a negotiated price so the
  // seller can later see WHICH offer produced the order's final price.
  const addToCart = (product, quantity = 1, customPrice = null, offer = null) => {
    const newItem = createCartItem(product, quantity, customPrice, offer);
    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.productId === product.id);
      if (existingIndex > -1) {
        return prev.map((item, idx) =>
          idx === existingIndex
            ? {
                ...item,
                quantity: item.quantity + newItem.quantity,
                price: newItem.price,
                isNegotiated: newItem.isNegotiated || item.isNegotiated,
                // Negotiated items strike through the listed price (not the MRP)
                originalPrice: newItem.isNegotiated ? newItem.originalPrice : item.originalPrice,
                sellerId: newItem.sellerId || item.sellerId || null,
                offerId: newItem.offerId || item.offerId || null,
                offerStatus: newItem.offerStatus || item.offerStatus || null
              }
            : item
        );
      }
      return [...prev, newItem];
    });
  };

  const updateCartQuantity = (id, delta) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const removeCartItem = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Checkout action — stores completed orders in the shared order state.
  // Every created order carries sellerId/sellerName so the Seller Portal can
  // pick up its own orders immediately (same session, same context state),
  // and localStorage is synced by the orders persistence effect above.
  const placeOrder = (items = [], customer = {}) => {
    if (!items.length) return [];
    const buyer = {
      ...customer,
      name: customer.name || currentUser?.name || 'Customer'
    };
    const newOrders = buildOrdersFromCart(items, buyer);
    setOrders((prev) => [...newOrders, ...prev]);

    // Concept C consumes concept B: link accepted deals to the orders created
    // from them (status stays 'accepted'; only the order reference is added).
    const orderByOffer = newOrders.reduce((acc, order) => {
      if (order.offerId) acc[order.offerId] = order.id;
      return acc;
    }, {});
    if (Object.keys(orderByOffer).length) {
      setNegotiations((prev) =>
        prev.map((neg) =>
          orderByOffer[neg.id] ? { ...neg, convertedToOrderId: orderByOffer[neg.id] } : neg
        )
      );
    }
    return newOrders;
  };

  // --- Negotiation actions (concepts A & B). NONE of these touch `orders`. --
  const updateNegotiation = (id, reducer) =>
    setNegotiations((prev) => reduceNegotiation(prev, id, reducer));

  /**
   * CUSTOMER submits an offer (first offer or counter-again).
   * Creates a PENDING query — or updates the single open thread for this
   * product/seller/buyer — and NEVER creates an order.
   */
  const submitCustomerOffer = (product, offeredPrice, note = '') => {
    const amount = Number(offeredPrice);
    if (!product || !Number.isFinite(amount) || amount <= 0) return null;
    const buyer = {
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      phone: currentUser?.phone || ''
    };
    const next = withCustomerOffer(negotiations, product, amount, note, buyer);
    setNegotiations(next.negotiations);
    return next.record;
  };

  // SELLER actions on a pending query
  const acceptNegotiation = (id) => updateNegotiation(id, applySellerAccept);
  const declineNegotiation = (id) => updateNegotiation(id, applySellerDecline);
  const counterNegotiation = (id, counterAmount) => {
    const amount = Number(counterAmount);
    if (!amount || amount <= 0) return; // existing validation preserved
    updateNegotiation(id, (neg) => applySellerCounter(neg, amount));
  };

  // CUSTOMER actions on the seller's counter offer
  const acceptCounterOffer = (id) => updateNegotiation(id, applyCustomerAccept);
  const rejectCounterOffer = (id) => updateNegotiation(id, applyCustomerReject);

  const switchRole = (role) => {
    const cred = MOCK_CREDENTIALS[role] || MOCK_CREDENTIALS.customer;
    setCurrentUser({
      role,
      isAuthenticated: true,
      ...cred
    });
  };

  const login = (role, email, extra = {}) => {
    const cred = MOCK_CREDENTIALS[role] || {
      name: email.split('@')[0],
      email: email,
      phone: '+91 98765 00000',
      city: 'Indore, MP'
    };
    const user = {
      role,
      isAuthenticated: true,
      ...cred,
      ...extra,
      email: email || cred.email
    };
    setCurrentUser(user);
    return user;
  };

  const register = (role, data = {}) => {
    const user = {
      role,
      isAuthenticated: true,
      name: data.name || (role === 'seller' ? 'New Merchant' : 'New Customer'),
      email: data.email || `${role}@neardeal.local`,
      phone: data.phone || '+91 98765 43210',
      city: 'Indore, MP',
      storeName: role === 'seller' ? (data.storeName || data.name || 'Local Store') : undefined,
      ...data
    };
    setCurrentUser(user);
    return user;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('neardeal_auth_user');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        isAuthenticated,
        switchRole,
        login,
        register,
        logout,
        userLocation,
        setUserLocation,
        maxRadiusKm,
        setMaxRadiusKm,
        userProfile: currentUser || { name: 'Guest', email: '' },
        cartItems,
        addToCart,
        updateCartQuantity,
        removeCartItem,
        clearCart,
        negotiations,
        submitCustomerOffer,
        acceptNegotiation,
        declineNegotiation,
        counterNegotiation,
        acceptCounterOffer,
        rejectCounterOffer,
        orders,
        placeOrder
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

