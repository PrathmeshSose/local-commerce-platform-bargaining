const express = require('express');
const router = express.Router();
const { createOffer, respondToOffer } = require('../controllers/negotiationController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/offer', protect, authorize('CUSTOMER'), createOffer);
router.post('/:id/respond', protect, respondToOffer);

module.exports = router;
