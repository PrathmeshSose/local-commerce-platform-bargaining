// ---------------------------------------------------------------------------
// NearDeal mock data — furniture-first hyperlocal marketplace (Indore)
// All prices in INR. Images are verified, stable CDN URLs (Unsplash,
// StockSnap, Flickr/Wikimedia) chosen to show real furniture.
// ---------------------------------------------------------------------------

export const MOCK_CATEGORIES = [
  'All Furniture',
  'Living Room',
  'Bedroom',
  'Dining Room',
  'Office Furniture',
  'Outdoor Furniture',
  'Storage & Cabinets',
  'Decor & Furnishings'
];

export const MOCK_SELLERS = [
  {
    id: 'seller_1',
    name: 'Vijay Nagar Furniture House',
    owner: 'Pooja Sharma',
    rating: 4.8,
    reviewsCount: 142,
    distanceKm: 1.2,
    location: '12, Scheme No. 54, Vijay Nagar, Indore, Madhya Pradesh - 452010',
    shortLocation: 'Vijay Nagar, Indore',
    phone: '+91 98260 12345',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&auto=format&fit=crop&q=80',
    verified: true,
    bargainTolerance: 'High (up to 15% discount)'
  },
  {
    id: 'seller_2',
    name: 'Sharma Furniture Gallery',
    owner: 'Rajesh Sharma',
    rating: 4.9,
    reviewsCount: 188,
    distanceKm: 2.8,
    location: 'Plot 45, Palasia Main Road, Old Palasia, Indore, Madhya Pradesh - 452001',
    shortLocation: 'Palasia, Indore',
    phone: '+91 98930 56789',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&auto=format&fit=crop&q=80',
    verified: true,
    bargainTolerance: 'Moderate (up to 8% discount)'
  },
  {
    id: 'seller_3',
    name: 'Sapna Sangeeta Home Interiors',
    owner: 'Ananya Patel',
    rating: 4.7,
    reviewsCount: 94,
    distanceKm: 4.1,
    location: '88, Sapna Sangeeta Road, Snehnagar, Indore, Madhya Pradesh - 452009',
    shortLocation: 'Sapna Sangeeta, Indore',
    phone: '+91 94250 98765',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1615874694520-474822394e73?w=800&auto=format&fit=crop&q=80',
    verified: true,
    bargainTolerance: 'Flexible'
  }
];

/**
 * Catalog product images — sources & licenses (Phase 1 image audit, verified 2026-10-02)
 *
 * Every URL below was HTTP-checked (200, image/jpeg) AND visually inspected so each
 * photo genuinely depicts the product it is attached to.
 *
 * - images.unsplash.com/photo-* → Unsplash License (free commercial use, no attribution
 *   required). Note: plus.unsplash.com/premium_photo-* images are intentionally excluded.
 * - live.staticflickr.com/*    → CC-licensed, verified on each photo's Flickr page:
 *     402173682  CC BY 2.0     4353388318 CC BY 2.0      13467250735 CC BY 2.0
 *     3379995693 CC BY 2.0     3380813350 CC BY 2.0      54594292162 CC BY 2.0
 *     12690958284 CC BY 2.0    110696323  CC BY-SA 2.0
 * - cdn.stocksnap.io/6CA109EECC → CC0 (public domain dedication).
 *
 * Flickr CC BY / CC BY-SA images require attribution in a credit line; adding an
 * on-page attribution UI is recommended follow-up (flagged in the Phase 1 report).
 */
