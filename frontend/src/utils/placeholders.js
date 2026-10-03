/**
 * Local, category-specific placeholders for listings without a usable photo.
 *
 * Served from `frontend/public` — no network request is involved, so a
 * missing or broken listing photo resolves to a stable category graphic
 * instead of a browser broken-image icon or (worse) another product's photo.
 */

const PLACEHOLDER_FILE = {
  'Living Room': 'living-room',
  Bedroom: 'bedroom',
  'Dining Room': 'dining-room',
  'Office Furniture': 'office-furniture',
  'Outdoor Furniture': 'outdoor-furniture',
  'Storage & Cabinets': 'storage-cabinets',
  'Decor & Furnishings': 'decor-furnishings',
};

// Short category names that older records may still carry.
const LEGACY_ALIASES = {
  Living: 'Living Room',
  Dining: 'Dining Room',
  Office: 'Office Furniture',
  Storage: 'Storage & Cabinets',
  Outdoor: 'Outdoor Furniture',
  Decor: 'Decor & Furnishings',
};

/**
 * Returns the local placeholder image path for a product category.
 * Unknown or missing categories fall back to the generic furniture graphic.
 */
export const categoryPlaceholder = (category) => {
  const raw = typeof category === 'string' ? category.trim() : '';
  const canonical = PLACEHOLDER_FILE[raw] ? raw : LEGACY_ALIASES[raw];
  const file = PLACEHOLDER_FILE[canonical] || 'furniture';
  return `/img/placeholders/${file}.svg`;
};

export default categoryPlaceholder;
