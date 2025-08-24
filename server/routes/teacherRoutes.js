// routes/teacherRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    enterMarks,
    getStudentTermReport, // Use the existing, now flexible, controller
} = require('../controllers/resultController');
const { getMySubjects } = require('../controllers/teacherController');
const { getAllStudents } = require('../controllers/studentController');
const { getAllSubjects } = require('../controllers/subjectController');
const { getAllClasses } = require('../controllers/classController');
const { getResultsByTeacher, getClassTermResults, // Corrected from getClassExamResults
  getClassFinalReports } = require('../controllers/resultController');
const { verifyClassTeacher } = require('../middleware/classTeacherAuth');
const Class = require('../models/Class');

// Protect all teacher routes
router.use(protect);
router.use(authorize(['teacher']));

// Enter marks for a student
router.post('/results/enter', enterMarks);

router.get('/my-subjects', getMySubjects);

// Get all results entered by the logged-in teacher
router.get('/results/entered-by-me', getResultsByTeacher);

// Corrected route to use academicYear/term and existing controller
router.get('/class-results/:classId/:academicYear/:term',
  getClassTermResults
);

// Corrected route to use academicYear/term
router.get('/class-final-reports/:classId/:academicYear/:term', 
  getClassFinalReports
);

router.get('/student-report/:studentId/:academicYear/:term', getStudentTermReport);

// GET /api/classes/my-class
router.get('/my-class', protect, async (req, res) => {
  try {
  
    if (req.user.role !== 'teacher' || req.user.profile.teacherType !== 'class_teacher') {
      return res.status(403).json({ message: 'Not authorized as class teacher' });
    }

    // Find the teacher's assigned class
    const myClass = await Class.findOne({ classTeacher: req.user._id }) // classTeacher references User model
      .populate('classTeacher', 'firstName lastName')
      .lean();
      

    if (!myClass) {
      return res.status(404).json({ message: 'No assigned class found' });
    }

    res.json({ classes: [myClass] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


// Allow both teachers and admins to access
router.get('/students', authorize(['teacher']),getAllStudents);
router.get('/subjects', authorize(['teacher']),getAllSubjects);
router.get('/classes', authorize(['teacher']),getAllClasses);

module.exports = router;
