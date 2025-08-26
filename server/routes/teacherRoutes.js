// routes/teacherRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize, hasPermission } = require('../middleware/authMiddleware');
const {
    enterOrUpdateMarks,
    bulkEnterMarks,
    getResultsByTeacher,
    getClassExamResults,
    getClassFinalReports
} = require('../controllers/resultController');
const { getMySubjects } = require('../controllers/teacherController');
const { getAllStudents } = require('../controllers/studentController');
const { getAllSubjects } = require('../controllers/subjectController');
const { getAllClasses } = require('../controllers/classController');
const { verifyClassTeacher } = require('../middleware/classTeacherAuth');
const Class = require('../models/Class');

// Progress Tracking
const {
    getStudentProgressReport,
    getClassProgressSummary,
} = require('../controllers/progressController');

// Attendance Management
const {
    markAttendance,
    getStudentAttendanceHistory,
    getClassAttendanceSummary
} = require('../controllers/attendanceController');

// Timetable Management
const {
    getClassTimetable,
    getTeacherTimetable
} = require('../controllers/timetableController');

// Protect all teacher routes
router.use(protect);
router.use(authorize(['teacher']));

// Enter marks for a student
router.post('/results', hasPermission('academic', 'canEnterResults'), enterOrUpdateMarks);
router.post('/results/bulk', hasPermission('academic', 'canEnterResults'), bulkEnterMarks);

router.get('/my-subjects', getMySubjects);

// Get all results entered by the logged-in teacher
router.get('/results/entered-by-me', hasPermission('academic', 'canViewAllResults'), getResultsByTeacher);

router.get('/class-results/:classId/:academicYear/:termNumber/:examType',
  hasPermission('academic', 'canViewAllResults'),
  getClassExamResults,
  verifyClassTeacher
);

router.get('/class-final-reports/:classId/:academicYear/:termNumber', 
  hasPermission('academic', 'canViewAllResults'),
  getClassFinalReports,
  verifyClassTeacher
);

// GET /api/classes/my-class
router.get('/my-class', protect, async (req, res) => {
  try {
  
    if (req.user.role !== 'teacher' || req.user.profile.teacherType !== 'class_teacher') {
      return res.status(403).json({ message: 'Not authorized as class teacher' });
    }

    // Find the teacher's assigned class
    const myClass = await Class.findOne({ classTeacher: req.user._id })
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
router.get('/students', hasPermission('administrative', 'canViewReports'), getAllStudents);
router.get('/subjects', hasPermission('administrative', 'canViewReports'), getAllSubjects);
router.get('/classes', hasPermission('administrative', 'canViewReports'), getAllClasses);

// Progress Tracking
router.get('/progress/student/:studentId/:academicYear', hasPermission('academic', 'canViewAllResults'), getStudentProgressReport);
router.get('/progress/class/:classId/:academicYear', hasPermission('academic', 'canViewAllResults'), getClassProgressSummary);

// Attendance Management
router.post('/attendance/mark', hasPermission('academic', 'canMarkAttendance'), markAttendance);
router.get('/attendance/student/:studentId/:academicYear', hasPermission('academic', 'canViewAttendance'), getStudentAttendanceHistory);
router.get('/attendance/class/:classId/:academicYear', hasPermission('academic', 'canViewAttendance'), getClassAttendanceSummary);

// Timetable Management
router.get('/timetable/class/:classId/:academicYear/:termNumber', hasPermission('academic', 'canViewTimetable'), getClassTimetable);
router.get('/timetable/teacher/:teacherId/:academicYear/:termNumber', hasPermission('academic', 'canViewTimetable'), getTeacherTimetable);

module.exports = router;