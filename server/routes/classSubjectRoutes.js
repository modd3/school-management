// server/routes/classSubjectRoutes.js
const express = require('express');
const router = express.Router(); // Use express.Router() instead of express()
const { protect, authorize } = require('../middleware/authMiddleware'); // Your auth middleware

const {
  assignSubjectToTeacher,
  updateAssignment,
  deleteAssignment,
  getSubjectsByTeacher, // Used by Admin to get ANY teacher's subjects
  getMyClassSubjects,   // NEW: Used by a logged-in Teacher to get THEIR OWN subjects
  getSubjectsByClass,
  enrollStudentInSubject,
  getStudentsInSubject
} = require('../controllers/classSubjectController');


// --- ADMIN ROUTES (Highly restricted for management operations) ---

// Assign a subject to a teacher in a class
// Route: POST /api/class-subjects/
router.post('/', protect, authorize('admin'), assignSubjectToTeacher);

// Update an existing class-subject assignment
// Route: PUT /api/class-subjects/:id
router.put('/:id', protect, authorize('admin'), updateAssignment);

// Delete a class-subject assignment
// Route: DELETE /api/class-subjects/:id
router.delete('/:id', protect, authorize('admin'), deleteAssignment);

// Get all subjects assigned to ANY teacher (by teacherId) - Admin-only view
// Route: GET /api/class-subjects/teacher/:teacherId
router.get('/teacher/:teacherId', protect, authorize('admin'), getSubjectsByTeacher);


// --- TEACHER & ADMIN ROUTES (Data teachers need to perform their duties) ---

// Get all subjects assigned in a specific class (both admin and teachers might need this)
// Route: GET /api/class-subjects/class/:classId
router.get('/class/:classId', protect, authorize('admin', 'teacher'), getSubjectsByClass);

// Enroll a student in a subject (both admin and teachers might perform this)
// Route: POST /api/class-subjects/enroll
router.post('/enroll', protect, authorize('admin', 'teacher'), enrollStudentInSubject);

// Get all students enrolled in a specific class-subject assignment
// Route: GET /api/class-subjects/:classSubjectId/students
router.get('/:classSubjectId/students', protect, authorize('admin', 'teacher'), getStudentsInSubject);


// --- TEACHER-SPECIFIC ROUTE (for logged-in teacher to see their own data) ---

// Get all subjects assigned to the logged-in teacher (using req.user._id from protect middleware)
// Route: GET /api/class-subjects/me
router.get('/me', protect, authorize('teacher'), getMyClassSubjects);


module.exports = router;
