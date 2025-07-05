const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

const {getAllTerms} = require('../controllers/termController');

// Protect all term routes
router.use(protect);
// routes/termRoutes.js
router.get('/', protect, getAllTerms); // make it accessible to all roles

module.exports = router;