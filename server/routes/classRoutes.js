const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getStudentsInClass,
  createClass,
  updateClass,
  assignClassTeacher,
  deleteClass,
  getAllClasses,
  getClassById
} = require('../controllers/classController');

// Get all classes (admin/teacher)
router.get('/', protect, authorize(['admin', 'teacher']), getAllClasses);

// Get a single class by ID
router.get('/:classId', protect, authorize(['admin', 'teacher']), getClassById);

// Get students in a class (admin/teacher)
router.get('/:classId/students', protect, authorize(['teacher', 'admin']), getStudentsInClass);

// Create a class (admin only)
router.post('/', protect, authorize(['admin']), createClass);

// Update a class (admin only)
router.put('/:classId', protect, authorize(['admin']), updateClass);

// Assign a class teacher (admin only)
router.post('/:classId/assign-teacher', protect, authorize(['admin']), assignClassTeacher);

// Delete a class (admin only)
router.delete('/:classId', protect, authorize(['admin']), deleteClass);

module.exports = router;
