const mongoose = require('mongoose');

const negotiationSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Product',
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    currentOfferPrice: {
      type: Number,
      required: true,
    },
    lastActionBy: {
      type: String,
      enum: ['CUSTOMER', 'SELLER', 'SYSTEM'],
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'COUNTERED', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
      default: 'PENDING',
    },
    history: [
      {
        offerPrice: Number,
        actionBy: String,
        status: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Negotiation', negotiationSchema);
