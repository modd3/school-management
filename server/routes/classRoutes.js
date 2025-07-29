// server/routes/classRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware'); // Your auth middleware

const {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  assignClassTeacher, // Assuming this is here
  getStudentsInClass // Assuming this is here
} = require('../controllers/classController'); // Your class controller

// Admin-only routes for managing classes
router.route('/')
  .get(protect, authorize('admin'), getAllClasses) // Admin can get all classes
  .post(protect, authorize('admin'), createClass); // Admin can create classes

router.route('/:id')
  .get(protect, authorize('admin', 'teacher'), getClassById) // Admin and teachers might need to view a single class
  .put(protect, authorize('admin'), updateClass) // Only admin can update
  .delete(protect, authorize('admin'), deleteClass); // Only admin can delete

// Specific actions
router.put('/:classId/assign-teacher', protect, authorize('admin'), assignClassTeacher); // Only admin can assign teacher
router.get('/:classId/students', protect, authorize('admin', 'teacher'), getStudentsInClass); // Admin and teachers can get students in a class


module.exports = router;
