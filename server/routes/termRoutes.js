const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

const { getAllTerms, getCurrentTerm } = require('../controllers/termController');

// Protect all term routes
router.use(protect);

// Public term routes (for all authenticated users)
router.get('/', getAllTerms); // Get all terms
router.get('/current', getCurrentTerm); // Get current term

module.exports = router;