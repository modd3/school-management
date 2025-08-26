const express = require('express');
const router = express.Router();
const { protect, authorize, hasPermission } = require('../middleware/authMiddleware');
const {
    getStudentExamReport,
    getFinalReportCard,
    getStudentClassPosition
} = require('../controllers/resultController');

// Progress Tracking
const {
    getStudentProgressReport,
} = require('../controllers/progressController');

// Attendance Management
const {
    getStudentAttendanceHistory,
} = require('../controllers/attendanceController');

// Timetable Management
const {
    getClassTimetable,
} = require('../controllers/timetableController');

// Protect all student routes
router.use(protect);
router.use(authorize(['student']));

router.get("/report/:academicYear/:termNumber/:examType", getStudentExamReport);

router.get("/final-report/:academicYear/:termNumber", getFinalReportCard);

// Get student class position
//router.get('/class-position/:classId/:academicYear/:termNumber', getStudentClassPosition);

// Progress Tracking
router.get('/progress/:studentId/:academicYear', getStudentProgressReport);

// Attendance Management
router.get('/attendance/student/:studentId/:academicYear', getStudentAttendanceHistory);

// Timetable Management
router.get('/timetable/class/:classId/:academicYear/:termNumber', getClassTimetable);

module.exports = router;