export const MOCK_PRODUCTS = [
  {
    id: 'prod_1',
    title: 'Marigold 3-Seater Fabric Sofa – Emerald Green',
    category: 'Living Room',
    price: 24990,
    minAcceptablePrice: 21500, // Floor price for seller smart bargaining
    originalPrice: 29499,
    stock: 6,
    rating: 4.8,
    sellerId: 'seller_1',
    sellerName: 'Vijay Nagar Furniture House',
    distanceKm: 1.2,
    images: [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1759647020668-648cd90ddce4?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'A rich emerald-green three-seater that anchors the living room without asking you to give up comfort. The velvet covering is hand-upholstered over a solid wood frame, and the high-resilience foam cushions stay plump through years of daily family use. The sturdy legs sit firm on Indian floors.\n\n• Premium emerald-green velvet, hand-upholstered\n• Solid wood frame backed by a 5-year warranty\n• High-resilience foam cushions that hold their shape\n• Detachable, washable covers for easy upkeep',
    pickupAvailable: true,
    deliveryAvailable: true,
    bargainable: true
  },
  {
    id: 'prod_2',
    title: 'Aarav King Size Bed with Box Storage – Walnut Finish',
    category: 'Bedroom',
    price: 27990,
    minAcceptablePrice: 24500,
    originalPrice: 32999,
    stock: 4,
    rating: 4.7,
    sellerId: 'seller_2',
    sellerName: 'Sharma Furniture Gallery',
    distanceKm: 2.8,
    images: [
      'https://images.unsplash.com/photo-1768253843445-49fa5f4a801f?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1646061142491-fc141798ba14?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'The Aarav is a king-size engineered-wood bed that does three jobs in one piece: a comfortable bed, a roomy storage box and a smart headboard. Lift the mattress base on its hydraulics to reach space for extra bedding, suitcases and seasonal clothes, and let the soft-close headboard panel settle quietly at night. The warm walnut laminate blends easily into modern and traditional bedrooms alike.\n\n• Hydraulic lift-up box storage under the mattress\n• Soft-close headboard panel\n• Fits standard Indian king mattresses (72 x 78 in)\n• Free installation by the Palasia team',
    pickupAvailable: true,
    deliveryAvailable: true,
    bargainable: true
  },
  {
    id: 'prod_3',
    title: 'Nordic Upholstered Dining Chairs (Set of 2)',
    category: 'Dining Room',
    price: 11499,
    minAcceptablePrice: 9900,
    originalPrice: 13999,
    stock: 8,
    rating: 4.6,
    sellerId: 'seller_3',
    sellerName: 'Sapna Sangeeta Home Interiors',
    distanceKm: 4.1,
    images: [
      'https://live.staticflickr.com/152/402173682_30e4b60f13_b.jpg',
      'https://images.unsplash.com/photo-1758977403395-5ae10579231f?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'A pair of clean-lined Scandinavian chairs that lift an ordinary dining table. The curved backrest supports your spine through long, leisurely dinners, while the woven seat feels warmer under you than plain wood. Tapered solid-wood legs keep the silhouette light, and the wipe-clean upholstery shrugs off everyday spills — practical for homes with children.\n\n• Supplied as a set of two chairs\n• Ergonomic curved backrest\n• Wipe-clean woven upholstery\n• Tapered solid-wood legs',
    pickupAvailable: true,
    deliveryAvailable: true,
    bargainable: true
  },
  {
    id: 'prod_4',
    title: 'Sheesham Wood Coffee Table with Carved Top',
    category: 'Living Room',
    price: 7499,
    minAcceptablePrice: 6300,
    originalPrice: 8999,
    stock: 12,
    rating: 4.7,
    sellerId: 'seller_1',
    sellerName: 'Vijay Nagar Furniture House',
    distanceKm: 1.2,
    images: [
      'https://live.staticflickr.com/4049/4353388318_09acf5d832_b.jpg',
      'https://images.unsplash.com/photo-1777513538143-8525eb3943f6?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'Hand-carved in solid Sheesham, this coffee table brings traditional Indian craft into a contemporary living room. The lattice top is worked by hand, so the grain and pattern of every table are slightly different — yours will be one of a kind. A lower shelf keeps magazines and living-room essentials within reach while leaving the top clear.\n\n• Solid Sheesham (Indian rosewood) construction\n• Hand-carved lattice top\n• Lower shelf for magazines and essentials',
    pickupAvailable: true,
    deliveryAvailable: true,
    bargainable: true
  },
  {
    id: 'prod_5',
    title: 'Denver Mesh Executive Office Chair – Full Recline',
    category: 'Office Furniture',
    price: 8999,
    minAcceptablePrice: 7650,
    originalPrice: 11499,
    stock: 10,
    rating: 4.5,
    sellerId: 'seller_2',
    sellerName: 'Sharma Furniture Gallery',
    distanceKm: 2.8,
    images: [
      'https://images.unsplash.com/photo-1748721566880-9e8636f3e5c6?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'Built for the long workday, at the office or in a work-from-home setup, the Denver keeps your back supported and your body cool. The breathable mesh back lets air circulate through hours at the desk, and the adjustable lumbar pad sits exactly where your lower back needs it. Recline to 120° and lock it, raise the armrests to keyboard height, then glide across the floor on silent castors.\n\n• Breathable mesh back with adjustable lumbar support\n• 120° tilt lock and height-adjustable arms\n• 360° silent castors\n• Supports up to 120 kg',
    pickupAvailable: true,
    deliveryAvailable: false,
    bargainable: true
  },
  {
    id: 'prod_6',
    title: 'Vaastu 2-Door Wardrobe with Mirror – Teak Finish',
    category: 'Bedroom',
    price: 23990,
    minAcceptablePrice: 20500,
    originalPrice: 27999,
    stock: 3,
    rating: 4.8,
    sellerId: 'seller_3',
    sellerName: 'Sapna Sangeeta Home Interiors',
    distanceKm: 4.1,
    images: [
      'https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1722349674028-a148f4364e43?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'The Vaastu keeps a whole family wardrobe in one tidy place. Two roomy doors open onto a pair of hanging rails for shirts, kurtas and sarees, while four drawers swallow folded clothes, linen and accessories. A full-height mirror on the door saves hunting for one elsewhere, and the anti-tip wall anchor keeps the tall teak-finish unit steady.\n\n• Full-height mirror on the door\n• Two hanging rails and four drawers\n• 6 ft height holds a full family wardrobe\n• Anti-tip wall anchor for safety',
    pickupAvailable: true,
    deliveryAvailable: true,
    bargainable: true
  },
  {
    id: 'prod_7',
    title: 'Oslo L-Shape Sectional Sofa – Light Grey',
    category: 'Living Room',
    price: 38990,
    minAcceptablePrice: 34000,
    originalPrice: 45999,
    stock: 2,
    rating: 4.9,
    sellerId: 'seller_1',
    sellerName: 'Vijay Nagar Furniture House',
    distanceKm: 1.2,
    images: [
      'https://live.staticflickr.com/7140/13467250735_3b386908ef_b.jpg',
      'https://images.unsplash.com/photo-1759722665621-7ae933accb69?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'The Oslo L-shape sectional turns an unused corner into the most-seated place in the house. Deep cushions invite you to stretch out along the chaise, and the chaise itself moves to either side to match your room. The light-grey woven fabric sits quietly with almost any colour scheme, and removable covers keep the sectional looking fresh.\n\n• Reversible chaise — left or right configuration\n• Deep, lounge-style seating\n• Removable cushion covers\n• Modular base ships in two pieces for narrow flats and stairwells',
    pickupAvailable: true,
    deliveryAvailable: true,
    bargainable: true
  },
  {
    id: 'prod_8',
    title: 'Rajasthan 6-Seater Dining Table Set – Sheesham Wood',
    category: 'Dining Room',
    price: 32500,
    minAcceptablePrice: 28500,
    originalPrice: 38000,
    stock: 5,
    rating: 4.8,
    sellerId: 'seller_2',
    sellerName: 'Sharma Furniture Gallery',
    distanceKm: 2.8,
    images: [
      'https://live.staticflickr.com/3562/3379995693_33a488895b_b.jpg',
      'https://live.staticflickr.com/3449/3380813350_c78483fda9_b.jpg'
    ],
    description: 'Festivals, Sunday lunches and everyday homework all sit comfortably on this table. The Rajasthan set pairs a 1.6 m rectangular Sheesham table with six high-back chairs, finished in a warm honey polish that shows off the wood grain. The hardwood is termite-treated, so the set stays solid through years of family gatherings.\n\n• Seats six comfortably\n• 1.6 m rectangular Sheesham table with six high-back chairs\n• Termite-treated hardwood\n• Warm honey polish',
    pickupAvailable: true,
    deliveryAvailable: true,
    bargainable: true
  },
  {
    id: 'prod_9',
    title: 'Study Table with Bookshelf – Oak Finish',
    category: 'Office Furniture',
    price: 9999,
    minAcceptablePrice: 8500,
    originalPrice: 12499,
    stock: 7,
    rating: 4.6,
    sellerId: 'seller_3',
    sellerName: 'Sapna Sangeeta Home Interiors',
    distanceKm: 4.1,
    images: [
      'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'Everything a student needs sits within easy reach. The overhead bookshelf keeps textbooks and reference copies above eye level, the wide drawer swallows notebooks and stationery, and the cable cutout stops a laptop or lamp lead from tangling across the desk. The compact oak-finish body sits comfortably in an 8 x 10 ft bedroom without crowding the bed.\n\n• Overhead bookshelf for textbooks and reference books\n• Wide stationery drawer\n• Cable management cutout\n• Compact footprint fits an 8 x 10 ft bedroom',
    pickupAvailable: true,
    deliveryAvailable: true,
    bargainable: true
  },
  {
    id: 'prod_10',
    title: 'Floor-to-Ceiling Bookshelf (5 Shelves)',
    category: 'Storage & Cabinets',
    price: 9499,
    minAcceptablePrice: 8100,
    originalPrice: 11299,
    stock: 6,
    rating: 4.7,
    sellerId: 'seller_1',
    sellerName: 'Vijay Nagar Furniture House',
    distanceKm: 1.2,
    images: [
      'https://live.staticflickr.com/65535/54594292162_82324edcf5_b.jpg',
      'https://images.unsplash.com/photo-1594620302200-9a762244a156?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'Five engineered-wood shelves take an empty wall and turn it into a small library. Warm accent lighting shows off books, decor and collectibles in the evening, while the closed cabinet base at the bottom hides whatever you would rather not display. The anti-tip wall bracket keeps the tall unit secure — a sensible detail in homes with children.\n\n• Five spacious shelves — holds around 150 books\n• Warm accent lighting\n• Closed cabinet base for hidden storage\n• Anti-tip wall bracket supplied',
    pickupAvailable: true,
    deliveryAvailable: true,
    bargainable: true
  },
  {
    id: 'prod_11',
    title: 'Wenge TV Entertainment Unit – Fits up to 70 inch',
    category: 'Living Room',
    price: 12750,
    minAcceptablePrice: 10900,
    originalPrice: 15499,
    stock: 4,
    rating: 4.5,
    sellerId: 'seller_2',
    sellerName: 'Sharma Furniture Gallery',
    distanceKm: 2.8,
    images: [
      'https://live.staticflickr.com/7416/12690958284_9c45ce2eda_b.jpg'
    ],
    description: 'A dark wenge-finish console that makes the television wall look considered rather than temporary. Brass-plate detailing lifts the finish, two closed cabinets hide remotes, cables and games, and open slots let the set-top box and soundbar breathe while keeping leads tidy. It holds televisions up to 70 inches and a 60 kg load.\n\n• Fits TVs up to 70 inches (60 kg load)\n• Two closed cabinets for clutter\n• Open cable slots for set-top boxes and soundbars\n• Brass-plate detailing on a wenge finish',
    pickupAvailable: true,
    deliveryAvailable: true,
    bargainable: true
  },
  {
    id: 'prod_12',
    title: '4-Tier Shoe Rack with Closed Cabinet',
    category: 'Storage & Cabinets',
    price: 4299,
    minAcceptablePrice: 3650,
    originalPrice: 5199,
    stock: 15,
    rating: 4.4,
    sellerId: 'seller_2',
    sellerName: 'Sharma Furniture Gallery',
    distanceKm: 2.8,
    images: [
      'https://live.staticflickr.com/44/110696323_07ec13b121_b.jpg',
      'https://images.unsplash.com/photo-1786396798387-f1eb58ab4d15?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'No more morning scramble for matching shoes. Four ventilated tiers hold 16 to 20 pairs at a height you can scan in a second, and the closed cabinet at the bottom takes bags, shoe polish and the pair you would rather not see. The slim profile suits the narrow entrances of city apartments.\n\n• Four ventilated tiers for 16 to 20 pairs\n• Closed bottom cabinet for bags and polish\n• Slim, space-saving profile for apartment entrances',
    pickupAvailable: true,
    deliveryAvailable: false,
    bargainable: true
  },
  {
    id: 'prod_13',
    title: '4-Seater Patio Dining Set with Umbrella',
    category: 'Outdoor Furniture',
    price: 18999,
    minAcceptablePrice: 16400,
    originalPrice: 22999,
    stock: 3,
    rating: 4.6,
    sellerId: 'seller_1',
    sellerName: 'Vijay Nagar Furniture House',
    distanceKm: 1.2,
    images: [
      'https://cdn.stocksnap.io/img-thumbs/960w/6CA109EECC.jpg',
      'https://images.unsplash.com/photo-1783529358183-0803db278660?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'Morning chai on the balcony, long Sunday breakfasts on the terrace — this four-seater set handles both. The powder-coated steel frame resists rust and rain, the quick-dry mesh seats drain soon after rainfall, and the UV-protected umbrella keeps the harsh afternoon sun off the table — one complete set for open-air dining.\n\n• Table, four chairs and a UV-protected umbrella\n• Weather-resistant powder-coated steel frame\n• Quick-dry mesh seating\n• Suits balconies, terraces and bungalow lawns',
    pickupAvailable: true,
    deliveryAvailable: true,
    bargainable: true
  },
  {
    id: 'prod_14',
    title: 'Handwoven Jute Blend Area Rug (5 x 7 ft)',
    category: 'Decor & Furnishings',
    price: 3499,
    minAcceptablePrice: 2950,
    originalPrice: 4299,
    stock: 20,
    rating: 4.7,
    sellerId: 'seller_3',
    sellerName: 'Sapna Sangeeta Home Interiors',
    distanceKm: 4.1,
    images: [
      'https://images.unsplash.com/photo-1600166898405-da9535204843?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1778088442792-29c430a4c93f?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'A handwoven jute-blend rug in quiet earth tones that warms up cold tile without demanding attention. The subtle checked texture adds depth underfoot, and because the rug is reversible you can simply turn it over when one side begins to show wear. An anti-skid backing keeps it steady on tiles and wooden floors, so it works equally well in the living room and the bedroom.\n\n• Handwoven jute blend, 5 x 7 ft\n• Reversible for longer wear\n• Anti-skid backing safe on tiles and wood\n• Natural earth tones that suit any room',
    pickupAvailable: true,
    deliveryAvailable: true,
    bargainable: true
  },
  {
    id: 'prod_15',
    title: 'Premium Cotton Throw Pillow – Pack of 2',
    category: 'Decor & Furnishings',
    price: 1499,
    minAcceptablePrice: 1250,
    originalPrice: 1899,
    stock: 30,
    rating: 4.5,
    sellerId: 'seller_3',
    sellerName: 'Sapna Sangeeta Home Interiors',
    distanceKm: 4.1,
    images: [
      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1553114552-c4ece3a33c93?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'Two soft cushions that refresh a room in seconds. Each pillow pairs a 100% cotton cover with a plush, hypoallergenic microfibre fill, so they stay comfortable behind a tired back and kind to sensitive skin. The hidden zip lets you strip the covers straight into the washing machine, and since they come as a pair, one can live on the sofa and one on the bed.\n\n• Pack of two cushions\n• 100% cotton covers with a hidden zip\n• Hypoallergenic microfibre fill\n• Machine-washable covers',
    pickupAvailable: true,
    deliveryAvailable: true,
    bargainable: false
  }
];

export const MOCK_USERS = [
  {
    id: 'user_1',
    name: 'Aarav Mehta',
    email: 'aarav.mehta@example.com',
    role: 'customer', // 'customer' | 'seller'
    status: 'active' // 'active' | 'suspended' | 'pending'
  },
  {
    id: 'user_2',
    name: 'Vikram Singh',
    email: 'vikram.singh@example.com',
    role: 'customer',
    status: 'suspended'
  },
  {
    id: 'user_3',
    name: 'Neha Patel',
    email: 'neha.patel@example.com',
    role: 'seller',
    status: 'pending'
  },
  {
    id: 'user_4',
    name: 'Rohit Sharma',
    email: 'rohit.sharma@example.com',
    role: 'seller',
    status: 'active'
  },
  {
    id: 'user_5',
    name: 'Priya Desai',
    email: 'priya.desai@example.com',
    role: 'customer',
    status: 'active'
  }
];

export const MOCK_REVIEWS = [
  {
    id: 'rev_1',
    rating: 4.5,
    sellerId: 'seller_1',
    productId: 'prod_1',
    comment: 'The emerald sofa looks even better in person — delivery team assembled it in 20 minutes.',
    status: 'approved'
  },
  {
    id: 'rev_2',
    rating: 4.0,
    sellerId: 'seller_2',
    productId: 'prod_2',
    comment: 'Sturdy bed with useful storage. Mattress could use a slightly softer base.',
    status: 'pending'
  },
  {
    id: 'rev_3',
    rating: 5.0,
    sellerId: 'seller_3',
    productId: 'prod_3',
    comment: 'Beautiful dining chairs, finish is flawless. Bargained a little and they agreed.',
    status: 'approved'
  },
  {
    id: 'rev_4',
    rating: 3.5,
    sellerId: 'seller_1',
    productId: 'prod_4',
    comment: 'Lovely carving, but polish shade was slightly darker than the photo.',
    status: 'rejected'
  },
  {
    id: 'rev_5',
    rating: 4.8,
    sellerId: 'seller_2',
    productId: 'prod_5',
    comment: 'Office chair is genuinely comfortable for 8-hour workdays. Great lumbar support.',
    status: 'approved'
  }
];


export const MOCK_NEGOTIATIONS = [
  { id: 'neg_101',
    productId: 'prod_2',
    productTitle: 'Aarav King Size Bed with Box Storage – Walnut Finish',
    productImage: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=300&auto=format&fit=crop&q=80',
    originalPrice: 27990,
    offeredPrice: 25000,
    counterPrice: null,
    agreedPrice: null,
    sellerId: 'seller_2',
    sellerName: 'Sharma Furniture Gallery',
    buyerName: 'Aarav Mehta (Customer)',
    buyerEmail: 'customer@neardeal.local',
    // Query model: pending_seller | pending_customer | accepted | declined | closed
    status: 'pending_seller',
    createdAt: '2026-09-28T09:50:00.000Z',
    expiresInHours: 12,
    sellerCommissionAmount: 500, // 2% of ₹25,000 platform fee from seller
    history: [
      { sender: 'customer', amount: 25000, note: 'Can pick up from Palasia store this weekend — paying by UPI.', time: '10 mins ago' }
    ]
  },
  {
    id: 'neg_102',
    productId: 'prod_3',
    productTitle: 'Nordic Upholstered Dining Chairs (Set of 2)',
    productImage: 'https://live.staticflickr.com/152/402173682_30e4b60f13_b.jpg',
    originalPrice: 11499,
    offeredPrice: 10499,
    counterPrice: 10499, // seller's counter that the customer accepted
    agreedPrice: 10499, // accepted deal — the price the customer may buy at
    sellerId: 'seller_3',
    sellerName: 'Sapna Sangeeta Home Interiors',
    buyerName: 'Aarav Mehta (Customer)',
    buyerEmail: 'customer@neardeal.local',
    status: 'accepted',
    createdAt: '2026-09-27T10:00:00.000Z',
    expiresInHours: 24,
    sellerCommissionAmount: 209.98, // 2% of ₹10,499
    history: [
      { sender: 'customer', amount: 9800, note: 'Would you consider ₹9,800 for self-pickup?', time: '2 hours ago' },
      { sender: 'seller', amount: 10499, note: 'Best we can do on this pair is ₹10,499 — fabric is imported.', time: '1 hour ago' },
      { sender: 'customer', amount: 10499, note: 'Deal accepted! Will pick up tomorrow.', time: '45 mins ago' }
    ]
  },
  {
    id: 'neg_103',
    productId: 'prod_4',
    productTitle: 'Sheesham Wood Coffee Table with Carved Top',
    productImage: 'https://live.staticflickr.com/4049/4353388318_09acf5d832_b.jpg',
    originalPrice: 7499,
    offeredPrice: 6200, // customer's offer (kept intact when the seller counters)
    counterPrice: 6600, // seller's counter — waiting for the customer
    agreedPrice: null,
    sellerId: 'seller_1',
    sellerName: 'Vijay Nagar Furniture House',
    buyerName: 'Vikram Singh',
    status: 'pending_customer',
    createdAt: '2026-09-26T15:20:00.000Z',
    expiresInHours: 6,
    sellerCommissionAmount: 132, // 2% of ₹6,600 (countered)
    history: [
      { sender: 'customer', amount: 6200, note: 'Buying it with a bookshelf, so please adjust the price.', time: 'Yesterday' },
      { sender: 'seller', amount: 6600, note: 'Solid Sheesham, hand-carved — lowest I can go is ₹6,600.', time: 'Yesterday' }
    ]
  }
];

export const MOCK_ORDERS = [
  {
    id: 'ord_901',
    date: '2026-09-17',
    sellerName: 'Vijay Nagar Furniture House',
    items: [
      { title: 'Sheesham Wood Coffee Table with Carved Top', quantity: 1, unitPrice: 6600, negotiated: true },
      { title: 'Floor-to-Ceiling Bookshelf (5 Shelves)', quantity: 1, unitPrice: 9499, negotiated: false }
    ],
    totalAmount: 16099,
    platformCommission: 321.98, // 2% of ₹16,099 borne by seller
    fulfillmentType: 'Store Pickup (1.2 km - Vijay Nagar)',
    status: 'Ready for Pickup',
    paymentStatus: 'Pay on Pickup (Cash / UPI)'
  },
  {
    id: 'ord_902',
    date: '2026-09-15',
    sellerName: 'Sapna Sangeeta Home Interiors',
    items: [
      { title: 'Handwoven Jute Blend Area Rug (5 x 7 ft)', quantity: 1, unitPrice: 3499, negotiated: false }
    ],
    totalAmount: 3499,
    platformCommission: 69.98, // 2% of ₹3,499 borne by seller
    fulfillmentType: 'Hyperlocal Delivery (Sapna Sangeeta)',
    status: 'Delivered',
    paymentStatus: 'Completed via UPI'
  }
];

export const MOCK_ADMIN_METRICS = {
  totalGrossVolume: 12850000,
  totalPlatformCommission: 257000, // 2% revenue from sellers
  activeLocalSellers: 48,
  activeCustomers: 1280,
  totalCompletedNegotiations: 412,
  averageDiscountRate: '11.8%'
};
