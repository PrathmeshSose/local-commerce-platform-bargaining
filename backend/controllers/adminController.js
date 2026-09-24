const Order = require('../models/Order');
const User = require('../models/User');

// @desc    Get all transactions/orders (for platform analytics)
// @route   GET /api/admin/transactions
// @access  Private/Admin
const getTransactions = async (req, res, next) => {
  try {
    const orders = await Order.find({})
      .populate('customer', 'name email')
      .populate('seller', 'name businessName')
      .populate('product', 'name price')
      .sort('-createdAt');
      
    // Calculate total platform revenue from 2% commissions
    const totalRevenue = orders.reduce((acc, order) => acc + order.platformCommission, 0);

    res.status(200).json({
      status: 'success',
      count: orders.length,
      totalRevenue,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Suspend or Ban a user/seller
// @route   PUT /api/admin/users/:id/suspend
// @access  Private/Admin
const suspendUser = async (req, res, next) => {
  try {
    const { isSuspended } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    
    user.status = isSuspended ? 'SUSPENDED' : 'ACTIVE';
    await user.save();

    res.status(200).json({
      status: 'success',
      message: `User ${user.name} has been ${isSuspended ? 'suspended' : 'reactivated'}`,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransactions,
  suspendUser
};
