const express = require('express');
const router = express.Router();
const { getTransactions, suspendUser } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes in this file require ADMIN privileges
router.use(protect);
router.use(authorize('ADMIN'));

router.get('/transactions', getTransactions);
router.put('/users/:id/suspend', suspendUser);

module.exports = router;
