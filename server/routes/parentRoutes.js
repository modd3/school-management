// server/routes/parentRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware'); // Your auth middleware

const {
  createParent,
  getAllParents,
  getParentById,
  updateParent,
  deleteParent,
} = require('../controllers/parentController'); // Your parent controller

// Admin-only routes for managing parents
router.route('/')
  .post(protect, authorize('admin'), createParent) // Admin can create parents
  .get(protect, authorize('admin'), getAllParents); // Admin can get all parents

router.route('/:id')
  .get(protect, authorize('admin', 'parent'), getParentById) // Admin and parent can view their own profile
  .put(protect, authorize('admin', 'parent'), updateParent) // Admin and parent can update their own profile
  .delete(protect, authorize('admin'), deleteParent); // Only admin can delete




module.exports = router;
