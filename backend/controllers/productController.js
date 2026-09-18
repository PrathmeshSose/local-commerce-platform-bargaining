const Product = require('../models/Product');
const User = require('../models/User');

const createProduct = async (req, res, next) => {
  try {
    const { name, category, description, price, stock, isNegotiable, hiddenMinimumPrice, images } = req.body;
    const seller = await User.findById(req.user.id);
    if (!seller.location || !seller.location.coordinates || seller.location.coordinates.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Seller location not set. Please update profile with coordinates (lng, lat) first.' });
    }
    const product = await Product.create({
      seller: req.user.id, name, category, description, price, stock, isNegotiable,
      hiddenMinimumPrice: isNegotiable ? hiddenMinimumPrice : undefined,
      images, location: seller.location,
    });
    res.status(201).json({ status: 'success', data: product });
  } catch (error) { next(error); }
};

const getProducts = async (req, res, next) => {
  try {
    const { lat, lng, radius, category, maxPrice, negotiable } = req.query;
    
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      return res.status(400).json({ status: 'error', message: 'Valid latitude and longitude are required' });
    }

    const parsedRadius = parseFloat(radius);
    const radiusInKm = !isNaN(parsedRadius) ? Math.min(parsedRadius, 50) : 10;
    const radiusInRadians = radiusInKm / 6378.1;

    const query = {
      status: 'ACTIVE',
      stock: { $gt: 0 },
      location: {
        $geoWithin: { $centerSphere: [[parsedLng, parsedLat], radiusInRadians] },
      },
    };

    if (category) query.category = category;
    
    const parsedMaxPrice = parseFloat(maxPrice);
    if (!isNaN(parsedMaxPrice)) query.price = { $lte: parsedMaxPrice };
    
    if (negotiable === 'true') query.isNegotiable = true;

    const products = await Product.find(query).populate('seller', 'name businessName rating');
    res.status(200).json({ status: 'success', count: products.length, data: products });
  } catch (error) { next(error); }
};

module.exports = { createProduct, getProducts };
