/* eslint-disable react/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { api } from '../services/api';
import { formatDateIN } from '../utils/formatters';
import { categoryPlaceholder } from '../utils/placeholders';

export const AuthContext = createContext();

// City coordinates mapping for location selection
export const CITY_COORDINATES = {
  'Vijay Nagar, Indore': { lat: 22.7533, lng: 75.8937 },
  'Palasia, Indore': { lat: 22.7196, lng: 75.8577 },
  'Rajwada, Indore': { lat: 22.7180, lng: 75.8540 },
  'Bhawarkua, Indore': { lat: 22.6926, lng: 75.8676 },
  'Indore Central, MP': { lat: 22.7196, lng: 75.8577 }
};

// The discovery radius values the two controls (navbar dropdown + listing
// slider) can pick from. One shared list so the two can never disagree about
// the active value — previously the slider allowed 1–20 while the dropdown
// only offered 2/5/10/20, so a slider value of 1 made the dropdown display
// "2 km" while the sidebar showed "1.0 km max".
export const RADIUS_OPTIONS = [2, 5, 10, 20];
export const DEFAULT_RADIUS_KM = 10;

// The marketplace serves a single metro area (Indore). The home-city centre
// is the default discovery point and the fallback used whenever the shopper's
// own position is unavailable or outside the service area, so the catalog
// always has a valid in-area centre to search from instead of an empty grid.
export const HOME_CITY = 'Vijay Nagar, Indore';
export const HOME_COORDS = CITY_COORDINATES[HOME_CITY];
// Must stay in sync with MAX_RADIUS_KM in backend/controllers/productController.js.
export const SERVICE_AREA_RADIUS_KM = 50;

const toRadians = (degrees) => (degrees * Math.PI) / 180;

/** Great-circle distance in km between two {lat, lng} points (WGS-84 mean radius). */
export const distanceKmBetween = (from, to) => {
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6378.1 * Math.asin(Math.min(1, Math.sqrt(a)));
};

export const NEGOTIATION_STATUS = {
  PENDING_SELLER: 'pending_seller',
  PENDING_CUSTOMER: 'pending_customer',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  CLOSED: 'closed',
  COUNTERED_TO_CUSTOMER: 'countered_to_customer',
  COUNTERED: 'countered'
};

export const isAwaitingSeller = (status) =>
  status === 'pending_seller' || status === 'pending' || status === 'PENDING';

export const isAwaitingCustomer = (status) =>
  status === 'pending_customer' ||
  status === 'countered_to_customer' ||
  status === 'countered' ||
  status === 'COUNTERED';

export const isDealAccepted = (status) =>
  status === 'accepted' || status === 'ACCEPTED';

export const isNegotiationClosed = (status) =>
  status === 'declined' || status === 'rejected' || status === 'closed' || status === 'REJECTED' || status === 'EXPIRED';

export const isNegotiationOpen = (status) => isAwaitingSeller(status) || isAwaitingCustomer(status);

export const getAgreedPrice = (neg) => {
  if (!neg || !isDealAccepted(neg.status)) return null;
  const price = Number(neg.agreedPrice ?? neg.currentOfferPrice ?? neg.offeredPrice);
  return Number.isFinite(price) ? price : null;
};

export const getCounterPrice = (neg) => {
  if (!neg) return null;
  if (neg.counterPrice !== null && neg.counterPrice !== undefined && neg.counterPrice !== '') {
    const price = Number(neg.counterPrice);
    if (Number.isFinite(price)) return price;
  }
  if (isAwaitingCustomer(neg.status)) {
    const price = Number(neg.currentOfferPrice);
    if (Number.isFinite(price)) return price;
    const sellerEntry = [...(neg.history || [])].reverse().find((h) => h.sender === 'seller' || h.actionBy === 'SELLER');
    const entryPrice = Number(sellerEntry?.amount ?? sellerEntry?.offerPrice);
    if (Number.isFinite(entryPrice)) return entryPrice;
  }
  return null;
};

export const getStandingPrice = (neg) => {
  if (!neg) return null;
  const agreed = getAgreedPrice(neg);
  if (agreed !== null) return agreed;
  const counter = getCounterPrice(neg);
  if (counter !== null) return counter;
  const offered = Number(neg.currentOfferPrice ?? neg.offeredPrice);
  return Number.isFinite(offered) ? offered : null;
};

/**
 * The Negotiation schema stores only { offerPrice, actionBy, status, timestamp }
 * per history entry, so the sentence the bubbles print is composed from those
 * real fields. Nothing here is invented — it describes what actually happened.
 */
const historyEntryNote = (sender, status) => {
  if (status === 'ACCEPTED') return 'Deal accepted at the offered price';
  if (status === 'REJECTED')
    return sender === 'system'
      ? "Below the seller's minimum price — auto declined"
      : 'Offer declined';
  if (status === 'COUNTERED') return sender === 'seller' ? 'Seller counter-offer' : 'Counter price offer';
  return sender === 'customer' ? 'Proposed price offer' : 'Offer updated';
};

