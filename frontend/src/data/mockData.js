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
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'Hand-upholstered 3-seater sofa in premium emerald-green velvet with solid wood frame and high-resilience foam cushions. Built for Indian living rooms — sturdy legs, detachable washable covers, 5-year frame warranty.',
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
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'King size engineered-wood bed with hydraulic box storage, soft-close headboard panel and walnut laminate. Fits standard Indian mattresses (72x78 in) — free installation by our Palasia team.',
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
      'https://live.staticflickr.com/152/402173682_30e4b60f13_b.jpg'
    ],
    description: 'Set of 2 Scandinavian dining chairs with woven fabric seats, tapered solid-wood legs and ergonomic curved backrest. Wipe-clean upholstery that handles everyday family dinners with ease.',
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
      'https://live.staticflickr.com/4049/4353388318_09acf5d832_b.jpg'
    ],
    description: 'Solid Sheesham (Indian rosewood) coffee table with hand-carved lattice top and lower magazine shelf. Natural grain varies piece to piece — every table is one of a kind.',
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
      'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'Breathable mesh-back executive chair with adjustable lumbar support, 120° tilt lock, height-adjustable arms and 360° silent castors. Supports up to 120 kg — ideal for work-from-home setups.',
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
      'https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=600&auto=format&fit=crop&q=80'
    ],
    description: '2-door teak-finish wardrobe with full-height mirror, two hanging rails, four drawers and anti-tip wall anchor. Generous 6 ft height stores a full family wardrobe comfortably.',
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
      'https://live.staticflickr.com/7140/13467250735_3b386908ef_b.jpg'
    ],
    description: 'Spacious L-shape sectional in light-grey woven fabric with reversible chaise, deep seating and removable cushion covers. Modular base ships in two pieces through narrow flats and stairwells.',
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
    description: '6-seater Sheesham dining set — 1.6 m rectangular table with six high-back chairs in warm honey polish. Termite-treated hardwood, seats six comfortably for family gatherings.',
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
    description: 'Compact oak-finish study desk with overhead bookshelf, cable management cutout and a wide drawer. Designed for students — fits comfortably in a 8x10 ft bedroom.',
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
      'https://live.staticflickr.com/65535/54594292162_82324edcf5_b.jpg'
    ],
    description: 'Five-shelf engineered-wood bookshelf with warm accent lighting, anti-tip wall bracket and closed cabinet base. Holds around 150 books or a mix of decor and collectibles.',
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
    description: 'Wenge-finish TV console with brass-plate detailing, two closed cabinets and open cable slots for set-top boxes and soundbars. Supports TVs up to 70 inches and 60 kg load.',
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
      'https://live.staticflickr.com/44/110696323_07ec13b121_b.jpg'
    ],
    description: 'Space-saving 4-tier shoe rack with ventilated cubbies and a closed bottom cabinet for bags or polish. Holds 16–20 pairs and keeps apartment entrances clutter-free.',
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
      'https://cdn.stocksnap.io/img-thumbs/960w/6CA109EECC.jpg'
    ],
    description: 'Weather-resistant powder-coated steel patio set — table, four chairs and a UV-protected umbrella. Quick-dry mesh seats survive monsoons on balconies, terraces and bungalow lawns.',
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
      'https://images.unsplash.com/photo-1600166898405-da9535204843?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'Handwoven jute-blend rug with subtle checked texture in natural earth tones. Reversible, anti-skid backing safe for tiles and wooden floors — brightens living and bedroom spaces.',
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
      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&auto=format&fit=crop&q=80'
    ],
    description: 'Pack of 2 plush throw pillows with 100% cotton covers and hypoallergenic microfibre fill. Hidden zip, machine-washable covers — refresh sofas and beds in seconds.',
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
    sellerId: 'seller_2',
    sellerName: 'Sharma Furniture Gallery',
    buyerName: 'Aarav Mehta (Customer)',
    status: 'pending_seller', // 'pending_seller' | 'accepted' | 'countered' | 'rejected'
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
    sellerId: 'seller_3',
    sellerName: 'Sapna Sangeeta Home Interiors',
    buyerName: 'Aarav Mehta (Customer)',
    status: 'accepted',
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
    offeredPrice: 6200,
    sellerId: 'seller_1',
    sellerName: 'Vijay Nagar Furniture House',
    buyerName: 'Vikram Singh',
    status: 'countered',
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
