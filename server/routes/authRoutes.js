// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/register', protect, authorize(['admin']), register); // Only admin can register new users
router.post('/login', login);
router.get('/me', protect, getMe); // Get current authenticated user's details

module.exports = router;
