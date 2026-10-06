/**
 * Photo resolution for the customer-facing catalogue.
 *
 * Two rules, applied in order:
 *
 *   1. A photo the record itself carries always wins. Seller uploads and the
 *      seeded catalogue are displayed exactly as the API returns them; this
 *      module never replaces a photo that already loads.
 *   2. A listing whose `images` are empty — or only point at a reserved
 *      placeholder host that can never resolve (`example.com`, `example.invalid`,
 *      `placehold…`) — gets a real furniture photo matching the item it lists,
 *      served locally from `public/img/products`, so the browser never has to
 *      depend on a remote host to show a product picture.
 *
 * The local photos are licensed stock photography matched to each listing by
 * name/type (sources and licences: `public/img/products/CREDITS.md`). Different
 * furniture types get different photos — one shared picture is never used for
 * the whole catalogue. A listing that cannot be matched with a suitable photo
 * returns an empty array, and the card/detail page keeps showing the existing
 * "Photo coming soon" placeholder.
 *
 * Nothing here writes to MongoDB: it only decides what the browser renders for
 * a listing that has no usable photo of its own.
 */

/** Directory (served by Vite from `frontend/public`) holding the local photos. */
const PHOTO_DIR = '/img/products/';

/**
 * A product photo must be a real, loadable HTTP(S) image. Backend test/seed
 * records ship placeholder hosts (e.g. https://example.com/a.jpg or
 * https://example.invalid/x.jpg) which always fail in the browser — those are
 * rejected here so the card never has to fall back to a broken-image icon.
 */
export const isUsableImageUrl = (url) => {
  if (typeof url !== 'string' || !url.trim()) return false;
  let parsed;
  try {
    parsed = new URL(url.trim());
  } catch {
    return false;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
  const host = parsed.hostname.toLowerCase();
  if (host === 'example.com' || host.endsWith('.example.com')) return false;
  if (host === 'example.org' || host === 'example.net') return false;
  // RFC 6761 reserves `.invalid`: these names can never resolve, so a URL
  // pointing at one is a placeholder, not a photo.
  if (host === 'example.invalid' || host.endsWith('.invalid')) return false;
  if (host.includes('placeholder') || host.includes('placehold')) return false;
  return true;
};

/**
 * Listings that shipped without a photo, matched to the photo of the exact
 * piece they list. Keys are the normalised title (lower-cased, punctuation
 * collapsed, trailing test-timestamp digits stripped) — see normaliseTitle.
 */
const PHOTO_BY_TITLE = {
  'rattan lounge chair': 'rattan-lounge-chair.jpg',
  'sheesham study desk': 'study-desk.jpg',
  'disposable stool': 'wooden-stool.jpg',
  'phase5 accept desk': 'writing-desk.jpg',
  'phase5 reject chair': 'accent-chair.jpg',
  'phase5 counter shelf': 'counter-shelf.jpg',
  'qa phase4 recliner': 'leather-recliner.jpg',
  'qa phase4 bookshelf': 'bookshelf.jpg',
  'qa phase6 sofa': 'fabric-sofa.jpg',
  'qa phase6 chair': 'wooden-dining-chair.jpg',
  'qa7 nophoto shelf': 'storage-shelf.jpg',
  'qa7 brokenphoto sofa': 'grey-sofa.jpg',
  'qa7 bargain couch': 'tan-couch.jpg',
  'qa7 validation chair': 'leather-armchair.jpg',
  'teak sofa': 'teak-wooden-sofa.jpg'
};

/**
 * Last resort for a listing this module has never seen: match on an
 * unambiguous furniture type named in the title. Ordered most specific first,
 * and every rule needs the type word to be actually present — a listing whose
 * title names no type we have a verified photo for stays unmatched and keeps
 * its placeholder instead of borrowing a random picture.
 */
const PHOTO_BY_TYPE = [
  { type: /\b(recliner|reclining chair)\b/, file: 'leather-recliner.jpg' },
  { type: /\b(rattan|wicker|cane)\b/, also: /\bchair\b/, file: 'rattan-lounge-chair.jpg' },
  { type: /\bstools?\b/, file: 'wooden-stool.jpg' },
  { type: /\b(bookshelf|bookcase)\b/, file: 'bookshelf.jpg' },
  { type: /\b(shelf|shelves|shelving|rack|cubby|cubbies)\b/, file: 'storage-shelf.jpg' },
  { type: /\bdesks?\b/, file: 'writing-desk.jpg' },
  { type: /\barmchairs?\b/, file: 'leather-armchair.jpg' },
  { type: /\b(couch|sofa|settee|chesterfield)\b/, file: 'fabric-sofa.jpg' },
  { type: /\bchairs?\b/, file: 'accent-chair.jpg' }
];

/** Lower-cased, punctuation-free title with any trailing test stamp removed. */
const normaliseTitle = (title) =>
  String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    // QA/e2e records append a millisecond stamp; the listing name is what
    // remains once that trailing run of digits is gone.
    .replace(/\b\d{8,}\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * The photos to render for one product: its own usable photo(s) when it has
 * any, otherwise a matching local photo, otherwise `[]` (placeholder).
 *
 * @param {{images?: string[]|string, title?: string, name?: string}} product
 * @returns {string[]}
 */
export const resolveProductImages = (product) => {
  const raw = Array.isArray(product?.images)
    ? product.images
    : product?.images
      ? [product.images]
      : [];

  const own = raw.filter(isUsableImageUrl);
  if (own.length) return own;

  const title = normaliseTitle(product?.title || product?.name);
  if (!title) return [];

  const exact = PHOTO_BY_TITLE[title];
  if (exact) return [PHOTO_DIR + exact];

  const match = PHOTO_BY_TYPE.find(
    (rule) => rule.type.test(title) && (!rule.also || rule.also.test(title))
  );
  return match ? [PHOTO_DIR + match.file] : [];
};

export default resolveProductImages;
