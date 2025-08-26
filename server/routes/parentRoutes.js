// server/routes/parentRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize, hasPermission } = require('../middleware/authMiddleware'); // Your auth middleware

const {
  createParent,
  getAllParents,
  getParentById,
  updateParent,
  deleteParent,
} = require('../controllers/parentController'); // Your parent controller

// Attendance Management
const {
    getStudentAttendanceHistory,
} = require('../controllers/attendanceController');

// Timetable Management
const {
    getClassTimetable,
} = require('../controllers/timetableController');

// Admin-only routes for managing parents
router.route('/')
  .post(protect, authorize('admin'), hasPermission('administrative', 'canManageUsers'), createParent) // Admin can create parents
  .get(protect, authorize('admin'), hasPermission('administrative', 'canManageUsers'), getAllParents); // Admin can get all parents

router.route('/:id')
  .get(protect, authorize('admin', 'parent'), getParentById) // Admin and parent can view their own profile
  .put(protect, authorize('admin', 'parent'), updateParent) // Admin and parent can update their own profile
  .delete(protect, authorize('admin'), hasPermission('administrative', 'canManageUsers'), deleteParent); // Only admin can delete

// Attendance Management
router.get('/attendance/student/:studentId/:academicYear', protect, authorize(['parent']), getStudentAttendanceHistory);

// Timetable Management
router.get('/timetable/class/:classId/:academicYear/:termNumber', protect, authorize(['parent']), getClassTimetable);


module.exports = router;