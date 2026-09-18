const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
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
    product: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Product',
    },
    negotiation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Negotiation',
    },
    finalAgreedPrice: {
      type: Number,
      required: true,
    },
    platformCommission: {
      type: Number,
      required: true,
      // Always 2% of finalAgreedPrice
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'PROCESSING', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
    },
    paymentMethod: {
      type: String,
      default: 'CASH_ON_DELIVERY', // Or STRIPE, etc.
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
