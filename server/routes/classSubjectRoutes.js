const { 
  enrollStudentInSubject, 
  assignSubjectToTeacher, 
  updateAssignment, 
  deleteAssignment, 
  getSubjectsByTeacher, 
  getSubjectsByClass, 
  getStudentsInSubject 
} = require('../controllers/classSubjectController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = require('express').Router();

// Get all subjects assigned to a teacher
router.get('/teacher/:teacherId', protect, authorize(['admin', 'teacher']), getSubjectsByTeacher);

// Get all subjects assigned in a class
router.get('/class/:classId', protect, authorize(['admin', 'teacher']), getSubjectsByClass);

// Get all students enrolled in a subject
router.get('/students/:subjectId', protect, authorize(['admin', 'teacher']), getStudentsInSubject);

// Assign a subject to a teacher in a class
router.post('/assign', protect, authorize(['admin', 'teacher']), assignSubjectToTeacher);

// Enroll a student in a subject
router.post('/enroll', protect, authorize(['admin', 'teacher']), enrollStudentInSubject);

// Update a class-subject assignment
router.put('/assign/:id', protect, authorize(['admin', 'teacher']), updateAssignment);

// Delete a class-subject assignment
router.delete('/assign/:id', protect, authorize(['admin', 'teacher']), deleteAssignment);

module.exports = router;