const relativeTimestamp = (value) => {
  const ms = Date.parse(value || '');
  if (!Number.isFinite(ms)) return '';
  const minutes = Math.round((Date.now() - ms) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return formatDateIN(value);
};

/**
 * Maps one populated negotiation document from MongoDB onto the shape the
 * bargaining UI renders. Every field below is derived from the document the
 * backend returned — there is no mock/localStorage fallback anywhere in here.
 *
 * @param {object} doc — raw `Negotiation` document with `product`, `customer`
 *   and `seller` populated (see THREAD_POPULATE in negotiationController).
 */
export const normalizeNegotiation = (doc) => {
  if (!doc || !doc._id) return null;

  const asObject = (value) => (value && typeof value === 'object' ? value : {});
  const product = asObject(doc.product);
  const customer = asObject(doc.customer);
  const seller = asObject(doc.seller);

  const history = (Array.isArray(doc.history) ? doc.history : []).map((entry) => {
    const sender =
      entry.actionBy === 'CUSTOMER' ? 'customer' : entry.actionBy === 'SELLER' ? 'seller' : 'system';
    return {
      sender,
      amount: Number(entry.offerPrice),
      note: historyEntryNote(sender, entry.status),
      time: relativeTimestamp(entry.timestamp)
    };
  });

  const currentOfferPrice = Number(doc.currentOfferPrice);
  const lastActionBy = doc.lastActionBy;

  // Backend enum -> the vocabulary the status helpers above understand.
  // A COUNTERED thread is only "waiting for the customer" when the *seller*
  // produced the counter; if the customer countered, the seller must answer.
  let status;
  if (doc.status === 'ACCEPTED') status = NEGOTIATION_STATUS.ACCEPTED;
  else if (doc.status === 'REJECTED') status = NEGOTIATION_STATUS.DECLINED;
  else if (doc.status === 'EXPIRED') status = NEGOTIATION_STATUS.CLOSED;
  else if (doc.status === 'COUNTERED')
    status =
      lastActionBy === 'CUSTOMER'
        ? NEGOTIATION_STATUS.PENDING_SELLER
        : NEGOTIATION_STATUS.COUNTERED_TO_CUSTOMER;
  else status = NEGOTIATION_STATUS.PENDING_SELLER;

  // The customer's latest proposal: their most recent history entry. This is
  // what "Accept Deal" settles at, so it must track `currentOfferPrice` whenever
  // the customer made the last move.
  const lastCustomerEntry = [...history].reverse().find((entry) => entry.sender === 'customer');
  const createdMs = Date.parse(doc.createdAt || '');
  const reviewWindowMs = 24 * 60 * 60 * 1000;

  return {
    id: doc._id,
    _id: doc._id,
    productId: product._id || doc.product || null,
    productTitle: product.name || '',
    productImage: (Array.isArray(product.images) && product.images[0]) || '',
    sellerId: seller._id || doc.seller || null,
    sellerName: seller.businessName || seller.name || 'Local Merchant',
    buyerName: customer.name ? `${customer.name} (Customer)` : 'Customer',
    buyerEmail: customer.email || '',
    originalPrice: Number(product.price) || 0,
    offeredPrice: Number.isFinite(lastCustomerEntry?.amount) ? lastCustomerEntry.amount : currentOfferPrice,
    currentOfferPrice,
    counterPrice:
      doc.status === 'COUNTERED' && lastActionBy !== 'CUSTOMER' ? currentOfferPrice : null,
    agreedPrice: doc.status === 'ACCEPTED' ? currentOfferPrice : null,
    status,
    history,
    createdAt: doc.createdAt || '',
    updatedAt: doc.updatedAt || '',
    expiresInHours: Number.isFinite(createdMs)
      ? Math.max(0, Math.round((createdMs + reviewWindowMs - Date.now()) / 3600000))
      : 0,
    // Set by the backend the moment this bargain becomes an order, so the
    // "already purchased" state survives a refresh, a logout and a different
    // browser — it is no longer a session-local variable.
    convertedToOrderId: doc.convertedToOrder ? String(doc.convertedToOrder) : null
  };
};

export const filterNegotiationsForSeller = (negotiations = [], seller = null) => {
  const sellerId = seller?.sellerId || seller?._id;
  const storeName = (seller?.storeName || seller?.businessName || '').trim().toLowerCase();
  if (!sellerId && !storeName) return [];
  return negotiations.filter((neg) => {
    const negSellerId = String(neg.sellerId || neg.seller || '');
    const negStoreName = (neg.sellerName || '').trim().toLowerCase();
    if (negSellerId && sellerId) return negSellerId === String(sellerId);
    if (negStoreName && storeName) return negStoreName === storeName;
    return false;
  });
};

export const filterOrdersForSeller = (orders = [], seller = null) => {
  const sellerId = seller?.sellerId || seller?._id;
  const storeName = (seller?.storeName || seller?.businessName || '').trim().toLowerCase();
  if (!sellerId && !storeName) return [];
  return orders.filter((order) => {
    const orderSellerId = String(order.sellerId || order.seller || '');
    const orderStoreName = (order.sellerName || '').trim().toLowerCase();
    if (orderSellerId && sellerId) return orderSellerId === String(sellerId);
    if (orderStoreName && storeName) return orderStoreName === storeName;
    return false;
  });
};

const normalizeKey = (value) => String(value || '').trim().toLowerCase();
const buyerNameKey = (value) =>
  normalizeKey(String(value || '').replace(/\s*\(customer\)\s*$/i, ''));

export const isSameBuyer = (neg = {}, buyer = {}) => {
  const negEmail = normalizeKey(neg.buyerEmail || neg.customer?.email);
  const buyerEmail = normalizeKey(buyer.email);
  if (negEmail && buyerEmail) return negEmail === buyerEmail;
  const negId = String(neg.customer?._id || neg.customer || '');
  const buyerId = String(buyer._id || buyer.id || '');
  if (negId && buyerId && negId === buyerId) return true;
  const negName = buyerNameKey(neg.buyerName || neg.customer?.name);
  const name = buyerNameKey(buyer.name);
  if (negName && name) return negName === name;
  return false;
};

export const isSessionGuestOffer = (neg) => !!neg.sessionOffer && !neg.buyerEmail;

export const filterNegotiationsForCustomer = (negotiations = [], user = null) => {
  if (!user) return negotiations.filter((neg) => isSessionGuestOffer(neg));
  return negotiations.filter((neg) => isSessionGuestOffer(neg) || isSameBuyer(neg, user));
};

/**
 * One idempotency key per bag line. The backend keys `orders` on it (unique,
 * sparse), so a double click, a retried fetch or a second tab replaying the
 * same submission resolves to the FIRST order instead of charging twice.
 * Generated when the line enters the bag and unchanged across retries —
 * that is what distinguishes "resend this attempt" from "new purchase".
 */
const newCheckoutKey = () => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch { /* older/unsupported runtime falls back below */ }
  return `nd-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
};

export const createCartItem = (product, quantity = 1, customPrice = null, offer = null) => {
  const effectivePrice = customPrice !== null ? Number(customPrice) : Number(product.price);
  const isNegotiated = customPrice !== null && Number(customPrice) < Number(product.price);
  return {
    id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    checkoutKey: newCheckoutKey(),
    productId: product.id || product._id,
    title: product.title || product.name,
    seller: product.sellerName || product.seller?.businessName || product.seller?.name || 'Local Merchant',
    sellerId: product.sellerId || (typeof product.seller === 'string' ? product.seller : product.seller?._id) || null,
    // Real distance from the listing; `null` when the backend could not
    // resolve one (formatDistance renders that honestly instead of a number).
    distanceKm: product.distanceKm ?? null,
    price: effectivePrice,
    originalPrice: isNegotiated ? product.price : (product.originalPrice || null),
    quantity: Math.max(1, quantity),
    isNegotiated: isNegotiated,
    offerId: offer?.id || offer?._id || null,
    offerStatus: offer?.status || null,
    // Local category placeholder when a row was stored without a photo — a
    // photo of some other product must never represent it in the bag.
    image: product.images?.[0] || categoryPlaceholder(product.category)
  };
};

/**
 * Re-derives every bag row against the negotiation that MongoDB currently
 * holds for that product.
 *
 * The bag is filled from a single click on the product page, but a deal can be
 * struck before or after that click. A row written while the deal was still
 * open keeps the LISTED price and no negotiation id, so it used to render
 * (and then check out) at the full price even though both sides had agreed a
 * lower one. Deriving here means the displayed price, the "Smart Offer Won"
 * badge and the `negotiationId` sent to POST /api/orders/checkout can never
 * disagree with the thread of record.
 */
export const reconcileCartWithNegotiations = (items = [], negotiations = [], user = null) => {
  if (!items.length || !negotiations.length) return items;

  const mine = filterNegotiationsForCustomer(negotiations, user);
  if (!mine.length) return items;

  // One representative thread per product: an accepted deal that has not been
  // converted into an order wins, otherwise the most recently touched thread.
  const byProduct = new Map();
  for (const thread of mine) {
    const key = String(thread.productId || '');
    if (!key) continue;
    const current = byProduct.get(key);
    const usable = (n) => isDealAccepted(n.status) && !n.convertedToOrderId;
    if (!current) {
      byProduct.set(key, thread);
      continue;
    }
    const threadUsable = usable(thread);
    const currentUsable = usable(current);
    const newer =
      String(thread.updatedAt || thread.createdAt || '') >
      String(current.updatedAt || current.createdAt || '');
    if (threadUsable !== currentUsable) {
      if (threadUsable) byProduct.set(key, thread);
    } else if (newer) {
      byProduct.set(key, thread);
    }
  }
  if (!byProduct.size) return items;

  let changed = false;
  const next = items.map((item) => {
    const thread = byProduct.get(String(item.productId || ''));
    if (!thread) return item;

    const listed = Number(item.isNegotiated ? (item.originalPrice ?? item.price) : item.price);
    const agreed =
      isDealAccepted(thread.status) && !thread.convertedToOrderId ? getAgreedPrice(thread) : null;

    if (agreed !== null && agreed < listed) {
      if (item.isNegotiated && item.price === agreed && item.offerId === thread.id) return item;
      changed = true;
      return {
        ...item,
        price: agreed,
        isNegotiated: true,
        originalPrice: listed,
        offerId: thread.id,
        offerStatus: thread.status
      };
    }

    // No usable agreed price (still open, declined, or already purchased):
    // the row must fall back to the listed price with no negotiation attached,
    // otherwise checkout would send a negotiation the backend must reject.
    if (item.isNegotiated || item.offerId) {
      changed = true;
      return {
        ...item,
        price: listed,
        isNegotiated: false,
        originalPrice: listed,
        offerId: null,
        offerStatus: null
      };
    }
    return item;
  });

  return changed ? next : items;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('neardeal_auth_user');
      if (!saved) return null;
      // A stored identity is only a session if the JWT that backs it is still
      // there too. The pre-API build wrote `neardeal_auth_user` without ever
      // storing a token; hydrating it produced a "signed in" navbar whose every
      // protected request then went out with no Authorization header.
      if (!localStorage.getItem('neardeal_token')) {
        localStorage.removeItem('neardeal_auth_user');
        return null;
      }
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('neardeal_token') || null);
  
  // Default the discovery centre to the marketplace home city so the very
  // first product fetch already has a valid in-area centre; geolocation only
  // refines it when the detected position is inside the service area.
  const [userLocation, setUserLocation] = useState('Detecting Location...');
  const [userCoordinates, setUserCoordinates] = useState(HOME_COORDS);

  const [maxRadiusKm, setMaxRadiusKm] = useState(DEFAULT_RADIUS_KM);

  // Guard: if maxRadiusKm is ever set to a value not in RADIUS_OPTIONS,
  // reset it to the default. This prevents the slider and dropdown from
  // showing different values and the API from returning 0 products.
  useEffect(() => {
    if (!RADIUS_OPTIONS.includes(maxRadiusKm)) {
      setMaxRadiusKm(DEFAULT_RADIUS_KM);
    }
  }, [maxRadiusKm]);

  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Cart state lives in memory, mirrored to sessionStorage so a page refresh
  // doesn't silently empty the bag. This copy is a convenience only: prices
  // are re-derived from the negotiation of record above, and the backend
  // re-validates price, stock and ownership again at checkout.
  const [cartItems, setCartItems] = useState(() => {
    try {
      const raw = sessionStorage.getItem('neardeal_cart');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('neardeal_cart', JSON.stringify(cartItems));
    } catch {
      /* storage unavailable/full: the bag simply stays in memory */
    }
  }, [cartItems]);

  // Negotiations: loaded from MongoDB through GET /api/negotiations/* and never
  // cached in localStorage, so the customer and the seller always read the same
  // record regardless of which browser or device each of them is on.
  const [negotiations, setNegotiations] = useState([]);
  const [negotiationError, setNegotiationError] = useState(null);

  // Monotonic token so a slow, superseded response can never overwrite a newer one
  const negotiationsRequestRef = useRef(0);

  // The bag as the customer actually sees it: every row reconciled with the
  // negotiation of record, so the price on screen and the `negotiationId`
  // posted to checkout can never disagree.
  const visibleCartItems = useMemo(
    () => reconcileCartWithNegotiations(cartItems, negotiations, currentUser),
    [cartItems, negotiations, currentUser]
  );

  // Orders: MongoDB is the source of truth. The previous mirror wrote every
  // order into localStorage, which made "history" a browser-local artefact that
  // could drift from the database and vanished on a second device.
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);
  const ordersRequestRef = useRef(0);

  const currentRole = currentUser?.role?.toLowerCase() || currentUser?.role || null;
  // Signed in means: an identity AND the JWT the backend issued for it. The
  // old `|| currentUser.isAuthenticated` fallback let a stale localStorage
  // record (written by the pre-API build, which never stored a token) present
  // a logged-in navbar while every protected request went out with no
  // Authorization header and was answered 401 "Not authorized, no token".
  const isAuthenticated = !!currentUser && !!token;

  // Sync token to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('neardeal_token', token);
    } else {
      localStorage.removeItem('neardeal_token');
    }
  }, [token]);

  // Sync session user
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('neardeal_auth_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('neardeal_auth_user');
    }
  }, [currentUser]);

  // The legacy localStorage order mirror is retired. Any key left behind by an
  // older build is dropped so nothing can mistake it for the server history.
  useEffect(() => {
    try {
      localStorage.removeItem('neardeal_orders');
    } catch {
      /* ignore */
    }
  }, []);

  // Negotiations are never mirrored into localStorage — the backend is the only
  // source of truth, so a refresh, logout or account switch cannot change what
  // either side sees.

  /**
   * Drops a session the backend has rejected (missing/expired/revoked token).
   * The bag is deliberately left alone: only the identity dies, so signing back
   * in restores the same shopping bag instead of losing it, while the UI can no
   * longer claim to be signed in.
   */
  const invalidateSession = useCallback((message) => {
    negotiationsRequestRef.current += 1;
    ordersRequestRef.current += 1;
    setNegotiations([]);
    setNegotiationError(null);
    setOrders([]);
    setOrdersError(null);
    setOrdersLoading(false);
    setCurrentUser(null);
    setToken(null);
    setAuthError(
      message || 'Your session has expired or is no longer valid. Please sign in again.'
    );
  }, []);

  // An identity without a JWT cannot be a live backend session (it is either a
  // record left behind by the pre-API build, which never stored a token, or a
  // half-finished logout). Hydration already refuses such a pair, so this only
  // has to catch one that appears later — e.g. `invalidateSession` clearing the
  // token while a user object is still in memory.
  useEffect(() => {
    if (currentUser && !token) {
      try {
        localStorage.removeItem('neardeal_auth_user');
      } catch {
        /* ignore */
      }
      setCurrentUser(null);
    }
  }, [currentUser, token]);

  // Any protected call answered 401 while carrying a token means this session
  // is dead server-side (expired, malformed, or the account was removed). The
  // whole app is told once, so no screen keeps a logged-in state the API has
  // already refused.
  useEffect(() => {
    const onUnauthorized = () => invalidateSession();
    window.addEventListener('neardeal:unauthorized', onUnauthorized);
    return () => window.removeEventListener('neardeal:unauthorized', onUnauthorized);
  }, [invalidateSession]);

  // Validate / refresh user profile from backend on app load if token exists
  useEffect(() => {
    if (token) {
      api.getMe()
        .then((res) => {
          if (res?.data) {
            const user = res.data;
            setCurrentUser((prev) => ({
              ...prev,
              ...user,
              role: user.role?.toLowerCase() || 'customer',
              storeName: user.businessName || prev?.storeName,
              sellerId: user._id || prev?.sellerId,
              isAuthenticated: true
            }));
          }
        })
        .catch((err) => {
          // 401/403 = the stored token is not (or no longer) accepted by the
          // server: drop it instead of leaving a signed-in navbar over a dead
          // session. A network failure keeps the session — offline is not the
          // same as invalid, and wiping the bag over a flaky connection would
          // destroy data the user still owns.
          if (err?.status === 401 || err?.status === 403) {
            invalidateSession(
              'Your saved session is no longer valid. Please sign in again.'
            );
          }
        });
    }
  }, [token, invalidateSession]);

  const requestGeolocation = useCallback(() => {
    setUserLocation('Detecting Location...');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          // Only accept a detected position inside the marketplace's service
          // area. A position outside it would empty the catalog (every listing
          // is in Indore), so the home-city centre is kept instead and the UI
          // says which centre is active.
          if (distanceKmBetween(coords, HOME_COORDS) <= SERVICE_AREA_RADIUS_KM) {
            setUserCoordinates(coords);
            setUserLocation('Current Location');
          } else {
            setUserCoordinates(HOME_COORDS);
            setUserLocation(`${HOME_CITY} (Default)`);
          }
        },
        (error) => {
          console.warn('Geolocation failed or denied:', error.message);
          // Provide manual fallback rather than silently pretending they are in Indore
          setUserCoordinates(HOME_COORDS);
          setUserLocation(`${HOME_CITY} (Default)`);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      setUserCoordinates(HOME_COORDS);
      setUserLocation(`${HOME_CITY} (Default)`);
    }
  }, []);

  // Request location on first mount
  useEffect(() => {
    requestGeolocation();
  }, [requestGeolocation]);

  /**
   * Reads this session's negotiations back from MongoDB.
   *
   * - a CUSTOMER calls GET /api/negotiations/mine   (records where they are `customer`)
   * - a SELLER   calls GET /api/negotiations/seller (records where they are `seller`)
   *
   * Both sides therefore resolve to the same `_id` for one deal, and neither
   * side can see anything the other browser stored.
   */
  const refreshNegotiations = useCallback(async () => {
    const role = currentUser?.role;
    const requestSeq = ++negotiationsRequestRef.current;

    // Signed out (or an admin, who has no bargaining threads): there is nothing
    // to read. `logout()` / a fresh login already empty the store, so no state
    // has to be written from inside the effect below.
    if (!token || (role !== 'customer' && role !== 'seller')) return;

    try {
      const res =
        role === 'seller' ? await api.getSellerNegotiations() : await api.getMyNegotiations();
      if (requestSeq !== negotiationsRequestRef.current) return; // superseded

      const documents = Array.isArray(res?.data) ? res.data : [];
      const normalized = documents.map(normalizeNegotiation).filter(Boolean);

      // The backend stamps `convertedToOrder` on the thread itself, so the
      // "already ordered" state comes from the database rather than from
      // whatever this browser happened to see earlier.
      setNegotiations(normalized);
      setNegotiationError(null);
    } catch (err) {
      if (requestSeq !== negotiationsRequestRef.current) return;
      setNegotiationError(err.message || 'Could not load your bargaining queries from the server.');
    }
  }, [token, currentUser?.role]);

  /**
   * Reads this session's order history back from MongoDB.
   *
   * - a CUSTOMER calls GET /api/orders/mine   (orders where they are buyer)
   * - a SELLER   calls GET /api/orders/seller (orders on their own listings)
   *
   * Returns the fresh list so checkout can immediately link a bargain to the
   * order the server just created.
   */
  const refreshOrders = useCallback(async () => {
    const role = currentUser?.role;
    const requestSeq = ++ordersRequestRef.current;

    // Signed out (or an admin, who does not shop here): nothing to read.
    if (!token || (role !== 'customer' && role !== 'seller')) {
      setOrders([]);
      setOrdersError(null);
      return [];
    }

    setOrdersLoading(true);
    try {
      const res = role === 'seller' ? await api.getSellerOrders() : await api.getMyOrders();
      if (requestSeq !== ordersRequestRef.current) return []; // superseded

      const list = Array.isArray(res?.data) ? res.data : [];
      setOrders(list);
      setOrdersError(null);
      return list;
    } catch (err) {
      if (requestSeq !== ordersRequestRef.current) return [];
      setOrdersError(err.message || 'Could not load your orders from the server.');
      return [];
    } finally {
      if (requestSeq === ordersRequestRef.current) setOrdersLoading(false);
    }
  }, [token, currentUser?.role]);

  // Re-read whenever the signed-in identity changes: login, logout, account
  // switch, or a full page reload. Negotiations and orders are both scoped to
  // that identity, so the two server reads always travel together.
  useEffect(() => {
    refreshNegotiations();
    refreshOrders();
  }, [refreshNegotiations, refreshOrders]);

  // A deal created in another browser only shows up once this one asks again.
  // Re-reading on tab focus keeps an open seller dashboard in sync with what
  // customers are submitting elsewhere.
  useEffect(() => {
    if (!token) return undefined;
    const refetch = () => refreshNegotiations();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refreshNegotiations();
    };
    window.addEventListener('focus', refetch);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', refetch);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [refreshNegotiations, token]);

  // --- Real Backend Login ---
  const login = async (role, email, password = 'password123', extra = {}) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await api.login({ email, password });
      if (res?.status === 'success' && res?.data) {
        const { token: jwtToken, ...userData } = res.data;
        // A "success" body without a JWT is not a session. Treating it as one
        // used to render a signed-in navbar whose every protected request was
        // then sent without an Authorization header.
        if (!jwtToken) {
          throw new Error('The server did not return a session token. Please try again.');
        }
        const normalizedRole = (userData.role || role).toLowerCase();
        const userObj = {
          ...userData,
          role: normalizedRole,
          // The merchant's real store name comes from the account document. A
          // hard coded store name here used to disguise a missing one.
          storeName: userData.businessName || (normalizedRole === 'seller' ? userData.name : undefined),
          sellerId: userData._id,
          isAuthenticated: true,
          ...extra
        };
        // Account switch: drop the previous identity's threads and orders
        // before the new ones are fetched, so nothing leaks between
        // customers/sellers.
        setNegotiations([]);
        setNegotiationError(null);
        ordersRequestRef.current += 1;
        setOrders([]);
        setOrdersError(null);
        // Written synchronously as well: any request fired in this same tick
        // (e.g. the seller profile update below) must already carry the JWT,
        // instead of waiting for the sync effect to flush after re-render.
        localStorage.setItem('neardeal_token', jwtToken);
        setToken(jwtToken);
        setCurrentUser(userObj);
        setAuthLoading(false);
        return userObj;
      } else {
        throw new Error(res?.message || 'Login failed');
      }
    } catch (err) {
      setAuthLoading(false);
      setAuthError(err.message);
      throw err;
    }
  };

  // --- Real Backend Registration ---
  const register = async (role, data = {}) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const backendRole = role.toUpperCase(); // 'CUSTOMER' or 'SELLER'
      const payload = {
        name: data.name,
        email: data.email,
        // No client-side default password: an empty field must reach the
        // server and be rejected, not silently create an account whose
        // password the customer never chose.
        password: data.password,
        role: backendRole,
        businessName: backendRole === 'SELLER' ? (data.storeName || data.name) : undefined
      };

      const res = await api.register(payload);
      if (res?.status === 'success' && res?.data) {
        const { token: jwtToken, ...userData } = res.data;
        if (!jwtToken) {
          throw new Error('The server did not return a session token. Please try again.');
        }
        const normalizedRole = (userData.role || role).toLowerCase();
        // `data` is the raw form payload and still holds the password; it must
        // never be copied into the session object that is written to
        // localStorage. Everything the account really defines comes from the
        // server response.
        const safeFormFields = { ...data };
        delete safeFormFields.password;
        const userObj = {
          ...safeFormFields,
          ...userData,
          role: normalizedRole,
          storeName: userData.businessName || data.storeName || userData.name,
          sellerId: userData._id,
          isAuthenticated: true
        };
        // A brand-new account starts with an empty bargaining history
        setNegotiations([]);
        setNegotiationError(null);
        ordersRequestRef.current += 1;
        setOrders([]);
        setOrdersError(null);
        // Same synchronous write as login: the seller profile update below
        // needs the fresh JWT before React flushes the state effect.
        localStorage.setItem('neardeal_token', jwtToken);
        setToken(jwtToken);
        setCurrentUser(userObj);

        // If seller, update profile location coordinates so the "create product"
        // endpoint (which requires a geo position) can accept their first
        // listing. Awaited: a fire-and-forget call raced the dashboard and left
        // new merchants unable to list ("Seller location not set").
        if (backendRole === 'SELLER') {
          // Use real coordinates if available, fallback to the dropdown selection
          const coords = userCoordinates || CITY_COORDINATES[userLocation] || { lat: 22.7533, lng: 75.8937 };
          try {
            await api.updateProfile({
              lat: coords.lat,
              lng: coords.lng,
              businessName: userObj.storeName
            });
          } catch (profileErr) {
            // The account itself was created; the seller can still sign in and
            // retry from their profile. Never fail registration over this.
            console.warn('Seller location could not be saved:', profileErr.message);
          }
        }

        setAuthLoading(false);
        return userObj;
      } else {
        throw new Error(res?.message || 'Registration failed');
      }
    } catch (err) {
      setAuthLoading(false);
      setAuthError(err.message);
      throw err;
    }
  };

  const logout = () => {
    // Any session-expiry notice belongs to the session that just ended.
    setAuthError(null);
    // Cancel any in-flight read so a late response cannot repopulate the store
    // after this account has signed out.
    negotiationsRequestRef.current += 1;
    setNegotiations([]);
    setNegotiationError(null);
    // Order history is account-scoped too: cancel any in-flight read so a late
    // response cannot repopulate the store after signing out.
    ordersRequestRef.current += 1;
    setOrders([]);
    setOrdersError(null);
    setOrdersLoading(false);
    // The bag is scoped to the signed-in account: leaving it in place would let
    // the next account check out with the previous account's negotiated price
    // and negotiation id.
    setCartItems([]);
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('neardeal_token');
    localStorage.removeItem('neardeal_auth_user');
  };

  // Cart actions
  const addToCart = (product, quantity = 1, customPrice = null, offer = null) => {
    const newItem = createCartItem(product, quantity, customPrice, offer);
    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.productId === (product.id || product._id));
      if (existingIndex === -1) return [...prev, newItem];

      return prev.map((item, idx) => {
        if (idx !== existingIndex) return item;

        // Merging must never drop a settled deal. Checkout re-reads the agreed
        // amount from the negotiation (`negotiationId`), so the row has to keep
        // displaying exactly what `POST /api/orders/checkout` is going to charge.
        const keepExistingDeal = item.isNegotiated && !newItem.isNegotiated;
        const negotiated = item.isNegotiated || newItem.isNegotiated;

        return {
          ...item,
          quantity: item.quantity + newItem.quantity,
          price: keepExistingDeal ? item.price : newItem.price,
          isNegotiated: negotiated,
          originalPrice: negotiated
            ? (item.isNegotiated ? item.originalPrice : newItem.originalPrice)
            : (newItem.originalPrice || item.originalPrice || null),
          sellerId: item.sellerId || newItem.sellerId || null,
          offerId: (keepExistingDeal ? item.offerId : newItem.offerId) || item.offerId || newItem.offerId || null,
          offerStatus:
            (keepExistingDeal ? item.offerStatus : newItem.offerStatus) ||
            item.offerStatus ||
            newItem.offerStatus ||
            null,
          image: item.image || newItem.image
        };
      });
    });
  };

  const updateCartQuantity = (id, delta) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    );
  };

  const removeCartItem = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // --- Real Backend Checkout + Order Management ---
  const placeOrder = async (items = []) => {
    if (!items.length) return [];

    // Checkout writes an order document against the signed-in buyer and the
    // server can only do that with a valid JWT. Fail with a useful message
    // instead of letting each line answer 401 "Not authorized, no token".
    if (!token) {
      throw new Error('Please sign in to complete your order — every order is stored against a customer account.');
    }

    // Phase 1 — every line has to be accepted by the backend before anything is
    // recorded locally. POST /api/orders/checkout is the only thing that can
    // create an order, so a rejected call has to surface: swallowing it used to
    // produce a local "Order Confirmed" the database had never stored.
    const backendOrderIds = [];
    const checkoutFailures = [];

    for (const item of items) {
      const productId = String(item.productId || '');
      if (!/^[0-9a-fA-F]{24}$/.test(productId)) {
        checkoutFailures.push(
          `“${item.title}” is not connected to the server, so no order could be created for it.`
        );
        backendOrderIds.push(null);
        continue;
      }

      const checkoutPayload = {
        productId,
        paymentMethod: 'CASH_ON_DELIVERY',
        // The bag shows a quantity, so the order must record the same one —
        // backend reserves `quantity` units and stores the matching total.
        quantity: Math.max(1, Number(item.quantity) || 1)
      };
      // Stable per-line idempotency key: replaying the same submission (double
      // click, retry after a network error, second tab) returns the first
      // order the server created instead of billing the line again.
      if (/^[A-Za-z0-9_-]{8,64}$/.test(item.checkoutKey || '')) {
        checkoutPayload.requestId = item.checkoutKey;
      }
      const offerId = String(item.offerId || '');
      if (/^[0-9a-fA-F]{24}$/.test(offerId)) {
        checkoutPayload.negotiationId = offerId;
      }

      try {
        const res = await api.checkout(checkoutPayload);
        if (res?.data?._id) {
          backendOrderIds.push(res.data._id);
        } else {
          backendOrderIds.push(null);
          checkoutFailures.push(`The server did not confirm the order for “${item.title}”.`);
        }
      } catch (apiErr) {
        backendOrderIds.push(null);
        checkoutFailures.push(apiErr.message || `The server rejected the order for “${item.title}”.`);
      }
    }

    if (checkoutFailures.length) {
      // Nothing is written and the bag is left untouched, so the customer sees
      // the real reason and can retry instead of believing the order went through.
      throw new Error(checkoutFailures[0]);
    }

    // Phase 2 — the backend confirmed every item, so the history is re-read
    // from MongoDB instead of being reconstructed in the browser. The Orders
    // page then shows exactly the document a refresh (or a second device)
    // will show: server totals, server commission, server status.
    const freshOrders = await refreshOrders();

    const createdIds = new Set(backendOrderIds.filter(Boolean).map(String));
    const createdOrders = freshOrders.filter((order) => createdIds.has(String(order.id)));

    // Mark the bargain as converted so the card stops offering it, using the
    // order id the server assigned (never a locally generated one).
    const orderByOffer = createdOrders.reduce((acc, order) => {
      const offerId = String(order.offerId || order.negotiationId || '');
      if (offerId) acc[offerId] = String(order.id);
      return acc;
    }, {});
    if (Object.keys(orderByOffer).length) {
      setNegotiations((prev) =>
        prev.map((neg) =>
          orderByOffer[neg.id] ? { ...neg, convertedToOrderId: orderByOffer[neg.id] } : neg
        )
      );
    }

    clearCart();
    return createdOrders;
  };

  // --- Real Backend Bargaining / Negotiation Management ---

  /**
   * Shared executor for every seller/customer response on a thread.
   * Persists the action to the one MongoDB document via
   * POST /api/negotiations/:id/respond, then re-reads the list so the UI always
   * shows what the database actually stored — never a local guess.
   */
  const respondToNegotiation = async (id, payload) => {
    const negotiationId = String(id || '');
    if (!/^[0-9a-fA-F]{24}$/.test(negotiationId)) {
      const message = 'This bargaining query is not a server record, so it cannot be updated.';
      setNegotiationError(message);
      return { ok: false, error: message };
    }

    // `protect` answers every session-less call with 401; say so in words the
    // shopper can act on rather than leaking the middleware's wording.
    if (!token) {
      const message = 'Please sign in to accept, decline or counter this offer.';
      setNegotiationError(message);
      return { ok: false, error: message };
    }

    let ok = true;
    let error = null;
    try {
      await api.respondToOffer(negotiationId, payload);
    } catch (err) {
      ok = false;
      // Surface the server's reason instead of silently rewriting local state
      error = err.message || 'The server rejected that action.';
    } finally {
      await refreshNegotiations();
    }
    // The re-read above clears this banner whenever it succeeds, so the
    // failure reason used to be written and then immediately erased — a
    // rejected accept/decline/counter (stale tab, double click, thread closed
    // elsewhere) looked like a click that had done nothing at all. It is
    // published after the refresh instead, so every page that renders
    // `negotiationError` now says why the action was refused, while a
    // successful action still leaves the banner cleared by the re-read.
    if (!ok) setNegotiationError(error);
    return { ok, error };
  };

  /**
   * Creates the negotiation in MongoDB via POST /api/negotiations/offer and
   * returns the saved record. No local fallback thread is fabricated: if the
   * server refuses the offer the caller receives the real error.
   */
  const submitCustomerOffer = async (product, offeredPrice) => {
    const amount = Number(offeredPrice);
    if (!product || !Number.isFinite(amount) || amount <= 0) {
      throw new Error('Please enter a valid offer amount.');
    }

    // Without a session the server can only answer 401 "Not authorized, no
    // token", so the guest is told what to do instead of seeing that raw
    // middleware string. An offer must be tied to a real buyer anyway.
    if (!token) {
      const message =
        'Please sign in with your customer account to send an offer — a bargaining query must belong to a real buyer.';
      setNegotiationError(message);
      throw new Error(message);
    }

    // POST /api/negotiations/offer is a CUSTOMER-only route (protect +
    // authorize('CUSTOMER')). The Smart Bargain call to action lives on the
    // public marketplace page, so a signed-in merchant (or an admin) can open
    // this modal like any other visitor — their offer would then be POSTed to
    // an endpoint that can only answer 403 "User role SELLER is not authorized
    // to access this route". The session role is checked here instead: the
    // authorization rule itself must stay on the server, because opening
    // /negotiations/offer to SELLER would break the role isolation the API is
    // built on.
    if (currentRole && currentRole !== 'customer') {
      const message =
        'Offers can only be sent from a customer account. Sign in with a customer account to bargain with this seller.';
      setNegotiationError(message);
      throw new Error(message);
    }

    const productId = product._id || product.id;
    if (!productId || !/^[0-9a-fA-F]{24}$/.test(String(productId))) {
      throw new Error('This listing is not connected to the server, so your offer could not be sent.');
    }

    setNegotiationError(null);
    try {
      const res = await api.createOffer({ productId: String(productId), offerPrice: amount });
      const created = normalizeNegotiation(res?.data);
      if (!created) throw new Error('The server did not return the saved offer.');
      return created;
    } catch (err) {
      setNegotiationError(err.message || 'Your offer could not be sent to the seller.');
      throw err;
    } finally {
      await refreshNegotiations();
    }
  };

  const acceptNegotiation = (id) => respondToNegotiation(id, { action: 'ACCEPT' });

  const declineNegotiation = (id) => respondToNegotiation(id, { action: 'REJECT' });

  const counterNegotiation = async (id, counterAmount) => {
    const amount = Number(counterAmount);
    if (!amount || amount <= 0) return { ok: false, error: 'Enter a valid price in ₹.' };
    return respondToNegotiation(id, { action: 'COUNTER', counterPrice: amount });
  };

  const acceptCounterOffer = (id) => respondToNegotiation(id, { action: 'ACCEPT' });

  const rejectCounterOffer = (id) => respondToNegotiation(id, { action: 'REJECT' });

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        isAuthenticated,
        token,
        authLoading,
        authError,
        login,
        register,
        logout,
        userLocation,
        setUserLocation,
        userCoordinates,
        setUserCoordinates,
        requestGeolocation,
        maxRadiusKm,
        setMaxRadiusKm,
        userProfile: currentUser || { name: 'Guest', email: '' },
        cartItems: visibleCartItems,
        addToCart,
        updateCartQuantity,
        removeCartItem,
        clearCart,
        negotiations,
        negotiationError,
        refreshNegotiations,
        submitCustomerOffer,
        acceptNegotiation,
        declineNegotiation,
        counterNegotiation,
        acceptCounterOffer,
        rejectCounterOffer,
        orders,
        ordersLoading,
        ordersError,
        refreshOrders,
        placeOrder
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
