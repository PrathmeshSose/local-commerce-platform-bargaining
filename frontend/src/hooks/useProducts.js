import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MOCK_CATEGORIES } from '../data/mockData';
// One shared definition of "loadable photo" for the whole catalogue: the card
// and the detail page resolve their fallbacks with the very same rule.
import { isUsableImageUrl } from '../utils/productPhotos';

// ---------------------------------------------------------------------------
// NearDeal is a furniture-only marketplace. These are the categories the
// customer UI is allowed to render (the "All Furniture" entry is a filter
// pseudo-category, not a real room).
// ---------------------------------------------------------------------------
const FURNITURE_CATEGORIES = MOCK_CATEGORIES.filter((cat) => cat !== 'All Furniture');

// The backend `category` field is free text, so seller-created listings use a
// few short synonyms ("Dining", "Storage", "Office"). Fold them into the room
// the furniture catalog already knows about instead of dropping real pieces.
const CATEGORY_ALIASES = {
  'living room': 'Living Room',
  sofa: 'Living Room',
  sofas: 'Living Room',
  // A bare "Furniture" label is a generic listing with no room context; a
  // chair (the only record using it) is living-room stock, so it folds into
  // the room the catalog already uses for that kind of piece.
  furniture: 'Living Room',
  bedroom: 'Bedroom',
  dining: 'Dining Room',
  'dining room': 'Dining Room',
  office: 'Office Furniture',
  'office furniture': 'Office Furniture',
  outdoor: 'Outdoor Furniture',
  'outdoor furniture': 'Outdoor Furniture',
  garden: 'Outdoor Furniture',
  storage: 'Storage & Cabinets',
  'storage & cabinets': 'Storage & Cabinets',
  cabinets: 'Storage & Cabinets',
  'cabinets & storage': 'Storage & Cabinets',
  decor: 'Decor & Furnishings',
  'decor & furnishings': 'Decor & Furnishings',
  furnishing: 'Decor & Furnishings',
  furnishings: 'Decor & Furnishings'
};

/**
 * Returns one of the allowed furniture categories, or null when the listing is
 * not furniture at all — non-furniture records are never mapped into the grid.
 */
const toFurnitureCategory = (rawCategory) => {
  const key = String(rawCategory || '').trim().toLowerCase();
  if (!key) return null;
  if (CATEGORY_ALIASES[key]) return CATEGORY_ALIASES[key];
  return FURNITURE_CATEGORIES.find((cat) => cat.toLowerCase() === key) || null;
};

/**
 * Keeps only usable photos. A listing with no loadable photo still renders:
 * the product card and the detail page first try `resolveProductImages`
 * (a matching local photo) and only then fall back to the "Photo coming soon"
 * placeholder / category graphic, so the record is returned with an empty
 * images array instead of being hidden. (Returning null here made
 * seller-created listings without a photo invisible to every shopper.)
 * Returns null only when the record is not furniture at all.
 */
const toListableItem = (item) => {
  const category = toFurnitureCategory(item.category);
  if (!category) return null;
  const images = (Array.isArray(item.images) ? item.images : []).filter(isUsableImageUrl);
  return { ...item, category, images };
};

/**
 * Single de-duplication pass over the final catalog:
 * Deduplicates products by their stable MongoDB/frontend ID only so a record
 * never renders twice, while allowing different sellers to list items with
 * identical titles.
 */
const dedupeCatalog = (items) => {
  const seenIds = new Set();
  const result = [];

  for (const item of items) {
    const id = item.id || item._id;
    if (id !== undefined && id !== null && id !== '') {
      const key = String(id);
      if (seenIds.has(key)) continue;
      seenIds.add(key);
    }

    result.push(item);
  }

  return result;
};

/** Maps one backend product document onto the product-card shape. */
const mapBackendProduct = (p) =>
  toListableItem({
    id: p._id,
    _id: p._id,
    title: p.name,
    name: p.name,
    category: p.category,
    description: p.description,
    price: p.price,
    stock: p.stock,
    bargainable: !!p.isNegotiable,
    isNegotiable: !!p.isNegotiable,
    minAcceptablePrice: p.hiddenMinimumPrice || Math.round(p.price * 0.85),
    hiddenMinimumPrice: p.hiddenMinimumPrice,
    images: p.images,
    // The seller relationship is the authenticated merchant's MongoDB `_id`.
    // It is never defaulted to a frontend-only `seller_N` id — a product whose
    // seller record is missing belongs to nobody until the backend populates it.
    sellerId: typeof p.seller === 'string' ? p.seller : p.seller?._id || null,
    sellerName: p.seller?.businessName || p.seller?.name || 'Local Merchant',
    // Real merchant rating as stored on the seller document (recomputed by the
    // backend from approved reviews). `null` means "not rated yet" — the card
    // renders no star instead of inventing a score.
    rating: Number(p.seller?.rating) || 0,
    // Real great-circle distance from the listing's GeoJSON position to the
    // neighbourhood the customer is browsing.
    distanceKm: typeof p.distanceKm === 'number' ? p.distanceKm : null,
    pickupAvailable: true
  });

/**
 * The visible catalog is the backend catalog — one listing per MongoDB
 * document, mapped into the shape the product cards render. There is no local
 * product list mixed in: a fake twin of a real listing (or of a listing the
 * API failed to return) would show prices and ids that do not exist in the
 * database, and could never be bargained for.
 */
const buildCatalog = (backendProducts = []) => {
  const merged = [];

  for (const raw of backendProducts) {
    const item = mapBackendProduct(raw);
    if (item) merged.push(item);
  }

  return dedupeCatalog(merged);
};

export const useProducts = () => {
  const { userCoordinates, maxRadiusKm } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Monotonic id for fetches: only the newest one may write state. Without
  // this, a slow answer for a radius the shopper already changed away from
  // lands last and overwrites the current result set — a 20 km selection
  // could end up displaying the 2 km grid (products that a *smaller* radius
  // had shown disappearing from a larger one).
  const requestSeq = useRef(0);

  const fetchProducts = useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    setError(null);
    try {
      const coords = userCoordinates || { lat: 22.7533, lng: 75.8937 };
      const res = await api.getProducts({
        lat: coords.lat,
        lng: coords.lng,
        radius: maxRadiusKm
      });

      if (seq !== requestSeq.current) return; // stale answer: a newer fetch owns the state now
      if (res?.status === 'success' && Array.isArray(res.data)) {
        setProducts(buildCatalog(res.data));
        setError(null);
      } else {
        // A non-success answer is a real failure: show it instead of filling
        // the grid with listings that do not exist in MongoDB.
        setProducts([]);
        setError(res?.message || 'Unable to load products. Please try again.');
      }
      setLoading(false);
    } catch (err) {
      if (seq !== requestSeq.current) return; // stale failure must not hide the newer results
      console.warn('Backend product fetch notice:', err.message);
      setProducts([]);
      setError(err.message || 'Unable to reach the marketplace server. Please try again.');
      setLoading(false);
    }
  }, [userCoordinates, maxRadiusKm]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
};
