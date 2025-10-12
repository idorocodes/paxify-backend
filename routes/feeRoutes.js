const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const feeController = require('../controllers/feeController');

// Public routes (no authentication required)
router.get('/', feeController.getAllFees);
router.get('/:id', feeController.getFeeDetails);

module.exports = router;