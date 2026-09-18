const Order = require('../models/Order');
const Product = require('../models/Product');
const Negotiation = require('../models/Negotiation');

const createOrder = async (req, res, next) => {
  try {
    const { productId, negotiationId, paymentMethod } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ status: 'error', message: 'Product not found' });
    
    // FIX 1: Prevent sellers from buying their own products
    if (product.seller.toString() === req.user.id) {
       return res.status(400).json({ status: 'error', message: 'You cannot purchase your own product' });
    }

    let finalPrice = product.price;

    if (negotiationId) {
      const negotiation = await Negotiation.findById(negotiationId);
      if (!negotiation) return res.status(404).json({ status: 'error', message: 'Negotiation not found' });
      
      // FIX 2: Prevent someone else from hijacking the negotiation checkout
      if (negotiation.customer.toString() !== req.user.id) {
         return res.status(403).json({ status: 'error', message: 'This negotiation does not belong to you' });
      }
      
      if (negotiation.status !== 'ACCEPTED') return res.status(400).json({ status: 'error', message: 'Negotiation is not accepted yet' });
      finalPrice = negotiation.currentOfferPrice;
    }

    // FIX 3: Atomic stock update to prevent Race Conditions (Overselling)
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: productId, stock: { $gte: 1 } },
      { $inc: { stock: -1 } },
      { new: true }
    );

    if (!updatedProduct) {
       return res.status(400).json({ status: 'error', message: 'Product is out of stock or unavailable' });
    }

    if (updatedProduct.stock === 0) {
       updatedProduct.status = 'INACTIVE';
       await updatedProduct.save();
    }

    const platformCommission = parseFloat((finalPrice * 0.02).toFixed(2));

    const order = await Order.create({
      customer: req.user.id,
      seller: updatedProduct.seller,
      product: productId,
      negotiation: negotiationId || undefined,
      finalAgreedPrice: finalPrice,
      platformCommission,
      paymentMethod,
      status: paymentMethod === 'ONLINE' ? 'PENDING' : 'PAID',
    });

    res.status(201).json({ status: 'success', data: order });
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrder };
