const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Common request helper that attaches JWT from localStorage
 */
// Sign-in/sign-up answer 401 for *bad credentials*, which must never be read
// as "your session died". Everything else answering 401 means the JWT this
// request carried is missing, expired or malformed.
const SESSION_ENDPOINTS = ['/auth/login', '/auth/register'];

/**
 * Fired whenever a protected request comes back 401 with a token attached.
 * AuthContext listens for it and drops the session, so the UI can never keep
 * presenting a signed-in state the backend has already rejected.
 */
const notifySessionInvalid = () => {
  try {
    window.dispatchEvent(new CustomEvent('neardeal:unauthorized'));
  } catch {
    /* non-browser environment */
  }
};

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('neardeal_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers
    });
  } catch (_networkError) {
    throw new Error('Unable to connect to server. Please ensure backend is running.');
  }

  let data;
  try {
    data = await response.json();
  } catch (_jsonErr) {
    data = null;
  }

  if (!response.ok) {
    const isSessionEndpoint = SESSION_ENDPOINTS.some((path) => endpoint.startsWith(path));
    let errorMsg = data?.message || `Request failed with status ${response.status}`;

    if (response.status === 401) {
      if (isSessionEndpoint) {
        // Wrong e-mail/password: the server's own message is the useful one.
        errorMsg = data?.message || 'Invalid email or password.';
      } else {
        // A protected call without a valid session. Never surface the raw
        // middleware string ("Not authorized, no token") — tell the user what
        // to do instead, and let AuthContext drop the dead session.
        errorMsg = 'Your session is missing, expired or no longer valid. Please sign in again.';
        if (token) notifySessionInvalid();
      }
    }

    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // --- Auth Endpoints ---
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => request('/auth/me', { method: 'GET' }),
  updateProfile: (payload) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(payload) }),

  // --- Product Endpoints ---
  // The listing endpoint filters server side, so the browser only ever sends
  // the query it actually wants: a centre point (always as a pair), the
  // radius, and whichever of the optional filters are active. Empty values are
  // left out entirely so an unset filter never becomes a real one.
  getProducts: (params = {}) => {
    const query = new URLSearchParams();
    if (params.lat !== undefined && params.lat !== null && params.lat !== '' &&
        params.lng !== undefined && params.lng !== null && params.lng !== '') {
      query.set('lat', params.lat);
      query.set('lng', params.lng);
    }
    if (params.radius !== undefined && params.radius !== null && params.radius !== '') {
      query.set('radius', params.radius);
    }
    if (params.search) query.set('search', params.search);
    if (params.category && params.category !== 'All') query.set('category', params.category);
    if (params.minPrice !== undefined && params.minPrice !== null && params.minPrice !== '') {
      query.set('minPrice', params.minPrice);
    }
    if (params.maxPrice !== undefined && params.maxPrice !== null && params.maxPrice !== '') {
      query.set('maxPrice', params.maxPrice);
    }
    if (params.minRating !== undefined && params.minRating !== null && params.minRating !== '' &&
        Number(params.minRating) > 0) {
      query.set('minRating', params.minRating);
    }
    if (params.negotiable !== undefined && params.negotiable !== null && params.negotiable !== '') {
      query.set('negotiable', params.negotiable);
    }
    if (params.sort) query.set('sort', params.sort);
    if (params.page !== undefined && params.page !== null && params.page !== '') query.set('page', params.page);
    if (params.limit !== undefined && params.limit !== null && params.limit !== '') query.set('limit', params.limit);

    return request(`/products?${query.toString()}`, { method: 'GET' });
  },

  createProduct: (payload) => request('/products', { method: 'POST', body: JSON.stringify(payload) }),
  // The merchant's own inventory, including listings that are currently
  // INACTIVE — `/mine` is the only read that never filters by status, so the
  // dashboard can show (and bring back) everything the store ever listed.
  getMyProducts: () => request('/products/mine', { method: 'GET' }),
  updateProduct: (id, payload) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  // Backend deactivates rather than drops the document (orders and
  // negotiations reference it); the listing disappears from the catalogue.
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),

  // --- Negotiation Endpoints ---
  // POST writes the deal to MongoDB; GET reads it back. The GET routes are the
  // single source of truth for both the customer and the seller — negotiation
  // state is never read from localStorage or mock data.
  createOffer: (payload) => request('/negotiations/offer', { method: 'POST', body: JSON.stringify(payload) }),
  respondToOffer: (id, payload) => request(`/negotiations/${id}/respond`, { method: 'POST', body: JSON.stringify(payload) }),
  getMyNegotiations: () => request('/negotiations/mine', { method: 'GET' }),
  getSellerNegotiations: () => request('/negotiations/seller', { method: 'GET' }),

  // --- Order Endpoints ---
  // History lives in MongoDB: `/mine` for the signed-in customer, `/seller`
  // for the merchant who has to fulfil those orders. Both are role-guarded
  // server side, so the client must ask for the one matching its session.
  checkout: (payload) => request('/orders/checkout', { method: 'POST', body: JSON.stringify(payload) }),
  getMyOrders: () => request('/orders/mine', { method: 'GET' }),
  getSellerOrders: () => request('/orders/seller', { method: 'GET' }),
  getOrderById: (id) => request(`/orders/${id}`, { method: 'GET' }),
  // Order lifecycle: the backend validates both the transition itself and that
  // this merchant owns the order, so the UI only ever offers legal moves.
  updateOrderStatus: (id, status) =>
    request(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // --- Review Endpoints ---
  // Publishing is public and only ever returns APPROVED opinions; a customer
  // writes one after proving the purchase (the server checks the order book).
  getProductReviews: (productId) => request(`/reviews/product/${productId}`, { method: 'GET' }),
  createReview: (payload) => request('/reviews', { method: 'POST', body: JSON.stringify(payload) }),

  // --- Admin Endpoints (every path is ADMIN-only server side) ---
  getAdminMetrics: () => request('/admin/metrics', { method: 'GET' }),
  getAdminUsers: () => request('/admin/users', { method: 'GET' }),
  setAdminUserStatus: (id, status) =>
    request(`/admin/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getAdminSellers: () => request('/admin/sellers', { method: 'GET' }),
  getAdminProducts: () => request('/admin/products', { method: 'GET' }),
  setAdminProductStatus: (id, status) =>
    request(`/admin/products/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getAdminOrders: () => request('/admin/orders', { method: 'GET' }),
  getAdminReviews: () => request('/admin/reviews', { method: 'GET' }),
  setAdminReviewStatus: (id, status) =>
    request(`/admin/reviews/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Health
  checkHealth: () => request('/health', { method: 'GET' })
};
