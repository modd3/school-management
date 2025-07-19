// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { register, login, logoutUser, getMe, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');
const User = require('../models/User');

// Only admin can register new users
router.post('/register', async (req, res, next) => {
  const userCount = await User.countDocuments();
  if (userCount > 0) {
    return res.status(403).json({ message: 'Registration is closed. Please contact an admin.' });
  }
  // Set role to admin for the first user
  req.body.role = 'admin';
  return register(req, res, next);
});
router.post('/login', login);
router.post('/logout', protect, logoutUser); // Logout user, requires authentication
router.get('/me', protect, getMe); // Get current authenticated user's details
router.post('/forgotpassword', forgotPassword); // New route
router.patch('/resetpassword/:resettoken', resetPassword); // New route

module.exports = router;
