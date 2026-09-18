const Negotiation = require('../models/Negotiation');
const Product = require('../models/Product');

const createOffer = async (req, res, next) => {
  try {
    const { productId, offerPrice } = req.body;
    
    if (offerPrice <= 0) {
      return res.status(400).json({ status: 'error', message: 'Offer price must be greater than zero' });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ status: 'error', message: 'Product not found' });
    if (!product.isNegotiable) return res.status(400).json({ status: 'error', message: 'This product is not open for negotiation' });
    
    // FIX 1: Cannot offer on own product
    if (product.seller.toString() === req.user.id) {
      return res.status(400).json({ status: 'error', message: 'You cannot make an offer on your own product' });
    }

    // FIX 2: Prevent multiple active negotiations for same product by same customer
    const existingNegotiation = await Negotiation.findOne({
      product: productId,
      customer: req.user.id,
      status: { $in: ['PENDING', 'COUNTERED', 'ACCEPTED'] }
    });
    
    if (existingNegotiation) {
      return res.status(400).json({ status: 'error', message: 'You already have an active negotiation for this product' });
    }

    let status = 'PENDING';
    let lastActionBy = 'CUSTOMER';
    
    if (product.hiddenMinimumPrice && offerPrice < product.hiddenMinimumPrice) {
      status = 'REJECTED';
      lastActionBy = 'SYSTEM';
    }

    const negotiation = await Negotiation.create({
      product: productId, customer: req.user.id, seller: product.seller, currentOfferPrice: offerPrice,
      lastActionBy, status,
      history: [{ offerPrice, actionBy: 'CUSTOMER', status: 'PENDING' }]
    });

    if (status === 'REJECTED') {
      negotiation.history.push({ offerPrice, actionBy: 'SYSTEM', status: 'REJECTED' });
      await negotiation.save();
      return res.status(200).json({ status: 'success', message: 'Offer was too low and automatically rejected', data: negotiation });
    }

    res.status(201).json({ status: 'success', data: negotiation });
  } catch (error) { next(error); }
};

const respondToOffer = async (req, res, next) => {
  try {
    const { action, counterPrice } = req.body;
    const negotiation = await Negotiation.findById(req.params.id);

    if (!negotiation) return res.status(404).json({ status: 'error', message: 'Negotiation not found' });

    if (req.user.id !== negotiation.seller.toString() && req.user.id !== negotiation.customer.toString()) {
       return res.status(403).json({ status: 'error', message: 'Not authorized' });
    }

    const actionBy = req.user.id === negotiation.seller.toString() ? 'SELLER' : 'CUSTOMER';

    if (negotiation.status === 'ACCEPTED' || negotiation.status === 'REJECTED' || negotiation.status === 'EXPIRED') {
      return res.status(400).json({ status: 'error', message: 'This negotiation is already closed' });
    }

    // FIX 3: Prevent responding to your own action (e.g. Customer can't ACCEPT a PENDING offer they just made)
    if (negotiation.lastActionBy === actionBy) {
      return res.status(400).json({ status: 'error', message: 'You cannot respond to your own offer/counter' });
    }

    if (action === 'ACCEPT') {
      negotiation.status = 'ACCEPTED';
      negotiation.lastActionBy = actionBy;
    } else if (action === 'REJECT') {
      negotiation.status = 'REJECTED';
      negotiation.lastActionBy = actionBy;
    } else if (action === 'COUNTER') {
      if (!counterPrice || counterPrice <= 0) return res.status(400).json({ status: 'error', message: 'Valid counter price is required' });
      negotiation.status = 'COUNTERED';
      negotiation.currentOfferPrice = counterPrice;
      negotiation.lastActionBy = actionBy;
    } else {
      return res.status(400).json({ status: 'error', message: 'Invalid action' });
    }

    negotiation.history.push({
      offerPrice: action === 'COUNTER' ? counterPrice : negotiation.currentOfferPrice,
      actionBy, status: negotiation.status
    });

    await negotiation.save();
    res.status(200).json({ status: 'success', data: negotiation });
  } catch (error) { next(error); }
};

module.exports = { createOffer, respondToOffer };
