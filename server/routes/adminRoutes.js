// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { publishTermResults } = require('../controllers/reportCardController');
// Add other admin controllers (users, classes, subjects, terms etc.)

router.use(protect);
router.use(authorize(['admin'])); // Only admins can access these routes

// Report card / Publishing
router.post('/reports/publish-term-results/:termId', publishTermResults);
// ... other admin routes for CRUD operations on Student, Teacher, Class, Subject, Term

module.exports = router;

